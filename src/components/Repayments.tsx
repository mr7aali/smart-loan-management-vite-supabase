import { Repayment, Loan, Borrower } from '../types';
import {
  formatCurrency,
  formatDate,
  getBorrowerById,
  getBorrowerName,
  getLoanBorrowerId,
  getRepaymentLoanId,
} from '../utils';
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Banknote,
  Landmark,
  Smartphone,
  ReceiptText,
} from 'lucide-react';
import { useState } from 'react';

interface RepaymentsProps {
  repayments: Repayment[];
  loans: Loan[];
  borrowers: Borrower[];
  onAdd: () => void;
}

const methodMeta = {
  cash: { label: 'Cash', icon: Banknote },
  bank_transfer: { label: 'Bank Transfer', icon: Landmark },
  upi: { label: 'UPI', icon: Smartphone },
  other: { label: 'Other', icon: ReceiptText },
} as const;

export default function Repayments({ repayments, loans, borrowers, onAdd }: RepaymentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredRepayments = repayments.filter((repayment) => {
    const loan = loans.find((item) => item.id === getRepaymentLoanId(repayment));
    const borrower =
      loan?.borrowers ||
      (loan ? getBorrowerById(borrowers, getLoanBorrowerId(loan)) : undefined);
    const borrowerName = getBorrowerName(borrower).toLowerCase();
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      borrowerName.includes(normalizedSearch) ||
      loan?.id.toLowerCase().includes(normalizedSearch) ||
      repayment.id.toLowerCase().includes(normalizedSearch) ||
      repayment.notes?.toLowerCase().includes(normalizedSearch);
    const matchesMethod = methodFilter === 'all' || repayment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const sortedRepayments = [...filteredRepayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalCollected = filteredRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
  const thisMonth = repayments
    .filter((repayment) => {
      const date = new Date(repayment.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, repayment) => sum + repayment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalCollected)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(thisMonth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{filteredRepayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search repayments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {sortedRepayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Repayments Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || methodFilter !== 'all'
              ? 'No repayments match your filters.'
              : 'Record your first repayment to track payments.'}
          </p>
          {!searchTerm && methodFilter === 'all' && (
            <button
              onClick={onAdd}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Record First Payment
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100 md:hidden">
            {sortedRepayments.map((repayment) => {
              const loan = loans.find((item) => item.id === getRepaymentLoanId(repayment));
              const borrower =
                loan?.borrowers ||
                (loan ? getBorrowerById(borrowers, getLoanBorrowerId(loan)) : undefined);
              const borrowerName = getBorrowerName(borrower);
              const MethodIcon = methodMeta[repayment.method]?.icon || ReceiptText;
              const methodLabel = methodMeta[repayment.method]?.label || 'Other';

              return (
                <div key={repayment.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">{borrowerName}</p>
                      <p className="text-xs text-gray-500">Loan #{loan?.id.slice(-6) || 'Unknown'}</p>
                    </div>
                    <p className="shrink-0 text-base font-semibold text-emerald-600">
                      {formatCurrency(repayment.amount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Date</p>
                      <p className="mt-1 font-medium text-gray-700">{formatDate(repayment.date)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Method</p>
                      <div className="mt-1 flex items-center gap-2 text-gray-700">
                        <MethodIcon className="h-4 w-4 text-gray-500" />
                        <span>{methodLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Notes</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {repayment.notes || '-'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Borrower</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRepayments.map((repayment) => {
                  const loan = loans.find((item) => item.id === getRepaymentLoanId(repayment));
                  const borrower =
                    loan?.borrowers ||
                    (loan ? getBorrowerById(borrowers, getLoanBorrowerId(loan)) : undefined);
                  const borrowerName = getBorrowerName(borrower);
                  const MethodIcon = methodMeta[repayment.method]?.icon || ReceiptText;
                  const methodLabel = methodMeta[repayment.method]?.label || 'Other';

                  return (
                    <tr key={repayment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-800">{formatDate(repayment.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{borrowerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">#{loan?.id.slice(-6) || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-emerald-600">{formatCurrency(repayment.amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{methodLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                          {repayment.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
