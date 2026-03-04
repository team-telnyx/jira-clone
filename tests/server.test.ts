import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import type { Express } from 'express';

describe('Server Tests - AC-3: Express Server Setup', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: importedApp } = await import('../src/index');
    app = importedApp;
  });

  afterAll(() => {});

  test('TC-3: should import Express app without errors', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });

  test('TC-3: should have Express app with listen method', () => {
    expect(app.listen).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});

describe('Server Tests - AC-7: Health Check Endpoint', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: importedApp } = await import('../src/index');
    app = importedApp;
  });

  test('TC-8: should respond to health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('TC-8: should return status up at health endpoint', async () => {
    const response = await request(app).get('/health');
    
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  test('TC-8: should respond to root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.status).toBe(200);
  });
});
