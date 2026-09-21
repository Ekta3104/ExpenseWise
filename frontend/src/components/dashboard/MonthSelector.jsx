import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MONTH_NAMES } from '../../utils/formatters';

const MonthSelector = ({ month, year, onChange }) => {
  const currentActualDate = new Date();
  const currentActualMonth = currentActualDate.getMonth() + 1;
  const currentActualYear = currentActualDate.getFullYear();

  const handlePrev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const handleJumpToToday = () => {
    onChange(currentActualMonth, currentActualYear);
  };

  const isCurrentMonth = month === currentActualMonth && year === currentActualYear;

  // Years range
  const years = [2023, 2024, 2025, 2026, 2027, 2028];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Prev / Next controls */}
      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-1">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => onChange(parseInt(e.target.value, 10), year)}
            className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer py-1"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1} className="dark:bg-slate-900">
                {name}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => onChange(month, parseInt(e.target.value, 10))}
            className="bg-transparent text-sm font-semibold text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer py-1"
          >
            {years.map((y) => (
              <option key={y} value={y} className="dark:bg-slate-900">
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jump to current month button */}
      {!isCurrentMonth && (
        <button
          onClick={handleJumpToToday}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          This Month
        </button>
      )}
    </div>
  );
};

export default MonthSelector;
