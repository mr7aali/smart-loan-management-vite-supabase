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
import {
  supabase,
  auth,
  adminApi,
  adminWorkspaceApi,
  db,
  teamApi,
  workspaceApprovalsApi,
} from "./lib/supabase";
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
import ResetPasswordPage from "./components/ResetPasswordPage";
import SubscriptionPage from "./components/SubscriptionPage";
import WorkspaceUsersPage from "./components/WorkspaceUsersPage";
import WorkspaceApprovalsPage from "./components/WorkspaceApprovalsPage";
import EmailVerificationNotice from "./components/EmailVerificationNotice";
import PayPalCheckoutPage from "./components/PayPalCheckoutPage";
import AdminOverview from "./components/AdminOverview";
import AdminUsersPage from "./components/AdminUsersPage";
import AdminWorkspacesPage from "./components/AdminWorkspacesPage";
import TermsOfServicePage from "./components/TermsOfServicePage";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage";
import { useIsMobile } from "./hooks/use-mobile";
import {
  AdminManagedUser,
  AdminOverviewData,
  AdminWorkspaceSummary,
  ApprovalStatus,
  Borrower,
  Loan,
  OrganizationMember,
  OrganizationWorkspace,
  Repayment,
  Subscription,
  UserProfile,
  WorkspaceApprovalItem,
  WorkspaceAuditEvent,
} from "./types";
import {
  isPaidSubscriptionPlanId,
  SUBSCRIPTION_PLANS_BY_ID,
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
  "admin-workspaces",
  "workspace-users",
  "workspace-approvals",
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
  "admin-workspaces": "/admin/workspaces",
  "workspace-users": "/workspace/users",
  "workspace-approvals": "/workspace/approvals",
};

const THEME_STORAGE_KEY = "lendsmart-theme";

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  let savedTheme: string | null = null;

  try {
    savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    savedTheme = null;
  }

  if (savedTheme === "dark") {
    return true;
  }

  if (savedTheme === "light") {
    return false;
  }

  return Boolean(
    window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
}

function isAppSection(value: string | null): value is AppSection {
  return value !== null && APP_SECTIONS.includes(value as AppSection);
}

