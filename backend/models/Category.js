const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means global system default category
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      default: 'expense'
    },
    color: {
      type: String,
      default: '#6366f1' // default indigo color
    },
    icon: {
      type: String,
      default: 'Tag'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate categories for the same user
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
