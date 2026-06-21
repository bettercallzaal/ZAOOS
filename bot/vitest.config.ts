import { defineConfig } from 'vitest/config';

// Bot is a standalone package (no npm workspace), so it needs its own vitest
// runner. Node environment — these are server/bot unit tests, no DOM.
//
// Suites that historically used Node's built-in `node:test` runner were
// migrated to import `test` from vitest (they keep using `node:assert/strict`,
// which works fine inside vitest), so vitest now collects the whole suite.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
