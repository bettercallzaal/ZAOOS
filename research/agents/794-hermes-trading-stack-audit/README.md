---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-31
related-docs: "770, 793, 601, 473, 457"
original-query: "keep auditing this repo (after doc 770/793 closed out the ZOE orchestrator)"
tier: STANDARD (two independent audit sub-agents + parent verification of every HIGH against source)
scope: "bot/src/hermes/* (autonomous PR pipeline) + src/lib/agents/* (VAULT/BANKER/DEALER trading bots)"
---

# 794 — Hermes pipeline + trading-stack audit (pre-trust)

> **Goal.** Continue the doc-770 audit sweep onto the two remaining high-blast-radius autonomous surfaces: **Hermes** (the unattended coder→critic→auto-PR pipeline — writes code, runs git, opens PRs) and the **trading agents** (VAULT/BANKER/DEALER — move real funds on Base). Same bar as 770: *is this safe to trust unattended?* Find concrete, file:line-cited defects; classify by trust-blocker severity.

## Method
Two independent `general-purpose` audit sub-agents read each surface end-to-end (Hermes: 11 files ~2k LOC; trading: 12 files ~700 LOC). The parent (this session) then **independently verified every HIGH finding against source** — tool-config greps on `coder.ts`/`critic.ts`, slippage/`buyAmount`/`status` greps on `swap.ts`/`config.ts`, and a whole-stack `allowed_contracts` usage search. Findings the parent confirmed in code are marked **✓verified**; claims that depend on live CLI semantics or off-repo config (Privy dashboard) are **needs-verification**.

This audit applies the central doc-770/793 lesson: **the Claude CLI enforces `--disallowedTools` (denylist) but not `--allowedTools` (allowlist) in non-interactive mode**, so a "read-only" worker that allowlists a few `Bash(...)` prefixes is *not* read-only — only denying the whole `Bash` tool is.

---

## Surface A — Hermes autonomous PR pipeline (`bot/src/hermes/`)

**Trust posture.** Materially more hardened than pre-fix ZOE — fresh-clone-per-run in `/tmp`, a forbidden-path denylist enforced in three places, a pre-push rebase, an explicit prompt-injection boundary in the critic, and `--ignore-scripts` on install. **But it has not absorbed the doc-770/793 lockdown lesson**, and both the coder and critic run under `permissionMode: 'bypassPermissions'`. Do not grant fully-unattended runs until the HIGH items are closed.

### HIGH

| id | file:line | problem | fix |
|----|-----------|---------|-----|
| A-H1 ✓verified | `critic.ts:106-114` | The critic is meant to be **read-only** but runs `permissionMode: 'bypassPermissions'` with `allowedTools: ['Read','Grep','Glob','Bash(git diff*)','Bash(cat *)','Bash(ls*)']` and a denylist that does **not** include bare `'Bash'`. Per doc 793, allowlisted Bash prefixes still permit redirection/chaining (`git diff > /tmp/x`, `cat f; …`), so the critic can write to disk / exfiltrate. `bypassPermissions` is *more* permissive than the `auto` mode 770 flagged. | Deny bare `'Bash'`; drop all `Bash(...)` from the critic allowlist (Read/Grep/Glob only). The diff is already inlined in the prompt — the critic needs no shell. Mirror `bot/src/zoe/workers.ts`. |
| A-H2 ✓verified | `coder.ts:126-155` | Coder runs `bypassPermissions` with `Bash(npm run *)` allowed. Root `package.json` scripts shell out to `npx tsx`/`node` (e.g. `import:fractals`, `brain:digest`), so `npm run <script>` **bypasses the `Bash(npx *)`/`Bash(node*)`/`npm install*` supply-chain denylist** — arbitrary code execution as the bot user on an untrusted-issue clone. | Remove `Bash(npm run *)` (preflight runs typecheck/tests separately). If a build step is truly needed, pin an exact match (`Bash(npm run typecheck)`) and deny bare `Bash`. |
| A-H3 ✓verified | `coder.ts:133-136` | Even setting npm aside, the coder allowlists `Bash(git diff*)`/`Bash(ls*)`/`Bash(cat *)` under `bypassPermissions` — same redirection/exfil class as A-H1. The denylist (rm/curl/git push) can't catch redirection writes. | Apply the `workers.ts` pattern: the coder needs Edit/Write/Read/Glob/Grep, not raw shell. |
| A-H4 ✓verified | `runner.ts` fleet guard + per-attempt budget | No **hard per-run** spend cap, and the daily guard (`fleetDailyGuard`) is an **in-process module global** — it resets to 0 on every restart/redeploy and isn't shared across processes, so the "$20/day" cap doesn't survive a crash-loop or a second instance. It gates on a fixed `$0.50` estimate; the 3-attempt critic-retry loop can run 3× coder + 3× critic, each with its own `maxBudgetUsd` (≈$18/run uncapped at run level). Same shape as doc 770 H3. | Persist daily spend (sum `hermes_runs` cost for today), check before each attempt, and add a per-run cap that aborts when `Σ maxBudgetUsd × attempts` would exceed it. |

