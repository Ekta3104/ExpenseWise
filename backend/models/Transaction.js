const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Transaction type must be either income or expense'
      },
      required: [true, 'Please specify transaction type (income or expense)']
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be a positive number greater than zero']
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Please provide a valid date'],
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
        message: 'Invalid payment method'
      },
      default: 'Cash'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for high-performance user query & date sorting
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
