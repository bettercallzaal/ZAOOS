---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-20
original-query: Synthesize all ZAO agent docs into one reference, audit team-bots code PR 503 against canon (reconstructed)
related-docs: 601, 607, 640, 642, 644
tier: DISPATCH
---

# 645 - Agent canon + team-bots audit (Magnetiq + AttaBotty)

> Goal: synthesize every ZAO agent doc into one reference, then pressure-test the team-bots code that shipped in PR #503 against that canon. Decide ship/hold.

## Recommendation: GO SHIP

Team-bots code (`bot/src/teams/`) follows Hermes canon precisely. **Zero code blockers.** One pre-deploy ops check (secret-scan persona files). Five P1 gaps for the 7-day post-launch window. One over-build to clean up.

Deploy tonight once tokens land. Track P1s as next-sprint follow-ups.

## Key decisions table (top first, no preamble)

| # | Decision | Action |
|---|----------|--------|
| 1 | Ship team-bots as-is to VPS 1 once tokens + chat IDs land | Zaal sends tokens, I deploy |
| 2 | Drop unused `team_bot_daily_summaries` table OR wire writes to it | Choose path before next migration runs |
| 3 | Add per-user @mention cooldown (60s) before bot has 7 days uptime | New PR after deploy validation |
| 4 | Add daily-budget alert DM to Zaal if any bot exhausts $0.50/$3/$1 cap | New PR within 7 days |
| 5 | Paginate `/context` output, truncate at 2500 chars not 3500 | New PR within 7 days |
| 6 | Validate persona files on hot-reload (non-empty, has heading) | New PR within 7 days |
| 7 | Add secret-scan pre-commit hook for `bot/src/teams/**` | This branch or next infra PR |
| 8 | Answer 3 unresolved canon questions (auto-summarize cadence, VOD storage, bot registry) | Zaal decides, I write to memory |

## Inventory headline numbers

- **99 agent-focused docs** in `research/agents/` (some doc nums appear twice as variants)
- **20 agent-adjacent docs** across other folders
- **119 total** agent research surface
- **17 docs explicitly decommissioned** (do-not-rebuild list)
- **15 most load-bearing** for team-bots design - top 5: Doc 644 (canon), 495 (team bot patterns), 245 (ZOE workflow), 527 (multi-bot collisions), 467 (Magnetiq spec)

Full list: [inventory.md](./inventory.md)

## Canon at a glance (8 locked dimensions)

| # | Dimension | LOCKED | DECOMMISSIONED |
|---|-----------|--------|----------------|
| 1 | Framework + brain | Hermes (claude-cli subprocess, Max OAuth, --append-system-prompt, --allowedTools). Sonnet for chat, Opus for hard. Ollama for low-stakes only. | openclaw, Composio AO, Agent Zero, ZOE v2, 10-bot fleet, Hermes Telegram identity |
| 2 | Surfaces + identity | 5 surfaces: ZOE, Hermes, ZAO Devz, Bonfire, ZAOstock bot. Magnetiq + AttaBotty approved per doc 640/642. No new bots without numbered doc + Zaal approval. | FISHBOWLZ (paused), 10-bot dream, Hermes Telegram |
| 3 | Deployment | VPS 1 only (Hostinger KVM 2, 31.97.148.88). rsync not git-clone. systemd user units. `~/.env` chmod 600. All 5 secret-hygiene guards. | Docker/openclaw container, any VPS 2 |
| 4 | Auth | Claude Code Max plan OAuth via `~/.claude/auth.json`. Own Telegram token per bot identity. Bonfire SDK pending Joshua.eth. | ANTHROPIC_API_KEY env var, direct Minimax, Composio AO key infra |
| 5 | Memory + retrieval | Bonfire substrate with 3 tiers (PUBLIC/ZAOSTOCK_TEAM/ZAAL_PRIVATE). No demotion. Per-bot Supabase tables. ZOE Letta-style memory blocks. Quarterly OWL backup. | Local sqlite embeddings, bot-to-bot graph sharing pre-SDK |
| 6 | Orchestration | Zaal is orchestrator. ZOE dispatcher pattern (@zaostock, @bonfire, @hermes prefixes). Bridge group passive. Failure isolation per systemd unit. | Bot-to-bot autonomous coordination, Hermes Telegram, cross-bot narrator pairs |
| 7 | Safety + cost | Per-bot allowlists (chat_id + user_id). Confirmation gates on destructive commands. Secrets refusal. Passive listening (speaks on cmd/mention only). Total cost ~$250-350/mo. | OpenClaw tool registry, Composio AO tools, unbounded tool access |
| 8 | MCP + tools | --allowedTools / --disallowedTools per bot. Ollama for classify, not writing. Bonfire MCP server pending. | dangerouslySetInnerHTML, console.log in prod, .env writes, OpenClaw plugins |

