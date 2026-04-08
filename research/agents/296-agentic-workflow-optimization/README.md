# 296 - Agentic Workflow Optimization: Powerful Center + Cheap Edge Operating Model

> **Status:** Research complete
> **Date:** April 7, 2026
> **Goal:** Define the optimal division of labor between Claude Code (Opus 4.6 on laptop) and VPS agents (Minimax M2.7 on OpenClaw), based on empirical testing and industry patterns
> **Builds on:** Docs 227 (agentic workflows), 236 (autonomous operator pattern), 245 (ZOE upgrade), 266 (Mission Control), 267 (OpenClaw skills), 278 (bootcamp gap analysis), 293 (multi-agent tools)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Operating model** | ADOPT "powerful center + cheap edge" -- Claude Code (Opus) handles all reasoning, research, code, and planning. VPS agents (Minimax) handle monitoring, file ops, cron routines, notifications, and data collection |
| **Consolidation** | KEEP 5 agents: ZOE (orchestrator), SCOUT (monitoring), CASTER (content), ROLO (contacts), STOCK (festival). Cut BUILDER, WALLET, ZOEY -- their tasks either belong to Claude Code or ZOE |
| **SCOUT's research role** | DOWNGRADE to data collection only. SCOUT fetches raw data (API calls, scraping, RSS). Claude Code interprets it. SCOUT failed the "what are Farcaster Snaps" test because M2.7 cannot synthesize unfamiliar concepts from web search |
| **Supabase as shared brain** | EXPAND agent_events table to carry structured task payloads both directions. VPS agents write raw data in; Claude Code writes analyzed results back. Dashboard reads both |
| **Task routing rule** | If a task requires reasoning, judgment, synthesis, web research, or code changes, it goes to Claude Code. If it requires repetitive execution, API polling, file moves, scheduled posting, or contact lookups, it goes to a VPS agent |
| **Daily workflow** | Morning: Claude Code pulls overnight agent_events, synthesizes brief. Day: Claude Code does deep work, dispatches routine tasks via Supabase. Evening: agents run crons, collect data, log to agent_events. Night: ZOE consolidation cron |
| **Escalation pattern** | VPS agents MUST escalate to Supabase (not attempt reasoning). If SCOUT encounters something it cannot classify, it writes a raw event with `event_type: "needs_analysis"` and Claude Code picks it up |

---

## 1. The Problem: Tested Head-to-Head

On April 7, 2026, SCOUT (Minimax M2.7) and Claude Code (Opus 4.6) were given the same research task: "What are Farcaster Snaps?"

| Metric | SCOUT (M2.7) | Claude Code (Opus 4.6) |
|--------|-------------|----------------------|
| Found the concept | No | Yes |
| Found the SDK | No | Yes -- Snaps SDK, manifest format, 6 use cases |
| Reasoning quality | Could not synthesize from search results | Full spec reconstruction from multiple sources |
| Web search | DuckDuckGo MCP -- shallow results, no synthesis | WebSearch tool -- deep results with cross-referencing |
| Cost | ~$0.003 | ~$0.15 |
| Time | ~30 seconds | ~45 seconds |

**Conclusion:** M2.7 is 50x cheaper but produces zero value on tasks requiring synthesis, reasoning, or unfamiliar concept exploration. It excels at tasks with clear instructions and known patterns.

---

## 2. The "Powerful Center + Cheap Edge" Pattern

This is an established pattern in multi-agent architecture, documented across LangGraph, CrewAI, and OpenClaw communities.

### How It Works

```
                    POWERFUL CENTER
                    Claude Code (Opus 4.6)
                    - Research & synthesis
                    - Code changes
                    - Complex planning
                    - Analysis & judgment
                    - Web research
                         |
                    [Supabase]
                    agent_events table
                    (shared state bus)
                         |
        +--------+-------+--------+--------+
        |        |       |        |        |
      ZOE     SCOUT   CASTER    ROLO    STOCK
      M2.7    M2.7    M2.7      M2.7    M2.7
      orch.   monitor content   contacts festival
      
                    CHEAP EDGE
                    (VPS, OpenClaw, ~$9/month LLM)
```

### Industry Precedent

The multi-model routing pattern is widely adopted in 2026:

