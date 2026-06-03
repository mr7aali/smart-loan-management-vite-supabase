import { createClient, User } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./cors.ts";
import {
  isSubscriptionPlanId,
  PLAN_DETAILS,
  SubscriptionPlanId,
} from "./plans.ts";

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new HttpError(500, `Missing required secret: ${name}.`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return Deno.env.get(name)?.trim() || null;
}

function getPublishableKey() {
  const legacyAnonKey = getOptionalEnv("SUPABASE_ANON_KEY");
  if (legacyAnonKey) {
    return legacyAnonKey;
  }

  const publishableKeys = getOptionalEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (publishableKeys) {
    try {
      const parsed = JSON.parse(publishableKeys);
      const defaultKey = parsed?.default;
      if (typeof defaultKey === "string" && defaultKey.trim()) {
        return defaultKey.trim();
      }
    } catch {
      throw new HttpError(
        500,
        "SUPABASE_PUBLISHABLE_KEYS is not valid JSON.",
      );
    }
  }

  throw new HttpError(
    500,
    "Missing Supabase publishable key. Expected SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEYS.",
  );
}

function getServiceRoleKey() {
  const legacyServiceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyServiceRoleKey) {
    return legacyServiceRoleKey;
  }

  const secretKeys = getOptionalEnv("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      const defaultKey = parsed?.default;
      if (typeof defaultKey === "string" && defaultKey.trim()) {
        return defaultKey.trim();
      }
    } catch {
      throw new HttpError(500, "SUPABASE_SECRET_KEYS is not valid JSON.");
    }
  }

  throw new HttpError(
    500,
    "Missing Supabase service key. Expected SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS.",
  );
}

export function createUserClient(req: Request) {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getPublishableKey();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });
}

export function createAdminClient() {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseServiceRoleKey = getServiceRoleKey();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireUser(req: Request): Promise<User> {
  const supabase = createUserClient(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "Unauthorized request.");
  }

  return user;
}

export async function requireAdminUser(req: Request): Promise<User> {
  const user = await requireUser(req);
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new HttpError(500, `Failed to verify admin access: ${error.message}`);
  }

  if (!profile || profile.role !== "admin") {
    throw new HttpError(403, "Admin access is required.");
  }

  if (profile.account_status !== "active") {
    throw new HttpError(403, "This admin account is not active.");
  }

  return user;
}

function getPlanLimits(planId: SubscriptionPlanId) {
  const plan = PLAN_DETAILS[planId];
  return {
    plan: planId,
    max_borrowers: plan.maxBorrowers,
    max_loans: plan.maxLoans,
  };
}

export async function syncSubscriptionForUser(
  userId: string,
  planId: SubscriptionPlanId,
) {
  const admin = createAdminClient();
  const plan = PLAN_DETAILS[planId];
  const now = new Date();
  const nowIso = now.toISOString();
  const endDate =
    planId === "free"
      ? null
      : new Date(
          new Date(nowIso).setMonth(new Date(nowIso).getMonth() + 1),
        ).toISOString();

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: planId,
        status: "active",
        billing_cycle: "monthly",
        price: plan.price,
        start_date: nowIso,
        end_date: endDate,
        updated_at: nowIso,
      },
      {
        onConflict: "user_id",
      },
    )
    .select()
    .single();

  if (subscriptionError) {
    throw new HttpError(
      500,
      `Failed to save subscription: ${subscriptionError.message}`,
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      ...getPlanLimits(planId),
      updated_at: nowIso,
    })
    .eq("id", userId);

  if (profileError) {
    throw new HttpError(
      500,
      `Failed to update profile plan: ${profileError.message}`,
    );
  }

  return subscription;
}

interface PaymentRecordInput {
  userId: string;
  orderId: string;
  captureId: string;
  planId: SubscriptionPlanId;
  amount: number;
  currency: string;
  status?: "pending" | "completed" | "failed" | "refunded";
  provider?: "paypal";
  paidAt?: string;
}

export async function savePaymentRecord({
  userId,
  orderId,
  captureId,
  planId,
  amount,
  currency,
  status = "completed",
  provider = "paypal",
  paidAt = new Date().toISOString(),
}: PaymentRecordInput) {
  if (!isSubscriptionPlanId(planId)) {
    throw new HttpError(400, "Unsupported subscription plan for payment record.");
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("payments").upsert(
    {
      user_id: userId,
      provider,
      provider_order_id: orderId,
      provider_capture_id: captureId,
      subscription_plan: planId,
      amount,
      currency,
      status,
      paid_at: paidAt,
      updated_at: nowIso,
    },
    {
      onConflict: "provider_capture_id",
    },
  );

  if (error) {
    throw new HttpError(
      500,
      `Failed to save payment record: ${error.message}`,
    );
  }
}

export async function updateUserAccessAndSubscription(options: {
  actorUserId: string;
  userId: string;
  role?: "user" | "admin";
  accountStatus?: "active" | "suspended";
  planId?: SubscriptionPlanId;
  subscriptionStatus?: "active" | "cancelled" | "expired";
  endDate?: string | null;
}) {
  const admin = createAdminClient();
  const {
    actorUserId,
    userId,
    role,
    accountStatus,
    planId,
    subscriptionStatus,
    endDate,
  } = options;

  if (actorUserId === userId && role === "user") {
    throw new HttpError(400, "You cannot remove your own admin access.");
  }

  if (actorUserId === userId && accountStatus === "suspended") {
    throw new HttpError(400, "You cannot suspend your own account.");
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileLookupError || !existingProfile) {
    throw new HttpError(
      404,
      `User profile not found: ${profileLookupError?.message ?? "missing profile"}`,
    );
  }

  const { data: existingSubscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const nextPlanId = planId ?? existingSubscription?.plan ?? existingProfile.plan;
  if (!isSubscriptionPlanId(nextPlanId)) {
    throw new HttpError(400, "Unsupported subscription plan.");
  }

  const nextPlan = PLAN_DETAILS[nextPlanId];
  const nowIso = new Date().toISOString();
  const nextEndDate =
    endDate !== undefined
      ? endDate
      : existingSubscription?.end_date ??
        (nextPlanId === "free"
          ? null
          : new Date(
              new Date(nowIso).setMonth(new Date(nowIso).getMonth() + 1),
            ).toISOString());

  const profileUpdates: Record<string, unknown> = {
    ...getPlanLimits(nextPlanId),
    updated_at: nowIso,
  };

  if (role) {
    profileUpdates.role = role;
  }

  if (accountStatus) {
    profileUpdates.account_status = accountStatus;
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update(profileUpdates)
    .eq("id", userId);

  if (profileUpdateError) {
    throw new HttpError(
      500,
      `Failed to update user profile: ${profileUpdateError.message}`,
    );
  }

  const { error: subscriptionUpdateError } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: nextPlanId,
        status: subscriptionStatus ?? existingSubscription?.status ?? "active",
        billing_cycle: existingSubscription?.billing_cycle ?? "monthly",
        price: nextPlan.price,
        start_date: existingSubscription?.start_date ?? nowIso,
        end_date: nextEndDate,
        updated_at: nowIso,
      },
      {
        onConflict: "user_id",
      },
    );

  if (subscriptionUpdateError) {
    throw new HttpError(
      500,
      `Failed to update subscription: ${subscriptionUpdateError.message}`,
    );
  }
}
