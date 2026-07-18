---
topic: agents, technology, community
type: implementation-spec
status: SPEC READY — 2 gates: (1) confirm ZABAL TG chat ID with Zaal, (2) ZOL PR #61 merged
last-validated: 2026-07-20
related-docs: 1607-zol-zabal-channel-autopost-spec, 1544-zoe-telegram-bot-ops-guide, 1512-zol-dreamloops-weekly-curator-artist-spotlight, 1468-zoe-daily-operations-manual
board-tasks: "[build] Zolbot posts into ZABAL Telegram channel"
action-owner: Developer (ZOE work-loop.ts handler); Zaal (ZABAL TG chat ID + admin rights)
---

# 1610 — Zolbot → ZABAL Telegram Channel: Implementation Spec

> **What this is:** Implementation spec for "[build] Zolbot posts into ZABAL Telegram channel." Companion to doc 1607 (ZOL → /zabal Farcaster channel). Same content, different delivery: ZOE's Telegram bot posts ZOL's battle results and weekly recaps into a ZABAL-specific Telegram channel/group. This closes the ZAO Telegram ↔ ZABAL content gap.

---

## What "Zolbot Posts into ZABAL Telegram Channel" Means

ZOL generates content (battle results, recaps, artist highlights). ZOE delivers that content to Telegram. The board task name says "Zolbot" but ZOL doesn't have Telegram integration — ZOE does. The correct read: **ZOL-generated content auto-posted to a ZABAL TG channel via ZOE's bot.**

Two options for which Telegram target:

**Option A: Dedicated ZABAL Telegram Channel (Recommended)**

Create a new one-way broadcast channel on Telegram:
- Channel name: "ZABAL Games Updates" or "@zabal_games"
- Type: Public or private announcement channel (not a group — one-way broadcast)
- Bot admin: `@zaoclaw_bot` (ZOE) is added as channel admin

**Option B: ZABAL section in ZAO main Telegram group**

Post into the existing ZAO main group with a ZABAL header. Lower friction (no new channel to manage), but mixes ZABAL content with all ZAO messages.

**Gate: Zaal decides.** Recommended: Option A (dedicated channel) gives ZABAL Games its own TG presence for the Oct 3 ZAOstock push. Option B is the fast path (no new channel setup needed).

---

## Content Types (Same as Doc 1607, Telegram Format)

### Type 1: WaveWarZ Battle Result

Triggered after each battle result is captured by ZOL's wwtracker loop.
Draft → Zaal approves → ZOE posts to ZABAL TG channel.

**Telegram format (no rich embed, just text):**
```
⚔️ WaveWarZ Result

[Artist A] vs [Artist B] — [Date]

Winner: [Artist A]
Both artists earned. [Artist A]: [X] SOL | [Artist B]: [Y] SOL

Next battle: [next battle date if known]
→ wavewarz.info
```

### Type 2: Weekly Recap (Mondays 9am ET)

Short weekly summary for ZABAL channel subscribers.

**Telegram format:**
```
📊 ZAO Weekly | [Date Range]

WaveWarZ: [N] battles this week
ZABAL earned: [X] ZABAL distributed
Top /zabal cast: @[handle] — "[preview]"

Coming up: [next event, 1 sentence]
→ thezao.xyz
```

### Type 3: ZABAL Games Drop Announcement

When ZABAL Games releases new content (per doc 1596 drop protocol, Step 3 = TG announcement).
ZOE already handles this manually. Automation would trigger when ZOL detects a ZABAL Games drop flag in the state file.

---

## Implementation (3-Step)

### Step 1: Zaal Provides ZABAL TG Chat ID

For Option A (new channel):
1. Create Telegram channel: `@zabal_games` or similar
2. Add `@zaoclaw_bot` as channel administrator (can post, can edit messages)
3. Get channel ID: `https://t.me/zabal_games` → forward a message to @userinfobot → note the `id` (negative number, e.g. `-1001234567890`)
4. Add to ZOE env: `ZABAL_TG_CHAT_ID=-1001234567890`

For Option B (main ZAO group):
- `ZABAL_TG_CHAT_ID` = existing ZAO group chat ID (already in ZOE env as `ZAO_TELEGRAM_CHAT_ID` or similar)

### Step 2: Add ZOE Handler (per doc 1544 pattern)

