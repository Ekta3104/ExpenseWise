const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// @desc    Get comprehensive dashboard analytics using MongoDB Aggregation
// @route   GET /api/dashboard
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const selectedMonth = parseInt(req.query.month, 10) || currentDate.getMonth() + 1;
    const selectedYear = parseInt(req.query.year, 10) || currentDate.getFullYear();

    // Date range for selected month
    const startOfMonth = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    // Date range for previous month (for comparison bonus)
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const startOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
    const endOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999));

    // 1. Facet Aggregation for current month totals & category breakdown
    const [currentMonthAnalytics] = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          categoryExpenses: [
            { $match: { type: 'expense' } },
            {
              $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ],
          paymentMethodBreakdown: [
            {
              $group: {
                _id: '$paymentMethod',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ]
        }
      }
    ]);

    // 2. Aggregate previous month totals for comparison
    const [prevMonthAnalytics] = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Parse current month totals
    let currentIncome = 0;
    let currentExpense = 0;
    let transactionCount = 0;

    if (currentMonthAnalytics && currentMonthAnalytics.totals) {
      currentMonthAnalytics.totals.forEach((item) => {
        if (item._id === 'income') currentIncome = item.total;
        if (item._id === 'expense') currentExpense = item.total;
        transactionCount += item.count;
      });
    }

    // Parse previous month totals
    let prevIncome = 0;
    let prevExpense = 0;
    if (prevMonthAnalytics) {
      if (prevMonthAnalytics._id === 'income') prevIncome = prevMonthAnalytics.total;
      if (prevMonthAnalytics._id === 'expense') prevExpense = prevMonthAnalytics.total;
    }

    // 3. Retrieve user's configured budget for selected month
    const budgetDoc = await Budget.findOne({
      userId: req.user._id,
      month: selectedMonth,
      year: selectedYear
    });

    const budgetAmount = budgetDoc ? budgetDoc.amount : 0;
    const isBudgetSet = !!budgetDoc;
    const remainingBudget = isBudgetSet ? budgetAmount - currentExpense : 0;
    const budgetUsedPercent =
      isBudgetSet && budgetAmount > 0
        ? Math.round((currentExpense / budgetAmount) * 100)
        : 0;

    let budgetStatus = 'not_set';
    let budgetMessage = 'No budget configured for this month.';
    if (isBudgetSet) {
      if (currentExpense >= budgetAmount) {
        budgetStatus = 'exceeded';
        budgetMessage = `Budget exceeded by ₹${(currentExpense - budgetAmount).toLocaleString('en-IN')}!`;
      } else if (budgetUsedPercent >= 80) {
        budgetStatus = 'warning';
        budgetMessage = `Caution: ${budgetUsedPercent}% of monthly budget used.`;
      } else {
        budgetStatus = 'normal';
        budgetMessage = `Healthy: ₹${remainingBudget.toLocaleString('en-IN')} budget remaining.`;
      }
    }

    // 4. Category breakdown with percentages
    const rawCategoryExpenses = (currentMonthAnalytics && currentMonthAnalytics.categoryExpenses) || [];
    const categoryBreakdown = rawCategoryExpenses.map((cat) => ({
      category: cat._id,
      total: cat.total,
      percentage: currentExpense > 0 ? Math.round((cat.total / currentExpense) * 100) : 0,
      count: cat.count
    }));

    // 5. Payment method breakdown
    const paymentBreakdown = (currentMonthAnalytics && currentMonthAnalytics.paymentMethodBreakdown) || [];

    // 6. 6-Month Income vs Expense Trend
    const sixMonthsAgo = new Date(Date.UTC(selectedYear, selectedMonth - 6, 1));
    const trendAggregation = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: sixMonthsAgo, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Build map for each of the last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(selectedYear, selectedMonth - 1 - i, 1));
      const m = d.getUTCMonth() + 1;
      const y = d.getUTCFullYear();
      const label = `${monthNames[m - 1]} ${y}`;

      const incomeItem = trendAggregation.find(
        (t) => t._id.year === y && t._id.month === m && t._id.type === 'income'
      );
      const expenseItem = trendAggregation.find(
        (t) => t._id.year === y && t._id.month === m && t._id.type === 'expense'
      );

      monthlyTrend.push({
        label,
        month: m,
        year: y,
        income: incomeItem ? incomeItem.total : 0,
        expense: expenseItem ? expenseItem.total : 0
      });
    }

    // 7. Recent 5 transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(5);

    // 8. Previous Month Comparison percentages
    const expenseChangePercent =
      prevExpense > 0
        ? Math.round(((currentExpense - prevExpense) / prevExpense) * 100)
        : currentExpense > 0
        ? 100
        : 0;

    const incomeChangePercent =
      prevIncome > 0
        ? Math.round(((currentIncome - prevIncome) / prevIncome) * 100)
        : currentIncome > 0
        ? 100
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          month: selectedMonth,
          year: selectedYear,
          monthName: monthNames[selectedMonth - 1]
        },
        cards: {
          totalIncome: currentIncome,
          totalExpenses: currentExpense,
          netBalance: currentIncome - currentExpense,
          budgetAmount,
          remainingBudget,
          budgetUsedPercent,
          budgetStatus,
          budgetMessage,
          isBudgetSet,
          transactionCount
        },
        comparisons: {
          prevMonthIncome: prevIncome,
          prevMonthExpense: prevExpense,
          incomeChangePercent,
          expenseChangePercent
        },
        categoryBreakdown,
        paymentBreakdown,
        monthlyTrend,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary };
