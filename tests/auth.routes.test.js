const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { TestDataFactory } = require('./setup');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('[TC-1][AC-1] should create user with hashed password', async () => {
      const userData = TestDataFactory.validUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.password).not.toBe(userData.password);
      expect(userInDb.password).toMatch(/^\$2[aby]\$\d+\$/);
    });

    test('[TC-3][AC-3] should return 400 for invalid email format', async () => {
      const userData = TestDataFactory.invalidEmailUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('email');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid')
        })
      );
    });

    test('[TC-4][AC-4] should return 400 for weak password', async () => {
      const userData = TestDataFactory.weakPasswordUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringMatching(/(length|strong|8|upper|lower|digit|special)/i)
        })
      );
    });

    test('[TC-2][AC-2] should return 409 for duplicate email', async () => {
      const userData = TestDataFactory.validUser();

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('already exists');
    });

    test('[EC-4][AC-10] should sanitize user inputs', async () => {
      const userData = TestDataFactory.xssAttempt();

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb.name).not.toContain('<script>');
      expect(userInDb.name).not.toContain('onerror');
    });

    test('[EC-2][AC-10] should return 400 for missing required fields', async () => {
      const testCases = [
        { email: 'test@test.com', name: 'Test' },
        { email: 'test@test.com', password: 'Password123!' },
        { password: 'Password123!', name: 'Test' },
        {}
      ];

      for (const invalidData of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('errors');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const userData = TestDataFactory.validUser();
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    test('[TC-5][AC-6] should return JWT tokens for valid credentials', async () => {
      const credentials = TestDataFactory.validCredentials();

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(0);

      const tokenParts = response.body.data.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    test('[TC-6][AC-7] should return 401 for invalid credentials', async () => {
      const credentials = TestDataFactory.invalidCredentials();

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toMatch(/invalid|incorrect|wrong/);
    });

    test('[TC-7][AC-7] should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('[TC-8][AC-11] should implement rate limiting', async () => {
      const credentials = TestDataFactory.invalidCredentials();
      let rateLimitHit = false;

      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(credentials);

        if (response.status === 429) {
          rateLimitHit = true;
          expect(response.body.message.toLowerCase()).toContain('rate limit');
          break;
        }
      }

      expect(rateLimitHit).toBe(true);
    });
  });

  describe('GET /api/auth/me (Protected)', () => {
    let authToken;
    let userData;

    beforeEach(async () => {
      userData = TestDataFactory.validUser();
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      authToken = response.body.data.token;
    });

    test('[TC-9][AC-9] should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('name', userData.name);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('[TC-10][AC-8] should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('token');
    });

    test('[TC-11][AC-9] should return 401 with expired token', async () => {
      const { generateExpiredToken } = require('./setup');
      const expiredToken = generateExpiredToken();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('expired');
    });

    test('[EC-5][AC-8] should return 401 with invalid token format', async () => {
      const testCases = [
        { auth: 'InvalidToken' },
        { auth: 'Bearer' },
        { auth: 'Bearer invalid.token.here' },
        { auth: 'Basic dXNlcjpwYXNz' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', testCase.auth)
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      }
    });
  });
});
