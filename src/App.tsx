import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, auth, db } from "./lib/supabase";
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
import { Borrower, Loan, Repayment, Subscription } from "./types";
import {
  getLoanStatus,
  normalizeBorrower,
  normalizeLoan,
  normalizeRepayment,
} from "./utils";

function App() {
  const paypalBusinessEmail = import.meta.env.VITE_PAYPAL_BUSINESS_EMAIL;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddRepayment, setShowAddRepayment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for email resend cooldown
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

  // Load data from Supabase
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

  useEffect(() => {
    // Check for email confirmation in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("type") === "signup" ||
      urlParams.get("confirmation") === "true"
    ) {
      // Email confirmation detected
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check current user
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadData(currentUser.id);
        loadSubscription(currentUser.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadData(session.user.id);
        loadSubscription(session.user.id);

        // Check if user just signed up (email not confirmed)
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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const refreshUserData = () => {
      loadData(user.id);
      loadSubscription(user.id);
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

      // Handle rate limit error specifically
      if (
        error?.message?.includes("rate") ||
        error?.message?.includes("429") ||
        error?.message?.includes("try again later")
      ) {
        throw new Error("Rate limit exceeded");
      }

      if (error) throw error;

      // Show email verification notice for new users
      if (data.user && !data.user.email_confirmed_at) {
        setShowEmailVerification(true);
        // Start cooldown for resend button
        setCanResendEmail(false);
        setResendCooldown(60);
      }

      // Create free subscription for new users
      if (data.user) {
        try {
          await db.createSubscription({
            user_id: data.user.id,
            plan: "free",
            status: "active",
            billing_cycle: "monthly",
            price: 0,
          });
        } catch (subError) {
          console.log("Subscription might already exist:", subError);
        }
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
    setShowEmailVerification(false);
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
    )
      return;
    try {
      const { error } = await db.deleteBorrower(id);
      if (error) throw error;
      setBorrowers((prev) => prev.filter((b) => b.id !== id));
      setLoans((prev) =>
        prev.filter((l) => l.borrowerId !== id && l.borrower_id !== id),
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
      setLoans((prev) => prev.filter((l) => l.id !== id));
      setRepayments((prev) =>
        prev.filter((r) => r.loanId !== id && r.loan_id !== id),
      );
    } catch (error) {
      console.error("Error deleting loan:", error);
      alert("Failed to delete loan");
    }
  };

  const handleUpgradeSubscription = async (plan: string, price: number) => {
    if (!user) return;
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      if (subscription) {
        await db.updateSubscription(subscription.id, {
          plan,
          status: "active",
          price,
          end_date: endDate.toISOString(),
        });
      } else {
        await db.createSubscription({
          user_id: user.id,
          plan,
          status: "active",
          billing_cycle: "monthly",
          price,
          end_date: endDate.toISOString(),
        });
      }
      loadSubscription(user.id);

      if (price > 0 && paypalBusinessEmail) {
        const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusinessEmail)}&item_name=${encodeURIComponent(`LendSmart_${plan}`)}&amount=${price}&currency_code=USD&return=${encodeURIComponent(window.location.origin)}&cancel_return=${encodeURIComponent(`${window.location.origin}/subscription`)}`;
        alert(
          `Successfully upgraded to ${plan} plan! Redirecting to PayPal...`,
        );
        window.open(paypalUrl, "_blank");
      } else {
        alert(
          `Successfully updated to the ${plan} plan. Add VITE_PAYPAL_BUSINESS_EMAIL to enable live checkout.`,
        );
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      alert("Failed to upgrade subscription");
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
      // Start cooldown after successful resend
      setResendCooldown(60);
    } catch (error) {
      console.error("Error resending verification:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to resend verification email.");
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

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <Dashboard
            borrowers={borrowers}
            loans={loans}
            repayments={repayments}
          />
        );
      case "borrowers":
        return (
          <Borrowers
            borrowers={borrowers}
            loans={loans}
            repayments={repayments}
            onAdd={() => setShowAddBorrower(true)}
            onDelete={handleDeleteBorrower}
            onSelect={() => {}}
          />
        );
      case "loans":
        return (
          <Loans
            loans={loans}
            borrowers={borrowers}
            repayments={repayments}
            onAdd={() => setShowAddLoan(true)}
            onDelete={handleDeleteLoan}
            onSelect={() => {}}
          />
        );
      case "repayments":
        return (
          <Repayments
            repayments={repayments}
            loans={loans}
            borrowers={borrowers}
            onAdd={() => setShowAddRepayment(true)}
          />
        );
      case "reports":
        return (
          <Reports
            borrowers={borrowers}
            loans={loans}
            repayments={repayments}
          />
        );
      case "subscription":
        return (
          <SubscriptionPage
            currentPlan={subscription?.plan || "free"}
            onUpgrade={handleUpgradeSubscription}
          />
        );
      case "help":
        return <Help />;
      case "settings":
        return (
          <Settings
            user={user}
            onSignOut={handleSignOut}
            subscription={subscription}
          />
        );
      default:
        return (
          <Dashboard
            borrowers={borrowers}
            loans={loans}
            repayments={repayments}
          />
        );
    }
  };

  return (
    <div className="flex max-h-screen min-h-screen bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onSignOut={handleSignOut}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title={activeSection}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      {/* Email Verification Notice */}
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
          onClose={() => setShowAddLoan(false)}
          onAdd={handleAddLoan}
        />
      )}

      {showAddRepayment && (
        <AddRepaymentModal
          loans={loans.filter((l) => l.status === "active")}
          borrowers={borrowers}
          onClose={() => setShowAddRepayment(false)}
          onAdd={handleAddRepayment}
        />
      )}
    </div>
  );
}

export default App;
