---
topic: wavewarz/distribution
type: STRATEGY
status: ACTIVE — implement immediately; ZOE owns weekly execution
created: 2026-07-17
related-docs: 1347, 1358, 1378, 1374
owner: ZOE (execution) + Zaal (review monthly)
---

# 1385 — WaveWarZ @wavewarz X Content Strategy (Jul 2026)

> **What it is:** A systematic, ZOE-executable content plan for @wavewarz on X — turning the platform's live stats into daily distribution, building an audience that cares about community music battles, and converting X followers into WaveWarZ participants.
>
> **Why it matters:** @wavewarz on X is WaveWarZ's primary growth channel for reaching music industry people who are not crypto-native. Consistent content converts the 1,245+ battles happening on-platform into a public media presence. Every post is a distribution moment.

---

## Current State vs. Target

| Metric | Jul 2026 | Target (Dec 2026) |
|--------|----------|-------------------|
| @wavewarz X followers | TBD (fill from account) | 1,000 |
| Post frequency | Sporadic | 1/day minimum |
| Content types | Ad hoc | 6 defined types (below) |
| ZOE automation | Partial | 80% automated |
| Engagement rate | TBD | 3-5% average |

---

## The 6 Content Types

### Type 1 — Battle Result Drop (ZOE-automated)
**Frequency:** After every MAIN event; 1-3x/week for Quick Battles
**Trigger:** MAIN event conclusion + significant Quick Battle milestones

**Template — MAIN Event Result:**
> MAIN battle result on @wavewarz:
>
> 🏆 [WINNER HANDLE]
> 📊 [X] community votes
> 💰 Both artists earned. Loser-earns model.
>
> Next MAIN: [date]. Submit at wavewarz.info
> #WaveWarZ #MusicBattles

**Template — Quick Battle Milestone:**
> Quick Battle #[N] just finished on @wavewarz.
>
> [WINNER] vs [LOSER] — [X] votes.
> Both artists walked away with earnings.
>
> That's [N] total battles since launch.
> wavewarz.info #WaveWarZ

---

### Type 2 — Stats Drop (ZOE-automated)
**Frequency:** Weekly (every Monday)
**Source:** wavewarz.info/api/public/stats

**Template:**
> @wavewarz stats this week:
>
> ⚔️ [N] total battles (+[X] from last week)
> 💸 [SOL] total volume
> 🎵 Both artists earn — every battle
>
> Running since [launch month]. Community governed.
> wavewarz.info

**Template — Milestone version (at 1,500 / 2,000 / etc.):**
> [N] battles on @wavewarz. ✅
>
> That's [N] artists who competed.
> [SOL] total distributed.
> [N] community members who voted.
>
> Next milestone: [N+500]. wavewarz.info

---

### Type 3 — Artist Spotlight (ZOE semi-automated)
**Frequency:** 2x/week
**Source:** API stats pull + Zaal approves handle before ZOE posts

**Template:**
> Artist spotlight: [handle]
>
> [N] battles on @wavewarz
> [W] wins / [L] losses
> [SOL] earned so far
>
> You don't lose when you lose on WaveWarZ. You earn.
> [handle] battled anyway. wavewarz.info

**How ZOE picks spotlight artists:**
1. Pull top-active artists from API (most battles in last 30 days)
2. Check if they have an X handle in the database
3. Draft spotlight post
4. Zaal approves (1 min) or auto-posts after 24h no response

---

### Type 4 — Loser-Earns Education Post (ZOE-scheduled, monthly)
**Frequency:** 1x/week for first 4 weeks after implementing; then 2x/month
**Purpose:** Explain the model to non-crypto music industry audience

**Template A — What is loser-earns?**
> Most music competition: winner takes all. Artists battle for a prize.
>
> @wavewarz: both artists earn, regardless of outcome.
>
> The community votes.
> The platform distributes.
> Both sides get paid.
>
> That's loser-earns. That's WaveWarZ. wavewarz.info

**Template B — The math:**
> Artist A vs Artist B on @wavewarz:
>
> Community votes 60/40.
> Winner earns: [X] SOL
> Loser earns: [Y] SOL (still gets paid)
>
> Total distributed: [X+Y] SOL per battle.
> Every battle. Every time.
>
> wavewarz.info #WaveWarZ #MusicBusiness

**Template C — Spotify comparison:**
> Spotify pays ~$0.004 per stream.
>
> On @wavewarz, a single battle can earn:
> [SOL value in USD] — win OR lose.
>
> Different model. Different economics.
> wavewarz.info

---

### Type 5 — Community Governance Post (ZOE-scheduled)
**Frequency:** 1x/week
**Purpose:** Show WaveWarZ is community-run, not label-run

**Template — After Fractal governance session:**
> This week, The ZAO community voted on:
> [topic from governance session]
>
> That decision shapes how @wavewarz operates.
>
> Community governance. Week [N] of [total]. No missed sessions.
> thezao.xyz

**Template — General:**
> @wavewarz is community-governed.
>
> Who decides which battles run?
> Who sets the rules?
> Who picks the artists?
>
> The ZAO — a DAO. On-chain voting. Every week.
>
> Music run by its community. Not by a label.
> wavewarz.info

---

### Type 6 — Upcoming Battle Hype (ZOE-automated)
**Frequency:** Before every MAIN event
**Trigger:** MAIN event created on platform

**Template — 48h before MAIN:**
> MAIN event dropping on @wavewarz.
>
> Date: [date]
> Submit: wavewarz.info
> Deadline: [submission cutoff]
>
> Community votes pick the winner.
> Both artists earn.
>
> 48 hours to submit. #WaveWarZ

