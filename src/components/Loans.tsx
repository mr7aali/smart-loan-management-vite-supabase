import { Loan, Borrower, Repayment } from '../types';
import {
  AppCurrency,
  formatCurrency,
  formatDate,
  getBorrowerById,
  getLoanProgress,
  getLoanTotalInterest,
  getLoanTotalPayable,
  getRemainingAmount,
} from '../utils';
import { Plus, Search, Trash2, Eye, FileText, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface LoansProps {
  loans: Loan[];
  borrowers: Borrower[];
  currency: AppCurrency;
  repayments: Repayment[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSelect: (loan: Loan) => void;
}

export default function Loans({ loans, borrowers, currency, repayments, onAdd, onDelete, onSelect }: LoansProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const filteredLoans = loans.filter(loan => {
    const borrower = getBorrowerById(borrowers, loan.borrowerId);
    const matchesSearch =
      borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Loan
        </button>
      </div>

      {/* Loans Table */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Loans Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'No loans match your filters.'
              : 'Create your first loan to get started.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={onAdd}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Loan
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredLoans.map((loan) => {
              const borrower = getBorrowerById(borrowers, loan.borrowerId);
              const progress = getLoanProgress(loan, repayments);
              const remaining = getRemainingAmount(loan, repayments);
              const isOverdue =
                loan.status === 'overdue' ||
                (loan.status === 'active' && new Date(loan.dueDate) < new Date());

              return (
                <div key={loan.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                        {borrower?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">{borrower?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">Loan ID: {loan.id.slice(-6)}</p>
                        {loan.approval_status === 'pending' && (
                          <p className="mt-1 text-xs font-semibold text-amber-700">
                            Awaiting owner approval
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      loan.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      loan.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      isOverdue ? 'bg-red-100 text-red-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {loan.approval_status === 'pending' ? 'Pending' : loan.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Amount</p>
                      <p className="mt-1 font-semibold text-gray-800">{formatCurrency(loan.amount, currency)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Remaining</p>
                      <p className="mt-1 font-semibold text-amber-600">{formatCurrency(remaining, currency)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Flat Interest</p>
                      <p className="mt-1 text-gray-700">{loan.interestRate}% p.a.</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Term</p>
                      <p className="mt-1 text-gray-700">{loan.termMonths} months</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm">
                      {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <span className={isOverdue ? 'font-medium text-red-600' : 'text-gray-600'}>
                        Due {formatDate(loan.dueDate)}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{progress.toFixed(0)}% repaid</span>
                      <span>{formatCurrency(remaining, currency)} left</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          loan.status === 'paid' ? 'bg-emerald-500' :
                          isOverdue ? 'bg-red-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onSelect(loan);
                        setSelectedLoan(loan);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => onDelete(loan.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Borrower</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Flat Interest</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.map((loan) => {
                  const borrower = getBorrowerById(borrowers, loan.borrowerId);
                  const progress = getLoanProgress(loan, repayments);
                  const remaining = getRemainingAmount(loan, repayments);
                  const isOverdue =
                    loan.status === 'overdue' ||
                    (loan.status === 'active' && new Date(loan.dueDate) < new Date());

                  return (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {borrower?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{borrower?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">ID: {loan.id.slice(-6)}</p>
                            {loan.approval_status === 'pending' && (
                              <p className="mt-1 text-xs font-semibold text-amber-700">
                                Pending approval
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{formatCurrency(loan.amount, currency)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600">{loan.interestRate}% p.a.</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600">{loan.termMonths} months</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(loan.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{progress.toFixed(0)}%</span>
                            <span className="text-gray-500">{formatCurrency(remaining, currency)} left</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                loan.status === 'paid' ? 'bg-emerald-500' :
                                isOverdue ? 'bg-red-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          loan.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          loan.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          isOverdue ? 'bg-red-100 text-red-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {loan.approval_status === 'pending' ? 'Pending' : loan.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              onSelect(loan);
                              setSelectedLoan(loan);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => onDelete(loan.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-800">Loan Details</h2>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {(() => {
                const borrower = getBorrowerById(borrowers, selectedLoan.borrowerId);
                const loanRepayments = repayments.filter(r => r.loanId === selectedLoan.id);
                const progress = getLoanProgress(selectedLoan, repayments);
                const remaining = getRemainingAmount(selectedLoan, repayments);
                const totalInterest = getLoanTotalInterest(selectedLoan);
                const totalPayable = getLoanTotalPayable(selectedLoan);

                return (
                  <>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {borrower?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{borrower?.name || 'Unknown'}</h3>
                        <p className="text-gray-500">Loan ID: {selectedLoan.id.slice(-6)}</p>
                      </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(selectedLoan.amount, currency)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Total Payable</p>
                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalPayable, currency)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Remaining</p>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(remaining, currency)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Flat Interest</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(totalInterest, currency)} ({selectedLoan.interestRate}% p.a.)
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Term</p>
                        <p className="text-xl font-bold text-gray-800">{selectedLoan.termMonths} months</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Start Date</p>
                        <p className="text-lg font-medium text-gray-800">{formatDate(selectedLoan.startDate)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Due Date</p>
                        <p className="text-lg font-medium text-gray-800">{formatDate(selectedLoan.dueDate)}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">Repayment Progress</p>
                      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-600">{progress.toFixed(1)}% complete</span>
                        <span className="font-medium text-gray-800">{formatCurrency(totalPayable - remaining, currency)} / {formatCurrency(totalPayable, currency)}</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Repayment History ({loanRepayments.length})</h4>
                      {loanRepayments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No repayments yet</p>
                      ) : (
                        <div className="space-y-3">
                          {loanRepayments.map(repayment => (
                            <div key={repayment.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{formatCurrency(repayment.amount, currency)}</p>
                                <p className="text-sm text-gray-500">{formatDate(repayment.date)}</p>
                              </div>
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                {repayment.method}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
