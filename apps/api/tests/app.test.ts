import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';

import { createApp } from '../src/app.js';
import { checkDatabaseConnection } from '../src/config/database.js';
import { checkRedisConnection } from '../src/config/redis.js';
import { logger } from '../src/config/logger.js';
import { AppError } from '../src/common/errors/app-error.js';
import { errorHandler } from '../src/common/middleware/error.middleware.js';

// Mock the external dependencies used by the readiness endpoint.
vi.mock('../src/config/database.js', () => ({
  checkDatabaseConnection: vi.fn(),
}));

vi.mock('../src/config/redis.js', () => ({
  checkRedisConnection: vi.fn(),
}));

const app = createApp();
function createErrorTestApp() {
  const testApp = express();

  // Provide the request logger and request ID required by errorHandler.
  testApp.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const requestId = randomUUID();
        res.setHeader('X-Request-Id', requestId);
        return requestId;
      },
    }),
  );

  // Simulate an application-generated error.
  testApp.get('/test/app-error', (_req, _res, next) => {
    next(new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested product was not found.'));
  });

  // Simulate an unexpected internal error.
  testApp.get('/test/unexpected-error', (_req, _res, next) => {
    next(new Error('Sensitive database connection details'));
  });

  // Use the actual application error handler.
  testApp.use(errorHandler);

  return testApp;
}

const errorTestApp = createErrorTestApp();

describe('API health and error handling', () => {
  beforeEach(() => {
    // Default behavior: both dependencies are available.
    vi.mocked(checkDatabaseConnection).mockResolvedValue(undefined);
    vi.mocked(checkRedisConnection).mockResolvedValue(undefined);
  });

  it('should return 200 for the liveness endpoint', async () => {
    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
      meta: null,
    });
  });

  it('should return 404 for an unknown endpoint', async () => {
    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBeDefined();
  });

  it('should return 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/v1/health/test')
      .set('Content-Type', 'application/json')
      .send('{"invalid":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_JSON');
    expect(response.body.error.requestId).toBeDefined();
  });

  describe('Readiness endpoint', () => {
    it('should return 200 when PostgreSQL and Redis are available', async () => {
      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'ready',
        },
        meta: null,
      });

      expect(checkDatabaseConnection).toHaveBeenCalledOnce();
      expect(checkRedisConnection).toHaveBeenCalledOnce();
    });

    it('should return 503 when PostgreSQL is unavailable', async () => {
      vi.mocked(checkDatabaseConnection).mockRejectedValue(
        new Error('PostgreSQL connection failed'),
      );

      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.error.requestId).toBeDefined();

      expect(checkDatabaseConnection).toHaveBeenCalledOnce();
      expect(checkRedisConnection).toHaveBeenCalledOnce();
    });

    it('should return 503 when Redis is unavailable', async () => {
      vi.mocked(checkRedisConnection).mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.error.requestId).toBeDefined();

      expect(checkDatabaseConnection).toHaveBeenCalledOnce();
      expect(checkRedisConnection).toHaveBeenCalledOnce();
    });
  });

  describe('Error handling', () => {
    it('should return the correct response for an AppError', async () => {
      const response = await request(errorTestApp).get('/test/app-error');

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'The requested product was not found.',
          details: null,
          requestId: expect.any(String),
        },
      });

      expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
    });

    it('should return a sanitized 500 response for an unexpected error', async () => {
      const response = await request(errorTestApp).get('/test/unexpected-error');

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
          details: null,
          requestId: expect.any(String),
        },
      });

      // Internal error information must never reach the API consumer.
      expect(JSON.stringify(response.body)).not.toContain('Sensitive database connection details');

      expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
    });
  });
});