**Template — Day of MAIN:**
> @wavewarz MAIN event is LIVE.
>
> Vote now: wavewarz.info
> [N] tracks submitted. Community is the judge.
>
> Voting closes [time]. Your vote moves the payout. #WaveWarZ

---

## Weekly Content Calendar

| Day | Content Type | ZOE or Zaal | Notes |
|-----|-------------|-------------|-------|
| Monday | Stats Drop (Type 2) | ZOE | Auto-pull from API |
| Tuesday | Artist Spotlight (Type 3) | ZOE + Zaal approval | Pull from API |
| Wednesday | Loser-Earns Education (Type 4) | ZOE | Rotate through templates A/B/C |
| Thursday | Community Governance (Type 5) | ZOE | After Fractal session if applicable |
| Friday | Upcoming Battle Hype (Type 6) | ZOE | If MAIN upcoming; else Artist Spotlight |
| Saturday | Battle Result Drop (Type 1) | ZOE | If MAIN ran this week |
| Sunday | Rest OR repost a high-performing post | ZOE | Optional |

**ZOE rule:** Never let 48 hours pass without a post to @wavewarz. If no trigger fires, default to loser-earns education template.

---

## Special Event Posts

### ZAOstock Promotion (Aug 1 – Oct 3)
*Add to all posts starting Aug 1:*
> 🎵 ZAOstock — Oct 3, Ellsworth ME. The ZAO's first music festival.
> Tickets: [Eventbrite link] #ZAOstock

### Africa Battle Week (Sep 22-26)
*Add to all posts Sep 22-26:*
> 🌍 Africa Battle Week on @wavewarz — community-governed, international artists. #AfricaBattleWeek

### MAIN Event Week
*Increase cadence to 2x/day during MAIN event:*
1. Morning: pre-battle hype
2. Evening: battle result or live update

---

## Engagement Protocol

**Reply strategy (Zaal — 3x/week):**
- Reply to any music producer or artist who engages with @wavewarz posts
- Reply to X threads about: music business, streaming payouts, independent artists, DAOs + music
- Template: *"The loser-earns model we built on @wavewarz addresses exactly this. Both sides of a battle earn regardless of outcome. Check it out: wavewarz.info"*

**Repost strategy (ZOE):**
- Repost any artist who tags @wavewarz after a battle
- Repost any ZAO member who posts about WaveWarZ

**Quote tweet targets:**
- Hypebot posts about music streaming payouts → quote with WaveWarZ alternative model
- Decrypt posts about on-chain music → quote as live example
- Any post complaining about "winner takes all" → quote with loser-earns explanation

---

## Hashtag Strategy

**Primary (every post):** #WaveWarZ
**Secondary (rotate):** #MusicBattles #OnChainMusic #MusicDAO #ArtistFirst #MusicBusiness
**Event-specific:** #ZAOstock #AfricaBattleWeek
**Avoid:** Generic crypto tags (#Web3 #NFT #Crypto) — they attract wrong audience

---

## Audience Segments to Target

| Segment | Why | How to reach |
|---------|-----|-------------|
| Independent artists (music) | WaveWarZ pays them; they want to compete | Artist spotlight posts; loser-earns education |
| Music producers | Battle format is natural to them | MAIN event hype; result posts |
| Music industry observers | Media angle: "loser-earns is a new model" | Loser-earns education; governance posts |
| Crypto music fans | Already care about on-chain music | Governance posts; stats drops |
| Music journalists | Source for stories | Stats milestone posts; quote tweets |

---

## Growth Levers

**Lever 1 — Artist self-promotion loop:**
When ZOE posts artist spotlights, artists repost → ZOE reshares their repost → their audience sees WaveWarZ. Each artist becomes a distribution node.

**Lever 2 — ZAOstock cross-promotion:**
Every ZAOstock post links back to WaveWarZ. ZAOstock attendees become potential WaveWarZ participants.

**Lever 3 — Africa Battle Week:**
RAM Africa's audience (new to WaveWarZ) + WaveWarZ's loser-earns model = compelling story for African music media. Sep 22-26 spike in X activity.

**Lever 4 — Milestone posts:**
1,500 battles = viral candidate. Post with ZAO vs Spotify framing → targets music Twitter.

---

## ZOE Implementation Checklist

- [ ] Connect @wavewarz X account to ZOE post queue
- [ ] Set up Monday API pull → Stats Drop auto-post
- [ ] Set up MAIN event trigger → auto-post 48h before + day-of
- [ ] Set up MAIN event result trigger → auto-post within 30 min of result
- [ ] Set up weekly artist spotlight queue (Zaal approves before posting)
- [ ] Load all Type 4 templates (A/B/C) into ZOE rotation
- [ ] Set up repost rule: any @wavewarz tag by artist → auto-repost
- [ ] Confirm posting cadence: 1 post/day minimum

---

## North Star Impact

| Dimension | Before | After 3 months |
|-----------|--------|----------------|
| Distribution | 7.0/10 | 7.5-8.0/10 |
| Media | 5.5-6.5/10 | +0.5 (X engagement = media proof) |
| WaveWarZ battles/month | ~80-100 | +30-50 (X drives submissions) |
| @wavewarz followers | Current | 1,000 by Dec 2026 |

---

*Created: 2026-07-17 | Owner: ZOE | Related: 1347 (growth strategy), 1358 (channel ops), 1378 (milestone playbook), 1374 (Farcaster strategy)*
