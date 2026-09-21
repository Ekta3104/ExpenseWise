const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: [true, 'Please specify the month (1-12)'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12']
    },
    year: {
      type: Number,
      required: [true, 'Please specify the year'],
      min: [2000, 'Year must be valid']
    },
    amount: {
      type: Number,
      required: [true, 'Please provide the budget amount'],
      min: [0, 'Budget amount cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// One budget per user per month and year
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
