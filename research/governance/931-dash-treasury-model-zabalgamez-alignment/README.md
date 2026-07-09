---
topic: governance
type: comparison
status: research-complete
last-validated: 2026-07-01
related-docs: 133, 703, 922
original-query: "STANDARD. Research Dash features (docs.dash.org) and assess alignment with ZABAL Gamez (tokenless Build-A-Thon on Farcaster/Base, POIDH prize pot + Empire Builder + the July submission platform) and The ZAO. Does Dash's masternode-voted treasury map to how ZABAL funds builders? Does DashPay identity map to the builder-profile layer? What to borrow, what is a poor fit. Prioritized do-next + honest verdict."
tier: STANDARD
---

# 931 - Dash's treasury model vs ZABAL Gamez: what maps, what does not

> **Goal:** Assess Dash for ZABAL Gamez. Only one Dash feature is relevant - the community-voted
> treasury - and ZABAL already has its better-shaped cousin (the POIDH prize pot). This doc says
> what to borrow (the recurring-cycle + accountability discipline) and what to ignore (everything
> tied to Dash being a payments coin).

## Key Decisions (do these)

| # | Decision | Why |
|---|----------|-----|
| 1 | BORROW the pattern, not the tech: run the POIDH pot as a RECURRING monthly cycle. | Dash's whole value is a monthly community-funded round that pays work. ZABAL's POIDH open pot is that in miniature (anyone funds, contributors vote). Make it a named monthly cycle so it compounds. |
| 2 | Keep ZABAL's PROOF-based payout - it already fixes Dash's biggest flaw. | Dash pays proposals UP FRONT on a vote and then hopes for delivery (its docs + critics call trust/escrow the weak point). POIDH pays AFTER a proof claim the community votes on - retroactive, like Optimism RetroPGF. Do not switch to prospective grants. |
| 3 | Weight any community vote by Empire Builder reputation, not by tokens. | Dash weights votes by masternode stake (1,000 DASH). ZABAL is tokenless - the native analog to "skin in the game" is contribution reputation (Empire Builder), not coin held. |
| 4 | SKIP masternodes, InstantSend, ChainLocks, CoinJoin, Dash Platform identity. | All are payments-L1 machinery. ZABAL is tokenless on Farcaster/Base; Farcaster already provides the identity/username/social layer Dash Platform is trying to build. |
| 5 | Heed the "grants kill volunteering" warning: keep the pot a BONUS prize, not a salary. | Dash's own community documented that a grants system made people stop doing work they used to do for free. ZABAL's edge is that building is the point and the pot is a topper - protect that framing. |

## The honest verdict
**One feature maps (the treasury), and ZABAL already has a better version of it.** Dash is a payments
coin whose novelty was self-funding development from block rewards via monthly masternode votes.
ZABAL Gamez is tokenless, so there is no block reward and no masternode - the DIRECT mechanism does
not transfer. But the GOVERNANCE PATTERN - a community-funded pot the community votes to distribute
to work that helps the network - is exactly what the POIDH "ZABAL Gamez Open Pot" is. And ZABAL's
version is structurally better on the dimension Dash's own community flags as the weak point:
delivery. Everything else Dash offers (identity, instant payments, privacy, chain security) is
irrelevant to a Farcaster/Base build event.

## Findings

**What Dash is (from the docs, FULL):** a payments-focused L1 with a two-tier network. Masternodes
(1,000 DASH collateral; evonodes 4,000 DASH) power InstantSend (~2s confirmations), ChainLocks
(51%-attack protection), CoinJoin (privacy), and governance. Block reward splits 20% miners / 60%
masternodes / **20% treasury**. Dash Platform (Drive, DAPI, DashPay) adds usernames + contact-list
social features.

**The treasury (the only relevant part):** every ~30.29 days a "superblock" pays that month's
accumulated treasury to proposals that cleared a threshold - a net Yes vote greater than 10% of all
masternodes (one masternode, one vote). Self-funding, no premine, no donations.

**What Dash's own community learned (the lessons for ZABAL):**
- **Trust/delivery is the weak point.** Richard Red's review: the DAO "sends DASH to addresses based
  on a vote" but "only works if you can trust the recipient" or an escrow to check deliverables.
  Prospective funding + weak accountability = malinvestment. The 2016 forum post is blunter: big
  funded projects (PR, website, ATM) "have all been failures." ZABAL sidesteps this: POIDH pays on a
  PROOF claim, after the work, with contributors voting on the proof.
