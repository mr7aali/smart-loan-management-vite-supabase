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

export async function listAllAuthUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new HttpError(500, `Failed to list auth users: ${error.message}`);
    }

    const batch = data.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function backfillAccountRecordsForAuthUsers(authUsers: User[]) {
  const admin = createAdminClient();
  const userIds = authUsers.map((user) => user.id);

  if (userIds.length === 0) {
    return;
  }

  const [{ data: existingProfiles }, { data: existingSubscriptions }] =
    await Promise.all([
      admin.from("profiles").select("id").in("id", userIds),
      admin.from("subscriptions").select("user_id").in("user_id", userIds),
    ]);

  const existingProfileIds = new Set(
    (existingProfiles ?? []).map((profile) => profile.id as string),
  );
  const existingSubscriptionIds = new Set(
    (existingSubscriptions ?? []).map(
      (subscription) => subscription.user_id as string,
    ),
  );

  const nowIso = new Date().toISOString();
  const missingProfiles = authUsers
    .filter((user) => !existingProfileIds.has(user.id))
    .map((user) => ({
      id: user.id,
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
      role: "user",
      account_status: "active",
      plan: "free",
      max_borrowers: PLAN_DETAILS.free.maxBorrowers,
      max_loans: PLAN_DETAILS.free.maxLoans,
      created_at: user.created_at ?? nowIso,
      updated_at: nowIso,
    }));

  if (missingProfiles.length > 0) {
    const { error } = await admin.from("profiles").upsert(missingProfiles, {
      onConflict: "id",
    });

    if (error) {
      throw new HttpError(
        500,
        `Failed to backfill profiles: ${error.message}`,
      );
    }
  }

  const { data: profilesAfterBackfill, error: profilesAfterBackfillError } =
    await admin
      .from("profiles")
      .select("id, email, full_name, created_at, current_organization_id")
      .in("id", userIds);

  if (profilesAfterBackfillError) {
    throw new HttpError(
      500,
      `Failed to load profile workspaces: ${profilesAfterBackfillError.message}`,
    );
  }

  const profilesNeedingOrganizations = (profilesAfterBackfill ?? []).filter(
    (profile) => !profile.current_organization_id,
  );

  if (profilesNeedingOrganizations.length > 0) {
    const { data: createdOrganizations, error: organizationError } =
      await admin
        .from("organizations")
        .insert(
          profilesNeedingOrganizations.map((profile) => ({
            owner_id: profile.id,
            name: `${
              profile.full_name || profile.email || "Workspace"
            } Workspace`,
            created_at: profile.created_at ?? nowIso,
            updated_at: nowIso,
          })),
        )
        .select("id, owner_id");

    if (organizationError) {
      throw new HttpError(
        500,
        `Failed to create user workspaces: ${organizationError.message}`,
      );
    }

    await Promise.all(
      (createdOrganizations ?? []).map((organization) =>
        admin
          .from("profiles")
          .update({
            current_organization_id: organization.id,
            updated_at: nowIso,
          })
          .eq("id", organization.owner_id),
      ),
    );
  }

  const { data: workspaceProfiles, error: workspaceProfilesError } =
    await admin
      .from("profiles")
      .select("id, created_at, current_organization_id")
      .in("id", userIds);

  if (workspaceProfilesError) {
    throw new HttpError(
      500,
      `Failed to reload user workspaces: ${workspaceProfilesError.message}`,
    );
  }

  const profilesWithWorkspaces = (workspaceProfiles ?? []).filter(
    (profile) => profile.current_organization_id,
  );

  if (profilesWithWorkspaces.length > 0) {
    const { error: membersError } = await admin
      .from("organization_members")
      .upsert(
        profilesWithWorkspaces.map((profile) => ({
          organization_id: profile.current_organization_id,
          user_id: profile.id,
          role: "owner",
          status: "active",
          joined_at: profile.created_at ?? nowIso,
          created_at: profile.created_at ?? nowIso,
          updated_at: nowIso,
        })),
        {
          onConflict: "organization_id,user_id",
        },
      );

    if (membersError) {
      throw new HttpError(
        500,
        `Failed to backfill workspace memberships: ${membersError.message}`,
      );
    }
  }

  const workspaceProfileById = new Map(
    profilesWithWorkspaces.map((profile) => [profile.id as string, profile]),
  );

  const missingSubscriptions = authUsers
    .filter((user) => !existingSubscriptionIds.has(user.id))
    .map((user) => {
      const workspaceProfile = workspaceProfileById.get(user.id);
      return workspaceProfile?.current_organization_id
        ? {
            user_id: user.id,
            organization_id: workspaceProfile.current_organization_id,
            plan: "free",
            status: "active",
            billing_cycle: "monthly",
            price: PLAN_DETAILS.free.price,
            start_date: user.created_at ?? nowIso,
            end_date: null,
            created_at: user.created_at ?? nowIso,
            updated_at: nowIso,
          }
        : null;
    })
    .filter(Boolean);

  if (missingSubscriptions.length > 0) {
    const { error } = await admin
      .from("subscriptions")
      .upsert(missingSubscriptions, {
        onConflict: "user_id",
      });

    if (error) {
      throw new HttpError(
        500,
        `Failed to backfill subscriptions: ${error.message}`,
      );
    }
  }
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

export interface WorkspaceContext {
  id: string;
  name: string;
  owner_id: string;
  currentUserRole: "owner" | "admin" | "member";
}

export async function getWorkspaceForUser(userId: string): Promise<WorkspaceContext> {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(
      500,
      `Failed to load workspace profile: ${profileError.message}`,
    );
  }

  let membershipQuery = admin
    .from("organization_members")
    .select("role, organizations(id, name, owner_id)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (profile?.current_organization_id) {
    membershipQuery = membershipQuery.eq(
      "organization_id",
      profile.current_organization_id,
    );
  }

  let { data: membership, error: membershipError } =
    await membershipQuery.maybeSingle();

  if ((!membership || membershipError) && profile?.current_organization_id) {
    const fallback = await admin
      .from("organization_members")
      .select("role, organizations(id, name, owner_id)")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    membership = fallback.data;
    membershipError = fallback.error;
  }

  if (membershipError) {
    throw new HttpError(
      500,
      `Failed to load workspace membership: ${membershipError.message}`,
    );
  }

  const organization = Array.isArray(membership?.organizations)
    ? membership?.organizations[0]
    : membership?.organizations;

  if (!membership || !organization) {
    throw new HttpError(403, "No active workspace membership found.");
  }

  return {
    id: organization.id,
    name: organization.name,
    owner_id: organization.owner_id,
    currentUserRole: membership.role,
  };
}

export async function requireWorkspaceManager(userId: string) {
  const workspace = await getWorkspaceForUser(userId);

  if (
    workspace.currentUserRole !== "owner" &&
    workspace.currentUserRole !== "admin"
  ) {
    throw new HttpError(
      403,
      "Only a workspace owner or admin can manage this subscription.",
    );
  }

  return workspace;
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
  const workspace = await requireWorkspaceManager(userId);
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
        user_id: workspace.owner_id,
        organization_id: workspace.id,
        plan: planId,
        status: "active",
        billing_cycle: "monthly",
        price: plan.price,
        start_date: nowIso,
        end_date: endDate,
        updated_at: nowIso,
      },
      {
        onConflict: "organization_id",
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
    .eq("id", workspace.owner_id);

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
  organizationId?: string;
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
  organizationId,
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
  const workspace = organizationId
    ? { id: organizationId }
    : await getWorkspaceForUser(userId);
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("payments").upsert(
    {
      user_id: userId,
      organization_id: workspace.id,
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
  const workspace = await getWorkspaceForUser(userId);

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
        organization_id: workspace.id,
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
