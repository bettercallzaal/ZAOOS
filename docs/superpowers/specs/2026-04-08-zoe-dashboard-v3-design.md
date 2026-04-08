# ZOE Dashboard v3 - Glance & Tap

> **Date:** 2026-04-08
> **Status:** Draft
> **Goal:** Rebuild zoe.zaoos.com as a status board you glance at, tap to unblock idle work, and get back to Claude Code in 10 seconds. Kill the chat. Kill the command router. Everything is taps.

## Architecture

Same stack: static HTML/JS served from VPS, reads Supabase directly for data, dispatches to agents via `/api/dispatch`. No framework change - this is a UI rewrite, not an infra rewrite.

**Data sources (all existing, no new tables):**
- `agent_events` table - agent status, task completions, results
- `build_events` table - commits, PRs, deploys
- `contacts` table - rolodex (hidden tab, future improvement)

## Three Sections, One Screen, No Scrolling

### 1. Needs Attention (top, gold accent)

The only section that demands action. Shows items waiting for Zaal. Empty state: "nothing needs you right now."

**Item types and their actions:**

| Source | Item | Action Buttons |
|--------|------|---------------|
| `build_events` where `event_type = 'deploy_success'` and no `pr_merged` | PR ready to merge | **[Merge]** **[View ↗]** |
| `build_events` where `event_type = 'deploy_failed'` | Deploy failed | **[View ↗]** |
| `agent_events` where `status = 'completed'` and unread | Agent finished a task | **[Read ↗]** **[→ AGENT]** (chain to next) |
| `agent_events` where `status = 'error'` | Agent hit an error | **[View ↗]** **[Retry]** |

**Each item shows:**
- Colored dot (gold = PR, blue = agent result, red = error)
- One-line description
- Timestamp ("2h ago")
- 1-2 action buttons on the right

**Actions:**
- **[Merge]** - `POST /api/dispatch` to BUILDER: "merge PR #N"
- **[View ↗]** - opens URL in new browser tab (GitHub PR, agent result file, etc.)
- **[Read ↗]** - opens agent result file in new tab
- **[→ CASTER]** (or any agent) - opens dispatch modal pre-filled with context from the completed task
- **[Retry]** - re-dispatches the same task to the same agent
- **[Approve]** - marks item as handled, removes from attention list

**Max items:** 5. If more than 5, show "and N more..." with expand tap. In practice, rarely more than 3.

### 2. Squad (middle, neutral)

Horizontal row of agent pills. One line. Shows who's doing what.

```
● ZOE idle   ● SCOUT working   ● CASTER idle   ● ROLO idle   ● STOCK idle
```

**Colors:** Green = idle, Gold = working, Red = error

**Tap any agent = dispatch modal:**
- Agent name header
- Text input for custom task
- 3 suggested tasks (pre-filled based on agent role):
  - SCOUT: "Research...", "Find trending...", "Check competitor..."
  - CASTER: "Draft newsletter", "Quote cast about...", "Social posts for..."
  - ROLO: "Add contact...", "Find contacts about...", "Export contacts"
  - STOCK: "Check timeline", "Research venue...", "Update planning doc"
  - ZOE: "Brief me", "What did agents do today", "Run squad audit"
- **[Send]** button dispatches via `POST /api/dispatch`
- Tapping a suggestion fills the input, user can edit before sending

### 3. Today (bottom, subtle)

One line. Glanceable daily summary.

```
Today: 3 commits · 1 PR merged · 7 agent tasks · ZOE learning: Day 4
```

**Data sources:**
- Commits: `build_events` where `event_type = 'commit'` and `created_at > today`
- PRs: `build_events` where `event_type = 'pr_merged'` and `created_at > today`
- Agent tasks: `agent_events` count where `created_at > today`
- Learning: read latest entry from `skills-journal.md` via a simple API or hardcode the day number

### Hidden Tab: Rolodex

Swipe right or tap a small tab indicator to access contacts. NOT visible on the main screen. This is a "dive in" feature for later improvement.

**Current:** Search + list of 844 contacts from Supabase `contacts` table.
**Future (not in this spec):** Paste-to-add, smart parsing of notes, relationship tagging.

## What Gets Killed

| Current Feature | Verdict | Why |
|----------------|---------|-----|
| Chat with 15+ keyword commands | **KILL** | Claude Code does this better |
| Smart Suggestions (6 cards) | **KILL** | Replaced by Needs Attention with real action buttons |
| Activity Feed (30 events) | **KILL** | Noise. Needs Attention surfaces what matters. |
| Quick Capture (4 buttons) | **KILL** | Use Claude Code or Telegram to ZOE |
| Task chain detection ("then" keyword) | **KILL** | Use [→ AGENT] button on completed tasks instead |
| File access via chat | **KILL** | Claude Code reads files |
| Code ship flow via chat | **KILL** | Claude Code ships code |
| Build Status card (separate component) | **MERGE** | PR status folded into Needs Attention items |
| Links tab | **KILL** | Bookmark bar exists |
| Chat history persistence | **KILL** | No chat = no history |

## Components

**New (replacing everything):**
```
src/components/NeedsAttention.tsx   - attention items + action buttons
src/components/Squad.tsx            - agent pills + dispatch modal
src/components/TodaySummary.tsx     - one-line daily summary
src/components/DispatchModal.tsx    - modal: text input + suggestions + send
src/components/Rolodex.tsx          - hidden tab (carry over, simplify)
src/App.tsx                         - layout: stack 3 sections vertically
```

**Delete (from current dashboard):**
```
src/components/ChatView.tsx
src/components/SmartSuggestions.tsx
src/components/BuildStatus.tsx
src/components/TaskChainStatus.tsx
src/components/QuickCapture.tsx
src/components/HubView.tsx
src/components/FeedView.tsx
src/components/LinksView.tsx
```

## Server Changes

`server.js` stays mostly the same. Endpoints needed:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dispatch` | POST | Dispatch task to agent (exists) |
| `/api/attention` | GET | Query attention items from Supabase (new - combines build_events + agent_events) |
| `/api/squad` | GET | Query agent status (new - latest event per agent) |
| `/api/today` | GET | Query today's summary counts (new) |

These are thin wrappers around Supabase queries. No complex logic.

## Visual Design

- Background: navy `#0a1628` (matches ZAO OS)
- Accent: gold `#f5a623` for attention items
- Agent status: green `#4ade80` idle, gold `#f5a623` working, red `#ef4444` error
- Text: white headings, `#888` secondary, `#555` tertiary
- Cards: `#111d33` background with subtle border radius
- Action buttons: green for primary actions, dark gray for secondary
- Mobile-first: everything stacks vertically, 44px+ tap targets
- Font: Inter (already used)
- No scrolling on main view at 375px viewport

## Polling

- Needs Attention: poll every 30 seconds
- Squad status: poll every 30 seconds (same request)
- Today summary: poll every 5 minutes
- No websockets. Polling is fine for a single-user dashboard.

## Auth

Keep existing password auth with cookie persistence. No changes.

## Scope Boundaries - NOT Building

- No chat or text command parsing
- No real-time websockets
- No multi-user support
- No Rolodex improvements (future)
- No notification sounds or push notifications
- No dark/light theme toggle (always dark)
- No mobile app wrapper
