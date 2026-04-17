# 425 — ZAOstock Dashboard UI: Six Sigma + Modern PM Tool Patterns

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Inspire the ZAOstock `/stock/team` dashboard redesign with battle-tested patterns from Six Sigma / Lean visual management (Kanban origin, Andon, Gemba, 5S, Pareto) and modern PM tools (Linear, Notion, Plane, Monday, Airtable). Land on a Year-1 Kanban-first redesign that stays simple.

---

## Key Decisions — Year 1 (Ship by Tuesday Apr 21)

| Decision | Recommendation |
|----------|----------------|
| **Drag-and-drop library** | USE `@dnd-kit/core` + `@dnd-kit/sortable` — framework-agnostic, TypeScript-first, mobile touch native, ~30kb gzip, actively maintained, accessible by default. |
| **Kanban tabs** | ADD Kanban view toggle (list ↔ board) on Sponsors, Artists, Todos. Keep Timeline/Budget/Notes/Volunteers as list or purpose-built layouts. |
| **Mobile kanban pattern** | USE horizontal swipe scroll between columns (Trello mobile pattern). Column width = 85vw on mobile so next column peeks. |
| **At-a-glance status (Andon)** | MAKE status pills BIGGER + color-coded stripe on card left edge — green (done/paid/confirmed), yellow (in progress / in talks), red (blocked / overdue / declined). Visible from 3ft away. |
| **Pareto focus card** | ADD "Top 3 need attention" card at top of each tab — Sponsors: 3 oldest "contacted" without reply · Artists: 3 overdue in "contacted" stage · Todos: 3 overdue. |
| **WIP limits (Kanban origin)** | DISPLAY soft caps per column: Sponsors "in_talks" > 8 shows yellow warning. Forces focus on closing, not hoarding leads. |
| **Keyboard shortcuts** | ADD cmd+K command palette (new sponsor / new artist / switch tab / search) — Linear-style. Ship Year 1 for Zaal, optional for others. |
| **Multi-view toggle** | DEFER Airtable-style list/board/calendar/gallery switcher to Year 2. Too much scope now. |

## Key Decisions — Year 2+ (File for 2027)

- **Supabase realtime** — live cursors + card updates when teammates drag (needs `supabase.channel()` + Postgres replication)
- **Notion-style inline edit everywhere** (click any field, edit in place, save on blur)
- **Gallery view for Artists tab** — grid of artist cards with photos + socials preview
- **Calendar view for Timeline** — month grid with milestones plotted
- **Saved views per member** — each teammate saves their favorite filter/sort combo
- **@-mentions in notes** — tag teammates in meeting notes, they get a notification ping
- **Bulk select + bulk edit** — shift-click 5 sponsors, change status all at once
- **Sub-issues / child cards** — break down large todos into subtasks (Linear pattern)
- **Slack-style activity feed** — who changed what, visible per card + per tab

## Six Sigma / Lean Visual Management → Digital UI Translation

Source of the **Kanban** pattern is Toyota Production System — literally the same word, same purpose. Lean / Six Sigma invented most of the visual management vocabulary we use today. Map each to concrete UI moves:

| Lean / 6σ Tool | Original Use | Dashboard Translation |
|----------------|--------------|----------------------|
| **Kanban board** | Cards pulled through workflow stages, WIP limits per stage | Drag cards between status columns, show count per column with soft-cap warnings |
| **Andon lights** | Green/yellow/red status lamps above machines for at-a-glance state | Color-coded left stripe on every card; tab header badge red if any red cards |
| **Gemba board** | Daily standup focal point: current state, problems, actions | Home tab Next Action card already does this — keep it prominent |
| **Value Stream Map** | Visualize full end-to-end flow | Timeline tab grouped by month; Sponsor funnel view showing $ at each stage |
| **Pareto chart** | 80/20 focus: which 20% of issues drive 80% of impact | "Top 3 need attention" card at top of each tab |
| **5S visual workplace** | Sort, Set, Shine, Standardize, Sustain — everything has a place | Consistent card layout across tabs; no orphan info; empty states everywhere |
| **A3 report** | One-page problem framing | Expanded card view = one scrollable view with all context, no hunting |
| **DMAIC phases** | Define, Measure, Analyze, Improve, Control | Sponsor pipeline IS DMAIC: lead (Define) → contacted (Measure) → in_talks (Analyze) → committed (Improve) → paid (Control) |
| **Takt time** | Rate of work required to meet demand | Show "days to festival" with pace-required indicator ("need X sponsors/week at current rate") |
| **Heijunka (level loading)** | Balance work across team | Show per-member workload count on Team tab |

## Modern PM Tool Patterns (Ranked by Steal Value for ZAOstock)

