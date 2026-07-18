---
topic: events, community
type: pre-call-brief
status: DO NOW — Kaylan call upcoming; ZAOville is Jul 25 (one week away)
last-validated: 2026-07-18
related-docs: 1228-zaoville-jul25-day-of-runbook, 1516-zaoville-pool-party-protocol, 640-magnetiq-vibes-to-data-pivot
board-tasks: ac482ece (Kaylan call), 30c10c9f (Magnetiq event/launch), 1a6e1fea (Magnetiq bot + TG)
action-owner: Zaal (attend Kaylan call, set up Magnetiq event by Jul 22); ZOL promotes post-call
---

# 1541 — ZAOville × Magnetiq: Pre-Call Brief + Integration Spec

> **Urgency:** ZAOville is July 25. Kaylan call defines scope for Magnetiq event setup. If the event registration + QR check-in isn't live by July 22-23, attendees won't have time to RSVP through Magnetiq. This doc prepares Zaal for the call and specifies the integration steps so execution can start immediately after.

---

## What ZAOville Is (for Kaylan)

ZAOville Pool Party, July 25, Laurel MD (DCoop's house). Free entry, free drinks. 11AM–10PM:
- Open arrival + mixer (11AM–3PM)
- Open mic (3PM)
- Performances (5PM onward)
- Africa Battle Week IRL governance vote (2PM)
- WaveWarZ battle demo through PA (2:10PM)
- Livestream starting at 3PM (ATEM + Restream)

Estimated attendance: 30–80 community members. ZAO core + DMV locals + WaveWarZ community.

Magnetiq already has context: ZABAL Games workshops run on `app.magnetiq.xyz`. The ZAOville event is the next use case.

---

## What Magnetiq Can Do for ZAOville

Based on Magnetiq's vibes-as-data positioning (doc 640, Tyler Stambaugh call May 2026):

| Magnetiq feature | ZAOville use case |
|-----------------|------------------|
| **Event registration** | RSVP page with attendee cap (private venue, manage headcount) |
| **QR check-in** | Scan on arrival → attendee checked in → data captured |
| **Photo upload** | Attendees upload selfies → vibes data |
| **Badges** | Check-in badge, performer badge, governance vote badge |
| **Surveys** | Post-event feedback: "What was your favorite moment?" |
| **Data export** | Attendee list, vibes score, engagement metrics → feeds into ZAO community CRM |

**The core ask to Kaylan:** Set up a ZAOville event on Magnetiq with:
1. RSVP/registration page
2. QR code for check-in at the door
3. Post-event attendee data export

Everything else (photos, badges, surveys) is optional v1.5.

---

## 5 Questions for the Kaylan Call

1. **Setup timeline:** Can a ZAOville event be live on Magnetiq by Tuesday Jul 22? What's the creation flow (Zaal self-serves, or does Kaylan set it up)?
2. **Registration link:** What URL format does Magnetiq generate for event RSVP? (Need to include in promo casts by Jul 20)
3. **QR check-in:** Does Magnetiq generate a printable QR code for the door? Who scans it — a phone app, any browser?
4. **Telegram integration:** Does Magnetiq support webhooks or Telegram notifications when someone checks in? (ZAO TG bot could post "@user just checked in!" in real-time)
5. **Post-event data:** Can Zaal export the attendee list + vibes scores as CSV or JSON after the event?

---

## Desired Outcomes by Jul 25

| Outcome | How |
|---------|-----|
| 30+ RSVPs before event | Magnetiq registration link in all Jul 20-22 promo casts |
| Clean check-in at door | Printed QR code at DCoop's front door |
| Real-time TG notifications (optional) | Magnetiq webhook → ZAO TG bot (see integration spec below) |
| Post-event data for S2 cohort scoring | Attendee list + engagement data exported after event |
| ZOL Farcaster promotion | ZOL posts the Magnetiq RSVP link in /zao + /wavewarz channels |

---

## Magnetiq × Telegram Integration Spec

This covers board task `1a6e1fea` — "Integration: Magnetiq bot + add to TG."

### Option A: Magnetiq Webhook → ZAO TG Bot (real-time check-ins)

**How it works:**
1. Magnetiq fires a webhook POST when someone checks in
2. ZAO TG bot (`@zaoclaw_bot`) receives the webhook and posts to the ZAO Telegram group
3. Post format: `🎉 [name] just checked in at ZAOville! (#N attendee)`

**ZOE implementation** (in `bot/src/zoe/`):

```typescript
// POST /api/webhooks/magnetiq-checkin
// Called by Magnetiq when an attendee checks in
export async function POST(req: Request) {
  const body = await req.json();
  // Expected Magnetiq webhook payload (confirm format with Kaylan):
  // { event_id, attendee_name, attendee_id, checked_in_at, badge_count }
  
  const { attendee_name, badge_count } = body;
  
  // Post to ZAO TG group
  await sendTelegramMessage(
    process.env.ZAO_TG_GROUP_ID!,
    `🎉 ${attendee_name} just checked in at ZAOville! (Attendee #${badge_count})`
  );
  
  return new Response('ok');
}
```

**Env vars needed:**
```
MAGNETIQ_WEBHOOK_SECRET=  # verify webhook authenticity
ZAO_TG_GROUP_ID=          # ZAO main Telegram group ID
```

### Option B: Magnetiq Bot in ZAO TG Group (self-serve)

If Magnetiq has a first-party Telegram bot (check with Kaylan):
1. Add `@magnetiqbot` (or equivalent) to ZAO Telegram group
2. Configure to post check-in notifications automatically
3. No code required

**Ask Kaylan:** Does Magnetiq have a native Telegram integration?

### Option C: Dual-User Research Bot (from doc 640)

The original action item from Tyler Stambaugh's call (May 2026, doc 640): build a Hermes-pattern Telegram bot for Zaal + Tyler to research the ZAO-Magnetiq integration.

This is a separate deliverable from the ZAOville event integration. It belongs in `bot/src/magnetiq/` and requires Tyler to send Magnetiq API docs. Status: not started (no entry point created yet).

**Decision for Kaylan call:** Does the Option A webhook integration make the Option C research bot unnecessary? Or does the dual-user research bot serve a different purpose (ongoing API-to-API integration design)?

---

## ZOL Promotion Plan (after Magnetiq link is live)

ZOL (@zolbot, FID 3338501) posts the RSVP link across Farcaster channels. Draft casts for Zaal to approve:

**Cast 1 — Jul 20 (2 days after Magnetiq link goes live):**
```
ZAOville Pool Party – July 25, Laurel MD

