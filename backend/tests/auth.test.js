const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
require('./setup');

describe('Authentication API', () => {
  const testUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123'
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should register a new user successfully and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.password).toBeUndefined(); // Password must never be returned

    // Verify stored user in DB has hashed password
    const storedUser = await User.findOne({ email: testUser.email }).select('+password');
    expect(storedUser.password).not.toBe(testUser.password);
  });

  it('should reject registration if email is already in use', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(400);

    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toMatch(/already registered/i);
  });

  it('should reject registration if required fields are missing or invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should log in an existing user with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe(testUser.name);
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should fetch current user profile with valid JWT', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser).expect(201);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject access to protected route when token is missing', async () => {
    const res = await request(app).get('/api/auth/me').expect(401);
    expect(res.body.success).toBe(false);
  });
});
