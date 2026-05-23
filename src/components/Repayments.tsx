import { Repayment, Loan } from '../types';
import { formatCurrency, formatDate, getBorrowerById } from '../utils';
import { Plus, Search, DollarSign, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

interface RepaymentsProps {
  repayments: Repayment[];
  loans: Loan[];
  onAdd: () => void;
}

export default function Repayments({ repayments, loans, onAdd }: RepaymentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredRepayments = repayments.filter(repayment => {
    const loan = loans.find(l => l.id === repayment.loanId);
    const borrower = loan ? getBorrowerById([], loan.borrowerId) : null;
    const matchesSearch = borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repayment.id.includes(searchTerm);
    const matchesMethod = methodFilter === 'all' || repayment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Sort by date descending (most recent first)
  const sortedRepayments = [...filteredRepayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalCollected = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);
  const thisMonth = repayments.filter(r => {
    const date = new Date(r.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + r.amount, 0);

  const methodIcons: Record<string, React.ReactNode> = {
    cash: '$',
    bank_transfer: '🏦',
    upi: '📱',
    other: '📋',
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
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
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Repayments List */}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRepayments.map((repayment) => {
                  const loan = loans.find(l => l.id === repayment.loanId);
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
                        <span className="text-sm text-gray-500">#{loan?.id.slice(-6) || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-emerald-600">{formatCurrency(repayment.amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{methodIcons[repayment.method] || '📋'}</span>
                          <span className="text-sm text-gray-600 capitalize">{repayment.method.replace('_', ' ')}</span>
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