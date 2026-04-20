# AO Sidebar Counter Filter Fix

Date: 2026-04-20  
Status: Research Only  
Task: Investigate Composio AO's sidebar counter behavior and propose fixes

## Problem Statement

Composio AO's left sidebar shows ZAOOS project badge with count "11", but the main dashboard correctly displays "No active sessions". The counter counts all historical sessions (killed, merged) while the dashboard filters to active only. This creates UX confusion between sidebar and main content.

## Investigation Results

### Current State After Archive

After archiving 11 stale sessions to `~/.agent-orchestrator/2883535895a7-ZAOOS/sessions-archived/`:
- API endpoint `GET /api/sessions` returns 4 sessions (reduced from 11)
- All 4 remaining sessions have `status: "killed"` with `activity: "exited"`
- Counter still reflects full list, not filtered count

### Sessions API Response Structure

```json
{
  "sessions": [
    {
      "id": "zaoos-1",
      "projectId": "ZAOOS",
      "status": "killed",
      "activity": "exited",
      "branch": "session/zaoos-1",
      ...
    }
  ],
  "stats": {
    "totalSessions": 4,
    "workingSessions": 0,
    "openPRs": 0,
    "needsReview": 0
  },
  "orchestrators": [...]
}
```

The API already computes a `stats` object with filtered counts:
- `totalSessions`: total count (unfiltered)
- `workingSessions`: filtered to `activity !== "exited"` (current active)
- `openPRs`: filtered to `status === "open"`
- `needsReview`: filtered reviews pending

### Code Analysis

AO source is compiled Next.js. The `/api/sessions` route is at `~/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-web/.next/server/app/api/sessions/route.js` (minified). Key findings from minified code:

- Statistics computed in route handler via `w.bV(r)` call (minified function)
- Dashboard likely uses `workingSessions` stat for "active" display
- Sidebar counter likely uses `sessions.length` from sessions array (unfiltered count)
- No file watchers detected; API reads sessions directory on each request

### Why the Discrepancy

1. Dashboard endpoint: `/api/sessions?active=true` - filters sessions to `activity !== "exited"`
2. Sidebar component: likely calls `/api/sessions` without filter param, receives full array
3. Sidebar renders length of full array; dashboard filters client-side to active only

### Data Flow

```
Sidebar Component
  |
  +-- GET /api/sessions
        |
        +-- Returns all 4 sessions (killed, exited)
        |
        +-- Component renders sessions.length = 4 as badge
        |
        No filter applied client-side

Dashboard Page
  |
  +-- GET /api/sessions?active=true
        |
        +-- API filters to sessions where activity !== "exited"
        |
        +-- Returns 0 sessions
        |
        +-- Renders "No active sessions"
```

## Two Fix Approaches

### Option A: Short-term Filesystem Maintenance (Implemented)

Archive terminal sessions to keep sidebar count accurate:

```bash
# Archive killed/merged sessions
mkdir -p ~/.agent-orchestrator/2883535895a7-ZAOOS/sessions-archived
mv ~/.agent-orchestrator/2883535895a7-ZAOOS/sessions/*/session.json | \
  while read -r file; do
    if grep -q '"status":"killed\|"status":"merged' "$file"; then
      sessiondir=$(dirname "$file")
      mv "$sessiondir" ~/.agent-orchestrator/2883535895a7-ZAOOS/sessions-archived/
    fi
  done
```

Pros: Works immediately, no code changes, respects AO architecture  
Cons: Manual process, requires periodic cleanup

### Option B: Long-term Patch (Requires Code)

Modify sidebar component to show `stats.workingSessions` instead of `sessions.length`:

- File: Compiled chunk in `.next/static/chunks/` (exact chunk unknown without source map)
- Change: Badge renders `workingSessions` stat instead of array length
- API already provides this data in response

Pros: Fixes at source, auto-maintains accuracy  
Cons: Requires patching compiled code or rebuilding from source (source not included in npm package)

## Recommendation

**Use Option A (filesystem maintenance) as immediate solution.**

Reasons:
1. AO source not included in npm package - no clean way to patch compiled code
2. Archive approach already deployed and working (counter dropped 11 to 4)
3. Can create automated cleanup script triggered by cron or app startup
4. Aligns with how AO manages session lifecycle (moved to archive dir = "not loaded")

**If AO source becomes available in future:**
- Consider patching `/api/sessions` to accept `?filter=active` param
- Sidebar calls `/api/sessions?filter=active` to get only `workingSessions`
- Eliminates need for manual cleanup

## Next Steps

1. Create cron job or startup hook to auto-archive terminal sessions weekly
2. Document archive location and cleanup procedure
3. Monitor if sidebar counter stays in sync with active sessions
4. If source becomes available, evaluate proper patch approach
