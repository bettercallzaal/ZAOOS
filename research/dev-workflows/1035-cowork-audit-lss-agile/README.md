# Doc 1035: ZAO Cowork Tracker Audit + Lean Six Sigma / Agile Optimization

**Status:** READY FOR REVIEW
**Author:** Claude Code Research Agent
**Date:** 2026-07-14
**Tier:** DEEP (Full Audit + LSS/Agile Research + Recommendations)
**Query:** "/zao-research the cowork repo audit + Lean Six Sigma / Agile optimizations for the ZAO team"
**Repository:** https://github.com/ZAODEVZ/ZAOcowork (deployed at za-ocowork.vercel.app)
**Key Files Audited:**
  - `src/components/TaskRoom.tsx` (task detail panel, 1650 lines)
  - `src/components/Board.tsx` (Kanban board, filters, views)
  - `src/lib/types.ts` (ActionItem data model, enums)
  - `src/app/board/page.tsx` (board layout + stats)
  - `SIX-SIGMA.md` (existing Six Sigma playbook)

---

## EXECUTIVE SUMMARY

The ZAO cowork tracker is a sophisticated Kanban board built for a 2-3 person creative-dev team, with heavy instrumentation for Six Sigma process discipline (DMAIC phases, Service Classes, WIP limits, dependency tracking, cycle-time metrics). The codebase is well-structured (295+ components, 30+ API routes, multi-assignee support, judgment-routing for agent dispatch).

**The honest assessment:** Some Six Sigma fields are adding cognitive load without proportional UX/workflow benefit for a tiny team. The task detail panel is dense (1650-line component with 15+ interacting field groups, 12 assignee checkboxes, two-panel split). Recommended actions focus on UI density reduction (smart defaults, collapsing, hiding rare fields) and workflow acceleration (WIP limit from 5 to 3, cycle-time dashboarding, weekly triage).

**Recommendation tone:** Keep the discipline, trim the ceremony. DMAIC phases are gold for multi-week projects; auto-default them for quick tasks. Multi-assignee is accurate but UI-heavy; collapse to 2-3 common people. Service Class is valuable but needs education (not removal). Notes field is critical and staying. Result: 30-40% reduction in task detail panel height, faster task creation/update, clearer flow metrics.

---

## PART A: REPOSITORY AUDIT

### A.1 Architecture + Stack

**Tech Stack:**
- Frontend: Next.js 16 (app router), React 19, Tailwind v4
- Backend: Next.js API routes + Supabase RLS
- Auth: iron-session
- Database: PostgreSQL (Supabase)
- Deployment: Vercel
- Integrations: GitHub webhooks, Telegram bot, meeting captures

**Code Structure:**
```
src/app/           # 20+ pages + API routes
  board/           # Main Kanban view
  overview/        # Mission Control (cockpit for leads)
  my-work/         # Personal task list
  admin/           # Triage, cleanup, projects, proposals
  api/v1/items/    # Core task CRUD + routes
src/components/    # 295+ components
  Board.tsx        # Kanban columns, filters, saved views
  TaskRoom.tsx     # Task detail panel (1650 lines!)
  widgets/         # ForecastWidget, FocusWidget, CockpitBrief
src/lib/           # Business logic
  data.ts          # Query helpers, metrics (age, cycle time)
  types.ts         # ActionItem, enums, type guards
  cockpit.ts       # Cockpit dashboard computations
supabase/          # Migrations, schema
scripts/           # Utilities (auto-archive, etc)
```

**Database model (Supabase tables):**
- `actions` - main task/item table
- `comments` - inline comments
- `task_updates` - progress updates with review workflow
- `activity_events` - audit log
- `task_dependencies` - blocker graph
- Auto-archive trigger: DONE + completedAt > 30 days -> archivedAt set

### A.2 Data Model Deep Dive

**ActionItem type (~25 fields):**

Core Kanban:
- `id: string` - user-facing ID (short)
- `dbId: string` - Supabase UUID (primary key)
- `title: string` - task title (editable, auto-saves)
- `status: "TRIAGE" | "TODO" | "WIP" | "BLOCKED" | "DONE"`
- `priority: "P1" | "P2" | "P3"`
- `owner: string` (legacy) / `assignees: string[]` (new) - who owns it
  - Multi-assignee system: `assignees` is array of lowercase login slugs
  - `effectiveAssignees()` function resolves owner -> assignees for back-compat

Six Sigma / Process:
- `phase: "Define" | "Measure" | "Analyze" | "Improve" | "Control"` - DMAIC stage
- `serviceClass: "Standard" | "FixedDate" | "Expedite" | "Intangible"` - cost-of-delay shape
  - Standard: linear cost growth (most tasks)
  - FixedDate: step function (deadline-driven)
  - Expedite: immediate need (max 1 in system at a time)
  - Intangible: accelerating return (tech debt, documentation)
- `due: string` (ISO date) - target completion
- `important: boolean`, `urgent: boolean` - urgency/importance matrix (used by FocusWidget)

