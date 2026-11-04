import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/test.env.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
