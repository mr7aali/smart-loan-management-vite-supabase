import { useState } from 'react';
import { Loan, Repayment, Borrower } from '../types';
import {
  X,
  DollarSign,
  Calendar,
  Banknote,
  Landmark,
  Smartphone,
  ReceiptText,
} from 'lucide-react';
import {
  AppCurrency,
  formatCurrency,
  formatDate,
  getBorrowerById,
  getBorrowerName,
  getLoanBorrowerId,
  getLoanDueDate,
  getLoanTotalPayable,
  getRemainingAmount,
} from '../utils';

interface AddRepaymentModalProps {
  loans: Loan[];
  borrowers: Borrower[];
  repayments: Repayment[];
  currency: AppCurrency;
  onClose: () => void;
  onAdd: (repayment: Omit<Repayment, 'id' | 'createdAt'>) => void;
}

const methods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'other', label: 'Other', icon: ReceiptText },
] as const;

export default function AddRepaymentModal({ loans, borrowers, repayments, currency, onClose, onAdd }: AddRepaymentModalProps) {
  const [formData, setFormData] = useState({
    loanId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash' as 'cash' | 'bank_transfer' | 'upi' | 'other',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedLoan = loans.find((loan) => loan.id === formData.loanId);
  const selectedLoanRemaining = selectedLoan
    ? getRemainingAmount(selectedLoan, repayments)
    : 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.loanId) newErrors.loanId = 'Please select a loan';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (selectedLoan && parseFloat(formData.amount) > selectedLoanRemaining) {
      newErrors.amount = `Payment cannot exceed the remaining balance of ${formatCurrency(selectedLoanRemaining, currency)}`;
    }
    if (!formData.date) newErrors.date = 'Please select a date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    onAdd({
      loanId: formData.loanId,
      amount: parseFloat(formData.amount),
      date: formData.date,
      method: formData.method,
      notes: formData.notes || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 sm:h-10 sm:w-10">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 sm:text-xl">Record Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Loan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.loanId}
              onChange={(e) => handleChange('loanId', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.loanId ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select an active loan</option>
              {loans.map((loan) => {
                const borrower =
                  loan.borrowers ||
                  getBorrowerById(borrowers, getLoanBorrowerId(loan));

                return (
                  <option key={loan.id} value={loan.id}>
                    {getBorrowerName(borrower)} - {formatCurrency(getRemainingAmount(loan, repayments), currency)} remaining (Due: {formatDate(getLoanDueDate(loan))})
                  </option>
                );
              })}
            </select>
            {errors.loanId && <p className="text-red-500 text-sm mt-1">{errors.loanId}</p>}
          </div>

          {selectedLoan && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Remaining Balance</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(selectedLoanRemaining, currency)}</p>
              <p className="mt-1 text-xs text-gray-500">
                Total payable with flat interest: {formatCurrency(getLoanTotalPayable(selectedLoan), currency)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Due Date: {formatDate(getLoanDueDate(selectedLoan))}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                min="0"
                max={selectedLoanRemaining || undefined}
                step="0.01"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.amount ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.date ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => handleChange('method', method.value)}
                    className={`rounded-lg border p-2.5 text-center transition-colors sm:p-3 ${
                      formData.method === method.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                    <p className="text-xs mt-1">{method.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about this payment..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