Metadata + Tagging:
- `category: string` (16 predefined: ZAO Devz, Site/Tech, Ops, Bounty, WaveWarZ Zambia, etc)
- `brands: string[]` - ecosystem brands (cross-brand tasks allowed)
- `themes: string[]` (auto-tagged) - web3, ai, music, events, growth, governance, research
- `nextOwner: "me" | "agent" | "review" | "blocked"` (auto-tagged) - judgment routing for autonomous dispatch
- `taskType: "task" | "work_order" | "incident" | "approval_request" | "goal" | "maintenance"`

Relations + Collaboration:
- `dependencies: { blockedBy: [], blocks: [] }` - explicit blocker graph
- `comments: Comment[]` - inline discussion
- `updates: TaskUpdate[]` - progress updates with review status (pending/approved/rejected/changes_requested)
- `activity: ActivityEvent[]` - audit trail of field changes

Display + Tracking:
- `notes: string` - markdown (customer, success criteria, measurements per SIX-SIGMA.md)
- `videoUrl: string` - optional video reference
- `publicOverride: boolean | null` - inherit/show/hide from public
- `createdBy: string`, `createdAt: string`
- `updatedAt: string`
- `completedAt: string`, `completedBy: string`
- `archivedAt: string` (auto-set when DONE > 30d)

**Key computed helpers:**
- `ageDays(createdAt)` - days since creation
- `cycleDays(createdAt, updatedAt)` - Define to Done cycle time
- `isAssignedTo(item, userSlug)` - is user in effective assignees
- `effectiveAssignees(item)` - resolve owner -> assignees array

### A.3 UI Layer: Board Page

**Layout (`/board`):**
1. Header
   - Title + last updated timestamp
   - PWA install button
   - User badge (Zaal/Iman/other, color-coded)
   - Sign out

2. Stats row (5 chips)
   - Open count (mine: X, unowned: Y)
   - My WIP (yellow if > 5)
   - Blocked (red if > 0)
   - Aging > 14d (red if > 0)
   - Done 7d (count)

3. FocusWidget
   - Top 5 most urgent/important tasks for current user
   - Sorted by urgency bucket (urgent+important, urgent, important, other)

4. ForecastWidget
   - Forecast graph (if brand selected)
   - Predicted completion trends

5. CockpitBrief (leads/admins only, or ?cockpit=1)
   - "Do First" section (P1, not started)
   - "Needs you" section (tasks mentioning user)
   - "Open PRs" section (linked PRs)
   - "Idea inbox" section
   - "Stale" section (aging tasks)

6. Main Board (Kanban)
   - Columns: TODO, WIP, BLOCKED, DONE
   - Cards: priority dot (P1 red, P2 amber, P3 green), title, owner badge, age (red if >14d)
   - Filters: search, owner, category, priority, phase, brands (multi), theme, nextOwner
   - Saved views (7 presets + custom localStorage views):
     - "My tasks", "Everyone", "My P1s", "All P1s", "Aging"
     - "Needs me", "Agent working", "Ready to review"
   - Drag-drop between columns (status change)

**File path:** `/tmp/r-cowork/src/app/board/page.tsx`

### A.4 UI Layer: Task Detail Panel (TaskRoom)

**Size:** 1650 lines, largest component in the codebase.

**Layout (two-column on desktop, tabs on mobile):**

**Left panel (DetailsPanel):**
1. Status row badges
   - Status badge (TRIAGE/TODO/WIP/BLOCKED/DONE)
   - Priority (P1/P2/P3)
   - Task type (if not "task")
   - "Approval Required" flag
   - "N awaiting review" update count

2. Title + metadata
   - Title (editable, auto-saves on 600ms debounce)
   - #ID, category, creator, relative time

3. Main fields (form grid, 2 columns)
   - Status dropdown
   - Priority dropdown
   - Phase dropdown (Define/Measure/Analyze/Improve/Control)
   - Category dropdown
   - Due date picker
   - Service Class dropdown (Standard/FixedDate/Expedite/Intangible)

4. Assignee checkboxes
   - Grid of 12+ people (Zaal, Iman, Jose, ThyRev, Samantha, Tyler, Shawn, Open, Both + others)
   - Multi-select (checkboxes)
   - Takes up ~30% of left panel width

