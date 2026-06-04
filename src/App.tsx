import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { supabase, auth, adminApi, db } from "./lib/supabase";
import Dashboard from "./components/Dashboard";
import Borrowers from "./components/Borrowers";
import Loans from "./components/Loans";
import Repayments from "./components/Repayments";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Help from "./components/Help";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AddBorrowerModal from "./components/AddBorrowerModal";
import AddLoanModal from "./components/AddLoanModal";
import AddRepaymentModal from "./components/AddRepaymentModal";
import AuthPage from "./components/AuthPage";
import SubscriptionPage from "./components/SubscriptionPage";
import EmailVerificationNotice from "./components/EmailVerificationNotice";
import PayPalCheckoutPage from "./components/PayPalCheckoutPage";
import AdminOverview from "./components/AdminOverview";
import AdminUsersPage from "./components/AdminUsersPage";
import { useIsMobile } from "./hooks/use-mobile";
import {
  AdminManagedUser,
  AdminOverviewData,
  Borrower,
  Loan,
  Repayment,
  Subscription,
  UserProfile,
} from "./types";
import {
  isPaidSubscriptionPlanId,
  SubscriptionPlanId,
  PaidSubscriptionPlanId,
} from "./lib/subscription-plans";
import {
  getLoanStatus,
  DEFAULT_CURRENCY,
  normalizeCurrency,
  normalizeBorrower,
  normalizeLoan,
  normalizeRepayment,
} from "./utils";

const APP_SECTIONS = [
  "dashboard",
  "borrowers",
  "loans",
  "repayments",
  "reports",
  "subscription",
  "help",
  "settings",
  "admin-overview",
  "admin-users",
] as const;

type AppSection = (typeof APP_SECTIONS)[number];

const SECTION_ROUTES: Record<AppSection, string> = {
  dashboard: "/dashboard",
  borrowers: "/borrowers",
  loans: "/loans",
  repayments: "/repayments",
  reports: "/reports",
  subscription: "/subscription",
  help: "/help",
  settings: "/settings",
  "admin-overview": "/admin/overview",
  "admin-users": "/admin/users",
};

function isAppSection(value: string | null): value is AppSection {
  return value !== null && APP_SECTIONS.includes(value as AppSection);
}

function getSectionFromPathname(pathname: string): AppSection {
  const [, firstSegment, secondSegment] = pathname.split("/");

  if (firstSegment === "subscription") {
    return "subscription";
  }

  if (firstSegment === "admin") {
    return secondSegment === "users" ? "admin-users" : "admin-overview";
  }

  if (isAppSection(firstSegment)) {
    return firstSegment;
  }

  return "dashboard";
}

interface SubscriptionCheckoutRouteProps {
  onBack: () => void;
  onSuccess: (subscription: Subscription) => void;
}

