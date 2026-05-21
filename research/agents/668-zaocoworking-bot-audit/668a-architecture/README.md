---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 650, 661, 662, 668
tier: STANDARD
parent-doc: 668
---

# 668a - ZAOcoworkingBot Architecture Audit

## Decision Matrix

| Severity | Finding | File:Line | Recommendation |
|----------|---------|-----------|-----------------|
| P0 | Missing error context in roster SHA commit | roster.ts:246 | Catch + log before re-throw in commitRoster() |
| P1 | Untyped catch in actions-store retry loop | actions-store.ts:87-90 | Type as Error; surface status via structured field |
| P1 | No max_tokens limit in Minimax call | llm/minimax.ts:22 | Add explicit max_tokens (e.g., 1024) to payload |
| P2 | Roster module cached but not invalidated cross-call | roster.ts:51 | Consider TTL invalidation on write ops |
| P2 | Circular risk: commands -> suggestions -> commands | extraction.ts:135-165 | Low risk now, but execute path needs test coverage |
| P2 | Transcript ring buffer write not atomized | transcripts.ts:53-58 | Rare but possible: full write on truncate failure leaves stale data |
| P3 | Dead code in cmdTeam | roster-commands.ts:27-29 | Remove unused allowedUserIds iteration |

## Findings by Category

### 1. Error Handling & Safety

**P0: Silent SHA loss in roster.commitRoster() (roster.ts:232-250)**
- Line 235: `const sha = memCache?.sha ?? ''` defaults to empty string on cache miss
- Line 246: If sha is empty AND createOrUpdateFileContents succeeds, newSha updates memCache
- BUT if Octokit rejects (409 conflict), the error is thrown without logging the current state (line 236)
- **Risk**: Operator doesn't know if SHA was stale or network failed. Retry becomes blind.
- **Fix**: Wrap Octokit call in try/catch; log sha, current data hash, and error code before re-throw.

**P1: Untyped catch in SHA-dance loop (actions-store.ts:75-96)**
- Line 87-90: `} catch (err) { ... const status = (err as { status?: number }).status`
- Cast assumes err has optional status field but doesn't guard against null/undefined err
- No type narrowing; status check could miss 409s on malformed responses
- **Fix**: Type as `err: unknown`, cast to Error first, then check instanceof error.response

**P1: Missing max_tokens in Minimax API call (llm/minimax.ts:22)**
- OpenAI provider (openai.ts) omits max_tokens — uses server default
- Minimax provider (minimax.ts) also omits it — no explicit limit
- Claude providers (claude-api.ts line 26) set DEFAULT_MAX_TOKENS=1024
- **Risk**: Minimax can return unbounded text; memory + token cost unpredictable
- **Fix**: Add `max_tokens: 1024` to minimax request body at line 22-28

### 2. Concurrency & State Safety

**P2: Roster memCache invalidation on write (roster.ts:51, 125-127, 247)**
- memCache is global, set once on boot, refreshed only on TTL_MS (5 min) or force=true
- addOrUpdateMember() / addAllowedChat() call forceReloadRoster() after commit (lines 216, 229)
- BUT other callers (index.ts:71, commands.ts context checks) call rosterView() via loadRoster() without force
- **Risk**: If Octokit write succeeds but memCache update fails (e.g., fs error), next message sees stale roster for up to 5 min
- **Impact**: LOW (roster changes are rare; user can /reload manually)
- **Fix**: Make memCache invalidation explicit after commit, or bump TTL on mutation

**P2: Transcript ring buffer truncation race (transcripts.ts:43-61)**
- Stage 1: append to archive (atomic via fs.appendFile, succeeds or fails)
- Stage 2: read recent, push new, truncate, write back (lines 45-58)
- **Race**: If write at line 58 fails mid-flush, recent buffer is lost but new message archived
- **Mitigation**: Try/catch at line 59 prevents cascade; archive survives; ring buffer re-builds on next read
- **Impact**: LOW (stale recent cache is best-effort for system prompt; archive is source of truth)
- **Fix**: Atomic file swap (write temp, rename) instead of direct write

