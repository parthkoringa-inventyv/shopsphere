// Provide deterministic environment variables for tests.
// These values are intentionally independent of the local .env file.

process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.PORT = '3100';
process.env.CORS_ORIGIN = 'http://localhost:4300';

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/shopsphere_test';

process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = 'test-only-password';