- **Grants can crowd out volunteering.** Same forum post: once a grants system exists, "no one wants
  to work unless they are getting a grant... volunteering while others get paid feels wrong." A real
  risk for a build event - keep the pot a bonus, not the reason to build.
- **Rigid monthly burn is bad.** The DAO "has no capacity to save up" and proposals compete only with
  that month's cohort, so timing decides fate. ZABAL's open pot accrues continuously (anyone can add
  anytime), which is more flexible than Dash's fixed monthly superblock.
- **Volatile-token budgeting hurts.** Dash proposals budget in USD but are paid in volatile DASH.
  ZABAL's pot is ETH - the same volatility caveat applies at small scale; keep pots short-cycle.

**Identity (question 2): a clean no.** DashPay usernames + contact lists are Dash Platform trying to
add a social/identity layer to a payments chain. ZABAL's builder-profile layer (shipped this week,
`api/submission-intake.mjs` keyed by Farcaster handle/fid, rendered at `/builder?handle=`) already
gets identity, usernames, social graph, and per-user comments FROM FARCASTER natively. Dash Platform
is solving a problem Farcaster already solved for us. No borrow.

## Comparison

| Dimension | Dash treasury DAO | ZABAL Gamez (POIDH pot) |
|-----------|-------------------|-------------------------|
| Funding source | 20% of block reward (token emission) | Community ETH contributions to an open bounty + sponsors |
| Who votes | Masternodes, weighted by 1,000-DASH stake | Contributors, weighted by contribution; could add Empire Builder reputation |
| Payout timing | Prospective (paid on vote, before work) | Retroactive (paid on a proof claim, after work) |
| Accountability | Weak - trust/escrow, documented failures | Strong - proof-of-delivery is the claim |
| Cadence | Rigid monthly superblock, cannot save | Continuous accrual; make it a named monthly cycle |
| Token required | Yes (DASH) - the whole model needs it | No - tokenless, which is the point |

## Also See
- [Doc 133](../133-governance-system-audit/) - ZAO governance audit
- [Doc 703](../703-zao-fractal-current-state-may-2026/) - ZAO Fractal current state
- [Doc 922](../../agents/922-agent-droids-zabalgamez-exponential/) - the tokenless-brand reasoning that says why ZABAL stays off a coin

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Frame the POIDH #1249 pot as a named RECURRING monthly cycle (July pot, Aug pot) on the submission platform | @Zaal | Product | July |
| Add Empire Builder reputation as an optional vote weight for community-funded rounds (tokenless stake analog) | @Zaal | Spec | August |
| Keep payout PROOF-based (POIDH claim + contributor vote); do NOT adopt Dash-style prospective grants | @Zaal | Decision | Standing |
| Message the pot as a bonus prize on top of building, not a salary (avoid the crowd-out-volunteering trap) | @Zaal | Copy | With the July push |

## Sources
- Dash docs - Features (InstantSend, ChainLocks, masternodes, treasury, Platform, CoinJoin; the numbers) - https://docs.dash.org/en/stable/docs/user/introduction/features.html [FULL]
- Richard Red - Observations of the Dash Treasury DAO (trust/escrow weak point, monthly-superblock limits, USD-vs-DASH budgeting) - https://richardred.medium.com/observations-of-the-dash-treasury-dao-c94231b2b5c4 [FULL]
- Crypto Commons - Dash governance (superblock every 16,616 blocks / ~30.29 days, 10% threshold, cohort competition, bull-market proposal spam) - https://cryptocommons.cc/governance/dash/ [FULL]
- Dash forum - "I sold all my Dash" (community critique: grants crowd out volunteering; funded projects failed) - https://www.dash.org/forum/index.php?threads/i-sold-all-my-dash-here-is-why-and-my-view-on-the-state-of-dash.11416/ [PARTIAL - opening post + one reply read via search highlights; full thread not paged, but the cited claims are from the read text]
- arXiv - Perils of current DAO governance (vote buying, low turnout, centralisation - general DAO-voting caveats) - https://arxiv.org/html/2406.08605v1 [PARTIAL - abstract/intro only]
