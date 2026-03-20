# Paperclip AI: Multi-Company Support & Advanced Agent Coordination

**Research Doc 81 — 2026-03-19**
**Purpose:** Evaluate Paperclip's multi-company architecture, agent delegation patterns, and governance workflows for ZAO OS integration.

---

## 1. Multi-Company Architecture

### How It Works

Paperclip treats companies as **first-order objects**. One deployment runs multiple companies with complete data isolation. Every database entity carries a `companyId` foreign key, preventing cross-company data leakage.

Each company maintains independently:
- **Org chart** (hierarchical agent relationships)
- **Agent roster** (all employee agents)
- **Goals & Initiatives** (strategic direction)
- **Budgets** (per-agent monthly caps)
- **Task hierarchy** (all work traces to company goal)
- **Audit log** (append-only, no edits/deletions)

### Data Isolation Mechanism

- All tables reference `companies.id` as a foreign key
- React Query caches include `companyId` to prevent cross-tenant pollution
- UI provides a **company switcher** for operators managing multiple organizations
- Companies operate in three states: `active`, `paused` (heartbeats suspended), `archived` (read-only)

### Budget Isolation

- The Board sets company-level token/LLM cost budgets
- CEO can set budgets for agents below them; every manager can do the same for their reports (cascading delegation)
- Three enforcement tiers: visibility dashboards, soft alerts (80% threshold), hard ceilings (auto-pause at 100%)
- Costs track per-Agent, per-task, per-project, and per-Company
- `CostEvent` records track usage with `billingCode` fields and reference `agentId`, `issueId`, `projectId`, `goalId`

### Switching Between Companies

The UI provides a company switcher component. All views (org chart, task board, dashboard) are company-scoped. Cross-company navigation is handled at the UI layer, not at the data layer.

