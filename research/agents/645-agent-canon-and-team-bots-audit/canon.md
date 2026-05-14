# ZAO agent canon (locked decisions, 2026-05-11)

Canonical reference for all ZAO agent decisions across 8 dimensions. Builders use this to audit future bot proposals against locked patterns. Last validated 2026-05-11.

---

## 1. Framework + brain

### LOCKED decisions

- **Framework pattern:** Hermes (claude-cli subprocess), NOT openclaw containers, NOT Composio AO, NOT Agent Zero. Locked 2026-05-05 per explicit Zaal direction. [Doc 601, 644, project_hermes_canonical]
  - Spawn `claude` CLI as subprocess, never direct API calls
  - Auth via Claude Code Max plan OAuth (`~/.claude/auth.json`), NOT `ANTHROPIC_API_KEY` env var
  - System prompt injected per invocation via `--append-system-prompt` flag
  - Tool restrictions via `--allowedTools` / `--disallowedTools` at runtime
  - Parse JSON response via `--output-format json`
  - Zero marginal cost. Stable model quality (Sonnet/Opus). No API billing surprises.

- **Primary brain model:** Claude Sonnet (fast synthesis) or Opus (complex reasoning) depending on task. [Doc 601, 644]
  - ZOE concierge: Sonnet (fast) for chitchat, Opus for hard recall
  - Hermes coder: Opus (quality critical on fixes)
  - ZAOstock team bot: Sonnet
  - Magnetiq bot: Sonnet (fast synthesis, Zaal/Tyler dual research)
  - AttaBotty bot: Sonnet/Opus (Opus for /stream-review if budget allows)

- **Secondary brain (low-stakes only):** Ollama llama3.1:8b on VPS port :11434. [Doc 601, project_ollama_local_llm]
  - Wrapper: `bot/src/zoe/ollama.ts` (ollamaChat, ollamaClassify, ollamaHealth)
  - USE FOR: inbox classification, Bonfire entity-class first-pass, audit subagent fact-check
  - NEVER FOR: brand outputs, concierge replies, research sourcing, anything public
  - Cold start ~11s (model load), warm 3-4s per call

### DECOMMISSIONED (do NOT reincarnate)

