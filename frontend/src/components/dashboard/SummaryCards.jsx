import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Gauge,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { formatCurrency } from '../../utils/formatters';

const SummaryCards = ({ cards, comparisons }) => {
  if (!cards) return null;

  const {
    totalIncome = 0,
    totalExpenses = 0,
    netBalance = 0,
    budgetAmount = 0,
    budgetUsedPercent = 0,
    isBudgetSet = false,
    budgetStatus = 'not_set'
  } = cards;

  const { incomeChangePercent = 0, expenseChangePercent = 0 } = comparisons || {};

  // Color scheme for budget card based on usage
  let budgetScheme = 'indigo';
  if (budgetStatus === 'exceeded') budgetScheme = 'red';
  else if (budgetStatus === 'warning') budgetScheme = 'amber';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Income */}
      <StatCard
        title="Total Income"
        value={formatCurrency(totalIncome)}
        icon={TrendingUp}
        colorScheme="green"
        badge={
          incomeChangePercent !== 0 ? (
            <span
              className={`flex items-center text-xs font-semibold ${
                incomeChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {incomeChangePercent >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(incomeChangePercent)}% vs last mo
            </span>
          ) : null
        }
        subtitle="Earnings & credits"
      />

      {/* 2. Total Expenses */}
      <StatCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        icon={TrendingDown}
        colorScheme="red"
        badge={
          expenseChangePercent !== 0 ? (
            <span
              className={`flex items-center text-xs font-semibold ${
                expenseChangePercent > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {expenseChangePercent > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(expenseChangePercent)}% vs last mo
            </span>
          ) : null
        }
        subtitle="Spendings & debits"
      />

      {/* 3. Net Balance */}
      <StatCard
        title="Net Balance"
        value={formatCurrency(netBalance)}
        icon={Scale}
        colorScheme={netBalance >= 0 ? 'indigo' : 'red'}
        subtitle={
          netBalance >= 0 ? 'Positive financial surplus' : 'Deficit this period'
        }
        badge={
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              netBalance >= 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {netBalance >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        }
      />

      {/* 4. Budget Usage */}
      <div
        className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
            Budget Usage
          </span>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              budgetScheme === 'red'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                : budgetScheme === 'amber'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
            }`}
          >
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isBudgetSet ? `${budgetUsedPercent}%` : 'Not Set'}
          </h3>
          {isBudgetSet && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                budgetStatus === 'exceeded'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : budgetStatus === 'warning'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {budgetStatus === 'exceeded'
                ? 'Exceeded'
                : budgetStatus === 'warning'
                ? 'High'
                : 'Healthy'}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                budgetStatus === 'exceeded'
                  ? 'bg-rose-500'
                  : budgetStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{
                width: `${Math.min(100, isBudgetSet ? budgetUsedPercent : 0)}%`
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{isBudgetSet ? formatCurrency(totalExpenses) : '₹0'} spent</span>
            <span>{isBudgetSet ? formatCurrency(budgetAmount) : 'No limit'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
