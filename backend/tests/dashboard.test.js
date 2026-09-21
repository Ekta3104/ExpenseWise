const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
require('./setup');

describe('Dashboard Analytics & MongoDB Aggregation', () => {
  let token;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dashboard User', email: 'dash@example.com', password: 'password123' });
    token = res.body.token;
  });

  it('should return aggregated dashboard data including cards, category breakdown, and monthly trend', async () => {
    // Set budget
    await request(app)
      .post('/api/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: currentMonth, year: currentYear, amount: 30000 });

    // Add Income
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'income', amount: 60000, category: 'Salary', date: new Date() });

    // Add multiple expenses across categories
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 5000, category: 'Food', date: new Date() });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 7000, category: 'Shopping', date: new Date() });

    const res = await request(app)
      .get(`/api/dashboard?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { cards, categoryBreakdown, monthlyTrend, recentTransactions } = res.body.data;

    expect(cards.totalIncome).toBe(60000);
    expect(cards.totalExpenses).toBe(12000);
    expect(cards.netBalance).toBe(48000);
    expect(cards.budgetAmount).toBe(30000);
    expect(cards.remainingBudget).toBe(18000);
    expect(cards.budgetUsedPercent).toBe(40);

    // Category breakdown check
    expect(categoryBreakdown.length).toBe(2);
    const shoppingCat = categoryBreakdown.find((c) => c.category === 'Shopping');
    expect(shoppingCat.total).toBe(7000);

    // Monthly trend check
    expect(monthlyTrend.length).toBe(6);

    // Recent transactions check
    expect(recentTransactions.length).toBe(3);
  });

  it('should return clean defaults when month has no transactions or budget', async () => {
    const res = await request(app)
      .get(`/api/dashboard?month=2&year=2024`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { cards, categoryBreakdown } = res.body.data;
    expect(cards.totalIncome).toBe(0);
    expect(cards.totalExpenses).toBe(0);
    expect(cards.netBalance).toBe(0);
    expect(cards.isBudgetSet).toBe(false);
    expect(categoryBreakdown.length).toBe(0);
  });
});
