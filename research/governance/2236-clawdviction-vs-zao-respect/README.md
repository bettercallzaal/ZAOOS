---
topic: governance
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2231, 2229, 056, 102
original-query: "clawdviction -> ZAO Respect/ORDAO governance adopt-spec (conviction voting amount*time + per-holder AI agent)"
tier: STANDARD
---

# 2236 - clawdviction vs ZAO Respect: conviction-staking is the WRONG adopt; the AI-agent isn't

> **Goal:** Spec clawdviction's conviction governance for ZAO Respect. Grounding BOTH
> sides flips the answer: the conviction mechanism contradicts Respect's founding
> principle. This says what NOT to adopt, and what actually maps.

## The grounding that flips it (confirm-before-claiming)

**clawdviction (gh api, real):** `ClawdVictionStaking.sol` - conviction is capital staked
over time: `stake(amount)` pushes a `Stake{amount, stakedAt}`; `unstake` settles
`clawdviction = amount * (block.timestamp - stakedAt)` (:55); weight accrues as
`amount * block.timestamp` (:45). **Plutocratic by construction** - more tokens, staked
longer, = more governance weight.

**ZAO Respect (fractal ICM box + docs 056/102, real):** Respect is the **Fractal weekly
Respect Game** - contributors meet, break into small groups, **peer-rank each other's
contributions**, and the chain mints **soulbound** Respect on a Fibonacci curve. 100+
consecutive weeks. Explicitly: "**not a token sale and not a popularity contest**" -
"how do you reward contribution without a token pre-sale or a boss deciding." Respect is
**non-transferable, earned by peer-ranked contribution, not by staking capital.**

These are OPPOSITE philosophies. Conviction = pay capital for weight. Respect = earn
weight by contribution, soulbound, un-buyable. **Putting conviction-staking on Respect
would import the exact plutocracy Respect was designed to prevent.**

## Check-alternatives (feedback_check_alternatives_oss_first)

The canonical OSS conviction-voting is **1Hive** (`1Hive/conviction-voting-app`, 97 stars,
NO license - study-only; `1Hive/gardens`, MIT, 30 stars). 1Hive's conviction voting is
ALSO **capital-staked** (stake tokens on a proposal; conviction grows with stake x time).
So it's the SAME mismatch - no conviction-voting variant (clawd's or 1Hive's) fits a
soulbound peer-ranked reputation. The alternatives pass confirms the finding rather than
rescuing the adopt: **conviction-voting is a capital-allocation tool, not a
contribution-ranking one.** Credit: clawdbotatg/clawdviction (MIT), 1Hive (MIT/none).

## What actually maps (the honest, smaller adopt)

Not the conviction mechanism - the **per-holder AI agent** clawdviction pairs with it
(doc 2229): an agent trained on a member's values that **participates in governance on
their behalf**. For ZAO this maps cleanly onto the ZOL/ZAI agent layer - a member could
have a ZAI-style agent that helps them PARTICIPATE in the Fractal (prep, surface their
prior contributions, draft their rankings' rationale) - **participation support, never
vote-weighting.** Respect stays peer-ranked + soulbound; the agent just lowers the
friction of showing up and ranking well. That is additive to Respect, not a replacement
of its mechanism.

## Recommendation

1. **Do NOT adopt conviction-staking for ZAO Respect.** It contradicts Respect's founding
   anti-plutocratic, soulbound, peer-ranked design (fractal box; docs 056/102). This is
   the load-bearing finding - the queued "adopt clawdviction for Respect" was wrong.
2. **If ZAO ever wants a conviction mechanism, scope it to CAPITAL decisions** (treasury
   allocation, a funding pool) - a DIFFERENT surface from Respect, never mixed with
   contribution-ranking. Even then, 1Hive Gardens (MIT) is the more battle-tested base
   than clawdviction (a hackathon-grade PoC).
3. **The per-holder AI governance-participation agent is the real, small adopt** - and it
   belongs to the ZOL/ZAI layer, as participation support for the Fractal, gated + human-
   in-the-loop (an agent never mints Respect or ranks autonomously).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| CLOSED: do not put conviction-staking on Respect (contradicts its soulbound peer-ranked design) | - | Decision | done |
| If a capital-conviction surface is ever wanted (treasury), evaluate 1Hive Gardens (MIT) - separate from Respect | @Zaal | Backlog | wontfix unless raised |
| Explore a ZAI-style Fractal-participation helper (prep/surface-contributions/draft-rationale; never autonomous ranking) | @Zaal | Research | 2026-08-14 |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/clawdviction (MIT)** - gh api 2026-08-06: `ClawdVictionStaking.sol`
  (conviction = amount*(now-stakedAt) :55, weightedStakeSum :45). [FULL]
- **1Hive/conviction-voting-app** (97 stars, no license), **1Hive/gardens** (MIT, 30
  stars) - gh api, the OSS conviction-voting canon (also capital-staked). [FULL]
- **ZAO Respect** (FULL, in-repo): `research/identity/icm-boxes/fractal.llm.txt` (peer-
  ranked, soulbound, "not a token sale"), docs 056 (ORDAO Respect system), 102 (fractals/ORDAO).

## Also See

- [Doc 2231](../../agents/2231-clawd-repo-sweep-workflow-triage/) - the sweep that queued this (as a full-spec candidate; this doc is the honest answer).
- [Doc 2229](../../agents/2229-clawd-attest-eas-trust-adopt/) - clawd's per-holder AI agent, the part that DOES map.
