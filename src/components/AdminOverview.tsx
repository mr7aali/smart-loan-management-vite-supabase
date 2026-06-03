import { useEffect, useState } from "react";
import {
  Activity,
  BadgeDollarSign,
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
import PaginationControls from "./PaginationControls";

interface AdminOverviewProps {
  data: AdminOverviewData | null;
  loading: boolean;
  onRefresh: () => void;
}

type OverviewTab = "payments" | "users" | "subscriptions";

const OVERVIEW_PAGE_SIZE = 4;

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

function getDominantPlan(items: AdminPlanDistributionItem[]) {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort((a, b) => b.users - a.users)[0];
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="w-24 h-3 rounded-full animate-pulse bg-slate-200" />
                <div className="w-20 h-8 rounded-full animate-pulse bg-slate-200" />
                <div className="h-3 rounded-full w-28 animate-pulse bg-slate-200" />
              </div>
              <div className="w-12 h-12 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.3fr]">
          <div className="h-52 animate-pulse rounded-[24px] bg-slate-200" />
          <div className="h-52 animate-pulse rounded-[24px] bg-slate-200" />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex gap-2 mb-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-32 h-10 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="p-4 border rounded-2xl border-slate-100 bg-slate-50"
            >
              <div className="space-y-3">
                <div className="w-40 h-4 rounded-full animate-pulse bg-slate-200" />
                <div className="w-56 h-3 rounded-full animate-pulse bg-slate-200" />
                <div className="w-32 h-3 rounded-full animate-pulse bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PaymentsList({ payments }: { payments: AdminOverviewPayment[] }) {
  if (payments.length === 0) {
    return (
      <div className="p-8 text-sm text-center border border-dashed rounded-3xl border-slate-200 bg-slate-50 text-slate-500">
        No payment records yet. Captured PayPal subscriptions will show here
        automatically.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-col gap-3 p-4 bg-white border shadow-sm rounded-2xl border-slate-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate text-slate-900">
                {payment.name}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPlanTone(payment.plan)}`}
              >
                {payment.plan}
              </span>
            </div>
            <p className="text-sm truncate text-slate-500">{payment.email}</p>
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
      <div className="p-8 text-sm text-center border border-dashed rounded-3xl border-emerald-200 bg-emerald-50 text-emerald-700">
        No subscriptions are close to expiry right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.userId}-${item.endDate ?? "none"}`}
          className="p-4 bg-white border shadow-sm rounded-2xl border-slate-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate text-slate-900">
                {item.name}
              </p>
              <p className="text-sm truncate text-slate-500">{item.email}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPlanTone(item.plan)}`}
            >
              {item.plan}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
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

function PlanDistribution({ items }: { items: AdminPlanDistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.users, 0) || 1;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const percentage = Math.round((item.users / total) * 100);
        return (
          <div
            key={item.plan}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPlanTone(item.plan)}`}
              >
                {item.plan}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {percentage}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-slate-900">{item.users}</p>
              <p className="text-sm text-slate-500">
                {item.users === 1 ? "user" : "users"}
              </p>
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
          className="flex items-center justify-between gap-3 p-4 bg-white border shadow-sm rounded-2xl border-slate-100"
        >
          <div className="min-w-0">
            <p className="font-semibold truncate text-slate-900">{user.name}</p>
            <p className="text-sm truncate text-slate-500">{user.email}</p>
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

function InlinePlanMix({
  items,
  dominantPlan,
  totalPlanUsers,
}: {
  items: AdminPlanDistributionItem[];
  dominantPlan: AdminPlanDistributionItem | null;
  totalPlanUsers: number;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <PlanDistribution items={items} />
      </div>
    </section>
  );
}