- **Cascading/waterfall pattern:** Attempt cheapest model first, escalate on failure. 60-80% of queries resolve at the cheapest tier, dropping average costs 40-70%
- **OpenClaw native support:** Per-agent model config via `agents.list[].model`. "The researcher uses a cheap model to read and summarize. The coder uses Sonnet with Opus as a thinking fallback"
- **Routing rule of thumb:** "What is the minimal model that can confidently handle this query well?" -- ensuring sufficient quality while avoiding overkill
- **Cost savings:** Routing simple tasks to smaller models reduces token spend by 60-80% on typical workloads with zero quality degradation for those tasks

---

## 3. What Minimax M2.7 Can and Cannot Do

### Benchmarks (from Artificial Analysis, OpenRouter, Kilo blog)

| Benchmark | M2.7 Score | Opus 4.6 Score | Gap |
|-----------|-----------|---------------|-----|
| SWE-bench Verified | 78% | 55% | M2.7 wins (coding) |
| SWE-Pro | 56.2% | ~58% | Close |
| Terminal Bench 2 | 57.0% | N/A | Solid |
| Intelligence Index v4 | 50 | 53 | Behind |
| Skill adherence (2K+ token skills) | 97% | ~99% | Close |
| Speed (tokens/sec) | 45.6 | N/A | Slow for its tier |
| Multimodal | Text only | Text + images | M2.7 lacks vision |

### The Boundary Line

| M2.7 CAN Do (Assign to VPS Agents) | M2.7 CANNOT Do (Assign to Claude Code) |
|------------------------------------|-----------------------------------------|
| Follow structured instructions in SKILL.md | Synthesize unfamiliar concepts from web results |
| Execute API calls with known endpoints | Judge whether information is accurate or relevant |
| File operations (read, write, move, parse) | Complex multi-step reasoning chains |
| Template-based content generation | Original analysis or research |
| Cron-triggered routine tasks | Web research requiring cross-referencing |
| Data collection and formatting | Code architecture decisions |
| Contact database CRUD | Debugging complex bugs |
| Simple classification (known categories) | Open-ended exploration |
| Git operations (commit, push, PR) | Code review requiring judgment |
| Monitoring and alerting on thresholds | Strategic planning |

---

## 4. Agent Role Definitions (Post-Consolidation)

### 5 Agents, Clear Boundaries

| Agent | Model | Role | Does | Does NOT |
|-------|-------|------|------|----------|
| **ZOE** | M2.7 | Orchestrator | Dispatch tasks to other agents, manage TASKS.md, nightly consolidation, Telegram relay, morning brief assembly (from pre-collected data) | Research, code, complex decisions |
| **SCOUT** | M2.7 | Data Collector | Fetch Neynar API data, poll GitHub, check Vercel builds, run RSS blogwatcher, write raw findings to agent_events | Interpret findings, synthesize, form opinions |
| **CASTER** | M2.7 | Content Executor | Post pre-approved drafts to Farcaster (once FID registered), format posts from templates, schedule social content | Write original content, decide what to post |
| **ROLO** | M2.7 | Contact Manager | CRUD on contacts table, match names to handles, surface contacts by category, log meeting notes | Relationship strategy, outreach planning |
| **STOCK** | M2.7 | Festival Ops | Vendor tracking, timeline management, checklist execution, budget math | Vendor negotiation strategy, creative direction |

### 3 Agents Removed

| Agent | Why Removed | Where Work Goes |
|-------|-------------|-----------------|
| **BUILDER** | Coding requires judgment. M2.7 produces buggy code that costs more to fix than writing from scratch | Claude Code handles all code changes |
| **WALLET** | On-chain operations are high-risk. Autonomous agents should not sign transactions without human review | Claude Code + manual wallet ops |
| **ZOEY** | Action agent role overlaps with ZOE dispatch. QA testing requires judgment | ZOE absorbs dispatch, Claude Code does QA |

---

## 5. Supabase as the Shared Brain

### Current Schema

```sql
-- agent_events: the shared state bus
CREATE TABLE agent_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    text NOT NULL,       -- 'scout', 'caster', 'rolo', 'stock', 'zoe', 'claude'
  event_type    text NOT NULL,       -- see taxonomy below
  summary       text,
  payload       jsonb DEFAULT '{}',
  dispatched_by text,                -- who created this event
  chain_id      uuid,                -- for multi-step task chains
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);
```

### Event Type Taxonomy

