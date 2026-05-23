export interface Borrower {
  id: string;
  user_id?: string;
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
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}