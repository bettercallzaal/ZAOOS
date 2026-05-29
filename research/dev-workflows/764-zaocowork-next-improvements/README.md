---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-05-27
related-docs: 761, 762, 763
original-query: "research online what else we can do to improve our current setup"
tier: STANDARD
---

# 764 - ZAOcowork next improvements (post Phase F)

> **Goal:** Identify the next round of high-leverage moves now that doc 763 Phase F (7 features + admin cleanup) has shipped. Focus on what closes the biggest gaps in async coordination + delivery forecasting. Skip the kanban patterns covered in 763.

## Key Decisions

| # | Decision | Why | Effort |
|---|----------|-----|--------|
| 1 | ADOPT throughput-based forecasting (no story points) | Count completed-per-week from existing data. Monte Carlo gives "70% chance of done by X / 85% by Y" honesty - matches actual delivery (Vacanti/Magennis evidence, CodePulse 2026). Zero estimation overhead because completions are recorded by Git. | 6 hr - cron + simulator + dashboard widget |
| 2 | ADOPT activity feed at /admin/feed showing recent events across all tasks | Linear's Insights + Plane's intake trends prove "one URL where I see what changed" cuts standup-replacement noise. Different from notifications - feed is browsable, notifications are interruptive. | 4 hr - reads audit_logs + activity[] arrays |
| 3 | ADOPT per-channel response-time SLA grid (doc + UI badge) | Cadence + RemoteWorkGeek 2026 unanimous: async only works when "respond within X" is published. ZAOcowork has Telegram + in-app comments + chat assistant - no published SLA. Grid eliminates "are you ignoring me" anxiety. | 30 min - doc in README + small footer chip on /chat |
| 4 | ADOPT external writers default to TRIAGE (close F6 loop) | F6 shipped the inbox UI but the Telegram bot + /meeting + /todo NL parser still write to TODO. One bot config change + one /todo flag closes the loop. Until that lands, the TRIAGE inbox stays empty. | 2 hr - bot src/actions-store.ts + agent redeploy |
| 5 | ADOPT video-walkthrough URL field per task | Loom is the 2026 "explain this faster than typing" standard (RemoteWorkGeek). One URL field on ActionItem + a small video icon on cards. Workers attach a 30-sec Loom instead of writing 5 paragraphs. | 1 hr - field + UI |
| 6 | ADOPT weekly throughput email digest to leads | Cadence 2026 + Linear Insights: lead read 5-line email "X shipped this week, Y blocked, Z stale" in 30 sec instead of pulling reports. Cron job + simple SQL. | 3 hr - cron + mail (Resend or Mailtrap) |
| 7 | ADOPT bounded AI write capability via approval queue | Phase F kept AI Assistant read-only. Limited writes (suggest brand tags / suggest route / suggest similar) appear as PROPOSALS in the audit log and admin clicks approve. Liz-tracker pattern - LLM can propose, human approves. | 6 hr - actions w/ status=proposed + admin UI |
| 8 | DO NOT adopt story points or velocity-in-points | Vacanti/Magennis evidence: throughput beats story points for accuracy. ZAOcowork at 4-7 people has no estimation ROI. Stay throughput-only. | n/a (negative decision) |
| 9 | DO NOT add a 5th external comms tool | Cadence 2026: most teams ship on Slack + Notion + GitHub. ZAOcowork already has Telegram + in-app + chat assistant. Adding Discord/Slack/Loom would fragment. Keep stack tight; use existing surfaces. | n/a |

These ship in 4 small PRs over the next 2 weeks - not big-bang.

---

## Current state (post Phase F)

| Capability | Status | Source |
|------------|--------|--------|
| Kanban TODO/WIP/BLOCKED/DONE | Shipped | Original |
| Brand tabs (URL-scoped) | Shipped | PR #15 |
| Per-tab counters | Shipped | PR #16 |
| QuickAdd: inline + Cmd+K modal + voice + NL parse | Shipped | PR #16 |
| Cmd+K Find (search + open task) | Shipped | PR #21 |
| Admin: Users CRUD | Shipped | PR #16 |
| Admin: Brands DB-driven | Shipped | PR #18 |
| Admin: Bulk task ops (multi-select) | Shipped | PR #17 |
| Admin: Audit log viewer | Shipped | PR #19 |
| Admin: Triage inbox | Shipped | PR #21 |
| Admin: Cleanup w/ note field | Shipped | PR #23 |
| Service classes + Expedite swimlane | Shipped | PR #21 |
| Stale badge + DoD tooltips | Shipped | PR #21 |
| Auto-archive DONE >30d | Shipped | PR #21 |
| GitHub webhook PR -> task transitions | Shipped (dormant, needs secret) | PR #21 |
| Telegram bot (basic CRUD via DM) | Shipped | pre-this-session |
| AI Assistant tab (read-only) | Shipped | pre-this-session |