export default function AdminOverview({
  data,
  loading,
  onRefresh,
}: AdminOverviewProps) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("payments");
  const [tabPages, setTabPages] = useState<Record<OverviewTab, number>>({
    payments: 1,
    users: 1,
    subscriptions: 1,
  });
  const stats = data?.stats;
  const planDistribution = data?.planDistribution ?? [];
  const dominantPlan = getDominantPlan(planDistribution);
  const totalPlanUsers = planDistribution.reduce(
    (sum, item) => sum + item.users,
    0,
  );
  const tabs: Array<{
    id: OverviewTab;
    label: string;
    description: string;
    count: number;
  }> = [
    {
      id: "payments",
      label: "Recent payments",
      description: "Latest captured subscription payments",
      count: data?.recentPayments.length ?? 0,
    },
    {
      id: "users",
      label: "Newest users",
      description: "Recently created platform accounts",
      count: data?.newestUsers.length ?? 0,
    },
    {
      id: "subscriptions",
      label: "Expiring subscriptions",
      description: "Accounts needing renewal attention",
      count: data?.expiringSubscriptions.length ?? 0,
    },
  ];
  const tabItems: Record<
    OverviewTab,
    AdminOverviewPayment[] | AdminNewestUser[] | AdminExpiringSubscription[]
  > = {
    payments: data?.recentPayments ?? [],
    users: data?.newestUsers ?? [],
    subscriptions: data?.expiringSubscriptions ?? [],
  };
  const activeItems = tabItems[activeTab];
  const activePage = tabPages[activeTab];
  const activeTotalPages = Math.max(
    1,
    Math.ceil(activeItems.length / OVERVIEW_PAGE_SIZE),
  );
  const paginatedActiveItems = activeItems.slice(
    (activePage - 1) * OVERVIEW_PAGE_SIZE,
    activePage * OVERVIEW_PAGE_SIZE,
  );

  useEffect(() => {
    setTabPages((currentPages) => {
      let changed = false;
      const nextPages = { ...currentPages };

      (["payments", "users", "subscriptions"] as OverviewTab[]).forEach(
        (tab) => {
        const totalPages = Math.max(
          1,
          Math.ceil(tabItems[tab].length / OVERVIEW_PAGE_SIZE),
        );

        if (nextPages[tab] > totalPages) {
          nextPages[tab] = totalPages;
          changed = true;
        }
        },
      );

      return changed ? nextPages : currentPages;
    });
  }, [
    data?.recentPayments?.length,
    data?.newestUsers?.length,
    data?.expiringSubscriptions?.length,
  ]);

  const handleTabPageChange = (tab: OverviewTab, page: number) => {
    setTabPages((currentPages) => ({
      ...currentPages,
      [tab]: page,
    }));
  };

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
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
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <InlinePlanMix
        items={planDistribution}
        dominantPlan={dominantPlan}
        totalPlanUsers={totalPlanUsers}
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Admin activity</h3>
            <p className="text-sm text-slate-500">
              Toggle between payments, user onboarding, and subscription risk.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-3 mb-6 md:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[24px] border p-4 text-left transition ${
                activeTab === tab.id
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      activeTab === tab.id ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      activeTab === tab.id ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {tab.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    activeTab === tab.id
                      ? "bg-white/15 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>

        {activeTab === "payments" && (
            <div className="rounded-[24px] bg-slate-50/80 p-5">
              <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  Recent payments
                </h4>
                <p className="text-sm text-slate-500">
                  Confirmed subscription payments captured through PayPal.
                </p>
              </div>
              <div className="flex items-center justify-center bg-white shadow-sm h-11 w-11 rounded-2xl text-emerald-600">
                <BadgeDollarSign className="w-5 h-5" />
              </div>
            </div>
            <PaymentsList
              payments={paginatedActiveItems as AdminOverviewPayment[]}
            />
            <div className="mt-5">
              <PaginationControls
                currentPage={activePage}
                totalPages={activeTotalPages}
                totalItems={activeItems.length}
                pageSize={OVERVIEW_PAGE_SIZE}
                onPageChange={(page) => handleTabPageChange("payments", page)}
              />
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-[24px] bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  Newest users
                </h4>
                <p className="text-sm text-slate-500">
                  Fresh accounts that may need onboarding support.
                </p>
              </div>
              <div className="flex items-center justify-center bg-white shadow-sm h-11 w-11 rounded-2xl text-sky-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <NewestUsers users={paginatedActiveItems as AdminNewestUser[]} />
            <div className="mt-5">
              <PaginationControls
                currentPage={activePage}
                totalPages={activeTotalPages}
                totalItems={activeItems.length}
                pageSize={OVERVIEW_PAGE_SIZE}
                onPageChange={(page) => handleTabPageChange("users", page)}
              />
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="rounded-[24px] bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  Expiring subscriptions
                </h4>
                <p className="text-sm text-slate-500">
                  Users whose plan validity dates need attention soon.
                </p>
              </div>
              <div className="flex items-center justify-center bg-white shadow-sm h-11 w-11 rounded-2xl text-amber-600">
                <TimerReset className="w-5 h-5" />
              </div>
            </div>
            <ExpiringSubscriptions
              items={paginatedActiveItems as AdminExpiringSubscription[]}
            />
            <div className="mt-5">
              <PaginationControls
                currentPage={activePage}
                totalPages={activeTotalPages}
                totalItems={activeItems.length}
                pageSize={OVERVIEW_PAGE_SIZE}
                onPageChange={(page) =>
                  handleTabPageChange("subscriptions", page)
                }
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
