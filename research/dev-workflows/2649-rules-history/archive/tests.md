---
description: Rules for test files
globs: "**/*.test.ts,**/*.test.tsx"
---

# Test Conventions

- Use Vitest: `describe`, `it`, `expect`. Do not use Jest globals.
- Cover both success and error paths for every function under test.
- Mock modules with `vi.mock()` + `vi.hoisted()` — do NOT use MSW or mock `fetch` directly.
- Use shared helpers from `src/test-utils/api-helpers.ts` for session mocking, request building, and Supabase chain mocks.
- Use table-driven tests (`describe.each`) for testing auth guards and input validation across multiple routes.
- NEVER connect to production or staging databases in tests. Use mocks or test fixtures.
- Co-locate test files next to the source: `src/app/api/foo/__tests__/route.test.ts`.
- Name test files `*.test.ts` or `*.test.tsx`.
- Cross-route auth/admin tests go in `src/app/api/__tests__/`.