open mic + performances + WaveWarZ battle + Africa Battle Week governance vote

RSVP: [MAGNETIQ_RSVP_LINK]

free entry. first come, dry run for ZAOstock.
```

**Cast 2 — Jul 23 (2 days before event):**
```
ZAOville is in 2 days. 

performers: [names]
vibe code: pool day → performance night → night swim DJ set

RSVP if you haven't: [MAGNETIQ_RSVP_LINK]
```

**Cast 3 — Jul 25 morning (day of):**
```
ZAOville starts today 11AM, Laurel MD.

check in via QR at the door.

if you haven't RSVP'd, DM @bettercallzaal.
```

---

## DNS Status Check (Bonus)

Board task `f91684c1` noted dead AWS IPs for bettercallzaal.com, zlank.online, zaoos.com. Current state (Jul 18, 2026 check):
- `bettercallzaal.com` → `216.198.79.1` → HTTP 200 ✓
- `zaoos.com` → `216.198.79.1` → HTTP 200 ✓
- `zlank.online` → `216.198.79.1` → HTTP 200 ✓

`216.198.79.1` is not the dead AWS IP (`18.204.152.241`). All three domains are live and serving. **DNS task appears already resolved.** Zaal can close task `f91684c1`.

---

## Execution Checklist (post-Kaylan call)

- [ ] Zaal creates ZAOville event on Magnetiq (or Kaylan does it) — by Jul 22
- [ ] Zaal gets RSVP link + QR code — by Jul 22
- [ ] Zaal adds RSVP link to ZAO TG group bio / pinned message — Jul 22
- [ ] ZOL posts Cast 1 in /zao + /wavewarz — Jul 20 (after link is live)
- [ ] Decide: Option A webhook or Option B native bot for TG integration
- [ ] If Option A: add ZAOOS route + env vars, deploy to Vercel
- [ ] Print QR code for DCoop's front door — Jul 24
- [ ] ZOL posts Cast 2 — Jul 23
- [ ] Post-event: export attendee list from Magnetiq — Jul 25 evening
- [ ] Feed attendee list into ZABAL S2 application scoring (doc 1528 cohort)

---

## Related Docs

- [Doc 1228 — ZAOville Jul 25 day-of runbook](../1228-zaoville-jul25-day-of-runbook/) — gear setup, roles, schedule
- [Doc 1516 — ZAOville pool party protocol](../../community/1516-zaoville-pool-party-protocol/) — ZOE tasks + promo templates
- [Doc 640 — Magnetiq vibes-to-data pivot (May 2026)](../../community/640-magnetiq-vibes-to-data-pivot-may2026/) — Tyler Stambaugh call, original bot spec
- [Doc 1528 — ZABAL S2 workshop calendar](../../zabal/1528-zabal-s2-workshop-calendar/) — ZAOville attendance feeds into S2 cohort scoring

## Sources

- Board tasks: `ac482ece` (Kaylan call), `30c10c9f` (Magnetiq event/launch), `1a6e1fea` (Magnetiq bot + TG)
- ZAOOS research docs: 640 (Magnetiq pivot), 1228 (ZAOville runbook), 1516 (pool party protocol), 1528 (ZABAL S2)
- DNS verification: `dig bettercallzaal.com A` → `216.198.79.1`, HTTP 200 (Jul 18, 2026)