Full canon: [canon.md](./canon.md)

## Audit of PR #503 (team-bots code) vs canon

### Ship-as-is (good, do not touch)

- Dual-bot in one Node process matches `bot/src/devz/index.ts` pattern
- Hermes-brain pattern preserved (Sonnet chat $0.50 / Opus research $3 / Opus summary $1)
- Allowed-tools matrix correct: chat = Read/Glob/Grep only; research adds WebSearch/WebFetch/Bash(grep|find|ls); disallow Edit/Write/git push/git commit/rm/curl POST
- Persona files versioned + hot-reloadable (improvement over Devz)
- Supabase memory with bot-column CHECK constraints on every table
- Allowlist + chat-id gate enforced via middleware (chatGate) + per-command (userGate)
- systemd unit follows ZAOstock + Devz pattern (working dir, env file, TZ, restart on failure, journal)
- node-cron daily summary with timezone support, fail-soft error handling
- All env vars validated on boot (fail-fast at `memory.ts:14-16`, `shared.ts:35-41`)

### Ship-blockers (must fix before tokens go on VPS)

| # | Issue | Risk | Fix |
|---|-------|------|-----|
| 1 | No secret-scan run yet on `bot/src/teams/**` | Persona files could leak Zaal/Tyler TG IDs or stub tokens | Run `grep -Er '(BOT_TOKEN\|ALLOWED_IDS\|SUPABASE_\|NEYNAR_\|sk-ant-\|ghp_)' bot/src/teams/` - must return empty before push |

That is the only blocker. Everything else is code-side clean.

### P1 gaps (fix within 7 days of deploy)

1. **No @mention rate-limit cooldown** (`commands.ts:260-290`) - attacker could spam $0.50 replies. Add `Map<user_id, last_mention_ts>` with 60s cooldown in `shared.ts`.
2. **`/context` output not paginated** (`commands.ts:181-198`) - can exceed Telegram 3500-char limit silently. Truncate at 2500 + add "use /facts or /tasks for full list."
3. **No daily-budget alert** (`brain.ts:60-95`) - if Magnetiq exhausts $0.50 mid-day, silent fail with generic error. Add Supabase daily-spend table + DM Zaal on breach.
4. **Persona files lack validation on hot-reload** (`brain.ts:61`) - corrupt persona = silent wrong behavior. Validate non-empty + at-least-one heading + min 50 chars.
5. **No immutable audit log for `/idea` `/task` actions** (`memory.ts:35-46`) - low priority, current table includes `from_id` so traceable.

### Over-builds (consider removing)

1. **`team_bot_daily_summaries` table** (`bot/migrations/team_bots.sql:58-66`) - prepared but never written. Either uncomment write logic or drop from migration.

### Deltas vs Hermes/Devz (existing canonical pair)

