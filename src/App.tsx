import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, auth, db } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Borrowers from './components/Borrowers';
import Loans from './components/Loans';
import Repayments from './components/Repayments';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Help from './components/Help';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddBorrowerModal from './components/AddBorrowerModal';
import AddLoanModal from './components/AddLoanModal';
import AddRepaymentModal from './components/AddRepaymentModal';
import AuthPage from './components/AuthPage';
import SubscriptionPage from './components/SubscriptionPage';
import EmailVerificationNotice from './components/EmailVerificationNotice';
import { Borrower, Loan, Repayment } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddRepayment, setShowAddRepayment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [newlySignedUp, setNewlySignedUp] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signupError, setSignupError] = useState<string | null>(null);

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
      const [borrowersResult, loansResult, repaymentsResult] = await Promise.all([
        db.getBorrowers(userId),
        db.getLoans(userId),
        db.getRepayments(userId),
      ]);

      if (borrowersResult.data) setBorrowers(borrowersResult.data);
      if (loansResult.data) setLoans(loansResult.data);
      if (repaymentsResult.data) setRepayments(repaymentsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSubscription = async (userId: string) => {
    const { data } = await db.getSubscription(userId);
    setSubscription(data);
  };

  useEffect(() => {
    // Check for email confirmation in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'signup' || urlParams.get('confirmation') === 'true') {
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
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadData(session.user.id);
        loadSubscription(session.user.id);

        // Check if user just signed up (email not confirmed)
        if (event === 'SIGNED_IN' && session.user.email_confirmed_at === null) {
          setShowEmailVerification(true);
        }
      } else {
        setBorrowers([]);
        setLoans([]);
        setRepayments([]);
      }
    });

    // Real-time subscriptions for live updates
    let borrowersChannel: any;
    let loansChannel: any;
    let repaymentsChannel: any;

    if (supabase) {
      borrowersChannel = supabase
        .channel('borrowers-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'borrowers' },
          (payload) => {
            if (user) loadData(user.id);
          }
        )
        .subscribe();

      loansChannel = supabase
        .channel('loans-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'loans' },
          (payload) => {
            if (user) loadData(user.id);
          }
        )
        .subscribe();

      repaymentsChannel = supabase
        .channel('repayments-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'repayments' },
          (payload) => {
            if (user) loadData(user.id);
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (borrowersChannel) borrowersChannel.unsubscribe();
      if (loansChannel) loansChannel.unsubscribe();
      if (repaymentsChannel) repaymentsChannel.unsubscribe();
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (error) throw error;
    return data;
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    setSignupError(null);
    try {
      const { data, error } = await auth.signUp(email, password, name);

      // Handle rate limit error specifically
      if (error?.message?.includes('rate') || error?.message?.includes('429') || error?.message?.includes('try again later')) {
        setSignupError('Too many signup attempts. Please wait a few minutes and try again.');
        throw new Error('Rate limit exceeded');
      }

      if (error) throw error;

      // Show email verification notice for new users
      if (data.user && !data.user.email_confirmed_at) {
        setShowEmailVerification(true);
        setNewlySignedUp(true);
        // Start cooldown for resend button
        setCanResendEmail(false);
        setResendCooldown(60);
      }

      // Create free subscription for new users
      if (data.user) {
        try {
          await db.createSubscription({
            user_id: data.user.id,
            plan: 'free',
            status: 'active',
            billing_cycle: 'monthly',
            price: 0,
          });
        } catch (subError) {
          console.log('Subscription might already exist:', subError);
        }
      }
      return data;
    } catch (error: any) {
      if (error.message !== 'Rate limit exceeded') {
        console.error('Signup error:', error);
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
    setShowEmailVerification(false);
    setNewlySignedUp(false);
  };

  const handleAddBorrower = async (borrower: Omit<Borrower, 'id'>) => {
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
        setBorrowers(prev => [data, ...prev]);
      }
      setShowAddBorrower(false);
    } catch (error) {
      console.error('Error adding borrower:', error);
      alert('Failed to add borrower');
    }
  };

  const handleAddLoan = async (loan: Omit<Loan, 'id'>) => {
    if (!user) return;
    try {
      const { data, error } = await db.addLoan(user.id, {
        borrower_id: loan.borrowerId,
        amount: loan.amount,
        interest_rate: loan.interestRate,
        term_months: loan.termMonths,
        start_date: loan.startDate,
        due_date: loan.dueDate,
        status: 'active',
        notes: loan.notes,
      });
      if (error) throw error;
      if (data) {
        const borrower = borrowers.find(b => b.id === loan.borrowerId);
        setLoans(prev => [{ ...data, borrowers: borrower } as any, ...prev]);
      }
      setShowAddLoan(false);
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
    }
  };

  const handleAddRepayment = async (repayment: Omit<Repayment, 'id'>) => {
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
        const loan = loans.find(l => l.id === repayment.loanId);
        setRepayments(prev => [{ ...data, loans: loan } as any, ...prev]);

        // Update loan status
        setLoans(prev => prev.map(l => {
          if (l.id === repayment.loanId) {
            const loanRepayments = repayments.filter(r => r.loanId === l.id);
            const totalPaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0) + repayment.amount;
            const status: 'active' | 'paid' | 'overdue' = totalPaid >= l.amount ? 'paid' : 'active';
            return { ...l, status };
          }
          return l;
        }));
      }
      setShowAddRepayment(false);
    } catch (error) {
      console.error('Error adding repayment:', error);
      alert('Failed to add repayment');
    }
  };

  const handleDeleteBorrower = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this borrower? All associated loans will also be deleted.')) return;
    try {
      const { error } = await db.deleteBorrower(id);
      if (error) throw error;
      setBorrowers(prev => prev.filter(b => b.id !== id));
      setLoans(prev => prev.filter(l => l.borrower_id !== id));
    } catch (error) {
      console.error('Error deleting borrower:', error);
      alert('Failed to delete borrower');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      const { error } = await db.deleteLoan(id);
      if (error) throw error;
      setLoans(prev => prev.filter(l => l.id !== id));
      setRepayments(prev => prev.filter(r => r.loan_id !== id));
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan');
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
          status: 'active',
          price,
          end_date: endDate.toISOString(),
        });
      } else {
        await db.createSubscription({
          user_id: user.id,
          plan,
          status: 'active',
          billing_cycle: 'monthly',
          price,
          end_date: endDate.toISOString(),
        });
      }
      loadSubscription(user.id);
      alert(`Successfully upgraded to ${plan} plan! Redirecting to PayPal...`);

      // Redirect to PayPal for payment (mock - replace with actual PayPal URL)
      const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=YOUR_PAYPAL_EMAIL&item_name=LendSmart_${plan}&amount=${price}&currency_code=USD&return=${window.location.origin}&cancel_return=${window.location.origin}/subscription`;
      window.open(paypalUrl, '_blank');
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    if (!canResendEmail) {
      alert(`Please wait ${resendCooldown} seconds before trying again.`);
      return;
    }

    try {
      setCanResendEmail(false);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        // Check for rate limit
        if (error.message?.includes('rate') || error.message?.includes('429')) {
          alert('Too many requests. Please wait a few minutes and try again.');
        } else {
          alert('Failed to send verification email. Please try again later.');
        }
        throw error;
      }

      alert('Verification email sent! Please check your inbox.');
      // Start cooldown after successful resend
      setResendCooldown(60);
    } catch (error) {
      console.error('Error resending verification:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard borrowers={borrowers} loans={loans} repayments={repayments} />;
      case 'borrowers':
        return (
          <Borrowers
            borrowers={borrowers}
            loans={loans}
            onAdd={() => setShowAddBorrower(true)}
            onDelete={handleDeleteBorrower}
            onSelect={() => {}}
          />
        );
      case 'loans':
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
      case 'repayments':
        return (
          <Repayments
            repayments={repayments}
            loans={loans}
            onAdd={() => setShowAddRepayment(true)}
          />
        );
      case 'reports':
        return <Reports borrowers={borrowers} loans={loans} repayments={repayments} />;
      case 'subscription':
        return (
          <SubscriptionPage
            currentPlan={subscription?.plan || 'free'}
            onUpgrade={handleUpgradeSubscription}
          />
        );
      case 'help':
        return <Help />;
      case 'settings':
        return <Settings user={user} onSignOut={handleSignOut} subscription={subscription} />;
      default:
        return <Dashboard borrowers={borrowers} loans={loans} repayments={repayments} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          title={activeSection}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Email Verification Notice */}
      {showEmailVerification && user && !user.email_confirmed_at && (
        <EmailVerificationNotice
          email={user.email || ''}
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
          loans={loans.filter(l => l.status === 'active')}
          onClose={() => setShowAddRepayment(false)}
          onAdd={handleAddRepayment}
        />
      )}
    </div>
  );
}

export default App;