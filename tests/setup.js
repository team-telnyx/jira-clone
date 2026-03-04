const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.setTimeout(30000);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  await mongoose.connect(mongoUri);

  process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.BCRYPT_SALT_ROUNDS = '10';
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

const TestDataFactory = {
  validUser: () => ({
    email: 'test@example.com',
    password: 'Str0ngP@ssw0rd!',
    name: 'Test User'
  }),

  weakPasswordUser: () => ({
    email: 'weak@example.com',
    password: '123',
    name: 'Weak User'
  }),

  invalidEmailUser: () => ({
    email: 'not-an-email',
    password: 'Str0ngP@ssw0rd!',
    name: 'Invalid Email User'
  }),

  validCredentials: () => ({
    email: 'test@example.com',
    password: 'Str0ngP@ssw0rd!'
  }),

  invalidCredentials: () => ({
    email: 'test@example.com',
    password: 'WrongPassword!'
  }),

  xssAttempt: () => ({
    email: 'xss@example.com',
    password: 'Str0ngP@ssw0rd!',
    name: '<script>alert("xss")</script>'
  }),

  sqlInjectionAttempt: () => ({
    email: 'injection@example.com',
    password: 'Str0ngP@ssw0rd!',
    name: 'Hacker\'; DROP TABLE users; --'
  })
};

const generateTestToken = (payload = { userId: '123456789012345678901234', email: 'test@example.com' }) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateExpiredToken = (payload = { userId: '123456789012345678901234', email: 'test@example.com' }) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
};

module.exports = {
  TestDataFactory,
  generateTestToken,
  generateExpiredToken
};
