---
topic: agents/zoe
type: DESIGN
status: ready
created: 2026-07-17
board-task: 950a04f2
related-docs: 1134, 1272, 1247
owner: Zaal
deadline: 2026-08-15 (before ZAOville follow-up)
---

# 1317 — ZOE Telegram Mini App: Cowork Board in the Thumb

> **Decision:** Add a `/board` command to ZOE (@zaoclaw_bot) that opens the cowork board as a Telegram Mini App — no context-switch to browser, board accessible directly inside ZAAL BOTZ group or ZOE DM.
>
> **Why now?** Telegram Bot API 10.2 (July 2026) hardened Mini App origin security and added Communities integration. grammY 1.29 already supports `web_app` buttons. The cowork board at `thezao.xyz/board` is the right surface — just needs an initData auth endpoint to verify the Telegram user.

---

## What Gets Built

| Phase | Feature | Effort | Value |
|-------|---------|--------|-------|
| 1 (this doc) | `/board` command → Mini App showing my open tasks | 1 day | HIGH |
| 2 | `/cockpit` Mini App view (morning brief in-Telegram) | 1 day | HIGH |
| 3 | Task creation from Telegram (create task without opening board) | 2 days | MEDIUM |

**Phase 1 only ships in this PR.** Phases 2 and 3 are separate PRs.

---

## How Telegram Mini Apps Work (Reference Summary)

1. Bot sends a message with an `InlineKeyboardButton` that has a `web_app` field: `{ text: "Open Board", web_app: { url: "https://thezao.xyz/board/mini" } }`
2. Telegram opens the URL inside a webview with a special `initData` query param (HMAC-signed, contains user.id, user.username, chat.id, auth_date)
3. The web app calls `window.Telegram.WebApp.initData` to read the params
4. The web app sends `initData` to its backend for verification: `HMAC-SHA256(initData, HMAC-SHA256("WebAppData", bot_token))`
5. After verification, the backend returns the board data for that user

---

## Architecture

```
[ZOE /board command]
        │
        ▼
[grammY sends InlineKeyboard with web_app button]
        │
        ▼
[Telegram opens Mini App webview]
        │ initData (HMAC-signed user context)
        ▼
[thezao.xyz/board/mini?tg=1]  ← new route in ZAOcowork Next.js
        │
        ▼
[GET /api/tg/auth] ← new endpoint: verifies initData HMAC
        │  returns: { userId, member_id, tasks[] }
        ▼
[React board view (filtered to my tasks, mobile-optimized)]
```

---

## Files to Create / Modify

### 1. ZOE bot (`zao-os/bot/src/`)

**Create `src/miniapp.ts`:**
```typescript
import { Context, InlineKeyboard } from 'grammy';

const BOARD_MINI_URL = process.env.BOARD_MINI_URL ?? 'https://thezao.xyz/board/mini';

export async function cmdBoard(ctx: Context) {
  const kb = new InlineKeyboard().webApp('Open Board', BOARD_MINI_URL);
  await ctx.reply('your open tasks:', { reply_markup: kb });
}
```

**Modify `src/index.ts`** — add command registration:
```typescript
import { cmdBoard } from './miniapp';
// ...
bot.command('board', cmdBoard);
```

**Add env var `BOARD_MINI_URL`** to `.env.example`:
```
BOARD_MINI_URL=https://thezao.xyz/board/mini
```

### 2. ZAOcowork Next.js (`ZAODEVZ/ZAOcowork/`)

**Create `app/board/mini/page.tsx`:**
- Mobile-optimized layout (full-height, no nav)
- On load: reads `window.Telegram.WebApp.initData`
- POSTs to `/api/tg/auth` for verification
- Shows spinner during auth, then renders `<TaskList tasks={myTasks} />`

