# 1544 — ZOE Telegram Bot: Operations + Debug Guide (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** Technology  
**Status:** CANONICAL — ZOE's Telegram integration is the primary community communication channel. This doc covers the current state (Jul 2026), known failure modes, and extension patterns.

---

## What ZOE's Telegram Bot Does

ZOE (ZAO Operations Engine) uses the Telegram Bot API to post to the ZAO community Telegram group. It is the primary channel for:
- Daily WaveWarZ battle announcements and results
- Weekly governance session reminders (Thursday Fractal)
- MAIN event notifications (COC Concertz shows)
- ZAOstock countdown and ticket milestones
- ZOE 7PM EOD reports (doc 1499)
- ZABAL S2 cohort updates

The bot is **not interactive** in Phase 1 — it sends messages but does not parse inbound commands or replies. Phase 2 interactive commands (TBD, doc 1468).

---

## Architecture Overview

```
ZOE Scheduler (VPS cron, scheduler.ts)
    │
    ├── work-loop.ts  (task queue, file-lock FIFO)
    │        │
    │        └── TelegramHandler.send(chat_id, message)
    │                   │
    │                   └── Telegram Bot API (bot.token → POST /sendMessage)
    │
    └── DreamLoop port (doc 1527) — Phase 2 manifest-driven version
```

**Key config parameters (from doc 1468):**
| Parameter | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | From @BotFather — do not rotate without updating VPS env |
| `TELEGRAM_CHAT_ID` | ZAO community group ID (negative integer for groups) |
| `TELEGRAM_PARSE_MODE` | `"MarkdownV2"` — escape special chars or bot silently fails |
| `ZOE_DRY_RUN` | `true` = log only, no sends — use during testing |

---

## Known Failure Modes

### 1. MarkdownV2 Parse Error (Most Common)
**Symptom:** Bot returns `400 Bad Request: can't parse entities` — message silently dropped.  
**Cause:** Telegram's MarkdownV2 requires escaping: `.`, `-`, `(`, `)`, `!`, `+`, `#`, `=`, `|`, `{`, `}`, `[`, `]`, `>`, `~`.  
**Fix:** Run all dynamic content through the escape utility before passing to `TelegramHandler.send()`:
```typescript
function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
```
Use `"HTML"` parse mode as alternative if MarkdownV2 escaping becomes unmanageable — HTML only needs `&`, `<`, `>` escaped.

### 2. Rate Limit (429 Too Many Requests)
**Symptom:** Bot returns `429 Too Many Requests` with `retry_after` seconds.  
**Cause:** Telegram group message limit = 20 messages/minute.  
**Fix:** ZOE scheduler sends max 1 message/minute to group. If batch sending, add `await sleep(3000)` between messages. Current ZOE max = 10 messages/day to group (doc 1468 DM rate limits).

### 3. Bot Kicked from Group
**Symptom:** `403 Forbidden: bot was kicked from the supergroup chat`.  
**Cause:** Admin removed bot from group (usually accidental during group settings edit).  
**Fix:** Re-add bot to group via Telegram → Group Settings → Add Members → search `@[bot username]`. Then re-confirm `TELEGRAM_CHAT_ID` (may change if group converted to supergroup). Test: `ZOE_DRY_RUN=false` + single test message.

### 4. Token Expiry / Invalid Token
**Symptom:** `401 Unauthorized`.  
**Cause:** `TELEGRAM_BOT_TOKEN` corrupted or @BotFather token was regenerated.  
**Fix:** @BotFather → `/mybots` → select bot → `API Token` → copy new token → update VPS env → restart ZOE scheduler.

### 5. Message Too Long (4096 char limit)
**Symptom:** `400 Bad Request: message is too long`.  
**Cause:** Telegram message limit = 4096 characters.  
**Fix:** Split long messages in `TelegramHandler.send()` using chunk utility:
```typescript
function chunkMessage(text: string, limit = 4000): string[] {
  const chunks: string[] = [];
  while (text.length > limit) {
    const cut = text.lastIndexOf('\n', limit) || limit;
    chunks.push(text.slice(0, cut));
    text = text.slice(cut);
  }
  chunks.push(text);
  return chunks;
}
```

---

## Debug Checklist

When ZOE is not posting to Telegram:

