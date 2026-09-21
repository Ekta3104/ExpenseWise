const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/expensewise_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop test database and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});
