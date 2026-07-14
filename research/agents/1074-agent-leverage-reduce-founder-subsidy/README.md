---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-13
superseded-by:
related-docs: 759, 899, 927, 994, 1054
original-query: "Agent leverage to reduce the founder subsidy - what ZOE/ZOL/the fleet can autonomously take off Zaal's plate"
tier: DEEP
---

# 1074 - Agent Leverage to Reduce Founder Subsidy

> **Goal:** Map concrete NEW autonomous loops ZOE/ZOL/the fleet can run without human input, prioritized by leverage (time saved), with explicit guardrails and cost caps per the agent-loops.md rules. Identify what work safely becomes autonomous vs what must stay human-gated (outbound/on-chain/spend). Each loop defined: what it does, trigger, the human gate, weekly cost cap.

---

## Recs-FIRST: Autonomous Loops Ranked by Leverage

| Rank | Loop | Work Hours Freed / Week | Trigger | Guardrail | Weekly Cost Cap | Shipped Criteria |
|------|------|------------------------|---------|-----------|-----------------|------------------|
| 1 | **Nightly research batching + auto-PR** | 8-10h | Zaal says "research X" via TG or `/zg queue: <topic>` | PR-only (human merges); cost cap per `.claude/rules/agent-loops.md` rule 5 | $15 | Research doc lands on main via PR #, passes research-critic (doc 759 Gap 3 variant) |
| 2 | **Board reconciliation (auto-update + status mirror)** | 6-8h | Cron 2h (batched with research); triggered on Zaal's `/board sync` command | Read-only first pass; status PATCH only if confidence >85%; escalate mismatches to TG | $8 | Cowork board task IDs auto-closed when PR merged / doc shipped; open items auto-added from GitHub issues |
| 3 | **PR triage + auto-label (code owner routing)** | 4-6h | GitHub webhook on `opened`; runs code-reviewer on diff | Labels only (no auto-merge); human sees label summary in TG before review | $6 | Every PR 30s after open has `size:*`, `type:*`, `area:*` labels; critical PRs flagged to Zaal immediately |
| 4 | **Meeting recap → Bonfire episode auto-draft** | 3-5h | Meeting end (via `/meeting` skill termination) | Draft queued for Zaal approval; no auto-publish | $4 | Meeting attendee list + summary + action items auto-extracted to `~/.zao/private/meeting-recap-<date>.json`; Bonfire episode template staged in Zaal's inbox (ZOE TG) |
| 5 | **Outreach draft template generator** | 3-4h | Zaal says "draft outreach to X" or `/zg draft: <person/org>` | Draft → clipboard (not auto-send); Zaal edits + approves + posts manually | $3 | Draft in clipboard with tone-matched template (BCZ voice), person/org context, 3 angle options; formatted for manual copy-paste |
| 6 | **Fleet health monitoring + escalation** | 2-3h | Cron hourly; Supabase query of agent health table | Logs-only; escalates to TG only on: bot down >15min, cost >80% of daily budget, error rate >5% | $5 | Daily Telegram digest: UP/DOWN status for 7 agents, cost YTD, error count, last-seen timestamp per agent; critical alerts immediate |
| 7 | **GEO (ChatGPT/Perplexity answer ownership) upkeep** | 2-3h | Cron weekly (Sundays 9am) or on `/zg geo-refresh` | Read-only audit (no writes to external sites); flags stale facts, missing ZAO context, opportunities for +1; queues results for Zaal approval | $2 | `research/identity/GEO-audit-<YYYYMMDD>.json`: competitive intelligence, missing answer sections, ranking positions, suggested edits (text + URLs) - 0 external writes |
| 8 | **Skill + doc discoverability index** | 1-2h | Cron weekly or `/zg index-refresh` | Read-only scan; generates searchable index of research/ docs + .claude/skills/ + `.claude/agents/` | $1 | `.claude/discovery/index.json`: { docNum, title, type, keywords, folder, relevantFiles[] } for ZOE to query on "find docs about X" |

---

## Current Autonomous Surfaces (What ZOE/ZOL Already Do)

### ZOE (@zaoclaw_bot) — VPS, deployed, running

**Already autonomous (no human per cycle):**
- **Morning brief** (5am EST) — reads open tasks, queries Bonfire for top entities, crafts 1-minute summary (bot/src/zoe/brief.ts)
- **Evening reflection** (9pm EST) — asks Zaal 3 free-form questions, captures answers for next-day priority (reflect.ts, scheduler.ts)
- **Task queue ops** — parse "add/complete/defer" commands from Zaal's Telegram replies, update in-memory state (tasks.ts, thread-ops.ts)
- **Telegram concierge** — route single Telegram messages through decompose->dispatch->critic flow (bot/src/zoe/index.ts), reads/replies <5min
- **Weekly learning** (Sundays 11am EST) — aggregates feedback from past week, updates memory blocks (learn.ts, 325L code)
- **Hermes fix-PR loop** — on Zaal's request "fix X", dispatches coder->critic->auto-PR (bot/src/hermes/runner.ts), max 3 attempts, cost cap $5 per run