| Tool | Pattern to Steal | Cost to Implement |
|------|-----------------|-------------------|
| **Linear** | Keyboard-first (cmd+K), dense info, gradient status pills, left-border status stripe | Low — cmd+K library is 2hr of work |
| **Notion** | Multi-view per database (list/board/calendar/gallery toggle), inline edit | High — defer to Year 2 |
| **Plane (OSS)** | Cycles (sprints), modules, views system, saved filters | Medium — model cycles as "meeting weeks" |
| **Monday** | Heavy color-coding, group-by-any-property | Low — just add colors |
| **Asana** | Timeline/Gantt view, dependencies | High — defer |
| **Trello** | Cover images on cards, power-ups, label colors | Low — cover = artist photo |
| **Airtable** | Field types, formula fields, gallery/kanban/calendar toggle | Too much for ZAOstock scope |

## Concrete Comparison: 3 Library Options for Kanban

| Library | Size (gzip) | Mobile touch | A11y | Active? | Fits ZAOstock? |
|---------|------------|--------------|------|---------|----------------|
| `@dnd-kit/core` + `/sortable` | ~30kb | ✅ native | ✅ ARIA built-in | ✅ very | **USE** |
| `react-beautiful-dnd` (Atlassian) | ~40kb | ⚠ needs polyfill | ✅ | ⚠ maintenance mode | SKIP |
| `@hello-pangea/dnd` (beautiful-dnd fork) | ~40kb | ⚠ | ✅ | ✅ | Backup option |
| `framer-motion` Reorder | built-in | ✅ | partial | ✅ | Too limited (vertical only) |

Winner: **`@dnd-kit`**. Mobile touch works out of the box (CLAUDE.md requires mobile-first). TypeScript native. 13k+ GitHub stars.

## Suggested Kanban Column Structure per Tab

**Sponsors tab (6 columns):**
`Lead` → `Contacted` → `In Talks` → `Committed` → `Paid` → `Declined` (collapsed by default)

Card shows: name · track badge (local/virtual/ecosystem) · $ committed · owner avatar · last-contacted days. Drag changes status. WIP soft-cap: `In Talks` > 8 warns yellow.

**Artists tab (6 columns):**
`Wishlist` → `Contacted` → `Interested` → `Confirmed` → `Booked` → `Declined` (collapsed)

Card shows: name · genre · city · set order (if confirmed) · travel badge · outreach owner. Drag changes status. WIP cap: `Confirmed + Booked` = 10 max (the lineup size). Show counter: `7/10 locked`.

**Todos tab (3 columns):**
`To Do` → `In Progress` → `Done` (auto-collapse done >7d old)

Simplest kanban. Card shows: title · owner avatar · due date if set. WIP cap: `In Progress` > 3 per person warns.

## Mobile Kanban UX (Critical — CLAUDE.md mobile-first)

Problem: 6 columns × 280px = 1680px, doesn't fit on 390px phone.

Three patterns ranked:

| Pattern | UX feel | Implementation |
|---------|---------|----------------|
| **Horizontal swipe (RECOMMENDED)** | Trello-native, known gesture | `overflow-x-auto snap-x snap-mandatory`, columns `w-[85vw] shrink-0 snap-start` |
| Column switcher dropdown | Feels like list, loses kanban advantage | `<select>` chooses column, kanban becomes single list |
| Stack all columns vertically | Kills kanban intent | Don't do this |

Detail: on mobile use `touch-action: none` on draggable cards to prevent scroll conflict. Test on real iPhone — dnd-kit has known friction with iOS Safari scroll.

## Six Sigma Card: "Pareto Top 3" (Specific Spec)

Above the kanban on each tab, render a card titled "Top 3 need attention":

**Sponsors logic:**
1. Status = `contacted` AND last_contacted_at > 14 days ago
2. Status = `in_talks` AND last_contacted_at > 7 days ago
3. Status = `committed` AND amount_paid < amount_committed AND created_at > 30d ago

**Artists logic:**
1. Status = `contacted` AND created_at > 10 days ago (stale)
2. Status = `interested` AND no follow-up in notes
3. Status = `confirmed` AND needs_travel = true AND travel_from is empty

**Todos logic:**
1. `in_progress` AND updated_at > 7 days ago (stalled)
2. `todo` AND creator != owner AND created_at > 14d (forgotten)
3. `todo` AND owner is null (unassigned)

Each Pareto row clickable → opens that card in kanban with flash highlight.

## ZAO Ecosystem Integration

**Code files to touch (Year 1 scope):**