| Event Type | Written By | Read By | Purpose |
|-----------|-----------|---------|---------|
| `heartbeat` | VPS agents | Dashboard | Agent is alive |
| `task_started` | VPS agents | Dashboard, Claude Code | Agent began work |
| `task_completed` | VPS agents | Dashboard, Claude Code | Agent finished work |
| `task_failed` | VPS agents | Dashboard, Claude Code | Agent hit an error |
| `data_collected` | SCOUT | Claude Code | Raw data for analysis |
| `needs_analysis` | VPS agents | Claude Code | Escalation -- agent cannot handle this |
| `analysis_complete` | Claude Code | VPS agents, Dashboard | Claude Code finished analyzing |
| `content_draft` | Claude Code | CASTER | Approved content ready to post |
| `content_posted` | CASTER | Dashboard | Content published |
| `contact_update` | ROLO | Dashboard | Contact record changed |
| `build_event` | SCOUT | Dashboard | PR, deploy, or CI event |
| `dispatch` | ZOE, Claude Code | Target agent | Task assignment |

### Data Flow

```
VPS Agents → Supabase:
  - Raw API responses (Neynar trending, GitHub PRs, RSS items)
  - Heartbeats and task status
  - Escalation requests (needs_analysis)
  - Content posting confirmations

Claude Code → Supabase:
  - Analyzed briefs (morning brief, research summaries)
  - Approved content drafts (for CASTER to post)
  - Task dispatches (for VPS agents to execute)
  - Analysis results (responding to needs_analysis)

Dashboard (zoe.zaoos.com) → Supabase:
  - Reads all event types for visualization
  - Manual dispatch via DispatchModal component
  - Contact management via RolodexView
```

### Missing: A `task_queue` Table

The current `agent_events` table is an event log, not a task queue. For proper dispatch, add:

```sql
CREATE TABLE task_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    text NOT NULL,
  task_type     text NOT NULL,
  instructions  text NOT NULL,
  status        text DEFAULT 'pending',  -- pending, claimed, running, done, failed
  priority      int DEFAULT 5,           -- 1 = highest
  created_by    text NOT NULL,           -- 'claude', 'zoe', 'manual'
  claimed_at    timestamptz,
  completed_at  timestamptz,
  result        jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_task_queue_agent ON task_queue(agent_name, status);
CREATE INDEX idx_task_queue_priority ON task_queue(priority, created_at) WHERE status = 'pending';
```

This separates "what happened" (agent_events) from "what needs to happen" (task_queue). VPS agents poll task_queue on heartbeat; Claude Code inserts tasks via Supabase API.

---

## 6. The Ideal Daily Workflow

### Morning (8-9am)

```
1. SCOUT cron fires at 6am:
   - Fetches Neynar trending (GET /v2/farcaster/feed/trending)
   - Fetches ZAO member casts (GET /v2/farcaster/feed/user/{fid}/casts)
   - Checks GitHub PRs/issues (gh pr list, gh issue list)
   - Checks Vercel deploy status
   - Writes raw data to agent_events (event_type: data_collected)

2. Zaal opens Claude Code at 8am:
   - /z (quick status) or /morning
   - Claude Code pulls overnight agent_events from Supabase
   - Synthesizes into actionable morning brief:
     "3 PRs merged overnight. SCOUT collected 25 trending casts --
      2 mention ZAO members. No deploy failures. ROLO added 1 contact
      from last night's event."
   - Claude Code flags anything needing attention
```

### Deep Work (9am-5pm)

```
3. Claude Code handles:
   - Code changes, feature development, bug fixes
   - Research tasks (new concepts, architecture decisions)
   - Content creation (newsletter drafts, social posts)
   - PR reviews requiring judgment
   - Writes approved content to Supabase for CASTER

4. Routine dispatches to VPS agents:
   - "SCOUT: poll Neynar for /music channel activity" → task_queue
   - "ROLO: look up all contacts tagged 'venue'" → task_queue
   - "CASTER: post this draft to Farcaster" → task_queue
   - These are mechanical tasks, not judgment calls
```

### Evening (5-8pm)

```
5. SCOUT community voice cron fires at 8pm:
   - Collects member activity data
   - Writes to agent_events

6. ZOE content draft cron at 6pm:
   - Assembles build-in-public options from templates
   - Uses data SCOUT collected + any Claude Code analysis
   - Sends 3 options to Zaal via Telegram

7. Zaal picks content option, CASTER posts it
```

### Night (2am)