### 3. Type Safety

**All exported functions have explicit return types.** No bare `any` in production code.
- **POSITIVE**: TypeScript config strict; all functions in index.ts, commands.ts, users.ts have signatures
- **POSITIVE**: Context types from grammy + custom types in types.ts are well-defined
- **Issue**: Function parameter documentation thin; unclear intent in several mutation chains

### 4. Module Coupling & Clarity

**No circular imports detected.** Dependency graph is acyclic:
- entry: index.ts
- handlers: commands.ts, user-commands.ts, roster-commands.ts, notify-commands.ts
- data: actions-store.ts, roster.ts, users.ts
- logic: extraction.ts, memory.ts, notifications.ts, transcripts.ts, scheduler.ts
- llm: llm/index.ts -> provider implementations

**Moderate coupling in extraction.ts (lines 10, 135-165)**
- Imports all command handlers (cmdAdd, cmdWip, cmdBlocked, etc.) to execute suggestions
- executeSuggestion() is a switch statement that mirrors command signatures
- **Risk**: If command signature changes (e.g., args parsing), must update extraction dispatch
- **Mitigation**: Suggest block -> command mapping is explicit; no runtime reflection
- **Recommendation**: Add integration test for suggest -> execute path

### 5. Dead Code & Maintainability

**P3: Unused iteration in cmdTeam (roster-commands.ts:27-29)**
```typescript
for (const m of (await rosterView()).allowedUserIds) {
  /* already covered */ void m;
}
```
- Lines 27-29: Loop does nothing; comment acknowledges it covers nothing
- **Fix**: Delete lines 27-29 entirely

**No commented-out code blocks.** No TODO/FIXME markers outside doc comments. Archive-first write is well-documented per doc 662.

### 6. Hard Numbers

| Metric | Count | Status |
|--------|-------|--------|
| Total .ts files | 21 | |
| Exported functions | 47 | All typed |
| Files with try/catch | 14 | Good coverage |
| Files with only silent .catch() | 2 | Acceptable (notifications, user deletion) |
| Untyped catch blocks | 1 | actions-store.ts:87 |
| Any usage | 0 | Clean |
| Circular imports | 0 | Clean |
| API routes | 0 | N/A (agent, not API) |
| Memory/state singletons | 2 | roster.ts memCache, scheduler sentinels |
| Config sources (env) | 8 | Standard |

## Recommendations (Priority Order)

1. **P0 - Add error context to roster SHA commit** (roster.ts:232-250): Wrap createOrUpdateFileContents in try/catch; log sha + error code before re-throw. Enables faster debugging of roster write failures.

2. **P1 - Type the SHA-dance catch block** (actions-store.ts:87-90): Change `err as { status?: number }` to full Error narrowing. Eliminates silent 409 misses.

3. **P1 - Add max_tokens to Minimax** (llm/minimax.ts:22): Explicit limit protects token budget. Copy from Claude provider (line 26 of claude-api.ts).

4. **P2 - Add integration test for suggest -> execute flow** (extraction.ts): Test JSON suggestion block parsing + command dispatch end-to-end (e.g., /autoconfirm on, natural language, confirm yes, verify action written).

5. **P3 - Remove dead loop** (roster-commands.ts:27-29): Trivial cleanup.

6. **Nice-to-have**: Atomic file swap in transcript ring buffer (transcripts.ts) — reduces stale-cache risk to near-zero.

## Conclusion

**Overall assessment: PRODUCTION-READY with minor hardening.**

Strengths:
- Clear module separation (tracker, LLM, auth, notifications)
- Archive-first design prevents data loss
- Proper Zod-like input validation on all commands
- Type safety throughout

Weaknesses:
- Three error-handling gaps (roster, actions, minimax) that can fail silently under load
- Limited integration test coverage on the suggest-then-execute critical path
- Roster cache invalidation relies on TTL rather than explicit invalidation

The P0 finding (roster SHA logging) is the only genuine bug. P1 items are latent bugs under edge cases (concurrent updates, API errors). All fixable in 2-3 PRs.
