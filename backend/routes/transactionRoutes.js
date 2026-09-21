const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportCSV,
  importCSV
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `transactions-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported'));
    }
  }
});

// All transaction routes require authentication
router.use(protect);

// CSV Export and Import
router.get('/export/csv', exportCSV);
router.post('/import/csv', upload.single('file'), importCSV);

// Standard CRUD routes
router
  .route('/')
  .get(getTransactions)
  .post(
    [
      body('type')
        .notEmpty()
        .withMessage('Transaction type is required')
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
      body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
      body('category').trim().notEmpty().withMessage('Category is required'),
      validate
    ],
    createTransaction
  );

router
  .route('/:id')
  .get(getTransactionById)
  .put(
    [
      body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
      body('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be either income or expense'),
      validate
    ],
    updateTransaction
  )
  .delete(deleteTransaction);

module.exports = router;