- [ ] Check VPS cron is running: `crontab -l` → ZOE scheduler entry exists
- [ ] Check scheduler.ts logs: `tail -50 /var/log/zoe-scheduler.log`
- [ ] Verify `TELEGRAM_BOT_TOKEN` in `.env`: `grep TELEGRAM_BOT_TOKEN .env`
- [ ] Verify `TELEGRAM_CHAT_ID` (group ID): send `/start` to bot in DM, check bot received it
- [ ] Test API directly: `curl -s "https://api.telegram.org/bot$TOKEN/sendMessage" -d "chat_id=$CHAT_ID&text=test"`
- [ ] Check bot group membership: open group → Members → confirm bot listed
- [ ] Run ZOE with `ZOE_DRY_RUN=false` and a test task to force a send
- [ ] Check MarkdownV2 parse errors in logs — most "silent" drops are escape failures

---

## Message Templates (ZOE uses these)

### Battle Announcement (sent at battle creation)
```
🎵 *WaveWarZ Battle Alert\!*

[Artist A] vs\. [Artist B]
⏱ Voting opens now → closes in 15 minutes
🔗 Vote: wavewarz\.info/battle/[id]

Even the loser gets paid\. 🏆
```

### Battle Result (sent at battle close)
```
🏁 *Battle Result*

Winner: [Artist A] ✅
Loser payout: [SOL amount] SOL to [Artist B]

Total battles: [N] \| Volume: [SOL] SOL
```

### Governance Session Reminder (sent Thursday 6PM EST)
```
📋 *ZAO Governance — Tonight*

Weekly Fractal session starts in 1 hour\.
Topic: [proposal or regular session]

Join: [Telegram voice link or Juke link]
Bring your ZOR wallet for voting\.
```

### ZAOstock Countdown (sent every other day Aug 1–Oct 3)
```
🎸 *ZAOstock: [N] days away*

Oct 3 \| Ellsworth, ME
8 artists selected by on\-chain battle history
Live DAO governance vote from stage

Free GA tickets → wavewarz\.info/zaostock
```

### 7PM EOD Report (ZOE files daily — from doc 1499)
```
📊 *ZOE Daily Report — [Date]*

WaveWarZ: [battles today] battles \| [SOL] SOL volume
Governance: Next session [date]
ZAOstock: [N] RSVPs \| [days] days out

Escalation: [NONE or issue]
```

---

## Extending ZOE Telegram: Adding a New Message Type

To add a new automated message (e.g., ZABAL S2 weekly update):

1. **Add trigger to scheduler.ts** — new cron entry (e.g., `0 18 * * 1` = Monday 6PM EST)
2. **Add task to work-loop.ts** — new task type: `{ type: "telegram_zabal_weekly", payload: {...} }`
3. **Add handler** — `TelegramHandler.sendZABALWeekly(payload)` → formats message, calls `bot.sendMessage()`
4. **Test with `ZOE_DRY_RUN=true`** — confirm message text is correct in logs
5. **Enable with `ZOE_DRY_RUN=false`** — live send to group

Pattern: always dry-run first, then enable. Never push handler changes directly to prod without dry-run confirmation.

---

## ZOE Telegram Rate Limits (current policy)

| Type | Limit | Source |
|---|---|---|
| Group messages | Max 10/day to main ZAO group | doc 1468 DM rate limits |
| Battle announcements | Max 3/hour during active battle periods | scheduler.ts config |
| Individual DMs (artist outreach) | Max 10/day per handle, 14-day no-repeat | doc 1535 artist activation |
| Governance reminders | 1 Thursday 6PM + 1 same-day morning reminder | scheduler.ts |

---

## Phase 2 Roadmap (Interactive Commands)

Not yet built. Target: integrate with DreamLoop port (doc 1527).

| Command | Function | Priority |
|---|---|---|
| `/battle` | Return current active battle link | High |
| `/stats` | Return live WW API stats | High |
| `/next` | Return next governance session date | Medium |
| `/zaostock` | Return ZAOstock ticket link + days countdown | Medium |
| `/zoe help` | Return command list | Low |

Interactive commands require: (1) webhook setup vs. polling decision, (2) command registration with @BotFather, (3) message parsing in work-loop.ts, (4) security check (only allow commands from admins or any group member?).

---

## Related Docs

- 1468 — ZOE Daily Operations Manual (full toolset, triggers, config)
- 1499 — ZOE Daily Ops Report Template (7PM EOD report content)
- 1527 — ZOE Work-Loop as DreamLoop (Phase 2 architecture)
- 1358 — ZAO Community Channel Ops Guide (Telegram strategy + content matrix)
- 1535 — ZAO Artist Community Activation Pack (DM rate limits + artist DM templates)
- 1447 — ZAO AI Fleet Overview (ZOE context within 8-agent fleet)