```typescript
// bot/src/zoe/handlers/telegram-zabal.ts (new, ~60 lines)

export async function sendZabalBattleResult(bot: Bot, payload: BattleResultPayload): Promise<void> {
  const chatId = process.env.ZABAL_TG_CHAT_ID;
  if (!chatId) throw new Error('ZABAL_TG_CHAT_ID not set');
  const text = formatBattleResult(payload);  // template from Type 1 above
  await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' });
}

export async function sendZabalWeeklyRecap(bot: Bot, payload: WeeklyRecapPayload): Promise<void> {
  const chatId = process.env.ZABAL_TG_CHAT_ID;
  if (!chatId) throw new Error('ZABAL_TG_CHAT_ID not set');
  const text = formatWeeklyRecap(payload);  // template from Type 2 above
  await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' });
}
```

### Step 3: Add Work-Loop Task Types (per doc 1544 pattern)

```typescript
// bot/src/zoe/work-loop.ts — add new task types:
// { type: "telegram_zabal_battle_result", payload: BattleResultPayload }
// { type: "telegram_zabal_weekly_recap", payload: WeeklyRecapPayload }
```

```typescript
// bot/src/zoe/scheduler.ts — add new cron entries:
// Monday 9am ET: enqueue telegram_zabal_weekly_recap
// After battle result detection: enqueue telegram_zabal_battle_result
```

### Test Flow (per doc 1544 pattern)

1. Set `ZOE_DRY_RUN=true` 
2. Run scheduler → confirm message text appears in logs but no TG send
3. Confirm content looks correct
4. Set `ZOE_DRY_RUN=false` → live post to ZABAL TG channel

---

## Connection to ZOL DreamLoops

ZOL (on Pi) and ZOE (on VPS) run on separate machines. The integration bridge:

```
ZOL Pi (zol-daily cron)
  ↓ detects battle result / generates weekly recap
  ↓ writes to battle-results.json state file
  ↓ ZOE polling script reads battle-results.json (via SSH or S3 sync)
  → ZOE enqueues telegram_zabal_battle_result task
  → ZOE posts to ZABAL TG channel
```

**Simpler alternative:** ZOL generates the draft text → ZOE picks it up from `~/zol/drafts/` → Zaal approves via Telegram → ZOE posts. This is the same approval flow as doc 1607 (Farcaster) and doesn't require a new polling script.

**Recommended path:** Use the existing draft-approval flow. No new bridge needed.

---

## Required Config

| Variable | Where Set | What |
|----------|-----------|------|
| `ZABAL_TG_CHAT_ID` | VPS `~/.zao/private/zoe.env` | ZABAL TG channel ID (Zaal provides) |
| `ZOE_DRY_RUN` | VPS env | Set true for testing, false for live |

No new packages. ZOE's existing `bot.api.sendMessage()` handles it.

---

## PR Scope

**1 PR: `zoe/feat/zabal-telegram-channel` (2-3h)**
- `bot/src/zoe/handlers/telegram-zabal.ts` (new, ~60 lines)
- Add task types to `work-loop.ts`
- Add cron entry to `scheduler.ts`
- Update `.env.example`: add `ZABAL_TG_CHAT_ID=`
- Dry-run test confirming both message types format correctly

**Total:** ~2 hours once `ZABAL_TG_CHAT_ID` is provided.

Gate: Zaal creates ZABAL TG channel + adds `@zaoclaw_bot` as admin + provides chat ID.

---

## What This Unlocks

| Before | After |
|--------|-------|
| ZABAL has no dedicated Telegram presence | ZABAL has its own TG channel with automated content |
| Battle results only go to ZAO main group | Battle results reach ZABAL-specific audience |
| ZABAL Games drops need manual TG announcement | ZOE handles TG step of doc 1596 drop protocol automatically |
| ZAOstock attendees have no ZABAL-native TG to join | "Join @zabal_games on Telegram" becomes a ZAOstock CTA |

---

## Sources

- Board task: "[build] Zolbot posts into ZABAL Telegram channel"
- Doc 1607: ZOL /zabal Farcaster channel autopost spec (companion — same content, different delivery)
- Doc 1544: ZOE Telegram bot ops guide (exact pattern for new message type: scheduler → work-loop → handler)
- Doc 1512: ZOL DreamLoops activation (PR #61 — needed before ZOL generates automated drafts)
- Doc 1468: ZOE daily operations manual (rate limits, group message rules)
- Doc 1596: ZABAL Games drop protocol (Step 3 = TG announcement — this automates it)
- `bot/src/zoe/work-loop.ts`: existing work-loop task dispatch
- `bot/src/zoe/handlers/`: existing handler pattern
