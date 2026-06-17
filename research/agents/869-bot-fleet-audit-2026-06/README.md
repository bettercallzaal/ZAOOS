# Doc 869 - ZAO Bot Fleet Audit (June 2026)

**Date:** 2026-06-17
**Scope:** `bot/` - every Telegram/agent surface in the ZAOOS monorepo
**Trigger:** "bots terminal" session - full audit before resuming ZOE social builds
**Tier:** INFRA / AGENTS

Companion to doc 601 (agent-stack cleanup decision) and the `bot/REGISTRY.md`
inventory. This is a point-in-time health check of the running fleet.

---

## Fleet at a glance

| Bot | Handle | Dir | Files | Status | Tests | Top risk |
|-----|--------|-----|-------|--------|-------|----------|
| **ZOE** | `@zaoclaw_bot` | `bot/src/zoe/` | ~87 | ACTIVE | 19 files | memory-block sync; 50-call/day cap not enforced |
| **Hermes** | `@zoe_hermes_bot` | `bot/src/hermes/` | 11 | ACTIVE | 0 | no tests on coder/critic loop + cost cap |
| **ZAO Devz** | `@zaodevz_bot` | `bot/src/devz/` | 1 | ACTIVE | 0 | dual-bot coupling; loopback HTTP :3007 |
| **ZAOstock** | `@ZAOstockTeamBot` | `bot/src/` (root) | ~23 | ACTIVE / graduating | 0 | snapshot deploy drift; weak 4-char auth |
| **Team bots** (Magnetiq/AttaBotty) | `@zao_magnetiq_bot`, `@z_attabotty_bot` | `bot/src/teams/` | 5 | DORMANT (decommissioned) | 0 | lingering decommissioned code |
| **Fleet agent** | (none) | `bot/src/fleet-agent/` | 1 | STAGED / disabled | 0 | enable deliberately only |
| **Bonfire** | `@zabal_bonfire` | external (bonfires.ai) | - | ACTIVE | - | recall is manual relay, no SDK |
| **DeepMeeting** | `@zdeepmeeting_bot` | external | - | DEGRADED | - | group routing broken |

All on-VPS bots share the **Hermes pattern**: LLM calls go through
`bot/src/hermes/claude-cli.ts` -> Claude Code CLI on Max-plan OAuth (no API key
in process env). Three systemd `--user` units on `zaal@31.97.148.88`:
`zoe-bot`, `zao-devz-stack` (Devz + Hermes in one process), `zaostock-bot`.

---

## Top issues (ranked)

1. **CRITICAL - Untracked snapshot deploy drift.** Hermes + Devz + ZAOstock run
   from `~/zaostock-bot`, which is **not a git checkout** - it's a hand-patched
   snapshot that can silently diverge from `main`. Not reproducible, no audit
   trail. *Fix:* convert to a real checkout or a tagged release + deploy script.
2. **HIGH - ZOE VPS on a stale feature branch.** `~/zao-os` tracks an old
   `claude/*` branch; merged PRs on `main` aren't deployed. *Fix:* point at the
   canonical ZOE branch and fast-forward (use `scripts/zoe-deploy.sh`, which
   exists precisely to prevent the per-file drift that crashed the bot 2026-06-15).
3. **HIGH - Decommissioned code lingering.** `bot/src/teams/` (Magnetiq/AttaBotty)
   is dormant + decommissioned per doc 601 but still in-tree. Same for FISHBOWLZ
   references outside `bot/`. *Fix:* delete or formally un-decommission with a doc.
4. **MEDIUM - Zero tests on Hermes core.** The coder->critic retry loop, cost cap
   (`fleetDailyGuard` is an in-memory counter that resets on restart), and the
   risk-pattern/secret detector are all untested. *Fix:* add `runner` + `types` tests.
5. **MEDIUM - ZOE 50-call/day cap is documented but not enforced.** No counter in
   the concierge path; the "alert if exceeded" never fires. *Fix:* per-day counter
   in the turn path with a warn + soft-block.
