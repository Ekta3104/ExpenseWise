import React from 'react';
import { AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const BudgetAlertBanner = ({
  cards,
  onOpenBudgetModal
}) => {
  if (!cards) return null;

  const {
    isBudgetSet,
    budgetStatus,
    budgetAmount,
    totalExpenses,
    remainingBudget,
    budgetUsedPercent
  } = cards;

  // If no budget is set, display a subtle friendly prompt
  if (!isBudgetSet) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No budget set for this month
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set a monthly spending limit to receive smart alerts and track financial health.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBudgetModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm shrink-0"
        >
          Set Monthly Budget
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Budget exceeded (>= 100%)
  if (budgetStatus === 'exceeded') {
    const overrun = totalExpenses - budgetAmount;
    return (
      <div className="flex items-start sm:items-center justify-between gap-3 p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm animate-pulse">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Budget Exceeded! ({budgetUsedPercent}%)
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              You have overspent by <span className="font-bold">{formatCurrency(overrun)}</span> beyond your {formatCurrency(budgetAmount)} budget.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBudgetModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 rounded-lg transition-colors shrink-0"
        >
          Adjust Budget
        </button>
      </div>
    );
  }

  // Warning (>= 80%)
  if (budgetStatus === 'warning') {
    return (
      <div className="flex items-start sm:items-center justify-between gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Approaching Budget Limit ({budgetUsedPercent}%)
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              You have only <span className="font-bold">{formatCurrency(remainingBudget)}</span> left from your {formatCurrency(budgetAmount)} budget.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBudgetModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 dark:text-amber-200 dark:bg-amber-900/60 rounded-lg transition-colors shrink-0"
        >
          View Budget
        </button>
      </div>
    );
  }

  return null;
};

export default BudgetAlertBanner;
