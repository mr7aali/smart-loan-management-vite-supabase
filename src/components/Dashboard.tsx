import { Borrower, Loan, Repayment } from "../types";
import {
  AppCurrency,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getLoanProgress,
  getRemainingAmount,
  getBorrowerById,
  getBorrowerName,
} from "../utils";
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useIsMobile } from "../hooks/use-mobile";

interface DashboardProps {
  borrowers: Borrower[];
  currency: AppCurrency;
  loans: Loan[];
  repayments: Repayment[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard({
  borrowers,
  currency,
  loans,
  repayments,
}: DashboardProps) {
  const [animateCards, setAnimateCards] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Helper functions to handle both snake_case and camelCase
  const getLoanBorrowerId = (loan: Loan): string =>
    loan.borrowerId || loan.borrower_id || "";
  const getLoanDueDate = (loan: Loan): string =>
    loan.dueDate || loan.due_date || "";
  const getLoanStartDate = (loan: Loan): string =>
    loan.startDate || loan.start_date || "";
  const getLoanAmount = (loan: Loan): number => loan.amount || 0;
  const getRepaymentLoanId = (r: Repayment): string =>
    r.loanId || r.loan_id || "";

  const totalDisbursed = loans.reduce((sum, l) => sum + getLoanAmount(l), 0);
  const totalCollected = repayments.reduce((sum, r) => sum + r.amount, 0);
  const activeLoans = loans.filter((l) => l.status === "active");
  const overdueLoans = loans.filter((l) => {
    if (l.status !== "active") return false;
    const dueDate = new Date(getLoanDueDate(l));
    return dueDate < new Date();
  });
  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const paid = repayments
      .filter((r) => getRepaymentLoanId(r) === l.id)
      .reduce((s, r) => s + r.amount, 0);
    return sum + (getLoanAmount(l) - paid);
  }, 0);

  const stats = [
    {
      title: "Total Borrowers",
      mobileTitle: "Users",
      value: borrowers.length,
      mobileValue: borrowers.length,
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Loans",
      mobileTitle: "Loans",
      value: activeLoans.length,
      mobileValue: activeLoans.length,
      change: "+8%",
      changeType: "positive" as const,
      icon: FileText,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Total Disbursed",
      mobileTitle: "Sent",
      value: formatCurrency(totalDisbursed, currency),
      mobileValue: formatCompactCurrency(totalDisbursed, currency),
      change: "+15%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Collection Rate",
      mobileTitle: "Rate",
      value:
        totalDisbursed > 0
          ? `${((totalCollected / totalDisbursed) * 100).toFixed(1)}%`
          : "0%",
      mobileValue:
        totalDisbursed > 0
          ? `${((totalCollected / totalDisbursed) * 100).toFixed(0)}%`
          : "0%",
      change: "-2%",
      changeType: "negative" as const,
      icon: TrendingUp,
      color: "from-amber-500 to-amber-600",
    },
  ];

  const recentLoans = [...loans]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const upcomingPayments = activeLoans
    .filter((l) => {
      const dueDate = new Date(getLoanDueDate(l));
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      return dueDate >= today && dueDate <= sevenDaysLater;
    })
    .slice(0, 5);

  // Calculate avg interest rate
  const avgInterestRate =
    loans.length > 0
      ? loans.reduce(
          (sum, l) => sum + (l.interestRate || l.interest_rate || 0),
          0,
        ) / loans.length
      : 0;

  // Calculate this month's repayments
  const thisMonthRepayments = repayments
    .filter((r) => {
      const date = new Date(r.date);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, r) => sum + r.amount, 0);

  // Generate monthly data for charts (last 6 months)
  const generateMonthlyData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();

      const monthRepayments = repayments
        .filter((r) => {
          const rDate = new Date(r.date);
          return (
            rDate.getMonth() === date.getMonth() && rDate.getFullYear() === year
          );
        })
        .reduce((sum, r) => sum + r.amount, 0);

      const monthLoans = loans
        .filter((l) => {
          const lDate = new Date(getLoanStartDate(l));
          return (
            lDate.getMonth() === date.getMonth() && lDate.getFullYear() === year
          );
        })
        .reduce((sum, l) => sum + getLoanAmount(l), 0);

