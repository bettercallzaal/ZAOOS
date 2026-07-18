# 1546 — Farcaster /zao Channel Post Guide: Governance-First Content Strategy (Jul–Oct 2026)

**Type:** CONTENT-GUIDE  
**Topic:** Farcaster  
**Status:** ACTIVE — /zao channel is ZAO's governance-identity channel on Farcaster. Distinct from /wavewarz (battle/platform content, doc 1514) — /zao targets DAO governance enthusiasts, researchers, and Web3 builders.

---

## /zao vs. /wavewarz: Channel Distinction

| | /zao | /wavewarz |
|---|---|---|
| Primary audience | DAO governance enthusiasts, Web3 builders, researchers | Music fans, Farcaster-native crypto audience, WaveWarZ players |
| Content angle | Governance data, DAO case study, fractal democracy | Battle results, artist stats, platform features |
| ZOE automation level | Weekly (governance recap) | Per-event (every MAIN battle) |
| Zaal posts | 3-5x/week reply engagement | 1-2x/week original posts |
| Current followers (Jul 2026) | ~93 | Growing from near-zero post-sprint launch |
| Target (Dec 2026) | 250 | 200 (doc 1347) |

---

## Content Pillars for /zao

### Pillar 1 — Governance Streak (weekly)
**Best performer.** 64+ consecutive on-chain governance sessions = single most verifiable unusual fact about ZAO.

Post format: "Week [N] of consecutive on-chain ZAO governance. Held Thursday, [date]. [proposal or regular session]. Streak: [N] sessions. OREC on Optimism: [0xcB05...]"

ZOE posts Thursday evening after each session. Zaal adds reply with personal context 1-2x/month.

### Pillar 2 — WaveWarZ Economics (2x/month)
Surface the "loser earns" stats in governance framing — this is the policy ZAO governs, not just a platform feature.

Post format: "ZAO governed WaveWarZ since 2024. Policy: the losing artist gets paid. As of [date]: [SOL amount] paid to losing artists across [N] battles. On-chain proof: [WW API link]."

### Pillar 3 — ZAOstock Governance Angle (weekly Aug 1–Oct 3)
ZAOstock is the first IRL venue for on-stage DAO governance. The /zao channel audience needs to understand why this matters.

Post format: "ZAOstock Oct 3 = first time ZAO governance happens live on stage in front of an audience. ZOR holders vote in real time. Result = which charity receives that night's community battle payout. Ellsworth ME. [RSVP link]."

### Pillar 4 — ZAOOS Milestones (as-needed)
Announce doc milestones that demonstrate ZAO as a case study.

Post format: "ZAO just filed ZAOOS doc [N]. [1,500 is a milestone — post then]. CC-BY research archive now [N]+ docs: github.com/bettercallzaal/ZAOOS. Every doc = one node in a living DAO case study."

### Pillar 5 — Research + Academic Angle (1x/month)
/zao is where ZAO can attract researchers and governance academics — the Metagov / DAOstar crowd.

Post format: "Looking for DAO governance researchers to study ZAO. 64+ consecutive weekly sessions, 3 Optimism Mainnet contracts, 1,500+ CC-BY research docs. Contact: [email]. ZAOOS: github.com/bettercallzaal/ZAOOS. DAOstar: [link after doc 1513 files]."

---

## Weekly Post Cadence

| Day | Type | Who | Template |
|---|---|---|---|
| Thursday (evening) | Governance recap | ZOE (auto) | TMP-ZAO-01 |
| Monday | WaveWarZ stats or ZAOOS milestone | ZOE (queued) | TMP-ZAO-02 |
| Friday | ZAOstock or governance streak | Zaal (original) | TMP-ZAO-03 or free-form |

**ZOE max: 3 posts/week to /zao.** Keep frequency low — /zao audience is governance-focused, not entertainment-focused. Quality > volume.

---

## Post Templates

### TMP-ZAO-01: Weekly Governance Recap (ZOE — Thursday evening)
```
ZAO governance session [N] — [Date]

Held: [IRL / Juke / Telegram]
ZOR holders present: [count if known]
Vote: [proposal title or "regular session"]
Result: [passed/failed/discussion only]

64+ consecutive on-chain sessions. Zero quorum failures.

OREC: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 (Optimism)
```

### TMP-ZAO-02: WaveWarZ Economics (ZOE — Monday 2x/month)
```
ZAO policy: pay the losing artist.

Since 2024: [N] WaveWarZ battles
Total volume: [SOL] SOL
Paid to losing artists: [SOL] SOL

Verification: wavewarz.info/api/public/stats
Governance: ZOR holders vote on MAIN battle invites every Thursday.
```

