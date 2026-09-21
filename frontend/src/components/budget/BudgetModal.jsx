import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { MONTH_NAMES, formatCurrency } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import toast from 'react-hot-toast';

const BudgetModal = ({
  isOpen,
  onClose,
  initialMonth,
  initialYear,
  initialAmount = '',
  onSuccess
}) => {
  const [month, setMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(initialYear || new Date().getFullYear());
  const [amount, setAmount] = useState(initialAmount || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMonth(initialMonth || new Date().getMonth() + 1);
    setYear(initialYear || new Date().getFullYear());
    setAmount(initialAmount ? String(initialAmount) : '');
    setError(null);
  }, [initialMonth, initialYear, initialAmount, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid non-negative budget amount');
      return;
    }

    setLoading(true);
    try {
      const res = await budgetService.setBudget({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        amount: parsedAmount
      });

      if (res.success) {
        toast.success(res.message || 'Budget updated successfully');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set budget');
    } finally {
      setLoading(false);
    }
  };

  const years = [2023, 2024, 2025, 2026, 2027, 2028];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Monthly Expense Budget"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Set a monthly spending limit to manage your finances. You will receive alerts when your expenses reach 80% or exceed 100%.
        </p>

        {/* Month & Year Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Budget Amount (INR) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 25000"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400">Quick set:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {[10000, 20000, 35000, 50000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Budget
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetModal;
