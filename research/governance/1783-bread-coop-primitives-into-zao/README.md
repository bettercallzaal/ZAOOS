---
topic: governance
type: design-proposal
status: ready-for-review
last-validated: 2026-07-22
related-docs: 1781, 1098, 893, 1532, 458, 696
original-query: "Fold bread.coop's deposit-and-keep yield funding, 50/50 flat-floor voting, and time-weighted voting power into ZAO's Sparkz, ZOL, and contribution-circles mechanisms."
tier: STANDARD
---

# 1783 - Bread Cooperative Primitives into ZAO: Design Proposal

> **Goal:** Map bread.coop's three reusable solidarity primitives (deposit-and-keep yield funding, 50/50 flat-floor voting, time-weighted voting power) onto ZAO's existing Sparkz creator-coin launcher, ZOL Farcaster agent, and contribution-circles/Respect governance. Deliver concrete design options, honest fit assessments, and a clear recommendation on which primitives to adopt first and where.

> **Scope:** This is a design proposal for Zaal's review, not a mandate or final spec. Every decision point is flagged. No changes to any existing product spec are included.

---

## Executive Summary - Key Recommendation

Bread Cooperative has designed three load-bearing mechanisms that are **directly transferable to ZAO's governance and funding stacks**. Of the three, the proposal recommends adopting **two primitives immediately** - they solve real problems in the ZAO ecosystem:

| Primitive | ZAO home | Recommendation | Why |
|-----------|----------|-----------------|-----|
| **Deposit-and-keep yield funding** | Contribution circles (future member-project fund) | ADOPT PHASE 1 | Solves the "principal risk" problem: members fund commons from yield instead of losing capital. Sustainable alternative to one-time grants. |
| **50/50 flat-floor voting** | Respect/contribution circles + future Sparkz governance | ADOPT PHASE 1 | Direct solution to ZAO's whale-capture problem (Respect Gini 0.73 across 156 holders). Flat floor + weighted vote = capital-resistant. |
| **Time-weighted voting power** | Any ZAO on-chain vote (Sparkz, ZOL, future ORDAO proposals) | ADOPT PHASE 2 | Anti-flash-governance. Borrow for any token-weighted vote where last-minute buys could sway outcomes. Low implementation cost. |

---

## Part 1 - Deposit-and-Keep Yield Funding

### How It Works in Bread.coop

Bread's flagship mechanism (doc 1781):

1. User deposits **xDAI** (stablecoin) into the Crowdstaking contract.
2. The contract converts it to **sDAI** (yield-bearing Savings DAI).
3. User receives **$BREAD** (pegged 1:1 to xDAI, transferable, usable as currency).
4. **The user keeps their principal claim** - they can burn $BREAD anytime to reclaim the underlying xDAI. Principal is never spent.
5. **Only the yield** (sDAI interest) funds member projects. The principal is held in perpetuity.
6. $BREAD holders vote monthly on how to allocate the yield.

**Key principle:** Sustainable funding without capital extraction. The depositor keeps their money; the cooperative lives off the interest.

---

### Mapping to Sparkz (Creator-Coin Launcher)

**Fit: POOR - not recommended for Sparkz itself.**

Why: Sparkz is designed as an **energy-first, immediate-value token**, not a yield-bearing instrument. The Sparkz model (doc 1098) is:
- Creator launches a token on Clanker (Base mainnet).
- Fees route through 0xSplits to creator/collaborators/leaderboard.
- Token gains utility through post-launch community engagement (tortoise, fotocaster, leaderboards).

**Conflict:** Deposit-and-keep yield funding requires a **yield-bearing underlying asset** (like Aave or Compound lending). Base mainnet has these (Moonwell, Aave), but baking yield-capture into a creator coin's design overcomplicates the product and distracts from the energy signal. A creator coin that promises holders yield starts looking like a **revenue-sharing security**, which is exactly the legal risk doc 1108 flags - the "Howey trap" of promising holders a return from others' efforts.

**Better approach:** Yield funding is orthogonal to Sparkz. It belongs in a separate **"Commons Fund"** product (see "Mapping to Contribution Circles" below), not in individual creator coins.

**Decision point for Zaal:** Skip yield mechanics in Sparkz itself. Keep Sparkz energy-first and participation-based.

---

### Mapping to ZOL (Farcaster Agent)

**Fit: VERY POOR - not a mechanistic fit.**

