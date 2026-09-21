const express = require('express');
const { body } = require('express-validator');
const {
  setBudget,
  getBudget,
  updateBudgetById,
  getBudgetHistory
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// Require authentication for all budget routes
router.use(protect);

router.get('/history', getBudgetHistory);

router
  .route('/')
  .get(getBudget)
  .post(
    [
      body('month')
        .notEmpty()
        .withMessage('Month is required')
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12'),
      body('year')
        .notEmpty()
        .withMessage('Year is required')
        .isInt({ min: 2000 })
        .withMessage('Year must be 2000 or greater'),
      body('amount')
        .notEmpty()
        .withMessage('Budget amount is required')
        .isFloat({ min: 0 })
        .withMessage('Budget amount must be a non-negative number'),
      validate
    ],
    setBudget
  );

router.route('/:id').put(
  [
    body('amount')
      .notEmpty()
      .withMessage('Budget amount is required')
      .isFloat({ min: 0 })
      .withMessage('Budget amount must be a non-negative number'),
    validate
  ],
  updateBudgetById
);

module.exports = router;
