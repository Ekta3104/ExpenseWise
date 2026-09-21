const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
require('./setup');

describe('Monthly Budget API & Calculation Logic', () => {
  let token;
  let userId;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Budget User', email: 'budget@example.com', password: 'password123' });
    token = res.body.token;
    userId = res.body.user._id;
  });

  it('should set and update a monthly budget', async () => {
    // Set budget: ₹20,000
    const setRes = await request(app)
      .post('/api/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: currentMonth,
        year: currentYear,
        amount: 20000
      })
      .expect(200);

    expect(setRes.body.success).toBe(true);
    expect(setRes.body.data.amount).toBe(20000);
    expect(setRes.body.data.month).toBe(currentMonth);

    // Update budget: ₹25,000
    const updateRes = await request(app)
      .post('/api/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: currentMonth,
        year: currentYear,
        amount: 25000
      })
      .expect(200);

    expect(updateRes.body.data.amount).toBe(25000);
  });

  it('should accurately calculate budget percentage and remaining balance (Example: Budget=20000, Expense=15000 -> 75%)', async () => {
    // Set budget of ₹20,000
    await request(app)
      .post('/api/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: currentMonth, year: currentYear, amount: 20000 });

    // Add Income: ₹50,000
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 50000,
        category: 'Salary',
        date: new Date()
      });

    // Add Expense: ₹15,000
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 15000,
        category: 'Food',
        date: new Date()
      });

    const budgetRes = await request(app)
      .get(`/api/budget?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = budgetRes.body.data;
    expect(data.budgetAmount).toBe(20000);
    expect(data.monthlyIncome).toBe(50000);
    expect(data.monthlyExpenses).toBe(15000);
    expect(data.remainingBalance).toBe(35000); // 50000 - 15000
    expect(data.remainingBudget).toBe(5000); // 20000 - 15000
    expect(data.budgetUsedPercentage).toBe(75); // 15000/20000 = 75%
    expect(data.status).toBe('normal');
  });

  it('should trigger warning when spending reaches 80% and exceeded when >= 100%', async () => {
    await request(app)
      .post('/api/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: currentMonth, year: currentYear, amount: 10000 });

    // Expense = ₹8,500 (85% -> warning)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 8500, category: 'Bills', date: new Date() });

    const warnRes = await request(app)
      .get(`/api/budget?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(warnRes.body.data.budgetUsedPercentage).toBe(85);
    expect(warnRes.body.data.status).toBe('warning');

    // Add ₹2,000 more (Total = ₹10,500 -> exceeded)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 2000, category: 'Shopping', date: new Date() });

    const exceedRes = await request(app)
      .get(`/api/budget?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(exceedRes.body.data.budgetUsedPercentage).toBe(105);
    expect(exceedRes.body.data.status).toBe('exceeded');
  });

  it('should gracefully handle months with no transactions and no budget configured', async () => {
    // Query month with no budget
    const noBudgetRes = await request(app)
      .get('/api/budget?month=1&year=2025')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(noBudgetRes.body.data.isBudgetConfigured).toBe(false);
    expect(noBudgetRes.body.data.budgetAmount).toBe(0);
    expect(noBudgetRes.body.data.budgetUsedPercentage).toBe(0);
    expect(noBudgetRes.body.data.monthlyExpenses).toBe(0);
  });
});
