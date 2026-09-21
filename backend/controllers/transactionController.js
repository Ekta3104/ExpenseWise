const Transaction = require('../models/Transaction');
const fs = require('fs');
const csvParser = require('csv-parser');

// @desc    Create new transaction (income or expense)
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, date, description, paymentMethod } = req.body;

    // Validate amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive numeric value greater than 0'
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: parsedAmount,
      category,
      date: date ? new Date(date) : new Date(),
      description: description ? description.trim() : '',
      paymentMethod: paymentMethod || 'Cash'
    });

    return res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} transaction recorded successfully`,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions with filtering, search, pagination, and sorting
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
      month,
      year,
      sortBy = 'date',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Base query scoped strictly to current logged in user
    const query = { userId: req.user._id };

    // Filter by type (income/expense)
    if (type && ['income', 'expense'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    // Filter by category
    if (category && category.trim() !== '') {
      query.category = category.trim();
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod.trim() !== '') {
      query.paymentMethod = paymentMethod.trim();
    }

    // Filter by specific Month and Year if provided
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
      const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Search in description or category
    if (search && search.trim() !== '') {
      query.$or = [
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    const sortField = ['date', 'amount', 'createdAt'].includes(sortBy) ? sortBy : 'date';
    sortOptions[sortField] = order === 'asc' ? 1 : -1;

    // Total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limitNum) || 1;

    // Retrieve paginated records
    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Compute totals for current filter view
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    stats.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalTransactions
      },
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      },
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    // Strictly verify ownership: must match ID and userId
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, date, description, paymentMethod } = req.body;

    // Verify ownership before updating
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized'
      });
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive numeric value greater than 0'
        });
      }
      transaction.amount = parsedAmount;
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either income or expense'
        });
      }
      transaction.type = type;
    }

    if (category !== undefined) transaction.category = category.trim();
    if (date !== undefined) transaction.date = new Date(date);
    if (description !== undefined) transaction.description = description.trim();
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    const updatedTransaction = await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    // Strictly enforce user ownership
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    const csvHeaders = 'ID,Type,Amount,Category,Date,Payment Method,Description\n';
    const csvRows = transactions.map((t) => {
      const cleanDesc = (t.description || '').replace(/"/g, '""');
      const formattedDate = new Date(t.date).toISOString().split('T')[0];
      return `"${t._id}","${t.type}","${t.amount}","${t.category}","${formattedDate}","${t.paymentMethod}","${cleanDesc}"`;
    });

    const csvContent = csvHeaders + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ExpenseWise_Transactions_${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Import transactions from CSV
// @route   POST /api/transactions/import/csv
// @access  Private
const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        // Look for Type, Amount, Category, Date, etc. (case insensitive)
        const typeKey = Object.keys(data).find((k) => k.trim().toLowerCase() === 'type');
        const amountKey = Object.keys(data).find((k) => k.trim().toLowerCase() === 'amount');
        const catKey = Object.keys(data).find((k) => k.trim().toLowerCase() === 'category');
        const dateKey = Object.keys(data).find((k) => k.trim().toLowerCase() === 'date');
        const descKey = Object.keys(data).find((k) => ['description', 'note'].includes(k.trim().toLowerCase()));
        const payKey = Object.keys(data).find((k) => ['payment method', 'paymentmethod'].includes(k.trim().toLowerCase()));

        const rawType = (data[typeKey] || '').trim().toLowerCase();
        const rawAmount = parseFloat(data[amountKey]);
        const rawCat = (data[catKey] || 'Other').trim();
        const rawDate = data[dateKey] ? new Date(data[dateKey]) : new Date();
        const rawDesc = data[descKey] ? data[descKey].trim() : '';
        const rawPay = data[payKey] ? data[payKey].trim() : 'Cash';

        if (['income', 'expense'].includes(rawType) && !isNaN(rawAmount) && rawAmount > 0) {
          results.push({
            userId: req.user._id,
            type: rawType,
            amount: rawAmount,
            category: rawCat || 'Other',
            date: isNaN(rawDate.getTime()) ? new Date() : rawDate,
            description: rawDesc,
            paymentMethod: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'].includes(rawPay)
              ? rawPay
              : 'Other'
          });
        }
      })
      .on('end', async () => {
        // Clean up temporary file
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore unlink error
        }

        if (results.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid transaction records found in the uploaded CSV'
          });
        }

        const inserted = await Transaction.insertMany(results);

        return res.status(201).json({
          success: true,
          message: `Successfully imported ${inserted.length} transactions`,
          count: inserted.length
        });
      })
      .on('error', (err) => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
        next(err);
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportCSV,
  importCSV
};