### TMP-ZAO-03: ZAOstock Governance Frame (weekly Aug 1 – Oct 3)
```
ZAOstock Oct 3 — Ellsworth, Maine

ZAO will vote from the stage.

ZOR holders in the audience cast live votes for which charity receives 
that night's battle payout. First time on-chain DAO governance 
happens IRL in front of a live audience.

Free GA → wavewarz.info/zaostock
```

### TMP-ZAO-04: ZAOOS Milestone (ZOE — at milestones 1400, 1500, 1600)
```
ZAOOS just passed [N] research documents.

All CC-BY licensed. Every doc = one node in a living DAO case study.
Topics: governance, music economics, Web3 technology, events, identity.

github.com/bettercallzaal/ZAOOS
```

### TMP-ZAO-05: Academic / Research Invite (Zaal — 1x/month)
```
ZAO governance data is publicly available and citable.

64+ consecutive weekly on-chain sessions.
3 Optimism Mainnet contracts (OG, ZOR, OREC).
1,500+ CC-BY research docs.
WaveWarZ public REST API.

For researchers: ZAO is available as a case study for 
DAO governance, music economics, or AI/ops papers.
zaalp99@gmail.com
```

---

## Engagement Rules (Zaal)

- Reply to all comments on /zao posts within 24 hours
- Reply to 3–5 posts/week in /dao, /regen, /governance channels that mention DAO infrastructure (brief organic outreach — do not pitch, just add value)
- Recast: any post that cites WaveWarZ or ZAO from external accounts
- Do NOT recast ZOE's automated posts — Zaal's recasts signal human endorsement; keep them selective

---

## ZOE Automation Setup for /zao

ZOE posts to /zao via Neynar signer. Requires:
- Neynar managed signer with /zao channel posting access
- Signer rotation every 30 days (doc 1468 monthly rotation tasks)
- `NEYNAR_SIGNER_UUID` in VPS env pointing to /zao-authorized signer

**Post targets per post:**
- Minimum: 200 impressions (channel-native)
- Stretch: 500 impressions (with reply engagement from Zaal)
- ZOE tracks impressions via Neynar API after each cast, logs to 7PM EOD report (doc 1499)

---

## Follower Growth Targets (Jul–Dec 2026)

| Milestone | Target Date | Strategy |
|---|---|---|
| 100 followers | Aug 15 | Mini App launch announcement cross-posted to /zao |
| 150 followers | Oct 3 | ZAOstock on-stage governance vote cast (highest-engagement moment) |
| 200 followers | Nov 1 | Post-ZAOstock recap + ZABAL S2 mid-point governance posts |
| 250 followers | Dec 2026 | Annual report + 2027 ZAOstock tease |

**Single biggest /zao follower acquisition event:** ZAOstock Oct 3 on-stage governance vote live-post. ZOE posts real-time vote count from stage; Zaal RTs from personal account. Target: 500+ impressions on that single cast → converts 10-15 new followers.

---

## Cross-Channel Coordination

| Event | /zao post | /wavewarz post |
|---|---|---|
| Thursday governance | Session recap (TMP-ZAO-01) | None (governance = /zao only) |
| MAIN battle result | Economics framing (TMP-ZAO-02, monthly) | Battle result cast (TMP-WW-02, each battle) |
| ZAOstock Oct 3 | On-stage governance vote live | Artist battle result + audience reaction |
| ZAOOS milestone | ZAOOS milestone (TMP-ZAO-04) | None |
| Africa Battle Week Sep 26 | Governance framing (ZOR vote chose Africa) | Battle results (ZOE via API) |

Do NOT double-post the same content to both channels. /zao = governance angle, /wavewarz = platform/music angle.

---

## Metrics ZOE Tracks (in 7PM EOD Report)

| Metric | Source | Frequency |
|---|---|---|
| /zao follower count | Neynar API | Weekly (Monday) |
| /zao weekly impressions | Neynar API | Weekly |
| /zao post engagement rate | Neynar API | Per post |
| /zao highest-impression cast | Neynar API | Weekly |

ZOE flags if /zao follower count stalls for 2+ consecutive weeks → escalate to Zaal for manual engagement push (reply to governance posts in /dao, /regen).

---

## Related Docs

- 1514 — /wavewarz Farcaster Channel Sprint Plan (companion channel — distinct content, same ZOE toolchain)
- 1530 — ZAO Farcaster Content Calendar Aug 2026 (6-week /wavewarz calendar — align /zao themes)
- 1374 — ZAO Farcaster /zao Channel Growth Strategy (original growth strategy doc)
- 1480 — WaveWarZ Farcaster Mini App Spec (Mini App = cross-posts to both channels from Aug 15)
- 1468 — ZOE Daily Operations Manual (Neynar signer setup + rotation)
- 1499 — ZOE Daily Ops Report (where /zao metrics land)
- 1542 — ZAO GEO Entity Brief (entity facts = source content for TMP-ZAO-02 + TMP-ZAO-05)
