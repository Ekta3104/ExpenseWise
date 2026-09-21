import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo', // indigo, green, red, amber
  badge
}) => {
  const schemeClasses = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      icon: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-200 dark:hover:border-indigo-800/60'
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-200 dark:hover:border-emerald-800/60'
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      icon: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-200 dark:hover:border-rose-800/60'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-200 dark:hover:border-amber-800/60'
    }
  };

  const currentScheme = schemeClasses[colorScheme] || schemeClasses.indigo;

  return (
    <div
      className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-md ${currentScheme.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </span>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${currentScheme.bg} ${currentScheme.icon}`}
        >
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
