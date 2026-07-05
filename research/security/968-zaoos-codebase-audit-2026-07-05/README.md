---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-05
related-docs: 836
original-query: "deep audit of everything - all coding - analyze where we are and our gaps"
tier: DISPATCH
---

# 968 - ZAOOS Codebase Audit (2026-07-05)

> **Goal:** Full-estate code audit of ZAOOS across 6 dimensions (architecture, API routes, security, tests, type-safety, bot fleet) with grounded, cross-verified numbers. Six parallel subagents; every alarming/conflicting claim re-verified against the actual files before recording.

## Verdict

**Solid foundation, thin safety net.** Security and type discipline are strong; the real exposure is test coverage on money/auth paths. ~1,135 TS files; typecheck passes clean (0 errors); only 5 TODO/FIXME markers estate-wide.

## Inventory (verified)

| Area | Count |
|------|-------|
| TS/TSX files (src + bot) | ~1,135 |
| API routes (`src/app/api/**/route.ts`) | 306 across 55 domains |
| Components | 298 |
| lib modules | 175 (42 subdomains) |
| hooks | 18 |
| bot/ files | 133 |
| Test files | 79 (~8% coverage) |
| `any` (src+bot, excl tests) | 10 |
| `@ts-ignore` | 0 |
| TODO/FIXME/HACK | 5 |
| Files > 600 LOC | 16 |
| `console.log` (7 app, 64 bot) | 71 |

## Verified corrections to subagent claims

Subagents disagreed; these are the re-counted truths (see [[feedback_no_sub_agent_context_fabrication]]):
- **Try/catch coverage:** 298 of 306 routes have it (an agent claimed only 12 - a naive grep; wrong).
- **Zod on mutations:** 33 of 165 mutation routes lack any Zod reference (agents variously guessed 10, 60, or "all covered"; real = 33). 187/306 routes total use Zod.
- **console.log:** 7 in app code, 64 in bot (one agent said 78 total incl bot; one said 7 - both partially right by scope).

## Strengths (green)

- **Security: 0 critical/high.** No secret leaks; `.env` gitignored; server secrets never client-exposed. No `dangerouslySetInnerHTML`, no `eval`/`execSync` from routes. Admin requires signature-verified claims (hardened 2026-06); timing-safe HMAC on webhooks; iron-session httpOnly+secure; RLS + service-role separation; agent wallets on Privy TEE (no raw keys).
- **Type discipline:** typecheck 0 errors, 10 `any`, 0 `@ts-ignore`, 46 catch blocks typed `unknown`.
- **Low debt:** 5 TODO markers; no Redux/Zustand; `Promise.allSettled` adopted.

## Gaps, ranked

1. **Tests thin on money/auth (top risk).** ZERO tests on: agent trading cron routes (banker/dealer/vault), `src/lib/agents/runner.ts` + `wallet.ts`, `src/lib/auth/session.ts`, and the 12-file `src/lib/publish/` pipeline. Trading agents run on cron against real capital with no test guard.
2. **33 mutation routes lack Zod** input validation. Injection/crash surface (not a breach).
3. **Fleet resilience:** ZOE single-instance rule is documented, not code-enforced (split-brain risk on file-based memory); Hermes spawns `claude` CLI with no timeout (can hang).
4. **Monoliths:** 16 files > 600 LOC; `bot/src/zoe/index.ts` (1,693) and `SettingsClient.tsx` (1,459) worst. Testability/maintainability debt.
5. **Lint noise:** 3,244 Biome errors, ~all auto-fixable formatting in `scripts/archive/` + old migrations; 71 `console.log` should use the logger.
6. **8 routes missing try/catch** (mostly OAuth redirects). Minor.

## Next Actions

| Action | Owner | Type | Priority |
|--------|-------|------|----------|
| Tests for money+auth paths (agent cron, runner/wallet, session.ts) | Zaal/Claude | PR | P0 (highest value) |
| Add Zod to the 33 unvalidated mutation routes | Claude | PR | P1 |
| ZOE PID lockfile + Hermes subprocess timeout | Claude+Zaal go | PR | P1 |
| `biome --fix` (clears ~3k noise) + console.log -> logger | Claude | PR | P2 |
| Decompose `zoe/index.ts` + `SettingsClient` | Claude | PR | P2 (when touched) |

## Sources

- 6 parallel subagent audits (2026-07-05), cross-verified against the repo by direct grep/count.
- Repo estate census: [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/).
- Method note: subagent numeric claims were re-counted before recording; conflicts resolved to the direct count.
