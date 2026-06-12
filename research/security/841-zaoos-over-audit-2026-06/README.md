---
topic: security
type: audit
status: research-complete
last-validated: 2026-06-11
superseded-by:
related-docs: 836, 601
original-query: "Let's over audit everything first - full adversarial audit of ZAOOS across security, tests/correctness, dead-code/deps, infra/hygiene."
tier: DISPATCH
---

# Doc 841 - ZAOOS Over-Audit (adversarial, 2026-06-11)

> **Goal:** Comprehensive adversarial audit of ZAOOS. 8 dimension finders swept the repo; every finding was then handed to an independent verifier whose job was to REFUTE it. Only findings confirmed by reading the actual code survive. 83 raw findings -> 63 confirmed, 20 refuted.

## Method

Multi-agent workflow: 8 parallel finders (security-secrets, security-authz, tests-risk, correctness-silent, dead-code, deps-health, infra-drift, agent-reliability), then 1 adversarial verifier per finding (default verdict = refuted unless independently confirmed by reading the cited code). 91 agents, ~2.7M tokens. The 20 refutations included real false positives (e.g. upload rate-limiting that DOES exist in middleware; `Promise.all` over Supabase queries that cannot reject because the client returns `{data,error}`). 6 dead-code findings were lost to a verifier socket crash - flagged below as "unverified" (most are known-real from doc 836).

## Key Decisions (fix order)

| # | Priority | Decision |
|---|----------|----------|
| 1 | P0 NOW | Upgrade `next` 16.2.0 -> 16.2.9+. Confirmed DoS CVE GHSA-q4gf-8mx6-v5v3 (CVSS 7.5). |
| 2 | P0 NOW | Patch vulnerable transitive deps: elliptic (key extraction), protobufjs (RCE/injection), shell-quote (shell injection), snapshot.js/ethersproject, solana wallet-adapter. Run `npm audit fix`; force-resolve where needed. |
| 3 | P1 | Wire the agent dead-letter queue (`src/lib/agents/events.ts:24`). Trade audit events are permanently lost if Supabase is down during a swap. Load-bearing for trading. |
| 4 | P1 | Fix Lens route (`api/platforms/lens/route.ts`): validate wallet `/^0x[a-fA-F0-9]{40}$/`, parameterize the GraphQL query, stop storing access/refresh tokens in plaintext. |
| 5 | P1 | Add Zod `safeParse` to `api/admin/contacts` POST/PATCH (accepts arbitrary fields into DB writes today). |
| 6 | P1 | Fix `claimBudget()` race (`src/lib/agents/config.ts:45-68`): read-then-insert window lets two concurrent agent runs claim the same daily budget slot. |
| 7 | P2 | CI tooling mismatch: `ci.yml` runs `npx eslint` but the project lints with Biome; `sync-to-paperclip.yml` calls a deleted script (will fail at runtime). |
| 8 | P2 | Add Sentry to the bot processes (zoe/hermes/cron) - currently no error tracking on the agent runtime. |
| 9 | P2 | Write the highest-risk missing tests (signer, webhooks signature-verify, proposal vote weight, admin user mutations) - 38 of 54 API domains have zero tests. |
| 10 | P3 | Fix doc drift in CLAUDE.md/README (contracts/ dir does not exist; route/component/hook/doc counts stale). |

## Confirmed findings (63)

### CRITICAL (2)

1. **Next.js DoS** - `package.json:97`. `next@16.2.0` is in the vulnerable range of GHSA-q4gf-8mx6-v5v3 (CWE-770, CVSS 7.5). Patched in 16.2.3; latest 16.2.9. **Upgrade now.**
2. **Agent dead-letter-queue gap** - `src/lib/agents/events.ts:20-30`. `logAgentEvent()` swallows Supabase insert errors with only `logger.error()` - no retry, no fallback, no throw. If the DB is down or RLS rejects during a trade, that action's entire audit trail is lost permanently. TODO(doc-457) acknowledges it. Caller `runner.ts:149` is inside a catch, so throwing would cascade to an unhandled rejection.

### HIGH (24)

Security - authz/input:
- **GraphQL injection (Lens)** - `api/platforms/lens/route.ts:13,85`. User `wallet` interpolated into a GraphQL template string, no parameterization (JSON.stringify is the only accidental guard).
- **No Zod on admin contacts POST/PATCH** - `api/admin/contacts/route.ts:108-133`. Raw body fields written to DB; PATCH spreads arbitrary fields.
- **Unsafe wallet validation (Lens)** - `api/platforms/lens/route.ts:49,112`. `body.wallet` accepted with only `toLowerCase()`, no address regex.
- **Lens tokens stored plaintext** - `api/platforms/lens/route.ts:112-113`. access/refresh tokens persisted unencrypted.

Tests-risk (untested high-blast-radius routes):
- Signer create `api/auth/signer/route.ts` (uses APP_SIGNER_PRIVATE_KEY) and signer save `api/auth/signer/save/route.ts` (FID/session binding - session-fixation surface).
- Webhook signature verification untested: `api/100ms/webhook`, `api/webhooks/alchemy` (respect-token manipulation), `api/fractals/webhook`.
- `api/users/follow`, `api/users/solana-wallet` (PII + takeover), `api/admin/users` (priv-esc/enumeration), `api/proposals/vote` (voting-weight manipulation - no on-chain balance verify test).