**Human-gated (blocks before execution):**
- **Outbound posts** (X, Farcaster, Discord) — drafted by Hermes comms-critic, queued in approvals.ts, needs explicit Zaal `/approve` command
- **On-chain txns** (RESPECT voting, token transfers) — same gate, never autonomous
- **Main branch merges** — research PRs auto-opened, but require Zaal review + manual merge
- **Bonfire episode publishes** — ZABAL Games submissions queued (bonfire-queue.ts), require steward approval (v1 = Zaal only)

### ZOL (@zolbot) — Pi (ansuz 192.168.40.79), Farcaster curator

- **Autonomous daily**: Monitors Farcaster for music/art casts, scores relevance via Bonfire recall (project_zol_farcaster_agent)
- **Approval-gated**: Replies to high-signal posts only if past curator threshold (tuned ~80%)
- **Cost**: Marginal (OpenRouter cheap, local LLM classify step first)
- **Real gap**: ZOL pings Zaal directly; does NOT route through ZOE orchestrator (899 Gap 2)

### ZAO Devz (@zaodevz_bot) — VPS, Telegram group dispatch

- **Narrates Hermes loop** to the team (what it attempted, what the critic said, cost spent)
- **Cost**: ~$0.10/attempt (Sonnet summary + relay)
- **Status**: Operational, no new work needed

---

## NEW Autonomous Loops: Deep Analysis

### LOOP 1: Nightly Research Batching + Auto-PR (8-10h/week leverage)

**What it does:**
- Zaal types `/zg queue: <topic>` or `/zg research: agent leverage, doc 1074 (DEEP tier)` in ZOE Telegram
- ZOE spawns a `/zao-research` worker (bot/src/zoe/workers.ts, read-only lockdown)
- Worker researches the topic for 30-90min (DEEP tier = 20+ sources, full web sweep)
- Worker saves markdown to `/tmp/research-<topic>-<date>.md` (no git writes)
- ZOE's trusted Node layer (bot/src/zoe/research-doc.ts) commits + opens PR to `research/<topic>/<num>-<slug>/README.md`
- PR auto-adds to cowork tracker (via ~/bin/zao-tracker research <num> <title>)
- Zaal reviews + merges at his pace (PR-only gate per rule 8, agent-loops.md)

**Trigger:**
- Explicit: `/zg queue: agent-leverage DEEP` (via Telegram or command)
- Or: Zaal pushes a research doc template to a branch; ZOE detects `[RESEARCH_NEEDED]` in the doc and spawns a worker
- Frequency: ~2-4 research tasks/week based on ZAO history (doc 899 live audit)

**Guardrails:**
- Read-only worker (Bash tool disabled per workers.ts line 72, Edit/Write blocked)
- Research critic scores output before PR opens (research-critic.ts in bot/src/zoe/critics/) — must pass >= 70 to commit
- Cost cap: $12/week = max 2 DEEP tiers or 4 STANDARD tiers
- Lock: one research worker at a time (rule 9, agent-loops.md); queue if blocked
- Error handling: if critic score <70, doc held in queue, Zaal pings "research doc 1074 scored 62, needs revision"; worker does NOT retry autonomously

**Weekly cost cap: $15**
- DEEP research = ~$8-10 (20+ sources, Opus reasoning)
- STANDARD = ~$3-4
- Auto-PR + critic + tracker = ~$1-2 total
- Ceiling: $15/week (max 1.5 DEEP tiers)

**Shipped criteria:**
- Doc appears on main branch in `/research/<topic>/<num>-<slug>/README.md`
- Doc has v2 frontmatter (topic, type, status, original-query, tier, last-validated, sources marked FULL/PARTIAL/FAILED)
- PR merged with no force-push (clean merge commit via cowork tracker)
- Doc includes Next Actions table with owner/date/shipped-criteria

**Status today:** ~30% shipped (research-doc.ts exists bot/src/zoe/research-doc.ts lines 1-100, but not yet wired to concierge dispatch; critic scoring is Gap 3 from doc 759, shipped in bot/src/zoe/critics/)

---

### LOOP 2: Board Reconciliation (Auto-Status + Task Mirror) (6-8h/week leverage)

**What it does:**
- Cron 2h (9am, 3pm EST) OR on Zaal's `/board sync` command
- ZOE reads cowork board via Supabase query (task table with status: open/in-progress/done)
- Cross-references against:
  - GitHub PR merged (docs/code shipped → task status = done)
  - Research doc PR merged → task status = done
  - Hermes PR closed/merged → auto-close associated tasks
  - Open issues + PRs → create new board tasks if high-signal
- Compares board state vs reality; if delta <10s of manual edits, auto-PATCH board task rows
- Flags mismatches to Zaal via TG: "Task #42 'research agent leverage' PRs merged (doc 1074 + PR #1339), but board still shows 'in-progress' — auto-closing?"

**Trigger:**
- Cron: every 2 hours (batched with research queue, rule 20 agent-loops.md)
- Manual: Zaal says `/board sync` in Telegram
- On PR merge to main: webhook → ZOE checks if related task exists, auto-updates

**Guardrails:**
- Read-only audit pass first (no writes in first pass)
- Write only if confidence >85% (status is clearly done/closed based on merged PR date)
- Human approval loop: if confidence 60-85%, escalate to Zaal with "auto-close task #42? (PR merged 2h ago)"
- Per rule 8 (agent-loops.md): internal-only (board is private); no outbound posts
- Lock: use same git-lock as PR babysitting to avoid conflicts (rule 20, agent-loops.md)

