import { defineConfig } from 'vitest/config';

// Standalone test config for the estate-control-plane tool (the repo's root
// vitest config only scans src/). Run: npx vitest run --config tools/estate-control-plane/vitest.config.ts
export default defineConfig({
  test: {
    include: ['tools/estate-control-plane/**/*.test.ts'],
    environment: 'node',
  },
});