- `src/app/stock/team/SponsorCRM.tsx` — add view toggle, kanban mode
- `src/app/stock/team/ArtistPipeline.tsx` — same
- `src/app/stock/team/TodoList.tsx` — same
- **NEW:** `src/app/stock/team/KanbanBoard.tsx` — shared primitive: columns, draggable cards, drop handlers, Pareto card, WIP limits
- **NEW:** `src/app/stock/team/ParetoCard.tsx` — the "Top 3 need attention" primitive
- `src/app/stock/team/Dashboard.tsx` — add cmd+K command palette
- `src/app/stock/team/PersonalHome.tsx` — upgrade Andon colors (bigger pills, border stripes)

**Dependencies to add:**

```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# Optional for cmd+K
npm i cmdk
```

**Supabase wiring:**

Status changes via drag already hit existing PATCH endpoints (`/api/stock/team/sponsors`, etc.). Add optimistic update: move card in UI immediately, API in background, revert on failure. Pattern already used in existing components.

**Mobile test checklist:**
- [ ] Swipe between columns doesn't trigger page scroll
- [ ] Drag-hold on card prevents swipe during drag
- [ ] Drop zones are 44px+ tall (Apple HIG touch target)
- [ ] Column headers sticky during vertical scroll within column

## Risks & What NOT to Do

| Risk | Mitigation |
|------|-----------|
| Kanban becomes toy — teammates drag cards but don't actually change behavior | Pair with Pareto card + WIP limits so it stays operationally meaningful |
| Mobile drag-drop is janky in iOS Safari | Test on real device during Saturday UI polish (already a prep milestone) |
| Feature creep pulling Notion/Linear clones in | Year 1 = Kanban + Pareto + Andon. Everything else parked |
| Realtime sync complexity blows up scope | Defer Supabase realtime to Year 2. Page refresh on focus is fine |
| cmd+K adds complexity no one uses except Zaal | Ship for Zaal only, hide it behind `?palette=1` flag Year 1 |
| Breaking existing list view while shipping kanban | Keep BOTH views, default to list, Zaal opts in via view toggle |

## Next Actions — Integration with Existing Prep

Slot into the existing Fri-Mon prep:

- **Fri 4/17 (today)** — spike: install `@dnd-kit`, build hello-world draggable on a branch. 1hr timebox.
- **Sat 4/18** — build shared `<KanbanBoard>` primitive. Wire to Sponsors tab first.
- **Sun 4/19** — apply to Artists + Todos tabs. Mobile QA pass.
- **Mon 4/20** — Pareto cards on all 3 tabs. Andon visual upgrade pass.
- **Tue 4/21** — Demo kanban at meeting. Get team reactions.

Deferred to Year 2 review (Sept 2026): cmd+K, realtime, multi-view, gallery, calendar, saved views, @-mentions.

## Sources

- [Visual Management Tools — SixSigma.us](https://www.6sigma.us/project-management/visual-management/)
- [Visual Management complete guide — SixSigma.us](https://www.6sigma.us/manufacturing/operational-excellence-with-visual-management-tools-a-complete-guide/)
- [Gemba Board guide — SixSigma.us](https://www.6sigma.us/six-sigma-in-focus/gemba-board-visual-management-tools/)
- [Digital Andon + Visual Factory — TeepTrak](https://teeptrak.com/en/digital-andon-visual-factory-oee-management/)
- [Andon Board glossary — LSSSimplified](https://lsssimplified.com/lean-six-sigma-glossary/andon-board/)
- [Visual Management Boards — iSixSigma](https://www.isixsigma.com/methodology/visual-management-boards/)
- [Drag-and-drop UI best practices — LogRocket](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [Build a Kanban with dnd-kit — LogRocket](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/)
- [dnd-kit official site](https://dndkit.com/)
- [Plane — open-source Linear/Jira alternative (46k stars)](https://github.com/makeplane/plane)
- [Top 6 OSS project management tools 2026 — Plane blog](https://plane.so/blog/top-6-open-source-project-management-software-in-2026)
- [react-dnd-kit-tailwind-shadcn-ui reference implementation](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui)
- [Build Kanban with Shadcn — Marmelab Jan 2026](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html)
- [Linear Docs](https://linear.app/docs)
- [Notion UI design pattern critique — Medium](https://medium.com/@yolu.x0918/a-breakdown-of-notion-how-ui-design-pattern-facilitates-autonomy-cleanness-and-organization-84f918e1fa48)
- [2026 mobile UI patterns — Muzli](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/)

## Related ZAO Research

- [270 — ZAOstock planning](../270-zao-stock-planning/)
- [274 — ZAOstock team deep profiles](../274-zao-stock-team-deep-profiles/)
- [289 — ZOE dashboard chat UX patterns](../../289-zoe-dashboard-chat-ux-patterns/)
- [418 — Birding Man Festival Analysis](../418-birding-man-festival-analysis/)
