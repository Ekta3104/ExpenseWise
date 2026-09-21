const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getCategories)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Category name is required'),
      body('type')
        .optional()
        .isIn(['income', 'expense', 'both'])
        .withMessage('Type must be income, expense, or both'),
      validate
    ],
    createCategory
  );

router.route('/:id').delete(deleteCategory);

module.exports = router;
