---
topic: agents
type: audit
status: research-complete
last-validated: 2026-04-25
related-docs: 90, 200, 234, 239, 256, 325, 346, 355, 415, 461, 467, 473, 484, 489, 506, 507, 508
tier: DISPATCH
---

# 523 - ZAO Agentic Systems Full Audit + Fix-PR Pipeline + Hermes Dual-Bot Architecture

> **Goal:** Lock in every agentic system ZAO has (codebase + VPS + research consensus), fix the broken auto-PR pipeline, spec the Hermes-pattern dual ZAOstock bot, upgrade ZOE. One pass, one plan, one PR.

Trigger: Zaal asked to audit everything agent-related across codebase + VPS + research + 2026 best practices and ship the fixes. Four parallel sub-agents ran the audit; this hub synthesizes.

## Key Decisions (Recommendations FIRST)

| Decision | Verdict | Why |
|----------|---------|-----|
| Install doc 461 safe-git-push.sh **today** (the fix-PR pipeline is "wired but broken") | **YES, P0** | Audit confirmed: `.git/hooks/pre-push` calls `~/bin/safe-git-push.sh` but **the script does not exist**. Hook silently fails. This is the bug Zaal hit yesterday with the merged-PR push. Fix is paste-the-script + GitHub branch protection on `main`. 15 min total. |
| Adopt **anthropics/claude-code-action@v1** as the autonomous PR shipper | **YES** | Official, runs Claude Code runtime inside GitHub Actions runner, respects CLAUDE.md, no extra service to maintain. Trigger via `@claude` mention or scheduled prompt. Replaces the "ZOE writes commit to wrong branch" pattern. |
| Adopt **SelfHeal pattern** (Fixer agent + Critic agent loop) for the Hermes dual-bot | **YES** | arxiv 2604.17699 + LangChain GTM Agent in production. Fixer (Opus 4.7) writes fix; Critic (Sonnet 4.6) grades + routes back if score <70. Max 3 attempts. Lower cost than dual-Opus. ZAOstock dual-bot maps directly. |
| Adopt **Gru pattern** (Telegram-supergroup-topics orchestrator) for ZOE-of-orchestrators role | **YES** | Telegram-native (matches doc 467). Multi-model swap. Knowledge graph + escalation chains. Single VPS 1 docker-compose deploy. Doesn't replace OpenClaw - sits on top of it. |
| Build **ZAO Stock Coder** (Approach 1 bot, ships PRs from Telegram) + **Hermes Stock** (Critic that audits + repairs Stock Coder's output) | **YES, BUILD THIS WEEK** | Direct match for Zaal's ask: "stock agent has issue, ask Hermes-stock what's wrong, it ships PR, pings Zaal to push." |
| Promote **ZOE** to dual-brain orchestrator: Haiku (triage + classify) + Sonnet (voice) + Opus (heavy reasoning) per ss-triage-router (doc 473) | **YES** | Beats memory `project_zoe_v2_redesign` "two-brain M2.7+Opus" - cleaner cost split, doc 473 already shipped install pattern. |
| Fix **OpenClaw Jina-Reader MCP failure** (hourly errors in container logs since at least Apr 24) | **YES, P1** | VPS audit found `[bundle-mcp] failed to start server "jina-reader"` repeating XX:15 every hour. Plus Telegram channel dispatch broken. Both block ZOE from web research + Telegram routing. |
| Build **ZAOstock dual-bot now**, defer Magnetiq/WaveWarZ/Devz fleet rollout to Week 2-3 (per doc 467 staging) | **YES** | Dual-bot is the right concrete pilot. Validates Fixer/Critic before fanning out. |
| Replace `bot/src/llm.ts` Minimax M2.7 with Claude (Sonnet 4.6 default, Opus 4.7 for `/do` action parsing) | **YES** | Bot already wired to swap when `ANTHROPIC_API_KEY` lands. Quality bump + integrates with Hermes pair. |
| Skip ElizaOS resurrection | **CONFIRMED SKIP** | Doc 90 mentioned, but research synthesis flags it as superseded by OpenClaw + Claude Agent SDK. Already deferred per memory `project_elizaos_agent`. |

## Current State Map

### Codebase Agentic Systems (Live)

| System | Path | Status | LLM | Tests |
|--------|------|--------|-----|-------|
| VAULT trading agent | `src/lib/agents/vault.ts` + `runner.ts` | LIVE (cron 6am UTC) | none (rules) | 3 unit tests |
| BANKER trading agent | `src/lib/agents/banker.ts` | LIVE config, **wallet not funded** | none | 3 unit tests |
| DEALER trading agent | `src/lib/agents/dealer.ts` | LIVE config, **wallet not funded** | none | 3 unit tests |
| ZAOstock Telegram bot | `bot/` | LIVE beta (PR #303 merged, Tier 1 cohesion) | Minimax M2.7 (awaiting Claude swap) | 0 tests |
| Agent admin dashboard | `src/app/api/admin/agents/` + `src/components/admin/agents/` | scaffold; only VAULT real | n/a | 0 |
| Cross-platform publish | `src/lib/publish/{x,discord,bluesky,threads,lens,telegram,hive,broadcast}.ts` | scaffold, no agent runners | n/a | 0 |
| Agent health check | `src/app/api/agents/health` | LIVE | n/a | 0 |
| Vercel cron routes | `src/app/api/cron/agents/{vault,banker,dealer}/route.ts` | LIVE, bearer auth | n/a | 0 |

### Codebase Agent Tooling (Local)

- `.claude/agents/code-reviewer.md` - 3.8KB, 2026-03-19, **defined but NOT wired to bot**
- `.claude/skills/` - 26 skills (autoresearch, vps, worksession, zao-research, etc.)
- `.claude/rules/` - 6 rule files (api-routes, components, secret-hygiene, tests, typescript-hygiene, skill-enhancements)
- `.claude/settings.json` - PreToolUse hooks for `git commit` (eslint), `git push` (branch-guard + typecheck), `git branch -m main` (refused)
- `.git/hooks/pre-push` - **wired** but calls missing `~/bin/safe-git-push.sh`

### VPS Stack (31.97.148.88, only VPS)

| Service | Status | Path | Trigger |
|---------|--------|------|---------|
| **OpenClaw gateway** (dockerized) | UP 6 days, healthy | container `openclaw-openclaw-gateway-1` | port 18789-18790 |
| ZOE identity (SOUL/MEMORY/AGENTS/TASKS/HEARTBEAT) | files present, modified Apr 10-16 | `/home/node/openclaw-workspace/` | static config |
| ZAOstock bot | systemd user `zaostock-bot`, active | `~/zaostock-bot/` | restart loop today (SIGKILL forced once) |
| Paperclip AI | systemd user `paperclipai`, active | port 3100, 9.3 GB workspace | named tunnel `zao-agents` |
| AO agent framework | running | port 14801 (`ao.zaoos.com`) + `:3000` | ttyd terminal at `:7681` |
| Cloudflare tunnels | active, persistent | tunnel `zao-agents` (b5025a71) | paperclip.zaoos.com, ao.zaoos.com, zoe.zaoos.com |
| Ollama | active | port 11434 | not actively dispatched |
| ZOE dashboard | port 5072 | `node server.js` | systemd user |
| Postgres (Paperclip) | port 54329 | embedded | local only |
| Caddy reverse proxy | 2 instances (possibly dup) | ports 3002, 3003, 3006 | active |

**Crons running on VPS** (24h activity):
- `* * * * *` watchdog.sh + auto-sync.sh + session-watcher every 2min
- `0 0 * * 0` health-snapshot, `0 2` daily-digest, `0 6` follower-snapshot, `0 8` nightly-research, `0 9` morning-brief, `0 1` evening-reflect, `0 23` wavewarz-sync, `*/15` test-checklist-ping
- `*/30` zoe-learning-pings COMMENTED OUT (env keys not loaded)

### Research Library Consensus (synthesized from 14+ docs)

Every doc converges on:
1. **Runtime:** OpenClaw + Claude Agent SDK (TS) for ZAO OS, Telegram-native bot fleet for branded surfaces (467)
2. **Model routing:** Haiku 4.5 (classify/guardrail) -> Sonnet 4.6 (voice/digests) -> Opus 4.7 (heavy/code) (467, 473)
3. **Self-improvement:** Matricula 4-layer loop Action -> Metrics -> Reflection -> Strategy with nightly Haiku consolidation (484)
4. **Memory:** Supabase pgvector + Cohere embeddings, cross-learning to private repo (467 Part 7)
5. **PR safety:** Defense-in-depth Claude hook + git pre-push hook + GitHub branch protection (461)
6. **Skills:** 3-5 curated picks max, Serena MCP semantic refactor (507, 508)

## Top 3 Bugs Blocking Today

| # | Bug | Where | Fix |
|---|-----|-------|-----|
| 1 | **safe-git-push.sh hook wired but script missing** | `.git/hooks/pre-push` references `~/bin/safe-git-push.sh`; script does not exist | Install per doc 461 Section 1. 15 min. |
| 2 | **OpenClaw Jina-Reader MCP failing hourly** | OpenClaw container logs `[bundle-mcp] failed to start server "jina-reader"` every XX:15 | Check `~/.openclaw/config.toml` MCP servers; either remove jina entry or fix env. 30 min. |
| 3 | **OpenClaw Telegram channel dispatch broken** | Container logs `Channel is unavailable: telegram` repeating | Verify Telegram bridge env vars (BOT_TOKEN + chat IDs) on VPS. 30 min. |

Plus latent: BANKER + DEALER wallets unfunded (`trading_enabled=false`); fund + flip when ready.

## Fix-PR Pipeline Activation Plan (P0, ship today)

Three layers, each independently effective. All must be installed - defense in depth.

### Layer 1: Install safe-git-push.sh (local Bash)

Doc 461 Section 1 has the script. Paste into `~/bin/safe-git-push.sh`, `chmod +x`, verify the existing `.git/hooks/pre-push` runs it.

Checks the script enforces:
- Refuse push to `main` / `master` / `develop` (default branches)
- Refuse push to a branch whose PR is already MERGED (gh api lookup)
- Refuse `--no-verify` flag
- Refuse `--force` / `+refs` rewrites unless `ZAO_FORCE_PUSH_OK=1` env var set explicitly

### Layer 2: Claude Code PreToolUse hook (already partly there)

`~/.claude/settings.json` already has `git push` PreToolUse hook calling `branch-guard.sh + typecheck`. Audit confirmed lines 39-51. Verify `branch-guard.sh` exists at `~/bin/` (audit didn't confirm). If missing, install from doc 461 Section 2.

### Layer 3: GitHub branch protection on main (server-side authority)

```bash
gh api -X PUT /repos/bettercallzaal/ZAOOS/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":[]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":0}' \
  -f restrictions=null \
  -f required_linear_history=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

This is authoritative - even if Layers 1+2 fail, GitHub refuses the push.

## Architecture: Hermes Dual-Bot for ZAOstock

Direct mapping of Zaal's request: "stock agent has issue -> ask Hermes-stock what's wrong -> ships PR -> pings Zaal to push."

```
[ZAOstock Telegram group]
        |
        | /fix <issue>     (Zaal or team member)
        v
+-----------------------+      grades, routes back if <70
| Stock-Coder (Fixer)   | <-----------------------------+
| Claude Opus 4.7       |                               |
| Reads issue + code    |                               |
| Writes branch + diff  |   ships diff +                |
| Opens PR via gh       |   PR link to                  |
+-----------------------+   Hermes-Stock                |
        |                                               |
        v                                               |
+-----------------------+                               |
| Hermes-Stock (Critic) |                               |
| Claude Sonnet 4.6     |                               |
| Runs tests in worktree|                               |
| Scores 0-100          |                               |
| Posts grade to TG     |                               |
+-----------------------+                               |
        |                                               |
        | score >= 70                                   |
        v                                               |
[Telegram: @Zaal "PR #N ready, push when good"] -------+
        |
        v
[Zaal pushes] -> safe-git-push.sh validates -> GitHub branch protection enforces
```

Implementation files (new):

```
bot/src/
  hermes/
    coder.ts         # Stock-Coder Telegram /fix handler
    critic.ts        # Hermes-Stock review pass
    types.ts         # FixerInput, CritiqueResult
    pr.ts            # gh pr create wrapper
    worktree.ts      # git worktree add + cleanup
```

DB tables (new migration):

```sql
CREATE TABLE hermes_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by text NOT NULL,           -- telegram user id
  issue_text text NOT NULL,
  branch text,
  pr_number int,
  fixer_attempts int DEFAULT 0,         -- max 3
  critic_score numeric,                  -- 0-100
  critic_feedback text,
  status text DEFAULT 'pending',         -- pending|fixing|critiquing|ready|failed
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

Loop logic:
1. `/fix <text>` -> insert `hermes_runs` row, dispatch to Stock-Coder
2. Stock-Coder reads issue + relevant files, writes diff in fresh worktree, opens PR (no push to remote yet)
3. Hermes-Stock checks out PR branch, runs `npm test + npm run typecheck + biome check`, scores
4. Score >=70 -> Telegram message to Zaal with PR URL + "push when ready"
5. Score <70 -> feedback to Stock-Coder, retry (max 3)
6. After 3 fails -> escalate to Telegram "needs human"

Telegram commands:
- `/fix <issue>` - dispatch Hermes loop
- `/fix-status <run_id>` - check progress
- `/fix-cancel <run_id>` - kill in-flight run

## ZOE Upgrade Spec

**Current:** ZOE on VPS via OpenClaw gateway, SOUL/MEMORY/AGENTS/TASKS files, dispatches Telegram tips, runs cron-based briefings. Web research broken (jina-reader MCP failing). Telegram dispatch intermittently broken.

**Target:** ZOE = orchestrator-of-orchestrators. Routes incoming requests through ss-triage-router (doc 473): Haiku for classify, Sonnet for default response, Opus for code work. Calls Stock-Coder + Hermes-Stock for code-related fixes. Calls Research bot for `/research`. Calls future Magnetiq/WaveWarZ/Devz bots when fanned out.

Concrete upgrades (in order):
1. **Fix MCP servers** on VPS: jina-reader + telegram channel
2. **Install ss-triage-router** (doc 473 fork pattern) as ZOE's primary classifier - Haiku triage layer
3. **Wire `/fix` -> Hermes pair** as a tool ZOE can call
4. **Add `/research` -> existing /zao-research skill wrapper** as a tool ZOE can call
5. **Memory: install Matricula 4-layer loop** (doc 484) - new `agent_memories` table + nightly Haiku consolidation
6. **Voice: clone Zaal's pattern from existing TG outputs**, document in SOUL.md

## ZAOstock Bot LLM Swap (Minimax -> Claude)

Bot already gated on `ANTHROPIC_API_KEY` per `bot/src/llm.ts` line 1. Once key on VPS:

```ts
// bot/src/llm.ts
const provider = process.env.ANTHROPIC_API_KEY ? 'claude' : 'minimax';
```

Use Sonnet 4.6 default (`/ask`, voice). Use Opus 4.7 for `/do` action parsing (the discriminated-union schema in `bot/src/actions.ts` is intricate - Opus reasons cleaner).

Cost ceiling: $5/day per `feedback_no_arbitrary_targets` discipline - measure actual spend over 1 week, then revise.

## Stealable Repos (verified live)

| Repo | Stars | License | Use for |
|------|-------|---------|---------|
| [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) | (Anthropic official) | MIT | Autonomous PR shipper inside GitHub Actions |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) | 43,800 | Apache 2.0 | Local CLI fallback if Claude Code GitHub Action insufficient |
| [AgentGuardHQ/agentguard](https://github.com/AgentGuardHQ/agentguard) | (active) | MIT | 26 invariants (secrets, blast radius, branch protection); pre-push enforcement |
| [dwarvesf/claude-guardrails](https://github.com/dwarvesf/claude-guardrails) | (active) | MIT | PreToolUse secrets scan on `git commit` |
| [shaike1/relay](https://github.com/shaike1/relay) | (active) | MIT | Telegram supergroup-topics multi-agent orchestration pattern (Gru-style) |
| [oraios/serena](https://github.com/oraios/serena) | 23,410 | MIT | Already installed, semantic code edits |
| [eholt723/agentmesh](https://github.com/eholt723/agentmesh) | (active) | MIT | Reviewer + Fixer + Evaluator LangGraph SSE streaming reference for Hermes |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 50,000+ | MIT | CodeExecutionAgent self-debug loop reference |

## Sources

- Sub-agent 1 - Codebase audit (this session, 11 domains, GAPS section)
- Sub-agent 2 - VPS audit (this session, 27d uptime, jina-reader + telegram failures flagged)
- Sub-agent 3 - Research synthesis (this session, 14 docs read in full, consensus + conflicts mapped)
- Sub-agent 4 - 2026 best practices online (this session, 10 verified URLs, 3 stealable repos)
- [Doc 461 - Push-to-Merged-PR Failure Fix](../../dev-workflows/461-push-to-merged-pr-failure-fix/) - hook designs ready to install
- [Doc 467 - ZAO Branded Bot Fleet Design](../467-zao-bot-fleet-design-magnetiq/) - 5-bot Telegram hub-and-spoke
- [Doc 473 - clawdbotatg Apr 21 Updates](../473-clawdbotatg-apr21-updates-zoe-openclaw/) - ss-triage-router fork pattern
- [Doc 484 - Matricula Autonomous Farcaster Agent](../484-matricula-autonomous-farcaster-agent/) - 4-layer loop
- [Doc 256 - ZOE Agent Factory Vision](../256-zoe-agent-factory-vision/) - factory pattern
- [Doc 90 - AI-Run Community Agent OS](../090-ai-run-community-agent-os/) - foundational design
- [Anthropic Claude Code GitHub Action docs](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [arxiv 2604.17699 - SelfHeal LLM agent bug-fix patterns](https://arxiv.org/abs/2604.17699)
- [LangChain - How my agents self-heal in production](https://www.langchain.com/blog/how-my-agents-self-heal-in-production)

## Staleness + Verification

- Codebase audit: live commit refs (last as of 2026-04-25 Tier 1 cohesion PR #303)
- VPS audit: 24h log window, container uptime 6 days
- Research synthesis: docs read in full as of 2026-04-25
- Stealable repos: stars verified via gh api today
- Re-validate by 2026-05-25 - Hermes pair production data + first 30 days of Stock-Coder runs

## Next Actions (concrete, ordered)

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Install `~/bin/safe-git-push.sh` from doc 461 Section 1, verify pre-push hook runs it | @Zaal | Bash + chmod | Today |
| 2 | Verify `~/bin/branch-guard.sh` exists; install from doc 461 Section 2 if missing | @Zaal | Bash | Today |
| 3 | `gh api -X PUT /repos/bettercallzaal/ZAOOS/branches/main/protection` with payload above | @Zaal | API call | Today |
| 4 | SSH VPS, fix OpenClaw jina-reader MCP entry in `~/.openclaw/config.toml` (remove or repair) | @Zaal | VPS edit | Today |
| 5 | SSH VPS, restore Telegram channel dispatch (verify env vars in OpenClaw container) | @Zaal | VPS edit | Today |
| 6 | Install `anthropics/claude-code-action@v1` via `claude /install-github-app` - stores ANTHROPIC_API_KEY as GH secret | @Zaal | One command | This week |
| 7 | Build `bot/src/hermes/{coder.ts,critic.ts,pr.ts,worktree.ts}` + `hermes_runs` migration | @Zaal / Quad | Code | This week |
| 8 | Wire `/fix` Telegram command in ZAOstock bot, dispatch to Stock-Coder | @Zaal / Quad | Code | This week |
| 9 | Swap `bot/src/llm.ts` from Minimax to Claude (Sonnet default, Opus for `/do`) once API key on VPS | @Zaal | Code | This week |
| 10 | Install `ss-triage-router` MCP per doc 473 as ZOE classifier | @Zaal | MCP install | Next sprint |
| 11 | Add `agent_memories` table + nightly Haiku consolidation cron (Matricula 4-layer per doc 484) | @Zaal | Migration + cron | Next sprint |
| 12 | Fund BANKER + DEALER wallets, flip `trading_enabled=true` in `agent_config` | @Zaal | DB + ETH | When ready |
| 13 | Defer Magnetiq + WaveWarZ + Devz fleet rollout to Week 2-3 per doc 467 | @Zaal | Plan | Week 2-3 |
| 14 | Install `AgentGuardHQ/agentguard` with `agentguard.yaml` (no-secret-exposure: enforce, protected-branch: HIGH) | @Zaal | pip install | Next sprint |
| 15 | Re-validate this doc 2026-05-25 with Hermes production data | Claude | Audit | 2026-05-25 |

## Also See

- Doc 461 - has the actual safe-git-push.sh script + hook designs
- Doc 467 - bot fleet roadmap (Magnetiq / WaveWarZ / Stock / Devz / Research)
- Doc 473 - ss-triage-router for ZOE
- Doc 484 - Matricula 4-layer self-improvement
- Doc 506 - TRAE SOLO skip (vendor risk reference)
- Doc 507 - 1,116 skills curated picks (Serena, RTK, Composio installs from yesterday)
- Doc 508 - creator infra brief (Juke pivot, ComfyUI, consent rails)
- Memory `feedback_no_push_merged_pr` + `feedback_no_merged_pr_code` + `feedback_branch_discipline` - the rules safe-git-push.sh enforces
