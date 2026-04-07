# ZOE Dashboard v2 — Full Command Center

> **Date:** 2026-04-07
> **Status:** Approved
> **Goal:** Make zoe.zaoos.com the daily driver — build awareness, task chains, file access, code ship flow. Claude Code only for complex coding.

## Architecture

Supabase is the hub. All data flows through Supabase tables. ZOE (VPS) populates build data via cron. Dashboard reads Supabase directly for instant queries, routes complex/one-off requests through `/api/chat` to real ZOE.

## New: `build_events` Supabase Table

```sql
CREATE TABLE IF NOT EXISTS build_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,
  title         text,
  url           text,
  branch        text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_build_events_type ON build_events(event_type);
CREATE INDEX idx_build_events_created ON build_events(created_at DESC);

ALTER TABLE build_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read build events" ON build_events FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON build_events FOR INSERT WITH CHECK (true);
```

### Event types

| event_type | When | Source |
|-----------|------|--------|
| `commit` | New commit on main | ZOE auto-pull cron (15m) |
| `branch_created` | BUILDER creates feature branch | BUILDER agent |
| `pr_opened` | PR created | BUILDER agent |
| `pr_merged` | PR merged | ZOE cron or BUILDER |
| `deploy_success` | Vercel preview/prod passes | BUILDER via `gh pr checks` |
| `deploy_failed` | Vercel build fails | BUILDER via `gh pr checks` |
| `build_started` | Build check initiated | BUILDER agent |

### Metadata schema

```json
{
  "sha": "abc123",
  "author": "bettercallzaal",
  "additions": 30,
  "deletions": 53,
  "pr_number": 131,
  "preview_url": "https://zaoos-abc123.vercel.app",
  "files_changed": ["src/app/stock/page.tsx"]
}
```

## Modify: `agent_events` — Add chain_id

```sql
ALTER TABLE agent_events ADD COLUMN IF NOT EXISTS chain_id uuid;
CREATE INDEX idx_agent_events_chain ON agent_events(chain_id) WHERE chain_id IS NOT NULL;
```

## ZOE Cron Extension

The existing auto-pull cron (every 15m) gets extended. After `git pull`, ZOE:

1. Checks `git log -1 --format='%H %s %an %ci'` — if SHA differs from last logged commit, insert into `build_events`
2. Checks `gh pr list --repo bettercallzaal/ZAOOS --json number,title,state,headRefName --limit 5` — log any new/changed PRs
3. For open PRs, checks `gh pr checks <number>` — log deploy status

All inserts use the existing `log-event.sh` pattern but target `build_events` instead of `agent_events`.

## Dashboard: Build Status Card

New component on the Hub, between Squad Overview and Quick Actions.

```
src/components/BuildStatus.tsx
```

Shows:
- Latest commit on main (message, time ago, +/- lines)
- Open PRs (count, titles, deploy status dots)
- Active BUILDER work (if branch_created event exists without pr_merged)
- Approve/Reject buttons on PRs with passing deploys

### Approve/Reject Actions

- **Approve** button → `POST /api/dispatch` with agent=builder, message="Create PR for branch X and merge it"
- **Reject** button → `POST /api/dispatch` with agent=builder, message="Delete branch X, abandon the work"

## Dashboard: Task Chains

When user types "research X then draft a post about it":

1. Chat router detects "then" keyword
2. Splits into two tasks: ["research X", "draft a post about it"]
3. Generates a `chain_id` (uuid)
4. Dispatches task 1 with `chain_id` in the message metadata
5. Returns: "Chain started: Step 1 dispatched to SCOUT. Step 2 (CASTER) will auto-start when done."
6. Dashboard polls `agent_events` for `chain_id` — when step 1 completes, auto-dispatches step 2

### Chain detection keywords

Split on: "then", "after that", "once done", "when finished", "next"

### Agent assignment

If no agent specified, ZOE assigns based on task keywords:
- "research" / "find" / "look up" → SCOUT
- "draft" / "post" / "write" → CASTER
- "fix" / "build" / "code" → BUILDER
- "check balance" / "register" → WALLET
- "add contact" / "who" → ROLO

## Dashboard: File Access via Chat

New chat keywords that route to ZOE (`/api/chat`):

| Keyword Pattern | What ZOE Does |
|----------------|---------------|
| "show me scout's results" | Reads latest file in `scout/results/` |
| "show me [agent] results" | Reads latest file in `[agent]/results/` |
| "read the timeline" | Reads `ZAO-STOCK/planning/timeline.md` |
| "read [filename]" | Reads the file from VPS workspace |
| "what did [agent] find" | Reads latest result file for that agent |

## Code Ship Flow

When user says "build X" or "fix Y":

1. Dashboard dispatches BUILDER: "Create branch ws/[slug], implement [task], commit, push, check build. Log every step to build_events in Supabase."
2. BUILDER creates branch, codes, commits, pushes
3. BUILDER runs `gh pr checks` — logs `deploy_success` or `deploy_failed`
4. Dashboard shows BuildStatus card with preview link + Approve/Reject
5. User taps Approve → BUILDER creates PR, merges
6. Dashboard shows "Shipped to main"

### BUILDER SOUL.md additions

