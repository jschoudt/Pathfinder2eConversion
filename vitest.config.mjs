import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.mjs'],
    testTimeout: 20000,
    globals: true,
    environment: 'node',
    reporters: ['default', 'json'],
    outputFile: '.vitest/test-results.json'
  }
});
