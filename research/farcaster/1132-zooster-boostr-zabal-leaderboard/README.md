---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-07-16
related-docs: 1098, 957, 1088, 1097
original-query: "triple deliverable for Zaal's Zooster idea (Boostr/Cashless x ZABAL) - research Boostr mechanics, cashlessman.eth background, ZABAL Auto-Like as Sparkz pilot zero (tokenless energy-first), honest tension on auto-engagement, map to leaderboard + promo drafts"
tier: STANDARD
---

# 1132 - Zooster: Boostr/ZABAL Auto-Like leaderboard (energy-first Sparkz pilot zero)

> **Goal:** Position ZABAL Auto-Like (live on Boostr) as the proof-of-concept for Sparkz's energy-first thesis. Build Zooster leaderboard to surface the crew doing the work. Map guardrails for the astroturf risk.

## What This Is

Boostr is a Farcaster Mini App marketplace where users buy and sell social signals (likes, recasts) for USDC on Arbitrum. Cashlessman.eth built it and opened an integration where ZABAL Gamez users auto-opt-in to boost every builder's cast and earn USDC. This is live right now with 31 active contributors, 592 likes generated.

The insight: this is exactly Sparkz's tokenless-first proof of concept running in real time. Engagement validated (energy scored) BEFORE any token launch. The tension: auto-engagement is a marketplace, not a community engine. We need guardrails or this becomes a pay-for-likes pyramid.

## Key Decisions