```
8. ZOE nightly consolidation:
   - Reads last 7 days of daily notes
   - Deduplicates MEMORY.md
   - Prunes stale items
   - Writes "Next 3 Moves" for tomorrow
   - Cost: ~$0.005 per run on M2.7
```

---

## 7. The Escalation Protocol

When a VPS agent encounters something outside its capability:

```
SCOUT fetches data → encounters unknown concept
  ↓
SCOUT writes to agent_events:
  {
    agent_name: "scout",
    event_type: "needs_analysis",
    summary: "Found mentions of 'Farcaster Snaps' in trending -- unknown concept",
    payload: { raw_casts: [...], search_attempted: true, search_failed: true }
  }
  ↓
Claude Code picks up on next session (or via dashboard notification)
  ↓
Claude Code researches, writes back:
  {
    agent_name: "claude",
    event_type: "analysis_complete",
    summary: "Farcaster Snaps are mini-app extensions...",
    payload: { analysis: "...", action_items: [...] }
  }
```

**Rule: VPS agents never guess.** If they cannot complete a task with high confidence using existing instructions, they escalate. Guessing wastes more money than escalating (bad output requires human correction + redo).

---

## 8. Cost Model

### Monthly Costs (5 Agents, Optimized)

| Component | Cost | Notes |
|-----------|------|-------|
| VPS hosting (Hostinger KVM 2) | $5.99 | Docker, OpenClaw, 5 agents |
| ZOE heartbeat (60min, lightContext) | $1.73 | 24 heartbeats/day |
| SCOUT crons (3x daily) | $0.45 | 6am scan, 8am/8pm voice |
| CASTER posting (~5 posts/week) | $0.10 | Template-based, minimal LLM |
| ROLO queries (~10/day) | $0.30 | Simple DB lookups |
| STOCK (when active) | $0.50 | Festival planning season only |
| ZOE nightly consolidation | $0.15 | 2am cron |
| Ad-hoc conversations | $2-5 | Telegram DMs to ZOE |
| **VPS Total** | **$11-14/month** | |
| Claude Code (Opus, Anthropic subscription) | ~$100-200/month | Via Max/Pro plan, heavy usage |
| **Combined Total** | **$111-214/month** | |

### Cost Per Task Type

| Task | Where | Model | Cost |
|------|-------|-------|------|
| "What are Farcaster Snaps?" | Claude Code | Opus 4.6 | ~$0.15 |
| "Fetch trending casts" | SCOUT | M2.7 | ~$0.003 |
| "Post this draft to Farcaster" | CASTER | M2.7 | ~$0.002 |
| "Find contacts tagged 'venue'" | ROLO | M2.7 | ~$0.002 |
| "Write the music player component" | Claude Code | Opus 4.6 | ~$2-5 |
| "Check if PR #87 passed Vercel" | SCOUT | M2.7 | ~$0.001 |

---

## 9. Reference Implementations

### Open-Source Projects Doing This Pattern

| Project | Architecture | Relevance |
|---------|-------------|-----------|
| **SwarmClaw** (swarmclawai/swarmclaw) | OpenClaw runtimes on VPS with delegation to Claude Code. Heartbeat loops, schedules, fleet management | HIGH -- exactly our pattern |
| **HiClaw** (agentscope-ai/HiClaw) | Multi-agent OS with Matrix rooms. Manager + Workers, human-in-the-loop, Claude Code integration | MEDIUM -- more complex than needed |
| **Ruflo** (ruvnet/ruflo) | Agent orchestration for Claude. Multi-agent swarms with native Claude Code/Codex integration, 313+ MCP tools | MEDIUM -- overkill for 5 agents |
| **openclaw-agents** (shenhao-stu/openclaw-agents) | One-command 9 specialized agents setup, group routing, safe config merge | HIGH -- good config reference |
| **Claw-Empire** (GreenSheep01201/claw-empire) | Virtual company with CEO directives, multi-harness delegation (Claude Code, Codex, Gemini) | LOW -- too much abstraction for our scale |
| **Mission Control v2** (builderz-labs/mission-control) | 31-panel ops dashboard, native OpenClaw support, task Kanban, token tracking | HIGH -- could replace our custom dashboard |

### Confluent's Four Patterns for Event-Driven Multi-Agent Systems

