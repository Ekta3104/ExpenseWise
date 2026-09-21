const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Set or update monthly budget
// @route   POST /api/budget
// @access  Private
const setBudget = async (req, res, next) => {
  try {
    const { month, year, amount } = req.body;

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Valid month between 1 and 12 is required'
      });
    }

    if (isNaN(parsedYear) || parsedYear < 2000) {
      return res.status(400).json({
        success: false,
        message: 'Valid year is required'
      });
    }

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount must be a non-negative number'
      });
    }

    // Upsert budget for current user, month, and year
    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        month: parsedMonth,
        year: parsedYear
      },
      {
        userId: req.user._id,
        month: parsedMonth,
        year: parsedYear,
        amount: parsedAmount
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: `Budget of ₹${parsedAmount.toLocaleString('en-IN')} set for ${parsedMonth}/${parsedYear}`,
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly budget and spending status for a specific month/year
// @route   GET /api/budget
// @access  Private
const getBudget = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const month = parseInt(req.query.month, 10) || currentDate.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || currentDate.getFullYear();

    // Find budget configured for this user, month, and year
    const budgetDoc = await Budget.findOne({
      userId: req.user._id,
      month,
      year
    });

    const budgetAmount = budgetDoc ? budgetDoc.amount : 0;
    const isBudgetConfigured = !!budgetDoc;

    // Calculate actual expenses for this month via MongoDB aggregation
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const spendingStats = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    spendingStats.forEach((stat) => {
      if (stat._id === 'income') monthlyIncome = stat.total;
      if (stat._id === 'expense') monthlyExpenses = stat.total;
    });

    const remainingBalance = monthlyIncome - monthlyExpenses;
    const remainingBudget = isBudgetConfigured ? budgetAmount - monthlyExpenses : 0;
    const budgetUsedPercentage =
      isBudgetConfigured && budgetAmount > 0
        ? Math.round((monthlyExpenses / budgetAmount) * 100)
        : 0;

    // Warning status: 'none', 'normal', 'warning' (>= 80%), 'exceeded' (>= 100%)
    let status = 'not_configured';
    let alertMessage = null;

    if (isBudgetConfigured) {
      if (monthlyExpenses >= budgetAmount) {
        status = 'exceeded';
        alertMessage = `Warning: You have exceeded your monthly budget by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}!`;
      } else if (budgetUsedPercentage >= 80) {
        status = 'warning';
        alertMessage = `Caution: You have utilized ${budgetUsedPercentage}% of your monthly budget.`;
      } else {
        status = 'normal';
        alertMessage = `On track: ₹${remainingBudget.toLocaleString('en-IN')} remaining.`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        month,
        year,
        isBudgetConfigured,
        budgetAmount,
        budgetId: budgetDoc ? budgetDoc._id : null,
        monthlyIncome,
        monthlyExpenses,
        remainingBalance,
        remainingBudget,
        budgetUsedPercentage,
        status,
        alertMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget by ID
// @route   PUT /api/budget/:id
// @access  Private
const updateBudgetById = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount must be a non-negative number'
      });
    }

    // Verify ownership
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found or unauthorized'
      });
    }

    budget.amount = parsedAmount;
    await budget.save();

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget history across previous months
// @route   GET /api/budget/history
// @access  Private
const getBudgetHistory = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id })
      .sort({ year: -1, month: -1 })
      .limit(12);

    return res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setBudget,
  getBudget,
  updateBudgetById,
  getBudgetHistory
};