function getSectionFromPathname(pathname: string): AppSection {
  const [, firstSegment, secondSegment] = pathname.split("/");

  if (firstSegment === "subscription") {
    return "subscription";
  }

  if (firstSegment === "admin") {
    if (secondSegment === "users") return "admin-users";
    if (secondSegment === "workspaces") return "admin-workspaces";
    return "admin-overview";
  }

  if (firstSegment === "workspace") {
    return secondSegment === "approvals"
      ? "workspace-approvals"
      : "workspace-users";
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
  const [addingBorrower, setAddingBorrower] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [workspace, setWorkspace] = useState<OrganizationWorkspace | null>(
    null,
  );
  const [teamMembers, setTeamMembers] = useState<OrganizationMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [changingSubscriptionPlan, setChangingSubscriptionPlan] =
    useState<SubscriptionPlanId | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [workspaceApprovals, setWorkspaceApprovals] = useState<
    WorkspaceApprovalItem[]
  >([]);
  const [workspaceAuditEvents, setWorkspaceAuditEvents] = useState<
    WorkspaceAuditEvent[]
  >([]);
  const [workspaceActivityLoading, setWorkspaceActivityLoading] =
    useState(false);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewData | null>(
    null,
  );
  const [adminUsers, setAdminUsers] = useState<AdminManagedUser[]>([]);
  const [adminWorkspaces, setAdminWorkspaces] = useState<
    AdminWorkspaceSummary[]
  >([]);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminWorkspacesLoading, setAdminWorkspacesLoading] = useState(false);
  const activeSection = getSectionFromPathname(location.pathname);
  const isAdmin = profile?.role === "admin";
  const activePlan: SubscriptionPlanId =
    subscription?.plan || profile?.plan || "free";
  const canManageTeam =
    workspace?.currentUserRole === "owner" || workspace?.currentUserRole === "admin";
  const isWorkspaceOwner = workspace?.currentUserRole === "owner";
  const ownerHasTeamMembers = isWorkspaceOwner && teamMembers.length > 1;
  const canInitiateBorrowerLoanChanges =
    Boolean(workspace?.id) && !ownerHasTeamMembers;
  const approvedBorrowers = borrowers.filter(
    (borrower) => (borrower.approval_status || "approved") === "approved",
  );
  const approvedLoans = loans.filter(
    (loan) => (loan.approval_status || "approved") === "approved",
  );
  const showWorkspaceManagement = activePlan !== "free";
  const activeCurrency = normalizeCurrency(
    profile?.currency || DEFAULT_CURRENCY,
  );
  const hasOverlayOpen =
    sidebarOpen ||
    showAddBorrower ||
    showAddLoan ||
    showAddRepayment ||
    showEmailVerification;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        darkMode ? "dark" : "light",
      );
    } catch {
      // Theme still applies for the active session if persistence is blocked.
    }
  }, [darkMode]);

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

  const loadData = async (organizationId: string) => {
    try {
      const [borrowersResult, loansResult, repaymentsResult] =
        await Promise.all([
          db.getBorrowers(organizationId),
          db.getLoans(organizationId),
          db.getRepayments(organizationId),
        ]);

      setBorrowers((borrowersResult.data || []).map(normalizeBorrower));
      setLoans((loansResult.data || []).map(normalizeLoan));
      setRepayments((repaymentsResult.data || []).map(normalizeRepayment));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadSubscription = async (organizationId: string) => {
    const { data } = await db.getSubscription(organizationId);
    setSubscription(data || null);
  };

  const loadWorkspace = async () => {
    setTeamLoading(true);
    try {
      const { data, error } = await teamApi.getMembers();
      if (error) throw error;

      const nextWorkspace =
        (data?.workspace as OrganizationWorkspace | undefined) || null;
      setWorkspace(nextWorkspace);
      setTeamMembers((data?.members as OrganizationMember[] | undefined) || []);
      return nextWorkspace;
    } catch (error) {
      console.error("Error loading team workspace:", error);
      setWorkspace(null);
      setTeamMembers([]);
      return null;
    } finally {
      setTeamLoading(false);
    }
  };

  const loadWorkspaceActivity = async (organizationId = workspace?.id) => {
    if (!organizationId) {
      setWorkspaceApprovals([]);
      setWorkspaceAuditEvents([]);
      return;
    }

    setWorkspaceActivityLoading(true);
    try {
      const [borrowersResult, loansResult, auditResult] = await Promise.all([
        db.getApprovalBorrowers(organizationId),
        db.getApprovalLoans(organizationId),
        db.getAuditEvents(organizationId),
      ]);

      if (borrowersResult.error) throw borrowersResult.error;
      if (loansResult.error) throw loansResult.error;

      const approvalRows = [
        ...((borrowersResult.data || []) as Borrower[]),
        ...((loansResult.data || []) as Loan[]),
      ];
      const auditRows = auditResult.error ? [] : auditResult.data || [];
      const profileIds = Array.from(
        new Set(
          [
            ...approvalRows.flatMap((item) => [
              item.initiated_by,
              item.authorized_by,
            ]),
            ...auditRows.flatMap((event: any) => [
              event.actor_user_id,
              event.target_user_id,
            ]),
          ].filter(Boolean) as string[],
        ),
      );
      const profilesResult = await db.getProfilesByIds(profileIds);
      const profileById = new Map(
        ((profilesResult.data || []) as Array<{
          id: string;
          email: string | null;
          full_name: string | null;
        }>).map((profile) => [profile.id, profile]),
      );
      const getUserSummary = (userId?: string | null) => {
        if (!userId) return null;
        const member = teamMembers.find((item) => item.user_id === userId);
        const profile = profileById.get(userId);
        const email = member?.email || profile?.email || "No email";

        return {
          id: userId,
          name:
            member?.fullName ||
            profile?.full_name ||
            email.split("@")[0] ||
            "Unknown user",
          email,
        };
      };

      const borrowerApprovals: WorkspaceApprovalItem[] = (
        (borrowersResult.data || []) as Borrower[]
      ).map((borrower) => ({
        id: borrower.id,
        type: "borrower",
        name: borrower.name,
        status: borrower.approval_status || "approved",
        initiatedAt: borrower.initiated_at || borrower.created_at,
        initiatedBy: getUserSummary(borrower.initiated_by || borrower.user_id),
        authorizedAt: borrower.authorized_at,
        authorizedBy: getUserSummary(borrower.authorized_by),
        rejectionReason: borrower.rejection_reason,
      }));

      const loanApprovals: WorkspaceApprovalItem[] = (
        (loansResult.data || []) as Loan[]
      ).map((loan) => {
        const loanBorrower = Array.isArray(loan.borrowers)
          ? loan.borrowers[0]
          : loan.borrowers;

        return {
          id: loan.id,
          type: "loan",
          name: `Loan ${loan.id.slice(-6)}`,
          amount: loan.amount,
          borrowerName: loanBorrower?.name || "Unknown borrower",
          status: loan.approval_status || "approved",
          initiatedAt: loan.initiated_at || loan.created_at,
          initiatedBy: getUserSummary(loan.initiated_by || loan.user_id),
          authorizedAt: loan.authorized_at,
          authorizedBy: getUserSummary(loan.authorized_by),
          rejectionReason: loan.rejection_reason,
        };
      });

      setWorkspaceApprovals(
        [...borrowerApprovals, ...loanApprovals].sort((first, second) => {
          const firstTime = new Date(first.initiatedAt || "").getTime() || 0;
          const secondTime = new Date(second.initiatedAt || "").getTime() || 0;
          return secondTime - firstTime;
        }),
      );

      setWorkspaceAuditEvents(
        auditRows.map((event: any) => ({
          id: event.id,
          organization_id: event.organization_id,
          entityType: event.entity_type,
          entityId: event.entity_id,
          action: event.action,
          details: event.details || {},
          actor: getUserSummary(event.actor_user_id),
          target: getUserSummary(event.target_user_id),
          createdAt: event.created_at,
        })),
      );
    } catch (error) {
      console.error("Error loading workspace approval activity:", error);
      setWorkspaceApprovals([]);
      setWorkspaceAuditEvents([]);
    } finally {
      setWorkspaceActivityLoading(false);
    }
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

  const hydrateUserData = async (userId: string) => {
    await loadProfile(userId);
    const nextWorkspace = await loadWorkspace();

    if (nextWorkspace?.id) {
      await Promise.all([
        loadData(nextWorkspace.id),
        loadSubscription(nextWorkspace.id),
        loadWorkspaceActivity(nextWorkspace.id),
      ]);
    } else {
      setBorrowers([]);
      setLoans([]);
      setRepayments([]);
      setSubscription(null);
      setWorkspaceApprovals([]);
      setWorkspaceAuditEvents([]);
    }
  };

  const getPlanLimitViolation = (
    planId: SubscriptionPlanId,
    nextBorrowerCount: number,
    nextLoanCount: number,
    nextUserCount = teamMembers.length,
  ) => {
    const plan = SUBSCRIPTION_PLANS_BY_ID[planId];

    if (plan.maxUsers !== null && nextUserCount > plan.maxUsers) {
      return `The ${plan.name} plan allows up to ${plan.maxUsers} user${
        plan.maxUsers === 1 ? "" : "s"
      }.`;
    }

    if (
      plan.maxBorrowers !== null &&
      nextBorrowerCount > plan.maxBorrowers
    ) {
      return `The ${plan.name} plan allows up to ${plan.maxBorrowers} borrowers.`;
    }

    if (plan.maxLoans !== null && nextLoanCount > plan.maxLoans) {
      return `The ${plan.name} plan allows up to ${plan.maxLoans} loans.`;
    }

    return null;
  };

  const showPlanLimitAlert = (message: string) => {
    alert(`${message} Upgrade your subscription to continue.`);
    navigate("/subscription");
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

    auth.getCurrentUser().then(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await hydrateUserData(currentUser.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription: authSubscription },
    } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void hydrateUserData(session.user.id);

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
        setWorkspace(null);
        setTeamMembers([]);
        setWorkspaceApprovals([]);
        setWorkspaceAuditEvents([]);
        setAdminOverview(null);
        setAdminUsers([]);
        setAdminWorkspaces([]);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!workspace?.id) return;

    const refreshUserData = () => {
      void loadData(workspace.id);
      void loadSubscription(workspace.id);
      void loadWorkspaceActivity(workspace.id);
    };

    const borrowersChannel = supabase
      .channel(`borrowers-changes-${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "borrowers",
          filter: `organization_id=eq.${workspace.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    const loansChannel = supabase
      .channel(`loans-changes-${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
          filter: `organization_id=eq.${workspace.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    const repaymentsChannel = supabase
      .channel(`repayments-changes-${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repayments",
          filter: `organization_id=eq.${workspace.id}`,
        },
        refreshUserData,
      )
      .subscribe();

    return () => {
      borrowersChannel.unsubscribe();
      loansChannel.unsubscribe();
      repaymentsChannel.unsubscribe();
    };
  }, [workspace?.id]);

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

    if (location.pathname.startsWith("/admin/workspaces")) {
      void loadAdminWorkspaces();
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

  const loadAdminWorkspaces = async () => {
    setAdminWorkspacesLoading(true);
    try {
      const { data, error } = await adminWorkspaceApi.list();
      if (error) throw error;
      setAdminWorkspaces(data?.workspaces || []);
    } catch (error) {
      console.error("Error loading admin workspaces:", error);
      alert(
        error instanceof Error
          ? `Failed to load workspace data: ${error.message}`
          : "Failed to load workspace data.",
      );
    } finally {
      setAdminWorkspacesLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      const { data, error } = await auth.requestPasswordReset(email);

      if (
        error?.message?.includes("rate") ||
        error?.message?.includes("429") ||
        error?.message?.includes("try again later")
      ) {
        throw new Error("Too many requests. Please wait a few minutes and try again.");
      }

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const handleUpdatePassword = async (password: string) => {
    const { data, error } = await auth.updatePassword(password);
    if (error) throw error;
    return data;
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    setBorrowers([]);
    setLoans([]);
    setRepayments([]);
    setSubscription(null);
    setProfile(null);
    setWorkspace(null);
    setTeamMembers([]);
    setWorkspaceApprovals([]);
    setWorkspaceAuditEvents([]);
    setAdminOverview(null);
    setAdminUsers([]);
    setAdminWorkspaces([]);
    setShowEmailVerification(false);
    navigate("/dashboard", { replace: true });
  };

  const handleAddBorrower = async (borrower: Omit<Borrower, "id">) => {
    if (!user || !workspace?.id) return;
    if (addingBorrower) return;

    setAddingBorrower(true);
    try {
      if (!canInitiateBorrowerLoanChanges) {
        alert(
          "Workspace owners review member changes. Ask a member to initiate the borrower, then approve it from Workspace Approvals.",
        );
        setShowAddBorrower(false);
        return;
      }

      const planLimitViolation = getPlanLimitViolation(
        activePlan,
        borrowers.length + 1,
        loans.length,
      );

      if (planLimitViolation) {
        showPlanLimitAlert(planLimitViolation);
        return;
      }

      const nowIso = new Date().toISOString();
      const approvalStatus: ApprovalStatus =
        isWorkspaceOwner && teamMembers.length <= 1 ? "approved" : "pending";
      const { data, error } = await db.addBorrower(user.id, workspace.id, {
        name: borrower.name,
        email: borrower.email,
        phone: borrower.phone,
        address: borrower.address,
        notes: borrower.notes,
        approval_status: approvalStatus,
        initiated_by: user.id,
        initiated_at: nowIso,
        authorized_by: approvalStatus === "approved" ? user.id : null,
        authorized_at: approvalStatus === "approved" ? nowIso : null,
      });
      if (error) throw error;
      if (data) {
        setBorrowers((prev) => [normalizeBorrower(data), ...prev]);
        try {
          await workspaceApprovalsApi.recordInitiated("borrower", data.id, {
            name: borrower.name,
            approvalStatus,
          });
        } catch (auditError) {
          console.warn("Unable to record borrower initiation audit:", auditError);
        }
        await loadWorkspaceActivity(workspace.id);
      }
      setShowAddBorrower(false);
      if (approvalStatus === "pending") {
        alert("Borrower initiated and sent to the workspace owner for approval.");
      }
    } catch (error) {
      console.error("Error adding borrower:", error);
      alert("Failed to add borrower");
    } finally {
      setAddingBorrower(false);
    }
  };

  const handleAddLoan = async (loan: Omit<Loan, "id">) => {
    if (!user || !workspace?.id) return;
    if (!canInitiateBorrowerLoanChanges) {
      alert(
        "Workspace owners review member changes. Ask a member to initiate the loan, then approve it from Workspace Approvals.",
      );
      setShowAddLoan(false);
      return;
    }

    const planLimitViolation = getPlanLimitViolation(
      activePlan,
      borrowers.length,
      loans.length + 1,
    );

    if (planLimitViolation) {
      showPlanLimitAlert(planLimitViolation);
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const approvalStatus: ApprovalStatus =
        isWorkspaceOwner && teamMembers.length <= 1 ? "approved" : "pending";
      const { data, error } = await db.addLoan(user.id, workspace.id, {
        borrower_id: loan.borrowerId,
        amount: loan.amount,
        interest_rate: loan.interestRate,
        term_months: loan.termMonths,
        start_date: loan.startDate,
        due_date: loan.dueDate,
        status: "active",
        notes: loan.notes,
        approval_status: approvalStatus,
        initiated_by: user.id,
        initiated_at: nowIso,
        authorized_by: approvalStatus === "approved" ? user.id : null,
        authorized_at: approvalStatus === "approved" ? nowIso : null,
      });
      if (error) throw error;
      if (data) {
        const borrower = approvedBorrowers.find((b) => b.id === loan.borrowerId);
        setLoans((prev) => [
          normalizeLoan({ ...data, borrowers: borrower }),
          ...prev,
        ]);
        try {
          await workspaceApprovalsApi.recordInitiated("loan", data.id, {
            borrowerId: loan.borrowerId,
            amount: loan.amount,
            approvalStatus,
          });
        } catch (auditError) {
          console.warn("Unable to record loan initiation audit:", auditError);
        }
        await loadWorkspaceActivity(workspace.id);
      }
      setShowAddLoan(false);
      if (approvalStatus === "pending") {
        alert("Loan initiated and sent to the workspace owner for approval.");
      }
    } catch (error) {
      console.error("Error adding loan:", error);
      alert("Failed to add loan");
    }
  };

  const handleAddRepayment = async (repayment: Omit<Repayment, "id">) => {
    if (!user || !workspace?.id) return;
    try {
      const { data, error } = await db.addRepayment(user.id, workspace.id, {
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

    if (!canManageTeam) {
      alert("Only a workspace owner or admin can change the subscription plan.");
      return;
    }

    if (plan === activePlan) {
      return;
    }

    const planLimitViolation = getPlanLimitViolation(
      plan,
      borrowers.length,
      loans.length,
    );

    if (planLimitViolation) {
      alert(
        `You cannot switch to the ${SUBSCRIPTION_PLANS_BY_ID[plan].name} plan yet. ${planLimitViolation}`,
      );
      return;
    }

    if (!isPaidSubscriptionPlanId(plan)) {
      setChangingSubscriptionPlan(plan);
      try {
        const { data, error } = await supabase.functions.invoke(
          "subscription-manage",
          {
            body: { plan },
          },
        );

        if (error || !data?.subscription) {
          throw error || new Error("Subscription update failed.");
        }

        setSubscription(data.subscription as Subscription);
        await loadProfile(user.id);
        await loadWorkspace();
        navigate("/subscription", { replace: true });
        alert(`You are now on the ${SUBSCRIPTION_PLANS_BY_ID[plan].name} plan.`);
      } catch (error) {
        console.error("Error changing subscription:", error);
        alert(
          error instanceof Error
            ? error.message
            : `Failed to switch to the ${SUBSCRIPTION_PLANS_BY_ID[plan].name} plan.`,
        );
      } finally {
        setChangingSubscriptionPlan(null);
      }
      return;
    }

    const isUpgrade = SUBSCRIPTION_PLANS_BY_ID[plan].price >
      SUBSCRIPTION_PLANS_BY_ID[activePlan].price;

    if (isUpgrade) {
      navigate(`/subscription/checkout/${plan}`);
      return;
    }

    setChangingSubscriptionPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke(
        "subscription-manage",
        {
          body: { plan },
        },
      );

      if (error || !data?.subscription) {
        throw error || new Error("Subscription update failed.");
      }

      setSubscription(data.subscription as Subscription);
      await loadProfile(user.id);
      await loadWorkspace();
      navigate("/subscription", { replace: true });
      alert(`You are now on the ${SUBSCRIPTION_PLANS_BY_ID[plan].name} plan.`);
    } catch (error) {
      console.error("Error changing subscription:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to switch to the ${SUBSCRIPTION_PLANS_BY_ID[plan].name} plan.`,
      );
    } finally {
      setChangingSubscriptionPlan(null);
    }
  };

  const handleCheckoutSuccess = (nextSubscription: Subscription) => {
    setSubscription(nextSubscription);
    if (user?.id) {
      void loadProfile(user.id);
      void loadWorkspace();
    }
    navigate("/subscription", { replace: true });
  };

  const handleAddTeamMember = async (email: string) => {
    if (!canManageTeam) {
      throw new Error("Only a workspace owner or admin can add members.");
    }

    const planLimitViolation = getPlanLimitViolation(
      activePlan,
      borrowers.length,
      loans.length,
      teamMembers.length + 1,
    );

    if (planLimitViolation) {
      throw new Error(`${planLimitViolation} Upgrade your subscription to add more members.`);
    }

    const { error } = await teamApi.addMember(email);
    if (error) {
      throw error;
    }

    await loadWorkspace();
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!canManageTeam) {
      throw new Error("Only a workspace owner or admin can remove members.");
    }

    const { error } = await teamApi.removeMember(memberId);
    if (error) {
      throw error;
    }

    await loadWorkspace();
  };

  const handleReviewWorkspaceApproval = async (
    entityType: "borrower" | "loan",
    entityId: string,
    nextStatus: Exclude<ApprovalStatus, "pending">,
    reason?: string,
  ) => {
    const reviewedAt = new Date().toISOString();
    const fullUpdatePayload = {
      approval_status: nextStatus,
      authorized_by: user?.id,
      authorized_at: reviewedAt,
      rejection_reason:
        nextStatus === "rejected"
          ? reason || "Rejected by workspace owner."
          : null,
    };
    const runDirectUpdate = (payload: Record<string, unknown>) =>
      entityType === "borrower"
        ? db.updateBorrower(entityId, payload)
        : db.updateLoan(entityId, payload);

    let directResult = await runDirectUpdate(fullUpdatePayload);

    if (directResult.error) {
      const message = directResult.error.message || "";
      const columnMissing =
        directResult.error.code === "42703" ||
        directResult.error.code === "PGRST204" ||
        message.includes("authorized_by") ||
        message.includes("authorized_at") ||
        message.includes("rejection_reason");

      if (!columnMissing) {
        const functionResult = await workspaceApprovalsApi.review(
          entityType,
          entityId,
          nextStatus,
          reason,
        );
        if (functionResult.error) {
          throw directResult.error;
        }
      } else {
        directResult = await runDirectUpdate({ approval_status: nextStatus });
        if (directResult.error) {
          throw directResult.error;
        }
      }
    }

    if (workspace?.id) {
      await Promise.all([
        loadData(workspace.id),
        loadWorkspaceActivity(workspace.id),
      ]);
    } else {
      await loadWorkspaceActivity();
    }
  };

  const handleAdminAddWorkspaceMember = async (
    organizationId: string,
    email: string,
  ) => {
    const { data, error } = await adminWorkspaceApi.addMember(
      organizationId,
      email,
    );
    if (error) throw error;
    setAdminWorkspaces(
      (data?.workspaces as AdminWorkspaceSummary[] | undefined) || [],
    );
  };

  const handleAdminRemoveWorkspaceMember = async (
    organizationId: string,
    memberId: string,
  ) => {
    const { data, error } = await adminWorkspaceApi.removeMember(
      organizationId,
      memberId,
    );
    if (error) throw error;
    setAdminWorkspaces(
      (data?.workspaces as AdminWorkspaceSummary[] | undefined) || [],
    );
  };

  const handleAdminWorkspaceRoleChange = async (
    organizationId: string,
    memberId: string,
    role: OrganizationMember["role"],
  ) => {
    const { data, error } = await adminWorkspaceApi.changeRole(
      organizationId,
      memberId,
      role,
    );
    if (error) throw error;
    setAdminWorkspaces(
      (data?.workspaces as AdminWorkspaceSummary[] | undefined) || [],
    );
  };

  const handleOpenAddBorrower = () => {
    if (!canInitiateBorrowerLoanChanges) {
      alert(
        "Workspace owners with team members approve changes instead of initiating them. Use Workspace Approvals to review member requests.",
      );
      navigate("/workspace/approvals");
      return;
    }

    const planLimitViolation = getPlanLimitViolation(
      activePlan,
      borrowers.length + 1,
      loans.length,
    );

    if (planLimitViolation) {
      showPlanLimitAlert(planLimitViolation);
      return;
    }

    setShowAddBorrower(true);
  };

  const handleOpenAddLoan = () => {
    if (!canInitiateBorrowerLoanChanges) {
      alert(
        "Workspace owners with team members approve changes instead of initiating them. Use Workspace Approvals to review member requests.",
      );
      navigate("/workspace/approvals");
      return;
    }

    const planLimitViolation = getPlanLimitViolation(
      activePlan,
      borrowers.length,
      loans.length + 1,
    );

    if (planLimitViolation) {
      showPlanLimitAlert(planLimitViolation);
      return;
    }

    setShowAddLoan(true);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (location.pathname === "/reset-password") {
    return <ResetPasswordPage onUpdatePassword={handleUpdatePassword} />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage onUpdatePassword={handleUpdatePassword} />}
        />
        <Route
          path="*"
          element={
            <AuthPage
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              onPasswordReset={handlePasswordReset}
            />
          }
        />
      </Routes>
    );
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
        showWorkspaceManagement={showWorkspaceManagement}
      />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen md:h-screen">
        <Header
          title={activeSection}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          borrowers={borrowers}
          loans={loans}
          repayments={repayments}
          currency={activeCurrency}
          subscription={subscription}
          onNavigateSection={handleSectionChange}
          onOpenSettings={() => handleSectionChange("settings")}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 min-h-0 p-3 overflow-auto sm:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  borrowers={approvedBorrowers}
                  currency={activeCurrency}
                  loans={approvedLoans}
                  repayments={repayments}
                />
              }
            />
            <Route
              path="/borrowers"
              element={
                <Borrowers
                  borrowers={borrowers}
                  loans={approvedLoans}
                  repayments={repayments}
                  currency={activeCurrency}
                  onAdd={handleOpenAddBorrower}
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
                  borrowers={approvedBorrowers}
                  currency={activeCurrency}
                  repayments={repayments}
                  onAdd={handleOpenAddLoan}
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
                  loans={approvedLoans.filter(
                    (loan) => loan.status === "active",
                  )}
                  borrowers={approvedBorrowers}
                  currency={activeCurrency}
                  onAdd={() => setShowAddRepayment(true)}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <Reports
                  borrowers={approvedBorrowers}
                  loans={approvedLoans}
                  repayments={repayments}
                  currency={activeCurrency}
                />
              }
            />
            <Route
              path="/subscription"
              element={
                <SubscriptionPage
                  currentPlan={activePlan}
                  changingPlan={changingSubscriptionPlan}
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
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route
              path="/settings"
              element={
        <Settings
          user={user}
          profile={profile}
                  borrowers={borrowers}
                  loans={loans}
                  repayments={repayments}
          onSignOut={handleSignOut}
          onUpdateCurrency={handleCurrencyChange}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((enabled) => !enabled)}
          subscription={subscription}
        />
              }
            />
            <Route
              path="/workspace/users"
              element={
                showWorkspaceManagement ? (
                  <WorkspaceUsersPage
                    workspace={workspace}
                    teamMembers={teamMembers}
                    teamLoading={teamLoading}
                    canManageTeam={canManageTeam}
                    currentPlan={activePlan}
                    onAddTeamMember={handleAddTeamMember}
                    onRemoveTeamMember={handleRemoveTeamMember}
                  />
                ) : (
                  <Navigate to="/subscription" replace />
                )
              }
            />
            <Route
              path="/workspace/approvals"
              element={
                showWorkspaceManagement ? (
                  <WorkspaceApprovalsPage
                    approvals={workspaceApprovals}
                    auditEvents={workspaceAuditEvents}
                    loading={workspaceActivityLoading}
                    currentUserRole={workspace?.currentUserRole}
                    currency={activeCurrency}
                    onRefresh={() => void loadWorkspaceActivity()}
                    onReview={handleReviewWorkspaceApproval}
                  />
                ) : (
                  <Navigate to="/subscription" replace />
                )
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
            <Route
              path="/admin/workspaces"
              element={
                isAdmin ? (
                  <AdminWorkspacesPage
                    workspaces={adminWorkspaces}
                    loading={adminWorkspacesLoading}
                    onRefresh={() => void loadAdminWorkspaces()}
                    onAddMember={handleAdminAddWorkspaceMember}
                    onRemoveMember={handleAdminRemoveWorkspaceMember}
                    onChangeRole={handleAdminWorkspaceRoleChange}
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
          borrowers={approvedBorrowers}
          currency={activeCurrency}
          onClose={() => setShowAddLoan(false)}
          onAdd={handleAddLoan}
        />
      )}

      {showAddRepayment && (
        <AddRepaymentModal
          loans={approvedLoans.filter((loan) => loan.status === "active")}
          borrowers={approvedBorrowers}
          currency={activeCurrency}
          onClose={() => setShowAddRepayment(false)}
          onAdd={handleAddRepayment}
        />
      )}
    </div>
  );
}

export default App;