1. **Orchestrator-Worker** -- Central agent dispatches, workers execute (this is ZOE + agents)
2. **Hierarchical Agent** -- Multi-level delegation tree (overkill for 5 agents)
3. **Blackboard** -- Shared state that all agents read/write (this is our Supabase model)
4. **Market-Based** -- Agents bid on tasks (not applicable)

**ZAO uses a hybrid of patterns 1 and 3:** ZOE orchestrates, Supabase is the blackboard.

---

## 10. Comparison: Operating Models

| Model | Description | Pros | Cons | ZAO Fit |
|-------|-------------|------|------|---------|
| **All Claude Code** | No VPS agents. Claude Code does everything on demand | Highest quality, simplest architecture | No autonomous monitoring, no 24/7 presence, no crons | LOW -- loses always-on capability |
| **All VPS (current)** | M2.7 agents handle everything including research | Cheapest, fully autonomous | Research quality is unacceptable (proven by SCOUT test) | LOW -- fails on reasoning tasks |
| **Powerful center + cheap edge** | Claude Code for thinking, VPS for doing | Best quality-to-cost ratio, 24/7 monitoring, human stays in control of judgment calls | Requires Supabase coordination layer | **HIGH -- recommended** |
| **Tiered models on VPS** | Upgrade SCOUT to Sonnet, keep others on M2.7 | Better research quality | $35/month for SCOUT alone (heartbeat cost), still inferior to Opus | MEDIUM -- expensive for marginal gain |
| **Claude Code + scheduled agents** | Claude API scheduled agents instead of VPS | No VPS maintenance | $100-200/month for API, no persistent state between runs | MEDIUM -- loses persistent agent state |

---

## 11. Implementation Checklist

### Week 1: Establish the Pattern

- [ ] Remove BUILDER, WALLET, ZOEY from OpenClaw agent configs
- [ ] Update ZOE's SOUL.md with explicit "do not attempt reasoning" rule
- [ ] Update SCOUT's SOUL.md: "collect data, never interpret it"
- [ ] Add `event_type: "needs_analysis"` escalation protocol to all agent AGENTS.md files
- [ ] Create `task_queue` table in Supabase (schema above)
- [ ] Update zoe.zaoos.com dashboard to show escalation events

### Week 2: Wire the Data Flow

- [ ] Claude Code `/morning` skill reads overnight agent_events from Supabase
- [ ] Claude Code can insert into task_queue via Supabase REST API
- [ ] SCOUT heartbeat checks task_queue for pending scout tasks
- [ ] CASTER heartbeat checks task_queue for content_draft tasks
- [ ] ROLO heartbeat checks task_queue for contact tasks

### Week 3: Optimize

- [ ] Add payload schemas to agent_events (Zod validation on insert)
- [ ] Dashboard shows "Needs Analysis" badge count for Claude Code attention
- [ ] Telegram notifications for needs_analysis events
- [ ] Track cost-per-agent in agent_events payload

---

## ZAO OS File Paths

| File | Purpose |
|------|---------|
| `.claude/skills/vps/SKILL.md` | VPS agent management skill (SSH + Telegram) |
| `.claude/skills/vps/zoe-routines.md` | ZOE's autonomous routines (Farcaster scan, community voice, content) |
| `supabase/migrations/20260406_agent_events.sql` | agent_events table schema |
| `supabase/migrations/20260407_build_events.sql` | build_events table + chain_id addition |
| `src/app/api/admin/agents/status/route.ts` | Agent status API endpoint |
| `/tmp/zoe-dashboard/src/lib/api.ts` | Dashboard Supabase queries (fetchEvents, dispatchAgent, chatZoe) |
| `/tmp/zoe-dashboard/src/lib/config.ts` | Dashboard agent definitions (5 agents post-consolidation) |
| `/tmp/zoe-dashboard/src/components/DispatchModal.tsx` | Manual task dispatch UI |
| `/tmp/zoe-dashboard/src/components/ActivityFeed.tsx` | Agent event timeline |

---

## Sources

