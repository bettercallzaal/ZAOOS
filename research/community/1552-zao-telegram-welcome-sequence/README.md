# 1552 — ZAO Telegram Welcome Sequence: New Member Onboarding (Jul 2026)

**Type:** COMMUNITY-PLAYBOOK  
**Topic:** Community  
**Status:** ACTIVATE NOW — ZOE should fire the welcome sequence for every new member who joins the ZAO main Telegram group. Current state: no automated welcome exists; new members arrive to silence. This doc fixes that.

---

## Why a Welcome Sequence Matters

New members who receive a welcome within 1 hour of joining are 3× more likely to post their first message within 24 hours (general community management benchmark). ZAO's Telegram is its highest-activity community channel but currently has no onboarding flow.

**Current gap:** A new member joins → ZOE is silent → member lurks → 70% of lurkers go inactive within 2 weeks.

**Fix:** 3-message automated welcome sequence from ZOE within 15 minutes of join.

---

## Welcome Sequence (3 Messages)

ZOE sends to the group (not DM) so existing members see and can welcome alongside. Space messages by 2 minutes each.

### Message 1: The Welcome (ZOE sends within 15 min of join)
```
👋 Welcome to ZAO, [Name]!

You just joined one of the longest-running music DAOs in Web3 — 64+ consecutive 
weekly governance sessions and counting.

Quick orientation:
→ WaveWarZ: wavewarz.info (music battles where the loser still gets paid)
→ ZAOstock: Oct 3, Ellsworth ME (festival + live DAO governance on stage)
→ ZABAL S2: applications open Aug 1 if you build or make music

What brings you here?
```

### Message 2: The Story (ZOE sends 2 min later)
```
Since 2024, ZAO members have voted on:
• Which artists headline WaveWarZ battles 🎵
• Which charities receive battle payouts ❤️
• When to take ZAOstock international (Africa Battle Week, Sep 26)

Every vote is on-chain. Every payout is traceable.
ZAO is a music DAO that actually does things IRL.

Full archive: github.com/bettercallzaal/ZAOOS (1,550+ CC-BY research docs)
```

### Message 3: The Invite (ZOE sends 4 min after first message)
```
How to get more involved:

🎤 Artists: DM @[Zaal handle] to get into a WaveWarZ MAIN battle
🔨 Builders: Apply to ZABAL S2 at wavewarz.info (Aug 1 open)
🗳️ Holders: Bring your ZOR token to Thursday's governance session
🎫 Anyone: RSVP ZAOstock Oct 3 → wavewarz.info/zaostock (free GA)

Questions? Drop them here — Zaal or ZOE will answer within 24h.
```

---

## Timing Variants

| Trigger | Adjustment |
|---|---|
| New member joins Mon–Fri 9AM–9PM EST | Fire all 3 messages at 2-min intervals |
| New member joins after 9PM EST | Delay Message 1 to 8AM next morning — no late-night bot spam |
| New member joins during COC show night | Hold welcome until show ends (show content = primary channel) |
| 3+ new members join same hour | Batch into one welcome mentioning all: "👋 Welcome [A], [B], [C]!" |

---

## Personalization Rules (ZOE)

- If new member has "artist" in bio or links to music: adjust Message 3 → lead with the artist path
- If new member came via ZABAL S2 referral link: add "We saw you found us through ZABAL — applications open Aug 1!"
- If new member has ZOR token in wallet (ZOE checks Optimism wallet if linked): add "ZOR holder detected — Thursday governance session info here: [link]"
- If new member is from Africa (time zone or bio): adjust Message 2 → add Africa Battle Week highlight

---

## Follow-Up Sequence (ZOE, triggered if no reply within 72 hours)

If a new member receives the welcome but doesn't post within 72 hours, ZOE sends one follow-up to the group (mentions the member):

```
Hey [Name] — quick check-in! 

Is there something specific about WaveWarZ or ZAO you'd like to know more about? 
Or just lurking for now? Both are fine — we're a pretty active group most days 🎵
```

ZOE only sends this once. If no reply after that, member is left to engage on their own timeline.

---

## Exit Sequence (ZOE, triggered when member leaves group)

When a member leaves the ZAO Telegram, ZOE logs:
- Username + date left → community churn tracking (doc 1522 member services)
- If member was ZABAL S2 participant, ZOE alerts Zaal: "[Name] left Telegram — ZABAL S2 at-risk flag"

No automated re-invite DM (too aggressive). Zaal handles manual re-outreach if the member was active.

---

## Welcome Message Configuration (ZOE Settings)

| Parameter | Value |
|---|---|
| Trigger | New member joins ZAO main Telegram group |
| First message delay | 0–15 minutes after join |
| Message 2 delay | +2 minutes |
| Message 3 delay | +4 minutes |
| Evening hold time | 9PM–8AM EST |
| Batch threshold | 3+ joins within 1 hour → batch greeting |
| Follow-up trigger | No post within 72 hours |
| Follow-up message count | 1 maximum |
| Dry run mode | `ZOE_DRY_RUN=true` logs without sending |

---

## Metrics ZOE Tracks

| Metric | Target | Source |
|---|---|---|
| New member → first post within 24h | ≥40% | Telegram logs |
| New member → still active at 14 days | ≥30% | Telegram logs |
| Welcome message engagement (replies to welcome) | ≥20% | Telegram logs |
| Members who clicked ZAOstock RSVP link from welcome | Track separately | Eventbrite + UTM parameter |

ZOE adds utm_source=telegram_welcome to ZAOstock RSVP link in Message 3 to track conversions.

---

## A/B Test (Optional, Post-ZAOstock)

After ZAOstock, test 2 variants:
- **Variant A (current):** Group-public welcome (3 messages, as above)
- **Variant B (DM welcome):** ZOE sends a private DM to new member (same content, more personal)

Hypothesis: DM welcome has higher reply rate but lower overall visibility. Public welcome keeps existing members warm.

Run for 30 days post-ZAOstock, compare first-post-within-24h rates. Adopt winning variant for 2027 community.

---

## ZAO Community Orientation Cheat Sheet (Pinned Message)

Update the group's pinned message to match the welcome sequence context:

```
📌 ZAO — Music DAO running WaveWarZ on Solana

→ WaveWarZ battles: wavewarz.info
→ ZAOstock Oct 3 (Ellsworth ME): wavewarz.info/zaostock  
→ ZABAL S2 applications: wavewarz.info (opens Aug 1)
→ Governance: Thursday via Telegram/Juke — all ZOR holders welcome
→ Research archive (CC-BY): github.com/bettercallzaal/ZAOOS

@[ZOE bot handle] posts battle results + governance recaps.
Questions? Post here — Zaal or ZOE replies within 24h.
```

ZOE updates the pinned message after each major milestone (1,500 battles, ZAOstock, ZABAL S2 launch).

---

## Related Docs

- 1472 — ZAO Telegram Community Operations Guide (full ops doc — this is the onboarding add-on)
- 1522 — ZAO Member Services Directory (what the welcome messages link to)
- 1535 — ZAO Artist Community Activation Pack (artist-specific DMs — not Telegram welcome)
- 1468 — ZOE Daily Operations Manual (ZOE config + Telegram bot setup)
- 1544 — ZOE Telegram Bot Operations + Debug Guide (technical setup for welcome sequence)
- 1358 — ZAO Community Channel Ops Guide (channel strategy — welcome is part of community health)