6. **MEDIUM - Secret-hygiene guards are partial.** `.env` is gitignored and Hermes
   detects some risk patterns, but there is no pre-commit hook (guard 2) and the
   detector misses PEM blocks and the `sk-ant-` Anthropic key shape. *Fix:* add a
   `.husky/pre-commit` running the doc-473 step-2 scan; widen the regex set.
7. **MEDIUM - Bonfire recall is manual relay, not SDK.** `recall.ts` hardcodes the
   relay path; a Bonfire API change blinds ZOE. Off-VPS bots have no heartbeat to
   the cowork board. *Fix:* migrate once the SDK lands; add a VPS relay heartbeat.
8. **LOW - Unstructured logging.** ~167 `console.log/warn/error` across the fleet -
   fine for the systemd journal, but no severity/context. *Fix:* thin structured logger.

---

## Per-surface notes

### ZOE (`bot/src/zoe/`)
Mature, the most-developed surface. Per-turn model is a single synchronous
`runConciergeTurn` (one Claude CLI call) with a `typing` refresh + one 6s "Got it,
working" ack. Multi-step work goes through `dispatch.ts`/`decompose.ts` with a
`onSubtaskStart` progress hook and a y/n ambiguity gate. Memory is a Letta-style
4-block builder (`persona.md`, `human.md`, `recent/<chat>.json`, `tasks.json`).
Good test coverage on the hard logic (decompose, dispatch, reflexion, extractors,
pii); gaps on `memory.ts`, `concierge.ts`, `scheduler.ts`. The **posts/** social
drafter is its own subsystem (see Decision below).

### Hermes (`bot/src/hermes/`)
Lean, integration-focused, no standalone entry - invoked via `/fix` in the Devz
chat or a loopback HTTP dispatch. Coder (Opus) + Critic (Sonnet), retry to 3, PR
on score >=70. Solid risk-pattern guard in `types.ts`. Zero tests; cost accounting
is "notional" (public API pricing, but Max plan is flat-fee) and the daily guard
is non-persistent.

### ZAO Devz (`bot/src/devz/`)
Two grammY bots in one process narrating the Hermes loop as Coder/Critic. Clean,
well-guarded loopback HTTP listener on `127.0.0.1:3007` (`x-hermes-secret`, strict
path validation). Tight coupling: if either token dies, narration breaks. Phase 3
plan is to fold into Hermes.

### ZAOstock (`bot/src/` root)
Festival coordination; graduating to its own repo. Monolithic command dispatch,
Supabase-backed. Weak 4-char login codes, fragile freeform-text action parser,
still references Minimax/Ollama for classification (should move to the Claude CLI
path the rest of the fleet uses).

### Team bots / Fleet agent
`teams/` is dormant + decommissioned - delete or re-doc. `fleet-agent/` is a
deliberately-disabled host supervisor with a hard-coded systemctl allowlist and no
shell interpolation; safe, enable only on purpose.

---

## What changed this session

This audit accompanied two ZOE social-drafter builds:

- **Build 1 (shipped this session):** ZOE now surfaces the **single best** post
  draft instead of a backlog of up to 30. New `posts/select-best.ts` judges the
  day's drafts (LLM judge + heuristic fallback, fresh-window filter) and both the
  daily notice and `/drafts` surface one winner, archiving the rest. See the PR.
- **Build 2 (doc 872 - effectiveness):** non-blocking clarify, live steering,
  progress narration. Scoped against the actual turn model above; tracked separately
  because doc 872 itself lives off-repo (local only) and live-steering is a
  concurrency change to the turn loop.

---

## Source

- Sub-agent fleet sweep, 2026-06-17 (this session).
- Cross-ref: doc 601 (agent-stack cleanup), `bot/REGISTRY.md`, `.claude/rules/secret-hygiene.md` (doc 473).
