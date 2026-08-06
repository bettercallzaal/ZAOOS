---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 601, 836, 2208, 2209
original-query: "Keep the ZAO OS operating manual updated (living doc) - task #51"
tier: STANDARD
---

# 2210 - ZAO OS Operating Manual (living doc)

> **Goal:** The one runbook for HOW ZAO runs operationally - surfaces, fleet, deploy, cost, gated boundaries - as of 2026-08-06. Grounded in the same-night full-estate audit (doc 2209). This is the living doc task #51 asked for; update it when the operational reality changes.

## 1. Primary surfaces (4, post doc-601 cleanup)

| Surface | What | Source of truth |
|---------|------|-----------------|
| **ZOE** (`@zaoclaw_bot`) | The orchestrator: concierge (tasks/captures/brief/recall) + the autonomous fix-PR pipeline (coder+critic+auto-PR). Node-orchestrated, ~98 modules. | `bot/src/zoe/`, deployed on the VPS at `~/zao-bot-live` via `zoe-bot.service` (systemd --user) |
| **ZAO Devz** (`@zaodevz_bot`) | Group dispatch + hourly learning tip | `bot/src/devz/` |
| **Bonfire** (`@zabal_bonfire`) | Knowledge-graph recall + ingest | bonfires.ai (Genesis tier) |
| **ZAOstock bot** (`@ZAOstockTeamBot`) | Festival team coordination | `bot/` root |

Decommissioned (do NOT restart): openclaw squad, Composio AO, ZOE v2, the 10-bot fleet, Hermes-as-separate-bot, FISHBOWLZ. See CLAUDE.md.

## 2. ZOE live capabilities (verified live 2026-08-06)

Deployed + healthy on the VPS: cross-family verification (critic runs on a different model family - OpenRouter/DeepSeek - than the Claude builder, via `runCritiqueModel`, fact-checked before apply), verify-replan on autonomous research (VMAO; the `bare`-strips-OAuth judge bug is fixed), step-level tracing (`trace.ts`, OTel-shaped, writes `~/.zao/zoe/traces/`), golden-eval, the board-in-context team block, `/board`, recall un-truncation. Cost/observability: `cost-ledger.ts`, `watcher.ts`, `runs.ts`.

## 3. The autonomous fleet (~21 loops)

Shell loops (cheap-loop.sh / loop-agent.sh) in tmux on the VPS, PR-only, one item/tick, status to ZAAL BOTZ. As of 2026-08-06 **all pinned to OpenRouter** (`~/.zao/openrouter-loops`) to preserve the Claude weekly cap; cheap-loop defaults to OpenRouter (DeepSeek), Ollama as local fallback.

**Loop governance (workflow-discipline rule 2):** each loop needs a purpose, a cost ceiling (empty queue = zero spend), and self-reporting. **Known failure mode - PR pileups:** loops that open one-tiny-PR-per-feature accrete 30-100 near-identical PRs. As of 2026-08-06 there are 5 (festivals 100, sparkz 47, wwtracker 40, zol 34, zao-papers 6 = ~227). Mitigation applied: a `feedback-consolidate-prs` directive on each ("batch into ONE PR, check dupes, fewer+simpler"). Clearing the backlog is Zaal-gated (doc 2209).

## 4. Deploy pipeline (ZOE bot)

`~/bin/zoe-autodeploy.sh` on a **10-min cron**. Flow: fetch origin/main -> if HEAD != origin/main, verify origin/main in a throwaway `/tmp/zoe-verify` checkout (esbuild boot-verify, HARD-FAIL on missing verifier) -> ff the live clone + `npm install` (now `timeout 300`-guarded, 2026-08-06, so a hung install can't hold the flock and stick the deploy) -> restart `zoe-bot` -> 12s health-check + auto-rollback on boot crash -> `zao-status` ping. One-instance flock. **Never hot-edit this script or restart the bot casually - it is a Zaal-gated operator surface** (agent-loops rules 31/32). Known gotcha: the verify uses a shallow clone; if it lags, a manual run kicks it through.

## 5. Cost model (doc 2208)

Cost ladder: Ollama (local, $0) -> OpenRouter/DeepSeek (cheap, now primary for loops) -> Codex ($20 flat, periodically capped) -> Claude (the Max weekly cap - reserve for grounded live-code). **Biggest unclaimed wins: prompt caching (90% off reused context, verified) + Batch API (~50% off async).** ZAO has: cost-ledger, watcher, coarse model-routing, OpenRouter. Gap: caching, batch, a hard per-loop daily halt-cap.

## 6. Repo estate (doc 2209)

133 active repos across bettercallzaal + ZAODEVZ, mostly public. ZAOOS is the lab (monorepo-as-lab; graduates get own repo + code deleted from ZAOOS). Health concentrated well except the 5 loop pileups + 20+ stale/abandoned repos to archive.

## 7. Gated actions (need Zaal - never autonomous)

Merging PRs, closing/archiving repos, deploying/restarting the bot, outbound (posts/DMs/email), on-chain, spend, `community.config.ts`, DB migrations, new deps, secrets. The auto-mode classifier enforces several (e.g. blocks bulk PR-merge). Overnight/unsupervised work is **PR-only + docs/specs**, never merges or gated actions (agent-loops rule 35). Reversible = do it; irreversible = ask.

## 8. Where things live (quick ref)

- ZOE code: `bot/src/zoe/` (VPS `~/zao-bot-live`) · Deploy: `~/bin/zoe-autodeploy.sh` · Loops: tmux + `~/bin/cheap-loop.sh`/`loop-agent.sh` · Loop provider pins: `~/.zao/openrouter-loops` · Loop directives: `~/.claude/projects/-home-zaal-<loop>/memory/` · Traces: `~/.zao/zoe/traces/` · Cost: `bot/src/zoe/cost-ledger.ts` · Secrets: `~/.zao/private/`, `~/.zao/zao.env` (never commit) · Research: `research/` (permanent, never graduates out).

## Also See

- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the 4-surface cleanup · [Doc 2208](../../business/2208-ai-cost-agentic-infra/) - cost · [Doc 2209](../../security/2209-repo-estate-audit-aug6/) - estate
- CLAUDE.md (primary surfaces + boundaries), `.claude/rules/agent-loops.md` (loop ops), `workflow-discipline.md` (loop governance)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update this doc when the operational reality changes (a surface added/removed, deploy flow changed, cost model shifts) - it is the living #51 doc | Zaal | Living-doc | ongoing (re-validate monthly) |
| Fold the "gated actions" list (section 7) into ZOE's own guardrails if not already enforced in code | Zaal | PR | 2026-08-20 |

## Sources

- Same-night live estate audit (doc 2209), VPS state (`~/zao-bot-live`, `~/.zao/openrouter-loops`, `zoe-autodeploy.sh`), and ZOE code read this session - **[FULL]**
- CLAUDE.md primary-surfaces table + `.claude/rules/*` - **[FULL]**
