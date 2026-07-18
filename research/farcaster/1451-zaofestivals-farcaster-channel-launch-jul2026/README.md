# 1451 — /zaofestivals Farcaster Channel Launch Spec (Jul 2026)

> **Type:** DECISION
> **Status:** READY TO LAUNCH
> **Owner:** Zaal + ZOE
> **Created:** 2026-07-18

---

## What This Doc Covers

Launch specification for the `/zaofestivals` Farcaster channel — purpose, differentiation from existing channels (`/zao`, `/cocconcertz`), channel settings, posting cadence, 3-month content plan (Jul–Sep 2026), ZOE automation hooks, and North Star impact targets.

---

## Why a Dedicated Channel

| Channel | Focus | Audience |
|---------|-------|----------|
| `/zao` | DAO governance, ZABAL, onchain ops, WaveWarZ | Crypto-native ZAO community |
| `/cocconcertz` | COC show announcements, clips, artist spotlights | Music fans + show attendees |
| `/zaofestivals` | ZAOstock + future festivals: logistics, lineup, behind-scenes | Local Maine community, music festival crowd, web3-curious artists |

The `/zao` channel skews governance-heavy and alienates festival-curious non-web3 users. `/cocconcertz` is show-specific, not venue/festival-scale. `/zaofestivals` creates a dedicated funnel for the IRL festival audience — people who care about ZAOstock but not necessarily about ZABAL or onchain Respect.

**North Star hypothesis:** `/zaofestivals` as a distribution layer converts IRL attendees → Farcaster followers → `/zao` community over a 6-month arc.

---

## Channel Config

