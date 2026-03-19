---
description: Rules for test files
globs: "**/*.test.ts,**/*.test.tsx"
---

# Test Conventions

- Use Vitest: `describe`, `it`, `expect`. Do not use Jest globals.
- Cover both success and error paths for every function under test.
- Use MSW (Mock Service Worker) for HTTP/API mocking — never mock `fetch` directly.
- NEVER connect to production or staging databases in tests. Use mocks or test fixtures.
- Co-locate test files next to the source: `src/app/api/foo/__tests__/route.test.ts`.
- Name test files `*.test.ts` or `*.test.tsx`.
