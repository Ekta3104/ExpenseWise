import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { PieChart as PieIcon } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#f59e0b', // Amber (Food)
  '#3b82f6', // Blue (Travel)
  '#ec4899', // Pink (Shopping)
  '#ef4444', // Red (Bills)
  '#a855f7', // Purple (Entertainment)
  '#14b8a6', // Teal (Health)
  '#6366f1', // Indigo
  '#6b7280'  // Gray (Other)
];

const CategoryDoughnutChart = ({ categoryBreakdown = [] }) => {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center min-h-[340px] text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Expenses Recorded
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Expense breakdown will appear here once you record expenses for this month.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: categoryBreakdown.map((item) => item.category),
    datasets: [
      {
        data: categoryBreakdown.map((item) => item.total),
        backgroundColor: categoryBreakdown.map(
          (item, idx) => COLORS[idx % COLORS.length]
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Use custom custom HTML legend for sleek layout
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatCurrency(val)}`;
          }
        }
      }
    },
    cutout: '72%'
  };

  const totalExpense = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Category-wise Expenses
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Breakdown of spending across categories
        </p>
      </div>

      {/* Doughnut Chart Canvas with Center Text */}
      <div className="relative h-56 my-4 flex items-center justify-center">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Spent
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
        {categoryBreakdown.map((item, idx) => {
          const color = COLORS[idx % COLORS.length];
          return (
            <div
              key={item.category}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(item.total)}
                </span>
                <span className="text-slate-400 text-[11px] w-8 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDoughnutChart;
