---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-05-26
related-docs: 761, 762
original-query: "kanban board + project management best practices for small async teams - ways to improve ZAOcowork tracker"
tier: STANDARD
---

# 763 — Kanban best practices for small async teams (ZAOcowork improvements)

> **Goal:** Identify 5-8 concrete improvements ZAOcowork should adopt from how Linear, Plane, Shortcut, and the 2026 ProKanban Guide actually run small async dev teams. Avoid feature-creep; flag what NOT to copy.

## Key Decisions

| # | Decision | Why | Effort |
|---|----------|-----|--------|
| 1 | ADOPT Work Item Age as the primary flow signal, replacing nothing | ProKanban Guide 2025 dropped explicit WIP-limit requirement; aging cards are a better leading indicator than column counts (Brown/Thrivve, 2025). ZAOcowork already calls aging out in `ageDays()` but doesn't sort/highlight by it. | 2 hr - sort columns by age desc, badge cards >14d red |
| 2 | ADOPT Service Classes (Standard / Fixed-date / Expedite / Intangible) as a layer above current `priority` (P1/P2/P3) | Priority numbers conflate cost-of-delay shape with severity. Service classes give shape (linear / step-function / immediate / accelerating). Standard Kanban Method since 2010, used by every modern tracker. | 4 hr - add `serviceClass` enum, expedite swimlane at top, 1-card max enforcement |
| 3 | ADOPT Git-as-truth: PR open auto-moves task TODO→WIP, PR merge auto-moves WIP→DONE | dev.to/mdenda 2026: "Git is the truth. Boards lie because humans forget; PRs record themselves." Removes 80% of manual drag-drops. Requires GitHub webhook + a task-id convention in PR titles. | 6 hr - webhook handler in /api/github, slug parser |
| 4 | ADOPT auto-archive of DONE items >30 days from active views | Linear's quiet-win feature. Keeps "DONE" column scannable; full history still queryable. ZAOcowork's DONE column on a busy day has 50+ rows nobody reads. | 1 hr - `archivedAt` field + filter |
| 5 | ADOPT explicit Definition of Done per column, surfaced as column header tooltip | Modelithe 2026 finding #3: kanban fails most often from undocumented column semantics. ZAOcowork has implicit DoD ("DONE means lead approved") but workers can't see it. | 30 min - 4 short strings, render on hover |
| 6 | ADOPT "triage" intake separate from main board | Linear's triage cuts standup 30-40% (StackCompare 2026). New items from /todo NL parser, Telegram bot, /meeting, research-doc dispatcher land in Triage first; lead routes to a brand+owner before they hit the kanban. | 4 hr - new STATUS=`TRIAGE`, /admin-or-lead-only acceptance UI |
| 7 | ADOPT command palette (Cmd+K) global navigation | Already partially built for QuickAdd; extend to issue search, status set, owner reassign, brand filter. Linear's signature feature; ~10 min/day per dev (Athenic). | 6 hr - extend existing Cmd+K modal with command list |
| 8 | DO NOT adopt explicit WIP limits per column (yet) | Small async team (4-7 people) with high context-switch cost: hard caps create false-control + frustrate Iman when expedite work shows up. Use Work Item Age signals (#1) instead. Revisit at team size 10+. | n/a (negative decision) |

These ship in 4 small PRs (#1+#5 together, #2 alone, #3 alone, #4+#6+#7 together) over 2 weeks - not one big-bang refactor.

---

## What ZAOcowork already has (the good)

Inventory taken from `/Users/zaalpanthaki/Documents/ZAOcowork/src/lib/types.ts` + `src/components/Board.tsx` at HEAD 9fec05f:

| Feature | State |
|---------|-------|
| 4-column kanban (TODO/WIP/BLOCKED/DONE) | Live |
| Owner + Priority (P1-P3) + Category | Live |
| Brand tags (multi-brand per task) | Live (Phase D shipped 2026-05-26) |
| DMAIC phase tag (Define/Measure/Analyze/Improve/Control) | Live but barely used |
| Lead/worker role + approval queue (worker DONE goes to pending review) | Live (Phase A) |
| Activity log per task | Live |
| Comments + Updates threads | Live |
| Claim feature (claimable=true for unowned tasks) | Live |
| AI Assistant tab (read-only chat) | Live |
| Bulk ops (multi-select reassign/delete/retag) | Live (Phase C) |
| QuickAdd: inline + Cmd+K + voice + NL parse | Live (Phase B) |
| Per-tab brand counters | Live (Phase B) |
| Audit log viewer | Live (Phase E - schema applied 2026-05-26) |

This is already richer than Trello, comparable to a stripped Linear. The improvements below are NOT "build a bigger tool" - they're "tune what's there to match how small async teams actually work in 2026."

---

## Findings

### F1. Work Item Age, not column count, is the modern flow signal

The 2025 ProKanban Guide dropped the explicit WIP-limit requirement. The reason isn't that WIP doesn't matter - it's that "limit=3" gives teams a false sense of control while the deeper signal (cards aging in place) goes unnoticed. Modern guidance (Brown 2025, Uplevel 2026): walk the board right-to-left starting with the oldest item, asking "what's stopping this from finishing?"

ZAOcowork has `ageDays()` defined and shows the relative age on cards, but doesn't:
- Sort columns by age descending (oldest at top)
- Visually escalate cards past the 85th-percentile cycle time (red border, animated pulse)
- Surface "aging without movement >5 days" as a board-level alert

**Fix:** ~2 hours. New filter chip "Aging" (already exists, currently hardcoded to >14d). Promote to default sort within each column. Add a stale-task badge for items with no `activity[]` entries in 7+ days.

### F2. Service Classes beat priority numbers

P1/P2/P3 mixes two orthogonal things: severity ("how bad") and shape-of-cost-of-delay ("how does the badness grow over time"). The 2026 Kanban Method canon uses 4 service classes:

| Class | Cost-of-delay shape | Typical mix | Cap |
|-------|--------------------|-----|-----|
| Standard | Linear with time | 60% | no cap |
| Fixed-date | Step function at deadline | 20% | no cap (but visible date) |
| Expedite | Immediate, high cost (incident, broken auth) | 10% | **1 card max workspace-wide** |
| Intangible | Accelerating (tech debt, refactor) | 10% | track ratio, alarm if 0 for 3 weeks |

ZAOcowork's `priority` field maps cleanly to P1=Expedite, P2=Standard, P3=Intangible+Fixed-date jumbled. Adding an explicit `serviceClass: Standard | FixedDate | Expedite | Intangible` field + a top "Expedite" swimlane that can only hold 1 card gives the lead a hard signal: when Expedite is non-empty, the team stops pulling Standard work.

**Fix:** ~4 hours. Migration 004 adds `service_class` column. Top swimlane in Board.tsx between filter bar and column grid. Constraint enforced on `quickCreate` + `bulkSetServiceClass`.

### F3. Git is the truth; the board lies whenever humans drag

Most-cited 2026 source (dev.to/mdenda, 2026-04-29 + Plane AI docs): a board column is fiction unless someone can verify the state without checking memory. ZAOcowork's `WIP` state is human-asserted today - a worker drags a card to WIP when they pick it up. They forget. The card sits in TODO with a half-merged PR.

Fix: GitHub Action / webhook that:
1. On PR open with title matching `cowork#<id>` → set task status WIP, append activity `pr_opened`
2. On PR merge → set status DONE (or pending-review if requiresApproval)
3. On PR close-no-merge → leave alone, append activity `pr_closed_unmerged`

The Telegram bot already speaks to `tasks` table - same write path. Estimate ~6 hours including testing.

Bonus: link the PR URL on the card so a click jumps from kanban to diff. Linear does this; takes 4 lines.

### F4. Auto-archive DONE items

Linear's quietest feature: items completed >30 days ago vanish from active views, still searchable. ZAOcowork's DONE column on busy days has 50+ rows that nobody re-reads. They slow page renders and noise up filter results.

**Fix:** ~1 hour. Add `archivedAt: string | null` to `ActionItem`. Hide from default Board view if `archivedAt < 30d ago`. New filter chip "Show archived." A nightly cron (already running for staleness alerts) sets the field.

### F5. Definition of Done belongs on the column header

Modelithe 2026's top kanban failure mode: "Done means whatever each engineer decides it means." ZAOcowork has an implicit DoD per role (worker DONE → pending review; lead DONE → really done). But this is encoded in code, not surfaced.

**Fix:** ~30 min. Tooltip on each column header:
- **TODO**: "Has owner + priority. Not yet started. Pull when free."
- **WIP**: "Actively being worked on. PR open or work in flight. Owner committed within last 3 days."
- **BLOCKED**: "Cannot progress without external input. Has a comment naming the blocker. Owner pings the blocker daily."
- **DONE**: "Lead approved (or workflow auto-approved). PR merged + deployed. Acceptance verified."

### F6. Triage intake separate from main board

Linear's triage view is a shared inbox - new items from external sources (bug reports, email-to-issue, meeting captures) land there with no team/owner/priority yet. Lead spends 5 min routing, not 5 min building from scratch.

ZAOcowork has FOUR external writers: NL `/todo` parser, Telegram bot, `/meeting` skill, research-doc dispatcher. Each writes directly to TODO with guessed owner/brand/priority. The guesses are often wrong, which then needs hand-cleanup.

**Fix:** ~4 hours. New status `TRIAGE`. All external writers default to TRIAGE not TODO. A `/admin/triage` route (lead+admin only) lists triage items with quick-route buttons (owner picker, brand picker, priority picker, "send to TODO"). Saves Zaal/Iman ~5 min/day each based on similar setups.

### F7. Command palette as universal navigation

QuickAdd has Cmd+K for new tasks. Linear's Cmd+K does EVERYTHING: search, navigate, set status, reassign, filter. Athenic 2025: "keyboard shortcuts save ~10 min/day per developer."

ZAOcowork already has the modal shell. Extending it from "add task" to a command list with fuzzy search costs ~6 hours and unlocks the Linear-power-user experience without rebuilding from scratch.

### F8. Don't copy AI-everywhere

Plane AI has a Sidecar that can run agentic write operations ("move all blocked >5 days to Needs Discussion"). Linear AI does triage suggestions. Height AI does auto-assignment.

ZAOcowork's Assistant tab is intentionally read-only (chat-style, board-aware). DO NOT make it write. Reasons:
- 4-7 person team: cost of an LLM mis-route > value of automation
- Auto-assignment based on title text is brittle; manual is fast
- The board IS the source of truth; agentic edits create audit-log noise

Re-evaluate this stance at team size 12+. Today the read-only Assistant + Audit log is the right shape.

---

## Comparison: ZAOcowork vs the modern stack

| Feature | ZAOcowork (today) | Linear | Plane (OSS) | Shortcut |
|---------|-------------------|--------|-------------|----------|
| Self-hosted | Vercel + Supabase (effectively) | No | Yes | No |
| Cmd+K | Partial (QuickAdd only) | Full | Basic | Good |
| Service classes | No (priority numbers) | Partial (labels) | Yes | Yes |
| Work Item Age signal | Partial (age shown, not sorted) | Yes (aging view) | Yes | Yes |
| Triage intake | No (everything → TODO) | Yes (Triage Intelligence + LLM) | Yes (intake forms) | Yes |
| Git auto-state-transitions | No | Yes | Yes | Yes |
| Auto-archive DONE | No | Yes (30d default) | Configurable | No |
| Per-column DoD policy | Implicit | Column descriptions | Column descriptions | Column descriptions |
| Multi-brand tags | Yes (rare in OSS) | Labels only | Labels only | Labels only |
| Approval queue (worker→lead) | Yes (rare) | No | No | No |
| AI assistant | Read-only, board-aware | Triage AI | Sidecar (read+write) | None native |
| Free tier ceiling | Unlimited (self-owned) | 250 issues / 10 users | Unlimited self-hosted | 10 users unlimited |
| Estimated cost at 7 users | ~$20/mo (Vercel + Supabase) | $56/mo Standard | $0 self-host | $59.50/mo Team |

ZAOcowork's unique edges (multi-brand, approval queue, audit log) are worth keeping even at the cost of velocity vs Linear. The catch-up items above (F1-F7) close the perceived-quality gap without abandoning what's working.

---

## What NOT to do

| Anti-pattern | Why it would hurt | Source |
|--------------|-------------------|--------|
| Add explicit WIP limits to TODO/WIP/BLOCKED columns | Hard caps in a 4-7 person team punish legitimate expedite work + create gaming behavior ("raise the limit") | Brown 2025, ProKanban Guide 2025 |
| Add "Ready for QA" or "Code Review" columns | No dedicated QA role at ZAO; PR review IS the QA. Adding the column means cards skip it (always). dev.to/mdenda 2026: "if a column is skipped, remove it" | dev.to/mdenda 2026 |
| Make the AI Assistant write | Agentic LLM edits + 4-person team = wrong-action recovery cost > automation savings | Architectural call, doc 762 finding |
| Adopt Scrum sprints / cycles | Async-first team without timezone overlap: timeboxing creates artificial pressure + leftover work. Continuous flow + replenishment is the better model | StackCompare 2026, HN consensus thread 41618643 |
| Add story-point estimation | 4-person team with cross-role tasks: estimation overhead > scheduling value. Use cycle time + age, not points | Uplevel 2026 |
| Copy Linear's fixed status model | Linear forces Backlog → Todo → In Progress → Done. ZAOcowork's BLOCKED is a first-class flow signal worth keeping. Don't lose it. | Linear vs Shortcut comparison, IdeaPlan 2026 |
| Self-host on the VPS for "control" | Vercel + Supabase already gives you uptime + edge + auto-deploy. Self-hosting trades 2 days of setup for $20/mo savings | Plane vs Linear OSS analysis |

---

## Two-dimension model (most important conceptual fix)

dev.to/mdenda 2026 makes the clearest argument: most boards collapse two orthogonal axes into one horizontal flow.

**Axis 1 (code-flow, horizontal):** `TODO → WIP → DONE`. Maps directly to PR / commit / merge state. Git is canonical here.

**Axis 2 (task-flow, lateral exits):** `BLOCKED`, `NEEDS_SPEC`, `WAITING_ON_CLIENT`. These are paused states; the work hasn't moved backward, just stopped. A task in BLOCKED still has a Git branch open.

ZAOcowork's current model puts BLOCKED as an inline column between WIP and DONE which mixes the two axes. A future refactor: move BLOCKED to a lateral lane (top swimlane), keep TODO/WIP/DONE as the linear flow. Cards in BLOCKED are visually outside the main pipe. Recommended for a v3 board redesign (not urgent, but a clean direction).

---

## Also See

- [Doc 761 - pre-Phase audit](../761-zaocowork-repo-audit-may26/) (missing from disk; findings re-derived from session memory)
- [Doc 762 - post-Phase A-E audit](../762-zaocowork-post-phase-audit-may26/)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR: aging sort + stale-task badge (F1) + per-column DoD tooltips (F5) | Zaal | PR | 2026-05-28 |
| PR: serviceClass field + Expedite swimlane (F2) | Zaal | PR | 2026-05-30 |
| PR: GitHub webhook for PR→task auto-transitions (F3) | Zaal | PR | 2026-06-02 |
| PR: auto-archive DONE (F4) + Triage status (F6) + global Cmd+K (F7) | Zaal | PR | 2026-06-05 |
| Re-evaluate WIP-limits decision at team size 10+ | Iman | Review | 2026-07-30 |
| /admin Brand mgmt UI: tag service class colors on cards | Iman | Eng review | 2026-06-10 |
| Bonfire push: distill this doc into 2-3 episodes about async kanban patterns | Zaal | Knowledge graph | 2026-05-28 |

---

## Sources

- [WIP Without Limits? Actually, That's the Point - Paul Brown / Thrivve, 2025-05-25](https://medium.com/thrivve-partners/wip-without-limits-actually-thats-the-point-f87a6f5b68ae) [FULL]
- [Why Workflows Break as Teams Scale (Fix Guide) - Futuramo, 2026-04-20](https://futuramo.com/blog/why-workflows-break-as-teams-grow-and-how-to-fix-it/) [FULL]
- [Why Kanban Fails: 7 Most Common Reasons - Modelithe, 2026-04-26](https://modelithe.com/284?pn=why-kanban-fails) [FULL]
- [Your Kanban board is lying to you (and Git knows it) - dev.to/mdenda, 2026-04-29](https://dev.to/mdenda/your-kanban-board-is-lying-to-you-and-git-knows-it-1hof) [FULL]
- [WIP Limits for Engineering Teams: A Practical Guide - Uplevel, 2026-04-22](https://uplevelteam.com/blog/wip-limits) [FULL]
- [Kanban Methodology in Software Development: 2026 Guide - FWC Tecnologia](https://fwctecnologia.com/en/blog/post/kanban-methodology-2026) [FULL]
- [How to Implement Scrumban in 2026 Using ChatGPT - Routine, 2026-03-19](https://routine.co/blog/posts/implement-scrumban-chatgpt) [FULL]
- [Effective Strategies for Setting WIP Limits - Multiboard, 2025-08-08](https://www.multiboard.dev/posts/effective-setting-wip-limits) [FULL]
- [Linear Alternatives for Startups in 2026 - ToolPick, 2026-05-03](https://www.toolpick.dev/blog/linear-alternatives-for-startups-2026) [FULL]
- [Linear vs Shortcut: Which Issue Tracker (2026) - IdeaPlan](https://www.ideaplan.io/compare/linear-vs-shortcut) [FULL]
- [Linear vs Jira vs Shortcut Pricing 2026 - StackCompare](https://stackcompare.net/linear-vs-jira-vs-shortcut-dev-project-management-pricing-2026/) [FULL]
- [Linear vs Plane (2026) - MakerStack](https://makerstack.co/compare/linear-vs-plane/) [FULL]
- [Plane vs Linear 2026: Self-Host or SaaS? - OSSAlt](https://ossalt.com/guides/plane-vs-linear-2026) [FULL]
- [The 12 Best Linear Alternatives in 2026 - Storyflow](https://storyflow.so/blog/best-linear-alternatives-2026) [FULL]
- [Linear Triage Intelligence docs](https://linear.app/docs/triage-intelligence) [FULL]
- [How we built Triage Intelligence - Linear](https://linear.app/now/how-we-built-triage-intelligence) [FULL]
- [Linear vs Height vs Plane: PM for AI Teams - Athenic, 2025-09-26](https://getathenic.com/blog/linear-vs-height-vs-plane-project-management) [FULL]
- [Plane AI Pi Chat docs](https://docs.plane.so/ai/pi-chat) [FULL]
- [How EPD teams are getting more done with Plane AI - Plane, 2026-02-12](https://plane.so/blog/how-epd-teams-are-getting-more-done-with-plane-ai) [FULL]
- [HN: Real-world Kanban forces empty slots discussion](https://news.ycombinator.com/item?id=15922746) [FULL]
- [HN: I Fucking Hate Jira (2022) thread](https://news.ycombinator.com/item?id=39374797) [FULL]
- [HN: Kanban as single source of truth for small teams](https://news.ycombinator.com/item?id=41618643) [FULL]

Reddit searches returned zero results (likely indexing gap) - HN threads above served as the community-sentiment source per Hard Req #7.
