import { configDefaults, defineConfig } from 'vitest/config';

// Bot is a standalone package (no npm workspace), so it needs its own vitest
// runner. Node environment — these are server/bot unit tests, no DOM.
//
// NOTE: 18 older suites under src/zoe/__tests__ use Node's built-in `node:test`
// runner (`import { test } from 'node:test'`) instead of vitest, so vitest
// can't collect them ("No test suite found"). They're excluded below and still
// run via `node --test`. Standardizing them on vitest (per .claude/rules/
// tests.md) is a separate follow-up; new tests should be vitest-style and will
// be picked up automatically.
const LEGACY_NODE_TEST_FILES = [
  'src/zoe/__tests__/pii.test.ts',
  'src/zoe/__tests__/proactive.test.ts',
  'src/zoe/__tests__/thread-memory.test.ts',
  'src/zoe/__tests__/thread-ops.test.ts',
  'src/zoe/__tests__/threads.test.ts',
  'src/zoe/critics/__tests__/types.test.ts',
  'src/zoe/__tests__/approvals.test.ts',
  'src/zoe/__tests__/bonfire-queue.test.ts',
  'src/zoe/__tests__/commands.test.ts',
  'src/zoe/__tests__/crm.test.ts',
  'src/zoe/__tests__/decompose.test.ts',
  'src/zoe/__tests__/dispatch.test.ts',
  'src/zoe/__tests__/learn.test.ts',
  'src/zoe/__tests__/reflexion.test.ts',
  'src/zoe/__tests__/relay.test.ts',
  'src/zoe/__tests__/sidequests.test.ts',
  'src/zoe/__tests__/workers.test.ts',
  'src/zoe/__tests__/agents.test.ts',
];

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, ...LEGACY_NODE_TEST_FILES],
  },
});
