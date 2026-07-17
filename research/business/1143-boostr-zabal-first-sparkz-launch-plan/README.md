---
topic: business
type: proposal
status: draft
last-validated: 2026-07-17
related-docs: 1098, 1132, 602
original-query: "partnership proposal: use Boostr ZABAL empire as the first Sparkz launch (tokenless energy first, then token via Empire Builder/Clanker rail)"
tier: DEEP
---

# 1143 - Boostr ZABAL: The First Sparkz Launch (Partnership Plan)

> **Goal:** Position ZABAL Auto-Like (live on Boostr) as the springboard into a full Sparkz launch. Build energy first (tokenless empire via Boostr), then layer a configurable token on top (via Clanker/Empire Builder). Pilot the full Sparkz model end-to-end.

---

## The Vision

ZABAL Games has become a real community of builders supporting each other. Boostr's auto-like integration (live with 31 contributors, 592 likes generated) is proving that energy-first engagement works - creators earn real USDC for real work.

Sparkz extends this: turn that energy into a token that **adds to what is already built**, not a hype machine that extracts from it.

The plan: Make ZABAL the first Sparkz case study. Prove that a tokenless empire (the engagement layer) stacked with a configurable token (the value layer) builds sustainable community, not 48-hour pumps.

**Why this matters:**
- Sparkz's differentiator is energy-first sequencing (not all creators are ready to token; some will never want to).
- Boostr gives us a live, real-money proof point that ZABAL builders are engaged and earned trust.
- Empire Builder's leaderboard infrastructure + Clanker's token rail are the stacking layer.
- Together: Boostr (energy) + Empire Builder (leaderboard/reputation) + Clanker (token) + Sparkz (the configurable wrapper + AI advisor) = the full flywheel.

---

## How Boostr + Empire Builder + Sparkz Fit Together

Think of this as three layers stacking cleanly:

### Layer 1: Energy (Boostr)
- **What:** ZABAL Auto-Like leaderboard (live, opt-in, real USDC earning).
- **Your role (cashlessman/Boostr):** Keep the stats API live and queryable. Surface contributor participation, casts boosted, USDC earned. This becomes the raw energy signal.
- **Why:** Energy first = we validate engagement before any token launch. Builders prove commitment via action (opting in, boosting consistently). Speculation comes later.

### Layer 2: Reputation + Governance (Empire Builder)
- **What:** ZABAL Empire leaderboard on Empire Builder V3 (rank contributors by Boostr participation + on-chain metrics). Configure governance thresholds (e.g., "needs 60+ energy score to vote on treasury use").
- **Your role (Adrian/Empire Builder):** Open the empire for ZABAL builders. Attach a Clanker token to it when Zaal gives the signal. Empire Builder's booster multipliers reward consistent contributors.
- **Why:** Reputation layer = the energy score translates to voting weight + token multipliers. Early believers get more say + more upside.

### Layer 3: Token Launch (Clanker + Sparkz)
- **What:** When ZABAL's energy validates (Zaal + Sparkz AI agree the engagement is genuine and sustained), launch a configurable Sparkz token on Clanker. Creators set their own split (default Iman's 50/30/20: creator income / community treasury / studio-production fund). ZAO takes a locked ~25% stake for alignment (not voting power).
- **Your role (Zaal/Sparkz):** Onboard the creators, configure their token splits, handle the launch flow.
- **Why:** Token adds utility = ZABAL contributors who had trust become token holders who have voice + upside. The coin supplements the empire, not replaces it.

---

## The Concrete Plan: Three Phases

### Phase 1: Establish ZABAL Energy (Live Now - Aug 2026)

**What's happening:** ZABAL Auto-Like is running. 31 builders opted in. Boostr is handling payouts. Zooster leaderboard surfaces who's participating.

**What we need from you (cashlessman/Boostr):**

1. Keep `/api/zabaal/stats` live and fresh (real-time or hourly refresh).
2. Expose (if not already): contributor list (FID, username, followers), total USDC earned per contributor, total likes/casts boosted, date joined.
3. Optionally: contributor opt-out/opt-in history (so we can see consistency). We will not publish this, but it helps Sparkz's energy scorer.

**What we will do:**

1. Build a Zooster leaderboard dashboard (live on thezao.xyz or bettercallzaal.com) that pulls from `/api/zabaal/stats` and ranks contributors by participation.
2. Frame it honestly: "ZABAL crew supports each other. Opt in to Boostr, boost every builder's cast, earn USDC. The leaderboard shows who's in. No token yet. Just energy."
3. Soft cap at 50 contributors (current 31, room to grow). After 50, new joiners apply + Zaal/Iman approve (prevents spam scaling).
4. Monthly Zaal/Iman check-in: "Is this still honest, or has it become a pay-for-likes ring?" If drift, we pause or retool.

**Timeline:** Immediately. Zooster leaderboard ready by end of July 2026. Run through August to build energy and proof point.

---

### Phase 2: Build Reputation Layer (Aug - Early Sept 2026)

**What's happening:** Boostr ZABAL has 1-2 months of real participation data. We know who's consistent. Energy signal is clear.

