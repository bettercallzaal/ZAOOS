import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Pin the test timezone to UTC so date-sensitive route tests (streaks
// "isActiveToday", music-history "today" windows) are DETERMINISTIC across
// machines. CI (ubuntu) and prod (Vercel) run in UTC; without this a dev on a
// non-UTC machine (e.g. US timezones) sees those suites go red locally while
// they pass on CI - the exact confusion documented in doc 2146. Set before the
// config is evaluated so every worker inherits it.
process.env.TZ = 'UTC';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/jsdom-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    coverage: {
      include: ['src/app/api/**'],
      reporter: ['text', 'json-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
