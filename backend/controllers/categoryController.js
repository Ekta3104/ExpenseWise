const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase' },
  { name: 'Freelance', type: 'income', color: '#06b6d4', icon: 'Laptop' },
  { name: 'Investments', type: 'income', color: '#8b5cf6', icon: 'TrendingUp' },
  { name: 'Food', type: 'expense', color: '#f59e0b', icon: 'Utensils' },
  { name: 'Travel', type: 'expense', color: '#3b82f6', icon: 'Plane' },
  { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Bills', type: 'expense', color: '#ef4444', icon: 'Receipt' },
  { name: 'Entertainment', type: 'expense', color: '#a855f7', icon: 'Film' },
  { name: 'Health', type: 'expense', color: '#14b8a6', icon: 'HeartPulse' },
  { name: 'Other', type: 'expense', color: '#6b7280', icon: 'MoreHorizontal' }
];

// @desc    Get all available categories (system defaults + user custom)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    // Fetch custom categories created by current user
    const userCategories = await Category.find({ userId: req.user._id });

    // Combine defaults and custom categories
    const allCategories = [
      ...DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        isCustom: false,
        _id: `default_${cat.name.toLowerCase()}`
      })),
      ...userCategories.map((cat) => ({
        _id: cat._id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        isCustom: true
      }))
    ];

    return res.status(200).json({
      success: true,
      count: allCategories.length,
      data: allCategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type = 'expense', color = '#6366f1', icon = 'Tag' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists in defaults or user custom
    const trimmedName = name.trim();
    const existsInDefault = DEFAULT_CATEGORIES.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existsInDefault) {
      return res.status(400).json({
        success: false,
        message: `Category "${trimmedName}" already exists as a default category`
      });
    }

    const existsInUser = await Category.findOne({
      userId: req.user._id,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existsInUser) {
      return res.status(400).json({
        success: false,
        message: `You already have a category named "${trimmedName}"`
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: trimmedName,
      type: ['income', 'expense', 'both'].includes(type) ? type : 'expense',
      color,
      icon
    });

    return res.status(201).json({
      success: true,
      message: 'Custom category created successfully',
      data: {
        _id: category._id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        isCustom: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a custom category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Custom category not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
  DEFAULT_CATEGORIES
};