**Create `app/api/tg/auth/route.ts`:**
```typescript
import { createHmac } from 'crypto';

export async function POST(req: Request) {
  const { initData } = await req.json();
  // Parse initData as URL-encoded string
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  // Sort remaining keys
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  // Verify HMAC
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();
  const expected = createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (expected !== hash) return Response.json({ error: 'invalid' }, { status: 401 });
  // Parse user
  const user = JSON.parse(params.get('user')!);
  // Look up member by telegram_id in Supabase
  // Return their open tasks
  return Response.json({ userId: user.id, username: user.username });
}
```

**Add `TELEGRAM_BOT_TOKEN`** to ZAOcowork `.env.local` (already exists in bot, just needs to be in cowork)

---

## Security Constraints

| Constraint | How Met |
|-----------|---------|
| HTTPS only | `thezao.xyz` already runs on Vercel (HTTPS auto) |
| initData HMAC verification | `/api/tg/auth` verifies before returning any data |
| auth_date freshness | Check `auth_date` is within 1 hour: `Date.now()/1000 - auth_date < 3600` |
| Origin hardening (TG API 10.2) | Telegram enforces HTTPS origin; no extra config needed |
| Never expose bot_token | Only lives in ZAOcowork `TELEGRAM_BOT_TOKEN` env var, server-side only |

---

## Telegram User → ZAO Member Mapping

The `initData` has `user.id` (Telegram user ID) and `user.username`. ZOE already has a `telegram_id` column on the `team_members` table (used for auth in `src/auth.ts`). The `/api/tg/auth` endpoint does:

```sql
SELECT id, name FROM team_members WHERE telegram_id = $1
```

If no match found, return `{ member: null }` — Mini App shows "not linked" prompt with a `thezao.xyz/board` link.

---

## What the Mini App Shows (Phase 1)

```
┌─────────────────────────────┐
│ your tasks             [⊞]  │
├─────────────────────────────┤
│ [P1] Fix X display name     │
│      todo · due today       │
├─────────────────────────────┤
│ [P1] ZABAL Gamez empire     │
│      in_progress            │
├─────────────────────────────┤
│ [P2] Cal.com MCP wiring     │
│      in_progress            │
└─────────────────────────────┘
           [Open full board →]
```

- Tap task → opens `thezao.xyz/board?task=<id>` in external browser (not nested Mini App)
- "Open full board →" → `window.Telegram.WebApp.openLink('https://thezao.xyz/board')`
- No in-app task editing in Phase 1 (read-only is enough to validate the pattern)

---

## PR Scope

**PR 1 (bot side) — `zao-os` repo:**
- `src/miniapp.ts` (new)
- `src/index.ts` (add command)
- `.env.example` (add BOARD_MINI_URL)
- Tests: `src/__tests__/miniapp.test.ts` (mock ctx.reply, verify InlineKeyboard)

**PR 2 (cowork side) — `ZAOcowork` repo:**
- `app/board/mini/page.tsx` (new)
- `app/api/tg/auth/route.ts` (new)
- `app/api/tg/auth/route.test.ts` (new — HMAC verification tests, freshness check)

Both PRs are small and independent. Bot PR ships first (just adds a button), cowork PR adds the actual page.

---

## Env Vars Summary

| Var | Repo | Source |
|-----|------|--------|
| `BOARD_MINI_URL` | `zao-os/bot` | Set to `https://thezao.xyz/board/mini` |
| `TELEGRAM_BOT_TOKEN` | `ZAOcowork` | Copy from bot `.env` (TELEGRAM_BOT_TOKEN) |

---

## What Phase 2 Adds (Not in This PR)

`/cockpit` command → Mini App showing the ZOE morning brief:
- Agent status (ZOE/ZOL/Hermes heartbeat)
- Top 3 tasks
- Today's events
- WaveWarZ battle count

Built on the same `/api/tg/auth` pattern. Reuses `buildHealthReport()` and `cockpit/brief.ts` output.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1134 | TG Bot API 10.2 capabilities — Mini App architecture + initData spec |
| doc 1272 | ZAO Agent Stack — ZOE architecture, grammy 1.29, bot token env var names |
| doc 1247 | ZOE Web Interface — existing board UI + gap analysis (this doc builds on it) |
