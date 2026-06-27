import { Loan, Repayment, Borrower } from './types';

export {
  DEFAULT_CURRENCY,
  formatCompactCurrency,
  formatCurrency,
  normalizeCurrency,
  SUPPORTED_CURRENCIES,
  type AppCurrency,
} from "./lib/currency";

export const formatDate = (date: string): string => {
  if (!date) return '-';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '-';
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateTotalInterest = (principal: number, rate: number, months: number): number => {
  if (principal <= 0 || rate <= 0 || months <= 0) return 0;
  return roundMoney(principal * (rate / 100));
};

export const calculateTotalPayable = (principal: number, rate: number, months: number): number => {
  if (principal <= 0) return 0;
  return roundMoney(principal + calculateTotalInterest(principal, rate, months));
};

export const calculateEMI = (principal: number, rate: number, months: number): number => {
  if (principal <= 0 || months <= 0) return 0;
  return roundMoney(calculateTotalPayable(principal, rate, months) / months);
};

export const normalizeBorrower = (borrower: Partial<Borrower> | null | undefined): Borrower => {
  return {
    id: borrower?.id || '',
    user_id: borrower?.user_id,
    name: borrower?.name || 'Unknown',
    email: borrower?.email || '',
    phone: borrower?.phone || '',
    address: borrower?.address,
    notes: borrower?.notes,
    organization_id: borrower?.organization_id,
    approval_status: borrower?.approval_status || 'approved',
    initiated_by: borrower?.initiated_by,
    initiated_at: borrower?.initiated_at,
    authorized_by: borrower?.authorized_by,
    authorized_at: borrower?.authorized_at,
    rejection_reason: borrower?.rejection_reason,
    created_at: borrower?.created_at || borrower?.createdAt,
    createdAt: borrower?.createdAt || borrower?.created_at,
  };
};

export const normalizeLoan = (loan: Partial<Loan> | null | undefined): Loan => {
  const normalizedBorrower = loan?.borrowers ? normalizeBorrower(loan.borrowers) : undefined;

  return {
    id: loan?.id || '',
    user_id: loan?.user_id,
    borrower_id: loan?.borrower_id || loan?.borrowerId || '',
    borrowerId: loan?.borrowerId || loan?.borrower_id || '',
    amount: loan?.amount || 0,
    interest_rate: loan?.interest_rate ?? loan?.interestRate ?? 0,
    interestRate: loan?.interestRate ?? loan?.interest_rate ?? 0,
    term_months: loan?.term_months ?? loan?.termMonths ?? 0,
    termMonths: loan?.termMonths ?? loan?.term_months ?? 0,
    start_date: loan?.start_date || loan?.startDate || '',
    startDate: loan?.startDate || loan?.start_date || '',
    due_date: loan?.due_date || loan?.dueDate || '',
    dueDate: loan?.dueDate || loan?.due_date || '',
    status: loan?.status || 'active',
    notes: loan?.notes,
    organization_id: loan?.organization_id,
    approval_status: loan?.approval_status || 'approved',
    initiated_by: loan?.initiated_by,
    initiated_at: loan?.initiated_at,
    authorized_by: loan?.authorized_by,
    authorized_at: loan?.authorized_at,
    rejection_reason: loan?.rejection_reason,
    created_at: loan?.created_at || loan?.createdAt,
    createdAt: loan?.createdAt || loan?.created_at,
    borrowers: normalizedBorrower,
  };
};

export const normalizeRepayment = (repayment: Partial<Repayment> | null | undefined): Repayment => {
  const normalizedLoan = repayment?.loans ? normalizeLoan(repayment.loans) : undefined;

  return {
    id: repayment?.id || '',
    user_id: repayment?.user_id,
    loan_id: repayment?.loan_id || repayment?.loanId || '',
    loanId: repayment?.loanId || repayment?.loan_id || '',
    amount: repayment?.amount || 0,
    date: repayment?.date || '',
    method: repayment?.method || 'cash',
    notes: repayment?.notes,
    created_at: repayment?.created_at || repayment?.createdAt,
    createdAt: repayment?.createdAt || repayment?.created_at,
    loans: normalizedLoan,
  };
};

// Helper to get loan's borrower ID (handles both formats)
export const getLoanBorrowerId = (loan: Loan): string => {
  return loan.borrowerId || loan.borrower_id || '';
};

// Helper to get loan's due date (handles both formats)
export const getLoanDueDate = (loan: Loan): string => {
  return loan.dueDate || loan.due_date || '';
};

// Helper to get loan's start date (handles both formats)
export const getLoanStartDate = (loan: Loan): string => {
  return loan.startDate || loan.start_date || '';
};

// Helper to get loan's amount
export const getLoanAmount = (loan: Loan): number => {
  return loan.amount || 0;
};

export const getLoanInterestRate = (loan: Loan): number => {
  return loan.interestRate ?? loan.interest_rate ?? 0;
};

export const getLoanTermMonths = (loan: Loan): number => {
  return loan.termMonths ?? loan.term_months ?? 0;
};

export const getLoanTotalInterest = (loan: Loan): number =>
  calculateTotalInterest(
    getLoanAmount(loan),
    getLoanInterestRate(loan),
    getLoanTermMonths(loan),
  );

export const getLoanTotalPayable = (loan: Loan): number =>
  calculateTotalPayable(
    getLoanAmount(loan),
    getLoanInterestRate(loan),
    getLoanTermMonths(loan),
  );

// Helper to get repayment's loan ID (handles both formats)
export const getRepaymentLoanId = (repayment: Repayment): string => {
  return repayment.loanId || repayment.loan_id || '';
};

export const getLoanStatus = (
  loan: Loan,
  repayments: Repayment[]
): 'active' | 'paid' | 'overdue' => {
  const totalPaid = repayments
    .filter((repayment) => getRepaymentLoanId(repayment) === loan.id)
    .reduce((sum, repayment) => sum + repayment.amount, 0);

  if (totalPaid >= getLoanTotalPayable(loan)) {
    return 'paid';
  }

  const dueDate = getLoanDueDate(loan);
  if (dueDate) {
    const parsedDueDate = new Date(dueDate);
    if (!Number.isNaN(parsedDueDate.getTime()) && parsedDueDate < new Date()) {
      return 'overdue';
    }
  }

  return 'active';
};

export const getLoanProgress = (loan: Loan, repayments: Repayment[]): number => {
  const loanId = loan.id;
  const totalPaid = repayments
    .filter(r => getRepaymentLoanId(r) === loanId)
    .reduce((sum, r) => sum + r.amount, 0);
  const totalPayable = getLoanTotalPayable(loan);
  return totalPayable > 0 ? Math.min((totalPaid / totalPayable) * 100, 100) : 0;
};

export const getRemainingAmount = (loan: Loan, repayments: Repayment[]): number => {
  const loanId = loan.id;
  const totalPaid = repayments
    .filter(r => getRepaymentLoanId(r) === loanId)
    .reduce((sum, r) => sum + r.amount, 0);
  return Math.max(roundMoney(getLoanTotalPayable(loan) - totalPaid), 0);
};

export const getBorrowerById = (borrowers: Borrower[], id: string): Borrower | undefined => {
  return borrowers.find(b => b.id === id);
};

export const getLoansByBorrower = (loans: Loan[], borrowerId: string): Loan[] => {
  return loans.filter(l => getLoanBorrowerId(l) === borrowerId);
};

export const getRepaymentsByLoan = (repayments: Repayment[], loanId: string): Repayment[] => {
  return repayments.filter(r => getRepaymentLoanId(r) === loanId);
};

export const getTotalPortfolioValue = (loans: Loan[]): number => {
  return loans.reduce((sum, l) => sum + getLoanAmount(l), 0);
};

export const getActiveLoansValue = (loans: Loan[]): number => {
  return loans.filter(l => l.status === 'active').reduce((sum, l) => sum + getLoanAmount(l), 0);
};

export const getOverdueLoans = (loans: Loan[]): Loan[] => {
  const today = new Date();
  return loans.filter((loan) => {
    if (loan.status === 'paid') return false;
    if (loan.status === 'overdue') return true;
    const dueDate = new Date(getLoanDueDate(loan));
    return !Number.isNaN(dueDate.getTime()) && dueDate < today;
  });
};

export const getUpcomingPayments = (loans: Loan[], days: number = 7): Loan[] => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return loans.filter(l => {
    if (l.status !== 'active') return false;
    const dueDate = new Date(getLoanDueDate(l));
    return dueDate >= today && dueDate <= futureDate;
  });
};

export const getBorrowerStats = (borrowers: Borrower[], loans: Loan[], repayments: Repayment[]) => {
  return {
    totalBorrowers: borrowers.length,
    activeLoans: loans.filter(l => l.status === 'active').length,
    totalDisbursed: getTotalPortfolioValue(loans),
    totalCollected: repayments.reduce((sum, r) => sum + r.amount, 0),
    overdueLoans: getOverdueLoans(loans).length,
  };
};

// Helper to get borrower name (handles Supabase response)
export const getBorrowerName = (borrower: any): string => {
  return borrower?.name || borrower?.full_name || 'Unknown';
};
