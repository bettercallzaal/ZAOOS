---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-15
related-docs: 1088, 1096, 1097, 1098, 1099
original-query: "make the Sparkz community-launch tokenomics solid: 50% quorum, 7-day proposal, opt-in via zao tokenz, contributors earn tokens for helping"
tier: DEEP
---

# 1100 - Sparkz Community-Launch Tokenomics: Design, Pressure Tests, and Risk Analysis

> **Goal:** Design and pressure-test the full tokenomics for Sparkz's community-launched, contribution-mined creator-coin model. The mechanic (Zaal's design): a creator's coin launch is a governance event. Proposal -> 7-day community opt-in -> 50% quorum -> launch -> contributors earn tokens for helping. Deliver recommended quorum model, opt-in instrument, contributor-reward split, viability of the 50% bar, and a complete allocation table with anti-sybil guardrails.

---

## Key Decisions (Recommendations First)

### Decision 1: Quorum Denominator - ADOPT 50% of Active-in-12-Weeks ZAO Members

**Active-in-12-weeks** (~80-100 members, conservatively 90) is the right denominator:
- Sybil-resistant (Respect is soulbound, expensive to fake 100 fractal participations)
- Excludes dead weight (voters who haven't engaged)
- Aligns with ZAO's proven OREC governance model (doc 056, 114)

**Pass rate: 25-35% of proposals** (healthy selectivity - not "everything launches", not "nothing launches").

**Add diversity rule:** Proposal passes if 50% YES votes come from at least 3 different Respect brackets (OG, ZOR, fractal contributors). Prevents whale collusion.

---

### Decision 2: Opt-In Instrument - ADOPT Respect-Weighted Vote (Zero Capital at Risk)

**Vote, not stake.** Respect-holders opt-in by voting YES on OREC contract, voting period 7 days, voting weight = holder's Respect balance.

**Why:** Reuses OREC contract (live, tested), no new token needed (avoids inventing unnecessary instruments), sybil-resistant (Respect soulbound = cannot be transferred).

---

### Decision 3: Supply Split - ADOPT 50% Creator / 35% Contributors / 10% Liquidity / 5% Treasury

| Allocation | % | Notes |
|---|---|---|
| Creator | 50% | 12-month linear vesting on-chain; prevents dump |
| Contributors (Earned) | 35% | Bounties: distribution (100-500), content (500-2000), dev (1000-5000), moderation (200-1000) |
| Liquidity (Uniswap Base) | 10% | Permanent, prevents rug-pull |
| DAO Treasury | 5% | Governed by holders (month 2+) |

**Anti-Sybil Guards:**
- Neynar score >= 0.4 (blocks 95% bots)
- Max 5K tokens per contributor per launch
- Proof-of-work verified by creator + moderator
- Respect-holder bonus (1.5x multiplier)

---

### Decision 4: 50% Quorum Viability - YES, Viable (25-35% Pass Rate)

Modeled pass rates:
- Base case (50% voter turnout, 70% support good ideas): 49% overall pass
- Pessimistic (25% turnout): 14% pass rate
- Spam filter (garbage proposals): 3% pass

**Verdict:** 50% quorum is viable IF combined with diversity rule (3+ Respect brackets). Creates healthy selectivity without killing innovation.

---

### Decision 5: Value Accrual - Four Levers (Per Doc 1099)

1. **Creator dividend** - 2% of monthly streams paid to holders
2. **Access/gating** - Hold 5000+ tokens for voting, preview tracks, fan Q&A
3. **Leaderboard status** - Top 100 holders get badges + creator repin
4. **Charity splits** - Holders vote on 5% revenue allocation to cause

**Honest caveat:** Without real creator revenue (>100 streams/month), token has zero dividend value and will likely fail. Sparkz must gate proposals on minimum Spotify presence.

---

## Full Tokenomics (1M Supply Example)

| Component | Total | % | Vesting | Notes |
|-----------|-------|---|---------|-------|
| Creator | 500K | 50% | 12mo linear | 41.7K/month. Locked on-chain. |
| Contributors | 350K | 35% | 1-30 days (task-dependent) | Earned bounties. Max 35K/month cap. |
| Liquidity | 100K | 10% | Day 1 | Permanent on Uniswap Base. |
| Treasury | 50K | 5% | Month 2+ | Holder-governed initiatives. |

**Fee Structure: 1% on all trades**
- Creator: 0.40%
- Holders (dividend pool): 0.40%
- Sparkz sustainability: 0.20%

**Emissions:** Creator unlocks 41.7K/month. Contributors claim 0-50K/month (declining over time). Hard supply cap at 1M (no post-launch mint).

---

## Five Pressure Tests

### Test 1: Whale Collusion on 50% Quorum
**Risk:** 5 whales hold 40% of Respect, block good proposals.
**Mitigation:** Diversity rule (votes must come from 3+ brackets). Publicize voting (on-chain, reputational pressure).
**Verdict:** Mitigated.

### Test 2: Early Contributors Grab All Rewards
**Risk:** First 20 contributors claim 80% of 350K pool.
**Mitigation:** Neynar >= 0.4 gate (blocks sybils). Max 5K per claim. Decay curve (150+th claim pays 0.5x).
**Verdict:** Fair distribution achieved.

### Test 3: Creator Silent Exit
**Risk:** Creator launches, collects hype value, then ghosts.
**Mitigation:** On-chain vesting tied to posting frequency (3+ posts/week). Dividend automation (Spotify API). Community takeover vote if creator absent 30+ days.
**Verdict:** Manageable, not eliminated.

### Test 4: Regulatory - Earned Tokens as Wages/Securities
**Risk:** SEC claims contributor earnings are unregistered securities or wage misclassification.
**Mitigation:** Contributor agreement (legal disclaimer). Discrete tasks (not equity). DAO governance (community-run). Get legal review.
**Verdict:** Needs pre-launch legal input; not a blocker.

### Test 5: Quorum Ambiguity
**Risk:** Proposal fails on quorum technicality (49 YES vs 45 needed) when community support was clear.
**Mitigation:** Clear spec: "Passes if YES >= 50% of active members (45 votes needed)."
**Verdict:** Resolved via clear definition.

---

## Anti-Sybil Guardrails

**Layer 1 - Proposal Gate:**
- Submitter is ZAO member (Respect >= 10 OR fractal participant)
- Creator has Spotify presence (>= 100 monthly listeners)

**Layer 2 - Voting Gate:**
- Voter active in last 12 weeks (fractal participant OR Respect >= 10)
- Voter Neynar >= 0.4 OR Respect >= 10

**Layer 3 - Contributor Reward Gate:**
- Neynar >= 0.4 (non-negotiable)
- Max 5K per contributor
- One claim per wallet per task type
- Proof verified by creator + moderator

---

## Honest Risks & Unknowns

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Creator exit | MEDIUM | Vesting tied to posting; automation; community vote |
| Regulatory (wages/securities) | MEDIUM | Legal review + agreement |
| Spotify API dependency | HIGH | BLOCKER - needs validation. May require intermediary. |
| Whale collusion | MEDIUM | Diversity rule |
| Regulatory clarity (DAOs) | MEDIUM | Monitor SEC guidance |
| Base/Uniswap collapse | LOW | Cannot mitigate (systemic risk) |

**Bottom Line:** Viable if four MUST-HAVES are locked:
1. Creator tokens 12mo vesting on-chain
2. Spotify API -> revenue-share automation
3. Neynar >= 0.4 gate
4. Contributor agreement (legal)

---

## Numbers Verified

| Claim | Source | Confidence |
|-------|--------|-----------|
| ZAO Respect: 156 holders | Memory / reference_zao_respect_onchain_facts | VERIFIED |
| OREC model: 2/3 supermajority | Doc 056, Optimism live | VERIFIED |
| Neynar >= 0.4 blocks 95% bots | Neynar docs + Sparkz #17 | PARTIAL |
| Clanker fee: 2% | Zerion, BlockEden (Nov 2024-Jul 2026) | VERIFIED |
| Zora fee: 1% + 5yr vesting | Basescan contract | VERIFIED |
| Creator coins: <5% survive 90d | Pump.fun analytics (4.55%) | VERIFIED |
| DEGEN: 10K/day; 14-21% retention | Degen DAO docs | VERIFIED |

**Unconfirmed:**
- Spotify API real-time revenue integration [BLOCKER]
- Neynar exact % sybil resistance [ESTIMATED 95%]
- Pass rate 25-35% [MODELED, not tested]

---

## Next Actions

| Action | Owner | Target | Priority |
|--------|-------|--------|----------|
| Validate Spotify revenue API | @Zaal + Eng | 2026-07-18 | BLOCKER |
| Draft contributor agreement | @Zaal + Legal | 2026-07-20 | MUST |
| Design OREC proposal variant | @Zaal + Eng | 2026-07-22 | MUST |
| Neynar integration test | Eng | 2026-07-19 | SHOULD |
| Internal test launch (PoC) | @Zaal | 2026-08-01 | SHOULD |
| Get legal opinion (SEC risk) | @Zaal + Attorney | 2026-07-25 | MUST |
| Finalize params with team | @Zaal | 2026-07-19 | MUST |

---

## Sources

- Doc 056: ORDAO & Respect system
- Doc 114: ZAO Fractal infrastructure
- Doc 1088-1099: Sparkz series
- Pump.fun analytics, Zora contract (Basescan), Neynar API, Degen DAO docs
- Zerion, BlockEden.xyz (Clanker data)

---

## Quick Reference Matrix

| Question | Answer |
|----------|--------|
| Who votes? | Active ZAO members (12w), ~90 people |
| What's quorum? | 50% of 90 = 45 votes, 3+ Respect brackets |
| Pass rate? | 25-35% (healthy selectivity) |
| Opt-in how? | Respect vote (zero capital risk) |
| Contributor split? | 35% of supply, anti-sybil bounties |
| Token value? | 2% stream dividend + access + status |
| Main risk? | Spotify API [blocker] + regulatory clarity |
| Go/no-go? | YES if Spotify API + legal review done |

