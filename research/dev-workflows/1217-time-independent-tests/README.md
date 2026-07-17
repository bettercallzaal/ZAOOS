---
topic: dev-workflows
type: ops-guide
status: live
last-validated: 2026-07-17
related-docs: 1174
original-query: "Time-independent test patterns — prevent CI rot from hardcoded dates"
tier: STANDARD
---

# 1217 — Time-Independent Tests: Preventing CI Rot from Hardcoded Dates

## The Problem

Tests that use hardcoded future dates expire silently. A test written today with
`scheduledFor: '2026-07-17T10:00:00Z'` passes on the day it is written. On
July 18 it fails. The code is unchanged; the CI now blocks all PRs on the repo.

This is exactly what happened in ZAOOS on 2026-07-17: the `chat/schedule` test
`accepts valid embedHash format` used a hardcoded `scheduledFor` that was 10
months in the future when written. By show-eve (COC #7, Jul 18) the date had
expired, the route's future-date guard returned 400 instead of 200, and every
open PR on the repo had a red Test badge.

**Blast radius:** A single expired date fixture blocks ALL open PRs on the repo
because CI runs the full test suite on every PR. The CI failure is not scoped
to the file that was edited.

## The Pattern

### Anti-pattern (don't do this in success-path tests)

```typescript
const req = makePostRequest('/api/chat/schedule', {
  text: 'Hello',
  scheduledFor: '2026-07-17T10:00:00Z',  // expires; breaks CI on Jul 17
});
expect(res.status).toBe(200);
```

### Correct pattern (used in ZAOOS `schedule/route.test.ts` time-validation tests)

```typescript
const futureDate = new Date();
futureDate.setHours(futureDate.getHours() + 1);

const req = makePostRequest('/api/chat/schedule', {
  text: 'Hello',
  scheduledFor: futureDate.toISOString(),  // always 1 hour from now
});
expect(res.status).toBe(200);
```

### When hardcoded dates ARE safe

Hardcoded dates are only safe when the test is asserting on **mock data returned
from a stubbed dependency** (not on behavior gated by wall-clock time):

```typescript
// SAFE: the date is in mock return data; no route logic checks if it's past
mockSupabaseMock = chainMock({
  data: [{ id: '1', scheduled_for: '2026-07-17T10:00:00Z' }],
  error: null,
});
const res = await GET(req);
expect(res.status).toBe(200);
expect(body.scheduled[0].scheduled_for).toBe('2026-07-17T10:00:00Z');
```

In this case the hardcoded date is just a fixture value in a mock — no
production code validates whether it is in the future.

## The Rule

> **Any test that expects a 200 (success) response on a route with a
> "must be in the future" validation MUST use a dynamic date
> (`new Date() + offset`), never a hardcoded ISO string.**

The converse: tests that expect a **400** for other reasons (invalid
format, missing field) can use a hardcoded past date without problem —
they will fail validation before reaching the time check, so the
expired date is never evaluated. But even there, a dynamic future date
is clearer intent.

## Fix Procedure (when you find an expired date)

1. Identify the failing test. Look for `toBe(200)` near a `scheduledFor`
   field.
2. Replace the hardcoded string with:
   ```typescript
   const futureDate = new Date();
   futureDate.setHours(futureDate.getHours() + 1);
   // ...
   scheduledFor: futureDate.toISOString(),
   ```
3. Open a **separate test-only PR** targeting the affected file. Do not
   bundle the fix into an unrelated feature PR — the fix must automerge
   quickly to unblock all other PRs.
4. Once merged, rebase all blocked PRs on main to pick up the fix.

## Incident Record (2026-07-17)

| Field | Value |
|---|---|
| Affected file | `src/app/api/chat/schedule/__tests__/route.test.ts` |
| Expired date | `2026-07-17T10:00:00Z` |
| Failing test | `accepts valid embedHash format (0x followed by 40 hex chars)` |
| Root cause | Hardcoded date was future when written (~Oct 2025), expired on show-eve |
| Fix | PR #1773 — replaced with `new Date() + 1h` dynamic pattern |
| PRs unblocked | #1756, #1758, #1759, #1762 (all rebased on main after fix) |
| Time from discovery to fix merged | ~35 minutes |

## Related

- **Doc 1174** — fleet worktree isolation (separate but related: how concurrent
  agents avoid racing on the same git working tree)
- **PR #1773** — the fix that introduced this pattern to `chat/schedule` tests
