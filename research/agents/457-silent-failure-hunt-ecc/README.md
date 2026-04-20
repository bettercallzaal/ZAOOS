### 457 — Silent Failure Hunt: ZAO Agent System

> **Status:** Hunt complete, fixes pending
> **Date:** 2026-04-20
> **Tool:** `general-purpose` subagent running `silent-failure-hunter` persona (ECC plugin agent not in registered subagent export — workaround used)
> **Scope:** `src/lib/agents/` + 3 admin API routes

---

## Key Decisions / Recommendations

| Finding | Severity | Fix Priority |
|---------|----------|--------------|
| runner.ts:128 — Burn failure ignored after swap | **CRITICAL** | FIX THIS WEEK. Tokenomics broken (deflationary mechanism bypassed). |
| runner.ts:93 — Auto-stake failure unguarded, trade continues | **CRITICAL** | FIX THIS WEEK. Agent buys ZABAL unstaked. |
| autostake.ts:43-75 — Auto-stake catch swallows failure, no DB record | HIGH | Fix same PR as runner.ts:93. |
| events.ts:19-23 — `logAgentEvent` silently drops DB insert errors | HIGH | Fix this week. Audit trail loss. |
| burn.ts:31-35 — Burn error returns null, no DB log | MEDIUM | Fix same PR as runner.ts:128. |
| runner.ts:143 — Farcaster post failure doesn't fail trade | MEDIUM | Accept. Log only (trades > casts). |
| broadcast/route.ts:65-72 — audit logged after response | MEDIUM | Wrap in `.catch()` safe fire-and-forget. |
| agents/route.ts:30-42 — `Promise.allSettled` falls back to empty arrays on DB failure | MEDIUM | Throw on rejection instead of silent fallback. |

**Totals:** 2 critical, 2 high, 4 medium, 0 low = **8 findings**.

---

## Comparison of Options (fix strategy)

| Option | Scope | Pro | Con |
|--------|-------|-----|-----|
| A. Fix all 8 in one PR | big | fastest to clean state | larger review surface |
| B. Criticals only (runner.ts + autostake.ts + burn.ts + events.ts) in PR 1, rest in PR 2 | focused | easier review | 2 PRs |
| C. One PR per fix | atomic | tiniest reviews | 8 PRs, overhead |

**Recommendation: B** — criticals first for merge-to-prod speed, medium fixes as follow-up.

---

## Detailed Findings

### CRITICAL 1 — runner.ts:128 — Burn failure ignored

**File:** `src/lib/agents/runner.ts:128`

```typescript
const hash = await executeSwap(agentName, quote);
await burnZabal(agentName, BigInt(quote.buyAmount));

await logAgentEvent({
  tx_hash: hash,
  status: 'success',  // <-- marked success even if burn failed
});
```

**What breaks:** `burnZabal()` returns `null` on failure (burn.ts:34). Trade logs as `success` regardless. ZABAL meant to burn accumulates in agent wallet.

**Who won't notice:** No one — no event logged, no alert. Tokenomics deflationary mechanism broken silently. Days or weeks of unexecuted burns.

**Fix:**
```typescript
const hash = await executeSwap(agentName, quote);
const burnHash = await burnZabal(agentName, BigInt(quote.buyAmount));
if (!burnHash) {
  throw new Error('Burn failed after successful swap — trade marked failed');
}
```

---

### CRITICAL 2 — runner.ts:93 — Auto-stake failure unguarded

**File:** `src/lib/agents/runner.ts:93`

```typescript
try {
  // Auto-stake check (14-day cycle)
  await maybeAutoStake(agentName);
```

**What breaks:** `maybeAutoStake()` catches internally (autostake.ts:72-75), logs, returns. If Privy wallet rejects the stake tx, function exits normally. Runner proceeds to buy ZABAL. ZABAL accumulates unstaked.

**Who won't notice:** Admin dashboard shows no stake event (correct), no failure event either (missing). Agent keeps buying.

**Fix:** Change autostake.ts to throw on failure (see HIGH 1 below). Runner will then catch + halt cycle.

---

### HIGH 1 — autostake.ts:43-75 — Auto-stake catch swallows failure

**File:** `src/lib/agents/autostake.ts:43-75`

```typescript
try {
  await executeSwap(...approve data...);
  await executeSwap(...stake data...);
  await logAgentEvent({ status: 'success' });
  logger.info(`Auto-staked 100M ZABAL...`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(`[${agentName}] Auto-stake failed: ${msg}`);
}
```