```
## Code Ship Protocol

When dispatched with a code task:
1. git checkout main && git pull origin main
2. git checkout -b ws/{slug}-{timestamp}
3. Make changes, commit with descriptive message
4. git push -u origin {branch}
5. Log to Supabase build_events: branch_created
6. Wait 3min, run gh pr checks
7. Log to Supabase: deploy_success or deploy_failed
8. Report back to Zaal via Supabase agent_events
9. WAIT for approval before creating PR
10. On approval: gh pr create && gh pr merge
11. Log: pr_opened, pr_merged
12. Clean up: git checkout main && git pull
```

## New Dashboard Components

```
src/components/BuildStatus.tsx    — Hub card showing commits, PRs, deploys
src/components/TaskChainStatus.tsx — Shows multi-step task progress
```

Modify:
```
src/components/ChatView.tsx       — Add chain detection + file access keywords
src/components/SmartSuggestions.tsx — Add build-related suggestions ("PR ready for review")
src/lib/api.ts                    — Add fetchBuildEvents()
src/lib/config.ts                 — Add BuildEvent interface
src/App.tsx                       — Add BuildStatus to HubView
```

## Server Changes

```
server.js — Add VALID_AGENTS entries for 'stock' and 'festivals' when they're built
```

## Scope Boundaries — NOT Building

- No code editor in dashboard
- No branch management UI beyond approve/reject
- No Vercel API integration (use gh CLI via BUILDER)
- No real-time websockets
- No conversation history persistence
- No multi-user roles

---

## Testing Spec

### Backend Tests

| Test | Method | Expected |
|------|--------|----------|
| `build_events` table exists | SQL query | Returns rows |
| `agent_events.chain_id` column exists | SQL query | Column present |
| `POST /api/dispatch` with valid agent | curl | `{"status":"dispatched"}` |
| `POST /api/dispatch` with invalid agent | curl | `{"error":"invalid agent"}` |
| `POST /api/chat` with message | curl | `{"response":"Sent to..."}` |
| `POST /api/chat` without message | curl | `{"error":"message required"}` |
| Supabase events query (anon key) | curl | Returns JSON array |
| Supabase contacts query (anon key) | curl | Returns JSON array |
| Supabase build_events query (anon key) | curl | Returns JSON array |
| Security: command injection attempt | curl with `'; rm -rf /` | No execution, returns normal response |

### Frontend Tests (Manual)

| Test | Steps | Expected |
|------|-------|----------|
| **Hub loads** | Open zoe.zaoos.com, login | Hub with suggestions, overview, agents, build status |
| **Build Status card** | Check Hub | Shows latest commit + open PRs |
| **Agent dispatch modal** | Tap any agent | Modal opens with name, textarea, dispatch button |
| **Dispatch works** | Type task, tap Dispatch | "Dispatched" confirmation, event in Feed |
| **Smart suggestions** | Check Hub | Gold for approvals, contextual for time of day |
| **Suggestion tap** | Tap "Review CASTER draft" | Switches to Chat, sends message, gets response |
| **Chat: status** | Type "status" | Shows 8 agents with latest activity |
| **Chat: brief** | Type "brief" | Shows task counts + top 5 results |
| **Chat: events** | Type "events" | Shows recent 15 events |
| **Chat: find** | Type "find Jordan" | Shows matching contacts |
| **Chat: natural** | Type "who do I know about nouns" | Searches contacts for "nouns" |
| **Chat: dispatch** | Type "dispatch scout research X" | Dispatches, shows confirmation |
| **Chat: help** | Type "help" | Shows all available commands |
| **Chat: whos free** | Type "whos free" | Shows idle agents |
| **Chat: fallback** | Type anything unrecognized | Routes to real ZOE, shows "working on it" animation |
| **Task chain** | Type "research X then draft about it" | Dispatches step 1, queues step 2 |
| **File access** | Type "show me scout results" | ZOE reads file, returns contents |
| **Code ship** | Type "fix the login button" | BUILDER creates branch, build status updates |
| **Approve PR** | Tap Approve on build card | BUILDER creates PR + merges |
| **Feed tab** | Tap Feed | Shows 30 events, hides started events by default |
| **Rolodex tab** | Tap Rolodex | Shows 844 contacts, search works, + button works |
| **Links tab** | Tap Links | Shows 5 links, all clickable |
| **Loading animation** | Send any chat message | Gold bouncing dots with "ZOE is working on it" |
| **Escape closes modal** | Open dispatch modal, press Esc | Modal closes |
| **Mobile responsive** | Open on 375px viewport | All sections stack vertically, tap targets 44px+ |

### Agent Tests (VPS)

| Test | Command | Expected |
|------|---------|----------|
| ZOE cron logs commits | Wait 15m, check `build_events` | New commit row |
| BUILDER creates branch | Dispatch code task | `branch_created` event logged |
| BUILDER checks build | After push | `deploy_success` or `deploy_failed` logged |
| Chain auto-dispatch | Create 2-step chain | Step 2 starts when step 1 completes |
| File read via chat | "show me scout results" | Returns file contents |

### Security Tests

| Test | Input | Expected |
|------|-------|----------|
| SQL injection in search | `'; DROP TABLE contacts;--` | No effect, normal search |
| XSS in chat | `<script>alert(1)</script>` | Rendered as text, not executed |
| Agent whitelist | `agent: "../../../etc/passwd"` | `{"error":"invalid agent"}` |
| Command injection | Message with shell metacharacters | `spawn()` prevents execution |
| CORS | Cross-origin request | Allowed (public dashboard) |
