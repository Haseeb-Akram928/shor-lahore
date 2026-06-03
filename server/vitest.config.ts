import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'node',
    hookTimeout: 1200000, // 20 minutes to allow initial download of 509MB mongodb binary over slower connections
  },
});
