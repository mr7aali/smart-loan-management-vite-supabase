import { useEffect, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  Download,
  Search,
  ShieldCheck,
  UserCog,
  Wallet,
} from "lucide-react";
import {
  AccountStatus,
  AdminManagedUser,
  Subscription,
  UserRole,
} from "../types";
import PaginationControls from "./PaginationControls";
import { downloadCsv } from "../lib/export";

interface AdminUsersPageProps {
  users: AdminManagedUser[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateUser: (payload: {
    userId: string;
    role: UserRole;
    accountStatus: AccountStatus;
    plan: Subscription["plan"];
    subscriptionStatus: Subscription["status"];
    endDate: string | null;
  }) => Promise<void>;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USERS_PER_PAGE = 8;

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return dateFormatter.format(new Date(value));
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getStatusTone(status: string) {
  const tones: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-rose-100 text-rose-700",
    cancelled: "bg-amber-100 text-amber-700",
    expired: "bg-slate-100 text-slate-700",
    admin: "bg-violet-100 text-violet-700",
    user: "bg-slate-100 text-slate-700",
    free: "bg-slate-100 text-slate-700",
    starter: "bg-sky-100 text-sky-700",
    professional: "bg-violet-100 text-violet-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  return tones[status] ?? "bg-slate-100 text-slate-700";
}

export default function AdminUsersPage({
  users,
  loading,
  onRefresh: _onRefresh,
  onUpdateUser,
}: AdminUsersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");
  const [plan, setPlan] = useState<Subscription["plan"]>("free");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<Subscription["status"]>("active");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE),
  );
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ||
    users.find((user) => user.id === selectedUserId) ||
    filteredUsers[0] ||
    users[0] ||
    null;

