# 1615 — ZOE Architecture & Hurricane Handoff Spec

**Type:** TECHNICAL-REFERENCE  
**Topic:** Technology  
**Status:** ACTIVE — Hurricane wires each system; ZOE executes. This is the canonical reference for how ZOE is configured, what it can do, and what Hurricane must build to make it work. Updated when new capabilities are added.

---

## What ZOE Is

ZOE is ZAO's AI operations agent — a Claude-powered system that handles the routine, time-triggered, and data-dependent tasks that would otherwise require Zaal's daily attention. ZOE is not a single app or service; it is a set of integrations between data sources, messaging platforms, and automation triggers.

**ZOE's role:** Execute time-based and event-based tasks autonomously, draft posts/reports for Zaal's approval when needed, and surface decisions that require Zaal's judgment.

**What ZOE never does without Zaal's approval:**
- Send money or trigger on-chain transactions
- Publish Mirror articles
- Send pitch emails to media/grants
- Close or settle a WaveWarZ battle

**What ZOE does autonomously:**
- Social posts (X, Farcaster, Telegram) using pre-approved templates
- EOD reports (Telegram to Zaal)
- Battle-result announcements (after battle closes on wavewarz.info)
- ZABAL attendance tracking + at-risk alerts
- ZAOstock attendee welcome sequences

---

## System Map

```
Data Sources                   ZOE Core                      Output Channels
─────────────────              ──────────────                ──────────────────
wavewarz.info/api              ┌──────────────┐              X (@wavewarz,
  /public/stats         ──▶   │   ZOE Agent  │   ──▶        @bettercallzaal)
                               │  (Claude AI) │
Supabase                ──▶   │              │   ──▶        Farcaster /wavewarz
  zabal_s2_participants        │  Triggered   │              /zao /zabal
  zabal_s2_attendance          │  by:         │
  zabal_s2_milestones          │  - Cron      │   ──▶        Telegram
  zaostock_2026_attendees      │  - Webhooks  │              (ZAO ops channel,
                               │  - Events    │               ZAO public, ZABAL)
WaveWarZ API            ──▶   └──────────────┘
  battle results                                ──▶        Mirror (draft only,
                                                            Zaal publishes)
Eventbrite webhook
  RSVP events
```

---

## ZOE Trigger Types

### 1. Cron Triggers (time-based)

| Trigger | Time | Task | Hurricane builds |
|---|---|---|---|
| Daily 7PM EOD | Every day 7PM EST | EOD report (Telegram to Zaal) | Cron → ZOE → Telegram |
| Monday 2PM ZABAL | Sep 1–Nov 21, Mondays | ZABAL S2 session reminder | Cron → ZOE → Telegram |
| Sunday midnight | Every Sunday | Artist stat sync from WW API | Cron → `syncArtistStatsFromApi()` |
| Thursday morning | Every Thursday (during ZABAL) | At-risk check → alert | Cron → `runAtRiskCheck()` |
| Jul 22 8AM | One-time | FA application reminder | Cron (one-shot) → Telegram |
| Jul 23 9AM | One-time | Green Pill pitch draft | Cron → ZOE draft → Zaal approves |
| Aug 1 9AM | One-time | Mirror Article 1 publish alert | Cron → Telegram "publish now" |

**Implementation:** Hurricane uses Vercel Cron or Railway Cron. Each cron fires a webhook to `/api/zoe/trigger` with the trigger name and any params.

### 2. Event Triggers (webhook-based)

| Event | Source | ZOE Action |
|---|---|---|
| WaveWarZ battle closes | wavewarz.info webhook | Post battle result (winner/loser/SOL amounts) to X + Farcaster + Telegram |
| Eventbrite RSVP received | Eventbrite webhook | Add to `zaostock_2026_attendees` → send Message 1 (welcome) |
| ZABAL milestone logged | Supabase trigger | ZOE acknowledgment DM to participant |
| ZOR vote window opens | Governance trigger (manual) | Post vote reminder to all ZOR holders |