| Dimension | Devz/Hermes | Teams (PR #503) | Verdict |
|-----------|-------------|-----------------|---------|
| Entry point | dual-bot in one process | dual-bot in one process | MATCH |
| Token validation | fail-fast on missing | fail-fast on missing | MATCH |
| Chat gate | mention-filter middleware | chat_id middleware | MATCH (Teams cleaner) |
| User allowlist | global ADMIN_IDS | per-bot allowlist | TEAMS BETTER |
| Brain | `callClaudeCli` | `callClaudeCli` (same import) | MATCH |
| Model + budget | Opus, no caps | Sonnet $0.50 / Opus $3 / Opus $1 | TEAMS MORE PRUDENT |
| Persona | hardcoded in handlers | hot-reloadable .md files | TEAMS BETTER |
| Memory stitching | none | last 24h + facts + tasks | TEAMS BETTER |
| Daily summary | none | node-cron 06:00 ET Opus | TEAMS ADDS FEATURE |

Full audit: [delta.md](./delta.md)

### Security checklist (all pass)

- [PASS] No secrets/tokens logged
- [PASS] Allowlist enforced on state mutations (`/idea` `/task` `/done` `/clip` `/fact` `/research` `/summary`)
- [PASS] Chat-scope enforced (silent ignore outside chat_id)
- [PASS] Brain disallows Edit/Write/git push/git commit/rm/curl POST
- [PASS] No SQL string interpolation (Supabase JS client parameterized)
- [PASS] No HTML injection in TG replies (no parse_mode set, plain text only)
- [PASS] All env vars validated on boot
- [PASS] Every table has `bot in ('magnetiq','attabotty')` CHECK constraint
- [PASS] Persona files refuse to leak env / commit / DM external

## 3 fuzzy canon zones (under-documented, decide before next bot)

1. **Memory tier semantics.** Bonfire 3-tier model exists but no Bonfire schema definitions for what counts as PUBLIC vs ZAOSTOCK_TEAM vs ZAAL_PRIVATE at the field level. Risk: as bots multiply, accidental tier leaks. **Need:** schema doc with field-level tier labels.
2. **Bot token rotation cadence.** Quarterly is suggested, never locked. **Need:** decision + runbook for routine rotation + emergency leak response.
3. **Budget monitoring.** Cost model estimated ~$250-350/mo, no real-time dashboard. **Need:** Supabase view per bot per day, alert thresholds, monthly burn report.

## 3 unresolved Magnetiq/AttaBotty questions (Doc 644 carry-over)

1. **Magnetiq auto-summarize cadence:** every 50 messages? after 1hr silence? smart topic-shift detection? **Default: on /context + daily cron only** (current PR #503 behavior). Reopen if Tyler asks for it.
2. **AttaBotty VOD review storage:** Supabase only (queryable, audit), Google Doc (shareable, native to AttaBotty flow), or both? **Default: Supabase only** (current PR #503). Add Google Doc export as P2 task.
3. **Bot registry:** single source of truth listing every bot + chat_id + allowed users + health? **Defer until bot 4+** (we have 5 surfaces + Magnetiq + AttaBotty = 7; threshold = 10).

## Action bridge

| Action | Owner | Type | By when |
|--------|-------|------|---------|
| Run secret-scan on `bot/src/teams/**` | I do | Pre-push | Now |
| Zaal: create 2 bots via @BotFather | Zaal | Manual | Tonight |
| Zaal: send tokens via chat | Zaal | Manual | Tonight |
| Deploy `team_bots.sql` to Supabase | I do via Supabase SQL editor | Migration | Tonight |
| SSH tokens to `~/zaostock-bot/.env` on VPS 1 | I do | Deploy | Tonight |
| `systemctl --user enable --now zao-team-bots` | I do | Deploy | Tonight |
| `/whoami` in each group, capture chat_id + user_id, populate allowlists, restart unit | Zaal + I | Deploy | Tonight |
| Drop OR wire `team_bot_daily_summaries` | I do | Code | Within 24h |
| Add @mention cooldown (60s per user) | I do | PR | Within 7 days |
| Add daily budget alert DM to Zaal | I do | PR | Within 7 days |
| Paginate /context output | I do | PR | Within 7 days |
| Validate persona files on read | I do | PR | Within 7 days |
| Write Bonfire field-level tier schema doc | Zaal + Bonfire team | Doc | Before next new bot |
| Decide bot-token rotation cadence + runbook | Zaal | Decision + memory | Within 30 days |
| Build per-bot daily-cost dashboard view | I do | PR | Within 30 days |

## Sub-docs in this hub

- [inventory.md](./inventory.md) - all 119 agent-touching docs, top 15 for team-bots, decommissioned list
- [canon.md](./canon.md) - 8 dimensions of locked decisions + decommissioned + open questions
- [delta.md](./delta.md) - full audit of PR #503 with file:line citations + 9-item security checklist

## Sources

- Doc 644 - ZAO agent stack canon (the hub this audits against)
- Doc 601 - agent stack cleanup decision
- Doc 607 - three bots one substrate
- Doc 600 - agentic stack coordination v1
- Doc 495 - team telegram bot 2026 patterns
- Doc 245 - ZOE upgrade autonomous workflow 2026
- Doc 527 - multi-bot telegram coordination best practices
- Doc 461 - fix-PR pipeline (Hermes safety layers)
- PR #503 - team-bots code (bot/src/teams/)
- User memory: project_hermes_canonical, project_no_vps2, project_ollama_local_llm, feedback_prefer_claude_max_subscription, feedback_oss_first_no_platforms
