import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import MonthSelector from '../components/dashboard/MonthSelector';
import BudgetModal from '../components/budget/BudgetModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { budgetService } from '../services/budgetService';
import { formatCurrency, getMonthName } from '../utils/formatters';
import {
  PieChart,
  Target,
  TrendingDown,
  Scale,
  SlidersHorizontal,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const BudgetPage = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [budgetData, setBudgetData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, historyRes] = await Promise.all([
        budgetService.getBudget(month, year),
        budgetService.getBudgetHistory()
      ]);

      if (budgetRes.success) setBudgetData(budgetRes.data);
      if (historyRes.success) setHistory(historyRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const {
    isBudgetConfigured = false,
    budgetAmount = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    remainingBalance = 0,
    remainingBudget = 0,
    budgetUsedPercentage = 0,
    status = 'not_configured',
    alertMessage = null
  } = budgetData || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Monthly Budget Planner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Control spending limits, monitor progress, and prevent overspending
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MonthSelector
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {isBudgetConfigured ? 'Adjust Budget' : 'Set Budget'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <LoadingSpinner message="Loading budget calculations..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warning or Status Banner */}
            {isBudgetConfigured ? (
              <div
                className={`p-4 rounded-2xl border shadow-sm flex items-start sm:items-center gap-3.5 ${
                  status === 'exceeded'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                    : status === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    status === 'exceeded'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60'
                      : status === 'warning'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/60'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60'
                  }`}
                >
                  {status === 'exceeded' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold capitalize">
                    {status === 'exceeded'
                      ? 'Budget Limit Exceeded'
                      : status === 'warning'
                      ? 'Approaching Budget Limit'
                      : 'Spending On Track'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">{alertMessage}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    No budget configured for {getMonthName(month)} {year}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set a monthly expense target to get warning alerts and track progress.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  Configure Now
                </button>
              </div>
            )}

            {/* 4 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Monthly Budget */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Monthly Budget
                  </span>
                  <Target className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isBudgetConfigured ? formatCurrency(budgetAmount) : 'Not Set'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Target for {getMonthName(month)}
                </p>
              </div>

              {/* Monthly Expenses */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Monthly Expenses
                  </span>
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(monthlyExpenses)}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Actual spending to date</p>
              </div>

              {/* Remaining Budget / Overrun */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Remaining Budget
                  </span>
                  <Scale className="w-5 h-5 text-emerald-500" />
                </div>
                <h3
                  className={`text-2xl font-black ${
                    remainingBudget < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isBudgetConfigured ? formatCurrency(remainingBudget) : '-'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {remainingBudget >= 0 ? 'Left to spend' : 'Overspent'}
                </p>
              </div>

              {/* Budget Used % */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Budget Used
                  </span>
                  <PieChart className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isBudgetConfigured ? `${budgetUsedPercentage}%` : '0%'}
                </h3>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      status === 'exceeded'
                        ? 'bg-rose-500'
                        : status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, isBudgetConfigured ? budgetUsedPercentage : 0)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Historical Budget Limits */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Configured Budget Records
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No previous budgets recorded yet. Click "Set Budget" above to create one.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setMonth(item.month);
                        setYear(item.year);
                      }}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {getMonthName(item.month)} {item.year}
                        </span>
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMonth={month}
        initialYear={year}
        initialAmount={budgetAmount || ''}
        onSuccess={loadBudgetData}
      />
    </div>
  );
};

export default BudgetPage;