**Implementation:** Hurricane wires the webhooks to `/api/zoe/event` with event type and payload.

### 3. On-Demand (Zaal triggers)

| Command | Where | ZOE Action |
|---|---|---|
| `zoe post [template_name]` | Telegram bot | ZOE generates post from template, sends to Zaal for approval |
| `zoe stats` | Telegram bot | ZOE fetches live stats, returns formatted block |
| `zoe eod` | Telegram bot | ZOE generates EOD report immediately |
| `zoe zabal status` | Telegram bot | ZOE returns ZABAL S2 status block |
| `zoe draft mirror` | Telegram bot | ZOE generates Mirror Article draft, sends to Zaal |

---

## ZOE Telegram Bot Setup

**Bot name:** @ZOEBot (internal name — public handle TBD by Hurricane)  
**Framework:** Telegram Bot API + Python or Node.js  
**Auth:** BOT_TOKEN in Hurricane's environment

ZOE monitors a specific Telegram group (ZAO Ops) for commands prefixed with `/zoe` or `zoe`. Zaal is the only admin.

### Message posting pattern

ZOE uses the Telegram Bot API to:
1. Post to **ZAO Ops group** (private, Zaal + ZOE): EOD reports, alerts, decision prompts
2. Post to **ZAO Public Telegram** (300+ members): announcements (battle results, event news)
3. Post to **ZABAL S2 group**: session reminders, at-risk alerts (to participant only)

```typescript
// Pattern from doc 1601
async function sendTelegramMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  })
}
```

---

## ZOE X (Twitter) Integration

