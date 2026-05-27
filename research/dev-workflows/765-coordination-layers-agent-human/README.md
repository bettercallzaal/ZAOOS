---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-27
related-docs: 762, 763, 764
original-query: "coordination layers for hybrid agent + human teams on a kanban tracker: what's the right hierarchy (initiatives -> projects -> tasks -> subtasks?) when both AI agents and humans share the same board. Specifically for ZAOcowork where Telegram bot writes tasks, web users write tasks, meeting captures dump action items, research dispatcher creates research review tasks, and AI proposals will land in an approval queue."
tier: STANDARD
---

# 765 - Coordination layers for agent + human teams (ZAOcowork)

> **Goal:** Decide the right hierarchy, source taxonomy, and permission model for ZAOcowork now that multiple writers (humans + Telegram bot + meeting capture + research dispatcher + AI proposals) share one tracker. Match practice to the 4-7 person team size; skip enterprise patterns.

## Key Decisions

| # | Decision | Why | Effort |
|---|----------|-----|--------|
| 1 | ADD ONE hierarchy layer: **Project** (between Brand and Task). Don't add Epic / Initiative / Cycle. | Linear / Shortcut / Saga / Jira all converge on Project > Epic > Task > Subtask. For a 4-7 person crew, that's 1-2 layers more than we need. ONE level (Project) covers 90% of coordination need + matches the team's mental model ("the Magnetic launch project", "the WaveWarZ Phase 2 project"). Adding Initiative would be cargo-culting. | 6 hr - projects table + UI |
| 2 | ADD a **source** field on every task (provenance taxonomy). | The "Agent Task Board Protocol" (R-That Wiki 2026) + every agent-kanban project surveyed makes source field non-negotiable when bots + humans share a board. Without it, the activity feed can't tell you who wrote what. ZAOcowork has 5 writer types - tag every row at write time. | 2 hr - column + values + UI chip |
| 3 | ADOPT 4-level **autonomy tier** per ACTION (not per task). | dev.to/yash_pritwani 2026: every action gets a tier (auto/notify/ask/block). Maps cleanly to ZAOcowork: read = auto, bot write = notify, AI proposal = ask, bulkDelete = block. We already have most of this implicit; making it explicit on the UI builds trust. | 3 hr - action policy table + audit chips |
| 4 | KEEP the 5-status flat workflow (TRIAGE / TODO / WIP / BLOCKED / DONE). | The Saga + agent-kanban + agentboard projects all use ~6 states. Adding more (pending_review / approved / accepted) is for autonomous-coding-agent use cases we explicitly skip. Our existing approval queue + worker review flow already covers human-review concerns without expanding the status field. | n/a (negative decision) |
| 5 | ENFORCE delegation invariants from ACP spec (2026): permissions only narrow, every agent action carries originating human. | Today the audit_logs row has `actor: "Telegram"` for bot actions - that's good but doesn't tell us which human triggered the bot. Future: bot writes carry `originHuman: zaal` so we can trace back. Important when AI proposals fan out. | 1 hr - audit metadata extension |
| 6 | DO NOT add Cycles / Sprints / Iterations. | We confirmed in doc 763 that continuous flow beats sprints for our team. Adding cycles now just to mirror Linear would be feature-import. | n/a |
| 7 | DO NOT add story points. Use throughput (doc 764 F1 already shipped). | Vacanti / ProKanban evidence + every recent kanban-agent project drops points. | n/a |
| 8 | DO NOT build per-card sandboxes / per-card credential brokers (yet). | dev.to/yash_pritwani 2026 advocates this for production-touching agent workboards. We're not there yet - our AI proposals are read-only-LLM + human-approve. Revisit when an agent proposes a code change that auto-merges. | n/a |

