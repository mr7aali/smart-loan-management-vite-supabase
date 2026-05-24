import { Borrower, Loan, Repayment } from '../types';
import {
  formatCurrency,
  formatDate,
  getBorrowerById,
  getLoanBorrowerId,
  getLoanDueDate,
  getLoanInterestRate,
  getRepaymentLoanId,
} from '../utils';
import { BarChart3, DollarSign, Users, Download } from 'lucide-react';
import { useState } from 'react';

interface ReportsProps {
  borrowers: Borrower[];
  loans: Loan[];
  repayments: Repayment[];
}

const escapeCsv = (value: string | number) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? '')).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Reports({ borrowers, loans, repayments }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState('portfolio');

  const totalDisbursed = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalCollected = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);
  const totalOutstanding = totalDisbursed - totalCollected;

  const activeLoans = loans.filter((loan) => loan.status === 'active');
  const paidLoans = loans.filter((loan) => loan.status === 'paid');
  const overdueLoans = loans.filter(
    (loan) =>
      loan.status === 'overdue' ||
      (loan.status === 'active' && new Date(getLoanDueDate(loan)) < new Date())
  );

  const avgInterestRate = loans.length > 0
    ? loans.reduce((sum, loan) => sum + getLoanInterestRate(loan), 0) / loans.length
    : 0;

  const avgLoanAmount = loans.length > 0 ? totalDisbursed / loans.length : 0;

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const monthRepayments = repayments
      .filter((repayment) => {
        const repaymentDate = new Date(repayment.date);
        return repaymentDate.getMonth() === date.getMonth() && repaymentDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, repayment) => sum + repayment.amount, 0);

    return { month: monthName, amount: monthRepayments };
  });

  const statusDistribution = [
    {
      status: 'Active',
      count: activeLoans.length,
      amount: activeLoans.reduce((sum, loan) => sum + loan.amount, 0),
      color: 'bg-indigo-500',
    },
    {
      status: 'Paid',
      count: paidLoans.length,
      amount: paidLoans.reduce((sum, loan) => sum + loan.amount, 0),
      color: 'bg-emerald-500',
    },
    {
      status: 'Overdue',
      count: overdueLoans.length,
      amount: overdueLoans.reduce((sum, loan) => sum + loan.amount, 0),
      color: 'bg-red-500',
    },
  ];

  const topBorrowers = borrowers
    .map((borrower) => ({
      ...borrower,
      totalLoans: loans
        .filter((loan) => getLoanBorrowerId(loan) === borrower.id)
        .reduce((sum, loan) => sum + loan.amount, 0),
    }))
    .sort((first, second) => second.totalLoans - first.totalLoans)
    .slice(0, 5);

  const reportTypes = [
    { id: 'portfolio', label: 'Portfolio Summary', icon: BarChart3 },
    { id: 'collection', label: 'Collection Report', icon: DollarSign },
    { id: 'borrowers', label: 'Borrower Report', icon: Users },
  ];

  const handleExport = () => {
    if (selectedReport === 'portfolio') {
      downloadCsv('portfolio-summary.csv', [
        { metric: 'Total Disbursed', value: totalDisbursed },
        { metric: 'Total Collected', value: totalCollected },
        { metric: 'Outstanding', value: totalOutstanding },
        { metric: 'Collection Rate', value: `${totalDisbursed > 0 ? ((totalCollected / totalDisbursed) * 100).toFixed(1) : 0}%` },
        { metric: 'Average Interest Rate', value: `${avgInterestRate.toFixed(1)}%` },
        { metric: 'Average Loan Amount', value: avgLoanAmount },
      ]);
      return;
    }

    if (selectedReport === 'collection') {
      downloadCsv(
        'collection-report.csv',
        activeLoans.map((loan) => {
          const borrower = getBorrowerById(borrowers, getLoanBorrowerId(loan));
          const loanRepayments = repayments.filter((repayment) => getRepaymentLoanId(repayment) === loan.id);
          const totalPaid = loanRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
          const remaining = loan.amount - totalPaid;

          return {
            borrower: borrower?.name || 'Unknown',
            loan_id: loan.id,
            loan_amount: loan.amount,
            total_paid: totalPaid,
            remaining,
            progress_percent: loan.amount > 0 ? Number(((totalPaid / loan.amount) * 100).toFixed(1)) : 0,
          };
        })
      );
      return;
    }

    downloadCsv(
      'borrower-report.csv',
      topBorrowers.map((borrower) => ({
        borrower: borrower.name,
        email: borrower.email,
        phone: borrower.phone,
        total_borrowed: borrower.totalLoans,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors sm:w-auto ${
                selectedReport === report.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {report.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        {selectedReport === 'portfolio' && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-gray-800">Portfolio Summary Report</h2>
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Total Disbursed</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalDisbursed)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {totalDisbursed > 0 ? ((totalCollected / totalDisbursed) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Loan Status Distribution</h3>
                <div className="space-y-4">
                  {statusDistribution.map((item) => (
                    <div key={item.status} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                          <span className="text-sm text-gray-500">{item.count} loans</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${loans.length > 0 ? (item.count / loans.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="font-medium text-gray-800 sm:text-right">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Collection Trend</h3>
                <div className="flex items-end gap-2 h-32">
                  {monthlyData.map((data) => {
                    const maxAmount = Math.max(...monthlyData.map((item) => item.amount), 1);
                    const height = (data.amount / maxAmount) * 100;
                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t"
                          style={{ height: `${height}%`, minHeight: data.amount > 0 ? '4px' : '0' }}
                        ></div>
                        <span className="text-xs text-gray-500">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
              <div className="p-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Average Interest Rate</p>
                <p className="text-2xl font-bold text-gray-800">{avgInterestRate.toFixed(1)}%</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Average Loan Amount</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(avgLoanAmount)}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Total Borrowers</p>
                <p className="text-2xl font-bold text-gray-800">{borrowers.length}</p>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'collection' && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-gray-800">Collection Report</h2>
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Borrower</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Loan Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Paid</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Remaining</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeLoans.map((loan) => {
                    const borrower = getBorrowerById(borrowers, getLoanBorrowerId(loan));
                    const loanRepayments = repayments.filter((repayment) => getRepaymentLoanId(repayment) === loan.id);
                    const totalPaid = loanRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
                    const remaining = loan.amount - totalPaid;
                    const progress = (totalPaid / loan.amount) * 100;

                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{borrower?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-600">{formatCurrency(loan.amount)}</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(totalPaid)}</td>
                        <td className="px-6 py-4 text-amber-600 font-medium">{formatCurrency(remaining)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-500">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectedReport === 'borrowers' && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-gray-800">Borrower Report</h2>
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="space-y-4">
              {topBorrowers.map((borrower, index) => (
                <div key={borrower.id} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{borrower.name}</p>
                      <p className="text-sm text-gray-500">{borrower.phone}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-semibold text-indigo-600">{formatCurrency(borrower.totalLoans)}</p>
                    <p className="text-sm text-gray-500">Total Borrowed</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
