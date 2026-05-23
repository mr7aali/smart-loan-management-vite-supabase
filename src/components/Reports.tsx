import { Borrower, Loan, Repayment } from '../types';
import { formatCurrency, getBorrowerById } from '../utils';
import { BarChart3, TrendingUp, DollarSign, Users, Download, FileText } from 'lucide-react';
import { useState } from 'react';

interface ReportsProps {
  borrowers: Borrower[];
  loans: Loan[];
  repayments: Repayment[];
}

export default function Reports({ borrowers, loans, repayments }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState('portfolio');

  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalCollected = repayments.reduce((sum, r) => sum + r.amount, 0);
  const totalOutstanding = totalDisbursed - totalCollected;

  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');
  const overdueLoans = loans.filter(l => l.status === 'overdue' || (l.status === 'active' && new Date(l.dueDate) < new Date()));

  const avgInterestRate = loans.length > 0
    ? loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length
    : 0;

  const avgLoanAmount = loans.length > 0 ? totalDisbursed / loans.length : 0;

  // Monthly collection data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const monthRepayments = repayments.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear();
    }).reduce((sum, r) => sum + r.amount, 0);
    return { month: monthName, amount: monthRepayments };
  });

  // Loan distribution by status
  const statusDistribution = [
    { status: 'Active', count: activeLoans.length, amount: activeLoans.reduce((sum, l) => sum + l.amount, 0), color: 'bg-indigo-500' },
    { status: 'Paid', count: paidLoans.length, amount: paidLoans.reduce((sum, l) => sum + l.amount, 0), color: 'bg-emerald-500' },
    { status: 'Overdue', count: overdueLoans.length, amount: overdueLoans.reduce((sum, l) => sum + l.amount, 0), color: 'bg-red-500' },
  ];

  // Top borrowers by loan amount
  const topBorrowers = borrowers
    .map(b => ({
      ...b,
      totalLoans: loans.filter(l => l.borrowerId === b.id).reduce((sum, l) => sum + l.amount, 0),
    }))
    .sort((a, b) => b.totalLoans - a.totalLoans)
    .slice(0, 5);

  const reportTypes = [
    { id: 'portfolio', label: 'Portfolio Summary', icon: BarChart3 },
    { id: 'collection', label: 'Collection Report', icon: DollarSign },
    { id: 'borrowers', label: 'Borrower Report', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {selectedReport === 'portfolio' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Portfolio Summary Report</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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

            {/* Charts Placeholder - Simple Table View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Loan Status Distribution */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Loan Status Distribution</h3>
                <div className="space-y-4">
                  {statusDistribution.map((item) => (
                    <div key={item.status} className="flex items-center gap-4">
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
                      <span className="font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Collection Trend */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Collection Trend</h3>
                <div className="flex items-end gap-2 h-32">
                  {monthlyData.map((data, index) => {
                    const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
                    const height = (data.amount / maxAmount) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
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

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Collection Report</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
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
                    const borrower = getBorrowerById(borrowers, loan.borrowerId);
                    const loanRepayments = repayments.filter(r => r.loanId === loan.id);
                    const totalPaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Borrower Report</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            <div className="space-y-4">
              {topBorrowers.map((borrower, index) => (
                <div key={borrower.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{borrower.name}</p>
                      <p className="text-sm text-gray-500">{borrower.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
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