Why: ZOL is a **music-discovery and curation agent** (doc 893), not a governance or funding mechanism. Its economic action is **curate-to-reward** - ZOL spotlights music and routes $ZABAL/DEGEN tips or Zora song-mints to artists, not to a treasury.

**Conflict:** Deposit-and-keep yield funding is a **governance layer**, not an agent behavior. ZOL does not vote, does not manage a treasury, and does not hold deposits. The mechanism belongs in the governance/voting layer, not the agent.

**Better fit:** If ZOL ever powers a leaderboard or artist-reward system for music contributions (Phase 2), that *could* use yield-funded payouts (funded from a Commons Treasury, not from ZOL's own mechanics). But ZOL itself stays out of the funding layer.

**Decision point for Zaal:** Do not apply yield funding to ZOL. Keep ZOL as a curator; let the governance layer (Respect/contribution circles) handle funding.

---

### Mapping to Contribution Circles + Respect (Governance Layer)

**Fit: EXCELLENT - recommended for adoption.**

**The mechanism:**

ZAO's contribution circles (doc 458) are small groups of 4-6 ZAO members meeting weekly to coordinate on shared projects (WaveWarZ, ZAOstock, Impact Concerts, music-on-chain building). Currently, circles operate on coordination + volunteer energy. **The funding model is undefined** - there is no on-chain way to say "this circle generated value, so it should be funded from a shared pool."

Bread's deposit-and-keep model solves this:

1. **ZAO members opt into a "Circle Commons Fund"** by depositing USDC/DAI/USDT into a Supabase + Aave/Moonwell bridging contract.
2. Their deposit is **converted to yield-bearing tokens** (e.g., aUSDC on Base Aave or mUSDC on Moonwell).
3. They receive a **non-transferable contribution voucher** (an ERC-1155 or a Supabase record) representing their stake.
4. **They keep their principal claim** - they can burn the voucher to reclaim their deposit anytime (minus a small redemption delay for liquidity).
5. **Monthly, the yield is distributed** to active contribution circles, voted on by circle members.

**Concrete example:**

- Zaal deposits 500 USDC into the Circle Commons Fund. Receives a "500 USDC principal claim" voucher.
- The 500 USDC is lent to Aave Base. Over 30 days, it generates ~8 USDC in yield (current APY ~6%).
- At month-end, the Circle Commons votes: "how do we split the 8 USDC yield this month?" 50% to WaveWarZ, 30% to ZAOstock, 20% to Impact Concerts.
- WaveWarZ circle receives 4 USDC. ZAOstock receives 2.4 USDC. Impact Concerts receives 1.6 USDC.
- Zaal's 500 USDC principal stays in the fund. Next month, the circle votes again.

**Advantages for ZAO:**

1. **Sustainable funding without burnout.** Contributors do not lose capital; they lend it. The circle lives off the interest.
2. **Skin-in-the-game without risk.** Depositors have veto power (can redeem anytime) but earn from collective success.
3. **Capital-resistant allocation.** The yield vote is democratic, not weighted by wealth - everyone in a circle gets equal voice (see "50/50 flat-floor voting" below).
4. **Composable with Respect.** The voucher can double as a "proof of stake" in the circle, gating future Hats roles or ORDAO weight. (Doc 1532 flags this as a possible Respect unlock.)

**Implementation complexity:**

- **Smart contract:** A simple wrapper around Aave/Moonwell that mints ERC-1155 vouchers and distributes yield monthly. Moderate complexity, no novel mechanics. Supabase can track the voting.
- **Legal:** The vouchers are not securities (they are staking receipts, similar to Lido's stETH). The yield is not revenue-sharing (it is interest from a lending protocol). Lower legal risk than securities, but flag for counsel review (Greg).
- **UX:** Members deposit via a Supabase form, receive a voucher on their wallet, vote in a Discord bot or a web form monthly.

**Risks and constraints:**

1. **Liquidity drag:** If yield is distributed monthly, small deposits (< 50 USDC) might not generate meaningful returns. A 50 USDC deposit at 6% APY generates 0.25 USDC/month. Suggest a minimum deposit of 100 USDC and/or quarterly (not monthly) distributions.
2. **Yield volatility:** Aave/Moonwell yields fluctuate (can drop below 2% in bear markets). Circles need to accept variance. If yield drops sharply, communication matters.
3. **Redemption delays:** To avoid liquidity crises, add a 7-day notice period for large redemptions (> 1000 USDC). Bread does not have this, but ZAO likely should.
4. **Governance overhead:** Monthly voting adds process. Suggest automate 70% of the distribution (e.g., splits earned by prior-month active participants) and vote only on discretionary 30%.

**Decision points for Zaal:**

1. **Launch timing:** Pilot this with one or two active circles (WaveWarZ, ZAOstock) before opening to all. Proof-of-concept in Q3 2026, scale in Q4.
2. **Deposit currency:** USDC on Base? Or multi-chain (Optimism USDC for Respect settlement)? Base is simpler for now.
3. **Yield source:** Aave or Moonwell? Aave is more battle-tested; Moonwell offers slightly higher rates. Recommend Aave for Phase 1.
4. **Minimum deposit:** 100 USDC? 500 USDC? Balance inclusivity vs yield signal.
5. **Voucher properties:** Should vouchers have expiry (e.g., "reclaim by date X or the deposit converts to a permanent commons gift")? Or perpetual?

---

## Part 2 - 50/50 Flat-Floor Voting

### How It Works in Bread.coop

Bread's yield-governance formula (doc 1781):

**Disbursement of monthly yield is 50/50:**

- **50% pre-determined:** Split evenly across all member projects, regardless of size or token holdings. Everyone gets an equal slice. This is the **capital-resistant floor** - it protects small projects from whale dominance.
- **50% token-weighted:** $BREAD holders vote on the split of the remaining half. Weighted by **time-weighted voting power** (see Part 3 below). No one can buy influence right before a vote.

**Worked example (200 BREAD yield/month, 8 member projects):**
- 100 BREAD split evenly: each project gets 12.5 BREAD (100 / 8).
- 100 BREAD by vote: holders vote, e.g., Symbiota 40%, Crypto Commons 25%, Bread Core 20%, Regen Coordination 15%.
- Final distribution: Symbiota gets 12.5 + 40 = 52.5 BREAD; Crypto Commons gets 12.5 + 25 = 37.5 BREAD, etc.

**Key insight:** The 50% floor ensures no project starves, even if whales do not like it. The 50% vote ensures quality/popularity can be rewarded. Together, they resist both abandonment and capture.

---

### Mapping to Sparkz (Creator-Coin Launcher)

**Fit: POOR - not applicable to individual creator coins, but GOOD for a governance layer above them.**

Why: Individual Sparkz tokens are **creator-specific**, not collective governance. Each creator coin has its own split (creator/collaborators/leaderboard), configured via the 0xSplits contract (doc 1098). The split is **immutable after launch** (by design in Clanker v4, mutable via Splits - see doc 1098 Section "The launch rail").

**Conflict:** The 50/50 model assumes a **pooled treasury voting on allocations across multiple recipients**. Individual creator coins are point-to-point (creator A's fees go to creator A's collaborators, not to a collective vote).

**Better fit for Sparkz:** If ZAO ever builds a **"Sparkz Creator Collective"** (a pooled treasury funded by a small fee on all Sparkz launches), the 50/50 model could govern how that collective treasury rewards high-performing creators, emergent collabs, or community public goods. This is a **Phase 2 feature**, not MVP.

**Concrete example (Phase 2, speculative):**
- Every Sparkz launch routes 2% of creator fees to a "Collective Treasury" (in addition to the creator's own split).
- Monthly, the Collective Treasury distributes yield:
  - 50% evenly to all active Sparkz creators (floor).
  - 50% to creators voted as "standouts" by the Sparkz community (weighted vote).

This would incentivize participation over time and protect small creators. But it is not necessary for MVP - do not propose it unless Zaal explicitly asks for it.

**Decision point for Zaal:** Skip the 50/50 model in Sparkz MVP. If a Sparkz Collective Treasury emerges in Phase 2, revisit this.

---

### Mapping to ZOL (Farcaster Agent)

**Fit: POOR - same as Sparkz. ZOL is an agent, not a collective governance mechanism.**

ZOL's economic action (doc 893) is **curate-to-reward**: ZOL spotlights music and routes tips/mints to individual artists. The reward is point-to-point (artist -> tip), not collective.

**Tangential fit:** If ZOL ever power a **"Music Discovery Leaderboard"** where top contributors to music discovery earn collective rewards, the 50/50 model could govern leaderboard distributions (50% evenly, 50% by performance). But this is speculative and outside ZOL's current scope.

**Decision point for Zaal:** Do not apply 50/50 to ZOL itself. If a music-discovery leaderboard emerges, revisit.

---

### Mapping to Contribution Circles + Respect (Governance Layer)

**Fit: EXCELLENT - solves a real, documented problem.**

**The problem:** ZAO's Respect token (ZOR, doc 1532) tracks **peer-ranked contribution**, not capital. This is intentional - Respect is non-transferable, earned only by showing up and contributing. But the governance it unlocks (ORDAO voting) is still **weighted by holdings**, which creates a **concentration risk**: high-Respect holders can dominate votes.

Current state (doc 1532 + reference_zao_respect_onchain_facts):
- 156 ZOR holders.
- Gini coefficient: 0.73 (high inequality - the top ~20% hold ~60% of tokens).
- ORDAO vote weight is proportional to ZOR holdings.
- **Risk:** A small group of high-Respect members could dominate ORDAO votes, especially on spending/priority decisions.

**How 50/50 flat-floor voting solves this:**

Apply the 50/50 model to **ORDAO proposals on contribution-circle funding and project allocation:**

1. **Proposal:** "How do we allocate the Circle Commons yield this month?"
2. **Vote:**
   - **50% flat-floor:** Every ZOR holder gets an equal vote (1 vote per person, not 1 vote per token). This floor protects small-Respect members from being drowned out.
   - **50% weighted:** ZOR holders vote with their token weight (allowing high-Respect members to reward standout contributions).
3. **Result:** Proposals pass if they get >50% of the combined (floor + weighted) vote.

**Concrete example:**

- Proposal: "Allocate Circle Commons yield: 50% WaveWarZ, 30% ZAOstock, 20% Impact Concerts."
- 156 total ZOR holders vote.
- **Floor vote (50%):** Each holder casts 1 vote. Allocating floor votes: WaveWarZ 80 votes (51%), ZAOstock 50 votes (32%), Impact Concerts 26 votes (17%).
- **Weighted vote (50%):** ZOR-weighted vote. WaveWarZ gets 40% of weighted votes, ZAOstock 35%, Impact Concerts 25%.
- **Final:** WaveWarZ: 50% * 51% + 50% * 40% = 45.5%; ZAOstock: 50% * 32% + 50% * 35% = 33.5%; Impact Concerts: 50% * 17% + 50% * 25% = 21%.
- **Result:** Proposal passes with WaveWarZ, ZAOstock, Impact Concerts all funded proportionally, without any holder dominating.

**Advantages:**

1. **Balances experience and equality.** High-Respect members have earned their weight and keep it, but new members have an equal voice in baseline decisions.
2. **Prevents whale capture.** Even if the top 5 holders coordinate, they cannot unilaterally pass a proposal (they would need >50% of the combined vote).
3. **Sustainable for growth.** As ZAO on-boards more members (goal: scale Fractal to 300+ holders), the flat floor protects against concentration creep.
4. **Precedent:** Bread Coop published this exact model; it is battle-tested.

**Implementation complexity:**

- **Smart contract:** A voting contract that tallies two separate vote counts (flat and weighted) and combines them at 50/50. Moderate complexity. Can be built on Optimism (where ZOR lives) in ~1-2 weeks.
- **UX:** A voting interface (Snapshot or a Supabase form) where members vote once and the system weights it twice (1 vote for flat, ZOR balance for weighted).
- **Governance:** Need a clear proposal template. Suggest: funding allocation proposals use 50/50; constitutional changes use 2/3 weighted-only (to preserve high-Respect weight on core governance).

**Risks:**

1. **Voter apathy:** Flat-floor voting can increase turnout (members feel their voice matters), but low-Respect members might still not vote. Mitigation: promote with messaging like "your vote counts equally this month, regardless of your Respect level."
2. **Proposal complexity:** If there are many options (e.g., 10 projects competing for funding), the flat floor makes voting complex (everyone allocates 50% of their flat vote weight across 10 projects). Mitigation: limit to top-3 to top-5 proposals per vote.
3. **Conflicts with existing ORDAO votes:** If ORDAO already has live proposals using pure weighted voting, shifting to 50/50 is a governance change. Suggest: grandfather existing proposals; adopt 50/50 for new proposals starting Q3 2026.

**Decision points for Zaal:**

1. **Adoption scope:** Apply 50/50 to ALL ORDAO proposals, or only to funding/allocation votes? Recommend funding/allocation only (Phase 1), constitutional votes stay weighted-only (Phase 2 decision).
2. **Proposal threshold:** What quorum/approval threshold? (e.g., need >50% of all ZOR holders to vote, or accept whatever quorum votes?). Recommend: simple majority of votes cast (no quorum requirement for Phase 1, can add later).
3. **Activation date:** When do existing ORDAO votes shift to 50/50? Recommend: for new proposals opened after Zaal approval (this proposal), no retroactive change.

---

## Part 3 - Time-Weighted Voting Power

### How It Works in Bread.coop

Bread's time-weighted voting power (doc 1781):

**Voting power = average $BREAD held over the prior 30-day cycle.**

So:
- If you bought 1,000 $BREAD on day 29 (right before voting), your average is only ~34 BREAD (1000 / 30), so your vote is ~1/30th strength.
- If you held 100 BREAD all 30 days, your average is 100, so your vote is full strength.

**Purpose:** Block flash-governance attacks. A whale cannot buy $BREAD to sway a vote and dump it immediately after (the dump is already priced into the vote, so the whale gains nothing).

**Trade-off:** LPs (liquidity providers) can preserve voting power via **LP Voting Vaults** - a contract that tracks their average LP shares over time, decoupling voting from hodling duration.

---

### Mapping to Sparkz (Creator-Coin Launcher)

**Fit: MEDIUM - not critical for MVP, but worth implementing in Phase 2.**

Why: Sparkz tokens are designed for **community + energy, not speculation**. A creator launches with their early supporters, and the token gains value through engagement (tortoise, leaderboards, post-launch utility). Speculation is explicitly de-emphasized (doc 1098: "The token ADDS to what is built, it does not extract").

**But:** If a Sparkz token does start trading (it will on Uniswap, regardless of intention), a sophisticated holder *could* buy tokens right before a governance vote (e.g., on a leaderboard decision), vote, and dump. Time-weighting would prevent this.

**Practical consideration:** Most Sparkz tokens are not expected to have on-chain governance in Phase 1. The Sparkz Collective Treasury (Phase 2) would have votes, and those should be time-weighted.

**Decision point for Zaal:** Include time-weighting in the Sparkz Collective Treasury vote contract (Phase 2). For individual creator coins, time-weighting is optional.

---

### Mapping to ZOL (Farcaster Agent)

**Fit: POOR - ZOL does not have token-weighted votes.**

ZOL's only economic action is curate-to-reward (tipping artists), not governance. No votes, no governance token. Time-weighting does not apply.

**Tangential:** If ZOL ever powers a leaderboard where users vote on music picks, time-weighting the vote (by users' time-in-community or followers) could prevent bot gaming. But this is speculative.

**Decision point for Zaal:** Do not apply time-weighting to ZOL.

---

### Mapping to Contribution Circles + Respect (Governance Layer)

**Fit: EXCELLENT - solves a real attack vector in ORDAO.**

**The problem:** ZOR is non-transferable, so you cannot buy your way in (good). But if ZAO ever opens an ORDAO vote where someone could earn massive ZOR for a specific vote (e.g., "vote YES on giving 100,000 USDC to my project, and I'll split the treasury with you"), a coalition could coordinate a one-time ZOR mint, vote, and then abandon their holdings.

More realistically: **If ZAO launches ZOL culture coins (future)** that are transferable and have governance weight, a whale could buy ZOL tokens right before a vote and dump after. Time-weighting blocks this.

**How it works for Respect:**

Apply time-weighting to **ORDAO votes:**

- **Voting power at proposal-vote time = average ZOR held over the prior 30-day window** (starting when the proposal was posted).
- If a member earned 100 ZOR last week (just before a proposal opened), their 30-day average is only ~14 ZOR (100 / 7 days * 30 days rolling window), so their vote is ~14% strength.
- If a member has held 100 ZOR steadily for 3 months, their 30-day average is 100, so they get full vote.

**Advantages:**

1. **Blocks one-time coordination attacks.** Cannot suddenly mint/buy massive Respect to sway a vote.
2. **Rewards sustained participation.** Long-term members' votes carry more weight, aligning with ZAO's thesis that sustained contribution matters.
3. **Cheap to implement.** The OREC contract (which mints ZOR, doc 1532) already tracks time-windowed data. Adding a time-weighted vote calculation is a simple contract upgrade.

**Risks:**

1. **Punishes recent joiners.** A new member joining and earning high Respect has less vote weight than a long-term low-Respect member. Could be seen as gatekeeping. Mitigation: messaging - "your vote grows stronger the longer you participate."
2. **Complexity.** Voting becomes harder to explain ("why does my 100 ZOR vote only count as 30?"). Mitigation: dashboard shows "your vote weight today: 78 ZOR" (the average).
3. **Gaming the timeline.** A coalition could coordinate over several weeks (members earn small amounts repeatedly) to accumulate time-weighted power without detection. Mitigation: this is harder to do than a one-time flash-governance attack, so the risk is lower.

**Implementation complexity:**

- **Smart contract:** Time-weighted voting in ORDAO. Likely a 1-2 week upgrade to the existing ORDAO voting contract on Optimism.
- **UX:** Dashboard shows "your voting power on this proposal: X ZOR (Y% of total)" before vote opens.
- **Timeline:** Low priority for Phase 1, can defer to Phase 2 (Q4 2026).

**Decision points for Zaal:**

1. **Activation:** When should time-weighting start? Recommend: for ORDAO votes opened after Zaal approval (this proposal), no retroactive change to past votes.
2. **Window:** 30 days (like Bread)? Or 60 days (longer)? For a weekly Fractal cadence, 30 days = ~4 weeks = 4 sessions. Recommend 30 days (matches Bread precedent).
3. **Exception:** Should constitutional amendments (e.g., "change ORDAO voting rules") require higher, weighted-only voting, or also use time-weighting? Recommend weighted-only for constitutional votes (to preserve high-Respect weight on core governance).

---

## Summary - Recommendation Matrix

| Primitive | Sparkz | ZOL | Contribution Circles + Respect | Overall Priority |
|-----------|--------|-----|--------|------------------|
| **Deposit-and-keep yield funding** | Skip | Skip | **Adopt Phase 1** | HIGH - solves member funding problem |
| **50/50 flat-floor voting** | Phase 2 (Collective) | Skip | **Adopt Phase 1** | HIGH - solves whale-capture problem |
| **Time-weighted voting power** | Phase 2 | Skip | **Adopt Phase 2** | MEDIUM - reduces attack surface |

---

## Implementation Roadmap - Recommended Phasing

### Phase 1 (Q3 2026, Jul-Sep)

1. **Circle Commons Fund smart contract** (2 weeks):
   - ERC-1155 voucher minting.
   - Aave Base integration for yield.
   - Monthly yield distribution and voting.
   - Supabase voting tracking.

2. **Contribute circles + Respect governance UI** (1 week):
   - Deposit/claim form.
   - Monthly voting dashboard.

3. **ORDAO 50/50 flat-floor voting** (1 week):
   - Update ORDAO vote contract to tally flat + weighted votes.
   - Snapshot integration (or custom vote form).

4. **Pilot testing** (2 weeks):
   - Test with WaveWarZ + ZAOstock circles.
   - Gather feedback on UX + yield yield feels.
   - Adjust parameters (min deposit, vote frequency) based on pilot.

5. **Launch** (2 weeks):
   - Announce to full ZAO community.
   - Onboard remaining circles.
   - Monitor yield volatility + liquidity.

**Effort: ~4-5 weeks for two people. Effort tier: 5/10 (moderate, no novel infrastructure).**

### Phase 2 (Q4 2026, Oct-Dec)

1. **Sparkz Collective Treasury** (2-3 weeks):
   - Pooled treasury funded by Sparkz creator fees.
   - 50/50 flat-floor + weighted vote on distributions.
   - Time-weighted voting power.

2. **ORDAO time-weighted voting** (1 week):
   - Upgrade ORDAO vote contract to use 30-day average ZOR.
   - Snapshot or custom interface.

3. **Music discovery leaderboard** (Phase 2, optional):
   - If ZOL leaderboard launches, apply 50/50 governance to rewards.

**Effort: ~3-4 weeks for one person. Effort tier: 5/10 (builds on Phase 1 infrastructure).**

---

## Honest Fit Assessment - What to Skip

**Deposit-and-keep yield funding for Sparkz:**

- Reason to skip: Complicates creator-coin product, introduces legal/complexity risk, and contradicts the energy-first thesis.
- Where to apply instead: Contribution circles (as recommended).

**50/50 flat-floor voting for ZOL:**

- Reason to skip: ZOL is an agent, not a collective voting system.
- Where to apply instead: Respect/ORDAO governance (as recommended).

**Time-weighted voting for Sparkz individual creator coins:**

- Reason to skip: Not critical for Phase 1 (most tokens will not have governance). Useful for Phase 2 Collective Treasury only.

---

## Decision Points for Zaal

**This proposal flags the following decisions for Zaal's approval before any build:**

1. **Circle Commons Fund MVP:**
   - Minimum deposit: 100 USDC or 500 USDC?
   - Yield source: Aave or Moonwell?
   - Distribution frequency: monthly or quarterly?
   - Voucher expiry: perpetual or time-limited?

2. **ORDAO 50/50 voting:**
   - Scope: funding/allocation votes only, or all proposals?
   - Quorum requirement: yes or no?
   - Activation: new proposals starting now, or after further review?

3. **ORDAO time-weighted voting (Phase 2):**
   - Window: 30 days, 60 days, or other?
   - Exceptions: constitutional amendments use weighted-only?

4. **Legal review:**
   - Circle Commons vouchers + yield: are they securities or staking receipts? (Flag for Greg.)
   - Sparkz Collective Treasury: does it re-introduce Howey risk from doc 1108?

5. **Priority alignment:**
   - Does the Phase 1 roadmap align with other ZAO priorities? (E.g., if Sparkz MVP is your focus, defer Circle Commons to post-MVP.)

---

## Also See

- [Doc 1781](../../1781-bread-coop-solidarity-primitives/) - Bread Cooperative research (source material)
- [Doc 1098](../../business/1098-sparkz-master-brief/) - Sparkz creator-coin launcher spec
- [Doc 893](../../music/893-zol-music-native-farcaster-agent/) - ZOL agent design
- [Doc 1532](../../governance/1532-zor-respect-token-practical-guide/) - Respect/ZOR token guide
- [Doc 458](../../community/458-zao-contribution-circles/) - Contribution circles framework (Impactful Giving)
- [Doc 696](../../696-zao-fractal-whitepaper/) - Fractal whitepaper (related political thesis)
- [Reference](../../reference_zao_respect_onchain_facts.md) - ZOR holder data (156 holders, Gini 0.73)

---

## Next Actions

| Action | Owner | Type | By When | Notes |
|--------|-------|------|---------|-------|
| Review this proposal + make decisions on the decision points above | @Zaal | Review | 2026-07-29 | Flagged 5 decision buckets; propose answers. |
| Flag to counsel (Greg): Circle Commons vouchers legal status? | @Zaal | Legal review | 2026-08-05 | Staking receipts or securities? |
| If greenlit Phase 1: assign smart contract build (Deposit-and-keep + 50/50) | @Zaal | Assignment | 2026-08-12 | Effort: 4-5 weeks, 2 people. |
| If greenlit Phase 1: pilot testing plan (WaveWarZ + ZAOstock circles) | @Zaal | Planning | 2026-08-12 | Plan before build. |
| Reach out to Joshua Dávila (Bread co-founder) for collaboration/feedback on this proposal | @Zaal | Outreach | wontfix (optional) | The Blockchain Socialist podcast is an aligned voice. Could be a partnership. |

---

## Sources

- [Bread Cooperative Research (Doc 1781)](../../1781-bread-coop-solidarity-primitives/) - primary source on deposit-and-keep, 50/50 voting, time-weighting
- [Sparkz Master Brief (Doc 1098)](../../business/1098-sparkz-master-brief/) - Sparkz architecture, 0xSplits rail, legal guardrails
- [ZOL Design Guide (Doc 893)](../../music/893-zol-music-native-farcaster-agent/) - ZOL niche, persona, economic actions
- [Respect/ZOR Practical Guide (Doc 1532)](../../governance/1532-zor-respect-token-practical-guide/) - ZOR mechanics, ORDAO voting, current state
- [ZAO Contribution Circles (Doc 458)](../../community/458-zao-contribution-circles/) - Impactful Giving framework, circle mechanics
- [ZAO Respect Onchain Facts (Reference)](../../reference_zao_respect_onchain_facts.md) - 156 holders, Gini 0.73, concentration data
- [Bread Docs — Yield Governance](https://docs.bread.coop/solidarity-primitives/crowdstaking/yield-governance/) - official source on 50/50, time-weighting
- [Bread Docs — Crowdstaking](https://docs.bread.coop/solidarity-primitives/crowdstaking/) - deposit-and-keep mechanism
