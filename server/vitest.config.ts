import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'node',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 300000,
    hookTimeout: 1200000, // Allows the initial MongoDB binary download on slower CI runners.
  },
});