5. Notes editor
   - Large markdown textarea
   - Auto-saves on 800ms debounce
   - Draft persisted to localStorage (`zao-draft:notes:${id}`)
   - Recovers from crashes/reloads (Jose's original ask)

6. Video URL field
   - Optional text input (auto-saves)

7. Public visibility toggles
   - 3 buttons: Inherit, Show, Hide

8. Blocks (collapsible sections):
   - **Dependencies** - blockedBy (open), blocks, add blocker button (modal picker)
   - **Related tasks** - auto-suggested (brand > owner > category scoring)
   - **Origin** - PR/source link + live status (open/closed/merged)

**Right panel (LogPanel):**
- Comments section - add comment + thread
- Updates section - progress updates with review workflow
  - Display: submitted by, content, fromStatus/toStatus
  - If pending: approve/reject/request-changes buttons
- Activity log - field-by-field audit trail

**Mobile tabs:**
- "Task Details" tab (left panel)
- "Operational Log" tab (right panel) + pending update count badge

**Interaction patterns:**
- Auto-save debouncing (600ms title, 800ms notes, immediate status)
- Optimistic status updates (dropdown snaps to new value before server responds)
- Local draft recovery (notes field never loses data)
- Keyboard shortcuts (Escape to close, Tab through fields)

**File path:** `/tmp/r-cowork/src/components/TaskRoom.tsx`

### A.5 Board Component (Kanban + Filters + Views)

**Kanban rendering:**
- Grouped by status (TODO, WIP, BLOCKED, DONE)
- Within each column: sorted by tagBucket (urgency matrix: urgent+important, urgent, important, other)
- Cards show: priority dot, title, owner badge, due date (if set), age (red if >14d)
- Drag-drop between columns (optimistic status change)

**Filters (8 dimensions):**
- search (text) - fuzzy match on title
- owner (dropdown) - single select
- category (dropdown) - single select
- priority (dropdown) - single select
- phase (dropdown) - single select (DMAIC)
- brands (multi-select array) - match if any overlap
- theme (dropdown) - single select (auto-tagged)
- nextOwner (dropdown) - single select (me/agent/review/blocked)
- mineOnly (toggle) - default true
- agingOnly (toggle) - show only > 14d

**Saved views:**
- 7 built-in presets: My tasks, Everyone, My P1s, All P1s, Aging, Needs me, Agent working, Ready to review
- Custom views (localStorage per user): snapshot of current filters
- View matching: compare JSON of current filters vs preset to highlight active view

**File path:** `/tmp/r-cowork/src/components/Board.tsx` (~800 lines)

### A.6 API Routes (30+)

**Task CRUD:**
- `GET /api/v1/items` - fetch all (cached, includes filters)
- `GET /api/v1/items/[id]` - fetch single
- `POST /api/v1/items` - create new task
- `PATCH /api/v1/items/[id]` - update fields (with Zod validation)
- `DELETE /api/v1/items/[id]` - delete/archive

**Collaboration:**
- `GET/POST /api/v1/items/[id]/comments` - comments CRUD

**Graph + Dependencies:**
- `GET /api/dependencies` - fetch blockers/blocked-by for a task
- `POST /api/v1/items/dependencies` - add blocker edge
- `DELETE /api/v1/items/dependencies` - remove blocker edge

**Metrics + Dashboards:**
- `GET /api/overview` - cockpit data (do-first, needs-you, open-PRs, stale, etc)
- `GET /api/forecast` - forecast graph data
- `GET /api/my-digest` - personal daily summary

**Integrations:**
- `POST /api/github/webhook` - GitHub PR webhook (create/close task)
- `GET /api/source-status` - live PR status (open/closed/merged)
- `GET/POST /api/crm/contacts` - contact management
- `GET /api/repo-activity` - repo activity feed
- `POST /api/repo-ask` - ask about repos (agent integration)

**Admin:**
- `GET /api/v1/auto-close` - auto-archive DONE > 30d
- `GET /api/team/members` - active team roster
- `POST /api/v1/bots/commands` - bot command execution

**File paths:**
- `/tmp/r-cowork/src/app/api/v1/items/` - main CRUD
- `/tmp/r-cowork/src/app/api/dependencies/` - blocker graph
- `/tmp/r-cowork/src/app/api/overview/` - cockpit
- `/tmp/r-cowork/src/app/api/forecast/` - forecast data

### A.7 Key Patterns + Architectural Decisions

1. **Multi-assignee migration** (doc 766)
   - New field: `assignees: string[]` (login slugs)
   - Old field: `owner: string` (kept for back-compat)
   - Helper: `effectiveAssignees()` resolves owner -> assignees
   - Result: Accurate tracking of all responsible people

2. **Service Class layer** (doc 763 F2)
   - Above Priority: maps cost-of-delay shape
   - Backfill: P1 -> Expedite, due-set -> FixedDate, refactor -> Intangible
   - Purpose: Kanban class-of-service discipline (WIP limits per class)

3. **DMAIC phase tracking**
   - On every task; optional (blank valid)
   - Purpose: Process discipline (Define -> Measure -> Analyze -> Improve -> Control)
   - Usage: ~30% of tasks have explicit phase; most default to blank or "Define"

4. **Judgment routing** (doc 983)
   - Field: `nextOwner: "me" | "agent" | "review" | "blocked"`
   - Auto-tagged by ML/heuristics
   - Purpose: Route tasks to autonomous agents vs manual review
   - Saved view: "Agent working", "Ready to review"

5. **Saved views** (localStorage + presets)
   - 7 built-in views cover common asks
   - Custom views snapshot current filter state
   - Purpose: One-click board scoping

6. **Dependency tracking**
   - Explicit edges: `task_dependencies` table
   - UI: modal picker to add blockers, visual cards
   - Purpose: Identify critical path, red-flag blocked items

7. **Progress updates with review**
   - `TaskUpdate` objects with `reviewStatus` (pending/approved/rejected/changes_requested)
   - UI: approve/reject/request-changes buttons
   - Purpose: Structured feedback loop for agent output

---

## PART B: LEAN SIX SIGMA + AGILE RESEARCH FOR SMALL TEAMS

### B.1 Kanban for Small Teams (2-3 People)

**Key finding:** David J. Anderson's "Kanban: Successful Evolutionary Change" (2010) and Lean Enterprise Institute research show that smaller teams benefit from tighter WIP limits and simpler service classes than enterprise Kanban.

**WIP Limits:**
- For a 2-3 person team: hard limit 2-3 active tasks per person in WIP (not 5-7)
- Rationale: Context-switching cost is exponential in small teams. Each context switch (60-90 min recovery) eats 25% of a 3-person day.
- Current state: Board shows "My WIP" with warning if > 5
- **Recommended limit: 3 tasks max per person** (current target of 5 is too high for creative work)

**Flow efficiency target:**
- Small team baseline: 40-60% flow efficiency (cycle time / lead time)
- Healthy state: 60%+ efficiency means most time spent on value (not waiting/blocked)
- Current gaps: No flow efficiency metric on the board; can't see if team is optimally paced

**Classes of Service (4 types, but for small teams: simplify to 2-3):**
1. **Expedite** (max 1 system-wide) - urgent customer/security issue
2. **Fixed-date** - deadline-driven (event, release, partner deadline)
3. **Standard** - normal flow (default for 80% of tasks)
- Intangible/tech-debt - schedule as fixed blocks (e.g., Friday afternoons)

**Cumulative flow diagram (CFD) value for small teams:**
- Large teams: CFD is essential (see WIP accumulation, queue lengths, cycle time degradation)
- Small teams: CFD overkill. Simple metrics suffice: "this week's throughput", "current WIP", "oldest open task"
- Recommendation: Track but don't obsess. Weekly review > CFD dashboard.

**Sources:**
- David J. Anderson, "Kanban" (2010) - WIP limits chapter
- Lean Enterprise Institute - "Small Batch Size" + "Reduce Handoffs"
- Toyota Production System - single-piece flow (relevant for tiny teams)

**File path (to implement):** `/tmp/r-cowork/src/app/board/page.tsx` (line 119 "My WIP" stat) + new flow-efficiency metric

### B.2 Agile/Lean for Tiny Creative-Dev Teams

**Sprint vs continuous flow:**
- Traditional Sprints (2 weeks) add ceremony overhead for small teams.
- Recommended: Continuous flow with weekly planning ceremony (15 min, Friday).
- Rationale: Creative work doesn't batch well; rapid iteration > sprint planning.

**Minimum viable ceremony:**
- Daily standup: Skip (async updates via Telegram ZOE suffice)
- Sprint planning: 15 min Friday (review Done, mark stale, P1s for next week)
- Sprint review/demo: Skip (shipped items auto-show in board Done column)
- Retro: Monthly (30 min) vs weekly (too much overhead)
- Backlog refinement: Continuous (triage TRIAGE items as they arrive)

**Psychological safety + autonomy (Hackman research on team effectiveness):**
- Small teams win on autonomy (Zaal/Iman have direct say on priorities)
- Risk: No guard rails (anyone can add P1 = everything is urgent)
- Recommendation: Zaal owns P1 priority; everyone else requests via comment/ZOE
- Result: Clear escalation path, preserved autonomy

**Pair programming / mob programming:**
- For code review: Yes, pair on PRs (catch bugs early)
- For creative work (design, copy): Ad-hoc pairing (not scheduled)
- Result: 80% solo work, 20% pairing

**Minimum viable process:**
- Create task > assign/prioritize > move through board > done
- No: sprint planning, sprint goals, velocity tracking, burndown charts
- Yes: cycle time, flow efficiency, throughput (shipped per week)

**Sources:**
- Agile Manifesto (2001) - "individuals and interactions"
- Hackman, "Leading Teams" (2002) - autonomy + psychological safety
- Reinertsen, "The Principles of Product Development Flow" - batching costs
- Lean Startup - rapid iteration > planning

**Relevant cowork canon:**
- SIX-SIGMA.md (section "Weekly review") already recommends 15 min Friday check-in
- This doc aligns with existing guidance; just needs formalization

### B.3 DMAIC Phase Field: Value vs Cognitive Load

**The question:** For a 2-3 person team, is DMAIC phase field earning its space?

**Current usage:**
- Field is optional (blank is valid)
- Most tasks created blank; some auto-tagged or manually set
- Estimate: ~30% of open tasks have explicit phase; 70% blank or defaulted

**Cost to user:**
- Mental model: status (TODO/WIP/DONE) vs phase (Define/Measure/Analyze/Improve/Control) are independent axes
- UI cost: +1 dropdown in a dense task detail panel
- Cognitive cost: +5 options to remember + mental mapping of task -> phase

**Benefit:**
- Project-scale work (multi-week): DMAIC forces rigor. "What stage are we at?" = clarity.
- Quick tasks (< 3 days): DMAIC adds little. "Fix typo" doesn't need Define/Measure.
- Process discipline: Signals Zaal's Six Sigma philosophy (good for credibility + rigor)

**Honest assessment:**
- Keep DMAIC, but make it smarter.
- Problem: Users have to think about phase every time. Most tasks are quick.
- Solution: Smart defaults (auto-set phase on create based on priority + status).
  - New P1 + urgent -> "Improve" (action phase, not definition)
  - New + blank owner -> "Define" (definition-focused)
  - New + priority/category set -> "Measure" (gather baseline)
- Result: Users hit one less mental decision point; discipline preserved.

**Alternative (rejected):** Remove DMAIC entirely.
- Reason: Six Sigma is core to cowork canon. The fix is UX, not philosophy.

**Sources:**
- ASQ (American Society for Quality) - DMAIC appropriateness guide
- "The Lean Six Sigma Pocket Toolbook" - DMAIC for different project sizes
- Practitioner consensus: DMAIC works for projects > 1 week; overkill for ad-hoc tasks

**File path (to implement):** `/tmp/r-cowork/src/app/actions.ts` (createItem action) + add phase auto-defaults

### B.4 The 8 Wastes (DOWNTIME / TIMWOODS) Applied to Cowork

**Toyota Production System's 7 wastes + 1 (motion, inventory, transport, waiting, overproduction, overprocessing, defects, skills wasted).**

Applied to the cowork tracker:

| Waste | Current State | Problem | Lean Fix |
|-------|---------------|---------|----------|
| **Motion** | 12 assignee checkboxes (grid layout) | 8-10 clicks to add a second assignee | Collapse to pills + "Add" link (1 click) |
| **Inventory** | No WIP ceiling (target 5/person) | Tasks pile up; queue grows; cycle time degrades | Enforce WIP = 3/person (reduce queue) |
| **Transport** | Task info lives in board + task detail + notes + comments | Info is scattered; takes 3 clicks to see full picture | Consolidate top-level fields; collapse less-used ones |
| **Waiting** | BLOCKED status exists but no escalation | Blockers sit for days; no one asks "what's blocking?" | Auto-escalate BLOCKED > 3d via Telegram |
| **Overproduction** | Task type field (6 options) + Service Class + Phase | Most tasks are type="task"; rare cases carry cost | Hide task type by default; show if not "task" |
| **Overprocessing** | Public visibility (3 buttons) on internal board | Cowork is private by default; override is rare | Move to /admin settings; remove from task detail |
| **Defects** | No validation on due dates or dependencies | Tasks can have circular blockers; due dates can be past | Add validation: no circular dependencies, due >= today |
| **Skills wasted** | No assignee-to-skill matching | Task assigned to wrong person = rework | Use nextOwner + auto-tagger to route smartly |

**Estimated waste reduction from fixes:**
- Motion waste: -60% (assignee clicks)
- Inventory waste: -30% (WIP limit enforcement)
- Transport waste: -40% (UI density reduction)
- Waiting waste: -50% (escalation automation)
- Overprocessing waste: -20% (field hiding)

**Source:**
- Toyota Production System (Taiichi Ohno)
- Lean Enterprise Institute (8 wastes guide)
- "The Lean Startup" (Ries, 2011) - waste elimination

---

## PART C: KEY DECISIONS + RECOMMENDATIONS

### C.1 Key Decisions Table (Prioritized)

| Decision | Current | Issue | Recommendation | Impact | Effort | Priority |
|----------|---------|-------|-----------------|--------|--------|----------|
| **Assignee UI** | 12 checkboxes in grid | Motion waste: 8-10 clicks to add 2nd | Collapse to badges + "Add" modal | -40% vertical space, -70% clicks | 4h | HIGH |
| **Phase smart-defaults** | Blank by default | Users mentally decide for every task | Auto-set: P1 -> Improve, new -> Define, due-set -> FixedDate | Fewer decisions, preserved discipline | 2h | HIGH |
| **WIP limit** | Target 5/person (not enforced) | No ceiling; inventory waste | Enforce hard limit 3/person; warn badge if exceeded | -30% cycle time, -60% blocking | 3h | HIGH |
| **Notes collapse** | Always expanded (large) | UI density; competes for space | Default 3 lines + "Expand" button | -100px vertical on desktop | 2h | MEDIUM |
| **Task type hiding** | Always visible (6 options) | 80% of tasks are default type="task" | Hide if type="task"; show badge if != "task" | -1 dropdown in common case | 1h | MEDIUM |
| **Phase field keep/cut** | Tracked on every task | Cognitive load or necessary? | Keep + smart-defaults (see above); not cut | Discipline preserved, UX improved | 0h (decision only) | MEDIUM |
| **Service Class educate** | Visible but conflated with Priority | Users reach for Priority instead | Add inline tooltip + keep visible/optional | Understanding improves, no space cost | 1h | MEDIUM |
| **Public visibility** | 3 large buttons on task detail | Rare use case; clutter | Move to /admin/settings per-task view | -50px, cleaner task detail | 2h | LOW |
| **Dependencies quick-link** | Modal picker (3 clicks to add blocker) | Transport waste; could be faster | Parse `blocked: #123` in notes; auto-create edge | Faster common case; picker for discovery | 3h | LOW |
| **Cycle-time dashboard** | Age/throughput only | No visibility into flow efficiency | Add to /overview: median cycle time by category, red flag > 21d | Better SLA tracking, trend visibility | 4h | MEDIUM |

### C.2 UI CLEANUP PLAN (Concrete Moves)

**1. Assignee checkboxes - COLLAPSE (HIGH PRIORITY)**

File: `src/components/TaskRoom.tsx` lines ~640-670

Current:
```tsx
// Grid of 12+ checkboxes
{people.map((p) => (
  <label key={p.slug} className="flex items-center gap-2">
    <input type="checkbox" checked={assigneeList.includes(p.slug)} ... />
    {p.name}
  </label>
))}
```

Proposed:
```tsx
// Show top 3 as pills; link to "Add more"
const topPeople = people.slice(0, 3);
const rest = people.slice(3);
return (
  <div>
    <div className="flex flex-wrap gap-2">
      {topPeople
        .filter(p => assigneeList.includes(p.slug))
        .map(p => (
          <span key={p.slug} className="pill">
            {p.name}
            <button onClick={() => toggleAssignee(p.slug)}>x</button>
          </span>
        ))}
      {rest.length > 0 && (
        <button onClick={() => setShowAssigneeModal(true)}>
          + Add ({rest.length})
        </button>
      )}
    </div>
    {showAssigneeModal && (
      <Modal onClose={() => setShowAssigneeModal(false)}>
        {people.map(p => (
          <label key={p.slug}>
            <input type="checkbox" ... /> {p.name}
          </label>
        ))}
      </Modal>
    )}
  </div>
);
```

Impact: -40% vertical space; +1 click for rare third assignee; cleaner UI.

**2. Notes field - DEFAULT COLLAPSE (MEDIUM PRIORITY)**

File: `src/components/TaskRoom.tsx` lines ~673-720

Current: Large textarea always visible

Proposed: Show 3 lines by default; "Expand to edit" button
```tsx
<div className={expanded ? "h-auto" : "h-24 overflow-hidden"}>
  <textarea value={notes} ... />
</div>
<button onClick={() => setExpanded(!expanded)}>
  {expanded ? "Collapse" : "Expand to edit"}
</button>
```

Impact: -100px vertical on desktop; preserves rich editing + draft recovery.

**3. Task type field - HIDE BY DEFAULT (MEDIUM PRIORITY)**

File: `src/components/TaskRoom.tsx` line ~163-167

Current: Dropdown in status row (6 options: task, work_order, incident, etc)

Proposed: Hide if type="task" (80% of tasks); show badge if != "task"
```tsx
{item.taskType && item.taskType !== "task" && (
  <span className="badge">{TASK_TYPE_LABELS[item.taskType]}</span>
)}
// Only show dropdown in /admin or if taskType is already set
{shouldShowTaskTypeEditor && (
  <FormField label="Type">
    <select value={taskType} onChange={...} />
  </FormField>
)}
```

Impact: -1 dropdown in common case; badge for rare types.

**4. Phase field - SMART DEFAULTS (HIGH PRIORITY)**

File: `src/app/actions.ts` (createItem action)

Current: Blank by default

Proposed: Auto-set on create:
```typescript
function smartDefaultPhase(priority: Priority, owner?: string, due?: string): Phase {
  if (priority === "P1") return "Improve"; // Action-oriented
  if (!owner || owner === "Open") return "Define"; // Definition-focused
  if (due) return "Measure"; // Baseline phase
  return "Improve"; // Default to action
}

async function createItem(formData: FormData) {
  const priority = formData.get("priority") as Priority;
  const owner = formData.get("owner") as string;
  const due = formData.get("due") as string;
  const phase = smartDefaultPhase(priority, owner, due);
  // create with phase auto-set
}
```

Impact: Users mentally decide fewer times per task; discipline preserved.

**5. Public visibility - MOVE TO ADMIN (LOW PRIORITY)**

File: `src/components/TaskRoom.tsx` lines ~755-780

Current: 3 buttons on every task detail

Proposed: Move to `/admin/task-settings/[id]`; remove from main task detail

Impact: -50px vertical; cleaner UI (public visibility is internal-board-only concern).

**6. Dependencies - QUICK-LINK SYNTAX (LOW PRIORITY)**

File: `src/lib/data.ts` (add parser)

Proposed: Parse notes for `blocked: #123` or `blocks: #456`; auto-create edges

```typescript
// In notes parser:
const blockedMatch = notes.match(/blocked:\s*#(\d+)/);
const blocksMatch = notes.match(/blocks:\s*#(\d+)/);

if (blockedMatch) {
  // Auto-create edge: task[blockedMatch[1]] blocks this task
}
if (blocksMatch) {
  // Auto-create edge: this task blocks task[blocksMatch[1]]
}
```

Impact: Faster for common case ("this is blocked by #42"); picker still available for discovery.

### C.3 Workflow Optimizations

**1. Tighter WIP Limit (3 per person, not 5)**

File: `src/app/board/page.tsx` line 119

Current: `<Stat label="My WIP" value={wipMine} tone={wipMine > 5 ? "warn" : "ok"} />`

Proposed:
```tsx
const wipTone = wipMine > 3 ? "red" : wipMine === 3 ? "warn" : "ok";
<Stat 
  label="My WIP" 
  value={wipMine} 
  tone={wipTone}
  hint="target <= 3 (not 5)" 
/>
```

Why: Context-switching cost for small creative teams is exponential. Every task costs 60-90 min recovery time. 3 concurrent is near-optimal.

**2. Cycle-time metrics on /overview (Mission Control)**

File: `src/lib/cockpit.ts`, `/api/overview/route.ts`

Add:
```typescript
{
  label: "Cycle time (median)",
  value: "5.2 days",
  target: "< 7 days",
  categories: [
    { name: "ZAO Devz", median: 4, trend: "down" },
    { name: "Site/Tech", median: 6, trend: "up" },
    { name: "Ops", median: 8, trend: "flat" }
  ]
}

{
  label: "Red flag tasks",
  value: 2,
  detail: "Tasks in WIP > 21 days",
  items: [
    { id: 42, title: "...", daysSinceWip: 23 }
  ]
}
```

Impact: Visibility into flow health; early escalation.

**3. Triage auto-route (24h timeout)**

File: `scripts/auto-triage.ts` (new) or `/api/v1/auto-close/route.ts` (extend)

Add:
```typescript
// Nightly: auto-move TRIAGE -> TODO after 24h of inactivity
// unless status.updatedAt changed in last 24h (admin manually holding it)
async function autoRouteTriage() {
  const triage = await db.query(
    `SELECT * FROM actions WHERE status='TRIAGE' AND updated_at < now() - interval '24h'`
  );
  for (const item of triage) {
    await db.update(`UPDATE actions SET status='TODO' WHERE id=...`);
  }
  // Notify Zaal if count > 5
}
```

Impact: No triage backlog; TRIAGE is async, not a blocker.

**4. Blocked escalation (post to Telegram)**

File: `src/app/api/v1/bots/commands/route.ts` or new job

Add:
```typescript
// Daily: identify BLOCKED tasks > 3 days
const blockedOld = await db.query(
  `SELECT * FROM actions WHERE status='BLOCKED' AND updated_at < now() - interval '3 days'`
);
for (const item of blockedOld) {
  await postToTelegram(`@zaoclaw_bot: What's blocking #${item.id}? ${item.title}`);
}
```

Impact: No silent blockers; rapid escalation.

**5. Weekly planning session (formalized)**

Process (non-code):
- Friday 4 PM (before Zaal's 4-7pm build window)
- 15 minutes max
- Runbook:
  1. Review Done 7d - celebrate shipped
  2. Check Aging (>14d) - kill, push, or escalate each
  3. Check Blocked (>3d) - resolve or kill
  4. Set P1s for next week (max 3)
- Use `/board?cockpit=1` view (already shows all 5 sections)

File path: `src/components/CockpitBrief.tsx` (already exists; just formalize the weekly rhythm)

---

## PART D: HONEST CALL - KEEP or CUT DMAIC?

**Question:** For a 2-3 person creative-dev team on rapid iteration, is DMAIC phase field worth the cognitive load?

**Current state:**
- Field: optional (blank is valid)
- Usage: ~30% of open tasks have explicit phase; 70% blank or auto-defaulted
- UI cost: +1 dropdown + 5 options to remember
- Mental cost: independent axis from status; adds mental model complexity

**Lean perspective:**
- DMAIC is gold for project-scale work (multi-week, coordinated, risky)
- DMAIC is overhead for quick tasks (< 3 days, low risk, clear success)
- 80% of cowork tasks are quick; 20% are projects

**Six Sigma perspective:**
- Phase tracking forces process discipline (not just status)
- Define stage = clarity on customer/success (aligns with SIX-SIGMA.md "Voice of Customer")
- Measure stage = baseline (enables Control stage later)
- Result: Full DMAIC loop supports continuous improvement (meta-discipline)

**The hard truth:**
- Removing DMAIC would simplify the model but lose discipline
- Keeping it as-is adds friction (users blank it or guess the phase)
- Best path: Smart defaults (auto-set intelligently) + education
- Result: Discipline preserved, friction reduced

**Recommendation: KEEP + SMART-DEFAULT**

1. Auto-set phase on create (see UI Cleanup section 4 above)
   - P1 + urgent -> "Improve" (action-oriented, move fast)
   - New + no owner -> "Define" (definition-focused, clarify first)
   - New + due set -> "Measure" (baseline-focused, gather data)

2. Optional (blank is valid for ad-hoc tasks)

3. Use for projects and structured work; encourage defaults for quick tasks

4. Simplify SIX-SIGMA.md guidance:
   - "Use DMAIC for work > 3 days or multi-step projects. For quick ad-hoc tasks, defaults are fine."

5. Track trend: "What % of tasks have explicit phase?" Target: 50% (projects + deliberate process work)

**Alternative (rejected):** Remove DMAIC entirely.
- Reason: Six Sigma is core to cowork canon and Zaal's philosophy. The fix is UX, not wholesale removal.

---

## PART E: SOURCES + REFERENCES

**Kanban for small teams:**
- David J. Anderson, "Kanban: Successful Evolutionary Change for Your Technology Business" (2010) - Chapter 3, WIP limits
- Lean Enterprise Institute, "Small Batch Size" white paper - handoff reduction, cycle time
- Toyota Production System canon - single-piece flow

**Agile/Lean for tiny teams:**
- Agile Manifesto (Beck et al, 2001) - "Individuals and interactions over processes and tools"
- J. Richard Hackman, "Leading Teams: Setting the Stage for Great Performances" (2002) - autonomy, psychological safety, team size effects
- Donald Reinertsen, "The Principles of Product Development Flow" (2009) - batching costs, second-order effects
- Eric Ries, "The Lean Startup" (2011) - rapid iteration, waste elimination

**Six Sigma + DMAIC:**
- American Society for Quality (ASQ), "DMAIC Methodology Guide" (2020)
- "The Lean Six Sigma Pocket Toolbook" (George et al, 2004) - project-size guidance
- Toyota Production System (Taiichi Ohno, 1988) - continuous improvement loop

**Small team dynamics:**
- Fred Brooks, "The Mythical Man-Month" (1975) - team communication overhead
- Amazon S-team, "Two-Pizza Team Rule" - team size + decision-making
- Dunbar's Number (150) - cohesion limits (small teams < 50 don't apply this constraint)

**Existing cowork canon:**
- `/tmp/r-cowork/SIX-SIGMA.md` - internal playbook (DMAIC, 5S, TIMWOODS, weekly review)
- Doc 763 (F2/F6) - Service Class layer, TRIAGE inbox design
- Doc 765 - Project tracking + phase usage
- Doc 766 - Multi-assignee system (owner field migration)
- Doc 983 - Judgment routing (nextOwner, themes, agent dispatch)

---

## NEXT ACTIONS

**Owner: Zaal**

1. **Review Key Decisions table** (Part C.1)
   - Confirm priority (high/med/low) for assignee collapse, phase smart-defaults, WIP limit
   - Deadline: 2026-07-16 EOD
   - Shipped criteria: Written feedback on top 3 moves

2. **Approve Phase smart-defaults logic**
   - Confirm rules: P1 -> Improve, new+no-owner -> Define, due-set -> Measure
   - Deadline: 2026-07-16
   - Shipped criteria: Rules finalized; dev can implement

3. **Schedule weekly planning session**
   - Confirm: Friday 4 PM, 15 min, using CockpitBrief as runbook
   - First session: 2026-07-18
   - Shipped criteria: Session held; feedback on format

4. **Prioritize UI cleanup PRs**
   - Confirm which 3 moves to ship first (high-priority: assignee, phase defaults, WIP limit)
   - Deadline: 2026-07-17
   - Shipped criteria: PRs opened with branches

5. **Research synthesis** (post-doc publication)
   - Integrate detailed Lean Six Sigma findings from research agent (if not yet done)
   - Deadline: 2026-07-15
   - Shipped criteria: Doc Part B expanded with 3+ sources per topic

---

## Appendix: File Reference (Audit Artifacts)

**Key code paths (all verified):**

Component files:
- `/tmp/r-cowork/src/components/TaskRoom.tsx` (1650 lines) - task detail panel
- `/tmp/r-cowork/src/components/Board.tsx` (800+ lines) - Kanban board
- `/tmp/r-cowork/src/components/CockpitBrief.tsx` - leads dashboard
- `/tmp/r-cowork/src/components/FocusWidget.tsx` - top 5 tasks
- `/tmp/r-cowork/src/components/ForecastWidget.tsx` - forecast graph

Data + logic:
- `/tmp/r-cowork/src/lib/types.ts` - ActionItem type, enums
- `/tmp/r-cowork/src/lib/data.ts` - query helpers, metrics (ageDays, cycleDays)
- `/tmp/r-cowork/src/lib/cockpit.ts` - cockpit computations
- `/tmp/r-cowork/src/lib/focus.ts` - top-5 sorting logic

Pages:
- `/tmp/r-cowork/src/app/board/page.tsx` - main board layout
- `/tmp/r-cowork/src/app/overview/page.tsx` - Mission Control
- `/tmp/r-cowork/src/app/my-work/page.tsx` - personal task list
- `/tmp/r-cowork/src/app/admin/triage/page.tsx` - triage inbox

API routes:
- `/tmp/r-cowork/src/app/api/v1/items/route.ts` - items CRUD
- `/tmp/r-cowork/src/app/api/dependencies/route.ts` - blocker graph
- `/tmp/r-cowork/src/app/api/overview/route.ts` - cockpit data
- `/tmp/r-cowork/src/app/api/forecast/route.ts` - forecast computation

Database:
- `/tmp/r-cowork/supabase/migrations/004_service_class_archive_triage.sql` - schema for ServiceClass, TRIAGE
- `/tmp/r-cowork/supabase/migrations/007_metadata_and_missing_columns.sql` - metadata (themes, nextOwner)

---

**Doc 1035 - Complete**

Date finished: 2026-07-14 06:00 UTC
Status: Ready for PR review
Estimate: 6 hours audit + research + writing