**Account:** @wavewarz (primary WW posts), @bettercallzaal (Zaal's personal, major milestones)  
**Auth:** Twitter API v2 bearer token + OAuth 1.0a for posting  
**Approval flow:** ZOE drafts → sends Telegram preview to Zaal → Zaal replies "ok" → ZOE posts

### Auto-post cases (no approval needed)

These templates are pre-approved. ZOE posts without Zaal confirmation:
- Battle result (after battle closes): "🎵 Battle result: [winner] defeated [loser] / The loser earned [X] SOL / [N] total battles / wavewarz.info"
- ZOR vote reminder (standard): pre-approved text, ZOE schedules
- ZAOstock ticket milestone (25/50/100/200 RSVPs): pre-approved text

### Draft-and-approve cases

Everything else — new pitches, event announcements, mirror article lede — requires Zaal's "ok" via Telegram.

---

## ZOE Farcaster Integration

**Signer:** Neynar managed signer (from doc 1562 sponsor activation — Neynar is a ZAOstock partner)  
**Channels:** /wavewarz (battle results), /zao (governance + major news), /zabal (ZABAL program)  
**Framework:** Neynar signer → ZOE API call → cast published

```typescript
// Neynar cast pattern
async function castToFarcaster(text: string, channelId: string) {
  await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': NEYNAR_API_KEY
    },
    body: JSON.stringify({
      signer_uuid: NEYNAR_SIGNER_UUID,
      text,
      channel_id: channelId
    })
  })
}
```

---

## ZOE Stats Data Source

ZOE always fetches stats from `wavewarz.info/api/public/stats` (doc 1574, PR #136 in wwtracker). Never uses hardcoded numbers.

```typescript
async function getWwStats() {
  const res = await fetch('https://wavewarz.info/api/public/stats')
  return res.json()
}
```

ZOE builds stat blocks like:
```
WaveWarZ stats (as of [updatedAt]):
Battles: [battles.total] total ([battles.mainBattles] MAIN / [battles.quickBattles] quick)
SOL volume: [volume.totalSol] SOL ($[volume.totalUsd])
Artist payouts: [artistPayouts.totalSol] SOL
```

---

## ZOE EOD Report Format (7PM EST Daily)

Sent to ZAO Ops Telegram group:

```
ZOE EOD Report — [date] 7PM

WAVEWARZ
Today's battles: [N]
7-day volume: [X] SOL
Live battle right now: [yes/no]

ZABAL S2 [during Sep 1-Nov 21 only]
Active participants: [N]
At-risk (3 misses): [N]
ZAOstock confirmations: [N]

ZAOSTOCK
Eventbrite RSVPs: [N] (goal: 500)
Milestone: [next milestone] at [N] RSVPs

DECISIONS NEEDED
[list of any pending decisions, or "None"]

UPCOMING (next 7 days)
[list key dates]
```

---

## Hurricane Build Checklist

### Phase 1 — By Aug 15 (ZAOstock Eventbrite launch)

- [ ] Telegram bot deployed (BOT_TOKEN set)
- [ ] ZOE posts to ZAO Ops Telegram (test send)
- [ ] ZOE posts to ZAO Public Telegram (test send)
- [ ] Eventbrite webhook: RSVP → `addAttendeeFromEventbrite()` → Message 1 (doc 1585)
- [ ] ZOE EOD report: daily 7PM Telegram cron
- [ ] ZOE `zoe stats` command: returns live WW stats block
- [ ] ZOE `zoe zabal status` command: returns ZABAL S2 status block (placeholder until Sep 1)

### Phase 2 — By Aug 22 (before ZABAL S2 dry-run)

- [ ] ZABAL Supabase tables live (doc 1601)
- [ ] ZOE attendance recording after Monday sessions
- [ ] ZOE at-risk check running (Thursday crons)
- [ ] ZOE ZABAL status block in EOD report

### Phase 3 — By Sep 1 (ZABAL S2 start)

- [ ] ZOE Monday 2PM ZABAL session reminders (Sep 1–Nov 21)
- [ ] ZOE `sendTelegramMessage()` to participant Telegram handles working
- [ ] Artist stat sync running Sunday midnight

### Phase 4 — By Sep 30 (ZAOstock week before)

- [ ] ZOE ZAOstock attendee message sequences armed (doc 1585 all 4 messages)
- [ ] ZOE real-time post schedule for Oct 3 (doc 1597 — 9 time-triggered posts)
- [ ] ZOR voter sub-sequence armed (Sep 30)

### Phase 5 — By Nov 20 (ZABAL graduation)

- [ ] `checkMicrograntEligibility()` function tested on real ZABAL S2 data
- [ ] ZOE eligibility report posted to ZAO Ops Telegram Nov 20

---

## Environment Variables

```
# Telegram
TELEGRAM_BOT_TOKEN=
ZAAL_TELEGRAM_ID=         # Zaal's personal chat ID
ZAO_OPS_CHAT_ID=          # ZAO Ops group
ZAO_PUBLIC_CHAT_ID=       # ZAO public Telegram
ZABAL_S2_CHAT_ID=         # ZABAL S2 group

# X (Twitter)
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=       # @wavewarz
TWITTER_ACCESS_SECRET=      # @wavewarz

# Farcaster/Neynar
NEYNAR_API_KEY=
NEYNAR_SIGNER_UUID=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# WaveWarZ
WW_STATS_URL=https://wavewarz.info/api/public/stats
```

---

## Related Docs

- 1601 — ZOE Supabase Integration Patterns (all table schemas + TypeScript functions ZOE calls)
- 1585 — ZAOstock Attendee Pre-Event Welcome Pack (Eventbrite webhook → 4-message sequence)
- 1588 — ZABAL S2 Curriculum (session schedule ZOE reminds for)
- 1597 — ZAOstock Line of Show (9 ZOE time-triggered posts Oct 3)
- 1499 — ZOE Daily Operations Report Spec (earlier EOD report spec — this doc updates it)
- 1544 — ZOE Telegram Bot Ops Guide (Telegram-specific config — this doc supersedes it for architecture overview)
