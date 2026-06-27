import { useState } from 'react';
import { Loan, Borrower } from '../types';
import { X, FileText, DollarSign, Calendar, Percent } from 'lucide-react';
import {
  AppCurrency,
  calculateEMI,
  calculateTotalInterest,
  calculateTotalPayable,
  formatCurrency,
} from '../utils';

interface AddLoanModalProps {
  borrowers: Borrower[];
  currency: AppCurrency;
  onClose: () => void;
  onAdd: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
}

export default function AddLoanModal({ borrowers, currency, onClose, onAdd }: AddLoanModalProps) {
  const [formData, setFormData] = useState({
    borrowerId: '',
    amount: '',
    interestRate: '10',
    termMonths: '12',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.borrowerId) newErrors.borrowerId = 'Please select a borrower';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = 'Please enter a valid interest rate';
    }
    if (!formData.termMonths || parseInt(formData.termMonths) <= 0) {
      newErrors.termMonths = 'Please enter a valid term';
    }
    if (!formData.startDate) newErrors.startDate = 'Please select a start date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const amount = parseFloat(formData.amount);
      const rate = parseFloat(formData.interestRate);
      const months = parseInt(formData.termMonths);
      const startDate = new Date(formData.startDate);
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + months);

      onAdd({
        borrowerId: formData.borrowerId,
        amount,
        interestRate: rate,
        termMonths: months,
        startDate: formData.startDate,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'active',
        notes: formData.notes || undefined,
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const rate = parseFloat(formData.interestRate) || 0;
  const months = parseInt(formData.termMonths) || 0;
  const emi = calculateEMI(amount, rate, months);
  const totalInterest = calculateTotalInterest(amount, rate, months);
  const totalPayable = calculateTotalPayable(amount, rate, months);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 sm:h-10 sm:w-10">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 sm:text-xl">Create New Loan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {/* Borrower */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Borrower <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.borrowerId}
              onChange={(e) => handleChange('borrowerId', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.borrowerId ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select a borrower</option>
              {borrowers.map((borrower) => (
                <option key={borrower.id} value={borrower.id}>
                  {borrower.name} ({borrower.phone})
                </option>
              ))}
            </select>
            {errors.borrowerId && <p className="text-red-500 text-sm mt-1">{errors.borrowerId}</p>}
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.amount ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flat Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.interestRate}
                  onChange={(e) => handleChange('interestRate', e.target.value)}
                  placeholder="10"
                  min="0"
                  step="0.1"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.interestRate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.interestRate && <p className="text-red-500 text-sm mt-1">{errors.interestRate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term (Months) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.termMonths}
                  onChange={(e) => handleChange('termMonths', e.target.value)}
                  placeholder="12"
                  min="1"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.termMonths ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.termMonths && <p className="text-red-500 text-sm mt-1">{errors.termMonths}</p>}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.startDate ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this loan..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Loan Summary */}
          {amount > 0 && months > 0 && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-3">Loan Summary</h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-indigo-600">Total Interest</p>
                  <p className="font-bold text-indigo-900">{formatCurrency(totalInterest, currency)}</p>
                </div>
                <div>
                  <p className="text-indigo-600">Total Payable</p>
                  <p className="font-bold text-indigo-900">{formatCurrency(totalPayable, currency)}</p>
                </div>
                <div>
                  <p className="text-indigo-600">Monthly Installment</p>
                  <p className="font-bold text-indigo-900">{formatCurrency(emi, currency)}</p>
                </div>
                <div>
                  <p className="text-indigo-600">Due Date</p>
                  <p className="font-bold text-indigo-900">
                    {new Date(new Date(formData.startDate).setMonth(new Date(formData.startDate).getMonth() + months)).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
