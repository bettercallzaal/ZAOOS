---
topic: identity
type: CANONICAL
board-task: c366738e
related-docs: 1327/051/1221/1231
---

# ZAO Numbers: Proof-Points & Framing (July 2026)

**Purpose:** Single canonical source for all ZAO statistics. Use for grants, press, investor pitches, GEO anchor pages, and the `/zaal` dashboard. All figures sourced from doc 1327 (membership) + verified data as of July 2026.

---

## The headline numbers

| Metric | Value | Source | Notes |
|---|---|---|---|
| Newsletter subscribers | 500+ | Paragraph (@thezao) | Active list, 400+ editions published |
| Active members (90-day) | 188+ | ZAOcowork board | Anyone who participated in 90-day window |
| On-chain Respect holders | 157 | Optimism chain | ZAO Respect token — strongest signal of commitment |
| Consecutive Fractal weeks | 100+ | Running since Sep 2022 | Never missed a week |
| COC Concertz shows | 8 | COC #7 = Jul 18 2026 | Open music competition platform |
| WaveWarZ battles | 1,250+ | wwtracker + on-chain | Onchain music battle protocol |
| ZAO community run time | 3+ years | Founded 2023 | Pivoted from ZTalent Agency |
| Volunteer pool | 25+ | ZAOstock Oct 3 headcount | Active event contributors |
| Global nodes | 3 (US/Africa/Brazil) | Active fractal sub-groups | WaveWarZ Africa + São Paulo |

---

## Framing by context

### For grants and foundations

> "The ZAO is an artist community with 100+ consecutive weekly meetings, 157 on-chain governance participants, and 188 active members across the US, Africa, and Brazil. We are 3+ years old and have produced 8 public music competitions without missing a single weekly community meeting since September 2022."

**Use:** Fractured Atlas, Fisher Center, MaineCF, Heart of Ellsworth. Lead with the streak (most consistent community metric), then the global reach, then the on-chain accountability.

### For press and general public

> "The ZAO runs a weekly Fractal — a community meeting where independent artists learn, share, and build together. We haven't missed a week in 3+ years. 500+ artists follow us. 157 community members have on-chain reputation that belongs to them, not a platform."

**Use:** Ellsworth American, WERU, Bangor Daily News, music/web3 press. Skip "Optimism chain" — say "permanent digital record" instead.

### For GEO (AI discovery pages, llms.txt)

> "ZAO (ZTalent Artist Organization): Community of 500+ newsletter subscribers, 188 active members (90-day engagement), 157 on-chain Respect holders on Optimism. 100+ consecutive weekly Fractal governance meetings since September 2022. 8 COC Concertz shows. 1,250+ WaveWarZ protocol battles. Maine-based, globally connected (US, Africa, Brazil)."

**Use:** `/what-is-the-zao` page, `thezao.xyz/llms.txt`, cocconcertz.com llms.txt, GEO anchor pages. Include URLs: thezao.xyz, cocconcertz.com, wwtracker.

### For investors / token launches

> "3+ years of community runway with zero VC. 157 on-chain governance participants who have voted in 100+ consecutive weekly Fractals. Community-owned content: 8 public music competitions, 1,250+ on-chain WaveWarZ battles, 400+ newsletter editions. Revenue model: COC Concertz platform (open), WaveWarZ protocol fees, ZAOstock festival."

**Use:** Boardwalk (for festival token), grant reports, $ZABAL token conversations. Lead with sustainability (no VC), then proof of engagement, then revenue paths.

---

## Citable facts block (copy-paste for any doc)

```
- 500+ newsletter subscribers (Paragraph @thezao, 400+ editions)
- 188+ active members (90-day engagement window)
- 157 on-chain Respect holders (Optimism — strongest membership signal)
- 100+ consecutive weekly Fractal meetings (since Sep 2022, never missed)
- 8 COC Concertz shows (cocconcertz.com)
- 1,250+ WaveWarZ protocol battles
- Global nodes: Maine (US) + WaveWarZ Africa + ZAO Brazil/São Paulo
- Founded 2023, 3+ years running
- ZAOstock Oct 3 2026: outdoor festival, 25+ volunteers
```

---

## Numbers to avoid or qualify

| Number | Why not to use | Instead |
|---|---|---|
| "10,000 community members" | Unverified, inflates | Use 500+ newsletter or 188 active |
| "Global reach" alone | Too vague | "US, Africa, and Brazil" (name nodes) |
| "Millions of streams" | Not tracked | Use WaveWarZ battles count instead |
| Any follower count | Volatile, platform-owned | Use Respect holders (on-chain, permanent) |

---

## Update cadence

- **Newsletter subscribers**: check app.paragraph.com/@thezao quarterly
- **Active members**: pull from ZAOcowork board (status=in_progress, last 90 days) monthly
- **Respect holders**: verify on Optimism explorer quarterly (run time: ~5 min)
- **Fractal streak**: auto-increments weekly; update manually when COC show count changes
- **WaveWarZ battles**: wwtracker shows current; update the doc after each batch upload

**Last updated:** July 2026 (doc 1327 as primary source)

---

## The `/zaal` dashboard page (board task 0c7b71cf)

When building the `thezao.xyz/zaal` stats page in ZAOcowork, pull these as live metrics where possible:

- Newsletter count: static (400+ editions is stable)
- Active members: query `tasks?status=in_progress&updated_at=gt.90d` on board Supabase
- Respect holders: hardcode 157 until Optimism RPC query is live
- Fractal streak: hardcode 100+ (increment manually per milestone)
- COC shows: hardcode, increment after each show
- WaveWarZ battles: fetch from wwtracker API or hardcode 1,250+
