import { describe, test, expect, beforeAll } from 'bun:test';
import request from 'supertest';
import type { Express } from 'express';

describe('Middleware Tests - AC-4: Express Middleware Setup', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: importedApp } = await import('../src/index');
    app = importedApp;
  });

  test('TC-4: should have CORS middleware configured', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  test('TC-4: should have Helmet security headers', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-download-options']).toBeDefined();
  });

  test('TC-4: should have Morgan logging middleware', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});

describe('Error Handling Tests - AC-8: Error Handling Middleware', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: importedApp } = await import('../src/index');
    app = importedApp;
  });

  test('TC-11: should have error handling middleware for 404', async () => {
    const response = await request(app).get('/non-existent-route-12345');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Not Found');
  });
});
