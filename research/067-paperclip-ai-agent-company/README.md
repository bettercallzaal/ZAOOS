# 67 — Paperclip AI: Running ZAO as an AI Agent Company

> **Status:** LIVE — deployed and running
> **Date:** March 18, 2026
> **Goal:** Evaluate Paperclip AI for orchestrating ZAO's AI agents into a structured company, and provide a ZAO-specific startup guide with agent configs

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use Paperclip** | YES — MIT license, TypeScript, PostgreSQL (Supabase-compatible), works with Claude Code. Perfect complement to ZAO's existing stack. |
| **Replace ElizaOS?** | NO — Paperclip is the *orchestration layer* (org chart, budgets, tasks). ElizaOS/Claude are the *agent runtimes*. They stack. |
| **Database** | USE Supabase (ZAO's existing DB) instead of Paperclip's embedded PGlite for production |
| **First agents** | Start with 5: CEO (Strategy), Community Manager, Music Curator, Dev Agent, Content Publisher |
| **Budget** | SET $50/month total cap initially. CEO $15, others $5-10 each. Scale after proving value. |
| **Heartbeat** | 15-min default for CEO/Community. 60-min for Dev/Content. Manual-only for Music Curator. |
| **Governance** | Board = Zaal. All hires, strategy changes, and deployments require board approval. |

---

## What Paperclip Is

**Paperclip** is an open-source control plane for orchestrating AI agents into a structured company. Created by @dotta, MIT license, launched March 2026. 14.2K GitHub stars in first week.

**It is NOT:**
- A chatbot, agent framework, or workflow builder
- A replacement for Claude Code, ElizaOS, or Codex
- An AI model or runtime

**It IS:**
- An org chart for AI agents
- A budget control system
- A task/ticket system with audit trails
- A heartbeat scheduler (agents wake, work, sleep)
- A governance layer (board approves all hires/strategy)

### How It Fits ZAO's Existing Plans

| ZAO Plan (from docs 24, 26, 44) | Paperclip Role |
|----------------------------------|---------------|
| ElizaOS agent on Railway (doc 24) | Paperclip orchestrates WHEN it runs and WHAT it works on |
| Hindsight memory (doc 26) | Memory lives in Hindsight; Paperclip tracks tasks and budget |
| Claude Code dev workflows (doc 44) | Paperclip coordinates multiple Claude Code sessions as "employees" |
| Phase 1-4 agent rollout (doc 24) | Paperclip's org chart grows as phases unlock |

**The stack:** Paperclip (orchestration) → Claude Code / ElizaOS (runtimes) → Hindsight (memory) → Supabase (data)

---

## Tech Stack

| Component | Technology | ZAO Compatibility |
|-----------|-----------|-------------------|
| Language | TypeScript (96.3%) | Same as ZAO OS |
| Runtime | Node.js 20+ | Same as ZAO OS |
| Package manager | pnpm 9.15+ | ZAO uses npm — minor difference |
| API | Express REST (port 3100) | Separate from ZAO's Next.js |
| Frontend | React + Vite | Separate dashboard |
| Database | PostgreSQL (PGlite dev / Postgres 17 prod) | **Supabase compatible** |
| ORM | Drizzle | ZAO uses raw Supabase client — separate |
| Encryption | XSalsa20-Poly1305 | Separate key management |

---

## Core Concepts

### The Heartbeat Cycle (How Agents Work)

Agents don't run 24/7. They wake on a schedule, check for work, do it, and go back to sleep.

**The 9-step cycle:**

```
1. IDENTITY    → Agent checks who it is, its role, budget, chain of command
2. APPROVALS   → Check if any pending approvals need follow-up
3. TASK FETCH  → Get assigned tasks (todo, in_progress, blocked)
4. WORK SELECT → Prioritize: in_progress first, then todo, skip blocked
5. CHECKOUT    → Atomic lock on task (prevents double-work)
6. CONTEXT     → Read full issue history, comments, parent tasks
7. EXECUTE     → Agent uses its tools (Claude Code, scripts, APIs)
8. STATUS      → Update task status (done, blocked, etc.)
9. DELEGATE    → Create subtasks for reports if needed
```

**Schedule options:**
- Every 15 minutes (active agents)
- Every 60 minutes (background agents)
- Manual-only (human-triggered)
- Callback (triggered by approval or task completion)

**Constraints:**
- Max 1 concurrent run per agent
- 5-minute default timeout
- Stuck detection at 10 minutes → auto-timeout

### Budget Controls

| Layer | Type | Behavior |
|-------|------|----------|
| Company monthly | Soft limit | Alerts at 80% and 90% |
| Agent monthly | **Hard limit** | Auto-pauses agent at 100% |

Agents self-report costs via `POST /api/cost-events`. Nightly rollup calculates spend.

### Communication

Agents communicate **only through tasks and comments**. No direct messaging.
- Create subtasks to delegate work downward
- Comment on issues for status updates
- @-mention other agents to trigger their heartbeat

### Governance

- **Board** (human) approves all hires, strategy changes
- Agents can propose hires (`hire_agent` approval)
- All config changes are versioned with rollback
- Agent termination is irreversible (board-only)

---

## ZAO AI Company: The 5 Starting Agents

Based on ZAO's community structure (doc 50), existing agent plans (doc 24), and Paperclip's capabilities:

### Agent 1: ZAO CEO — "Zaal's Digital Twin"

**Role:** Strategic coordination, task delegation, weekly planning

```json
{
  "name": "ZAO CEO",
  "role": "ceo",
  "title": "Chief Executive Officer",
  "reports_to": null,
  "capabilities": "Strategic planning for ZAO community. Breaks company goals into projects. Delegates to Community Manager, Music Curator, Dev Agent, and Content Publisher. Reviews weekly Respect rankings. Monitors ecosystem health across Farcaster /zao channel.",
  "adapter_type": "process",
  "adapter_config": {
    "command": "claude",
    "args": ["-p", "You are ZAO CEO. Your mission: grow the ZAO music community to 200 active members while maintaining quality. You delegate tasks, review progress, and propose strategy changes to the board. Always reference the ZAO Complete Guide (research/50) for context. Never make changes to production code without board approval."],
    "cwd": "/path/to/zaoos"
  },
  "context_mode": "fat",
  "budget_monthly_cents": 1500
}
```

**Heartbeat:** Every 60 minutes
**Budget:** $15/month
**Reports to:** Board (Zaal)

### Agent 2: Community Manager — "The Welcomer"

**Role:** Onboarding, engagement, fractal coordination

```json
{
  "name": "Community Manager",
  "role": "community_manager",
  "title": "Head of Community",
  "reports_to": "ceo_agent_id",
  "capabilities": "Manages ZAO community engagement on Farcaster /zao channel via Neynar API. Welcomes new members via XMTP DMs. Monitors chat for questions and responds. Tracks weekly fractal meeting participation. Reports engagement metrics to CEO. Uses Supabase to check member data.",
  "adapter_type": "process",
  "adapter_config": {
    "command": "claude",
    "args": ["-p", "You are ZAO Community Manager. Monitor /zao Farcaster channel for new members and questions. Welcome newcomers via XMTP. Track engagement. Report to CEO. Never share private keys or sensitive data. Always be welcoming and represent ZAO values: respect, music, community."],
    "cwd": "/path/to/zaoos"
  },
  "context_mode": "thin",
  "budget_monthly_cents": 1000
}
```

**Heartbeat:** Every 15 minutes
**Budget:** $10/month
**Reports to:** CEO

### Agent 3: Music Curator — "The Taste Engine"

**Role:** Music discovery, curation scoring, playlist management

```json
{
  "name": "Music Curator",
  "role": "music_curator",
  "title": "Head of Music",
  "reports_to": "ceo_agent_id",
  "capabilities": "Curates music for ZAO community. Monitors song submissions in /zao channel. Scores tracks for quality using audio features from Spotify/Audius/Sound.xyz APIs. Builds weekly digests. Identifies trending genres. Matches members by taste overlap. Uses ZAO's music integration (src/components/music/, src/app/api/music/).",
  "adapter_type": "process",
  "adapter_config": {
    "command": "claude",
    "args": ["-p", "You are ZAO Music Curator. Your job: find great music, score submissions, create weekly digests, and help members discover new artists. Use the music APIs (Audius, Spotify, SoundCloud, YouTube). Focus on independent artists. Reference research doc 03 for music integration architecture."],
    "cwd": "/path/to/zaoos"
  },
  "context_mode": "thin",
  "budget_monthly_cents": 500
}
```

**Heartbeat:** Manual (triggered for weekly digests) + every 60 minutes during active campaigns
**Budget:** $5/month
**Reports to:** CEO

### Agent 4: Dev Agent — "The Builder"

**Role:** Code maintenance, issue fixing, test writing, PR creation

```json
{
  "name": "Dev Agent",
  "role": "engineer",
  "title": "Lead Engineer",
  "reports_to": "ceo_agent_id",
  "capabilities": "Maintains ZAO OS codebase (Next.js 16, React 19, TypeScript, Supabase, Neynar). Fixes GitHub issues. Writes tests (Vitest). Creates PRs for review. Runs lint and build checks. Uses Claude Code with CLAUDE.md conventions. Never deploys to production without board approval. Always creates branches, never commits to main.",
  "adapter_type": "process",
  "adapter_config": {
    "command": "claude",
    "args": ["-p", "You are ZAO Lead Engineer. Fix assigned GitHub issues, write tests, improve code quality. Follow CLAUDE.md conventions strictly. Always create feature branches. Run npm run lint and npm run build before submitting. Create PRs with clear descriptions. Never touch .env files or security-critical code without board approval."],
    "cwd": "/path/to/zaoos"
  },
  "context_mode": "fat",
  "budget_monthly_cents": 1000
}
```

**Heartbeat:** Every 60 minutes (checks for new issues)
**Budget:** $10/month
**Reports to:** CEO
**Guard:** `npm run lint && npm run build` must pass after every change

### Agent 5: Content Publisher — "The Voice"

**Role:** Cross-platform content, announcements, build-in-public posts

```json
{
  "name": "Content Publisher",
  "role": "content_publisher",
  "title": "Head of Content",
  "reports_to": "ceo_agent_id",
  "capabilities": "Creates and publishes ZAO community content. Writes weekly update posts for Farcaster /zao channel. Drafts announcement casts for new features, governance proposals, and music highlights. Maintains build-in-public narrative. Cross-posts to Paragraph newsletter. All posts require CEO review before publishing.",
  "adapter_type": "process",
  "adapter_config": {
    "command": "claude",
    "args": ["-p", "You are ZAO Content Publisher. Write community updates, feature announcements, and music highlights for the /zao Farcaster channel. Maintain the build-in-public narrative. Always say Farcaster not Warpcast. Mobile-first writing (short paragraphs, clear headers). All content must be reviewed by CEO before publishing."],
    "cwd": "/path/to/zaoos"
  },
  "context_mode": "thin",
  "budget_monthly_cents": 500
}
```

**Heartbeat:** Every 60 minutes
**Budget:** $5/month
**Reports to:** CEO

---

## ZAO AI Company Org Chart

```
┌─────────────────────────────────────┐
│           BOARD (Zaal)              │
│     Approves hires, strategy,       │
│     deployments, budget changes     │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │   ZAO CEO   │
        │  $15/month  │
        │  60min beat │
        └──────┬──────┘
               │
    ┌──────────┼──────────┬──────────┐
    │          │          │          │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│Commun.│ │Music  │ │Dev    │ │Content│
│Manager│ │Curator│ │Agent  │ │Pub.   │
│$10/mo │ │$5/mo  │ │$10/mo │ │$5/mo  │
│15min  │ │manual │ │60min  │ │60min  │
└───────┘ └───────┘ └───────┘ └───────┘
```

**Total monthly budget:** $45/month (well under $50 cap)

---

## Startup Guide: Running ZAO as an AI Company

### Step 1: Install Paperclip (5 minutes)

```bash
# From the ZAO OS project root
npx paperclipai onboard --yes

# OR manual install
git clone https://github.com/paperclipai/paperclip.git ~/paperclip
cd ~/paperclip
pnpm install
pnpm dev
```

Dashboard opens at `http://localhost:3100`

**Requirements:** Node.js 20+, pnpm 9.15+

### Step 2: Create the ZAO Company

In the Paperclip dashboard:
1. Click "Create Company"
2. **Name:** `The ZAO`
3. **Mission:** `Build the premier decentralized music community operating system. Grow from 100 to 200 active members. Ship the /ecosystem page, improve governance, and launch the AI agent experience.`
4. Set monthly budget: `$50.00` (5000 cents)

### Step 3: Set the Company Goal

Create the root goal:
- **Title:** `ZAO OS v2: Community Growth + Partner Ecosystem`
- **Level:** `company`
- **Description:** `Double active membership (100→200), ship partner ecosystem page (MAGNETIQ, SongJam, Empire Builder, Clanker, Incented), improve governance with Incented integration, launch community AI agents for onboarding and music curation.`

### Step 4: Hire the CEO Agent

1. Create agent with the CEO config above
2. Set `ANTHROPIC_API_KEY` in Paperclip secrets
3. Set heartbeat to 60 minutes
4. The CEO will propose hiring the other 4 agents — **approve each one**

### Step 5: Set Up Projects

The CEO should create these projects (or you can manually):

| Project | Lead Agent | Goal |
|---------|-----------|------|
| **Community Growth** | Community Manager | Onboard 100 new members, improve welcome flow |
| **Music Discovery** | Music Curator | Weekly digest, taste matching, 50 curated tracks/month |
| **Code Quality** | Dev Agent | Zero lint errors, 80% test coverage on API routes, ship /ecosystem page |
| **Content & Narrative** | Content Publisher | 4 weekly updates, 1 monthly deep-dive, build-in-public posts |

### Step 6: Create Initial Tasks

**For Community Manager:**
- [ ] Audit current onboarding flow in `src/app/(auth)/` pages
- [ ] Draft welcome message template for new XMTP DMs
- [ ] List top 10 questions asked in /zao channel this month
- [ ] Propose FAQ updates to `src/components/chat/FaqPanel.tsx`

**For Music Curator:**
- [ ] Review current music integration at `src/components/music/`
- [ ] Identify top 10 tracks shared in /zao channel this month
- [ ] Draft first weekly music digest format
- [ ] Research trending genres among ZAO members

**For Dev Agent:**
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run build` and fix all warnings
- [ ] Create `/ecosystem` page with partner cards (doc 65)
- [ ] Add partner URLs to `community.config.ts`
- [ ] Write Vitest tests for `src/app/api/proposals/route.ts`

**For Content Publisher:**
- [ ] Draft weekly update template for /zao channel
- [ ] Write announcement for new partner ecosystem page
- [ ] Create build-in-public post about Paperclip setup
- [ ] Draft governance proposal template using Incented format

### Step 7: Monitor & Iterate

- Check the Paperclip dashboard daily (works on phone)
- Review CEO's weekly strategy summaries
- Approve/reject hire proposals and strategy changes
- Adjust budgets based on actual spend
- Add more agents as needed (Phase 2: Security Auditor, Phase 3: Governance Agent)

---

## Phase 2 Agents (Add After Proving Phase 1)

| Agent | Role | Heartbeat | Budget | Trigger |
|-------|------|-----------|--------|---------|
| **Security Auditor** | OWASP audit of API routes, dependency scanning | Weekly | $5/mo | After Dev Agent ships 5+ PRs |
| **Governance Agent** | Draft proposals, track voting, coordinate fractal meetings | 60 min | $5/mo | After Incented integration ships |
| **Social Matchmaker** | Match members by music taste, suggest connections | Daily | $5/mo | After Music Curator builds taste profiles |
| **Research Agent** | Auto-update research docs, cross-reference codebase changes | Weekly | $5/mo | After 70+ research docs accumulated |

---

## Paperclip vs Alternatives for ZAO

| Feature | Paperclip | CrewAI | AutoGen | LangGraph |
|---------|-----------|--------|---------|-----------|
| **Org chart** | Yes (tree hierarchy) | Flat crew | Flat group | Graph-based |
| **Budget controls** | Yes (per-agent hard limits) | No | No | No |
| **Heartbeat scheduling** | Yes (configurable) | No (continuous) | No (continuous) | No |
| **Governance** | Yes (board approvals) | No | No | No |
| **Agent-agnostic** | Yes (any runtime) | Python-only | Python-only | Python-only |
| **TypeScript** | Yes (96.3%) | No | No | No |
| **PostgreSQL** | Yes (Supabase-compatible) | No | No | No |
| **Open source** | MIT | Apache 2.0 | MIT | MIT |
| **Dashboard** | Yes (React + Vite) | No | No | LangSmith (paid) |

**Paperclip wins for ZAO** because: TypeScript + PostgreSQL (same stack), budget controls (critical for solo founder), governance (Zaal stays in control), agent-agnostic (works with Claude Code and future ElizaOS).

---

## Limitations (V1)

- No plugin framework or third-party SDK yet
- No knowledge base subsystem (use Hindsight separately)
- Single human operator per deployment (fine for ZAO)
- No continuous agent mode (heartbeat-only; ElizaOS fills this gap)
- 5-minute heartbeat timeout may be tight for complex tasks
- ClipMart marketplace not launched yet
- Nightly cost rollups (not real-time budget enforcement at company level)
- No native Farcaster or XMTP integration (agents use ZAO OS's existing APIs)

---

## Deployment Log — March 18, 2026

### What Actually Happened (Build-in-Public)

**9:26 PM** — Created Paperclip company "The ZAO" via onboard wizard at `localhost:3100`

**9:27 PM** — Hit first error: working directory path with spaces (`ZAO OS V1`) broke Paperclip. Fix: created symlink `/Users/zaalpanthaki/Documents/ZAO-OS-V1` → `/Users/zaalpanthaki/Documents/ZAO OS V1`

**9:28 PM** — Accidentally created duplicate agents (Researcher, CEO, CEO 2, CEO 3) while debugging path issue. Terminated all duplicates via Board.

**9:30 PM** — **CEO Main launched successfully.** Adapter: `claude_local` (Claude Code). Working directory: `/Users/zaalpanthaki/Documents/ZAO-OS-V1`. First task: THE-1 "Create your CEO HEARTBEAT.md"

**9:31 PM** — CEO Main checked out THE-1, read persona files (`agents/ceo/AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md`), read CLAUDE.md and superpowers skills.

**9:32 PM** — CEO Main created a document for THE-1. Proposed hiring a **Founding Engineer** agent. Board approved.

**9:33 PM** — **Founding Engineer started.** CEO Main created THE-2: "Ship /ecosystem page with partner cards" and delegated to the Founding Engineer.

### Current Org Chart (Live)

```
         BOARD (Zaal)
              │
        CEO Main (live)
              │
    Founding Engineer (live)
```

### Active Tasks

| ID | Title | Assignee | Status |
|----|-------|----------|--------|
| THE-1 | Create your CEO HEARTBEAT.md | CEO Main | In Progress |
| THE-2 | Ship /ecosystem page with partner cards | Founding Engineer | In Progress |

### Setup Notes for Reproduction

1. **Path with spaces:** Paperclip's working directory validator rejects paths with spaces. Create a symlink: `ln -sfn "/path/with spaces" "/path/without-spaces"`

2. **Agent instruction file:** Paperclip (Claude Code adapter) doesn't have a separate UI field for the instruction file path. Include the path in the **task description** — the agent reads it on first heartbeat.

3. **Duplicate cleanup:** If you accidentally create duplicate agents during setup, click each one → Configuration → Terminate. Termination is irreversible by design.

4. **Adapter test:** Always click "Test now" on the Agent tab before launching. It runs a probe to verify Claude Code can respond.

5. **Dashboard URL:** `http://localhost:3100` — works on phone too for mobile monitoring.

### Files Created for Deployment

```
agents/ceo/
├── AGENTS.md      — ZAO CEO identity, mission, safety constraints, references
├── HEARTBEAT.md   — 9-step execution checklist with ZAO ecosystem check
├── SOUL.md        — Values (respect, music, community, ownership, transparency)
└── TOOLS.md       — Paperclip API, Claude Code tools, ZAO codebase map, skills, partners
```

### What's Different from Research Plan

| Planned (doc 67) | Actual |
|-------------------|--------|
| 5 agents at launch | 2 agents (CEO + Founding Engineer). CEO will hire more as needed. |
| CEO heartbeat: 60 min | On-demand (manual) for initial setup, then scheduled |
| Separate Community Manager | Not yet — CEO handling strategy + delegation |
| $45/month budget | TBD — monitoring first run costs |

### Lessons Learned

1. **Start with 2 agents, not 5.** Let the CEO hire as it identifies needs. The org grows organically.
2. **Path spaces are a trap.** Symlink immediately if your project directory has spaces.
3. **The wizard creates duplicates easily.** Go slow on the Agent tab. One agent at a time.
4. **The CEO is autonomous faster than expected.** Within 3 minutes it oriented, proposed a hire, got approval, delegated work, and the engineer started building. The Paperclip heartbeat model works.
5. **Board approval is the governance lever.** You control everything through approve/reject. The agents can't run away.

---

## Best Practices & Advanced Patterns (from community research)

### Start Small, Expand Incrementally

- **One agent, one workflow, one month of data. Then expand.** We proved this — started with CEO + Founding Engineer, not the planned 5 agents.
- Pick a high-volume, repeatable task where mistakes are recoverable.
- "Do not automate processes you do not understand. If you cannot explain the steps a task requires, an AI agent cannot do it reliably."

### Budget Management (Critical from Day One)

- Set `budgetMonthlyCents` per agent. This is the single most practical feature.
- **80% threshold** triggers soft warning. **100%** auto-pauses and blocks new tasks.
- Typical costs: $200-$2,000/month depending on volume. ZAO started at $50/month cap.
- Review spending weekly via the **Costs** tab in the dashboard.

### Goal Alignment

- Tasks carry full **goal ancestry** so agents see the "why," not just a title.
- All tasks must trace to company mission. Prevents agents drifting into busywork.
- Structure: Company Mission → Project Goals → Specific Tasks.

### Heartbeat Tuning

- Default 15 minutes. Increase for background agents (60 min), decrease for active agents.
- **Known issue (#1241):** Heartbeat scheduler can cause "thundering herd" cascades during gateway recovery with many agents.
- Session state persists across heartbeats via `--resume` flag — agents maintain context.
- Agents merge wakeup triggers if already running (no duplicates).

### Quality Control

- Even in a zero-human company, a human sets strategy, reviews outcomes, makes judgment calls.
- Error propagation risk: when one agent feeds output to another, errors compound. Human checkpoints mitigate this.
- Three-layer QA: API contract testing + Paperclip issue acceptance criteria + unit tests.

### Daily Workflow (~20 min/day)

- **Morning:** Dashboard shows automated status from overnight agent work
- **Mid-day:** Review outputs, approve designs, adjust budgets
- **Afternoon:** Agents continue autonomous work

### Task Release for Stuck Agents

```bash
pnpm paperclipai issue release <issue-id>
```

Reassigns work when an agent stalls. Watch for issue #1245 where stale locks can become permanent.

### CLI Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Paperclip with watch mode |
| `pnpm paperclipai approval list` | View pending approvals |
| `pnpm paperclipai approval approve <id>` | Approve from terminal |
| `pnpm paperclipai issue release <id>` | Unstick a stalled agent |
| `pnpm paperclipai worktree:make <branch>` | Isolated repo per branch |
| `curl localhost:3100/api/health` | Health check |

---

## Built-in Skills (4 core skills)

### 1. `paperclip` — Core Operational Skill

Injected into every agent. Defines the complete heartbeat procedure. Auto-injects env vars: `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_API_URL`, `PAPERCLIP_RUN_ID`, `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

### 2. `para-memory-files` — PARA Memory System

Three-layer file-based memory using Tiago Forte's PARA method:
- **Layer 1 — Knowledge Graph** (`$AGENT_HOME/life/`): Entity-based storage, PARA folders (projects/areas/resources/archives)
- **Layer 2 — Daily Notes** (`$AGENT_HOME/memory/YYYY-MM-DD.md`): Raw timeline, facts extracted to Layer 1 during heartbeats
- **Layer 3 — Tacit Knowledge** (`$AGENT_HOME/MEMORY.md`): User patterns and preferences

**Key principle:** "Memory does not survive session restarts. Files do."

### 3. `paperclip-create-agent` — Hiring Workflow

Governance-aware agent hiring: discover adapter configs, read adapter docs, draft config, submit hire request, handle approval flow.

### 4. `paperclip-create-plugin` — Plugin Scaffolding

Plugin system is in alpha. Categories: connector, workspace, automation, UI. Hot install/uninstall without server restart.

---

## Known Issues & Gotchas (from 319 GitHub issues)

| Issue | Impact | Workaround |
|-------|--------|------------|
| **#1245** Release endpoint fails to clear `execution_run_id` | Permanent stale locks | Manually release via CLI |
| **#1243** Missing `drizzle-orm` dependency after update | Build fails | `pnpm install` again |
| **#1241** Heartbeat thundering herd | Rapid-fire cascades with many agents | Keep agent count < 10 initially |
| **#1227** Agent config page crashes on null markdown | UI crash | Ensure all config fields are non-null |
| **#1211** Migrations don't execute on startup with system Postgres | DB schema missing | Run `pnpm db:migrate` manually |
| **#1193** Embedded PGlite crashes on ARM64 | Shared memory errors on M-series Macs | Use Docker Postgres instead |
| Path spaces break working directory | Agent launch fails | Symlink (as we did) |

---

## Community Resources & Forks

| Resource | URL | Notes |
|----------|-----|-------|
| **Official site** | [paperclip.ing](https://paperclip.ing/) | Docs + download |
| **Tutorial series** | [paperclipai.info](https://www.paperclipai.info/) | 7-day community guide |
| **ClipHub marketplace** | [github.com/paperclipai/clipmart](https://github.com/paperclipai/clipmart) | Company templates (coming soon) |
| **Company templates** | [github.com/paperclipai/companies](https://github.com/paperclipai/companies) | Default CEO + more coming |
| **Discord** | [discord.gg/m4HZY7xNG3](https://discord.gg/m4HZY7xNG3) | Community support |
| **Zeabur deploy** | [zeabur.com/templates/E6H44N](https://zeabur.com/templates/E6H44N) | One-click cloud deployment |
| **Awesome OpenClaw** | [github.com/mergisi/awesome-openclaw-agents](https://github.com/mergisi/awesome-openclaw-agents) | 177 agent templates |
| **Recommended stack** | Community consensus | "Paperclip + OpenClaw + Obsidian" = the super-stack |

---

## Audit Results: CEO Main's First Security Audit (March 18, 2026)

The CEO agent autonomously completed a full security audit of all 51 API routes in 5 minutes. Results:

### Findings Summary

| Severity | Count | Examples |
|----------|-------|---------|
| **HIGH** | 3 | FID ownership bypass (signer/status), admin/users no Zod, PostgREST filter injection (respect/member) |
| **MEDIUM** | 4 | In-memory nonce store (siwe/verify), cross-user cache leak (community-graph), cursor not validated, miniapp webhook no HMAC |
| **LOW** | 8 | Missing Zod across ~12 routes, error masked as 200, env var name in error message |

### Critical Findings

**H1. FID Ownership Bypass** (`src/app/api/auth/signer/status/route.ts:21`)
When `status.fid` is falsy, ownership check is skipped. Any signer_uuid gets saved to session.
**Fix:** Change to `if (!status.fid || status.fid !== sessionData.fid)`

**H2. Admin Users No Zod** (`src/app/api/admin/users/route.ts`)
POST accepts arbitrary unvalidated JSON and inserts to DB. No type/format validation on role, fid, primary_wallet.
**Fix:** Add Zod schemas for POST, PATCH, DELETE.

**H3. PostgREST Filter Injection** (`src/app/api/respect/member/route.ts:53-57`)
Unsanitized wallet param interpolated into `.or()` filter. Attacker can inject PostgREST operators.
**Fix:** Validate wallet as `^0x[a-fA-F0-9]{40}$` regex.

### Positive Findings

- 100% auth coverage across all 51 routes
- Zero env var leaks in any response
- 100% NextResponse.json() usage
- Neynar webhook HMAC properly implemented with `crypto.timingSafeEqual`
- No `dangerouslySetInnerHTML` anywhere
- No regressions from doc 57 audit
- Supabase parameterized queries used consistently

### Fix Priority

1. **Immediate:** H1 (FID bypass), H3 (filter injection)
2. **This sprint:** H2 (admin Zod), M2 (cache leak)
3. **Next sprint:** M1 (nonce store), M3 (cursor), M4 (miniapp webhook)
4. **Backlog:** All LOW findings (Zod consistency)

**This audit was performed entirely by the CEO Main agent via Paperclip — zero human involvement. Task THE-6, completed in one heartbeat cycle.**

---

## Sources

- [Paperclip GitHub](https://github.com/paperclipai/paperclip) — 14.2K stars, MIT license
- [Paperclip AGENTS.md](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md) — heartbeat lifecycle
- [Paperclip SPEC-implementation.md](https://github.com/paperclipai/paperclip/blob/master/doc/SPEC-implementation.md) — full architecture spec
- [Paperclip DATABASE.md](https://github.com/paperclipai/paperclip/blob/master/doc/DATABASE.md) — 17-table schema
- [Paperclip Official Site](https://paperclip.ing/)
- [eWeek: Meet Paperclip](https://www.eweek.com/news/meet-paperclip-openclaw-ai-company-tool/) — launch coverage
- [Flowtivity: Zero-Human Companies](https://flowtivity.ai/blog/zero-human-company-paperclip-ai-agent-orchestration/) — architecture analysis
- [Doc 24 — ZAO AI Agent](../024-zao-ai-agent/) — ElizaOS architecture, 4-phase rollout
- [Doc 26 — Hindsight Agent Memory](../026-hindsight-agent-memory/) — 91.4% accuracy memory system
- [Doc 44 — Agentic Development Workflows](../044-agentic-development-workflows/) — Claude Code as dev partner
- [Doc 46 — OpenFang Agent OS](../046-openfang-agent-os/) — evaluated and rejected (Rust, no Farcaster)
- [Doc 50 — The ZAO Complete Guide](../050-the-zao-complete-guide/) — canonical ecosystem reference
- [Paperclip Product Spec](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md) — company model, design principles
- [Paperclip Full Spec](https://github.com/paperclipai/paperclip/blob/master/doc/SPEC.md) — 13 sections covering all systems
- [Paperclip Plugin Spec](https://github.com/paperclipai/paperclip/blob/master/doc/plugins/PLUGIN_SPEC.md) — alpha plugin system
- [Paperclip CLI Reference](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md) — full command reference
- [Paperclip ClipHub](https://github.com/paperclipai/paperclip/blob/master/doc/CLIPHUB.md) — template marketplace
- [Paperclip Tutorial Series](https://www.paperclipai.info/) — community 7-day guide
- [Apidog: Run a One-Person Company](https://apidog.com/blog/paperclip/) — practical walkthrough
- [Kelvin Kwong: Board of Directors for AI Agents](https://medium.com/@tszhim_tech/i-became-the-board-of-directors-for-a-company-of-ai-agents-daac399426a7) — user experience report
- [dotta on X: Biotech research with Paperclip](https://x.com/dotta/status/2030033794711859387) — non-tech use case
- [Paperclip Discord](https://discord.gg/m4HZY7xNG3) — community support
- [Zeabur Cloud Deploy Template](https://zeabur.com/templates/E6H44N) — one-click deployment