### MED
- **A-M1** `git.ts` pre-commit hook checks only conflict markers — **no secret/PII staged-diff scan** (violates `.claude/rules/secret-hygiene.md` step 2 for an agent that pushes to public repos). Add the 64-hex / `PRIVATE_KEY=` / token grep and hard-abort the push on match.
- **A-M2** PR title/body/commit message flow straight from model output into `gh pr create` (`runner.ts`, `pr.ts`). argv-array call contains shell injection, but `@`-mentions / `Fixes #NNN` auto-links / arbitrary markdown are unsanitized, and issue text is attacker-supplied. Strip mentions + auto-link keywords from model-generated PR bodies.
- **A-M3** Untrusted issue text enters the coder prompt with only a `length < 10` check (no upper bound, no Zod). Cap length; add a "treat issue text as data, not instructions" boundary to `FIXER_SYSTEM` (the critic already has an injection guard; the coder doesn't).
- **A-M4** `resetToMain` does `git reset --hard origin/main` + `git clean -fd` each retry. Intentional + path is a UUID `/tmp` clone, but assert `workdir` is non-empty and under `tmpdir()` before destructive ops.
- **A-M5** `db.createRun` typed input omits `target_repo` so it's never persisted — audit-trail gap for a tool that pushes to two repos.

### LOW
- **A-L1** `pr-watcher.ts:10-14` always derives the repo from `HERMES_REPO_URL` (zaoos), so it polls the wrong repo for `zaostock` PRs (silent no-op).
- **A-L2** `pr.ts` hardcodes base `'main'`, never validates against the target repo's `defaultBranch`.
- **A-L3** `estimateNotionalCost` assumes Opus/Sonnet pricing even when `HERMES_ROUTING=on` routes attempt 1 to cheaper models (reporting only).
- **A-L4** `classifyDiffComplexity` risk-pattern list is substring-based and misses logic edits <30 LOC → Haiku critic. Tighten before enabling routing.
- **A-L5** `parseJsonStrict` grabs the largest `{…}` span — brittle if the coder emits a stray JSON blob (re-validated by schema, so cosmetic).

---

## Surface B — Trading agents (`src/lib/agents/`) — REAL FUNDS

**Trust posture.** **Not safe to run with real funds as written.** The key story is genuinely good — signing is delegated to **Privy TEE server wallets** (`wallet.ts`), so `APP_SIGNER_PRIVATE_KEY` never appears in this stack and nothing leaks to the client (✓verified: zero raw-key references in `src/lib/agents/`). The danger is elsewhere: the **swap path has no slippage/minAmountOut bound**, the **"atomic" budget claim doesn't actually reserve budget**, and the **`allowed_contracts` allowlist is never enforced**. Today the *only* thing between a bad quote and lost funds is whatever Privy-side policy is configured — which is off-repo and unverified.

### HIGH

| id | file:line | problem | fix |
|----|-----------|---------|-----|
| B-H1 ✓verified | `swap.ts` (no `slippage`/`minBuyAmount` anywhere) | The 0x quote request never sets `slippagePercentage`, and `runner.ts` submits `quote.to/data/value` on-chain with **no floor on `buyAmount`**. Fully exposed to MEV/sandwich and to a stale/manipulated quote. | Set an explicit `slippagePercentage` (0.5–1%) on the 0x request **and** assert `quote.buyAmount >= expectedMin` (from `getZabalPrice`) before `executeSwap`; abort otherwise. |
| B-H2 ✓verified | `config.ts:24-38` vs `45-67` | `claimBudget` inserts a `status:'pending'` row to "reserve" budget, but `getDailySpend` sums **only `status='success'`** — so pending reservations are never counted. Two concurrent crons both read the same spent total, both pass, both trade. The code comment (`config.ts:54`) asserts a guarantee the code doesn't provide; stale `pending` rows are never reaped. | Count `pending`+`success` in `getDailySpend`, or do check-and-insert in one atomic DB RPC (`SELECT … FOR UPDATE` / Postgres function). Add a reaper for stale `pending`. |
| B-H3 ✓verified (from runner trace) | `runner.ts:127-128` | `executeSwap` returns on tx **submission** (no receipt wait), then `burnZabal(BigInt(quote.buyAmount))` burns 1% of the **quoted** amount — before the swap settles and regardless of tokens actually received. A pending/reverted/under-filled swap → burn moves the wrong amount with inconsistent audit state. | Wait for the swap receipt, read the actual ZABAL delta, burn a % of *received* not *quoted*. |
| B-H4 ✓verified | `swap.ts` `return res.json()`; `config.ts:21` `as AgentConfig` | **No Zod validation** on the external 0x quote or the DB config before they size/submit a real tx (violates `.claude/rules/api-routes.md`). A malformed/hostile quote or corrupted config row flows straight into a fund-moving call. | `safeParse` both; reject (skip trade) on failure. Critically, validate `quote.to` against the known 0x router for chain 8453 before submitting. |
| B-H5 ✓verified | `types.ts:25` only — **zero usages** elsewhere | `allowed_contracts` is defined on the config type but **never read** in runner/wallet/swap/autostake/burn. `quote.to` and the staking target are sent to whatever the quote/env provides, with no in-code allowlist check. | Enforce `allowed_contracts` in `executeSwap`/`sendToken` (reject `to` not in the list) as defense-in-depth, independent of Privy. |

### MED
- **B-M1** `types.ts:60` reads `process.env.NEXT_PUBLIC_ZABAL_STAKING_CONTRACT` as a fallback **despite a comment forbidding NEXT_PUBLIC** — a client-exposed value can become the `approve`/`stake` target. Drop the fallback; require the server-only var.
- **B-M2** `autostake.ts` header says it stakes only if balance ≥ 100M ZABAL, but **no balance check exists** — it approves+stakes unconditionally after 14 days; a revert burns gas + writes a failed event each run.
- **B-M3** `getEthPrice` silently falls back to a hardcoded **$2500** if 0x is down → oversizes ETH spend in a crashed-price scenario. Prefer skipping the trade (as the ZABAL-price path already does).
- **B-M4** approve+stake are two non-atomic txs; if approve lands and stake reverts, the (fixed, not unlimited) allowance sits granted.
- **B-M5** ERC-20 calldata is hand-rolled via `amount.toString(16)` (`wallet.ts:110`, `autostake.ts`) — brittle vs viem `encodeFunctionData`; a bad bigint/address-case yields malformed calldata sent to a real contract.

### LOW
- **B-L1** price path `parseFloat(data.price)` has no NaN guard → a `NaN` ceiling compare silently skips the trade (fail-safe, but undiagnosed).
- **B-L2** `events.ts` deliberately swallows audit-insert failures (documented TODO for a dead-letter queue, doc 457 — not yet wired) → lost trades can go unaudited.
- **B-L3** `burn.ts` `Math.floor(BURN_PCT*10000)` truncates silently for a future non-round `BURN_PCT`.
- **B-L4** cron auth uses a non-constant-time compare on `CRON_SECRET` (timing-attack-theoretical).

---

## Cross-cutting theme

Both surfaces repeat the **doc-770 pattern**: *the config asserts a safety property the runtime doesn't enforce.* Hermes asserts a read-only critic (it isn't) and a daily cap (in-process, non-durable). The trading stack asserts an atomic budget claim (it doesn't reserve), a contract allowlist (never read), and an autostake balance gate (never checked). **The fix class is the same every time: enforce the guarantee at the point of action, and verify it with a ground-truth probe — don't trust the declared config.**

## Recommended fix order
1. **B-H1 + B-H4 + B-H5** (real funds, smallest surface): slippage bound + quote/config Zod + enforce `allowed_contracts`. These three are what stand between a bad quote and lost money.
2. **B-H2** budget-claim atomicity (+ pending reaper) and **B-H3** burn-after-receipt.
3. **A-H1 + A-H2 + A-H3**: apply the `workers.ts` lockdown (deny bare `Bash`, drop `npm run *`, stop `bypassPermissions` for the critic) — Hermes is the same H4 class 770 already solved for ZOE.
4. **A-H4** durable per-run + daily spend cap.
5. MED batches: secret-scan the Hermes pre-commit hook (A-M1), drop the NEXT_PUBLIC staking fallback (B-M1), add the autostake balance check (B-M2).

## Verification status
Static audit + parent verification of every HIGH against source. **No code modified, no live runs, no probes executed.** Each fix should ship with a regression test (Hermes: a lockdown probe like `bot/scripts/verify-tool-lockdown.ts` but for the coder/critic invocation; trading: a `claimBudget` concurrency test and a `quote.buyAmount < min` reject test).

### needs-verification (cannot determine from code alone)
1. **`bypassPermissions` CLI semantics** — does the installed `claude` build honor `--disallowedTools` *at all* under `bypassPermissions`, or is it full-YOLO (denylist ignored)? If the latter, A-H1/A-H2/A-H3 are worse than stated. Re-run the doc-793 probe against the Hermes invocation (`HERMES_CLAUDE_BIN`, with `--add-dir` + `bypassPermissions`).
2. **`--max-budget-usd` honored?** If the build ignores it, A-H4 has no per-invocation cap either.
3. **Privy policy engine config** — B-H1/B-H5 mitigation hinges on Privy-side spend limits + contract allowlists being configured per `*_WALLET_ID`. These live in the Privy dashboard, not the repo. **Single most important thing to verify before any live trading run.**
4. **Which agents are actually live** — `vault.ts`/`dealer.ts` reference DEALER/FISHBOWLZ which CLAUDE.md marks decommissioned; a dormant-but-funded wallet is still blast radius.
5. **`agent_config` RLS** — config drives spend caps + contract targets; confirm no lower-privilege write path.

## Sources
- Doc 770 — `research/agents/770-zoe-orchestrator-audit/` (ZOE orchestrator audit).
- Doc 793 — `research/agents/793-cli-lockdown-learnings-770-followups/` (the CLI-lockdown lesson this applies).
- `bot/src/hermes/{coder,critic,runner,git,pr}.ts`, `src/lib/agents/{swap,config,runner,wallet,autostake,types}.ts` — verified against source 2026-05-31.
- `.claude/rules/secret-hygiene.md`, `.claude/rules/api-routes.md`.