| Field | Value |
|-------|-------|
| Channel handle | `/zaofestivals` |
| Display name | ZAO Festivals |
| Description | ZAOstock + future ZAO IRL events — lineup, logistics, behind-the-scenes from a web3-native music festival in Maine |
| Channel image | ZAOstock logo (see doc 1435 brand pack — COC=#FF3366 or ZAO=#F5A623 background) |
| External URL | zaostock.xyz (or zaofestivals.xyz when live) |
| Moderation | Zaal + ZOE auto-filter (spam score > 0.7 mute) |

**Setup action (Zaal-gated):** Create channel at warpcast.com/~/create-channel. Takes ~2 minutes, no cost.

---

## Differentiation Rules

What belongs in `/zaofestivals` vs other channels:

**Post here:**
- ZAOstock ticket milestones ("50 signups", "sold out alert")
- Lineup drops and artist spotlights for festival performers
- Logistics updates (venue, dates, lodging, travel tips)
- Volunteer and vendor callouts
- Behind-the-scenes build content (stage setup, permits, sponsor partners)
- Post-show photo/video drops from ZAOstock
- Future festival announcements (expansion beyond Maine)

**Do NOT post here (wrong channel):**
- ZABAL token launches → `/zao`
- WaveWarZ online battle results → `/zao` or `/cocconcertz`
- COC show clips → `/cocconcertz`
- Governance votes → `/zao`

---

## Posting Cadence

### Jul 2026 (Pre-Launch Phase — 2–3 posts/week)

Focus: Build the channel, attract early followers, create FOMO.

| Cadence | Format |
|---------|--------|
| Monday | Logistics update or countdown ("X days until ZAOstock") |
| Thursday | Artist spotlight or behind-the-scenes reel |
| Saturday (show day/event day) | Live update or photo drop |

### Aug 2026 (Momentum Phase — 4 posts/week)

Focus: Sustained drip of lineup reveals, volunteer/vendor sign-ups, permit milestones.

| Cadence | Format |
|---------|--------|
| Monday | Weekly countdown + ticket count |
| Wednesday | Artist Q&A or studio session clip |
| Friday | Logistics milestone ("venue confirmed", "permit filed") |
| Weekend | Community cast: ask followers for input (set list, food vendors, etc.) |

### Sep 2026 (Launch/Event Phase — daily or near-daily)

Focus: Live coverage, post-show wrap, future dates.

| Cadence | Format |
|---------|--------|
| T-7 | Full lineup reveal cast |
| T-3 | Travel guide cast |
| T-1 | "See you tomorrow" hype cast |
| Event day | 3–5 live updates (stage, crowd, WaveWarZ battles if applicable) |
| T+1 | Photo/video drop recap |
| T+3 | "Thank you" cast + ticket waitlist for 2027 |

---

## Content Formulas (ZOE-Ready Templates)

### 1. Ticket Milestone
```
[X] signups for ZAOstock — we're [X]% of the way to sold out.

Still open: [link]

🎸 Maine. [Month] [Year]. Web3 music festival, no VC money, all community.
```

### 2. Artist Spotlight
```
Meet [Artist Name].

They've played [context]. They're bringing [what] to ZAOstock.

[Short quote or fact]

Full lineup dropping [date].
```

### 3. Logistics Update
```
ZAOstock update:

✅ Venue locked — [Venue Name], Ellsworth ME
✅ Permits filed
⏳ Food vendors: 3 confirmed, 2 pending
⏳ Stage: setup crew confirmed

[X] days away.
```

### 4. Countdown Cast
```
[X] days until ZAOstock.

Tickets: [link]
Volunteer: [link]
Vendors: [link]

Tag someone who should be there.
```

### 5. Community Ask
```
Quick question for anyone coming to ZAOstock:

What food truck would make you drive to Ellsworth, Maine?

(We're finalizing vendor list this week — real input welcome)
```

---

## ZOE Automation Hooks

These slots in the ZOE weekly cadence should be updated to include `/zaofestivals` posts:

| ZOE Trigger | Current behavior | New behavior |
|-------------|-----------------|--------------|
| Monday morning content run | Posts to `/zao` + `/cocconcertz` | Add `/zaofestivals` ticket countdown if ZAOstock <90 days out |
| ZAOstock form response (doc 1442) | No Farcaster output | When signups hit 25/50/100 milestones, auto-post ticket milestone template to `/zaofestivals` |
| Artist confirmation (doc 1442 artist list) | No Farcaster output | Queue artist spotlight cast for ZOE review → post to `/zaofestivals` |
| Post-show photo ingest | Posts to `/cocconcertz` | If ZAOstock photos, post to `/zaofestivals` instead |

ZOE implementation: update `bot/src/zoe/channels.ts` (or equivalent) to add `zaofestivals` as a target channel with the above trigger conditions.

---

## Launch Checklist

- [ ] **Zaal:** Create `/zaofestivals` channel on Warpcast (5 min)
- [ ] **Zaal:** Upload channel image (ZAOstock logo or ZAO=#F5A623 branded image)
- [ ] **ZOE:** Add `zaofestivals` channel ID to posting config
- [ ] **Zaal/ZOE:** Post inaugural cast announcing the channel (see template below)
- [ ] **Zaal:** Cross-post inaugural announcement to `/zao` + @bettercallzaal personal feed
- [ ] **ZOE:** Set up ticket milestone triggers from ZAOstock form (doc 1442)
- [ ] **Zaal:** Add `/zaofestivals` channel link to ZAOstock landing page

### Inaugural Cast Template

```
Launching /zaofestivals today.

ZAOstock is a web3-native music festival in Ellsworth, Maine — built entirely by
a decentralized community, funded onchain, no VC backing.

This channel is where we build it in public: lineup drops, logistics, 
behind-the-scenes, and the moments that make it real.

Follow if you want to watch (or help build) what a community-owned festival looks like.

🎸 zaostock.xyz
```

---

## North Star Distribution Impact

From the ZAO distribution model (doc 1432, doc 1441):

| Metric | Baseline | 90-day Target | How |
|--------|----------|--------------|-----|
| `/zaofestivals` followers | 0 | 150 | Inaugural cast + cross-post amplification + ZAOstock day-of surge |
| `/zao` channel followers gained from `/zaofestivals` referral | 0 | +30 | Cross-channel CTAs, governance posts that link back |
| ZAOstock form signups from Farcaster | 0 | 20 | Ticket milestone casts → form link CTA |
| Farcaster-native artists discovered | 0 | 3–5 | Artist spotlight engagement → DM funnel |

**Key lever:** ZAOstock event-day live coverage is the highest-potential single spike. One strong day-of cast thread can pull 50–100 new followers. Plan a 3–5 cast thread for ZAOstock day with photos.

---

## Related Docs

- [1432 — ZAO Cross-Channel Content Calendar H2 2026](../community/1432-zao-cross-channel-content-calendar-h2-2026/)
- [1441 — ZAO Lapsed Member Re-engagement Jul 2026](../community/1441-zao-lapsed-member-reengagement-jul2026/)
- [1441 — ZAO Farcaster Channel Growth Strategy H2 2026](./1441-zao-farcaster-channel-growth-strategy/) (note: same number, different subfolder)
- [1442 — ZAOstock Google Form Spec Jul 2026](../events/1442-zaostock-google-form-spec-jul2026/)
- [1425 — WaveWarZ Farcaster Mini App Spec](./1425-wavewarz-farcaster-miniapp-spec/)
- [1335 — COC #7 Post-Show Farcaster Thread](./1335-coc7-farcaster-thread-jul2026/)

---

## Open Decisions

| Decision | Options | Deadline |
|----------|---------|----------|
| Who moderates channel long-term? | Zaal only vs. ZOE auto-filter + Zaal review | Before launch |
| Cross-post COC show content to /zaofestivals? | No (keep separate) vs. Yes when artist is ZAOstock-confirmed | Before first COC#8 post |
| Channel expansion scope: only ZAOstock or all ZAO IRL events? | ZAOstock-only for 2026, expand in 2027 (recommended) | Before inaugural cast |
