import { useState } from 'react';
import { Loan, Borrower } from '../types';
import { X, FileText, DollarSign, Calendar, Percent } from 'lucide-react';
import {
  AppCurrency,
  calculateEMI,
  calculateMonthlyFlatInterest,
  calculateTotalInterest,
  calculateTotalPayable,
} from '../utils';

interface AddLoanModalProps {
  borrowers: Borrower[];
  currency: AppCurrency;
  onClose: () => void;
  onAdd: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
}

const currencySymbols: Record<AppCurrency, string> = {
  USD: '$',
  EUR: '€',
  ZAR: 'R',
  LSL: 'M',
};

const currenciesWithoutSymbolSpacing = new Set<AppCurrency>(['USD', 'EUR']);

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatLoanCurrency = (value: number, currency: AppCurrency) => {
  const symbol = currencySymbols[currency];
  const separator = currenciesWithoutSymbolSpacing.has(currency) ? '' : ' ';
  return `${symbol}${separator}${roundCurrency(value).toFixed(2)}`;
};

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
  const monthlyInterest = calculateMonthlyFlatInterest(amount, rate);
  const totalInterest = calculateTotalInterest(amount, rate, months);
  const totalPayable = calculateTotalPayable(amount, rate, months);
  const currencySymbol = currencySymbols[currency];
  const dueDate = (() => {
    if (!formData.startDate || months <= 0) return null;
    const startDate = new Date(formData.startDate);
    if (Number.isNaN(startDate.getTime())) return null;
    const finalDueDate = new Date(startDate);
    finalDueDate.setMonth(finalDueDate.getMonth() + months);
    return finalDueDate;
  })();
  const repaymentSchedule = (() => {
    if (amount <= 0 || months <= 0) return [];

    let remainingPrincipal = amount;
    return Array.from({ length: months }, (_, index) => {
      const monthNumber = index + 1;
      const isFinalMonth = monthNumber === months;
      const principalDue = isFinalMonth
        ? roundCurrency(remainingPrincipal)
        : roundCurrency(amount / months);
      remainingPrincipal = Math.max(
        roundCurrency(remainingPrincipal - principalDue),
        0,
      );

      return {
        month: monthNumber,
        principal: principalDue,
        interest: monthlyInterest,
        totalDue: roundCurrency(principalDue + monthlyInterest),
        balance: remainingPrincipal,
      };
    });
  })();
  const visibleSchedule =
    repaymentSchedule.length > 7
      ? [
          ...repaymentSchedule.slice(0, 5),
          { isEllipsis: true },
          repaymentSchedule[repaymentSchedule.length - 1],
        ]
      : repaymentSchedule;

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

          {/* Loan Breakdown */}
          {amount > 0 && months > 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="mb-3 font-semibold text-indigo-800">Loan Breakdown</h4>
                <div className="space-y-2 text-sm text-indigo-950">
                  <div className="flex items-center justify-between gap-4">
                    <span>Principal (Loan Amount)</span>
                    <span className="font-semibold">{formatLoanCurrency(amount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Monthly Interest ({rate}% of {roundCurrency(amount).toFixed(0)})</span>
                    <span className="font-semibold">{formatLoanCurrency(monthlyInterest, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Number of Months</span>
                    <span className="font-semibold">{months}</span>
                  </div>
                  <div className="my-3 border-t border-indigo-200" />
                  <div className="flex items-center justify-between gap-4 font-semibold text-indigo-700">
                    <span>Total Interest ({monthlyInterest.toFixed(2)} × {months})</span>
                    <span>{formatLoanCurrency(totalInterest, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-semibold text-indigo-700">
                    <span>Total Payable</span>
                    <span>{formatLoanCurrency(totalPayable, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-semibold text-indigo-700">
                    <span>Monthly Installment</span>
                    <span>{formatLoanCurrency(emi, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="mb-3 font-semibold text-indigo-800">Repayment Schedule</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] text-left text-xs">
                    <thead className="text-indigo-700">
                      <tr className="border-b border-indigo-200">
                        <th className="py-2 font-semibold">Month</th>
                        <th className="py-2 text-right font-semibold">Principal ({currencySymbol})</th>
                        <th className="py-2 text-right font-semibold">Interest ({currencySymbol})</th>
                        <th className="py-2 text-right font-semibold">Total Due ({currencySymbol})</th>
                        <th className="py-2 text-right font-semibold">Balance ({currencySymbol})</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-gray-900">
                      {visibleSchedule.map((row, index) => (
                        'isEllipsis' in row ? (
                          <tr key={`ellipsis-${index}`} className="text-gray-500">
                            <td className="py-2 text-center">...</td>
                            <td className="py-2 text-right">...</td>
                            <td className="py-2 text-right">...</td>
                            <td className="py-2 text-right">...</td>
                            <td className="py-2 text-right">...</td>
                          </tr>
                        ) : (
                          <tr key={row.month}>
                            <td className="py-2 text-center">{row.month}</td>
                            <td className="py-2 text-right">{row.principal.toFixed(2)}</td>
                            <td className="py-2 text-right">{row.interest.toFixed(2)}</td>
                            <td className="py-2 text-right">{row.totalDue.toFixed(2)}</td>
                            <td className="py-2 text-right">{row.balance.toFixed(2)}</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="mb-3 font-semibold text-indigo-800">Loan Summary</h4>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-indigo-600">Total Interest</p>
                    <p className="font-bold text-indigo-900">{formatLoanCurrency(totalInterest, currency)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600">Total Payable</p>
                    <p className="font-bold text-indigo-900">{formatLoanCurrency(totalPayable, currency)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600">Monthly Installment</p>
                    <p className="font-bold text-indigo-900">{formatLoanCurrency(emi, currency)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600">Due Date (Final)</p>
                    <p className="font-bold text-indigo-900">
                      {dueDate ? dueDate.toLocaleDateString() : '-'}
                    </p>
                  </div>
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
