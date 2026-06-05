import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Borrower, Loan, Repayment, Subscription } from "../types";
import {
  formatCurrency,
  formatDate,
  getBorrowerById,
  getLoanDueDate,
  getLoanProgress,
  getOverdueLoans,
  getRepaymentLoanId,
  getUpcomingPayments,
} from "../utils";

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  user?: User | null;
  borrowers?: Borrower[];
  loans?: Loan[];
  repayments?: Repayment[];
  subscription?: Subscription | null;
  onNavigateSection?: (section: string) => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
}

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  borrowers: "Borrowers",
  loans: "Loans",
  repayments: "Repayments",
  reports: "Reports",
  settings: "Settings",
  subscription: "Subscription",
  help: "Help",
  "admin-overview": "Platform Overview",
  "admin-users": "User Management",
};

export default function Header({
  title,
  onToggleSidebar,
  user,
  borrowers = [],
  loans = [],
  repayments = [],
  subscription,
  onNavigateSection,
  onOpenSettings,
  onSignOut,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const getTitle = (section: string) =>
    TITLES[section] || section.charAt(0).toUpperCase() + section.slice(1);

  const getUserInitials = (email?: string) => {
    if (!email) return "U";
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const userName = user?.email?.split("@")[0] || "User";
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearchQuery
    ? {
        borrowers: borrowers
          .filter(
            (borrower) =>
              borrower.name.toLowerCase().includes(normalizedSearchQuery) ||
              borrower.email.toLowerCase().includes(normalizedSearchQuery) ||
              borrower.phone.includes(searchQuery.trim()),
          )
          .slice(0, 4),
        loans: loans
          .filter((loan) => {
            const borrower = getBorrowerById(
              borrowers,
              loan.borrowerId || loan.borrower_id || "",
            );

            return (
              loan.id.toLowerCase().includes(normalizedSearchQuery) ||
              borrower?.name.toLowerCase().includes(normalizedSearchQuery)
            );
          })
          .slice(0, 4),
        repayments: repayments
          .filter((repayment) => {
            const repaymentLoanId = getRepaymentLoanId(repayment);
            const loan = loans.find((item) => item.id === repaymentLoanId);
            const borrower = loan
              ? getBorrowerById(
                  borrowers,
                  loan.borrowerId || loan.borrower_id || "",
                )
              : undefined;

            return (
              repayment.id.toLowerCase().includes(normalizedSearchQuery) ||
              repayment.notes?.toLowerCase().includes(normalizedSearchQuery) ||
              loan?.id.toLowerCase().includes(normalizedSearchQuery) ||
              borrower?.name.toLowerCase().includes(normalizedSearchQuery)
            );
          })
          .slice(0, 4),
      }
    : {
        borrowers: [] as Borrower[],
        loans: [] as Loan[],
        repayments: [] as Repayment[],
      };

  const today = new Date();
  const overdueLoans = getOverdueLoans(loans).slice(0, 3);
  const upcomingPayments = getUpcomingPayments(loans, 7).slice(0, 3);
  const subscriptionExpiryDays =
    subscription?.end_date && subscription.status === "active"
      ? Math.ceil(
          (new Date(subscription.end_date).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

  const notifications = [
    ...(!user?.email_confirmed_at
      ? [
          {
            id: "email-verification",
            title: "Verify your email",
            body: "Confirm your email address to keep account access secure.",
            actionLabel: "Open settings",
            action: () => onOpenSettings?.(),
          },
        ]
      : []),
    ...overdueLoans.map((loan) => {
      const borrower = getBorrowerById(
        borrowers,
        loan.borrowerId || loan.borrower_id || "",
      );

      return {
        id: `overdue-${loan.id}`,
        title: `Overdue loan for ${borrower?.name || "Unknown borrower"}`,
        body: `Due ${formatDate(getLoanDueDate(loan))}. Collection progress is ${getLoanProgress(
          loan,
          repayments,
        ).toFixed(0)}%.`,
        actionLabel: "View loans",
        action: () => onNavigateSection?.("loans"),
      };
    }),
    ...upcomingPayments.map((loan) => {
      const borrower = getBorrowerById(
        borrowers,
        loan.borrowerId || loan.borrower_id || "",
      );

      return {
        id: `upcoming-${loan.id}`,
        title: `Upcoming payment from ${borrower?.name || "Unknown borrower"}`,
        body: `Loan due ${formatDate(getLoanDueDate(loan))} for ${formatCurrency(
          loan.amount,
        )}.`,
        actionLabel: "Open repayments",
        action: () => onNavigateSection?.("repayments"),
      };
    }),
    ...(subscriptionExpiryDays !== null && subscriptionExpiryDays <= 7
      ? [
          {
            id: "subscription-expiry",
            title:
              subscriptionExpiryDays <= 0
                ? "Subscription needs attention"
                : "Subscription renews soon",
            body:
              subscriptionExpiryDays <= 0
                ? "Your current plan validity date has passed."
                : `Your ${subscription?.plan} plan is valid until ${formatDate(
                    subscription?.end_date,
                  )}.`,
            actionLabel: "Open subscription",
            action: () => onNavigateSection?.("subscription"),
          },
        ]
      : []),
  ];

  const handleNavigate = (section: string) => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    setSearchQuery("");
    onNavigateSection?.(section);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="truncate text-lg font-bold text-gray-800 sm:text-2xl">
            {getTitle(title)}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div ref={searchRef} className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search borrowers, loans, repayments..."
              className="w-64 rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {isSearchOpen && (
              <div className="absolute right-0 z-20 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Quick Search
                  </p>
                  <p className="text-xs text-gray-500">
                    Jump across borrowers, loans, and repayments from one place.
                  </p>
                </div>

                {!normalizedSearchQuery ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    Start typing to search the records in your workspace.
                  </div>
                ) : (
                  <div className="max-h-[28rem] overflow-y-auto p-2">
                    {searchResults.borrowers.length === 0 &&
                    searchResults.loans.length === 0 &&
                    searchResults.repayments.length === 0 ? (
                      <div className="rounded-xl px-3 py-6 text-center text-sm text-gray-500">
                        No results matched "{searchQuery.trim()}".
                      </div>
                    ) : (
                      <>
                        {searchResults.borrowers.length > 0 && (
                          <div className="mb-2">
                            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Borrowers
                            </p>
                            {searchResults.borrowers.map((borrower) => (
                              <button
                                key={borrower.id}
                                type="button"
                                onClick={() => handleNavigate("borrowers")}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                              >
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {borrower.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {borrower.email || borrower.phone}
                                  </p>
                                </div>
                                <span className="text-xs text-indigo-600">
                                  Open
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.loans.length > 0 && (
                          <div className="mb-2">
                            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Loans
                            </p>
                            {searchResults.loans.map((loan) => {
                              const borrower = getBorrowerById(
                                borrowers,
                                loan.borrowerId || loan.borrower_id || "",
                              );

                              return (
                                <button
                                  key={loan.id}
                                  type="button"
                                  onClick={() => handleNavigate("loans")}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                                >
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {borrower?.name || "Unknown borrower"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Loan #{loan.id.slice(-6)} -{" "}
                                      {formatCurrency(loan.amount)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-indigo-600">
                                    Open
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {searchResults.repayments.length > 0 && (
                          <div>
                            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Repayments
                            </p>
                            {searchResults.repayments.map((repayment) => (
                              <button
                                key={repayment.id}
                                type="button"
                                onClick={() => handleNavigate("repayments")}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                              >
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {formatCurrency(repayment.amount)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(repayment.date)} -{" "}
                                    {repayment.method}
                                  </p>
                                </div>
                                <span className="text-xs text-indigo-600">
                                  Open
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((open) => !open)}
              className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {notifications.length > 0 && (
                <>
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {Math.min(notifications.length, 9)}
                  </span>
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
                </>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="fixed left-3 right-3 top-16 z-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[24rem]">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Stay on top of collections, renewals, and account tasks.
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    You're all caught up. No urgent alerts right now.
                  </div>
                ) : (
                  <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          notification.action();
                          setIsNotificationsOpen(false);
                        }}
                        className="mb-2 w-full rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-800">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {notification.body}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-xs font-medium text-indigo-600">
                            {notification.actionLabel}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            ref={profileMenuRef}
            className="relative border-l border-gray-200 pl-2 sm:pl-4"
          >
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-2xl border border-transparent bg-white px-2 py-1.5 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:gap-3 sm:px-3"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open account menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm sm:h-10 sm:w-10">
                {getUserInitials(user?.email)}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate font-medium text-gray-800">{userName}</p>
                <p className="text-sm text-gray-500">LendSmart Account</p>
              </div>
              <ChevronDown
                className={`hidden h-4 w-4 text-gray-400 transition-transform md:block ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 z-20 mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-sm">
                      {getUserInitials(user?.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{userName}</p>
                      <p className="truncate text-sm text-indigo-100">
                        {user?.email || "No email available"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-indigo-500" />
                    Account settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onSignOut?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
