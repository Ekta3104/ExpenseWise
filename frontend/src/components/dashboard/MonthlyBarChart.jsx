import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyBarChart = ({ monthlyTrend = [] }) => {
  if (!monthlyTrend || monthlyTrend.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center min-h-[340px] text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Trend Data
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Monthly income vs expense comparison will appear here over time.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: monthlyTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrend.map((item) => item.income),
        backgroundColor: '#10b981', // Emerald 500
        borderRadius: 6,
        barThickness: 16
      },
      {
        label: 'Expenses',
        data: monthlyTrend.map((item) => item.expense),
        backgroundColor: '#f43f5e', // Rose 500
        borderRadius: 6,
        barThickness: 16
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#94a3b8',
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            weight: 600,
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            return ` ${context.dataset.label}: ${formatCurrency(val)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(226, 232, 240, 0.6)'
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          },
          callback: (value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Income vs Expenses (6-Month Trend)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Track earnings vs spending momentum
        </p>
      </div>

      <div className="h-72 mt-4">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default MonthlyBarChart;
