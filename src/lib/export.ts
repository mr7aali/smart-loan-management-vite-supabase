import { Borrower, Loan, Repayment } from "../types";
import { getBorrowerById, getLoanBorrowerId, getRepaymentLoanId } from "../utils";

export const escapeCsv = (value: string | number | null | undefined) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const downloadCsv = (
  filename: string,
  rows: Array<Record<string, string | number | null | undefined>>,
) => {
  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportWorkspaceData = (
  borrowers: Borrower[],
  loans: Loan[],
  repayments: Repayment[],
) => {
  const timestamp = new Date().toISOString().slice(0, 10);

  downloadCsv(
    `lendsmart-borrowers-${timestamp}.csv`,
    borrowers.map((borrower) => ({
      id: borrower.id,
      name: borrower.name,
      email: borrower.email,
      phone: borrower.phone,
      address: borrower.address || "",
      notes: borrower.notes || "",
      created_at: borrower.createdAt || borrower.created_at || "",
    })),
  );

  downloadCsv(
    `lendsmart-loans-${timestamp}.csv`,
    loans.map((loan) => {
      const borrower = getBorrowerById(borrowers, getLoanBorrowerId(loan));

      return {
        id: loan.id,
        borrower_id: getLoanBorrowerId(loan),
        borrower_name: borrower?.name || "",
        amount: loan.amount,
        interest_rate: loan.interestRate ?? loan.interest_rate ?? 0,
        term_months: loan.termMonths ?? loan.term_months ?? 0,
        start_date: loan.startDate || loan.start_date || "",
        due_date: loan.dueDate || loan.due_date || "",
        status: loan.status,
        notes: loan.notes || "",
        created_at: loan.createdAt || loan.created_at || "",
      };
    }),
  );

  downloadCsv(
    `lendsmart-repayments-${timestamp}.csv`,
    repayments.map((repayment) => {
      const loanId = getRepaymentLoanId(repayment);
      const loan = loans.find((item) => item.id === loanId);
      const borrower = loan
        ? getBorrowerById(borrowers, getLoanBorrowerId(loan))
        : undefined;

      return {
        id: repayment.id,
        loan_id: loanId,
        borrower_name: borrower?.name || "",
        amount: repayment.amount,
        date: repayment.date,
        method: repayment.method,
        notes: repayment.notes || "",
        created_at: repayment.createdAt || repayment.created_at || "",
      };
    }),
  );
};