**Source:** [DeepWiki - Core Concepts](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts), [GitHub](https://github.com/paperclipai/paperclip), [SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md)

---

## 2. Goal --> Project --> Task Hierarchy

### Full 5-Level Structure

```
Company Goal (Mission)
  └── Initiative (quarter-spanning, outcome-measured)
       └── Project (time-bound deliverable, may span teams)
            └── Milestone (grouping within project)
                 └── Issue (atomic unit of work)
                      └── Sub-issue (nested via parentId, can nest further)
```

### Level Details

| Level | Scope | Ownership | Status Model |
|-------|-------|-----------|-------------|
| **Initiative** | Quarter-spanning objectives | Single leader | Outcome-measured, not completion-based |
| **Project** | Time-bound deliverables | May span multiple teams | `backlog`, `planned`, `in_progress`, `completed`, `cancelled` |
| **Milestone** | Grouping within project | Team-scoped | Progress-based |
| **Issue** | Fundamental unit of work | Single assignee (deliberate) | Team-specific workflow states |
| **Sub-issue** | Nested work breakdown | Different assignee allowed | Inherits project from parent at creation |

### Goal Hierarchy Levels

Goals have four defined levels with self-referential `parentId` for arbitrary depth:
- `company` — top-level mission
- `team` — functional objectives
- `agent` — individual objectives
- `task` — specific deliverables

Goal statuses: `planned`, `active`, `achieved`, `cancelled`

### Context Flow (Critical Pattern)

When an agent receives a task, **the full ancestor chain is embedded in the issue payload**:

```
Research task --> Facebook ads task --> signup growth task --> weekly revenue target --> company goal
```

The `ancestors` field on Issue provides the full parent chain, each entry containing its own `projectId`, `goalId`, and `status`. This means **agents always know WHY they are doing the work**, not just what to do.

**Source:** [TASKS.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/TASKS.md), [DeepWiki](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts)

---

## 3. Agent Roles & Configuration

### Nine Defined Roles

| Role | Function |
|------|----------|
| `ceo` | Strategic leadership, breaks down company goal |
| `cto` | Technical direction |
| `cmo` | Marketing direction |
| `cfo` | Financial direction |
| `engineer` | Feature development |
| `designer` | Design work |
| `pm` | Project management |
| `qa` | Quality assurance |
| `devops` | Infrastructure |
| `researcher` | Research tasks |
| `general` | Unspecified role |

### Agent Configuration

Each agent includes:
- **Adapter type + configuration** — controls execution identity (e.g., SOUL.md/HEARTBEAT.md for OpenClaw, CLAUDE.md for Claude Code, CLI args for scripts)
- **Role & hierarchy** — title, reporting chain, direct reports
- **Capabilities description** — clarifies function for inter-agent discovery
- **Budget** — `budgetMonthlyCents` and `spentMonthlyCents`
- **canCreateAgents** — permission to submit hire requests

### Org Chart Structure

- Strict tree: each agent reports to exactly one manager (except CEO)
- Self-referential `reportsTo` field links agents in hierarchy
- Hierarchy shapes delegation, escalation, and ownership

**Source:** [SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md), [DeepWiki](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts)

---

## 4. Agent-to-Agent Communication

### Primary Model: Task-Centric (No Side Channels)

**All agent communication flows through the task system.** There is no separate messaging layer. This is a deliberate architectural decision.

- An agent's "inbox" = tasks assigned to them + comments on tasks they're involved in
- Discussion happens in **task comments**, not a side channel
- Escalation occurs by commenting on the parent task or reassigning
- This creates inherent audit trails linking communication to work context

### Communication Mechanisms

1. **Issue creation/assignment** — Agent A creates an issue and assigns it to Agent B
2. **Comments with threading** — `IssueComment` records with `parentId` for threaded discussions, optional `resolvedAt` flags
3. **Attachments** — Agents exchange files through `IssueAttachment` records (local disk or S3)
4. **Activity logging** — All state changes broadcast via WebSocket to connected clients

### Triggering Agent Wakeups

- **Heartbeat scheduling** — agents wake at configured intervals to check task queues
- **Event-based triggers** — task assignment and @-mentions wake agents outside their schedule
- **Comment-triggered wakeups** — preserve agent session state for continuation work
- **Timer/manual wakeups** — reset sessions for clean starts

### Cross-Team Work Pattern

When Agent A needs work from Agent B (different team):
1. Agent A creates an issue and assigns it to Agent B
2. Agent B either: completes it, marks as blocked, or escalates to their manager
3. Agent B **cannot unilaterally cancel** cross-team tasks
4. Issues carry `requestDepth` integer counting delegation hops for visibility

**Source:** [SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md), [DeepWiki](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts)

---

## 5. Delegation Patterns & Subtask Chains

### Delegation Flow

1. CEO receives company goal, breaks it into strategic initiatives
2. Board approves the CEO's strategic breakdown
3. CEO creates issues assigned to C-suite / department heads
4. Each manager decomposes their issues into sub-issues for their reports
5. Individual contributors execute atomic tasks

### Subtask Chain Pattern

Issues nest via `parentId` with unlimited depth:
```
CEO: "Grow revenue 20%" (Initiative)
  └── CTO: "Ship v2.0 features" (Project)
       └── Engineer A: "Build payment integration" (Issue)
            └── Engineer A: "Set up Stripe SDK" (Sub-issue)
            └── Engineer A: "Write payment tests" (Sub-issue)
```

Key rules:
- Sub-issues inherit `project` from parent at creation (not retroactively)
- Sub-issues do NOT inherit team, labels, or assignee
- When a parent issue completes, remaining sub-issues **auto-complete**
- Single-assignee model: for multi-person work, create sub-issues with different assignees

### Execution Lock Mechanism

When an agent begins work on an issue, it acquires an atomic lock:
- `checkoutRunId`
- `executionRunId`
- `executionAgentNameKey`
- `executionLockedAt`

This prevents simultaneous claims on the same task.

### Request Depth Tracking

Tasks carry a `requestDepth` integer indicating how many delegation hops deep the issue is from the original requester. This provides visibility into organizational work cascades.

### Billing Code Attribution

`billingCode` fields on `CostEvent` records attribute token spend upstream to requesting tasks/agents, enabling cost tracking across teams even when work crosses organizational boundaries.

**Source:** [SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md), [TASKS.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/TASKS.md)

---

## 6. Approval Workflows & Governance

### V1 Approval Gates

Two primary approval types:

| Type | Trigger | Flow |
|------|---------|------|
| `hire_agent` | Agent with `canCreateAgents: true` submits hire request | Board reviews and approves/rejects |
| `approve_ceo_strategy` | CEO submits strategic breakdown document | Board ratifies before execution begins |

### Approval State Machine

```
pending --> revision_requested --> pending (resubmitted)
pending --> approved (action proceeds)
pending --> rejected (action denied)
pending --> cancelled (withdrawn)
```

### Approval Details

- Approvals include arbitrary JSON `payload` for request details
- `decisionNote` field captures reasoning for the decision
- `ApprovalComment` records enable back-and-forth dialogue before final decisions
- Approval-level comment threads are distinct from issue comments

### Board Powers (Human Operators)

The Board has unrestricted system access:
- Set and modify budgets at any level
- Pause/unpause any agent
- Pause/unpause any task
- Full project management capabilities
- Override any agent decision
- Approve/reject hires and strategies
- Manual budget adjustments

### Escalation Through Chain of Command

Manager escalation protocol (three options):
1. **Decide task worth** — determine if the work should continue
2. **Delegate to subordinates** — break down and assign downward
3. **Escalate upward** — pass to their own manager

Managers must understand WHY subordinates are blocked and resolve it. Agents cannot unilaterally cancel tasks assigned from outside their team.

**Source:** [SPEC.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md), [PRODUCT.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/PRODUCT.md), [DeepWiki](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts)

---

## 7. Issue Dependencies & Blocking

Four relation types enable coordination workflows:

| Type | Behavior |
|------|----------|
| `related` | Informational link only |
| `blocks` / `blocked_by` | Prevents work start until resolved |
| `duplicate` | Auto-moves duplicate to Cancelled state |

When a blocking issue is resolved, the relation becomes informational (visual flag turns green).

### Workflow States (Team-Specific)

Six fixed categories with auto-timestamps:

| Category | Examples | Auto-Trigger |
|----------|----------|-------------|
| **Triage** | Triage | — |
| **Backlog** | Backlog, Icebox | — |
| **Unstarted** | Todo, Ready | — |
| **Started** | In Progress, In Review, In QA | Sets `startedAt` |
| **Completed** | Done, Shipped | Sets `completedAt` |
| **Cancelled** | Cancelled, Won't Fix, Duplicate | Sets `cancelledAt` |

**Source:** [TASKS.md](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/TASKS.md)

---

## 8. ZAO Application: Dev Company + Content Company Structure

Based on Paperclip's multi-company architecture, here is how ZAO could structure two companies under one deployment:

### Company 1: ZAO Dev (Engineering)

```
Goal: "Ship and maintain ZAO OS as the premier gated Farcaster client"

CEO Agent (Strategic)
  ├── CTO Agent
  │    ├── Engineer: Frontend (Next.js/React)
  │    ├── Engineer: Backend (Supabase/APIs)
  │    ├── Engineer: Blockchain (Respect/Optimism)
  │    └── QA Agent
  └── PM Agent (Roadmap/Sprint planning)
```

- Budget: Covers Claude Code API costs, CI/CD tool calls
- Initiatives: Feature sprints, security fixes, governance module
- Approval gates: New agent hires, major architecture changes

### Company 2: ZAO Content (Marketing & Community)

```
Goal: "Grow ZAO community to 500 active members and establish brand"

CEO Agent (Content Strategy)
  ├── CMO Agent
  │    ├── Content Writer: Farcaster posts / build-in-public threads
  │    ├── Researcher: Music industry / web3 trends
  │    └── Community Manager: Engagement tracking
  └── Designer Agent (Visual assets)
```

- Budget: Separate LLM costs for content generation
- Initiatives: Weekly content calendar, research docs, community growth
- Approval gates: Content strategy, new agent hires

### Cross-Company Coordination Pattern

Since companies are fully isolated, cross-company work requires human (Board) coordination:

1. Content company identifies need for a feature (e.g., "we need a content publishing tool")
2. Board creates corresponding initiative in Dev company
3. Dev company decomposes into engineering tasks
4. Board tracks alignment across both companies

This mirrors how real organizations with separate P&Ls coordinate — through executive/board-level alignment rather than direct cross-company agent communication.

### Alternative: Single Company with Teams

Paperclip also supports a single company with team-based isolation:

```
ZAO Company (Single)
  CEO Agent
  ├── CTO (Engineering Team)
  │    ├── Engineers...
  │    └── QA...
  └── CMO (Content Team)
       ├── Writers...
       └── Researchers...
```

This allows direct cross-team delegation (CTO can assign issues to content team members) while maintaining single-company governance. This may be simpler for ZAO's current scale.

---

## 9. Key Takeaways for ZAO OS

1. **Multi-company is real isolation** — separate budgets, orgs, audit trails. Best for truly independent business units.
2. **Single company with teams** may be more practical for ZAO initially, allowing cross-team delegation without Board mediation.
3. **Task-centric communication** means no separate chat/messaging between agents — everything is traceable through issues.
4. **Ancestor chains** give every agent full context about WHY they are working, which aligns with ZAO's transparency values.
5. **Only two approval gates in V1** (hire + strategy) — additional governance would need custom implementation.
6. **Budget cascading** from Board through CEO through managers prevents runaway costs.
7. **Request depth tracking** and billing codes enable cost attribution across organizational boundaries.
8. **Self-hosted only** (MIT license, no cloud version) — ZAO would run its own Paperclip instance.

---

## Sources

- [Paperclip GitHub Repository](https://github.com/paperclipai/paperclip)
- [SPEC.md (Full Specification)](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/SPEC.md)
- [PRODUCT.md (Product Definition)](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/PRODUCT.md)
- [TASKS.md (Task Hierarchy)](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/TASKS.md)
- [DeepWiki - Core Concepts](https://deepwiki.com/paperclipai/paperclip/1.1-core-concepts)
- [Flowtivity - Zero-Human Companies](https://flowtivity.ai/blog/zero-human-company-paperclip-ai-agent-orchestration/)
- [Vibe Sparking - Paperclip Orchestration](https://www.vibesparking.com/en/blog/ai/agent-orchestration/2026-03-05-paperclip-open-source-orchestration-zero-human-companies/)
- [Dev.to - Scaling SaaS with Paperclip](https://dev.to/peterjp_join/scaling-your-saas-with-multi-agent-orchestration-via-paperclip-161m)
- [Paperclip Official Site](https://paperclip.ing/)
- [ScriptByAI - AI Agent Orchestration](https://www.scriptbyai.com/ai-agent-orchestration-paperclip/)
- [UCStrategies - Paperclip AI Manager](https://ucstrategies.com/news/paperclip-the-open-source-ai-manager-that-coordinates-multiple-ai-agents/)
- [Cohorte - Paperclip Platform](https://www.cohorte.co/blog/paperclip-ai-open-source-platform-for-managing-ai-agent-teams)