function SubscriptionCheckoutRoute({
  onBack,
  onSuccess,
}: SubscriptionCheckoutRouteProps) {
  const { planId } = useParams<{ planId: string }>();

  if (!planId || !isPaidSubscriptionPlanId(planId as SubscriptionPlanId)) {
    return <Navigate to="/subscription" replace />;
  }

  return (
    <PayPalCheckoutPage
      planId={planId as PaidSubscriptionPlanId}
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddRepayment, setShowAddRepayment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewData | null>(
    null,
  );
  const [adminUsers, setAdminUsers] = useState<AdminManagedUser[]>([]);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const activeSection = getSectionFromPathname(location.pathname);
  const isAdmin = profile?.role === "admin";
  const activeCurrency = normalizeCurrency(profile?.currency || DEFAULT_CURRENCY);
  const hasOverlayOpen =
    sidebarOpen ||
    showAddBorrower ||
    showAddLoan ||
    showAddRepayment ||
    showEmailVerification;

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
        if (resendCooldown <= 1) {
          setCanResendEmail(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = hasOverlayOpen ? "hidden" : originalOverflow;

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [hasOverlayOpen]);

  const loadData = async (userId: string) => {
    try {
      const [borrowersResult, loansResult, repaymentsResult] =
        await Promise.all([
          db.getBorrowers(userId),
          db.getLoans(userId),
          db.getRepayments(userId),
        ]);

      setBorrowers((borrowersResult.data || []).map(normalizeBorrower));
      setLoans((loansResult.data || []).map(normalizeLoan));
      setRepayments((repaymentsResult.data || []).map(normalizeRepayment));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadSubscription = async (userId: string) => {
    const { data } = await db.getSubscription(userId);
    setSubscription(data || null);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await db.getProfile(userId);
    const normalizedProfile = data
      ? ({
          ...(data as UserProfile),
          currency: normalizeCurrency((data as UserProfile).currency),
        } as UserProfile)
      : null;
    setProfile(normalizedProfile);
    return normalizedProfile;
  };

  const loadAdminOverview = async () => {
    setAdminOverviewLoading(true);
    try {
      const { data, error } = await adminApi.getOverview();
      if (error) throw error;
      setAdminOverview((data as AdminOverviewData) || null);
    } catch (error) {
      console.error("Error loading admin overview:", error);
      alert(
        error instanceof Error
          ? `Failed to load admin overview data: ${error.message}`
          : "Failed to load admin overview data.",
      );
    } finally {
      setAdminOverviewLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const { data, error } = await adminApi.getUsers();
      if (error) throw error;
      setAdminUsers((data?.users as AdminManagedUser[]) || []);
    } catch (error) {
      console.error("Error loading admin users:", error);
      alert(
        error instanceof Error
          ? `Failed to load admin user data: ${error.message}`
          : "Failed to load admin user data.",
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("type") === "signup" ||
      urlParams.get("confirmation") === "true"
    ) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        void loadData(currentUser.id);
        void loadSubscription(currentUser.id);
        void loadProfile(currentUser.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription: authSubscription },
    } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadData(session.user.id);
        void loadSubscription(session.user.id);
        void loadProfile(session.user.id);

        if (event === "SIGNED_IN" && session.user.email_confirmed_at === null) {
          setShowEmailVerification(true);
          setCanResendEmail(false);
          setResendCooldown(60);
        }
      } else {
        setBorrowers([]);
        setLoans([]);
        setRepayments([]);
        setSubscription(null);
        setProfile(null);
        setAdminOverview(null);
        setAdminUsers([]);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const refreshUserData = () => {
      void loadData(user.id);
      void loadSubscription(user.id);
    };

    const borrowersChannel = supabase
      .channel(`borrowers-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "borrowers",
          filter: `user_id=eq.${user.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    const loansChannel = supabase
      .channel(`loans-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
          filter: `user_id=eq.${user.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    const repaymentsChannel = supabase
      .channel(`repayments-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repayments",
          filter: `user_id=eq.${user.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    return () => {
      borrowersChannel.unsubscribe();
      loansChannel.unsubscribe();
      repaymentsChannel.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isAdmin) {
      return;
    }

    if (location.pathname.startsWith("/admin/overview")) {
      void loadAdminOverview();
    }

    if (location.pathname.startsWith("/admin/users")) {
      void loadAdminUsers();
    }
  }, [isAdmin, location.pathname, user?.id]);

  const handleSignIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (error) throw error;
    return data;
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name: string,
  ) => {
    try {
      const { data, error } = await auth.signUp(email, password, name);

      if (
        error?.message?.includes("rate") ||
        error?.message?.includes("429") ||
        error?.message?.includes("try again later")
      ) {
        throw new Error("Rate limit exceeded");
      }

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        setShowEmailVerification(true);
        setCanResendEmail(false);
        setResendCooldown(60);
      }

      return data;
    } catch (error: any) {
      if (error.message !== "Rate limit exceeded") {
        console.error("Signup error:", error);
      }
      throw error;
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    setBorrowers([]);
    setLoans([]);
    setRepayments([]);
    setSubscription(null);
    setProfile(null);
    setAdminOverview(null);
    setAdminUsers([]);
    setShowEmailVerification(false);
    navigate("/dashboard", { replace: true });
  };

  const handleAddBorrower = async (borrower: Omit<Borrower, "id">) => {
    if (!user) return;
    try {
      const { data, error } = await db.addBorrower(user.id, {
        name: borrower.name,
        email: borrower.email,
        phone: borrower.phone,
        address: borrower.address,
        notes: borrower.notes,
      });
      if (error) throw error;
      if (data) {
        setBorrowers((prev) => [normalizeBorrower(data), ...prev]);
      }
      setShowAddBorrower(false);
    } catch (error) {
      console.error("Error adding borrower:", error);
      alert("Failed to add borrower");
    }
  };

  const handleAddLoan = async (loan: Omit<Loan, "id">) => {
    if (!user) return;
    try {
      const { data, error } = await db.addLoan(user.id, {
        borrower_id: loan.borrowerId,
        amount: loan.amount,
        interest_rate: loan.interestRate,
        term_months: loan.termMonths,
        start_date: loan.startDate,
        due_date: loan.dueDate,
        status: "active",
        notes: loan.notes,
      });
      if (error) throw error;
      if (data) {
        const borrower = borrowers.find((b) => b.id === loan.borrowerId);
        setLoans((prev) => [
          normalizeLoan({ ...data, borrowers: borrower }),
          ...prev,
        ]);
      }
      setShowAddLoan(false);
    } catch (error) {
      console.error("Error adding loan:", error);
      alert("Failed to add loan");
    }
  };

  const handleAddRepayment = async (repayment: Omit<Repayment, "id">) => {
    if (!user) return;
    try {
      const { data, error } = await db.addRepayment(user.id, {
        loan_id: repayment.loanId,
        amount: repayment.amount,
        date: repayment.date,
        method: repayment.method,
        notes: repayment.notes,
      });
      if (error) throw error;
      if (data) {
        const loan = loans.find((l) => l.id === repayment.loanId);
        const normalizedRepayment = normalizeRepayment({
          ...data,
          loans: loan,
        });
        const nextRepayments = [normalizedRepayment, ...repayments];
        setRepayments((prev) => [normalizedRepayment, ...prev]);

        if (loan) {
          const nextStatus = getLoanStatus(loan, nextRepayments);
          const { data: updatedLoanData, error: loanUpdateError } =
            await db.updateLoan(loan.id, {
              status: nextStatus,
            });
          if (loanUpdateError) throw loanUpdateError;

          const normalizedLoan = normalizeLoan({
            ...(updatedLoanData || loan),
            borrowers: loan.borrowers,
            status: nextStatus,
          });
          setLoans((prev) =>
            prev.map((existingLoan) =>
              existingLoan.id === loan.id ? normalizedLoan : existingLoan,
            ),
          );
        }
      }
      setShowAddRepayment(false);
    } catch (error) {
      console.error("Error adding repayment:", error);
      alert("Failed to add repayment");
    }
  };

  const handleDeleteBorrower = async (id: string) => {
    if (!user) return;
    if (
      !confirm(
        "Are you sure you want to delete this borrower? All associated loans will also be deleted.",
      )
    ) {
      return;
    }

    try {
      const { error } = await db.deleteBorrower(id);
      if (error) throw error;
      setBorrowers((prev) => prev.filter((borrower) => borrower.id !== id));
      setLoans((prev) =>
        prev.filter(
          (loan) => loan.borrowerId !== id && loan.borrower_id !== id,
        ),
      );
    } catch (error) {
      console.error("Error deleting borrower:", error);
      alert("Failed to delete borrower");
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this loan?")) return;

    try {
      const { error } = await db.deleteLoan(id);
      if (error) throw error;
      setLoans((prev) => prev.filter((loan) => loan.id !== id));
      setRepayments((prev) =>
        prev.filter(
          (repayment) => repayment.loanId !== id && repayment.loan_id !== id,
        ),
      );
    } catch (error) {
      console.error("Error deleting loan:", error);
      alert("Failed to delete loan");
    }
  };

  const handleSubscriptionChange = async (plan: SubscriptionPlanId) => {
    if (!user) return;

    if (plan === "free") {
      try {
        const { data, error } = await supabase.functions.invoke(
          "subscription-manage",
          {
            body: { plan: "free" },
          },
        );

        if (error || !data?.subscription) {
          throw error || new Error("Subscription update failed.");
        }

        setSubscription(data.subscription as Subscription);
        navigate("/subscription", { replace: true });
        alert("You are now on the Free plan.");
      } catch (error) {
        console.error("Error downgrading subscription:", error);
        alert("Failed to switch to the Free plan.");
      }
      return;
    }

    if (!isPaidSubscriptionPlanId(plan)) {
      alert("Unsupported subscription plan.");
      return;
    }

    navigate(`/subscription/checkout/${plan}`);
  };

  const handleCheckoutSuccess = (nextSubscription: Subscription) => {
    setSubscription(nextSubscription);
    navigate("/subscription", { replace: true });
  };

  const handleCurrencyChange = async (currency: typeof activeCurrency) => {
    if (!user) return;

    try {
      const normalizedCurrency = normalizeCurrency(currency);
      const { data, error } = await db.updateProfile(user.id, {
        currency: normalizedCurrency,
      });

      if (error) throw error;

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              ...(data as Partial<UserProfile> | null),
              currency: normalizedCurrency,
            }
          : currentProfile,
      );

      alert("Currency preference updated.");
    } catch (error) {
      console.error("Error updating currency preference:", error);
      throw error;
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      throw new Error("Missing email address for verification.");
    }
    if (!canResendEmail) {
      throw new Error(
        `Please wait ${resendCooldown} seconds before trying again.`,
      );
    }

    try {
      setCanResendEmail(false);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        if (error.message?.includes("rate") || error.message?.includes("429")) {
          throw new Error(
            "Too many requests. Please wait a few minutes and try again.",
          );
        }
        throw new Error(
          "Failed to send verification email. Please try again later.",
        );
      }

      alert("Verification email sent! Please check your inbox.");
      setResendCooldown(60);
    } catch (error) {
      console.error("Error resending verification:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to resend verification email.");
    }
  };

  const handleSectionChange = (section: string) => {
    if (!isAppSection(section)) {
      return;
    }

    navigate(SECTION_ROUTES[section]);
  };

  const handleAdminUserUpdate = async (payload: {
    userId: string;
    role: UserProfile["role"];
    accountStatus: UserProfile["account_status"];
    plan: Subscription["plan"];
    subscriptionStatus: Subscription["status"];
    endDate: string | null;
  }) => {
    try {
      const { data, error } = await adminApi.updateUser({
        userId: payload.userId,
        role: payload.role,
        accountStatus: payload.accountStatus,
        plan: payload.plan,
        subscriptionStatus: payload.subscriptionStatus,
        endDate: payload.endDate,
      });

      if (error) {
        throw error;
      }

      const updatedUser = data?.user as AdminManagedUser | undefined;
      if (updatedUser) {
        setAdminUsers((prev) =>
          prev.map((userItem) =>
            userItem.id === updatedUser.id
              ? {
                  ...userItem,
                  ...updatedUser,
                  payments: userItem.payments,
                }
              : userItem,
          ),
        );

        if (updatedUser.id === user?.id) {
          await loadProfile(updatedUser.id);
          await loadSubscription(updatedUser.id);
        }
      }

      alert("User access updated successfully.");
    } catch (error) {
      console.error("Error updating admin user:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update the selected user.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onSignOut={handleSignOut}
        isAdmin={isAdmin}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:h-screen">
        <Header
          title={activeSection}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          borrowers={borrowers}
          loans={loans}
          repayments={repayments}
          subscription={subscription}
          onNavigateSection={handleSectionChange}
          onOpenSettings={() => handleSectionChange("settings")}
          onSignOut={handleSignOut}
        />
        <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  borrowers={borrowers}
                  currency={activeCurrency}
                  loans={loans}
                  repayments={repayments}
                />
              }
            />
            <Route
              path="/borrowers"
              element={
                <Borrowers
                  borrowers={borrowers}
                  loans={loans}
                  repayments={repayments}
                  onAdd={() => setShowAddBorrower(true)}
                  onDelete={handleDeleteBorrower}
                  onSelect={() => {}}
                />
              }
            />
            <Route
              path="/loans"
              element={
                <Loans
                  loans={loans}
                  borrowers={borrowers}
                  currency={activeCurrency}
                  repayments={repayments}
                  onAdd={() => setShowAddLoan(true)}
                  onDelete={handleDeleteLoan}
                  onSelect={() => {}}
                />
              }
            />
            <Route
              path="/repayments"
              element={
                <Repayments
                  repayments={repayments}
                  loans={loans}
                  borrowers={borrowers}
                  currency={activeCurrency}
                  onAdd={() => setShowAddRepayment(true)}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <Reports
                  borrowers={borrowers}
                  loans={loans}
                  repayments={repayments}
                />
              }
            />
            <Route
              path="/subscription"
              element={
                <SubscriptionPage
                  currentPlan={subscription?.plan || "free"}
                  onUpgrade={handleSubscriptionChange}
                />
              }
            />
            <Route
              path="/subscription/checkout/:planId"
              element={
                <SubscriptionCheckoutRoute
                  onBack={() => navigate("/subscription")}
                  onSuccess={handleCheckoutSuccess}
                />
              }
            />
            <Route path="/help" element={<Help />} />
            <Route
              path="/settings"
              element={
                <Settings
                  user={user}
                  profile={profile}
                  onSignOut={handleSignOut}
                  onUpdateCurrency={handleCurrencyChange}
                  subscription={subscription}
                />
              }
            />
            <Route
              path="/admin/overview"
              element={
                isAdmin ? (
                  <AdminOverview
                    data={adminOverview}
                    loading={adminOverviewLoading}
                    onRefresh={() => void loadAdminOverview()}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/admin/users"
              element={
                isAdmin ? (
                  <AdminUsersPage
                    users={adminUsers}
                    loading={adminUsersLoading}
                    onRefresh={() => void loadAdminUsers()}
                    onUpdateUser={handleAdminUserUpdate}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {showEmailVerification && user && !user.email_confirmed_at && (
        <EmailVerificationNotice
          email={user.email || ""}
          onDismiss={() => setShowEmailVerification(false)}
          onResend={handleResendVerification}
          cooldown={resendCooldown}
        />
      )}

      {showAddBorrower && (
        <AddBorrowerModal
          onClose={() => setShowAddBorrower(false)}
          onAdd={handleAddBorrower}
        />
      )}

      {showAddLoan && (
        <AddLoanModal
          borrowers={borrowers}
          currency={activeCurrency}
          onClose={() => setShowAddLoan(false)}
          onAdd={handleAddLoan}
        />
      )}

      {showAddRepayment && (
        <AddRepaymentModal
          loans={loans.filter((loan) => loan.status === "active")}
          borrowers={borrowers}
          currency={activeCurrency}
          onClose={() => setShowAddRepayment(false)}
          onAdd={handleAddRepayment}
        />
      )}
    </div>
  );
}

export default App;
