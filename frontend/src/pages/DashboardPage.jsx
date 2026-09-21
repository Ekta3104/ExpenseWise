import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import MonthSelector from '../components/dashboard/MonthSelector';
import SummaryCards from '../components/dashboard/SummaryCards';
import BudgetAlertBanner from '../components/dashboard/BudgetAlertBanner';
import CategoryDoughnutChart from '../components/dashboard/CategoryDoughnutChart';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList';
import TransactionModal from '../components/transactions/TransactionModal';
import BudgetModal from '../components/budget/BudgetModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { transactionService } from '../services/transactionService';
import { Plus, SlidersHorizontal, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Load Dashboard Data
  const loadDashboard = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await dashboardService.getDashboardData(month, year);
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month, year]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleMonthChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleCreateTransaction = async (formData) => {
    const res = await transactionService.createTransaction(formData);
    if (res.success) {
      toast.success(res.message || 'Transaction recorded');
      loadDashboard(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time insights and analytics for your spending & budgets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <MonthSelector month={month} year={year} onChange={handleMonthChange} />

            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              Budget
            </button>

            <button
              onClick={() => setIsTransactionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <LoadingSpinner message="Loading dashboard analytics..." />
          </div>
        ) : (
          <>
            {/* Smart Budget Alert Banner */}
            <BudgetAlertBanner
              cards={dashboardData?.cards}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            />

            {/* 4 Summary Stat Cards */}
            <SummaryCards
              cards={dashboardData?.cards}
              comparisons={dashboardData?.comparisons}
            />

            {/* Visual Analytics Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Category Doughnut Chart */}
              <div className="lg:col-span-5">
                <CategoryDoughnutChart
                  categoryBreakdown={dashboardData?.categoryBreakdown}
                />
              </div>

              {/* Monthly Income vs Expense Bar Chart */}
              <div className="lg:col-span-7">
                <MonthlyBarChart monthlyTrend={dashboardData?.monthlyTrend} />
              </div>
            </div>

            {/* Recent Transactions List */}
            <div>
              <RecentTransactionsList
                transactions={dashboardData?.recentTransactions}
                onAddTransaction={() => setIsTransactionModalOpen(true)}
              />
            </div>
          </>
        )}
      </main>

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
      />

      {/* Set / Update Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        initialMonth={month}
        initialYear={year}
        initialAmount={dashboardData?.cards?.budgetAmount || ''}
        onSuccess={() => loadDashboard(true)}
      />
    </div>
  );
};

export default DashboardPage;