- openclaw container + 7-agent squad (ZOEY, BUILDER, SCOUT, WALLET, FISHBOWLZ, CASTER). Workspace nuked 2026-05-05. [Doc 601]
- Composio AO orchestrator (paused indefinitely). [Doc 601]
- ZOE v2 redesign + Agent Zero migration plan (skip, Bonfire eats ZOE's role). [Doc 601]
- 10-bot branded fleet (features fold into ZOE memory blocks). [Doc 601]
- Hermes Telegram identity (proposed doc 599, rejected in 601 - Hermes runs from PR webhooks only). [Doc 599, 601]

### Open questions

- None. Framework pattern is locked.

---

## 2. Surfaces + identity (how many bots, naming)

### LOCKED decisions

**Five operating surfaces (post-doc-601 collapse from 12+ systems):**

| Surface | Username | Purpose | Users | Model | Deployment |
|---------|----------|---------|-------|-------|------------|
| **ZOE** | @zaoclaw_bot | Concierge: tasks, captures, brief/reflect, recall, research | Zaal + team | Sonnet/Opus | bot/src/zoe/ on VPS, systemd zoe-bot.service |
| **Hermes** | @zoe_hermes_bot | Autonomous fix-PR pipeline: coder + critic + auto-PR | DevOps | Opus | bot/src/hermes/ on VPS, GitHub PR webhooks |
| **ZAO Devz** | @zaodevz_bot | Group dispatch + hourly learning tip (Phase 3: fold into Hermes) | Engineers | Sonnet/Haiku | bot/src/devz/ on VPS, systemd service |
| **Bonfire** | @zabal_bonfire | Knowledge graph recall + multi-corpus ingest | Members | Claude | bonfires.ai Genesis tier (external SaaS, wallet-gated) |
| **ZAOstock bot** | @ZAOstockTeamBot | Festival team coordination (graduating own repo this week) | Team | Sonnet | bot/ (root) on VPS, graduating to separate repo |

**Future approved bots (both doc 640/642, both Hermes pattern, dual-user research):**
- Magnetiq bot (@zaom_bot or similar) - Zaal + Tyler collab, research assistant for ZAO-Magnetiq integration. [Doc 640, 644]
- AttaBotty bot (Z + AttaBotty) - Zaal + William collab, stream production + VOD review + task tracking. [Doc 642, 644]

**Brand-assistant slash commands live in bots, not separate bots:** `/firefly`, `/youtube`, `/cast`, `/thread`, `/onepager` (ZOE). `/announcement`, `/standup-recap` (ZAOstock). Each reads voice from per-bot `brand.md` file, not new bot tokens. [Doc 607, 644]

**Rule:** No new bots without numbered research doc + explicit Zaal approval. [Doc 601, 644]

### DECOMMISSIONED

- FISHBOWLZ (paused 2026-04-16, replaced by Juke partnership). [Doc 600, 601]
- 10-bot branded fleet dream (never built, features fold into ZOE memory blocks). [Doc 601]
- Hermes Telegram interface (proposed, rejected - Hermes triggered by webhooks only). [Doc 599, 601]

### Open questions

1. **Magnetiq bot:** Should it auto-summarize chat after N messages? [Doc 644 §"Unresolved Questions"]
   - Option A: summarize auto every 50 messages or 1hr silence
   - Option B: only on /context command
   - Option C: smart mode (detect topic shift)

2. **AttaBotty bot:** Where to store VOD review notes + clip suggestions? [Doc 644 §"Unresolved Questions"]
   - Option A: Supabase table (queryable, audit trail)
   - Option B: Google Doc (shareable, native to AttaBotty flow)
   - Option C: Both (Supabase source, auto-export to Google Doc)

3. **Future bot registry:** Should there be a single source of truth (API/table/docs) listing all active bots + their group IDs + allowed users + health status? [Doc 644 §"Unresolved Questions"]
   - Affects VPS monitoring, /admin dashboard, bot discovery patterns
   - Decision needed before bot 3+

---

## 3. Deployment (VPS, systemd, processes)

### LOCKED decisions

- **Only one VPS:** Hostinger KVM 2 at 31.97.148.88 (31GB RAM, 8 cores, 2 vCPU). [Doc 601, project_no_vps2]
  - All agents run here. No second box. Upgrade VPS 1 or use Vercel/Cloudflare if underutilized.

- **Code deployment:** rsync from local to VPS, never git-clone on server. [Doc 607, 644]
  - Env vars stay local, never pushed
  - `rsync -av --delete --exclude=node_modules --exclude=.env bot/src/<bot>/ zaal@31.97.148.88:~/<bot-name>-bot/`

- **Service management:** systemd user units at `~/.config/systemd/user/<bot>.service` [Doc 601, 607, 644, project_zaostock_bot_live]
  - Per-bot unit files. systemd restart-on-failure.
  - Enable: `systemctl --user enable <bot>.service`
  - Start: `systemctl --user start <bot>.service`
  - Check: `journalctl --user -u <bot>.service -n 15 --no-pager`

- **Bot tokens + secrets:** `~/<bot-name>/.env` (chmod 600, never committed, never pushed) [Doc 601, 607, 644]
  - Or `bot/.env` at repo root for shared bots (ZAOstock). Provisioned via `bot/scripts/sync-supabase-env.sh`

- **Secrets hygiene (strict):** Apply all 5 guards from `.claude/rules/secret-hygiene.md` on any agent commit. [Doc 601, project_hermes_canonical]
  - Guard 1: Stub keys on disk, real keys at execution only
  - Guard 2: Pre-commit staged-diff scan (no PRIVATE_KEY, no 64-char hex)
  - Guard 3: Post-edit scan of HEAD
  - Guard 4: Pre-complete repo scan
  - Guard 5: Prompt-level enforcement (never reproduce secrets in output)

### DECOMMISSIONED

- Docker/OpenClaw container runtime (deleted 2026-05-05). [Doc 601, project_hermes_canonical]
- Any VPS 2 / second box proposals. [project_no_vps2]

### Open questions

- None. Deployment is locked.

---

## 4. Auth (Max plan vs API key, secret hygiene)

### LOCKED decisions

- **Auth mechanism:** Claude Code Max plan OAuth via `~/.claude/auth.json`, NOT direct Anthropic API key. [Doc 601, 644, project_hermes_canonical]
  - One-time: `claude /login` on local machine (saves OAuth token to `~/.claude/auth.json`)
  - Subprocess inherits auth, no key sprawl, no billing surprises
  - Hermes pattern: `callClaudeCli()` reads max plan config, no env var exposure

- **Cost routing (Sprint 1 live):** [Doc 601, 644]
  - Cheap/fast tasks: Sonnet
  - Complex reasoning: Opus
  - Low-stakes: Ollama llama3.1:8b local
  - This reduces spend without degrading quality on high-stakes work

- **Bonfire SDK access:** Waiting on Joshua.eth to provision `BONFIRE_API_KEY`, `BONFIRE_ID`, `BONFIRE_AGENT_ID`. [Doc 600, 607]
  - Until then: Zaal acts as human bridge for non-trivial queries
  - Future: Bonfire MCP server in `.mcp.json` for Claude Code direct access

- **Telegram token per bot:** Own token per Telegram bot identity (@zaoclaw_bot, @ZAOstockTeamBot, @zaom_bot, etc.) [Doc 607, 644]
  - Allows independent auth + scoping per bot
  - Token leak = only that surface compromised, not all bots

### DECOMMISSIONED

- ANTHROPIC_API_KEY env var for agent auth (Max plan OAuth only). [Doc 601]
- Direct Minimax API calls (M2.7 was quality wall). [Doc 601]
- Composio AO API key infrastructure. [Doc 601]

### Open questions

- Bonfire SDK timeline: when does Joshua.eth provision the key + namespace API? [Doc 600, 607]
- Should agent tokens be rotated on a cadence (e.g., quarterly)? [Not yet decided]

---

## 5. Memory + retrieval (Supabase tables, context window, fact extraction)

### LOCKED decisions

- **Bonfire as the substrate:** All agents read from + write to Bonfire (ZABAL bonfire, bonfires.ai Genesis tier, wallet-gated). [Doc 600, 601, 607]
  - **Tiers:** PUBLIC (ecosystem), ZAOSTOCK_TEAM (festival team), ZAAL_PRIVATE (Zaal solo) [Doc 607]
  - **Promotion rule:** facts default to most-restrictive tier writer can use. ZOE captures default ZAAL_PRIVATE. ZAOstock bot defaults ZAOSTOCK_TEAM. Promotion to PUBLIC requires explicit user gesture (Zaal tap or team vote). [Doc 607]
  - **No demotion:** Once PUBLIC, stays public. Retraction adds `superseded_by` edge but keeps original for audit. [Doc 607]

- **ZOE memory blocks (Letta-style):** Persistent disk blocks for concierge context [Doc 601, 607, 644]
  - Recent decisions, open tasks, personality traits, team roster snippets
  - Reads Bonfire on demand via DM relay (or SDK once Joshua.eth provisions)

- **Hermes memory:** git commit history + PR state (immutable audit trail) [Doc 601, 607]

- **Per-bot memory tables (Supabase):** Each team bot (Magnetiq, AttaBotty, ZAOstock) gets bot-specific tables [Doc 644]
  - `<bot>_chat_history` - rolling Supabase-backed chat log (or JSON backup minimum)
  - `<bot>_ideas` - captured ideas
  - `<bot>_tasks` - shared task list
  - Logging: every action logged (who, what, when) for audit trail

- **Bonfire quarterly backup:** OWL/RDF export to `research/agents/bonfire-backups/<YYYY>-<Q>.rdf` [Doc 600, 607]
  - If Bonfire trial expires or Joshua.eth partnership ends, migration to LightRAG self-host (doc 568) is 1-2 days

- **Fact extraction from docs:** Research PRs merged auto-ingest to Bonfire PUBLIC (cron job planned, doc 570) [Doc 607]
  - Farcaster casts on Zaal's account: auto-snapshot PUBLIC (pending Neynar pull, doc 570)
  - /firefly posts once Zaal taps "posted": auto-snapshot PUBLIC [Doc 607]

### DECOMMISSIONED

- ZOE's local sqlite for embeddings (never used, was part of openclaw). [Doc 601]
- Bot-to-bot graph sharing (pre-SDK, impossible with openclaw tooling). [Doc 600, 601]
- Quarterly bridge transcript export (bridge group is passive ingest only). [Doc 601]

### Open questions

1. **Context window strategy:** How much Bonfire context to load into ZOE's memory blocks on startup? [Fuzzy - "as needed" via DM relay until SDK]
2. **Fact-check frequency:** How often to scan captured facts for stale/contradictory data? [Not yet decided - quarterly review likely]
3. **Private KG visibility:** Should Zaal be able to promote ZAAL_PRIVATE facts to ZAOSTOCK_TEAM tier? [Likely yes, but not yet locked]

---

## 6. Orchestration (single-agent vs multi-agent, narrator pairs, dispatch)

### LOCKED decisions

- **Zaal is the orchestrator.** Specialists are tools. No autonomous cross-bot coordination yet. [Doc 600, 601, 607]
  - ZOE receives Zaal's @zaostock, @bonfire, @hermes prefixes and relays to other bots in-process [Doc 607]
  - ZAOstock bot + Bonfire bot stay independent for their direct users (team members, ecosystem)
  - Hermes triggered only by /SHIP FIX or PR webhook, not interactive Telegram dispatch

- **Dispatcher pattern (ZOE as single entry point):** From ZOE DM, Zaal can prefix messages: [Doc 607]
  - `(none)` - normal ZOE concierge turn
  - `@zaostock <cmd>` - relay to ZAOstock bot in-process, reply inline back to ZOE DM
  - `@bonfire <query>` - ZOE calls Bonfire SDK (or DM relay until SDK arrives), returns synthesized answer
  - `@hermes <task>` - ZOE relays to Hermes, returns PR link
  - Implementation: regex `/^@(zaostock|bonfire|hermes)\s+(.+)/` in `bot/src/zoe/index.ts` message handler [Doc 607]

- **Bridge group passive ingest only:** Chat_id -5111907600 exists. Zaal posts decisions there, bot ingests. No autonomous bot-to-bot messaging (tried 2026-05-03, openclaw tooling not ready). Defer until Bonfire SDK ships. [Doc 600, 601, 607]

- **Multi-surface capture flow:** [Doc 607]
  - Granola meeting transcript -> ZAOSTOCK_TEAM if team standup, else ZAAL_PRIVATE
  - Telegram voice DM to ZOE -> ZAAL_PRIVATE (tap-to-promote in 9pm reflection)
  - Telegram message to ZAOstock chat -> ZAOSTOCK_TEAM (auto-ingested by bot)
  - Limitless Pendant ambient capture (Phase 2, doc 606) -> ZAAL_PRIVATE (tap-to-promote)
  - Research doc PR merged -> PUBLIC (auto-ingest cron)
  - Farcaster cast on Zaal account -> PUBLIC snapshot (auto-ingest)
  - /firefly output once posted -> PUBLIC (auto-snapshot after Zaal taps "posted")
  - ZAOstock budget update -> ZAOSTOCK_TEAM (locked to team unless Cassie + Zaal co-sign promote)

- **Failure isolation:** Each bot independent systemd unit. Bonfire down = ZOE/ZAOstock recall returns nothing, but drafting works from local memory blocks. ZOE crash = ZAOstock bot + Bonfire bot unaffected. [Doc 607]

### DECOMMISSIONED

- Bot-to-bot autonomous coordination via bridge group (waiting for SDK + MCP server). [Doc 600, 601, 607]
- Hermes Telegram identity / interactive bridge dispatch. [Doc 599, 601]
- Cross-bot narrative pairs (e.g., "BUILDER + SCOUT agents" model from openclaw). [Doc 601]

### Open questions

1. **ZOE dispatcher optimization:** Should relays be cached or always fresh per-call? [Locked: always fresh, no caching]
2. **Tier leak risk:** How to unit-test that ZAAL_PRIVATE facts never leak in public Bonfire-bot answers? [Bonfire SDK should enforce - add test once SDK lands]
3. **ZAOstock spinout:** When ZAOstock graduates, how to verify it still shares the same BONFIRE_BONFIRE_ID? [Add to spinout checklist, doc 607]

---

## 7. Safety + cost (allowlists, kill switches, budget caps, disallowed tools)

### LOCKED decisions

- **Per-bot allowlists (hardcoded, non-negotiable):** [Doc 644, 607]
  - Group ID allowlist (which Telegram groups bot responds to)
  - User ID allowlist (which Telegram users can invoke commands)
  - Example: ZOE admin commands only to Zaal's Telegram ID (1447437687)
  - Bot ignores all messages outside allowlist scope

- **Command gating:** Admin commands (/broadcast, /link, /archive) only to Zaal's Telegram ID. [Doc 644]

- **Confirmation gates (destructive actions):** [Doc 644]
  - /broadcast <message> -> always ask "Send to [group]? (yes/no)"
  - /archive <data> -> always ask "Archive [X] records? (yes/no)"
  - /promote <fact> -> always ask confirmation before writing to PUBLIC tier

- **Secrets refusal (soul.md rule):** [Doc 644]
  - Never reveal tokens, API keys, passwords in group chat
  - If asked, respond: "I can't share secrets here. Refer to <owner>."
  - soul.md includes this as hard rule, enforced at prompt level

- **No hallucination on facts (soul.md rule):** [Doc 644]
  - If bot doesn't know a team fact, say so and refer to owner
  - "I don't have that info. Ask <owner>."

- **Tool restrictions per bot (via --allowedTools / --disallowedTools):** [Doc 601, 644]
  - ZOE: Read, Bash, Grep (knowledge tasks), NOT Write (prevents accidental edits)
  - Hermes: full tool suite (code-fix requires broad capability)
  - Magnetiq: Read, Bash, Grep (research synthesis)
  - AttaBotty: Read, Bash, Grep (VOD review, research)
  - ZAOstock: Supabase Read, NO Write without confirmation

- **Passive listening mode:** [Doc 644]
  - Bot reads all messages for context (builds memory blocks)
  - Only speaks on /command or @mention
  - Emoji reactions ok if natural, but no unsolicited replies

- **Cost model:** [Doc 600, 601]
  - Anthropic Max plan ~$200/mo (already paid, covers Claude Code + all agent spawns)
  - Bonfire Genesis tier: TBD post-trial (currently free 30-day, waiting on Joshua.eth pricing)
  - VPS Hostinger: ~$30/mo
  - Supabase: within free tier (RLS-backed tables)
  - **Total ~$250-350/mo, well below $500 pivot trigger** [Doc 570]

- **Hermes auto-PR safety:** [Doc 461, 600, 601]
  - 4-layer fix-PR pipeline enforces safety: safe-git-push.sh (timeout-not-found bug fixed), .git pre-push hook, Claude PreToolUse hook, GitHub branch protection on main (enforce_admins=true)
  - Doc 523 audit caught the silent bug, patched 2026-04-25

### DECOMMISSIONED

- OpenClaw extension tool registry (exposed too much, too opaque). [Doc 601]
- Composio AO tool orchestration (paused, decommissioned). [Doc 601]
- Unbounded agent tool access (now strict per-bot allowlists). [Doc 644]

### Open questions

1. **Budget monitoring:** Should there be a real-time spend dashboard (Max plan usage, Bonfire tier cost)? [Not yet decided]
2. **Token rotation cadence:** How often to rotate Telegram bot tokens? [Not yet decided - quarterly likely]
3. **Incident response:** If a bot's token leaks, what's the runbook? [Rotate token, restart bot, update env, confirm via journalctl - needs formalization]

---

## 8. MCP + tools (what tools the brain gets, what's banned)

### LOCKED decisions

- **Tools available to Claude subprocess (Hermes pattern):** [Doc 601, 644, project_hermes_canonical]
  - Per-bot allowlists, example:
    - Bash (safe subset - grep, find, curl, rsync, but NOT rm -rf)
    - Read (local files, research docs)
    - Grep (code search, pattern matching)
    - Write (Hermes PR drafts only, with pre-flight checks)
    - Edit (Hermes PR fixes)
    - Bash (script execution)
  - Restricted at invocation time via `--allowedTools` / `--disallowedTools` flags [Doc 601]

- **Bonfire SDK access (future, waiting on Joshua.eth):** [Doc 600, 607]
  - Once BONFIRE_API_KEY arrives: Claude Code + agents call Bonfire MCP server directly
  - Today: Zaal acts as human bridge (copy-paste RECALL queries from Bonfire DM)

- **Local tools per bot:** [Doc 644]
  - ZOE: bot/src/zoe/ollama.ts wrapper (ollamaChat, ollamaClassify, ollamaHealth) for low-stakes classification
  - Hermes: full codespace (git, github API via CLI, npm, tsc)
  - Magnetiq: research tools (Read, Bash, Grep, curl for API exploration)
  - AttaBotty: VOD/stream tools (NotebookLM transcripts ingestion, YouTube metadata fetch)

- **What's NOT available (explicit bans):** [Doc 644, project_hermes_canonical]
  - dangerouslySetInnerHTML (never in components)
  - console.log (use proper logger, console.error in server routes only)
  - Direct API key credential passing (Max plan OAuth only)
  - Write to .env files (secrets stay in env only)
  - Composite AO plugins (dead - Hermes pattern replaces it)

- **Ollama integration (low-stakes only):** [Doc 601, project_ollama_local_llm]
  - Model: llama3.1:8b (4.9GB on VPS)
  - Wrapper: `bot/src/zoe/ollama.ts` - ollamaChat, ollamaClassify, ollamaHealth
  - Cold start ~11s (model load), warm 3-4s per call
  - USE: inbox classification, Bonfire entity-class first-pass, audit sanity checks
  - NEVER: brand outputs, concierge replies, research sourcing (hallucinates), anything public

### DECOMMISSIONED

- OpenClaw extension registry (60+ plugins, unmaintainable). [Doc 601]
- Composio AO tool orchestration. [Doc 601]
- Direct Minimax API calls. [Doc 601]
- Custom sqlite embeddings (ZOE openclaw). [Doc 601]

### Open questions

1. **Langfuse observability (Phase 1 from doc 605):** Once Langfuse ships, should trace tags include `surface=zoe|zaostock|bonfire` so observability spans all three? [Yes, but waiting on doc 605 Phase 1 completion]
2. **MCP servers beyond Bonfire:** Should agents have access to other MCPs (e.g., GitHub, Slack)? [Not yet decided - Bonfire SDK is priority]
3. **Tool audit cadence:** How often to review allowed tools per bot? [Quarterly likely - not yet locked]

---

## Summary: 3 Most Under-Documented Dimensions

### 1. **Memory + Retrieval (Dimension 5) - Fuzzy**
- Context window strategy for ZOE (how much Bonfire context on startup?) only hinted as "as needed"
- Fact-check frequency (how often to audit for stale/contradictory data?) not yet decided
- Private KG visibility rules (can Zaal promote ZAAL_PRIVATE to ZAOSTOCK_TEAM?) likely yes but not locked
- Bonfire quarterly backup process exists (doc 570 plan) but no runbook written
- **Impact:** As Bonfire grows (1100+ nodes already), ZOE's memory block synthesis could hit quality walls without clear refresh strategy.

### 2. **Orchestration (Dimension 6) - Fuzzy**
- ZOE dispatcher optimization (cache or always-fresh relays?) only now locked as always-fresh in this doc
- Tier leak risk testing (how to unit-test ZAAL_PRIVATE never leaks?) depends on Bonfire SDK design
- ZAOstock spinout verification (confirm same BONFIRE_BONFIRE_ID?) only as checklist item, not automated
- Multi-surface capture flow documented in 607 but no Bonfire schema definitions yet (what fields = PUBLIC vs ZAOSTOCK_TEAM?)
- **Impact:** As bot count grows (Magnetiq + AttaBotty shipping this week), ambiguous tier semantics could cause accidental leaks or missed promotion.

### 3. **Safety + Cost (Dimension 7) - Fuzzy**
- Budget monitoring (real-time spend dashboard?) not yet decided - only cost model estimated
- Token rotation cadence (quarterly? annually?) not yet locked
- Incident response runbook (bot token leak = ?) only sketched, needs formalization
- Three Zaal questions on Magnetiq/AttaBotty (auto-summarize cadence, VOD storage, future bot registry) unanswered in doc 644
- **Impact:** As Magnetiq/AttaBotty bots go live (systemd on VPS 1 this week), unclear rotation/incident policy could leave tokens at risk or tie up Zaal on runbook questions.

---

## Cross-Reference Key

| Dimension | Docs | Memories |
|-----------|------|----------|
| Framework | 601, 644, 483 | project_hermes_canonical, project_ollama_local_llm |
| Surfaces | 601, 607, 640, 642, 644 | (none - new) |
| Deployment | 601, 607, 644 | project_zaostock_bot_live, project_no_vps2 |
| Auth | 601, 644, 600 | project_hermes_canonical |
| Memory | 600, 607, 568, 570 | (none yet) |
| Orchestration | 600, 601, 607, 599 | (none yet) |
| Safety | 461, 600, 601, 644, 623 | (none yet) |
| MCP + tools | 601, 644, 605 | project_hermes_canonical, project_ollama_local_llm |

---

**Document created:** 2026-05-11
**Status:** REFERENCE (not a decision doc - for audit + builder guidance)
**Reviewer:** claude-haiku-4-5 subagent B
**Next validation:** 2026-06-03 (quarterly review per doc 607 §"Next Actions")
