---
title: "498 - ZAOstock Fractal Adaptation: Festival Team Governance Model"
date: 2026-04-24
status: "Research complete"
doc_type: "governance_design"
author: "Claude Agent Research"
tags:
  - zaostock
  - fractals
  - respect-game
  - team-governance
  - contribution-tracking
focus: "Design the ZAO Respect Game / fractal mechanic for the ZAOstock team (18 people, Oct 3 2026 festival prep)"
---

# 498 - ZAOstock Fractal Adaptation: Festival Team Governance Model

> **Status:** Design research complete  
> **Date:** 2026-04-24  
> **Goal:** Propose a scaled fractal governance model for the 18-person ZAOstock production team, with 7 design questions resolved and a 2-week pilot plan.

---

## Executive Summary: Proposed ZAOstock Fractal Design

Run **three parallel 6-person fractals** on a **bi-weekly cadence tied to festival prep milestones** (lineup lock, sponsorship close, media plan, run-of-show finalize, day-of execution). ZAOstock Respect earned during team fractals counts toward **parallel on-chain ZAOstock tokens** (distinct from ZAO OG/ZOR) that unlock **post-festival profit share from sponsor revenue**. OREC-style consent mechanism: proposals from team fractals require simple majority, but 1/3 veto from non-fractal ZAO members prevents conflicts of interest. Contributions surface in a **Telegram bot daily digest** (auto-synced from `/do` actions) with peer-ranked highlights. Non-ZAO members participate with full voting rights (no tier demotion) but are onboarded via a **welcome orientation** that frames Respect as "recognition, not gatekeeping." Telegram bot auto-tracks contributions; manual rank-up every 2 weeks in live video fractals mirrors the ZAO weekly cadence but compresses to festival prep urgency.

---

## Key Design Decisions

| Question | Design Decision | Rationale |
|----------|-----------------|-----------|
| **Scaling (6-person fractals, 18-person team)** | 3 parallel fractals, fixed membership through Oct 3 | Maintains intimacy (6-person baseline per Eden/Optimism research). Avoids rotation churn during tight prep window. Groups: A) Artist/Media/Design, B) Logistics/Sponsorship/Ops, C) Tech/WaveWarZ/Content |
| **Cadence (weekly vs milestone-tied)** | Bi-weekly, 4 sessions total (May 8, May 22, June 5, June 19) | ZAO weekly is ideal for ongoing community. Festival prep has hard deadlines. Bi-weekly leaves space for work between meetings. 4 sessions = 4 major milestones compress into 7-week window. |
| **Respect currency (ZAO-native vs ZAOstock parallel)** | Parallel ZAOstock soulbound ERC-1155 on Base | ZAO Respect (OG/ZOR) stays intact for community-wide governance. ZAOstock Respect is team-internal, earned only by this cohort, burns/mints post-festival. Avoids diluting ZAO-wide contribution signals. |
| **Consent + veto mechanism** | Simple majority within fractals; 1/3 non-team ZAO veto on cross-team decisions | OREC model scales: team fractals reach consensus locally, escalate only contentious decisions (sponsor conflicts, lineup changes, budget overages) to ZAO-wide council. Non-team members retain oversight without slowing daily decisions. |
| **Visibility / surface contributions** | Telegram bot daily digest (auto-pulls `/do` actions + manual peer highlights from fractals) | Mirrors existing bot infrastructure (doc 114). Bot timestamps each contribution (who, what, when). Weekly fractals showcase highlights + vote. Leaderboard by Respect earned (1-1-2-3-5-8 Fibonacci curve). |
| **Non-ZAO-member participation** | Full voting rights; no tier penalty. Onboarded via orientation. | ZAOstock is a sub-team project, not a ZAO membership test. Non-members are collaborators, not applicants. Respect earned during this sprint does NOT transfer to ZAO membership (separate track). Orientation 30 min, covers Respect concept + team mission. |
| **Bot integration (auto-rank vs manual)** | Hybrid: bot tracks `/do` actions; manual peer-ranking in live video fractals every 2 weeks | Bot data reduces friction (no "log your work" tax). Manual fractal ranking adds human judgment (recognition, quality, alignment). Mirrors ZAO's hybrid approach (bot history.json + on-chain OREC submission). |

