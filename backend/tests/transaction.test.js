const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
require('./setup');

describe('Transaction API & Authorization Security', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A', email: 'usera@example.com', password: 'password123' });
    userAToken = resA.body.token;
    userAId = resA.body.user._id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User B', email: 'userb@example.com', password: 'password123' });
    userBToken = resB.body.token;
    userBId = resB.body.user._id;
  });

  it('should create an income transaction with positive amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'income',
        amount: 50000,
        category: 'Salary',
        date: new Date(),
        description: 'Monthly tech salary',
        paymentMethod: 'Net Banking'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(50000);
    expect(res.body.data.type).toBe('income');
    expect(res.body.data.userId.toString()).toBe(userAId);
  });

  it('should reject transaction with zero or negative amount', async () => {
    const zeroRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 0,
        category: 'Food'
      })
      .expect(400);

    expect(zeroRes.body.success).toBe(false);

    const negRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: -150,
        category: 'Food'
      })
      .expect(400);

    expect(negRes.body.success).toBe(false);
  });

  it('should prevent User B from reading User A transaction (Cross-User Isolation)', async () => {
    // User A creates a transaction
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 1200,
        category: 'Food',
        description: 'User A Secret Dinner'
      })
      .expect(201);

    const transactionId = createRes.body.data._id;

    // User A can access it
    await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    // User B attempts to access User A's transaction using its ID
    const unauthorizedRes = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);

    expect(unauthorizedRes.body.success).toBe(false);
    expect(unauthorizedRes.body.message).toMatch(/not found or unauthorized/i);
  });

  it('should prevent User B from updating or deleting User A transaction', async () => {
    // User A creates a transaction
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 500,
        category: 'Travel'
      })
      .expect(201);

    const transactionId = createRes.body.data._id;

    // User B tries to update User A's transaction
    await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ amount: 99999 })
      .expect(404);

    // Verify amount was not changed
    const unchanged = await Transaction.findById(transactionId);
    expect(unchanged.amount).toBe(500);

    // User B tries to delete User A's transaction
    await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);

    // Verify document still exists
    const stillExists = await Transaction.findById(transactionId);
    expect(stillExists).not.toBeNull();
  });

  it('should filter transactions by type, category, and search keyword', async () => {
    // User A creates multiple transactions
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ type: 'income', amount: 30000, category: 'Salary', description: 'Main job' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ type: 'expense', amount: 2500, category: 'Food', description: 'Grocery shopping' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ type: 'expense', amount: 1500, category: 'Travel', description: 'Metro pass' });

    // Filter by type=expense
    const expRes = await request(app)
      .get('/api/transactions?type=expense')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
    expect(expRes.body.count).toBe(2);

    // Filter by category=Food
    const catRes = await request(app)
      .get('/api/transactions?category=Food')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
    expect(catRes.body.count).toBe(1);
    expect(catRes.body.data[0].category).toBe('Food');

    // Search by note 'Metro'
    const searchRes = await request(app)
      .get('/api/transactions?search=Metro')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
    expect(searchRes.body.count).toBe(1);
    expect(searchRes.body.data[0].description).toBe('Metro pass');
  });
});