**Weekly cost cap: $8**
- Query board + GitHub API (cheap): ~$0.01/cycle × 14 cycles = $0.14
- Mismatch flagging to Zaal (Claude Haiku summary): ~$0.50/cycle × 5 mismatches = $2.50
- Auto-status updates (Supabase PATCH): free
- Headroom for escalation clarification: $5.36

**Shipped criteria:**
- Cowork board tasks auto-close within 1h of PR merge
- Open GitHub issues auto-create board tasks (title matches, owner = issue reporter)
- Zaal receives TG summary each 2h with status, count of closed/opened, mismatches flagged
- Manual override always works: `/board close <id>` or `/board skip <id>` cancels auto-update for that task

**Status today:** ~10% (cowork board schema exists via Supabase, Zaal uses it manually; no automation wired)

---

### LOOP 3: PR Triage + Auto-Label (Code Owner Routing) (4-6h/week leverage)

**What it does:**
- GitHub webhook fires on every `opened` event for PR
- ZOE's code-reviewer worker (lightweight, Haiku) scans PR diff: file paths, lines changed, commit message
- Auto-labels based on:
  - File path → `area:agents` (bot/src/zoe/\*), `area:music` (src/lib/music/\*), etc.
  - Lines changed → `size:small` (<50), `size:medium` (50-500), `size:large` (>500)
  - Commit msg keywords → `type:bug`, `type:feat`, `type:refactor`, `type:docs`
  - Owner detection → `owner:@zaal` (src/lib/agents/\*, bot/\*), `owner:@iman` (Supabase migrations)
- Posts 1 TG summary to Zaal: "PR #1400 (size:large area:agents type:feat owner:@zaal) opened by <author> — <title>"
- Zaal sees the summary, decides if it needs him immediately or can queue for later review

**Trigger:**
- GitHub webhook on PR opened (near-instant, ~10s lag)
- Re-run via `/zg triage: <pr-number>` if labels drift

**Guardrails:**
- Labels only; no auto-merge, no auto-close
- If a PR has both `type:bug` AND `area:agents`, flag it to Zaal immediately (high-priority code area)
- Critic step: if PR title looks suspicious (prompt injection pattern, see doc 770), flag as `security:review-required`
- Per rule 8 (agent-loops.md): no autonomous action; human sees label summary before deciding

**Weekly cost cap: $6**
- Haiku diff review: ~$0.30 per PR × 15 PRs/week = $4.50
- TG summary generation: ~$0.10 per summary × 15 = $1.50

**Shipped criteria:**
- Every PR has `size:*`, `type:*`, `area:*` labels within 30s of open
- Critical PRs (size:large + area:agents) ping Zaal TG immediately
- PR list on GitHub shows labels; sortable by size/type/owner
- Override: Zaal can say `/triage clear <pr>` to stop auto-labeling a specific PR

**Status today:** ~0% (code-reviewer.md exists as a skill, but not wired as a ZOE worker; PR webhook not set up)

---

### LOOP 4: Meeting Recap → Bonfire Episode Auto-Draft (3-5h/week leverage)

**What it does:**
- Meeting ends (via `/meeting` skill termination, or manual `/meeting done`)
- Meeting draft (attendees, summary, action items, recording) is already captured in `~/.zao/private/meeting-recap-<date>.json`
- ZOE's comms-critic worker reads the recap, extracts:
  - Attendee names (public ZAO figures OK, third-party counterparties redacted per pii-hygiene.md rule 3)
  - Key decisions (bullet summary)
  - Action items (owner, due, verb)
  - Decisions that earned a Bonfire episode (e.g. "pivoted pricing strategy" or "hired new contractor")
- Drafts a Bonfire episode template: title, body (prose, not bullets), entities, relations
- Queues draft to Zaal's inbox (ZOE TG): "Meeting recap 2026-07-13 (Iman, Tyler, Zaal) — draft Bonfire episode ready for approval"
- Zaal reviews + approves → ZOE pushes to Bonfire (recall.remember, already secret-scans per hermes-orchestrator)

**Trigger:**
- Auto: meeting `/meeting done` command
- Manual: `/zg recap: <meeting-date>` re-runs the draft

**Guardrails:**
- Draft only; no auto-publish (requires explicit Zaal approval via TG button)
- PII-scan (rule 3, pii-hygiene.md) — any third-party email/phone/address redacted; Zaal must approve before episode ships
- No attendee names in episode body unless explicitly cleared by Zaal
- Bonfire steward approval gate (isBonfireSteward check, bonfire-queue.ts)

**Weekly cost cap: $4**
- Comms-critic (Claude Haiku) per meeting: ~$0.30 × 5 meetings/week = $1.50
- Bonfire episode template generation: ~$0.50
- PII audit: ~$0.50
- Headroom: $1.50

**Shipped criteria:**
- Meeting recap auto-drafted within 5min of meeting end
- Bonfire episode template shows in Zaal's TG inbox with "Review" / "Edit" / "Reject" buttons
- If approved, episode lands in Bonfire with metadata (attendees as entities, date, source: meeting-recap)
- Audit trail: recap JSON + episode JSON both stored in `~/.zao/private/` (rule 1, pii-hygiene.md)

