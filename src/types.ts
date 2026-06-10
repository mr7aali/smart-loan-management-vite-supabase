export interface Borrower {
  id: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

export interface Loan {
  id: string;
  user_id?: string;
  organization_id?: string;
  borrower_id?: string;
  borrowerId?: string;
  amount: number;
  interest_rate?: number;
  interestRate?: number;
  term_months?: number;
  termMonths?: number;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  status: 'active' | 'paid' | 'overdue';
  notes?: string;
  created_at?: string;
  createdAt?: string;
  borrowers?: Borrower;
}

export interface Repayment {
  id: string;
  user_id?: string;
  organization_id?: string;
  loan_id?: string;
  loanId?: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank_transfer' | 'upi' | 'other';
  notes?: string;
  created_at?: string;
  createdAt?: string;
  loans?: Loan;
}

export interface Reminder {
  id: string;
  loanId: string;
  type: 'auto' | 'manual';
  scheduledDate: string;
  sent: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  organization_id?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended";

export interface UserProfile {
  id: string;
  email: string | null;
  current_organization_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role: UserRole;
  account_status: AccountStatus;
  plan: Subscription["plan"];
  currency?: "USD" | "EUR" | "ZAR" | "LSL";
  max_borrowers?: number | null;
  max_loans?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type OrganizationMemberRole = "owner" | "admin" | "member";

export interface OrganizationWorkspace {
  id: string;
  name: string;
  owner_id: string;
  currentUserRole: OrganizationMemberRole;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  status: "active";
  email: string | null;
  fullName?: string | null;
  joined_at?: string | null;
  created_at?: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  provider: "paypal";
  provider_order_id?: string | null;
  provider_capture_id?: string | null;
  subscription_plan: Subscription["plan"];
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paid_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  adminUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  completedPayments: number;
  expiringSoon: number;
}

export interface AdminOverviewPayment {
  id: string;
  userId: string;
  name: string;
  email: string;
  amount: number;
  currency: string;
  status: PaymentRecord["status"];
  plan: Subscription["plan"];
  paidAt: string;
  captureId?: string | null;
}

export interface AdminExpiringSubscription {
  userId: string;
  name: string;
  email: string;
  plan: Subscription["plan"];
  status: Subscription["status"];
  endDate: string | null;
  daysRemaining: number | null;
}

export interface AdminPlanDistributionItem {
  plan: Subscription["plan"];
  users: number;
}

export interface AdminNewestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  joinedAt: string;
}

export interface AdminOverviewData {
  stats: AdminOverviewStats;
  recentPayments: AdminOverviewPayment[];
  expiringSubscriptions: AdminExpiringSubscription[];
  planDistribution: AdminPlanDistributionItem[];
  newestUsers: AdminNewestUser[];
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  joinedAt: string;
  plan: Subscription["plan"];
  limits: {
    maxBorrowers: number | null;
    maxLoans: number | null;
  };
  subscription: {
    plan: Subscription["plan"];
    status: Subscription["status"];
    billingCycle: Subscription["billing_cycle"];
    price: number;
    startDate?: string | null;
    endDate?: string | null;
    updatedAt?: string | null;
  } | null;
  payments: {
    totalCount: number;
    totalAmount: number;
    lastPaidAt?: string | null;
    lastAmount?: number | null;
    currency: string;
    lastPlan?: Subscription["plan"] | null;
  };
}
