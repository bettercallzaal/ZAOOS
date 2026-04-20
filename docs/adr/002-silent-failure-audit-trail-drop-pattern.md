# ADR-002: Silent-Failure CRITICAL Audit-Trail Drop Pattern

**Status:** Accepted
**Date:** 2026-04-20
**Deciders:** Zaal + Claude (paired session)
**Tags:** observability, error-handling, agents, audit

## Context

Doc 457 (silent-failure hunt) found 8 places where ZAO OS silently swallowed errors. The two most consequential were in `src/lib/agents/`:

1. `runner.ts:128` — `burnZabal()` returned null on failure; trade marked `success` regardless. Tokenomics deflationary mechanism bypassed silently.
2. `events.ts:19-23` — `logAgentEvent()` silently dropped DB insert errors via `if (error) { logger.error(...) }`. Audit trail had invisible holes.

The natural fix for `events.ts` is "throw on insert error so callers can react." But:

- `runner.ts:149` calls `logAgentEvent` **inside an outer catch block**. Throwing from there would cascade into an unhandled promise rejection.
- `burn.ts`, `autostake.ts` callers all `await logAgentEvent(...)` expecting void. None check for thrown errors.
- A blanket throw would require touching every caller + risk regressions in other agent paths during a session focused on data integrity.

We needed a fix that:
- Made silent drops **visible** without breaking control flow.
- Was **alertable** by external log scrapers / Vercel monitors.
- Left a **TODO marker** for the proper fix (durable dead-letter queue).

## Decision

Establish a **CRITICAL audit-trail drop** logging pattern, applied at every site where an audit/event write can fail without breaking the caller's happy path.

### Pattern

```typescript
// Inside the function that should persist an audit event
const { error } = await db.from('audit_table').insert(params);
if (error) {
  logger.error(
    `[${context}] CRITICAL audit-trail drop: <human description>. ` +
      `key=${field1} key=${field2} db_error="${error.message}"`,
  );
  // Intentionally do not throw — caller is in a catch block or fire-and-forget path.
  // TODO(doc-457): wire dead-letter queue (Redis list or filesystem fallback).
}
```

### Required ingredients
1. **String prefix `CRITICAL audit-trail drop`** — exact spelling, so log scrapers match on a single literal.
2. **Structured `key=value` pairs** for the most important context (action, status, tx hash, actor, target).
3. **Quoted `db_error="..."`** so multi-word DB messages parse cleanly.
4. **No `throw`** — pattern is for sites where throwing would cascade dangerously.
5. **`TODO(doc-457):`** marker for follow-up dead-letter work.

### Where the pattern applies

Currently used in:
- `src/lib/agents/events.ts` — Supabase `agent_events` insert failure.
- `src/app/api/admin/broadcast/route.ts` — `logAuditEvent` rejection after Farcaster cast already shipped (fire-and-forget with `.catch()`).

Should apply at any future site where:
- An audit/event/log write is load-bearing for compliance or debugging.
- The caller can't safely handle a thrown error (in a catch block, after a side effect committed, in a fire-and-forget tail).
- The fix should not regress current behavior in this PR.

### Where the pattern does NOT apply

- **Critical control-flow events** (e.g., trade execution, auth checks) — these MUST throw. Use ADR-003+ (TBD) for those patterns.
- **DB writes the caller can recover from** (e.g., user-facing form submission) — return error to caller, don't silently log.
- **Low-value telemetry** (page views, click tracks) — straight `console.error` is fine.

## Consequences

### Positive
- Silent audit drops now have a **distinct, alertable log signal**. External monitor can grep `CRITICAL audit-trail drop` and page on hits.
- **Migration path is clear**: replace the log line with dead-letter queue write when infrastructure lands.
- **Pattern is greppable**: future contributors can find every site by searching the literal string.
- **TDD-able**: unit tests assert the log message format (see `src/lib/agents/__tests__/events.test.ts`).

### Negative
- Audit events still **lost in the moment** when DB is down. The log is visibility, not durability.
- **External alerting must be wired** (Vercel log drain, Better Stack, Sentry, etc.) — currently logs land in Vercel's default log pane only.
- **Code reads slightly verbose** — the structured log line + comment + TODO are 6-7 lines vs the 1-line silent drop.

### Neutral
- Pattern requires manual application — no enforcement via lint/hook yet. Could add a hook later that flags `if (error)` blocks without `CRITICAL` prefix in audit-related files.

## Alternatives Considered

### A. Throw unconditionally from `logAgentEvent` and other audit functions
**Pros:** forces every caller to handle. Cleanest semantics.
**Cons:** breaks runner's catch-then-log pattern (cascades to unhandled rejection). Risks regressing all 4+ caller files in a single PR. High blast radius.
**Verdict:** rejected for this iteration. Re-evaluate after dead-letter queue lands and we can guarantee no audit data is lost on DB failure.

### B. Discriminated-union return (`{ ok: true } | { ok: false, error }`)
**Pros:** strongly typed. Caller-explicit handling.
**Cons:** requires changing every call site signature (4+ files). Same blast radius as A but with type churn. No improvement over "throw + catch" if all callers just rethrow anyway.
**Verdict:** rejected.

### C. Dead-letter queue immediately
**Pros:** the right long-term fix. Audit events durable across DB outages.
**Cons:** requires infrastructure decision (Redis? Supabase pg_cron? Local filesystem?). Out of scope for a silent-failure cleanup PR.
**Verdict:** deferred to TODO; written into ADR + commit messages so it's not forgotten.

### D. Status quo (logger.error with no prefix)
**Pros:** zero churn.
**Cons:** silent drops indistinguishable from other errors in logs. No alerting story. The reason we found it via doc 457 in the first place.
**Verdict:** rejected.

## References

- Research doc 457: `research/agents/457-silent-failure-hunt-ecc/README.md`
- PR #232: critical + high silent-failure fixes (autostake, burn, events)
- PR #233: tests + medium silent-failure fixes (broadcast, agents/route)
- Related: ECC `silent-failure-hunter` agent (doc 442 honorable H2)

## Follow-ups

1. **Wire dead-letter queue** — Redis list with daily-flushed retry job. Replaces in-process log with durable write.
2. **External log alerting** — Vercel log drain → Better Stack alert rule on `CRITICAL audit-trail drop`.
3. **Lint/hook enforcement** — flag `if (error) { logger.error(...) }` blocks in audit-related files that don't use the CRITICAL pattern.
4. **Quarterly silent-failure hunt** — re-run the doc 457 hunt every 90 days as agents/routes evolve.
