import { Borrower, Loan, Repayment } from '../types';
import { formatCurrency, formatDate, getLoansByBorrower, getLoanProgress } from '../utils';
import { Plus, Search, Trash2, Eye, Users, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';

interface BorrowersProps {
  borrowers: Borrower[];
  loans: Loan[];
  repayments: Repayment[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSelect: (borrower: Borrower) => void;
}

export default function Borrowers({ borrowers, loans, repayments, onAdd, onDelete, onSelect }: BorrowersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  const filteredBorrowers = borrowers.filter(borrower =>
    borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrower.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrower.phone.includes(searchTerm)
  );

  const handleViewDetails = (borrower: Borrower) => {
    onSelect(borrower);
    setSelectedBorrower(borrower);
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search borrowers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Borrower
        </button>
      </div>

      {/* Borrowers Grid */}
      {filteredBorrowers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Borrowers Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No borrowers match your search.' : 'Start by adding your first borrower.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAdd}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Your First Borrower
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBorrowers.map((borrower) => {
            const borrowerLoans = getLoansByBorrower(loans, borrower.id);
            const activeLoans = borrowerLoans.filter(l => l.status === 'active');
            const totalBorrowed = borrowerLoans.reduce((sum, l) => sum + l.amount, 0);

            return (
              <div
                key={borrower.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {borrower.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{borrower.name}</h3>
                        <p className="text-sm text-gray-500">ID: {borrower.id.slice(-6)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(borrower)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => onDelete(borrower.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{borrower.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{borrower.email}</span>
                    </div>
                    {borrower.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600 line-clamp-2">{borrower.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Active Loans</p>
                      <p className="font-semibold text-gray-800">{activeLoans.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Borrowed</p>
                      <p className="font-semibold text-indigo-600">{formatCurrency(totalBorrowed)}</p>
                    </div>
                  </div>

                  {/* Loan Summary */}
                  {activeLoans.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Active Loan Progress</p>
                      {activeLoans.slice(0, 1).map(loan => (
                        <div key={loan.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{formatCurrency(loan.amount)}</span>
                            <span className="font-medium text-indigo-600">
                              {getLoanProgress(loan, repayments).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              style={{ width: `${getLoanProgress(loan, repayments)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Added on {formatDate(borrower.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Borrower Details Modal */}
      {selectedBorrower && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-800">Borrower Details</h2>
              <button
                onClick={() => setSelectedBorrower(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                  {selectedBorrower.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedBorrower.name}</h3>
                  <p className="text-gray-500">ID: {selectedBorrower.id.slice(-6)}</p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-800">{selectedBorrower.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-800">{selectedBorrower.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-medium text-gray-800">{selectedBorrower.address || 'Not provided'}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Loans ({getLoansByBorrower(loans, selectedBorrower.id).length})</h4>
                {getLoansByBorrower(loans, selectedBorrower.id).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No loans yet</p>
                ) : (
                  <div className="space-y-4">
                    {getLoansByBorrower(loans, selectedBorrower.id).map(loan => (
                      <div key={loan.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">{formatCurrency(loan.amount)}</p>
                            <p className="text-sm text-gray-500">{formatDate(loan.startDate)} - {formatDate(loan.dueDate)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            loan.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:gap-4">
                          <span>Interest: {loan.interestRate}%</span>
                          <span>Term: {loan.termMonths} months</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