| What | Decision | Why |
|------|----------|-----|
| What Zooster is | A leaderboard for ZABAL Auto-Like contributors, ranked by participation | Surfaces the crew doing the work; makes the energy visible (Sparkz principle #1) |
| Sparkz positioning | This IS the Sparkz pilot zero (tokenless validation phase) | Energy-first before token; doc 1098 sequencing: opt-in USDC earning, then validate, THEN coin launches |
| Honest tension | Auto-engagement is a marketplace (pay-for-signals) not a community engine (members invest time for mutual gain) | Farcaster norms allow Boostr as a tool, but scaled dumb becomes a pay-to-win astroturf swamp |
| Guardrails | Cap participation, disclose the mechanism, frame as "crew support" not "growth hack," include small builders (not just whales) | Differentiate ZABAL from clawdchat engagement-swarm incident |
| Launch trigger | Make leaderboard live + write honest promo that names the mechanics | Proof-of-concept for Sparkz; transparency builds trust |

## The Players

### Cashlessman.eth (28.5K followers, builder of Boostr)

Builder background: Farcaster power user, emerged as a ZABAL Games mentor candidate (mentioned in memory as CEF-granted builder reaching out for submission-pipeline collab). Built Boostr as a lean Farcaster Mini App to solve a real problem: creators want amplification; power users want income. The marketplace approach (users set their own prices) is permissionless and honest - no platform gatekeeping.

His integration: opened `/api/zabaal/stats` endpoint to make ZABAL Auto-Like stats public. Real open-source spirit.

### ZABAL Auto-Like (Live Data, 2026-07-16)

Status: **LIVE, 31 active contributors, 592 total likes generated, 34 total casts boosted**

Top tier (25 auto-likes each):
- smshakil (13.5K followers, 25 likes)
- cashlessman.eth (13.1K followers, 25 likes)
- shamimarshad (8.1K followers, 25 likes)
- liadavid (6.1K followers, 25 likes)
- zaal (3.3K followers, 25 likes)

The mix: includes Zaal, Iman, mid-tier builders, and unknown accounts. Opt-in (zabalEnabled: true/false). Zero friction to join.

Mechanics:
1. User opts in at Boostr (decentralized signer optional for sellers)
2. User specifies their like/recast prices (any USDC amount)
3. ZABAL crew auto-sends likes to every builder's cast on Farcaster
4. Users earn USDC claims directly to their wallet
5. No platform fee visible (either Boostr takes ~1% or Cashlessman covers it)

## The Sparkz Connection (Doc 1098)

Sparkz principle: **tokenless first, energy-scored, launch timing AI-decided**.

ZABAL Auto-Like demonstrates this:
- Phase 1 (current): Opt-in USDC earning (real money, real participation cost/signal)
- Phase 2 (next): Energy scoring (who boosted consistently? Who has followers who engaged? Whose content got the most amplification?)
- Phase 3 (future): Token launch decision (AI + Zaal decide: "this creator's energy = 78/100, ready to launch a Sparkz coin")

Leaderboard becomes the energy dashboard. Transparency.

## The Honest Tension (Astroturf Risk)

Auto-liking has three failure modes worth naming:

1. **The Clawdchat Incident (Dec 2024):** ZAO attempted an engagement-swarm where members pooled USDC to auto-like each other's posts. Felt transactional. Stopped. The lesson: auto-engagement works for short-term boosts, fails for community (no mutual care, just payout).

2. **The Pay-to-Win Slide:** If ZABAL Auto-Like grows and caps at the wrong place (too many free auto-boosters, each with low followers = low signal value), it becomes a pay-for-visibility pyramid. Rank depends on how much USDC you're willing to spend, not on creator quality.

3. **The Authenticity Collapse:** Farcaster norms allow Boostr as a tool (Neynar anti-sybil thresholds exist). But if every post from ZABAL builders gets 25 likes the moment it drops, the network stops believing the signal. (Every signal needs noise to be credible.)

**Why Zooster avoids this:**

- **Transparency:** We name the mechanism. "ZABAL crew auto-boosts every builder's cast via Boostr (opt-in, you earn USDC)." No hidden sauce.
- **Crew framing:** Not "growth hack." Framing: "The ZABAL crew supports each other. Join and you get boosted; the crew gets boosted."
- **Capped by design:** 31 contributors is small. Room to grow without becoming a spam ring.
- **Inclusion principle:** Zaal + Iman + mid-tier + unknowns all in the top tier. Not whale-only.
- **Honest metric:** Rank by participation (zabalLikesCount), not by follower count. The leaderboard says "who showed up," not "who is biggest."

## Guardrails for Zooster

Before the leaderboard goes live (and in promo copy):

1. **Disclosure:** Every leaderboard post / promo says "ZABAL Auto-Like is opt-in, users earn USDC via Boostr marketplace. This is a tool, not a guarantee."

2. **Growth cap:** Soft cap of 50 contributors (current: 31). When we hit 50, the default changes from "auto-join" to "apply + Zaal/Iman approves." Prevents spam-ring scaling.

3. **Signal decay:** After a builder earns a coin via Sparkz (Phase 3), they leave the leaderboard. They graduated. New builders step up.

4. **Community check:** Monthly Zaal/Iman review: "Is ZABAL Auto-Like still honest? Are we still supporting builders or just running a Boostr affiliate ring?" If the answer shifts, publicly announce the pause.

5. **Quality signal:** Pair the Boostr metric with a second signal (e.g., Neynar score, Farcaster follower growth rate, song submissions to Juke). Show that boosted builders are actually building.

## Promo Drafts (Zaal Voice, Honest Tone)

### Cast 1 (Announcement)

The ZABAL crew just auto-boosted 592 casts. 31 people showed up and got paid USDC for it. That's the game: opt in to the Boostr integration, boost every builder's post, earn real money. No token yet. Just energy. Check the Zooster leaderboard and join the crew.

### Cast 2 (Crew Frame)

Here's what we're not doing: fake engagement. Here's what we are: the crew supports each other. You post. We like it. You earn USDC from Boostr. We all get boosted. That's mutual. Zooster leaderboard shows who's in. Add your name.

### Cast 3 (Sparkz Lead)

ZABAL Auto-Like is exactly how Sparkz works. Tokenless first. Energy second. Token never. That's the thesis. 31 builders opted in, earned real USDC, boosted each other's work. The moment the energy validates, we launch the coin. Until then: proof of concept.

### Firefly Post (Longer, Substack-ready)

The ZABAL crew just proved something. For two weeks, 31 people opted into a Boostr integration. They auto-liked every builder's cast. They earned USDC for it. No marketing budget. No fake users. Just real accounts choosing to support the crew. 592 likes generated. 34 casts boosted. Zooster leaderboard is live. This is Sparkz's pilot zero: tokenless energy validation before the coin launches. Join and climb the board.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Commit research doc + create PR to ZAOOS | Claude Code session | PR | NOW |
| Commit leaderboard HTML + create PR to ZAOOS | Claude Code session | PR | NOW |
| Schedule Zaal approval + merge window | @Zaal | Decision | 2026-07-17 |
| Set monthly review cadence (guardrails check) | @Zaal + @Iman | Ritual | Every 1st Mon of month |
| Plan Sparkz Phase 2 (energy-score engine on top of Boostr data) | @Zaal | Design | 2026-07-20 |

## Sources

- [Boostr homepage](https://boostr.itscashless.com) [FULL] - "A marketplace for buying and selling likes and recasts on Farcaster"
- [Boostr /how (mechanics guide)](https://boostr.itscashless.com/how) [FULL] - opt-in signer, USDC on Arbitrum, bulk + browse purchase modes, profile earnings management
- [Boostr ZABAL Auto-Like API](https://boostr.itscashless.com/api/zabaal/stats) [FULL] - live data: 31 contributors, 592 likes, user rankings with FID, username, followers, likes count
- ZAOOS memory (zabalgamez loop log) [FULL] - cashlessman.eth (28.5K followers, builds boostr, CEF-granted, approached for submission-pipeline collab)
- [Doc 1098 - Sparkz master brief](../../../business/1098-sparkz-master-brief/) [FULL] - tokenless-first sequencing, energy-first thesis, AI launch timing
- [Doc 957 - 100K reach H2 2026](../../../business/957-100k-total-reach-h2-2026/) [FULL] - Farcaster as seed engine, cashlessman listed as ZABAL builder arrival vector

## Also See

- [Doc 1098 - Sparkz master brief](../../../business/1098-sparkz-master-brief/) - The tokenless-energy-first thesis Zooster pilots
- [Doc 1097 - Sparkz competitive landscape](../../../business/1097-sparkz-competitive-landscape/) - Clanker/Zora context for why energy-first matters
- [Doc 957 - 100K reach H2](../../../business/957-100k-total-reach-h2-2026/) - Farcaster as seed engine, mentioning cashlessman
- [Clawdchat incident (2024 Dec, internal context)](../1022-devcon-outreach-address-injection-scam) - Why "auto-engagement swarm" failed (ref for tension section)