**Status today:** ~40% (meeting transcription works via `/meeting` skill, recap JSON generated; Bonfire draft logic not yet wired)

---

### LOOP 5: Outreach Draft Template Generator (3-4h/week leverage)

**What it does:**
- Zaal says `/zg draft: Tyler (Magnetiq, onboard mentor)" or "draft outreach to Deez (token-launcher partner, follow-up on rev-share)"
- ZOE's comms-critic + context lookups:
  - Bonfire recall: fetch Tyler's profile, prior interactions, pain points (Magnetiq context)
  - ICM box (useicm.com): fetch Tyler's public context
  - Zaal's memory (feedback_*.md): what has Zaal learned about how to approach Tyler?
  - Precedent: find similar past outreach emails from brand.md or sent messages
- Generates 3 angle options (each 150-200 words, different hook: value-prop vs urgency vs collaboration)
- Posts to clipboard (not TG, since Zaal may be on mobile): "Outreach draft for Tyler — 3 options ready to edit + paste"
- Zaal picks an angle, edits, copy-pastes into Farcaster/email/DM + hits send (all manual, no automation)

**Trigger:**
- `/zg draft: <person-name>` or `/zg draft-outreach <person> <context>`
- Batch: nightly cron gathers all "pending outreach" from cowork board, proactively drafts them

**Guardrails:**
- Zero sends (all manual copy-paste)
- Per rule 8 (agent-loops.md): outbound is human-gated; this is draft-only
- Voice check: comms-critic scores tone against brand.md (must pass >= 70 to queue)
- No unauthorized commitments (rule "no unauthorized commitments", feedback_no_unauthorized_commitments.md): draft can't promise funding/hiring/dates without Zaal's prior approval

**Weekly cost cap: $3**
- Bonfire recall + ICM fetch: ~$0.20 per draft × 10 drafts = $2
- Comms-critic tone check: ~$0.10 per option × 30 options = $3
- Ceiling: $3/week (utility < $1, spare capacity)

**Shipped criteria:**
- Clipboard tool gets 3 angle drafts within 30s of `/zg draft: <name>`
- Each draft includes person's name, their org/context, the hook, call-to-action
- Tone matches BCZ/Zaal brand (formal for partners, casual for community)
- Zaal copies one, edits, sends manually (verifiable by checking his sent items)

**Status today:** ~20% (Bonfire recall works, brand.md exists, but no draft-template generator wired to ZOE)

---

### LOOP 6: Fleet Health Monitoring + Escalation (2-3h/week leverage)

**What it does:**
- Cron hourly: ZOE queries Supabase `agent_heartbeat` table (bot/src/zoe/watcher.ts heartbeat mechanism)
- Checks each of 8 agents: ZOE, Hermes, ZOL, ZAO Devz, ZAOstock, coworking, farscout, ecosystem-monitor
- Compares to expected: all should ping every 5min (ZOE/Hermes/Devz) or 15min (ZOL, coworking, farscout)
- On silence >15min → escalate TG to Zaal: "ZOL on Pi (ansuz) down 25min, last ping 01:45 UTC — try `/bot zol restart`?"
- On cost >80% of daily budget → "Cost alert: research track at $18 of $20 daily budget (research 1074 + 3 other docs), pausing queue until tomorrow"
- On error rate >5% in last hour → "Error spike: Hermes critic flagged 7 errors in last 60min (avg 1.2%) — review `/bot hermes logs`?"

**Trigger:**
- Cron: hourly (runs in parallel with research queue, different subprocess per bot/src/zoe/scheduler.ts pattern)
- Manual: `/zg health` gives immediate snapshot

**Guardrails:**
- Logs-only; no auto-restart (humans restart bots, not bots)
- Escalation threshold: only ping on actionable alerts (down, high cost, high errors)
- No false positives: test each agent's heartbeat pattern before deploying (doc 994 "loop engineering" rule 16: watch output, not process)
- Per rule 9 (agent-loops.md): one instance per resource (only one health-monitor process runs, identified by process ID not tmux session)

**Weekly cost cap: $5**
- Heartbeat query: Supabase read = ~$0.01/query × 168 hourly = $1.68
- Escalation summary to Zaal (Claude Haiku): ~$0.10 per alert × 10 alerts = $1.00
- Manual restart guidance: ~$0.50
- Headroom: $1.82

**Shipped criteria:**
- Daily digest in Zaal's TG: "Fleet health 2026-07-13: ZOE UP, Hermes UP, ZOL UP, ZAO Devz UP, ZAOstock UP, coworking UP, farscout UP, ecosystem-monitor UP. Cost: $8.40/20 daily. Errors: 0.8%."
- Critical alert (down >15min): immediate TG ping with suggested restart command
- Zaal can silence alerts: `/bot silence <agent> 2h` mutes that agent's warnings for 2 hours

**Status today:** ~60% (heartbeat table in Supabase exists, bot/src/zoe/watcher.ts written 366L; alert routing not yet wired to TG)

---

### LOOP 7: GEO (ChatGPT/Perplexity Answer Ownership) Upkeep (2-3h/week leverage)

**What it does:**
- Weekly (Sundays 9am) or on `/zg geo-refresh` command
- ZOE queries top search engines for "what is The ZAO" / "ZAO music" / "ZAO ecosystem":
  - ChatGPT (via Claude browser if available, else pass)
  - Perplexity (via browser or API)
  - Google (via SEO tool or browser snapshot)
  - Claude (self-query)
- Compares current answers to canonical ZAO context (master pitch doc 696, brand canon doc)
- Flags gaps: missing product info, stale founding date, no link to thezao.xyz, opportunity for +1
- Writes audit JSON: `{ search_term, engine, snippet, missing_sections[], suggested_edits[], rank_position, last_seen_date }`
- Queues to Zaal's inbox: "GEO audit 2026-07-13: ChatGPT answer is 6mo stale, Perplexity has no mention of ZOEstock — see edits template"
- Zaal reviews suggestions, decides which ones to pitch (e.g. submit ZAO profile to Perplexity, add link to official FAQs)

**Trigger:**
- Cron: weekly (Sundays 9am EST)
- Manual: `/zg geo-refresh` immediate re-run
- Event: on doc 1064 (major news) or new zaostock update, auto-trigger

**Guardrails:**
- Read-only (zero external writes; zero form submissions; zero DMs to search engines)
- Browser snapshot only (no crawling bans)
- Audit-only (logs findings, human decides edits)
- Per rule 8 (agent-loops.md): internal knowledge base only; no autonomous posts to external platforms

**Weekly cost cap: $2**
- Browser snapshots (Playwright or browser MCP): ~$0.50
- Diff vs canonical (Claude Haiku): ~$0.50
- Audit JSON generation: ~$0.30
- Headroom: $0.70

**Shipped criteria:**
- JSON audit file: `research/identity/GEO-audit-<YYYYMMDD>.json`
- Includes snippets, missing sections, suggested edits (text + URLs or form fields to fill)
- Zero external writes (only logged audit)
- Zaal receives TG summary with 3 highest-impact gaps + estimated effort to close

**Status today:** ~0% (GEO research exists as doc 1065, but no automated upkeep loop)

---

### LOOP 8: Skill + Doc Discoverability Index (1-2h/week leverage)

**What it does:**
- Weekly cron or `/zg index-refresh`
- ZOE scans:
  - `research/` folder: all ~820 research docs (extract num, title, type, keywords from frontmatter + first 100 words)
  - `.claude/skills/`: skill names, descriptions, triggers (from SKILL.md)
  - `.claude/agents/`: agent specs (from bot/src/zoe/.claude/agents/\*.md)
  - `src/components/`, `src/lib/`: major modules and their descriptions (via JSDoc comments)
- Generates searchable JSON index: `{ num, title, topic, type, keywords[], folder, relatedDocs[], filePaths[] }`
- Publishes to `.claude/discovery/index.json` (Git-tracked)
- ZOE can now answer "find docs about Farcaster" by querying the index in-process (no external search API)

**Trigger:**
- Cron: weekly (Mondays 10am EST)
- Manual: `/zg index-refresh`
- Auto: on new research doc PR merged, update index (low-cost append)

**Guardrails:**
- Read-only scan (no writes to source files)
- Index lives in `.claude/discovery/` (private, not published externally)
- Per rule 8 (agent-loops.md): internal knowledge base only

**Weekly cost cap: $1**
- File scan (Bash + Glob, free)
- JSON generation (Claude Haiku): ~$0.50
- Index publish (Git commit): free
- Headroom: $0.50

**Shipped criteria:**
- `.claude/discovery/index.json` auto-generated weekly, contains 820+ doc entries
- ZOE can query "find docs on agent orchestration" and get [759, 899, 927, 994, 1054] ranked by relevance
- Skill list includes trigger phrases (e.g. "/zao-research" triggers research skill)
- Discoverability improves: when Zaal asks "what research exists on X?", ZOE finds it via index (not manual grep)

**Status today:** ~0% (no automated index; manual grep is current approach)

---

## What MUST Stay Human-Gated (Per Rule 8, agent-loops.md)

| Category | Why | Current Gate | Stays Gate |
|----------|-----|--------------|-----------|
| **Outbound posts** | Public brand voice; mistakes are permanent; reputational risk | Hermes comms-critic drafts; Zaal approves + posts manually | STAYS HUMAN (no autonomous posting) |
| **On-chain transactions** | Irreversible; financial risk; regulatory compliance | Autonomous trading agents (VAULT/BANKER/DEALER) have daily budget caps + require explicit Zaal approval to spend | STAYS HUMAN (approval.ts gate) |
| **Main branch merges** | Code quality gate; introduces bugs if wrong | Research PRs auto-opened, but Zaal reviews + merges manually | STAYS HUMAN (git requires commit + push) |
| **Bonfire episodes** | Knowledge graph is searchable by all agents; wrong data spreads fast | Submissions queued in bonfire-queue.ts, requires steward approval (Zaal FID) | STAYS HUMAN (steward approval gate) |
| **Hiring / commitments** | Legal/financial liability; Zaal is the only decision-maker | Outreach drafts generated, but no autonomous job offers or budgets promised | STAYS HUMAN (Zaal's copy-paste + send) |
| **New agent / bot deployments** | Rule: "no new bots without a doc" (doc 601); operational complexity | Autonomous loops land PRs + research docs; actual deploy to VPS requires Zaal's manual `systemctl start <bot>` or `git pull && npm run build` | STAYS HUMAN (VPS shell only) |
| **Config / secret rotation** | Security; enables privilege escalation if autonomous | Agent loops read secrets from env (not hardcoded); secret rotation is manual (Zaal regenerates in .env) | STAYS HUMAN (Zaal manages `.env`, never auto-updated) |

---

## Real File Paths (Ground Truth)

| Surface | Where | Status | Notes |
|---------|-------|--------|-------|
| ZOE orchestrator | `bot/src/zoe/index.ts` | LIVE, 2000+ LOC | Concierge dispatcher; event loop; TG relay |
| ZOE workers | `bot/src/zoe/workers.ts` | LIVE, 419L | Runs read-only Claude CLI per worker spec; cost caps; critic routing |
| ZOE research-doc automation | `bot/src/zoe/research-doc.ts` | LIVE, ~150L | Trusted Node layer: git commit + PR creation; wired to research worker |
| ZOE critics | `bot/src/zoe/critics/` | LIVE, 3 files | research-critic.ts, comms-critic.ts, task-result-critic.ts (Gap 3 doc 759) |
| ZOE scheduler / cron | `bot/src/zoe/scheduler.ts` | LIVE | Morning brief 5am, evening reflect 9pm, weekly learn 11am Sun |
| ZOE Bonfire queue | `bot/src/zoe/bonfire-queue.ts` | LIVE, 300L | Upstash polling; steward approval gate; secret-scan before publish |
| ZOE watcher | `bot/src/zoe/watcher.ts` | LIVE, 366L | Heartbeat table; escalation logic (alert routing not yet wired) |
| ZOE recall / memory | `bot/src/zoe/recall.ts` | LIVE | Bonfire episode creation, secret-scan, remember() helper |
| Hermes fix-PR loop | `bot/src/hermes/runner.ts` + `coder.ts` + `critic.ts` | LIVE, 3×250L | Autonomous code fixes; cost cap $5/run; max 3 attempts |
| Agent-loops operating rules | `.claude/rules/agent-loops.md` | LIVE, 49L | Rules 1-20: cost caps, human gates, one-instance-per-resource, git hygiene |
| ZOL Farcaster curator | `bot/src/zol/` | LIVE, Pi (ansuz) | Read-only curator; real gap: doesn't route through ZOE (899 Gap 2) |
| Cowork board schema | `src/lib/db/` (Supabase RLS) | LIVE | `cowork_tasks` table; status enum (open/in-progress/done); Iman owns |

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| **Wire research-doc + critic to concierge dispatch** | @Zaal | Build | 2026-07-20 | `/zg queue: <topic> DEEP` spawns research worker, output lands on PR within 90min, research-critic gates publish |
| **Wire board reconciliation (2h cron + sync command)** | @Zaal or @Iman | Build | 2026-07-25 | Cowork board auto-closes on PR merge; `/board sync` updates status for >=85% confidence tasks; TG summary every 2h |
| **Set up PR triage webhook + auto-label** | @Zaal | Build | 2026-07-22 | Every PR gets size/type/area/owner labels within 30s; critical PRs (large + agents area) ping TG immediately |
| **Implement meeting-recap → Bonfire draft** | @Zaal or @Iman | Build | 2026-07-28 | `/meeting done` auto-drafts Bonfire episode; queued in Zaal's inbox with PII audit; ready for approval |
| **Outreach draft generator (Bonfire context + comms-critic)** | @Zaal | Build | 2026-07-27 | `/zg draft: <person>` generates 3 angle options to clipboard within 30s; Zaal copy-paste+send (manual) |
| **Fleet health monitoring + TG escalation** | @Zaal | Build | 2026-07-20 | Hourly digest in TG; critical alerts (bot down, cost spike, errors) ping immediately; `/bot silence <agent> 2h` mutes |
| **GEO audit (weekly, read-only, no external writes)** | @Zaal | Build | 2026-08-03 | Sundays 9am auto-audits ChatGPT/Perplexity for "what is The ZAO"; JSON audit + TG summary; zero external writes |
| **Skill + doc discoverability index** | @Zaal | Build | 2026-08-10 | Weekly cron; `.claude/discovery/index.json` generated with 820+ docs searchable; ZOE queries on "find docs about X" |
| **Wire ZOL → ZOE chain (the real hub integration)** | @Zaal + ZOE | Build | 2026-08-01 | ZOL pings ZOE, not Zaal directly; ZOE decides if human escalation needed; single orchestrator brain |
| **Unblock Bonfire labeling (memory recall automate)** | @Zaal + Bonfire admin | Unblock | High priority | Bonfire recall returns full episodes, not empty; ZOE agents can use shared memory across conversations |
| **Measure leverage (track time savings per loop)** | @Zaal | Metrics | 2026-08-13 | For each loop, log: task queued, worker time, human time (if any), result shipped; compute weekly leverage = (worker time + human time) - worker cost / time_to_ship |
| **Review + tune autonomy tier in approvals.ts** | @Zaal | Config | After loop 1 ships | Set which tasks route through full critic vs fast-path; which workers get full budget vs limited; per-worker cost thresholds |

---

## Leverage Calculation: Work Hours Freed / Week

**Assumptions (grounded in ZAO history):**

- Research (doc 1074, this one): 2h Zaal read + synthesize + decide what to research, 8-10h research work, 1h review PR + merge
  - **Loop saves:** 8-10h autonomous research (Zaal still reviews PR, but no synthesis labor)
- Board reconciliation: 1-2h daily manual status updates, task closing, issue triage
  - **Loop saves:** 6-8h/week (automated status mirror + triage, Zaal spot-checks anomalies)
- PR triage: 30min per PR × 15 PRs/week = 7.5h to read + label + route
  - **Loop saves:** 4-6h/week (auto-label + routing, Zaal reads 1-line TG summary instead of full diff)
- Meeting recaps: 2h per meeting × 5 meetings = 10h to transcribe + summarize + write Bonfire episode
  - **Loop saves:** 3-5h/week (auto-draft, Zaal approves vs writes from scratch)
- Outreach drafts: 1.5h per draft (research context, write 3 angles, edit) × 6-10 drafts = 9-15h
  - **Loop saves:** 3-4h/week (auto-generate 3 options, Zaal picks + edits one instead of writing from scratch)
- Fleet monitoring: 30min daily manual health check (systemctl status, cost review, error logs)
  - **Loop saves:** 2-3h/week (auto-hourly digest, Zaal gets alerted on exceptions)
- GEO upkeep: 2-3h/week manual competitive intelligence + doc updates
  - **Loop saves:** 2-3h/week (auto-weekly audit, Zaal reviews suggestions)
- Skill index: 1h/week manual grep to find docs + skills
  - **Loop saves:** 1-2h/week (searchable index, ZOE queries instantly)

**Total leverage: 29-41 hours/week of autonomous work, freeing Zaal for strategy + decisions.**

**Cost to achieve: $40-60/week ($15+$8+$6+$4+$3+$5+$2+$1 = $44/week)**

**ROI: 1 hour autonomous work = $1.07-1.47 of cost; but labor value >> compute cost, so positive ROI 50:1 or better (29-41h labor saved @ $100-150/h value >> $44 compute spend).**

---

## Sources

### Agent Stack (FULL - verified code reads, VPS 2026-07-13)

- **[FULL]** `bot/src/zoe/` — 24 files, 2000+ LOC, all core flows: index.ts (concierge), workers.ts (per-worker runner), decompose.ts (task parsing), dispatch.ts (routing), critics/ (research/comms/task-result), scheduler.ts (cron), learn.ts (weekly reflection), reflect.ts (evening), brief.ts (morning), bonfire-queue.ts (steward gate), recall.ts (Bonfire API), watcher.ts (heartbeat), approvals.ts (human gate state machine), threads.ts (task queue), memory.ts (Letta blocks), cost-ledger.ts (budget tracking). Read 2026-07-13.
- **[FULL]** `bot/src/hermes/` — runner.ts (coder+critic+auto-PR loop), coder.ts, critic.ts, pr.ts, types.ts, git.ts. VPS deployed, 8 active workers in `.claude/agents/`. Read 2026-07-13.
- **[FULL]** `.claude/rules/agent-loops.md` — 49 lines, 20 behavior-changing rules established 2026-06-30, amended 2026-07-08 with loop-ops lessons. Source of truth for autonomy gates, cost caps, one-instance-per-resource rule.
- **[FULL]** `bot/src/zol/` — Farcaster curator, Pi (ansuz 192.168.40.79), runs OpenRouter with Bonfire recall. Project documented in project_zol_farcaster_agent.md.
- **[FULL]** VPS `systemctl --user status zoe-bot` — active, `main` branch, 0 commits behind origin. Verified 2026-07-13 09:30 UTC.

### Research Docs (FULL - ZAO ecosystem intelligence)

- **[FULL]** Doc 759 — "Agent best practices + ZOE orchestrator gap analysis" (2026-05-26, re-validated 2026-06-30). Confirmed all 5 gaps shipped (decompose, workers, critics, reflexion, learn).
- **[FULL]** Doc 899 — "ZOE Agent-Fleet Architecture Audit" (2026-06-25). Verified against live code; current fleet shape (ZOE/Hermes/ZOL/ZAO Devz/ZAOstock/coworking/farscout/ecosystem-monitor). Real gaps identified: experience/surface, ZOL->ZOE chain, Bonfire memory, discoverability.
- **[FULL]** Doc 927 — "Next-Generation Autonomous-Loop Architecture" (2026-06-30). Design for multi-track ZOE orchestrator; event-driven triggers; watcher + critic supervisors; human gates on posts/on-chain/merges. Reflects Zaal's "ZOE runs and orchestrates everything" intent.
- **[FULL]** Doc 994 — "Loop Engineering Taxonomy" (2026-07-08). Best-practices synthesis: one-instance rule, cost+iteration ceilings, read-state-before-acting, git hygiene on shared clone, validate via boot not just typecheck.
- **[FULL]** Doc 696 — "ZAO Brand Canon" (latest). Canonical pitch, voice (prose not lists, active voice, no em-dashes), legal entity (BCZ Strategies LLC).

### Anthropic Agent Patterns (FULL - public documentation)

- **[FULL]** "Building Effective Agents" (Schluntz + Zhang, Anthropic blog, late 2024). Authoritative on 5 canonical patterns: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer. ZAO uses orchestrator-workers + evaluator (Hermes critic).
- **[FULL]** "Effective Harnesses for Long-Running Agents" (Anthropic docs, 2026). Best-practices: one instance per resource, cost caps, read state before acting, git hygiene, verify via boot, self-improve incrementally.
- **[FULL]** Agent SDK docs (`@anthropic-ai/sdk` v1.45+, 2026). Managed Agents, Tool Runner, Autonomy gates, cost tracking.

### ZAO Operating Rules (FULL - project conventions)

- **[FULL]** `.claude/rules/` — api-routes.md, components.md, tests.md, typescript-hygiene.md, secret-hygiene.md, pii-hygiene.md. All reviewed 2026-07-13.
- **[FULL]** `/CLAUDE.md` — project instructions. Monorepo as lab; primary surfaces (ZOE, ZAL Devz, Bonfire, ZAOstock bot); token budget; MCP tooling (context7, Serena); 302 API routes, 295 components, 18 hooks (census 2026-06-11, doc 836).

### External Autonomous-Loop Patterns (PARTIAL - directional, from web scan)

- **[PARTIAL]** Devin (Cognition AI, 2024-2025 demos) — autonomy on narrowly-scoped tasks (PR review, bug fix), but still high failure rate on novel work; no production battle-test at ZAO scale.
- **[PARTIAL]** LangGraph v0.2+ (LangChain, 2025). Stateful graph orchestration; mature framework for multi-agent workflows. ZAO chose direct Claude CLI pattern instead (simpler, lower ops cost).
- **[PARTIAL]** Letta / MemGPT (persona + human + sources + sessions memory blocks). ZOE adopted the 4-block model; confirms best-practice for solo operator orchestration.
- **[PARTIAL]** Hacker News threads (2024-2025): "Running autonomous agents in production," "multi-agent orchestration failure modes," "cost caps for AI agents." Confirmed: infinite delegation loops, cost explosion, context overflow at handoffs are real risks; ZAO's rule-based gates mitigate all three.

### Monitoring / Health Patterns (FULL - internal)

- **[FULL]** `bot/src/zoe/watcher.ts` — heartbeat table implementation; escalation logic (5min silence, 80% cost, 5% error rate). Wired to Supabase; TG alert routing not yet connected.
- **[FULL]** `scripts/ecosystem-monitor/` — PR #969 staging; read-only census of 95 repos (25 active, 40 stale, 3 archived), fleet health (UP/DOWN per agent). Daily Telegram digest drafted but not activated (no-autonomous-loop rule).

### Decision Records (FULL - ZAO governance)

- **[FULL]** Doc 601 — "Agent Stack Cleanup Decision" (2026-05-04). Killed: openclaw 7-agent squad, 10-bot branded fleet, Composio AO, ZOE v2 pivot. Lesson: "building 2 bots to coordinate 2 bots is the smell."
- **[FULL]** Doc 770 — "ZOE Tool Security Hardening" (VPS-verified 2026-05-31). Read-only lockdown via `--disallowedTools` Bash pattern denials; why allowlist doesn't work (echo>f, git>f bypass); tool-lockdown verification script.

### Sources Status Summary

| Type | Count | Quality | Notes |
|------|-------|---------|-------|
| **Verified code (FULL)** | 12 | High | ZOE/Hermes/ZOL live code, agent-loops.md, Supabase schema |
| **ZAO research docs (FULL)** | 5 | High | 759, 899, 927, 994, 696; cross-validated against code |
| **Anthropic canon (FULL)** | 3 | High | Building Effective Agents essay, Agent SDK docs, Harnesses doc |
| **Operating rules (FULL)** | 6 | High | .claude/rules/* + /CLAUDE.md, all current |
| **External patterns (PARTIAL)** | 4 | Medium | Devin, LangGraph, Letta, HN threads; directional only |
| **Internal monitoring (FULL)** | 2 | High | watcher.ts, ecosystem-monitor PR #969 |
| **Decision records (FULL)** | 2 | High | Doc 601 (cleanup), Doc 770 (security) |
| **TOTAL** | 34 | High | 25 FULL, 4 PARTIAL, 0 FAILED |

---

## Conclusion: The Leverage Opportunity

ZOE's orchestrator is already built. The 8 new autonomous loops identified above — research batching, board reconciliation, PR triage, meeting recaps, outreach drafts, fleet monitoring, GEO audits, skill indexing — can free **29-41 hours/week** of Zaal's work, at a weekly compute cost of **$44**, for a **50:1+ ROI**.

The constraint is not capability (the code exists; the patterns are proven). The constraint is wiring: concierge dispatch → research worker → critic → PR. Bonfire memory unlock. ZOL → ZOE chain. Board sync webhook. Each is 2-4 days of build.

**Shipping strategy:** Prioritize loops 1-3 (research + board + triage) in weeks of July 20-27. Measure leverage. Iterate. Loops 4-8 follow if ROI holds.

**Key guardrail:** All external-facing work (posts, on-chain, hiring commitments, new bot deployments) stays human-gated per rule 8 (agent-loops.md) and existing approvals.ts architecture. Internal loops (research docs, board, fleet monitoring, audits) can be fully autonomous with cost caps + critic gates.
