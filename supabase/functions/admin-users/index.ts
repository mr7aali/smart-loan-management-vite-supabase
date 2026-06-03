import {
  corsHeaders,
  errorResponse,
  handleFunctionError,
  jsonResponse,
} from "../_shared/cors.ts";
import {
  createAdminClient,
  requireAdminUser,
} from "../_shared/supabase.ts";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "user" | "admin";
  account_status: "active" | "suspended";
  plan: "free" | "starter" | "professional" | "enterprise";
  max_borrowers: number | null;
  max_loans: number | null;
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "cancelled" | "expired";
  billing_cycle: "monthly" | "yearly";
  price: number;
  start_date: string | null;
  end_date: string | null;
  updated_at: string | null;
};

type PaymentRow = {
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paid_at: string;
  subscription_plan: "free" | "starter" | "professional" | "enterprise";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    await requireAdminUser(req);
    const admin = createAdminClient();

    const [
      { data: profiles, error: profilesError },
      { data: subscriptions, error: subscriptionsError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, email, full_name, phone, role, account_status, plan, max_borrowers, max_loans, created_at",
        )
        .order("created_at", { ascending: false }),
      admin
        .from("subscriptions")
        .select(
          "user_id, plan, status, billing_cycle, price, start_date, end_date, updated_at",
        ),
      admin
        .from("payments")
        .select("user_id, amount, currency, status, paid_at, subscription_plan")
        .order("paid_at", { ascending: false }),
    ]);

    if (profilesError || subscriptionsError || paymentsError) {
      throw new Error(
        profilesError?.message ||
          subscriptionsError?.message ||
          paymentsError?.message ||
          "Failed to load admin user data.",
      );
    }

    const subscriptionMap = new Map(
      ((subscriptions ?? []) as SubscriptionRow[]).map((subscription) => [
        subscription.user_id,
        subscription,
      ]),
    );

    const paymentsByUser = new Map<string, PaymentRow[]>();
    for (const payment of (payments ?? []) as PaymentRow[]) {
      const bucket = paymentsByUser.get(payment.user_id) ?? [];
      bucket.push(payment);
      paymentsByUser.set(payment.user_id, bucket);
    }

    const users = ((profiles ?? []) as ProfileRow[]).map((profile) => {
      const subscription = subscriptionMap.get(profile.id) ?? null;
      const userPayments = paymentsByUser.get(profile.id) ?? [];
      const completedPayments = userPayments.filter(
        (payment) => payment.status === "completed",
      );
      const lastPayment = completedPayments[0] ?? null;

      return {
        id: profile.id,
        name: profile.full_name || profile.email?.split("@")[0] || "Unknown user",
        email: profile.email || "No email",
        phone: profile.phone,
        role: profile.role,
        accountStatus: profile.account_status,
        joinedAt: profile.created_at,
        plan: profile.plan,
        limits: {
          maxBorrowers: profile.max_borrowers,
          maxLoans: profile.max_loans,
        },
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
        payments: {
          totalCount: completedPayments.length,
          totalAmount: completedPayments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
          ),
          lastPaidAt: lastPayment?.paid_at ?? null,
          lastAmount: lastPayment ? Number(lastPayment.amount) : null,
          currency: lastPayment?.currency ?? "USD",
          lastPlan: lastPayment?.subscription_plan ?? null,
        },
      };
    });

    return jsonResponse({ users });
  } catch (error) {
    return handleFunctionError(error);
  }
});
