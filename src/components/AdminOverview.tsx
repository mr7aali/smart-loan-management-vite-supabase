import {
  Activity,
  BadgeDollarSign,
  Crown,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import {
  AdminExpiringSubscription,
  AdminNewestUser,
  AdminOverviewData,
  AdminOverviewPayment,
  AdminPlanDistributionItem,
} from "../types";

interface AdminOverviewProps {
  data: AdminOverviewData | null;
  loading: boolean;
  onRefresh: () => void;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return dateFormatter.format(new Date(value));
}

function getPlanTone(plan: string) {
  const tones: Record<string, string> = {
    free: "bg-slate-100 text-slate-700",
    starter: "bg-sky-100 text-sky-700",
    professional: "bg-violet-100 text-violet-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  return tones[plan] ?? "bg-slate-100 text-slate-700";
}

function getStatusTone(status: string) {
  const tones: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    expired: "bg-amber-100 text-amber-700",
    pending: "bg-sky-100 text-sky-700",
    refunded: "bg-slate-100 text-slate-700",
    suspended: "bg-rose-100 text-rose-700",
    admin: "bg-violet-100 text-violet-700",
    user: "bg-slate-100 text-slate-700",
  };

  return tones[status] ?? "bg-slate-100 text-slate-700";
}

function PaymentsList({ payments }: { payments: AdminOverviewPayment[] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No payment records yet. Captured PayPal subscriptions will show here automatically.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-slate-900">{payment.name}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPlanTone(payment.plan)}`}
              >
                {payment.plan}
              </span>
            </div>
            <p className="truncate text-sm text-slate-500">{payment.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Paid {formatDate(payment.paidAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(payment.status)}`}
            >
              {payment.status}
            </span>
            <div className="text-right">
              <p className="font-semibold text-slate-900">
                {moneyFormatter.format(payment.amount)}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {payment.currency}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpiringSubscriptions({
  items,
}: {
  items: AdminExpiringSubscription[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center text-sm text-emerald-700">
        No subscriptions are close to expiry right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.userId}-${item.endDate ?? "none"}`}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{item.name}</p>
              <p className="truncate text-sm text-slate-500">{item.email}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPlanTone(item.plan)}`}
            >
              {item.plan}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Valid until {formatDate(item.endDate)}</span>
            <span className="font-medium text-amber-700">
              {item.daysRemaining === 0
                ? "Expires today"
                : `${item.daysRemaining} days left`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanDistribution({
  items,
}: {
  items: AdminPlanDistributionItem[];
}) {
  const total = items.reduce((sum, item) => sum + item.users, 0) || 1;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percentage = Math.round((item.users / total) * 100);
        return (
          <div key={item.plan} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 font-medium capitalize ${getPlanTone(item.plan)}`}
                >
                  {item.plan}
                </span>
                <span className="text-slate-500">{item.users} users</span>
              </div>
              <span className="font-medium text-slate-700">{percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                style={{ width: `${Math.max(percentage, item.users > 0 ? 8 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewestUsers({ users }: { users: AdminNewestUser[] }) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Joined {formatDate(user.joinedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(user.role)}`}
            >
              {user.role}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(user.accountStatus)}`}
            >
              {user.accountStatus}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview({
  data,
  loading,
  onRefresh,
}: AdminOverviewProps) {
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_38%),linear-gradient(135deg,#0f172a,#312e81_48%,#0f766e)] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              Admin Control Center
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Platform health, payments, and subscription risk in one place.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-indigo-100 sm:text-base">
              Track revenue movement, watch expiring plans, and keep a close eye on the users who need attention next.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh admin data
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Total users",
            value: stats?.totalUsers ?? 0,
            hint: `${stats?.adminUsers ?? 0} admin accounts`,
            icon: Users,
            tone: "from-sky-500 to-cyan-400",
          },
          {
            label: "Active subscriptions",
            value: stats?.activeSubscriptions ?? 0,
            hint: `${stats?.expiringSoon ?? 0} expiring soon`,
            icon: Activity,
            tone: "from-emerald-500 to-lime-400",
          },
          {
            label: "30-day revenue",
            value: moneyFormatter.format(stats?.monthlyRevenue ?? 0),
            hint: `${stats?.completedPayments ?? 0} completed payments`,
            icon: BadgeDollarSign,
            tone: "from-amber-500 to-orange-400",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{card.hint}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Recent payments</h3>
              <p className="text-sm text-slate-500">
                Confirmed subscription payments captured through PayPal.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
          </div>
          <PaymentsList payments={data?.recentPayments ?? []} />
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Plan mix</h3>
                <p className="text-sm text-slate-500">
                  Current distribution across active and free users.
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Crown className="h-5 w-5" />
              </div>
            </div>
            <PlanDistribution items={data?.planDistribution ?? []} />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Newest users</h3>
                <p className="text-sm text-slate-500">
                  Fresh accounts that may need onboarding support.
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <NewestUsers users={data?.newestUsers ?? []} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Expiring subscriptions
            </h3>
            <p className="text-sm text-slate-500">
              Users whose plan validity dates need attention soon.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <TimerReset className="h-5 w-5" />
          </div>
        </div>
        <ExpiringSubscriptions items={data?.expiringSubscriptions ?? []} />
      </section>
    </div>
  );
}
