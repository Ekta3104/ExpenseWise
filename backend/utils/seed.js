const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

dotenv.config();

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expensewise';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});
    await Category.deleteMany({});

    // 1. Create Primary Demo User
    const primaryUser = await User.create({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123'
    });

    // 2. Create Secondary User (for authorization verification)
    const secondaryUser = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: 'password123'
    });

    console.log('[Seed] Users created:');
    console.log(' - alex@example.com / password123 (Primary Demo)');
    console.log(' - sarah@example.com / password123 (Secondary User)');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 3. Create Budget for current month: ₹35,000
    await Budget.create({
      userId: primaryUser._id,
      month: currentMonth,
      year: currentYear,
      amount: 35000
    });

    // 4. Create Transactions for Alex in Current Month
    const currentTransactions = [
      {
        userId: primaryUser._id,
        type: 'income',
        amount: 75000,
        category: 'Salary',
        date: new Date(currentYear, currentMonth - 1, 1),
        description: 'Tech Lead Monthly Salary',
        paymentMethod: 'Net Banking'
      },
      {
        userId: primaryUser._id,
        type: 'income',
        amount: 15000,
        category: 'Freelance',
        date: new Date(currentYear, currentMonth - 1, 10),
        description: 'Frontend consulting project',
        paymentMethod: 'UPI'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 8500,
        category: 'Food',
        date: new Date(currentYear, currentMonth - 1, 3),
        description: 'Supermarket monthly groceries & dining',
        paymentMethod: 'Credit Card'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 4200,
        category: 'Travel',
        date: new Date(currentYear, currentMonth - 1, 5),
        description: 'Metro pass & fuel refill',
        paymentMethod: 'UPI'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 6800,
        category: 'Shopping',
        date: new Date(currentYear, currentMonth - 1, 8),
        description: 'Autumn clothing and shoes',
        paymentMethod: 'Debit Card'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 3200,
        category: 'Bills',
        date: new Date(currentYear, currentMonth - 1, 12),
        description: 'Fiber internet & electricity utility',
        paymentMethod: 'Net Banking'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 2100,
        category: 'Entertainment',
        date: new Date(currentYear, currentMonth - 1, 14),
        description: 'Movie night and snacks with friends',
        paymentMethod: 'UPI'
      }
    ];

    // Previous month transactions for historical comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousTransactions = [
      {
        userId: primaryUser._id,
        type: 'income',
        amount: 70000,
        category: 'Salary',
        date: new Date(prevYear, prevMonth - 1, 1),
        description: 'Salary for previous month',
        paymentMethod: 'Net Banking'
      },
      {
        userId: primaryUser._id,
        type: 'expense',
        amount: 22000,
        category: 'Food',
        date: new Date(prevYear, prevMonth - 1, 15),
        description: 'Groceries and food',
        paymentMethod: 'Credit Card'
      }
    ];

    await Transaction.insertMany([...currentTransactions, ...previousTransactions]);

    // Secondary user transactions (strictly separated)
    await Transaction.create({
      userId: secondaryUser._id,
      type: 'expense',
      amount: 1999,
      category: 'Shopping',
      date: new Date(),
      description: "Sarah's private transaction",
      paymentMethod: 'UPI'
    });

    console.log('[Seed] Transactions and budgets seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