---

## The Three Fractals: Membership + Scope

Each fractal owns a domain and runs independent sessions. Membership fixed through festival (Oct 3). Leads assigned post-pilot (Week 1 feedback).

### Fractal A: Artist / Media / Design
**Scope:** Artist lineup coordination, content capture, visual branding, social media.

**Members (target 6):** Zaal, DCoop, FailOften, [visual lead TBD], [content creator], [social/comms].

**Key milestones:**
- Week 1 (May 8): Artist roster finalized
- Week 2 (May 22): Media capture plan locked (who's filming, storage, rights)
- Week 3 (June 5): Brand kit + run-of-show visual design
- Week 4 (June 19): Social pre-launch, press kit, creator onboarding

**Session prompt:** "What media did you create, curate, or contribute to ZAOstock this sprint?"

---

### Fractal B: Logistics / Sponsorship / Ops
**Scope:** Vendor contracts, sponsor activation, site logistics, budget tracking, permits.

**Members (target 6):** Candy (lead), [sponsor lead], [logistics/site], [budget/finance], [permits/legal], [partner relations].

**Key milestones:**
- Week 1 (May 8): Sponsor contracts signed
- Week 2 (May 22): Site logistics plan (parking, stage power, load-in, timeline)
- Week 3 (June 5): Budget reconciliation + contingency review
- Week 4 (June 19): Day-of ops checklist, crew assignments, comms flow

**Session prompt:** "What logistics, sponsorship, or operational work moved ZAOstock forward?"

---

### Fractal C: Tech / WaveWarZ / Content Infrastructure
**Scope:** WaveWarZ voting tech, streaming setup, broadcast platform, bot/discord automation, merch.

**Members (target 6):** DCoop (co-lead), Hurric4n3 (co-lead), [streaming tech], [bot/infra], [merch/supply], [testing/QA].

**Key milestones:**
- Week 1 (May 8): WaveWarZ bracket finalized (4 artists, payment structure)
- Week 2 (May 22): Broadcast partner(s) locked, streaming tech stack tested
- Week 3 (June 5): Bot/discord bot features live (leaderboard, contribution tracking)
- Week 4 (June 19): End-to-end testing, failover plan, post-event data pipeline

**Session prompt:** "What technology, streaming, or automation work enabled ZAOstock?"

---

## Respect Distribution & Conversion

### Earning: The Bi-Weekly Fractal Ranking

Each fractal member presents their contribution (3-4 min). Group discusses and collaboratively ranks using **Fibonacci scale**:

**Level 6** (highest impact) → 110 Respect  
**Level 5** → 68 Respect  
**Level 4** → 42 Respect  
**Level 3** → 26 Respect  
**Level 2** → 16 Respect  
**Level 1** (participated) → 10 Respect  

**Ranking consensus rule:** 2/3 agreement required (same as ZAO). If tied, group re-discusses. Rerank takes max 30 min total (standard fractal pacing).

### Supply: 4 Sessions, Max 6 per Level

- **4 fractals x 3 parallel groups x 6 members = 72 possible ranks/session**
- **Per session: 12 L6, 12 L5, 12 L4, 12 L3, 12 L2, 12 L1 slots**
- **Total 4-session supply: 48 L6 (5,280 Respect), 48 L5 (3,264), 48 L4 (2,016), 48 L3 (1,248), 48 L2 (768), 48 L1 (480)**
- **Across all 4 sessions: 12,776 total ZAOstock Respect distributed**

### Conversion: Post-Festival Distribution

October 4, 2026 (day after festival):
- **L6 holders** (48): 11% of final sponsor revenue share
- **L5 holders** (48): 8% share
- **L4 holders** (48): 5% share
- **L3 holders** (48): 3% share
- **L2 holders** (48): 2% share
- **L1 holders** (48): 1% share
- **Unranked participants** (non-core team): flat $250 thank-you stipend

**Revenue source:** ZAOstock ticket sales + sponsor activation fees (modeled at $15-25K total gross). After vendor payouts (~$40K est.), remaining sponsor revenue (~$8-12K) splits per above. Per-capita for L6: $180-250.

**Token representation:** Each holder gets a soulbound ERC-1155 token minted on Base (matches ZAO's Optimism/Superchain alignment). Token URI points to IPFS metadata (name, rank, date, mission statement). Non-transferable. Burns post-Oct 2026 (one-off campaign). Holders can claim profit-share via governance dashboard.

---

## Consent & Veto: The OREC Adaptation

ZAOstock operates on two levels:

### Level 1: Team Fractals (Fast Path)
Decisions made within each fractal during sessions: artist selection, media strategy, sponsor activation details, tech stack. Majority vote (2/3) within fractal group = immediate green light. No further consensus needed.

**Examples:**
- Fractal A decides: "DCoop leads social strategy, posts 3x/week TikTok teases starting May 15."
- Fractal B decides: "Payment terms: $300 per artist base + $500 winner bonus (doc 428 spec)."
- Fractal C decides: "Use Firefly for X+Farcaster broadcast (existing ZAO infra)."

### Level 2: Cross-Fractal Escalation (Slow Path)
If a decision affects multiple fractals or the budget/brand, escalate to the **ZAOstock Council** (one rep per fractal + Zaal). Council votes. **Consent rule:** Proposal passes unless **1/3 of non-core ZAO members veto** within 48 hours.

**Examples of escalations:**
- Fractal A proposes: "Invite Zaal's ex-partner as featured artist." Council votes. If 3+ non-core ZAO members object (conflict of interest), veto blocks it.
- Fractal B proposes: "Add $5K sponsorship contingency tier, extend overall budget." Council votes. If 1/3+ veto, budget stays as-is.
- Fractal C proposes: "Live-stream on Twitch instead of YouTube." Council votes. If veto, maintain YouTube (existing partnership).

**Non-core ZAO members:** The ~170 ZAO members not on the ZAOstock team retain advisory veto power. This prevents team capture and keeps decisions aligned with ZAO values (doc 432: "music first, community second, tech third").

---

## Contribution Visibility: Telegram Bot Digest

The existing Discord/Telegram bot (`fractalbotmarch2026`, doc 114) extends to ZAOstock with three new endpoints:

### `/do [action_summary]` - Action Logging
Team members post: `/do filming B-roll at local venue, 4 hours` or `/do sponsored 3 artists lunch for interviews`.

Bot stores: timestamp, author, text, optional link to media/doc.

### Daily Digest (6pm EST, weekdays May 8 - June 19)
Bot sends to `#zaostock-daily` Discord channel:

```
ZAOstock Daily Digest - Wednesday May 15, 2026

FRACTAL A (Artist/Media/Design)
  [MEDIA] FailOften — video edit of WaveWarZ artist intros (1.2GB, 3 min rough cut)
  [ARTIST] DCoop — confirmed 5 of 6 lineup slots; 1 pending
  [SOCIAL] [social lead] — posted Festival announcement on TikTok (+240 views, 15 likes)

FRACTAL B (Logistics/Sponsorship)
  [SPONSOR] Candy — signed Magnetic venue exclusive use agreement (6am-8pm Oct 3)
  [LOGISTICS] [logistics lead] — confirmed load-in window 8am-11am, stage power verified
  [BUDGET] [finance] — sponsor revenue YTD $12,400 (on pace for $18K target)

FRACTAL C (Tech/WaveWarZ)
  [WAVEWARZ] DCoop — bracket 4 artists finalized; QR voting tested in staging
  [STREAM] Hurric4n3 — Firefly x Restream OAuth verified; test broadcast 5/16 6pm
  [BOT] [infra] — contribution leaderboard now live (see dashboard)

HIGHLIGHTS (Peer-Ranked from Last Fractal - May 8)
  LEVEL 6 (110 Respect): Zaal — Secured 3 new sponsors in 1 week (A)
  LEVEL 5 (68 Respect): Candy — Full logistics plan approved by site owner (B)
  LEVEL 4 (42 Respect): Hurric4n3 — WaveWarZ tech stack proven (C)
```

### Weekly Fractal Recap (Every Other Tuesday, during session)
After ranking, bot surfaces:

```
ZAOstock Fractal A Ranking — May 8, 2026
Group members: Zaal, DCoop, FailOften, [designer], [content], [social]

Rankings:
  Zaal (Level 6, 110 Respect) — Artist coordination + sponsor outreach
  DCoop (Level 5, 68 Respect) — Content strategy + WaveWarZ planning
  FailOften (Level 4, 42 Respect) — Media capture framework
  [designer] (Level 4, 42 Respect) — Run-of-show visual design
  [content] (Level 3, 26 Respect) — Press kit draft
  [social] (Level 2, 16 Respect) — Daily posting schedule

LEADERBOARD (All Fractals, 4-week cumulative):
  1. Zaal — 358 Respect (4 L6 ranks + 2 L5 + 1 L4)
  2. Candy — 284 Respect
  3. DCoop — 276 Respect
  ... [continues through all 18]

Next session: Wednesday May 22, 6pm EST. 2-week mission recap.
```

### Leaderboard Dashboard
Public page at `/stock/respect` (mirrors `/api/respect/leaderboard` for ZAO OG):

**Sortable by:**
- Total Respect earned (4-week cumulative)
- Session count
- Average rank (quality signal)
- Fractal membership
- Contribution category (from `/do` tags)

**Visible to:** ZAOstock team + ZAO members + public (read-only, respects privacy tier settings).

---

## Non-ZAO-Member Onboarding

The ZAOstock team includes 18 confirmed members; **estimated 4-6 are not yet ZAO members** (contractors, local collaborators, sponsor reps embedded in ops). Respect Game requires consent and context.

### 30-Minute Orientation (Required before first fractal)
Delivered async via video (Zaal records once, all watch) or live option (Zaal hosts Tuesday 4pm EST).

**Outline:**
1. **What is Respect?** (3 min) — "Recognition earned through peer vote. Soulbound, one-time campaign token. No monetary value during festival. Represents your contribution."
2. **Why ZAOstock is different from ZAO** (2 min) — "You're here for the festival. Your Respect does NOT make you a ZAO member. Separate track. After Oct 3, token burns. No carry-over."
3. **How ranking works** (5 min) — Demo fractal session, show the 6 levels, explain Fibonacci weighting, show voting format.
4. **Your fractal group + mission** (3 min) — "You're in Fractal [A/B/C]. Here's the scope. Here's your 5 teammates. These are the 4 milestones."
5. **The bot, the digest, the leaderboard** (3 min) — Show `/do` action examples, daily digest screenshot, leaderboard ranking.
6. **Q&A / clarifications** (9 min) — Address concerns about participation, confidentiality, how ranking affects working relationships.

**Deliverable:** 20-min video link + 1-page PDF one-pager sent before first session. Attendance logged; non-attendance bumps to async catchup before first ranking.

---

## Integration with Existing ZAO Bot & Infrastructure

### New Data Tables (Supabase)
```sql
-- ZAOstock Fractal Sessions
CREATE TABLE stock_fractal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fractal_group TEXT CHECK (fractal_group IN ('A', 'B', 'C')),
  session_num INT CHECK (session_num >= 1 AND session_num <= 4),
  date DATE NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  facilitator_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rankings (Fibonacci scores per member per session)
CREATE TABLE stock_fractal_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES stock_fractal_sessions(id),
  member_id UUID REFERENCES stock_team_members(id),
  voted_by_id UUID REFERENCES stock_team_members(id),
  level INT CHECK (level >= 1 AND level <= 6),
  respect_points INT,
  submission TEXT, -- what they did
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contribution logs from `/do` bot action
CREATE TABLE stock_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  category TEXT, -- [MEDIA], [ARTIST], [SPONSOR], etc.
  logged_at TIMESTAMPTZ DEFAULT now(),
  fractal_group TEXT CHECK (fractal_group IN ('A', 'B', 'C', NULL))
);
```

### Bot Webhooks (extend existing `/api/fractals/webhook`)
New event types for ZAOstock:

```
POST /api/fractals/webhook

{
  "event_type": "stock_contribution_logged",
  "timestamp": "2026-05-15T14:30:00Z",
  "author_id": "discord_user_123",
  "content": "video edit of B-roll",
  "category": "MEDIA",
  "fractal_group": "A"
}

{
  "event_type": "stock_fractal_ranking_complete",
  "timestamp": "2026-05-08T19:00:00Z",
  "session_id": "sess_001",
  "fractal_group": "A",
  "rankings": [
    { "member": "zaal", "level": 6, "respect": 110 },
    { "member": "dcoop", "level": 5, "respect": 68 }
  ]
}
```

### API Routes
- `GET /api/stock/respect/leaderboard` — public rankings
- `GET /api/stock/respect/my-rank` — authenticated member view
- `POST /api/stock/contributions/log` — `/do` action
- `GET /api/stock/digest/daily` — fetches latest contributions for digest
- `GET /api/stock/fractal/[group]` — fractal membership + latest session

---

## Comparison: ZAO Fractal vs ZAOstock Fractal

| Aspect | ZAO Fractal (Weekly, Ongoing) | ZAOstock Fractal (Bi-Weekly, Sprint) |
|--------|------------------------------|--------------------------------------|
| **Membership** | 188 ZAO members rotating in 6-person groups | 18 fixed members, 3 stable groups, non-ZAO contractors included |
| **Cadence** | Every Monday 6pm EST, 52 weeks/year | Bi-weekly (May 8, 22, June 5, 19) - 4 sessions, 7 weeks |
| **Purpose** | Community consensus on vision, culture, values | Task completion, milestone tracking, team recognition |
| **Respect currency** | OG (ERC-20) or ZOR (ERC-1155), persistent, cumulative | ZAOstock (ERC-1155), soulbound, one-off campaign, burns Oct 2026 |
| **On-chain flow** | Results → OREC submission (Zaal or co-signer) | Results → Supabase → Dashboard (no OREC submission, contract TBD) |
| **Visibility** | Discord bot + `/rankings` command + leaderboard page | Telegram digest + `/stock/respect` page + public leaderboard |
| **Veto mechanism** | OREC: 1/3 Respect holders can veto proposals | Council escalation: 1/3 non-core ZAO veto on cross-fractal decisions |
| **Profit share** | None (governance token, not economic) | Yes - L6/L5/L4/L3/L2/L1 split post-festival sponsor revenue |

---

## 2-Week Pilot Plan (May 1-15, 2026)

### Week 1: Setup (May 1-7)
**Goal:** Get all 18 members oriented, fractals formed, first session scheduled.

- **May 1 (Wed):** Post orientation video + one-pager in Discord. Async watch. Non-ZAO contractors watch live option 4pm EST.
- **May 2-5 (Thu-Sun):** One-on-ones with each fractal lead (Zaal, Candy, DCoop). Finalize rosters, assign co-facilitators.
- **May 6 (Mon):** Bot configuration. Deploy new Supabase tables + webhook routes. Test `/do` action on staging.
- **May 7 (Tue):** Dry run: Zaal hosts a 30-min mock ranking session (facilitator practice). Gather feedback on UX, timing, tone.

**Deliverables:**
- Orientation video (20 min) + PDF
- Fractal rosters with co-leads
- Live bot infrastructure (staging tested)
- Facilitator notes + rubric

### Week 2: First Live Fractal (May 8-15)
**Goal:** Run Fractal A session. Measure participant experience, bot accuracy, ranking consensus quality.

- **May 8 (Wed) 6pm EST:** **Fractal A Live Session**
  - Participant: Zaal, DCoop, FailOften, [designer], [content], [social]
  - Format: Zoom (breakout optional if large group joins); Discord + bot logging
  - Duration: 60 min (30 min shares + 30 min ranking/consensus)
  - Bot logs: `/do` contributions from prior 2 weeks, facilitator time-stamps ranking votes
  - **Post-session:** Bot sends recap to `#zaostock-daily` within 10 min. Leaderboard updates.

- **May 9-14 (Thu-Tue):** Collect feedback via Slack thread: "What worked? What felt clunky? Did Respect feel meaningful?"
  
- **May 15 (Wed) Debrief:**
  - Zaal + pilot leads (Candy, DCoop, Hurric4n3) sync. Review:
    - Ranking quality (did consensus form easily?)
    - Bot accuracy (any `/do` misses?)
    - Digest UX (readable? useful?)
    - Leaderboard design (clear? motivating?)
    - Non-ZAO experience (did contractors feel welcomed?)
  - Adjust for Fractal B + C (May 22 onward)
  - Go/no-go call on full 4-session run

**Deliverables:**
- Session recording + transcript
- Feedback summary (3-5 key takeaways)
- Updated bot/dashboard fixes (if needed)
- Green light memo for Week 3 launch

### Go-Live: Fractals B + C (May 22 onward)
If pilot passes, launch remaining fractals on schedule:
- **May 22:** Fractal B + C (parallel sessions, 6pm EST)
- **June 5:** Fractals A + B + C (staggered, 5:30pm A, 6:30pm B, 7:30pm C)
- **June 19:** All three fractals (same stagger)
- **Post-festival (Oct 4):** Revenue share distribution + token claim portal live

---

## Biggest Design Risk: Profit-Share Fairness Under Urgency

**The risk:** In a 7-week sprint, team members in early-stage infrastructure roles (C: streaming, testing, automation) may earn lower ranks during Weeks 1-2 because their work isn't "visible" until May 22+ when broadcast testing happens. Meanwhile, Fractal A (Artist/Media) has tangible outputs from Week 1 (artist roster, social posts). Fractal B (Ops) has vendor contracts from Week 1. This creates **artificial ranking inflation for A+B, suppressed ranks for C**, even though all three roles are essential.

**Example:** By May 8, Fractal A members have posted 3 social teasers, booked 5 artists, drafted the visual brand. Fractal C members have... tested QR voting in staging, attended 2 tech planning calls, and debugged Restream OAuth. On May 8, A gets 4 L5/L6 ranks; C gets 2 L4/L3 ranks. But C's work is foundational.

**Mitigation:** 
1. **Explicit "infrastructure contribution" prompt in fractal C sessions:** "What behind-the-scenes work (testing, automation, setup, risk reduction) did you do?" This reframes "work nobody sees yet" as valuable.
2. **Facilitator pre-briefing:** All three leads (Zaal for A, Candy for B, DCoop for C) get a note: "Check for attribution bias. Infrastructure work is as critical as visible outputs. Rank accordingly."
3. **Post-session normalization (optional):** If Fractal C average rank is <L4 after Week 2, offer a facilitated discussion: "Are we undervaluing infrastructure? How do we correct it?" Adjust Week 3 context.
4. **Separate "role value" bucket:** Optionally, reserve 2-3 "Infrastructure Excellence" L5 slots per fractal per session, awarded to the person whose behind-the-scenes work enabled others. Makes invisible work visible.

**Recommendation:** Proceed with mitigation #1-2 baked into facilitator training. If Week 1 data shows severe skew (C avg <10th percentile vs A/B), activate #3-4 before May 22.

---

## Pareto: What Actually Matters

**The 20% of design choices that drive 80% of success:**

1. **Fixed 3-fractal structure for 7 weeks** — Eliminates rotation churn. Focuses team. Risk: boredom by June. Mitigation: emphasis on milestone novelty (Week 1 = artist roster, Week 2 = media plan, etc.).

2. **Bi-weekly cadence, not weekly** — Gives teams time to ship between fractals. Sustains morale. Without this, fractals become "status update theater" instead of recognition + alignment.

3. **Telegram bot integration** — `/do` logging reduces "record my work" friction. If this is manual (team members log their own Respect every week), participation collapses. Automation is non-negotiable.

4. **Profit-share attachment** — Respect becomes real (money + token) vs. abstract (governance power). Transforms engagement from "interesting" to "I care." Even modest share ($150-300 per L6) changes behavior.

5. **1/3 non-core ZAO veto on escalations** — Prevents team capture. Keeps decisions aligned with ZAO mission. Adds 48-hr friction only on contentious decisions (~1 per month). Worth it.

---

## Next Actions

1. **This week (Apr 24-30):** Confirm fractal rosters with Zaal + team leads. Create the Supabase tables. Record orientation video.
2. **May 1-7:** Deploy bot + dashboard. Run dry run. Collect facilitator feedback.
3. **May 8:** Go live with Fractal A pilot.
4. **May 9-15:** Gather feedback. Adjust for B + C.
5. **May 22:** Full launch (all three fractals live).
6. **June 5, June 19:** Continue 4-session run on schedule.
7. **Oct 4:** Revenue distribution + token mint.
8. **Post-festival:** Document lessons learned. Use template for future ZAO sub-teams (Impact Concerts UK, WaveWarZ events, etc.).

---

## Sources

- [Eden Fractal — What are Fractal Decision-Making Processes](https://edenfractal.com/fractal-decision-making-processes)
- [Optimism Fractal — Council](https://optimismfractal.com/council)
- [Optimystics — Fractalgram](https://optimystics.io/fractalgram)
- [Optimystics — 2025 Strategy](https://optimystics.io/2025-strategy)
- [Optimism Governance Forum — Optimism Fractal Season 5](https://gov.optimism.io/t/optimism-fractal-season-5-level-up-with-weekly-respect-games-on-the-superchain/9294)
- ZAO OS Research Doc 114: ZAO Fractal Live Infrastructure + Bot Data Flow
- ZAO OS Research Doc 103: Fractal Governance Ecosystem Deep Dive
- ZAO OS Research Doc 432: ZAO Master Context (Tricky Buddha)
- ZAO OS Research Doc 458: ZAO Contribution Circles (Impactful Giving adaptation)
- ZAO OS Research Doc 428: ZAOstock Run-of-Show Program
- [Impactful Giving — Contribution Circles](https://impactfulgiving.org/)

---

## Related Research

- [114 — ZAO Fractal Live Infrastructure](../114-zao-fractal-live-infrastructure/)
- [103 — Fractal Governance Ecosystem](../103-fractal-governance-ecosystem/)
- [285 — ORDAO / ORFRAPPS Updated Docs](../285-ordao-orfrapps-updated-docs/)
- [432 — ZAO Master Context](../../community/432-zao-master-context-tricky-buddha/)
- [458 — ZAO Contribution Circles](../../community/458-zao-contribution-circles/)
- [428 — ZAOstock Run-of-Show](../../events/428-zaostock-run-of-show-program/)
