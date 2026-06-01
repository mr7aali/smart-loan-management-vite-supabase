import { createClient, User } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./cors.ts";
import { PLAN_DETAILS, SubscriptionPlanId } from "./plans.ts";

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new HttpError(500, `Missing required secret: ${name}.`);
  }

  return value;
}

export function createUserClient(req: Request) {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");

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
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

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
      plan: planId,
      max_borrowers: plan.maxBorrowers,
      max_loans: plan.maxLoans,
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