      months.push({
        name: monthName,
        disbursed: monthLoans,
        collected: monthRepayments,
      });
    }
    return months;
  };

  const monthlyData = generateMonthlyData();

  // Loan status distribution for pie chart
  const loanStatusData = [
    { name: "Paid", value: loans.filter((l) => l.status === "paid").length },
    {
      name: "Active",
      value: loans.filter((l) => l.status === "active").length,
    },
    { name: "Overdue", value: overdueLoans.length },
  ].filter((d) => d.value > 0);

  // Top borrowers by loan amount
  const topBorrowers = borrowers
    .map((b) => {
      const borrowerLoans = loans.filter((l) => getLoanBorrowerId(l) === b.id);
      const totalLoan = borrowerLoans.reduce(
        (sum, l) => sum + getLoanAmount(l),
        0,
      );
      return {
        name: b.name,
        total: totalLoan,
      };
    })
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-500 sm:rounded-xl sm:p-6 ${
                animateCards
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-2 flex items-start justify-between sm:mb-4 sm:items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} sm:h-12 sm:w-12 sm:rounded-xl`}
                >
                  <Icon className="h-4 w-4 text-white sm:h-6 sm:w-6" />
                </div>
                <div
                  className={`hidden items-center gap-1 text-sm font-medium sm:flex ${
                    stat.changeType === "positive"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="break-words text-sm font-bold text-gray-800 sm:text-2xl">
                {isMobile ? stat.mobileValue : stat.value}
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-500 sm:text-sm sm:normal-case sm:tracking-normal">
                {isMobile ? stat.mobileTitle : stat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio Overview */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Portfolio Overview
            </h2>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This year</option>
              <option>All time</option>
            </select>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm text-gray-500">Total Disbursed</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(totalDisbursed, currency)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalCollected, currency)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalOutstanding, currency)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600">Collection Progress</span>
              <span className="font-medium text-gray-800">
                {totalDisbursed > 0
                  ? ((totalCollected / totalDisbursed) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                style={{
                  width: `${totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Loan Status Breakdown */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Paid Loans</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {loans.filter((l) => l.status === "paid").length}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-indigo-800">
                  Active Loans
                </span>
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                {activeLoans.length}
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {overdueLoans.length}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-800">Quick Stats</h2>

          <div className="space-y-4">
            <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-gray-600">Avg. Loan Amount</span>
              <span className="font-bold text-gray-800">
                {loans.length > 0
                  ? formatCurrency(totalDisbursed / loans.length, currency)
                  : formatCurrency(0, currency)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-gray-600">Avg. Interest Rate</span>
              <span className="font-bold text-gray-800">
                {avgInterestRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-gray-600">This Month Repayments</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(thisMonthRepayments, currency)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-gray-600">Interest Earned</span>
              <span className="font-bold text-purple-600">
                {formatCurrency(totalCollected - totalDisbursed, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Loan & Collection Trend */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Loan & Collection Trend
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                {!isMobile && (
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) =>
                      formatCompactCurrency(value, currency)
                    }
                  />
                )}
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value, currency),
                    "",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                {!isMobile && <Legend />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Status Distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Loan Status Distribution
          </h2>
          {loanStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 45 : 60}
                    outerRadius={isMobile ? 68 : 80}
                    paddingAngle={5}
                    dataKey="value"
                    label={
                      isMobile
                        ? undefined
                        : ({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {loanStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              <p>No loan data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Borrowers Chart */}
      {topBorrowers.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Top Borrowers by Loan Amount
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBorrowers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) =>
                    formatCompactCurrency(value, currency)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={isMobile ? 56 : 100}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value, currency),
                    "Total Loans",
                  ]}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Loans */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800">Recent Loans</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </button>
          </div>

          {recentLoans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No loans yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLoans.map((loan) => {
                const borrowerId = getLoanBorrowerId(loan);
                const borrower = getBorrowerById(borrowers, borrowerId);
                const borrowerName = loan.borrowers
                  ? getBorrowerName(loan.borrowers)
                  : borrower?.name || "Unknown";
                const progress = getLoanProgress(loan, repayments);
                const startDate = getLoanStartDate(loan);

                return (
                  <div
                    key={loan.id}
                    className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                        {borrowerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {borrowerName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-bold text-gray-800">
                        {formatCurrency(getLoanAmount(loan), currency)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loan.status === "paid"
                                ? "bg-emerald-500"
                                : loan.status === "overdue"
                                  ? "bg-red-500"
                                  : "bg-indigo-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Payments */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Upcoming Payments
            </h2>
            <span className="text-sm text-gray-500">Next 7 days</span>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No upcoming payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingPayments.map((loan) => {
                const borrowerId = getLoanBorrowerId(loan);
                const borrower = getBorrowerById(borrowers, borrowerId);
                const borrowerName = loan.borrowers
                  ? getBorrowerName(loan.borrowers)
                  : borrower?.name || "Unknown";
                const remaining = getRemainingAmount(loan, repayments);
                const dueDate = getLoanDueDate(loan);
                const daysUntilDue = Math.ceil(
                  (new Date(dueDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                return (
                  <div
                    key={loan.id}
                    className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                        {borrowerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {borrowerName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due {formatDate(dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-bold text-amber-600">
                        {formatCurrency(remaining, currency)}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          daysUntilDue <= 1
                            ? "text-red-500"
                            : daysUntilDue <= 3
                              ? "text-amber-500"
                              : "text-gray-500"
                        }`}
                      >
                        {daysUntilDue === 0
                          ? "Today"
                          : daysUntilDue === 1
                            ? "Tomorrow"
                            : `In ${daysUntilDue} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