Deps-health (transitive CVEs + major drift):
- elliptic (private-key extraction), protobufjs (RCE + injection), shell-quote (shell injection), @snapshot-labs/snapshot.js (ethersproject), @solana/wallet-adapter-wallets.
- MAJOR drift: Neynar SDK 39 versions behind; Supabase 9 patches behind.

Infra/agent:
- **CI linter mismatch** - `.github/workflows/ci.yml:28` runs eslint; project uses Biome.
- **No Sentry on bot processes** - `bot/src/index.ts:588-591`.
- **Trading guards app-layer only** - `src/lib/agents/runner.ts:66-88`. spend caps / trading_enabled enforced in JS only; no RLS or contract-level backstop.
- **claimBudget() race** - `src/lib/agents/config.ts:45-68`. read-then-insert window; concurrent runs can double-claim a budget slot.

### MEDIUM (24)

Security: admin contacts PATCH-to-users permissive fields; broadcast audit-log FID null (`api/admin/broadcast/route.ts:68`); no Zod on admin search-users GET (`:42`); Alchemy webhook leaks error details in catch (`:144`).

Tests-risk: untested auth register (`api/auth/register`), admin agent trading config (`api/admin/agents`), admin allowlist mutations.

Correctness (silent failures): swallowed `res.json()` fallbacks in `CrmAddForm.tsx:102`; fire-and-forget fetch in `LastfmConnect.tsx:10`; Juke space-create bad fallback hides failure `spaces/page.tsx:129`; `MembersDirectoryClient.tsx:120`; stream cleanup swallowed `spaces/[id]/page.tsx:136`.

Deps: shell-quote (critical advisory, dev-path); viem 5 patches behind; wagmi major gap to v3.

Infra-drift: contracts/ dir referenced but absent (`CLAUDE.md:38`); research-doc count drift; README API route count 121 vs 302 (`README.md:636`); stale worktree branches.

Agent: Hermes non-JSON output -> infinite retries to max attempts (`hermes/runner.ts:136`); ZOE cron tasks not idempotent across restart/clock-skew (double morning brief) (`zoe/scheduler.ts`); ZOE proactive tick has no safety cap on message rate (`zoe/proactive.ts:12`); ZOE workers read-only but unsandboxed (MCP side-channel) (`zoe/workers.ts`); runAgent() no pre-flight wallet-balance check before executeSwap (`runner.ts:126`).

### LOW (13)

Health endpoint discloses infra status (`api/agents/health`); half-built "coming soon" placeholders (tools page, 2 settings overlays, festival photos); deprecated `JUKE_USER_TOKEN` still read (`lib/env.ts:112`); 3 silent client-fetch fallbacks; CLAUDE.md count drift (routes 301 vs 302, components 279 vs 295, hooks 19 vs 18). Plus 3 verified-CLEAN items the finder flagged but the verifier cleared: timing-safe CRM secret compare, iron-session secret config, .gitignore .env coverage.

## Refuted (20) - did NOT survive verification

Real false positives worth noting: upload IS rate-limited (`middleware.ts:58`, 10/min Upstash); `music/generate` IS rate-limited (`middleware.ts:42`, 5/hr) - the TODO comment is stale; ENS `Promise.all` cannot reject (internal try/catch); Supabase `Promise.all` cannot reject (client returns `{data,error}`, not throws); `req.json()->null` is handled by `safeParse`; admin-cache session bug is theoretical with no live code path; Vitest UI CVE not exposed (UI not enabled); ZOE dispatch HAS a 10-min per-worker timeout; cron routes ARE fully awaited in try/catch with Sentry.

Bonus issue surfaced while refuting CI-health: `sync-to-paperclip.yml:19` runs `scripts/sync-issue-to-paperclip.js` which now only exists under `scripts/archive/` - the workflow fails at runtime.

6 dead-code findings were lost to a verifier crash (unverified, likely real per doc 836): unused `pushItem()` cowork export, half-built Arweave mint, lingering Magnetiq/AttaBotty decommissioned code, duplicate miniapp auth routes, Juke end-space dependency, ordao ABI TODO.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `npm i next@16.2.9` + `npm audit fix` (elliptic/protobufjs/shell-quote) | @Zaal | PR | P0 this week |
| Wire agent dead-letter queue (events.ts) | @Zaal | PR | P1 |
| Harden Lens route (wallet regex + GraphQL vars + token encryption) | @Zaal | PR | P1 |
| Zod on admin/contacts POST+PATCH | @Zaal | PR | P1 |
| Fix claimBudget() race (atomic insert / unique constraint) | @Zaal | PR | P1 |
| Fix ci.yml eslint->biome + delete/fix sync-to-paperclip workflow | @Zaal | PR | P2 |
| Sentry on bot processes | @Zaal | PR | P2 |
| Test sprint: signer, webhook-sig, proposal-vote, admin-user mutations | @Team | PRs | P2 backlog |
| Doc drift sweep (contracts/, counts) in CLAUDE.md + README | @Zaal | PR | P3 |

## Also See

- [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/) - repo + cloud estate census (parent overview)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - locked agent model

## Sources

- [FULL] ZAOOS working tree at HEAD, audited 2026-06-11 by an 8-finder + 89-verifier adversarial workflow (91 agents, ~2.7M tokens). Run id wf_ee53fe64-b5a.
- [FULL] `npm audit` / `npm outdated` JSON, run inside the repo by the deps-health finder.
- [FULL] Per-finding verifier transcripts (independent code reads) under the workflow's subagents dir.
