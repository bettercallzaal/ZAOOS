# 1247 — ZOE Web Interface: Current State + Gap Analysis

> Decision brief for board task `db708278` ("cowork app as main interface — integrate ZOE chat + agent activity"). Maps what is already built and what the remaining work is to make thezao.xyz the primary ZOE conversation surface.

## Current State (as of 2026-07-17)

The `/bots` page in ZAOcowork already implements the three KEYSTONE pillars almost entirely:

| Pillar | Status | Where |
|--------|--------|-------|
| ZOE chat pane | **Partial** — works for admins only | `/bots` → BotsBoard → ControlPanel "Ask" box |
| Agent/loop activity feed | **Done** — live per-bot event feed, auto-refreshes 30s | `/bots` → expand any bot row → "Recent activity" |
| Board = shared surface | **Done** — Supabase `tasks` table, shared by ZOE + web | `/board` |

### How the ZOE ask round-trip works today

```
Admin types in "Ask" box
  → POST /api/v1/bots/commands {bot: "zoe", command: "ask", args: {prompt: "..."}}
  → ZOE polls command queue every 60s
  → ZOE calls concierge (Claude Sonnet, 4-block memory)
  → ZOE writes {reply: "..."} as command result to bot_commands row
  → CommandHistory re-fetches every 30s, shows reply
```

### What the activity feed shows (today)

The per-bot event panel reads `GET /api/v1/bots/:bot/events` (limit 50, newest first). ZOE posts events for: `startup`, `paused`, `resumed`, `ask`, `run_task`. Consecutive identical events are collapsed (e.g. "startup x18" → "startup ×18").

## Gap Analysis

### Gap 1 — Ask is admin-only (blocks the KEYSTONE goal)

`POST /api/v1/bots/commands` enforces `isAdmin` for ALL command types. The BotsBoard `ControlPanel` renders only for admins (`{isAdmin ? <ControlPanel /> : null}`).

Result: only Zaal can use the web ZOE interface. Iman, Thyrev, and other team leads cannot.

**Fix**: Split command RBAC — keep lifecycle ops (start/stop/restart/pause/resume/run_task) admin-only; open the `ask` command to any valid team session. One route change + one component prop change.

### Gap 2 — No streaming on replies (UX friction)

ZOE takes 15-60s to answer. The UI shows nothing during that time — the user has to wait for the next CommandHistory poll. No "ZOE is thinking..." indicator.

**Fix**: After POSTing an `ask` command, set a local pending state that shows a spinner until CommandHistory finds a completed result for that command ID.

### Gap 3 — `/bots` is in the "More" dropdown, not primary nav

The NavBar has `/bots` as an external link (`https://thezao.xyz/bots`) in the secondary dropdown. Regular team members may not discover it.

**Fix**: Move to primary nav strip (or promote to the same level as `/board` and `/activity`).

### Gap 4 — No cross-bot consolidated feed (nice-to-have)

Today you expand one bot at a time to see its events. There is no "all agents, latest 50 events" unified feed.

**Fix**: Add `GET /api/v1/bots/events` (no `:bot` param) that reads across all bots, or add a "fleet log" section to `/bots` above the per-bot rows. This is additive and independent.

## Recommended Scope for db708278

**PR 1 (do now)**: Open `ask` to all team sessions — route RBAC + BotsBoard component  
**PR 2 (do now)**: Add "thinking" spinner after ask POSTs  
**PR 3 (next session)**: Promote `/bots` in primary nav; add consolidated fleet log

PRs 1+2 are the KEYSTONE unlock — they make ZOE accessible to the whole team via web, not just Zaal via admin controls.

## What NOT to build

- A new `/zoe` dedicated chat page — the BotsBoard already has this, just admin-gated
- A Telegram webhook relay — the command queue round-trip (60s) is good enough for async Q&A
- Supabase Realtime push — polling at 30s is fast enough; Realtime adds infra complexity

## Files to change (PR 1+2)

| File | Change |
|------|--------|
| `src/app/api/v1/bots/commands/route.ts` | Allow `ask` for any session; keep lifecycle + run_task admin-only |
| `src/components/BotsBoard.tsx` | Show AskPanel to all sessions; keep ControlPanel admin-only |