**What we need from you (Adrian/Empire Builder):**

1. Attach a Clanker token to ZABAL Empire (tokenless -> tokenized). No coin launch yet; token exists, but holders are zero at first. Adrian will give Zaal a private endpoint to do this (already offered, pending).
2. Open the Empire for ZABAL contributors. Snapshot: ZABAL Auto-Like participants get a 1:1 airdrop of the new token (recognizing their early support).
3. Configure booster multipliers: e.g., contributors with 50+ likes on Boostr get a 2x multiplier on their token. Consistent supporters get more upside.
4. Set governance thresholds for the Empire (e.g., top 10 contributors can vote on treasury spend, Empire Builder's distributed rewards, etc.). Token holders vote, ZAO's locked stake does not (per Sparkz governance config: Iman wants creators in control of their own project).

**What we will do:**

1. Document the "energy -> reputation -> token" mapping so creators understand what they earned.
2. Sparkz AI advisor helps interpret: "Your energy score is 73/100. You're in the top tier. At token launch, you'll have [X] tokens + 2x booster multiplier. Here's what that means for voting power and rewards."

**Timeline:** Deploy Sept 1-15. Spend 2-3 weeks collecting feedback on the airdrop + governance thresholds.

---

### Phase 3: Token Launch Decision + Sparkz Config (Sept 2026)

**What's happening:** We have 2-3 months of clean energy data. Builders have tested the token (holding, voting, earning booster rewards). The reputation layer is proven. Now we can launch a real Sparkz coin with confidence.

**What we need from you (Zaal/Sparkz):**

1. Sparkz AI + Zaal decide: "ZABAL energy is genuine. Launch window is now." (This is the Sparkz differentiator: not every creator gets a coin on day 1; you earn it.)
2. Onboard ZABAL creators: 1-3 of them (Iman first, then others). Each creator configures their token split:
   - Default = Iman's proven 50/30/20 (creator 50% lifetime income, community treasury 30%, studio-production fund 20%). Fully adjustable.
   - Governance = default is "hybrid" (creators' token holders vote on treasury use; ZAO's ~25% is locked and non-voting). Creators control their own project.
   - Utility = default is Iman's tested set (request-a-song, gated access to Discord/Telegram, influence-with-creator-veto, credit/recognition, treasury rewards, cross-utility across builders). Creators pick what matters to them.
3. Launch on Clanker (Base chain). Empire Builder handles the token infrastructure + Sparkz handles onboarding + configuration.

**What we will do:**

1. Frame it as "back the album / backing the builders," never "coin" (Zaal's choice for how Sparkz is positioned).
2. Emphasis: "This token is a coordination mechanism, not a casino. Holders have voice. Early believers get more. The token adds to what is built; it does not extract from it."

**Timeline:** Launch decision by mid-Sept. Iman's token launch by end of Sept 2026 (his call, no imposed date).

---

## Success Metrics

By end of August (before token launch decision):

| Metric | Target | Why It Matters |
|--------|--------|-----------------|
| ZABAL Auto-Like participants | 50+ (from 31) | Growth = genuine energy, not artificial |
| Zooster leaderboard users | 1K+ monthly visits | Leaderboard visibility = energy transparency |
| Avg USDC earned per contributor | >$50-100 | Real money = real commitment |
| Boostr likes/casts | 1000+/500+ | Reach signal; quality check via Neynar |
| Consistency (repeat participants) | 80%+ month-to-month | Astroturf test: do people keep showing up? |

By mid-Sept (before Iman's launch):

| Metric | Target | Why It Matters |
|--------|--------|-----------------|
| Token airdrop distribution | 30-40 holders | Early believers recognized |
| Governance participation | 50%+ of top 10 vote | Voting engagement = real ownership feeling |
| Booster reward claims | 20+ claimed | Incentive mechanism works |
| Creator readiness | "Iman says ready" | Iman's signal = green light (no imposed date) |

---

## Open Questions + Asks

### For cashlessman (Boostr)

1. **Stats API uptime:** What's your SLA? We will call `/api/zabaal/stats` every 30min from our leaderboard. Any expected downtime?
2. **Data fields:** Current API returns contributor list, likes count, followers. Any chance you could add:
   - Date first joined ZABAL Auto-Like?
   - Cumulative USDC earned to date?
   - Last active date? (to measure consistency)
3. **Scaling:** If ZABAL grows to 100+ contributors, does the API break? Any limits I should know?
4. **Fee structure:** Do you take a cut from ZABAL contributor earnings on Boostr? (Not a problem either way; just need to be transparent in our framing.)
5. **Private endpoints:** Are there any private/admin endpoints you'd share with Zaal for deeper analytics? (E.g., transaction history, conversion rates from Zooster leaderboard to new Boostr signups?)

### For Adrian/Empire Builder

1. **ZABAL Empire config:** When you say "Clanker token attached to tokenless empire," what is the exact flow? Does Zaal sign a message? Is there a UI, or is it API-only?
2. **Booster multipliers:** Can booster multipliers be data-driven (e.g., "if Boostr likes >= 50, auto-apply 2x multiplier")? Or does Zaal have to manually update them?
3. **Airdrop snapshot:** Should we snapshot ZABAL Auto-Like participants as of a specific date (e.g., Sept 1)? 1:1 token airdrop based on Boostr likes count?
4. **Governance thresholds:** What voting power formula do you recommend for a creator's token holders + ZAO's locked stake? (We're exploring hybrid: creators' holders vote treasury spend, ZAO non-voting.)
5. **Timeline:** When is Empire Builder V3 API fully stable for production launches? Any deprecation warnings I should track?

### For Iman (Co-Builder)

1. **His launch order:** When Iman is ready to be Sparkz's first-case proof-of-concept, what does "ready" look like to him? (His call, no externally-imposed date per Sparkz design.)
2. **Token config:** Does he want Boostr USDC earnings considered in the airdrop? (E.g., "top Boostr earner gets 2x token airdrop")? Or is Boostr participation >= 50 likes enough?
3. **Governance preference:** Of the three Sparkz governance options (A: creator's holders control everything, B: ZAO Respect votes, C: hybrid), which feels right for his vision?
4. **Utility menu:** Beyond the default (request-a-song, gated access, voting, credit, treasury rewards, cross-utility), anything custom Iman wants?

### For Zaal (Sparkz + Framing)

1. **Energy threshold:** What is the Sparkz launch-readiness score? Is 60/100 right, or does it vary by creator type?
2. **Fee structure:** Is Sparkz's 1% fee on Clanker trade volume, token launch, or creator rewards? How does it stack with Clanker's own fee?
3. **AI advisor (future):** Sparkz brief mentions "AI agent decides launch timing." For Iman's launch, is this a future phase, or do you want to test it now?
4. **Public messaging:** After Iman's token launches, how do we position ZABAL as "Sparkz case study #1"? (E.g., blog post, cast, Telegram announcement to ZAO?)

---

## Why This Works

1. **No startups needed.** All three layers already exist:
   - Boostr = live engagement marketplace
   - Empire Builder = proven V3 infrastructure, 7 live leaderboards
   - Clanker = Farcaster's token-launch standard
   - Sparkz = AI advisor + configurable governance/splits (in design, not production yet, but prototype-ready)

2. **Honest mechanics.** Builders earn USDC first (real money, real commitment). Token comes after we validate that commitment. This is not a hype launch; it's a proof of concept.

3. **Mutual upside.**
   - Boostr gets leaderboard visibility + proof it can drive token launches (good for Boostr's brand as "the ZABAL partner").
   - Empire Builder gets a live case study on governance + booster mechanics (V3 feature validation).
   - Sparkz gets its first creator (Iman) + proof that energy-first sequencing works.
   - ZABAL builders get community recognition (Zooster leaderboard) + token upside (Phase 3).

4. **Replicable.** Once Iman's launch works, the playbook is clear for ZABAL Games finalists + WaveWarZ creators + other ZAO brands.

---

## Next Actions

| Action | Owner | Type | By When | Dependencies |
|--------|-------|------|---------|--------------|
| Review this plan + feedback from cashlessman + Adrian + Iman | @Zaal | Decision | 2026-07-18 | This doc |
| Confirm Boostr stats API SLA + any new data fields | @cashlessman | Technical | 2026-07-20 | Zaal asks cashlessman |
| Confirm Empire Builder Clanker attachment flow + booster multiplier automation | @Adrian | Technical | 2026-07-20 | Zaal asks Adrian |
| Confirm Iman's "ready" signal + token config preferences | @Iman | Decision | 2026-07-19 | Zaal asks Iman |
| Build Zooster leaderboard (live, pulling from `/api/zabaal/stats`) | Claude Code team | Build | 2026-07-31 | Boostr API confirmed |
| Deploy ZABAL token airdrop snapshot to Empire Builder | @Adrian + @Zaal | Deploy | 2026-09-05 | Phase 1 energy validated |
| Iman's Sparkz token launch (configuration + onboarding) | @Iman + @Zaal | Launch | 2026-09-30 | Phase 2 governance tested |
| Public announcement: "ZABAL + Sparkz first case study" | @Zaal | Comms | 2026-10-05 | Token launch complete |

---

## Related Docs

- [Doc 1098 - Sparkz master brief](../1098-sparkz-master-brief/) - Sparkz product definition, configurable launcher, AI advisor, tokenless-first thesis
- [Doc 1132 - Zooster: Boostr/ZABAL leaderboard](../../farcaster/1132-zooster-boostr-zabal-leaderboard/) - ZABAL Auto-Like proof-of-concept, guardrails for honest engagement
- [Doc 602 - Empire Builder V3 API spec](../../infrastructure/602-empire-builder-skill-spec-phase3-unblock/) - API write endpoints, booster multipliers, airdrop mechanics
- [Doc 957 - 100K reach H2 2026](../957-100k-total-reach-h2-2026/) - Farcaster as seed engine, mentioning cashlessman as builder vector

---

**Status:** Draft. Ready for Zaal to share with cashlessman, Adrian, and Iman for feedback before committing to the plan.
