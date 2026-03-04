process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/middleware/auth');

const app = express();
app.use(express.json());
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

describe('Auth Middleware Unit Tests', () => {
  const validToken = jwt.sign(
    { userId: '123', email: 'test@test.com' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  
  it('should allow request with valid JWT', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    expect(response.body.user).toBeDefined();
    expect(response.body.user.userId).toBe('123');
  });
  
  it('should reject request without Authorization header', async () => {
    const response = await request(app)
      .get('/protected')
      .expect(401);
    
    expect(response.body.error).toBeDefined();
  });
  
  it('should reject request with invalid Authorization format', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', validToken)
      .expect(401);
    
    expect(response.body.error).toBeDefined();
  });
  
  it('should reject request with expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: '123' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );
    
    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
  
  it('should reject request with invalid JWT signature', async () => {
    const invalidToken = jwt.sign(
      { userId: '123' },
      'wrong-secret'
    );
    
    await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });
});