The hierarchy decision (#1) ships first as Phase I - that's the only structural change. The others are policy + audit work that can ship in parallel.

---

## Current state inventory

ZAOcowork already has primitives most agentic-kanban projects had to invent:

| Concept | ZAOcowork field | Where defined |
|---------|-----------------|---------------|
| Task | `ActionItem` | `src/lib/types.ts:97` |
| Brand grouping (cross-cutting) | `brands: string[]` | `src/lib/types.ts` |
| Status state machine | `TRIAGE / TODO / WIP / BLOCKED / DONE` | `src/lib/types.ts:STATUSES` |
| Service class (cost-of-delay shape) | `serviceClass` | doc 763 F2 |
| Owner + claimable | `owner` + `claimable` | `src/lib/types.ts` |
| Activity log per task | `activity: ActivityEvent[]` | `src/lib/types.ts:88` |
| Workspace audit log | `audit_logs` table | doc 763 F5 (migration 003) |
| Approval queue (worker -> lead) | `updates[].reviewStatus = pending` | `src/lib/types.ts:74` |
| AI proposal queue | `task_proposals` table | doc 764 F7 (migration 005) |
| Auto-archive | `archivedAt` | doc 763 F4 |
| Triage inbox | status=TRIAGE | doc 763 F6 |
| Permalinks | `/todo/<id>` | Phase H |
| Bot integration | agent/ subdir + Supabase shared write | pre-this-session |
| AI Assistant (read-only) | `/chat` route | pre-this-session |

What's missing relative to the surveyed agentic-kanban projects:
1. **Project layer** above tasks (every surveyed tool has this)
2. **Source field** on tasks (Saga uses it implicitly via type; we need explicit)
3. **Action policy chips** that surface the autonomy tier in the UI (we have the gates in code, but users don't see "this requires admin" until they click)
4. **Delegation chain tracking** for AI-initiated actions (which human originated this bot write?)

---

## The hierarchy decision in detail (Finding 1)

Every modern issue tracker converges on the same shape:

| Tool | Top layer | Mid | Unit of work | Atomic | Source |
|------|-----------|-----|--------------|--------|--------|
| Linear | Initiative | Project | Issue | Sub-issue | linear.app/docs |
| Shortcut | (none) | Epic | Story | Task (within story) | shortcut.com |
| Jira | Initiative | Epic | Story / Task | Sub-task | atlassian.com |
| Saga (MCP) | (none) | Project | Epic > Task | Subtask | spranab/saga-mcp |
| Plane | (none) | Module | Issue | Sub-issue | plane.so |
| GitHub Projects | (none) | Milestone | Issue | Task list | docs.github.com |
| Linear Agent | Initiative | Project | Issue | Sub-issue | Linear Agent beta 2026 |

The pattern: **2 levels of grouping above the unit of work, 1 level below**. Most small teams use 1 grouping level, not 2.

For ZAOcowork:
- Brand tags = already cover the **highest** layer (cross-cutting like "everything WaveWarZ-related"). Don't replace.
- Adding **Project** between Brand and Task gives one focused unit of coordination ("the Magnetic v1 launch", "ZAOstock Phase B", "WaveWarZ Zambia Week 4"). A project has 5-50 tasks, lasts weeks-months.
- Tasks stay where they are.
- TodoPanel already has a "subtask" mental model via the checklist preview but doesn't persist sub-tasks separately. The Saga 2026 piece notes their hierarchy works because **agents prefer 4 layers** but humans use 2-3 in practice. Skipping persistent subtasks keeps the data model lean.

Open question for Phase I implementation: do brands collapse INTO projects (each project has 1 brand) or stay independent (a project can span brands)? Recommendation: **stay independent** - brands are cross-cutting market tags, projects are time-bounded initiatives. A "WaveWarZ Phase 2" project carries the WaveWarZ brand; a "Brand voice consolidation" project carries multiple brands at once.

---

## Source taxonomy (Finding 2)

Today the closest thing we have to a source field is `createdBy` (a free-text string). Bot writes `createdBy: "Iman"` because that's who triggered the bot. We can't filter "show me everything the bot ingested today" or "show me everything the meeting capture wrote".

Proposed enumerated source values:

| Source | Writer | Example |
|--------|--------|---------|
| `human-web` | Logged-in user via QuickAdd / inline | Default for board-created |
| `human-bot` | User via Telegram bot `/add` | "added #142 (Iman) ..." |
| `meeting-capture` | `/meeting` skill extracted action items | Post-call action list |
| `research-dispatch` | research-dispatch autonomous pipeline | review-this-research tasks |
| `pr-test-task` | `~/bin/zao-tracker pr` helper after PR open | per-PR test task |
| `ai-proposal` | task created via approveProposal on a proposal that includes a new task | future, doc 764 F7 |
| `system-cleanup` | bulk archive / cleanup actions | doc 763 cleanup UI |
| `external-api` | future Hermes / external bot integration | placeholder |

Every row gets one. Activity feed gets a filter chip. The audit log already has source baked in via `entity_type + actor` but it's not enumerated at write time on the task itself.

Implementation: `source TEXT` column on tasks + backfill from `createdBy` patterns + UI chip on cards + filter in /admin/feed.

---

## Permission tiers (Finding 3)

Borrowed from dev.to/yash_pritwani 2026's 4-level model + agent-kanban's role system + ACP scope narrowing:

| Tier | What it gates | Today | After Phase I |
|------|---------------|-------|---------------|
| **Auto** | Read board, read tasks, search, ask Assistant | Logged-in user | Same |
| **Notify** | Write own task, comment, change own status, claim | Logged-in user | Same |
| **Ask** | Review pending updates (workers' DONE submissions), approve AI proposals, route TRIAGE | Lead | Same; surface in UI w/ "Requires lead" chip |
| **Block** | Bulk delete, hard-delete user, change user role | Admin | Same; surface in UI w/ "Admin-only" chip |

ZAOcowork already enforces these gates server-side (`requireSession` / `requireLead-via-isLead` / `requireAdmin`). The gap is **visibility** - users don't see "this button needs admin" until they click. The fix is a small chip next to each action button that surfaces the tier.

This is also how AI proposals fit: an LLM running under Iman's session can READ + propose, but cannot APPROVE its own proposals - that's a tier-up (ask) which requires a human click. The pattern is built into our F7 architecture; we just need the chip UX to make it legible.

---

## Delegation chains (Finding 5)

The ACP spec (agenticcontrolplane.com 2026) prescribes: every agent action carries the originating human's identity, and permissions only narrow as you traverse the delegation chain. ZAOcowork lite version:

Today our `audit_logs.actor` is the immediate writer ("Telegram", "Iman", "github:webhook"). Goal: each row also carries the originating human when known.

Concrete cases:
- Iman runs `/add` in Telegram -> audit row: `actor: "Iman", source: human-bot, origin: "Iman"`
- The meeting capture skill (running on Zaal's laptop, posting to bot API) -> `actor: "meeting-bot", source: meeting-capture, origin: "Zaal"`
- A future cron-triggered AI proposal that auto-approves under Iman's policy -> `actor: "ai-proposal", source: ai-proposal, origin: "Iman", policy: "auto-approve-brand-tags"`

The `metadata` jsonb on audit_logs already has room for this. Add a convention: `metadata.origin = "<human-slug>"`.

**Important per ACP spec:** the agent / system writer can never CLAIM a stronger originating human than the request actually carries. The HMAC-signed Telegram session cookie or bot API key is the source of truth for `origin`, not free-text.

---

## What NOT to do

Synthesizing the surveyed agentic-kanban projects + the doc 763/764 anti-patterns:

| Pattern | Source argues against | Reason for us |
|---------|----------------------|---------------|
| Initiative > Project > Epic > Story > Sub-task (5 layers) | Linear small-team data + HN small-teams thread 34232095 | Way over-engineered for 4-7 people. We'd never use 3 of the 5 layers. |
| Cycles / sprints / iterations | doc 763 F8 + Cadence 2026 async playbook | Continuous flow already works. Don't bolt Scrum atop kanban. |
| Story points / velocity-by-points | Vacanti / ProKanban / doc 764 F1 | Throughput is more honest, zero estimation overhead. |
| Auto-approving AI proposals based on confidence threshold | liz-tracker, veritas-kanban, agentboardroom 2026 | Liz-tracker default is "human approves every time". At our scale the time saved by auto-approve < risk of bad write. Manual approve for now. |
| Per-card credential brokers / per-card git worktrees | dev.to/yash_pritwani 2026, agent-kanban 2026 | Heavy. Only useful when agents WRITE code without supervision. We're nowhere near that. |
| Cryptographic agent identity (Ed25519 like agent-kanban) | bonaysoft/agent-kanban 2026 | Overkill at 4-7 user scale. Supabase service-role + audit_logs is enough. |
| Adversarial agent review (CEO/CTO/QA pattern from AgentBoardroom) | GixGosu/AgentBoardroom 2026 | Designed for unattended multi-day runs. Our AI use is suggest-and-approve in seconds. |
| Forbidding direct DB writes (only API mutations, R-That protocol) | wiki.r-that.com 2026 | Useful when multiple agents share a board. We already enforce via server actions; bots use the same RPC. Not adding ceremony. |
| Required pre-review checklists (testing/security/mobile/lint) before agents can `review` | R-That Wiki | We use PR review on GitHub for code; tracker-side checklist would duplicate. |

---

## Comparison: hierarchy options for ZAOcowork

| Option | Layers above task | Top-down view | Effort to ship | Recommendation |
|--------|-------------------|---------------|----------------|----------------|
| Status quo (Brand only) | 1 (Brand) | Flat list of 281 active tasks | 0 hr | Already at limit - confusion at 281 tasks |
| ADD Project layer | 2 (Brand + Project) | "WaveWarZ Phase 2 -> 12 active tasks" | 6 hr | **PICK THIS** (doc 765 #1) |
| ADD Project + Initiative | 3 (Brand + Initiative + Project) | "ZAOstock 2026 -> Magnetic launch -> 8 tasks" | 12 hr | Over-engineered for 4-7 |
| ADD Epic only (Shortcut model) | 2 (Brand + Epic) | "Auth refactor epic -> 7 tasks" | 6 hr | Same as #2 with different name; "Project" is clearer |
| Use Saga 4-layer wholesale | 3 (Project + Epic + Task + Subtask) | Saga MCP pattern | 14 hr | Right for autonomous agent teams; overkill here |

---

## Phase I implementation sketch (for the followup PR)

When we ship the hierarchy, the smallest possible diff:

1. Migration 006: `CREATE TABLE projects (id, name, status, started_at, target_date, brand_default, created_at)` + `ALTER TABLE tasks ADD COLUMN project_id uuid REFERENCES projects(id)` (nullable - existing tasks stay unparented).
2. `src/lib/types.ts`: add `Project` type + `projectId?: string | null` field on `ActionItem`.
3. `/admin/projects` CRUD: create + list + close + reopen.
4. Board top bar: project picker chip next to brand tabs ("All projects" default, click chip filters tasks to project).
5. TaskRoom: project picker field next to brand picker.
6. QuickAdd NL parser: detect `^project-slug` token, set projectId.
7. Telegram bot `/list project-slug` and `/add #project-slug ...`.
8. Activity feed + audit_logs: project chip on rows.
9. Forecast (doc 764 F1): per-project forecast in addition to per-brand.

No status field changes. No new permission tiers. Just one new noun.

---

## Also See

- [Doc 763 - kanban best practices](../763-kanban-async-team-best-practices/)
- [Doc 764 - next improvements](../764-zaocowork-next-improvements/)
- Tracker tasks `research-doc-763` and `research-doc-764` (already routed)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship Phase I: Project layer (decision #1) | Zaal | PR | 2026-06-03 |
| Add `source` enum to tasks + UI chip (decision #2) | Zaal | PR (paired with Phase I or separate) | 2026-06-03 |
| Surface autonomy tier chips on action buttons (decision #3) | Zaal | PR | 2026-06-05 |
| Extend audit_logs.metadata with `origin` field (decision #5) | Zaal | PR + bot redeploy | 2026-06-07 |
| Re-evaluate need for sub-tasks at 6-month review | Iman | Review | 2026-11-27 |
| Fire research-doc tracker task for doc 765 | Auto | Tracker | After PR merge |

---

## Sources

- [Linear vs Jira vs GitHub Issues 2026 - Automaiva](https://automaiva.com/linear-vs-jira-vs-github-issues-saas-2026/) [FULL]
- [Linear / Jira / GitHub Projects comparison - NexaSphere 2026-01-27](https://nexasphere.io/blog/best-project-management-tools-developers-2026) [FULL]
- [Linear vs Shortcut in 2026 - ToolPick 2026-05-03](https://www.toolpick.dev/blog/linear-vs-shortcut-2026) [FULL]
- [Best Linear Alternatives 2026 - Rework 2026-03-18](https://resources.rework.com/tools/dev-tools/best-linear-alternatives) [FULL]
- [Shortcut Review 2026 - MakerStack](https://makerstack.co/reviews/shortcut-review/) [FULL]
- [Linear vs Jira vs GitHub Issues - StackFYI 2026-04-09](https://www.stackfyi.com/guides/linear-vs-jira-vs-github-issues-2026) [FULL]
- [permission-protocol/governance-framework - 2026-03-20](https://github.com/permission-protocol/governance-framework) [FULL]
- [rayyagari2-create/agentic-workforce-framework - 2026-04-24](https://github.com/rayyagari2-create/agentic-workforce-framework) [FULL]
- [Agent Permission Model Specification (Geodocs.dev) 2026-05-03](https://geodocs.dev/ai-agents/agent-permission-model-spec) [FULL]
- [GixGosu/AgentBoardroom - 2026-02-10](https://github.com/GixGosu/AgentBoardroom) [FULL]
- [Agent-to-Agent Governance - ACP 2026-04-01](https://agenticcontrolplane.com/agent-to-agent) [FULL]
- [Saga MCP tracker for AI agents - npm/spranab 2026-02-21](https://registry.npmjs.org/saga-mcp) [FULL]
- [Why AI Agents Keep Forgetting Your Project - dev.to/spranab 2026-02-23](https://dev.to/spranab/why-ai-agents-keep-forgetting-your-project-and-how-i-fixed-it-2j4d) [FULL]
- [Saga HN discussion - Show HN 2026 (#47106215)](https://news.ycombinator.com/item?id=47106215) [PARTIAL - HN ratelimited the direct fetch; pulled via libhunt mirror]
- [Saga on libhunt mirror](https://www.libhunt.com/posts/1481489-show-hn-saga-a-jira-like-project-tracker-mcp-server-for-ai-agents-sqlite) [FULL - replacement for HN page]
- [Agent task board protocol - R-That Wiki](https://wiki.r-that.com/patterns/agent-task-board-protocol/) [FULL]
- [AI Agent Workboards Need Audit Controls - dev.to/yash_pritwani 2026-05-25](https://dev.to/yash_pritwani_07a77613fd6/ai-agent-workboards-need-audit-controls-before-they-need-more-agents-2o70) [FULL]
- [bonaysoft/agent-kanban - 2026-03-20](https://github.com/bonaysoft/agent-kanban) [FULL]
- [seoshmeo/agentboard - 2026-02-19](https://github.com/seoshmeo/agentboard) [FULL]
- [Ask HN: Best structure for software dev teams (HN 31888332)](https://news.ycombinator.com/item?id=31888332) [PARTIAL - cited from WebSearch result list, not directly fetched; included as community signal that hierarchy debate is recurrent]
- [Small Teams (HN 34232095)](https://news.ycombinator.com/item?id=34232095) [PARTIAL - WebSearch result snippet; "small teams get distracted by best practices built for big teams"]