**What breaks:** Catch block only logs. No `logAgentEvent({ status: 'failed' })`. No rethrow. Caller (runner.ts:93) sees success.

**Fix:**
```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  await logAgentEvent({
    agent_name: agentName,
    action: 'add_lp',
    status: 'failed',
    error_message: msg,
  });
  logger.error(`[${agentName}] Auto-stake failed: ${msg}`);
  throw err;  // <-- CRITICAL: stop caller from assuming success
}
```

---

### HIGH 2 — events.ts:19-23 — `logAgentEvent` swallows DB errors

**File:** `src/lib/agents/events.ts:19-23`

```typescript
export async function logAgentEvent(params: {...}) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('agent_events').insert(params);
  if (error) {
    logger.error(`[${params.agent_name}] Failed to log event: ${error.message}`);
  }
}
```

**What breaks:** Insert fails (DB down, RLS, constraint), function logs and returns void. All callers `await logAgentEvent(...)` expecting durable log, get nothing. Audit trail silently incomplete.

**Fix:**
```typescript
if (error) {
  throw new Error(`Failed to log agent event: ${error.message}`);
}
```

Risk: throwing might break some callers. Triage per call site — most callers should propagate (this is load-bearing audit).

---

### MEDIUM 1 — burn.ts:31-35 — Burn error no DB record

**File:** `src/lib/agents/burn.ts:31-35`

```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(`[${agentName}] Burn failed: ${msg}`);
  return null;
}
```

**What breaks:** Null return, no `agent_events` row. Caller must check for null (currently doesn't — see CRITICAL 1).

**Fix:** Pair with CRITICAL 1 fix. Add `logAgentEvent({ status: 'failed', ... })` before `return null`, OR change to throw so caller must handle.

---

### MEDIUM 2 — runner.ts:143 — Farcaster post failure doesn't fail trade

Accept. Trades shouldn't depend on cast success. Log only.

---

### MEDIUM 3 — broadcast/route.ts:65-72 — audit logged post-response

**File:** `src/app/api/admin/broadcast/route.ts:65-72`

```typescript
    const data = await res.json();
    await logAuditEvent({...});
    return NextResponse.json({ success: true, hash: data.cast?.hash });
```

**What breaks:** audit `await`'d but after response commits. If `logAuditEvent` throws, response already sent successful, audit missing.

**Fix:**
```typescript
logAuditEvent({...}).catch(err => logger.error('Audit log failed:', err));
return NextResponse.json({ success: true, ... });
```

---

### MEDIUM 4 — agents/route.ts:30-42 — Promise.allSettled empty fallback

**File:** `src/app/api/admin/agents/route.ts:30-42`

```typescript
const [configResult, eventsResult] = await Promise.allSettled([...]);
const configs = configResult.status === 'fulfilled' ? (configResult.value.data ?? []) : [];
const events = eventsResult.status === 'fulfilled' ? (eventsResult.value.data ?? []) : [];
```

**What breaks:** DB down → admin sees empty list, no error. Can't tell "no agents" from "DB failure".

**Fix:**
```typescript
if (configResult.status === 'rejected') throw configResult.reason;
if (eventsResult.status === 'rejected') throw new Error('Failed to fetch agent events');
```

---

## Process Notes

**Tool used:** `Agent` tool with `subagent_type: general-purpose`, prompt embedded silent-failure-hunter persona. ECC plugin's `silent-failure-hunter` agent exists as a file but isn't registered as a subagent by the plugin (only ~40 of 48 agents registered). Mid-session copy to `~/.claude/agents/silent-failure-hunter.md` doesn't register until next Claude Code restart.

**Time taken:** ~50s for full sweep of 11 files.

---

## ZAO Ecosystem Integration

Fixes touch:
- `src/lib/agents/runner.ts` — 2 critical fixes
- `src/lib/agents/autostake.ts` — 1 high fix
- `src/lib/agents/burn.ts` — 1 medium fix
- `src/lib/agents/events.ts` — 1 high fix (load-bearing)
- `src/app/api/admin/broadcast/route.ts` — 1 medium fix
- `src/app/api/admin/agents/route.ts` — 1 medium fix

Pair with:
- Vitest tests under `src/lib/agents/__tests__/` and `src/app/api/admin/__tests__/`
- `evals/` fixtures (doc 441) once populated with real scenarios

---

## Sources

- ECC `silent-failure-hunter` agent definition: `~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.10.0/agents/silent-failure-hunter.md`
- ZAO OS docs 441/442/448 (ECC integration)
- [Silent failure anti-patterns reference](https://martinfowler.com/articles/replaceThrowWithNotification.html)