What ZAOcowork doesn't have that the modern stack does:
- Reporting / dashboards / throughput charts
- Activity feed (separate from notifications)
- Real-time notifications (only in-page badges)
- Published response-time SLAs
- Video walkthroughs per task
- Capacity / delivery forecasting
- Bounded AI write capability
- Mobile-first card view (PWA installs but card UX is desktop-shaped)

---

## Findings

### F1. Throughput-based forecasting (no story points)

The 2026 consensus across CodePulse, Vacanti, ProKanban, More Than Monkeys, and Scrums.com: **stop estimating in story points; forecast from historical throughput via Monte Carlo simulation**.

The mechanism is simple - take historical "items completed per week" data, sample randomly N times, project remaining backlog. Get a probability distribution: 70% chance of done by date X, 85% by Y, 95% by Z. No estimation ceremony, no point inflation, just historical data.

ZAOcowork has the data: every `completedAt` timestamp is one item finished. Counting them by week gives the throughput series. Run 10,000 simulations against current open count -> three confidence-interval dates.

Where to surface:
- Per-brand: "ZAO Devz: 85% chance of clearing TODO by 2026-07-10"
- Per-owner: "Iman ships 4 items/week (median over last 8 weeks)"
- Per-service-class: "Expedites clear in 1.2 days median (last 30d)"

Implementation: `/api/forecast` endpoint computes once a day (cron), caches result. New stat card on home page: "Forecast: X items, 85% confident done by Y". Don't show on every page load - cache the answer.

### F2. Activity feed at /admin/feed

Per the Stream.io 2026 piece + Linear's burn-up + Plane's "what changed in this project since yesterday" - the **activity feed and notifications are distinct features that get confused**.

- **Notifications:** "X needs your action now" (in-app badge, urgent)
- **Activity feed:** "Here is everything that changed across the workspace lately" (browsable, calm)

ZAOcowork has audit_logs (Phase E) and per-task activity[] arrays. Combining them gives a workspace-wide feed: "Iman set #142 to DONE / Zaal added 5 tasks / GitHub PR #21 merged / 12 archived in May cleanup..."

UI: /admin/feed renders a reverse-chronological list with filter chips (Tasks / Users / Brands / System / All). Each row has actor + action + entity + timestamp + link to drill.

This is the single page Iman reads in 60 seconds at 9am to know what happened overnight. Replaces 80% of "did you see..." Telegram pings.

### F3. Published response-time SLA grid

Cadence + RemoteWorkGeek 2026 unanimous: **async breaks without explicit response windows**. Without the grid, every ping feels urgent + every reply gets ignored.

Recommended grid for ZAOcowork:

| Surface | Expected response | Notes |
|---------|-------------------|-------|
| Telegram DM to bot | 30 min business hours | Cmd-style: `/list`, `/add` |
| In-app comment on task | 1 business day | Default - written, threadable |
| Pending review (worker -> lead) | 4 business hours | Worker is blocked |
| TRIAGE inbox routing | 4 business hours | New items can't start |
| Chat Assistant question | n/a (read-only) | LLM, instant |
| GitHub PR review (cowork#N) | 1 business day | Cycle-time bottleneck |
| Email | 2 business days | External-facing |
| @here in Telegram bot group | minutes | Incident-only |

Where to surface: tiny footer chip on `/chat`, `/admin`, and a CONTRIBUTING.md section. One-time write, infinite payoff. Cadence 2026: "without explicit times, async devolves into 'always on' with extra steps."

### F4. External writers default to TRIAGE (close the F6 loop)

Phase F shipped /admin/triage as the inbox. But the 4 external writers (Telegram bot `add` command, `/meeting` action extractor, `/todo` NL parser on the web, research-doc dispatcher) all still write `status: TODO` directly. So the inbox stays empty.

To close the loop:
- Telegram bot `add` -> writes `status: triage`, posts back "Routed to triage, lead will assign"
- `/meeting` action items -> writes `status: triage` with the meeting URL as source
- `/todo` web NL parser -> writes `status: triage` IF NL parser couldn't infer owner; else TODO
- Research-doc dispatcher -> writes `status: triage` for review-required research

Two files change: `agent/src/commands.ts` (Telegram add command) + `src/lib/todo-parser.ts` (the NL flag). VPS bot redeploy required.

Most-bang-for-buck Phase F follow-up. Without this, the triage feature is decorative.

### F5. Video walkthrough URL per task

Loom is the 2026 default for "show, don't type" (RemoteWorkGeek 2026, Cadence). For ZAOcowork specifically:
- Worker submits a 30-sec Loom of their fix instead of typing 200 words in the update
- Lead reviews the Loom + approves in 1 minute
- Cycle time drops 3-5x on visual/UI work

Implementation: one `videoUrl?: string` field on ActionItem. Loom/YouTube/Vimeo URL detection -> small purple play icon on cards + an embedded thumbnail in TaskRoom. No video hosting on our side - Loom paste-and-go.

### F6. Weekly throughput email digest

Linear sends a weekly "Insights" email. Cadence 2026 + StackCompare argue that a 5-line auto-digest beats both "log into the tool" and "I'll write you Friday".

For ZAOcowork, Friday 4pm ET cron job sends Iman + Zaal:

```
Week of 2026-05-27
- Shipped: 12 tasks (avg 2.4/day, up from 1.8 last week)
- New: 8 tasks (NL parser: 4, Telegram: 2, meetings: 2)
- Aging > 14d: 23 tasks (3 new this week)
- Stale (no activity 5d): 11 tasks (-4 from last week)
- Expedites cleared: 6 (median 1.4 days)
- Triage routed: 14 (median 38 min from inbox to TODO)

Top 3 stuck:
- #142 "MiniMax key rotation" - 18d in BLOCKED, owner Iman
- #289 "Brand voice consolidation" - 31d aging, owner Zaal
- #341 "Tyler intro packet" - 5d stale, owner Tyler
```

Uses Resend or Mailtrap free tier. Cron via VPS systemd timer (existing pattern).

### F7. Bounded AI write capability via approval queue

Doc 763 said don't make the assistant write. Walking that back partially after seeing the liz-tracker / veritas-kanban patterns: **the safe pattern is LLM proposes, human approves**.

Concrete first wins:
- AI suggests brand tags on new tasks (current NL parser sometimes misses)
- AI flags likely duplicates ("this looks 87% similar to #142")
- AI auto-routes triage to most-likely owner based on task content (Linear Triage Intelligence pattern)

Implementation:
- New table `task_proposals` (or status `proposed`) with: task_id, action_type, payload, source ('llm'), confidence, created_at
- /admin/proposals page lists pending - admin approves or rejects per row
- Approve -> applies the underlying mutation + audit log
- Reject -> archives + LLM doesn't re-propose for 30d

This is the **liz-tracker safety pattern** explicitly - "only humans can approve items for execution, description integrity hash, circuit breaker, per-item retry limit, emergency stop button" (moodler/liz-tracker 2026). Steal the pattern, ignore the agent runner.

NOT in scope (still): agentic AI that opens PRs, ships code, or runs without approval. We are nowhere near that for ZAOcowork.

### F8. Mobile-first card view (deferred)

PWA installs but the desktop kanban grid is rough on phone. Linear has a real native iOS app. We don't need a native app, but the current Board.tsx on a 390px viewport stacks vertically + the column-tab switcher exists but the cards are sized for desktop.

Recommended deferral: don't ship this until F1-F7 land. Mobile is a "polish later" item, not a "next sprint" item. Worth tracking but not building now.

---

## What NOT to do

| Anti-pattern | Source | Why skip |
|--------------|--------|----------|
| Add story points or velocity-by-points | Vacanti, ProKanban 2026 | Throughput beats story points on accuracy and zero estimation ceremony |
| Real-time push notifications via Web Push API | Stream.io 2026 | Notification fatigue. Telegram bot DM already covers urgency; in-app badges cover ambient awareness |
| Slack integration on top of Telegram | RemoteWorkGeek 2026 | 4-5 tools max. Telegram is the comms surface; adding Slack splits the team |
| Discord server / community bot | n/a | Same fragmentation reason |
| Full agentic AI that ships code | liz-tracker, veritas-kanban, agentflow | Untrusted writes. Stay at "AI proposes, human approves" |
| Full Gantt / dependency graphs | Modelithe 2026 | Small team rarely has dependencies >2 levels deep; the visual cost > value |
| Story-point burndown / sprint commitments | StackCompare 2026 | Cadence + continuous flow already work. Don't add Scrum on top |
| Self-host LLM for cost savings | n/a | MiniMax already cheap; ops cost of self-hosting > LLM token cost at our scale |
| Mobile native app (iOS/Android) | n/a | PWA install + browser is enough until 100+ users |

---

## Tools / vendors referenced

| Tool | Used for | Cost at 7 users |
|------|----------|-----------------|
| Resend | Transactional email (digest in F6) | Free tier: 100/day, 3000/mo |
| Mailtrap | Alt email | Free tier: 1000/mo |
| Loom | Video walkthroughs (F5 = just URL field, no Loom integration) | Free tier: 25 videos/user |
| Stream.io | Activity feed infra (F2 = build in-app, no Stream) | Free tier: 5MAU - we'd not use it |
| Resend or Postmark | F6 digest | $0-15/mo |

---

## Sequencing recommendation

Week 1 (next session):
- F3 published SLA grid (30 min, documentation only)
- F4 external writers -> TRIAGE (2 hr, bot redeploy)
- F5 video URL field (1 hr)

Week 2:
- F2 activity feed at /admin/feed (4 hr)
- F6 weekly throughput digest (3 hr)

Week 3:
- F1 throughput forecasting + Monte Carlo (6 hr - bigger, but high signal-to-noise)

Week 4:
- F7 bounded AI writes via approval queue (6 hr - last because requires F2 audit feed to be in place first)

After week 4: revisit F8 (mobile polish) + Phase G (whatever surfaces from the cleanup work).

---

## Also See

- [Doc 761 - pre-Phase audit](../761-zaocowork-repo-audit-may26/) (missing from disk)
- [Doc 762 - post-Phase A-E audit](../762-zaocowork-post-phase-audit-may26/)
- [Doc 763 - kanban best practices](../763-kanban-async-team-best-practices/)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Publish SLA grid in CONTRIBUTING.md + footer chip on /admin | Zaal | PR | 2026-05-29 |
| Telegram bot + /meeting + /todo default to TRIAGE | Zaal | PR + VPS redeploy | 2026-05-30 |
| Add videoUrl field + Loom thumbnail on cards | Zaal | PR | 2026-05-31 |
| Build /admin/feed | Zaal | PR | 2026-06-03 |
| Weekly Friday digest cron | Zaal | PR + cron | 2026-06-04 |
| Throughput forecast + dashboard widget | Zaal | PR | 2026-06-08 |
| Bounded AI proposals via approval queue | Zaal | PR | 2026-06-12 |
| Fire research-doc tracker task for doc 764 | Auto | Tracker | After PR merge |

---

## Sources

- [Linear Insights docs - Cycle time, throughput, burn-up charts](https://linear.app/docs/insights) [FULL]
- [Plane Analytics docs - Work items, Cycles, Modules, Intake](https://docs.plane.so/core-concepts/analytics) [FULL]
- [Linear Reporting & Dashboards Full Guide - ToolStack 2026](https://toolstackpm.com/tools/linear/features/reporting-dashboards) [FULL]
- [Plane Dashboards](https://plane.so/dashboards) [FULL]
- [Linear vs Shortcut: Which Issue Tracker (2026) - IdeaPlan](https://www.ideaplan.io/compare/linear-vs-shortcut) [FULL]
- [Measuring lead and cycle times of Linear issues - Screenful Blog](https://screenful.com/blog/tracking-lead-and-cycle-times-of-linear-issues) [FULL]
- [Async communication guide for engineering teams - Cadence 2026-05-14](https://cadence.withremote.ai/blog/async-communication-engineering-teams) [FULL]
- [Activity Feeds vs In-App Notifications - Stream 2026-01-08](https://getstream.io/blog/activity-feeds-app-notifications/) [FULL]
- [Async Communication Done Right: 2026 Playbook - RemoteWorkGeek 2026-04-18](https://remoteworkgeek.org/posts/async-communication-done-right-playbook/) [FULL]
- [Async Communication Mastery: 2026 - RemoteWorkGeek 2026-04-21](https://remoteworkgeek.org/posts/async-communication-remote-teams-ship-faster-2026/) [FULL]
- [Best Productivity Tools for Async Remote Teams 2026 - RemoteWorkGeek 2026-04-25](https://remoteworkgeek.org/posts/best-async-remote-team-tools-2026/) [FULL]
- [moodler/liz-tracker - self-hosted kanban with agentic safety](https://github.com/moodler/liz-tracker) [FULL]
- [BradGroux/veritas-kanban - visual command center for agentic work](https://github.com/bradgroux/veritas-kanban) [FULL]
- [IvyNotFound/KanbAgent - multi-agent AI dev tracker](https://github.com/IvyNotFound/kanbagent) [FULL]
- [UrRhb/agentflow - autonomous AI dev pipeline atop existing trackers](https://github.com/UrRhb/agentflow) [FULL]
- [Integrate remote agents with Jira - Atlassian Forge docs](https://developer.atlassian.com/platform/forge/remote-agents-in-jira/) [FULL]
- [Probabilistic Forecasting Part 2: Monte Carlo - More Than Monkeys 2026-04-21](https://morethanmonkeys.medium.com/probabilistic-forecasting-part-2-how-monte-carlo-forecasting-actually-works-f71c07a050cd) [FULL]
- [Can't we just use Story Points with Monte Carlo - ProKanban Community](https://www.prokanban.org/blog/story-points-with-mcs) [FULL]
- [AI Sprint Forecasting for Engineering Managers - Scrums.com 2026-03-27](https://www.scrums.com/blog/ai-sprint-forecasting) [FULL]
- [Story Points Are a Scam. Here's What Actually Works - CodePulse 2026-01-03](https://codepulsehq.com/guides/stop-estimating-start-forecasting) [FULL]
