import {
  corsHeaders,
  errorResponse,
  handleFunctionError,
  jsonResponse,
  HttpError,
} from "../_shared/cors.ts";
import { isSubscriptionPlanId } from "../_shared/plans.ts";
import {
  createAdminClient,
  requireAdminUser,
  updateUserAccessAndSubscription,
} from "../_shared/supabase.ts";

function isRole(value: unknown): value is "user" | "admin" {
  return value === "user" || value === "admin";
}

function isAccountStatus(value: unknown): value is "active" | "suspended" {
  return value === "active" || value === "suspended";
}

function isSubscriptionStatus(
  value: unknown,
): value is "active" | "cancelled" | "expired" {
  return value === "active" || value === "cancelled" || value === "expired";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    const adminUser = await requireAdminUser(req);
    const body = await req.json();
    const userId = body?.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      throw new HttpError(400, "A valid userId is required.");
    }

    if (body.role !== undefined && !isRole(body.role)) {
      throw new HttpError(400, "Invalid role provided.");
    }

    if (
      body.accountStatus !== undefined &&
      !isAccountStatus(body.accountStatus)
    ) {
      throw new HttpError(400, "Invalid account status provided.");
    }

    if (
      body.subscriptionStatus !== undefined &&
      !isSubscriptionStatus(body.subscriptionStatus)
    ) {
      throw new HttpError(400, "Invalid subscription status provided.");
    }

    if (body.plan !== undefined && !isSubscriptionPlanId(body.plan)) {
      throw new HttpError(400, "Invalid subscription plan provided.");
    }

    const workspace = await updateUserAccessAndSubscription({
      actorUserId: adminUser.id,
      userId,
      role: body.role,
      accountStatus: body.accountStatus,
      planId: body.plan,
      subscriptionStatus: body.subscriptionStatus,
      endDate: body.endDate === null ? null : body.endDate ?? undefined,
    });

    const admin = createAdminClient();
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, email, full_name, role, account_status, plan, max_borrowers, max_loans, created_at",
        )
        .eq("id", userId)
        .single(),
      admin
        .from("subscriptions")
        .select(
          "user_id, organization_id, plan, status, billing_cycle, price, start_date, end_date, updated_at",
        )
        .eq("organization_id", workspace.id)
        .single(),
    ]);

    return jsonResponse({
      user: {
        id: profile?.id,
        name: profile?.full_name || profile?.email?.split("@")[0] || "Unknown user",
        email: profile?.email || "No email",
        role: profile?.role,
        accountStatus: profile?.account_status,
        plan: profile?.plan,
        limits: {
          maxBorrowers: profile?.max_borrowers ?? null,
          maxLoans: profile?.max_loans ?? null,
        },
        joinedAt: profile?.created_at,
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              billingCycle: subscription.billing_cycle,
              price: Number(subscription.price),
              startDate: subscription.start_date,
              endDate: subscription.end_date,
              updatedAt: subscription.updated_at,
            }
          : null,
      },
    });
  } catch (error) {
    return handleFunctionError(error);
  }
});
