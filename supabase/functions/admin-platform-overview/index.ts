import {
  corsHeaders,
  errorResponse,
  handleFunctionError,
  jsonResponse,
} from "../_shared/cors.ts";
import {
  backfillAccountRecordsForAuthUsers,
  createAdminClient,
  listAllAuthUsers,
  requireAdminUser,
} from "../_shared/supabase.ts";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin";
  account_status: "active" | "suspended";
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "cancelled" | "expired";
  price: number;
  end_date: string | null;
};

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  subscription_plan: "free" | "starter" | "professional" | "enterprise";
  paid_at: string;
  provider_capture_id: string | null;
};

const OVERVIEW_PAGE_DATASET_SIZE = 24;

function daysUntil(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    await requireAdminUser(req);
    const authUsers = await listAllAuthUsers();
    await backfillAccountRecordsForAuthUsers(authUsers);
    const admin = createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { data: profiles, error: profilesError },
      { data: subscriptions, error: subscriptionsError },
      { data: allPayments, error: paymentsError },
      { data: recentPayments, error: recentPaymentsError },
    ] = await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, role, account_status, created_at")
        .order("created_at", { ascending: false }),
      admin
        .from("subscriptions")
        .select("user_id, plan, status, price, end_date"),
      admin
        .from("payments")
        .select(
          "id, user_id, amount, currency, status, subscription_plan, paid_at, provider_capture_id",
        ),
      admin
        .from("payments")
        .select(
          "id, user_id, amount, currency, status, subscription_plan, paid_at, provider_capture_id",
        )
        .order("paid_at", { ascending: false })
        .limit(OVERVIEW_PAGE_DATASET_SIZE),
    ]);

    if (profilesError || subscriptionsError || paymentsError || recentPaymentsError) {
      throw new Error(
        profilesError?.message ||
          subscriptionsError?.message ||
          paymentsError?.message ||
          recentPaymentsError?.message ||
          "Failed to load admin overview data.",
      );
    }

    const profileRows = (profiles ?? []) as ProfileRow[];
    const subscriptionRows = (subscriptions ?? []) as SubscriptionRow[];
    const paymentRows = (allPayments ?? []) as PaymentRow[];
    const recentPaymentRows = (recentPayments ?? []) as PaymentRow[];
    const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

    const completedPayments = paymentRows.filter(
      (payment) => payment.status === "completed",
    );
    const monthlyRevenue = completedPayments
      .filter((payment) => new Date(payment.paid_at) >= thirtyDaysAgo)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const activeSubscriptions = subscriptionRows.filter(
      (subscription) => subscription.status === "active",
    );
    const expiringSoon = activeSubscriptions
      .filter(
        (subscription) =>
          subscription.end_date && daysUntil(subscription.end_date) >= 0 &&
          daysUntil(subscription.end_date) <= 14,
      )
      .map((subscription) => {
        const profile = profileMap.get(subscription.user_id);
        return {
          userId: subscription.user_id,
          name:
            profile?.full_name ||
            profile?.email?.split("@")[0] ||
            "Unknown user",
          email: profile?.email || "No email",
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.end_date,
          daysRemaining: subscription.end_date
            ? daysUntil(subscription.end_date)
            : null,
        };
      })
      .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))
      .slice(0, OVERVIEW_PAGE_DATASET_SIZE);

    const planDistribution = ["free", "starter", "professional", "enterprise"].map(
      (plan) => ({
        plan,
        users: subscriptionRows.filter((subscription) => subscription.plan === plan)
          .length,
      }),
    );

    const recentPaymentItems = recentPaymentRows.map((payment) => {
      const profile = profileMap.get(payment.user_id);
      return {
        id: payment.id,
        userId: payment.user_id,
        name:
          profile?.full_name || profile?.email?.split("@")[0] || "Unknown user",
        email: profile?.email || "No email",
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        plan: payment.subscription_plan,
        paidAt: payment.paid_at,
        captureId: payment.provider_capture_id,
      };
    });

    const newestUsers = profileRows
      .slice(0, OVERVIEW_PAGE_DATASET_SIZE)
      .map((profile) => ({
      id: profile.id,
      name: profile.full_name || profile.email?.split("@")[0] || "Unknown user",
      email: profile.email || "No email",
      role: profile.role,
      accountStatus: profile.account_status,
      joinedAt: profile.created_at,
    }));

    return jsonResponse({
      stats: {
        totalUsers: authUsers.length,
        adminUsers: profileRows.filter((profile) => profile.role === "admin").length,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRevenue,
        completedPayments: completedPayments.length,
        expiringSoon: expiringSoon.length,
      },
      recentPayments: recentPaymentItems,
      expiringSubscriptions: expiringSoon,
      planDistribution,
      newestUsers,
    });
  } catch (error) {
    return handleFunctionError(error);
  }
});