### Multi-Model Routing
- [The Multi-Model Routing Pattern: Cut AI Agent Costs by 78%](https://dev.to/askpatrick/the-multi-model-routing-pattern-how-to-cut-ai-agent-costs-by-78-1631)
- [Multi-Model AI Agents: Combining Claude, GPT & Open-Source](https://www.xcapit.com/en/blog/multi-model-ai-agents-workflow)
- [AI Agent Token Cost Optimization with Multi-Model Routing (MindStudio)](https://www.mindstudio.ai/blog/ai-agent-token-cost-optimization-multi-model-routing)
- [The Right Model for the Right Job (Mindra)](https://mindra.co/blog/multi-model-routing-how-to-choose-the-right-llm-for-every-task)
- [2026 Agentic AI Era: Multi-Model Routing](https://www.einpresswire.com/article/903464074/2026-agentic-ai-era-why-multi-model-routing-has-become-a-must-have-not-a-nice-to-have)

### Multi-Agent Architecture
- [Choosing the Right Multi-Agent Architecture (LangChain)](https://blog.langchain.com/choosing-the-right-multi-agent-architecture/)
- [Designing Effective Multi-Agent Architectures (O'Reilly)](https://www.oreilly.com/radar/designing-effective-multi-agent-architectures/)
- [Multi-Agent Architecture Patterns (TrueFoundry)](https://www.truefoundry.com/blog/multi-agent-architecture)
- [Four Design Patterns for Event-Driven Multi-Agent Systems (Confluent)](https://www.confluent.io/blog/event-driven-multi-agent-systems/)
- [Dynamic Multi-Agent Orchestration Learns Task Routing (PromptLayer)](https://blog.promptlayer.com/multi-agent-evolving-orchestration/)

### OpenClaw Multi-Agent
- [OpenClaw Multi-Model Setup: Auto-Route Tasks by Complexity (haimaker.ai)](https://haimaker.ai/blog/multi-agent-workflows-openclaw/)
- [How to Build Multiple AI Agents Using OpenClaw (Medium)](https://medium.com/the-ai-studio/how-to-build-multiple-ai-agents-using-openclaw-0ce7b75db32e)
- [OpenClaw Models CLI](https://docs.openclaw.ai/concepts/models)
- [openclaw-agents: 9 Specialized Agents (GitHub)](https://github.com/shenhao-stu/openclaw-agents)

### Minimax M2.7
- [MiniMax M2.7 Intelligence & Performance Analysis (Artificial Analysis)](https://artificialanalysis.ai/models/minimax-m2-7)
- [We Tested MiniMax M2.7 Against Claude Opus 4.6 (Kilo)](https://blog.kilo.ai/p/we-tested-minimax-m27-against-claude)
- [MiniMax M2.7: Self-Evolving AI Model (MindStudio)](https://www.mindstudio.ai/blog/what-is-minimax-m2-7-self-evolving-ai)
- [MiniMax M2.7 Benchmarks (OpenRouter)](https://openrouter.ai/minimax/minimax-m2.7/benchmarks)

### Reference Implementations
- [SwarmClaw: Autonomous AI Agents with OpenClaw (GitHub)](https://github.com/swarmclawai/swarmclaw)
- [HiClaw: Collaborative Multi-Agent OS (GitHub)](https://github.com/agentscope-ai/HiClaw)
- [Ruflo: Agent Orchestration for Claude (GitHub)](https://github.com/ruvnet/ruflo)
- [Mission Control v2 (Builderz Labs)](https://github.com/builderz-labs/mission-control)
- [Building a C Compiler with Parallel Claudes (Anthropic)](https://www.anthropic.com/engineering/building-c-compiler)

### Supabase Patterns
- [Four Design Patterns for Event-Driven Multi-Agent Systems (Confluent/InfoWorld)](https://www.infoworld.com/article/3808083/a-distributed-state-of-mind-event-driven-multi-agent-systems.html)
- [How to Set Up Event-Driven Architecture with Supabase](https://bootstrapped.app/guide/how-to-set-up-event-driven-architecture-with-supabase)
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)

### ZAO Internal Research
- [Doc 227 - Agentic Workflows 2026](../227-agentic-workflows-2026/)
- [Doc 236 - Autonomous OpenClaw Operator Pattern](../236-autonomous-openclaw-operator-pattern/)
- [Doc 245 - ZOE Upgrade: Autonomous Workflow](../245-zoe-upgrade-autonomous-workflow-2026/)
- [Doc 266 - Mission Control v2](../266-mission-control-v2/)
- [Doc 267 - OpenClaw Skills & Capabilities](../267-openclaw-skills-capabilities/)
- [Doc 278 - Agentic Bootcamp Gap Analysis](../278-agentic-bootcamp-zao-agent-squad/)
- [Doc 293 - Multi-Agent Tools, GitNexus, Prompts](../293-multi-agent-tools-gitnexus-prompts/)
