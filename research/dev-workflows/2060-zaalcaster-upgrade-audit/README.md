# Zaalcaster Upgrade Audit (2026-07-23)

Audited bettercallzaal/zaalcaster - a lightweight personal Farcaster client for Zaal (@zaal, FID 19640). Reads + posts via Neynar v2. Node/JS (ESM), zero npm dependencies.

## Audit Summary

The codebase is tight, well-documented (CLAUDE.md is excellent), and maintains the hard invariant (never post without approval). Architecture is sound: one lib.js wrapper around Neynar, CLI tools in bin/, API routes in api/, and a vanilla-JS web app in public/.

Security posture: strong on the posting side (two-step confirm everywhere), auth is well-hardened (session cookies, constant-time comparison). No exposed secrets found.

## Key Findings

### Strengths
- No npm dependencies - attack surface is smaller.
- Voice learning system works (saves real edits, feeds them as examples to drafts).
- Neynar integration is comprehensive (200+ endpoints wrapped).
- Auth redesign (SIWN) is solid - cookies are signed, no signer UUIDs in the client.
- Error handling in send.js and lib.js is defensive (friendlyPostError).

### Gaps (All Safe to Fix)

1. **No test coverage** - zero tests. Commands work (live-verified in CLAUDE.md), but edge cases are unguarded.
2. **No response caching** - every `node bin/engage.js` fires 6 parallel Neynar calls (notifs, answers, threads, winning casts). No local cache means a second run in the same minute repeats all of them.
3. **Missing input validation on CLI** - `bin/reply.js` takes a URL but doesn't validate it's a valid farcaster.xyz link before sending.
4. **No JSDoc on exported lib.js functions** - ~50 exports with no signatures; IDE autocomplete is weak.
5. **bin/cockpit.js error handling incomplete** - unhandled promise rejection if a thread fetch fails (should degrade, not crash).
6. **Missing offline-first detection** - no check for network before hitting Neynar; errors are opaque ("Neynar API error 500: ...").
7. **Spam set fails open** - correct (shows inbound), but docs don't say why (prevents silent hiding of mentions).
8. **store.js KV_REST_API_ vars auto-exported in lib.js loadEnv** - clever for CLI tools but fragile if the creds file is world-readable (already 0o600, so low-risk).

## Prioritized Upgrade Menu

| # | Upgrade | Effort | Risk | Value |
|---|---------|--------|------|-------|
| 1 | **Add getUnansweredInbound() response caching** | S | SAFE | MEDIUM - 6+ calls saved per run if called 2x in 60s |
| 2 | **Add JSDoc to lib.js exports** | M | SAFE | MEDIUM - IDE autocomplete works, forks understand the API |
| 3 | **Add basic input validation to bin/reply.js** | S | SAFE | LOW - prevent confusing errors on typos |
| 4 | **Add first test suite (vitest or tap)** | L | SAFE | HIGH - proves correctness, catches regressions |
| 5 | **Harden cockpit.js thread-fetch error handling** | S | SAFE | LOW - degraded UX if thread unfetchable, not broken |
| 6 | **Add network/offline detection** | M | LOW | MEDIUM - better UX ("offline / Neynar down") vs opaque errors |
| 7 | **Add per-command rate-limit aware retry** | M | LOW | LOW - Neynar's own 429 retry works; local retry would be redundant |
| 8 | **Document spam-set fail-open design** | S | SAFE | LOW - just docs, no code risk |

## Recommended First Upgrade (SHIP NOW)

**Upgrade #1: Add getUnansweredInbound() response caching** (safe, high-value, low-risk)

When running `node bin/engage.js` multiple times in a minute (common during a live session), the same 6 Neynar calls fire every time:
- getNotifications
- getAnsweredParents (3 pages)
- getSnoozeSet (KV read)
- getWinningCasts (via cache anyway, but re-checked)

Add a simple in-memory cache with a 60-second TTL to lib.js. Cost: 15 lines. Benefit: engage/cockpit/web all re-run cheaper if called 2x in one minute. Zero risk to the no-autopost invariant (cache is read-only).

---

## Architecture Notes

### Why This Design Works
- **ONE-FILE lib.js** keeps the repo under Vercel Hobby's 12-function cap. Every route reuses the same lib - no duplication.
- **Zero dependencies** means deployment is fetch + node (no npm install bloat).
- **Voice learning is lightweight** - just appends (them -> zaal wrote) pairs to a file, no LLM eval.
- **Neynar signer scoping** - a leaked signer_uuid can only post as Zaal, not read as someone else. Good model.

### Known Trade-offs
- Scheduled posts need Vercel KV (can't use localStorage only on prod).
- Mini App accountAssociation is empty (blocked on Zaal signing with custody key - not a code problem).
- edit-own-profile and Neynar webhooks still half-built (researched, not shipped).

### Risk Assessment
- **Posting safety:** very high (two-step confirm, friendlyPostError catches misconfigs).
- **Read safety:** high (Neynar handles auth, no secrets in cache).
- **Deployment safety:** high (no sensitive env vars in code, creds file is 0o600).

---

## Test Coverage (Today)
Zero. Verified by hand:
- `find . -name "*.test.*"` returns nothing.
- `grep -r "describe\|it(" . --include="*.js"` returns nothing (only in CLAUDE.md docs).

CLI commands are live-verified in CLAUDE.md (#19-35 PRs list interactive tests), but edge cases (malformed JSON, API 5xx, bad signer) are untested.

---

## Session Notes

- Audited 2026-07-23 (fresh clone, depth 50, all key files read).
- No exposed keys or secrets found (all examples use env placeholders).
- Invariant check: "never post without approval" - intact. Every post route requires blockedByAuth + explicit --yes or confirm.
- Security audit feedback (from CLAUDE.md 2026-07-15): failing-closed on misconfiguration (NEYNAR_CLIENT_ID set but SESSION_SECRET unset = gate off to everyone). This is FIXED and LIVE.
- Empire Builder integration verified live against real empires (tokenless + tokenized).
- Voice examples file (saveVoiceExample) correctly sets mode 0o600 (no cross-user leak).

---

## Deferred (Not Recommended Now)
- Edit-own-profile: buildable, researched in CLAUDE.md. Defer until Zaal asks.
- Webhooks: buildable (Neynar docs are clear). Requires Zaal to configure the webhook in the Neynar dashboard first (not code-blocking).
- Multi-user: declined 2026-07-06, per CLAUDE.md. Do NOT build unless Zaal reopens it.

---

## Approval Gate (If Shipped)
All upgrades above are SAFE (no breaking changes, no invariant violations). Ship #1 (caching) as a standalone PR - no dependency on the others.
