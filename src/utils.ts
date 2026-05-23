import { Loan, Repayment, Borrower } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateEMI = (principal: number, rate: number, months: number): number => {
  const monthlyRate = rate / 100 / 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
};

export const calculateTotalInterest = (principal: number, rate: number, months: number): number => {
  const emi = calculateEMI(principal, rate, months);
  return (emi * months) - principal;
};

export const calculateTotalPayable = (principal: number, rate: number, months: number): number => {
  const emi = calculateEMI(principal, rate, months);
  return emi * months;
};

// Helper to get loan's borrower ID (handles both formats)
const getLoanBorrowerId = (loan: Loan): string => {
  return loan.borrowerId || loan.borrower_id || '';
};

// Helper to get loan's due date (handles both formats)
const getLoanDueDate = (loan: Loan): string => {
  return loan.dueDate || loan.due_date || '';
};

// Helper to get loan's start date (handles both formats)
const getLoanStartDate = (loan: Loan): string => {
  return loan.startDate || loan.start_date || '';
};

// Helper to get loan's amount
const getLoanAmount = (loan: Loan): number => {
  return loan.amount || 0;
};

// Helper to get repayment's loan ID (handles both formats)
const getRepaymentLoanId = (repayment: Repayment): string => {
  return repayment.loanId || repayment.loan_id || '';
};

export const getLoanProgress = (loan: Loan, repayments: Repayment[]): number => {
  const loanId = loan.id;
  const totalPaid = repayments
    .filter(r => getRepaymentLoanId(r) === loanId)
    .reduce((sum, r) => sum + r.amount, 0);
  const amount = getLoanAmount(loan);
  return amount > 0 ? Math.min((totalPaid / amount) * 100, 100) : 0;
};

export const getRemainingAmount = (loan: Loan, repayments: Repayment[]): number => {
  const loanId = loan.id;
  const totalPaid = repayments
    .filter(r => getRepaymentLoanId(r) === loanId)
    .reduce((sum, r) => sum + r.amount, 0);
  return Math.max(getLoanAmount(loan) - totalPaid, 0);
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
  return loans.filter(l => {
    if (l.status !== 'active') return false;
    const dueDate = new Date(getLoanDueDate(l));
    return dueDate < today;
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