  useEffect(() => {
    if (!selectedUserId && users[0]) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (paginatedUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }

    const selectedUserVisible = paginatedUsers.some(
      (user) => user.id === selectedUserId,
    );

    if (!selectedUserVisible) {
      setSelectedUserId(paginatedUsers[0].id);
    }
  }, [paginatedUsers, selectedUserId]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setSelectedUserId(selectedUser.id);
    setRole(selectedUser.role);
    setAccountStatus(selectedUser.accountStatus);
    setPlan(selectedUser.subscription?.plan ?? selectedUser.plan);
    setSubscriptionStatus(selectedUser.subscription?.status ?? "active");
    setEndDate(toDateInputValue(selectedUser.subscription?.endDate));
  }, [selectedUser?.id]);

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await onUpdateUser({
        userId: selectedUser.id,
        role,
        accountStatus,
        plan,
        subscriptionStatus,
        endDate: endDate ? new Date(`${endDate}T00:00:00`).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportUsers = () => {
    downloadCsv(
      `admin-user-management-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredUsers.map((user) => ({
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        account_status: user.accountStatus,
        profile_plan: user.plan,
        subscription_plan: user.subscription?.plan || "",
        subscription_status: user.subscription?.status || "",
        billing_cycle: user.subscription?.billingCycle || "",
        subscription_price: user.subscription?.price ?? "",
        subscription_end_date: user.subscription?.endDate || "",
        max_borrowers: user.limits.maxBorrowers ?? "Unlimited",
        max_loans: user.limits.maxLoans ?? "Unlimited",
        successful_payments: user.payments.totalCount,
        lifetime_paid: user.payments.totalAmount,
        last_paid_at: user.payments.lastPaidAt || "",
        joined_at: user.joinedAt,
      })),
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Accounts</h3>
              <p className="text-sm text-slate-500">
                {filteredUsers.length} of {users.length} users visible
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleExportUsers}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="inline-flex p-1 rounded-2xl bg-slate-100">
                {(["all", "active", "suspended"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium capitalize transition ${
                      statusFilter === filter
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-5">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-4 top-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="w-full py-3 pr-4 text-sm transition border outline-none rounded-2xl border-slate-200 bg-slate-50 pl-11 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-sm text-center border border-dashed rounded-3xl border-slate-200 bg-slate-50 text-slate-500">
                No users match your current search or status filter.
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedUser?.id === user.id
                      ? "border-indigo-200 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-sm truncate text-slate-500">
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(
                        user.accountStatus,
                      )}`}
                    >
                      {user.accountStatus}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusTone(
                        user.subscription?.plan ?? user.plan,
                      )}`}
                    >
                      {user.subscription?.plan ?? user.plan}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {moneyFormatter.format(user.payments.totalAmount)} total
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-5">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={USERS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {!selectedUser ? (
            <div className="p-10 text-sm text-center border border-dashed rounded-3xl border-slate-200 bg-slate-50 text-slate-500">
              Select a user to manage access, plan, and subscription validity.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Selected account
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {selectedUser.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusTone(role)}`}
                  >
                    {role}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusTone(accountStatus)}`}
                  >
                    {accountStatus}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusTone(plan)}`}
                  >
                    {plan}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Joined",
                    value: formatDate(selectedUser.joinedAt),
                    icon: CalendarClock,
                  },
                  {
                    label: "Last payment",
                    value: selectedUser.payments.lastPaidAt
                      ? formatDate(selectedUser.payments.lastPaidAt)
                      : "No payments",
                    icon: Wallet,
                  },
                  {
                    label: "Lifetime paid",
                    value: moneyFormatter.format(
                      selectedUser.payments.totalAmount,
                    ),
                    icon: CreditCard,
                  },
                  {
                    label: "Plan valid until",
                    value: formatDate(selectedUser.subscription?.endDate),
                    icon: ShieldCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="p-4 border rounded-3xl border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-indigo-600 bg-white shadow-sm h-11 w-11 rounded-2xl">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="p-5 border rounded-3xl border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 text-indigo-600 bg-white shadow-sm rounded-2xl">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Account snapshot
                      </h4>
                      <p className="text-sm text-slate-500">
                        Quick health view before you make changes.
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-4">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Current billing
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {selectedUser.subscription
                          ? `${moneyFormatter.format(
                              selectedUser.subscription.price,
                            )} / ${selectedUser.subscription.billingCycle}`
                          : "No subscription record"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Limits
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        Borrowers:{" "}
                        {selectedUser.limits.maxBorrowers ?? "Unlimited"} |
                        Loans: {selectedUser.limits.maxLoans ?? "Unlimited"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Payment activity
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {selectedUser.payments.totalCount} successful payments
                        recorded
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-5 bg-white border rounded-3xl border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Manage access and subscription
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Changes save directly to the user profile and subscription
                    record.
                  </p>

                  <div className="grid gap-4 mt-5 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">Role</span>
                      <select
                        value={role}
                        onChange={(event) =>
                          setRole(event.target.value as UserRole)
                        }
                        className="w-full px-4 py-3 transition border outline-none rounded-2xl border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">
                        Account status
                      </span>
                      <select
                        value={accountStatus}
                        onChange={(event) =>
                          setAccountStatus(event.target.value as AccountStatus)
                        }
                        className="w-full px-4 py-3 transition border outline-none rounded-2xl border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">Plan</span>
                      <select
                        value={plan}
                        onChange={(event) =>
                          setPlan(event.target.value as Subscription["plan"])
                        }
                        className="w-full px-4 py-3 transition border outline-none rounded-2xl border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">
                        Subscription status
                      </span>
                      <select
                        value={subscriptionStatus}
                        onChange={(event) =>
                          setSubscriptionStatus(
                            event.target.value as Subscription["status"],
                          )
                        }
                        className="w-full px-4 py-3 transition border outline-none rounded-2xl border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="font-medium text-slate-700">
                        Valid until
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="w-full px-4 py-3 transition border outline-none rounded-2xl border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Save applies the new role, access status, plan, and
                      validity date.
                    </p>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || loading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white transition bg-indigo-600 rounded-2xl hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
