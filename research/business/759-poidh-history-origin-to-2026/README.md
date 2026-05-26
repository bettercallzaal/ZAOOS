---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-26
related-docs: 415, 468, 533, 625, 626, 627, 628, 629, 631, 757
original-query: "POIDH history - origin story, founders, milestones, timeline, evolution from v1 to v3, who built it, key moments, current state. STANDARD tier."
tier: STANDARD
---

# 759 - POIDH history: origin (2023) to v3 rebuild (2026)

> **Goal:** Single canonical timeline of POIDH from Kenny's Nov 2023 "about" post through the Apr 2024 official launch, the May 2024 multiplayer v2, the Onchain Summer Buildathon multichain rollout, the Sep 2025 $30K Guinness kickflip moment, and the Jan 2026 v3 security-focused rebuild. Founders, contributors, key bounties, growth numbers, and the SEO-consultant-with-FTX-frustration backstory that started it all.

## Key Decisions / Recommendations (read these first)

| Decision | Recommendation |
|----------|----------------|
| **Treat POIDH as a long-term partner, not a fad** | Project is 2.5 years old (Nov 2023 founding -> May 2026 today), 1,992 commits, 24 GitHub contributors, MIT-licensed, currently in third major version. Build deeper integrations (Sentinel fork - doc 757) without partner-risk concerns. |
| **Use Kenny's actual founding pitch in BCZ copy** | The pitch that converts crypto skeptics is the one Kenny wrote in 2023: "use cases you can show to family that aren't gambling." Reuse this framing in /poidh.html hero, Round 3 bounty copy, and any BCZ + POIDH co-marketing. Source = his own 2023 "about" post. |
| **The Haberdashery is the meta-bounty role model** | Sep 2025 kickflip bounty (3.3M DEGEN, 1/3 of $30K pot, broke a Guinness World Record, 100K+ views) is the template for ZAO + Empire Builder co-funded bounties. Apply the same pattern to a ZABAL Games meta-bounty. |
| **Skip a "ZAO-Sentinel competes with poidh-sentinel" framing** | poidh-sentinel was built by 0x94t3z (Indonesian dev, MIT, Vercel free-tier) for the official POIDH SKILL challenge. Fork it with attribution + courtesy DM (doc 631 Tier-S move), not as a competitor. |
| **POIDH FID 6 + Kenny's 75K Farcaster followers = network access** | Kenny has been on Farcaster since FID-6-era (Nov 7, 2023) with 75,545 followers. Co-branded posts get distribution. BCZ YapZ Ep 19 (May 2026) already converted - keep him in the loop on every round. |
| **Skip building a competing bounty protocol** | 1,565 bounties have settled across Arbitrum + Base + Degen. The protocol is mature, multichain, audited (v3 in progress), and free for BCZ to use. There is zero reason to build something parallel. |
| **Treat v3 as a known unknown** | poidh-v3 repo (2026-01-13) is a "security-focused rebuild" - active Solidity work in Jan-Feb 2026, no release yet. Watch for v3 deployment date - migration may require BCZ's apiLeaderboard URL to be updated. |

---

## Part 1 - The founding (Nov 2023)

### Day 0

**2023-11-07** - Kenny publishes the "[about pics or it didn't happen](https://words.poidh.xyz/about-pics-or-it-didnt-happen)" post on Paragraph (`words.poidh.xyz`). The same day, his Farcaster account `@kenny` is created (FID 6 - one of the earliest-ever Farcaster handles). He is based in **Seattle, Washington**, and his day job is **SEO consultant** (confirmed by Decrypt interview, Sep 2025).

The post lays out the entire thesis still in force today:

> "The clearest untapped opportunity in crypto is finding a way to seamlessly bring offchain information onchain. Currently, this job tends to be done via clumsy oracles or trusted, centralized solutions. The poidh app's lightweight, standardized method for confirming offchain actions via bounties is a better approach."

Three design pillars he commits to in this post:

1. **Generalist, not vertical.** Equal support for "a $500 design contest" and "a $5 bounty for a selfie."
2. **Collectible NFTs as the wild card.** Visual proof-of-work minted as an NFT = elegant fraud prevention + creator incentive.
3. **Casual UX.** "Create a bounty by filling out three form fields and completing a single transaction" - as easy as Twitter post.

### The acronym

"Pics or it didn't happen" is a 2000s internet forum meme. Kenny confirmed in BCZ YapZ Ep 19 (2026-05-06) that the acronym pre-dates the protocol by ~20 years.

### The motivating frustration

Per Kenny on BCZ YapZ Ep 19 and the Decrypt interview (Sep 2025):

> "We're never going to have good adoption if all our use cases are speculative gambling use cases."

Trigger event = **FTX collapse, November 2022**. One year later, on the anniversary, Kenny posts the "about" essay and starts building.

---

## Part 2 - The v1 -> v2 -> v3 contract timeline

### v1 (private, late 2023)

There is no `poidh-v1-contracts` public repo. The first GitHub repo under `picsoritdidnthappen` is named `poidh-v2-contracts` and was created **2023-12-03**. This implies v1 was either:
- A private prototype Kenny built solo before publishing source, OR
- Internal naming where the public release was always called v2.

Per Kenny's "[poidh v2](https://words.poidh.xyz/poidh-v2)" post (**2024-01-02**), v1 was real and shipped: "While poidh v1 focused on 1-on-1 bounties, we've always discussed that the plan with v2 was to introduce multiplayer features."

So v1 supported **solo bounties only** - single creator, single claimer, single decision-maker. This was the entire protocol from launch through April 2024.

### v2 (2024)

The `poidh-v2-contracts` repo (Solidity, **created 2023-12-03**, last pushed **2024-05-14**) holds the v2 smart contracts. v2 introduced:
- **Open / multiplayer bounties** - anyone can add funds to an existing bounty
- **Contributor-weighted voting** - contributors get voting rights proportional to their contribution
- **Multi-chain deployment** - shipped first on Degen Chain, then Base + Arbitrum
- **Frame v2 (Farcaster mini-app)** - `poidh-frame` repo created **2024-05-07**

The "[how poidh v2 open bounties work](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained)" post (**2024-05-08**) is the canonical v2 release announcement.

### v3 (in progress, 2026)

Per `docs.poidh.xyz`: "v3 is a **security-focused rebuild** of the POIDH v2 bounty contracts."

The `poidh-v3` repo was created **2026-01-13**, last pushed **2026-02-18**. Solidity, no license declared yet (NOASSERTION).

v3 architectural improvements per the docs:
- **Bounty Manager + Claim Manager + Voting Engine + Pull Payment + NFT Escrow** as separate concerns
- **State machine**: Active -> Claimed -> Voting -> Accepted/Rejected
- **Pull payments** (winners call `withdrawPayments()` instead of auto-push)
- **EOA-only creation** (smart contract wallets revert with `ContractsCannotCreateBounties()`)
- **2.5% protocol fee** + **5% NFT royalty suggested** baked in

No public release date as of 2026-05-26. Watch for deploy.

---

## Part 3 - The team (who actually built it)

### Founders

Per the [poidh beginner guide](https://words.poidh.xyz/poidh-beginner-guide) (**2024-08-31**):

> "poidh was built by [warpcast.com/kenny](https://warpcast.com/kenny) and [github.com/Rhovian](https://github.com/Rhovian)"

| Founder | Role | Receipts |
|---------|------|----------|
| **Kenny** | Vision, product, ongoing development | `@kenny` on Farcaster (FID 6, 75,545 followers, joined Nov 7, 2023). `@kennyistyping` on X. GitHub `picsoritdidnthappen` (1,002 commits to poidh-app - 50% of all commits). Wallet `0x10fc964ef70c8467cd8c53e9ed9347422adf96a8`. Based Seattle, WA. SEO consultant by day. Member of The Haberdashery. |
| **Rhovian** | Codebase architect, initial development | `github.com/Rhovian`. First commit on poidh-app **2024-02-04** ("feat(init): init"). 48 commits total (set up the codebase, less long-term involvement). |

### Other notable contributors (poidh-app, top 10)

| Contributor | Commits | Notes |
|-------------|---------|-------|
| picsoritdidnthappen (Kenny) | 1,002 | 50% of all commits |
| whtsupbab3 | 337 | #2 contributor, ongoing |
| yukigesho | 224 | #3 |
| gayatrigt | 84 | |
| gabrieltemtsen | 63 | Onchain Summer collaborator |
| hostgsr | 52 | |
| ie2173 | 51 | |
| Rhovian | 48 | Co-founder, codebase init |
| defichopper | 24 | |
| aTreeFrog | 21 | |

24 total contributors across the lifetime of the repo.

### Adjacent contacts

| Handle | Role |
|--------|------|
| `@kaspotz` (Twitter) | Listed as primary Twitter contact in v2 announcement post - either Kenny alt or close collaborator |
| **The Haberdashery** | Independent group of Degen token holders Kenny is a member of. Funded the $30K Guinness kickflip bounty. |

---

## Part 4 - The lifetime timeline (every dated milestone)

| Date | Event |
|------|-------|
| 2022-11 | FTX collapse - Kenny's stated motivation |
| **2023-11-07** | Kenny publishes "[about pics or it didn't happen](https://words.poidh.xyz/about-pics-or-it-didnt-happen)" on Paragraph; joins Farcaster as `@kenny` (FID 6) |
| 2023-12-03 | `poidh-v2-contracts` GitHub repo created (Solidity) |
| **2024-01-02** | "[poidh v2](https://words.poidh.xyz/poidh-v2)" planning post by Kenny |
| 2024-01-09 | `poidh-app` GitHub repo created (Next.js + TypeScript, MIT) |
| 2024-02-04 | First poidh-app commit by Rhovian: "feat(init): init" |
| **2024-04-24** | **OFFICIAL LAUNCH DATE** (per Gitcoin Grants Round 30 proposal, Mar 2026) - first deployment on Degen Chain |
| 2024-05-07 | `poidh-frame` repo created (Farcaster Frame integration) |
| 2024-05-08 | "[how poidh v2 open bounties work](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained)" - multiplayer launch announcement |
| 2024-05-14 | Last push to `poidh-v2-contracts` (suggesting contracts stabilized) |
| 2024-06-27 | Onchain Summer Buildathon submission on Devfolio - app now multichain (Base + Arbitrum added to Degen) |
| **2024-08-31** | [Beginner guide](https://words.poidh.xyz/poidh-beginner-guide) published - team attribution made public |
| 2025-09-28 | **Kickflip Guinness bounty hits $28K** ([Decrypt](https://www.jfsky.com/article/kickflips-for-crypto-project-pay-28k-guinness-world-record)) - Haberdashery funds 3.3M Degen (1/3 of pot) |
| Sep 2025 | $30K Haberdashery kickflip bounty breaks Guinness World Record, 100K+ social views |
| 2025-11-14 | "[poidh: the most seamless Freecash alternative](https://words.poidh.xyz/poidh-seamless-freecash-alternative)" - positioning pivot toward the "earn-onchain" audience |
| **2026-01-13** | `poidh-v3` repo created (Solidity rebuild, security-focused) |
| 2026-02-11 | Kenny creates `wei-names` (alt ENS-style namespace, tangential) |
| 2026-02-18 | Last push to `poidh-v3` (still active dev) |
| 2026-03-06 | POIDH submitted to **Gitcoin Grants Round 30** (issue #227) - "Launched in Spring 2024, $65K distributed, 3 chains" |
| 2026-04-27 | First BCZ POIDH bounty (1151, BCZ YapZ Ep 17 / Hannah / Farm Drop) live |
| **2026-05-06** | **BCZ YapZ Ep 19 with Kenny published** - 25-min interview, POIDH framework for ad bounties laid out |
| 2026-05-22 | BCZ POIDH Round 2 (bounty 1166 - Best 60s POIDH ad from Ep 19 w/ Kenny) closes with 8 submissions |
| 2026-05-26 | This doc written (BCZ Round 2 judging page live, ffprobe durations resolved) |

---

## Part 5 - Specific numbers (current as of 2025-12-09 / 2026-05-26)

### Lifetime platform stats (per [Dune dashboard](https://dune.com/yesyes/poidh-pics-or-it-didnt-happen))

| Metric | Value | Source |
|--------|-------|--------|
| Total users | **3,474** | Dune (Dec 9, 2025) |
| Total bounties created | **2,863** | Dune (Dec 9, 2025) |
| Total bounties completed | **1,565** | Dune (Dec 9, 2025) |
| Completion rate | **~55%** | Dune |
| Lifetime funding distributed | **~$65,000** | Gitcoin Grants proposal (Mar 2026) |
| Chains supported | **3** (Arbitrum, Base, Degen) | All sources |

### Per-chain split

| Chain | Users | Bounties Created | Bounties Completed | Notes |
|-------|-------|------------------|--------------------|-------|
| Degen | 1,555 | 1,197 | 678 | First chain (Apr 2024), DEGEN-denominated |
| Base | 1,940 | 986 | 497 | ~4.16 ETH cumulative escrowed |
| Arbitrum | 639 | 676 | 390 | ~0.66 ETH TVL ($2,240) |

### Protocol economics

| Metric | Value |
|--------|-------|
| Protocol fee | 2.5% on accepted bounties |
| NFT royalty (suggested) | 5% on resales |
| Min bounty (Arbitrum/Base) | 0.001 ETH |
| Min bounty (Degen) | 1,000 DEGEN |
| Min contribution (open, Arbitrum/Base) | 0.00001 ETH |
| Min contribution (open, Degen) | 10 DEGEN |
| Vote threshold (open) | >50% of contributing weight |
| Largest single bounty (lifetime) | $30K (Sep 2025 kickflip, funded by The Haberdashery + crowd) |

### Repo health

| Repo | Created | Last push | Stars | Forks | Commits | Lang | License |
|------|---------|-----------|-------|-------|---------|------|---------|
| poidh-app | 2024-01-09 | 2026-05-20 | 32 | **53** | 1,992 | TypeScript | MIT |
| poidh-v2-contracts | 2023-12-03 | 2024-05-14 | 2 | - | - | Solidity | - |
| poidh-frame | 2024-05-07 | - | 1 | - | - | - | - |
| poidh-v3 | 2026-01-13 | 2026-02-18 | 0 | - | - | Solidity | NOASSERTION |

**More forks (53) than stars (32)** is unusual - indicates active community building on top of POIDH rather than just admiring it. Fits Kenny's "AI agent compatible" + "open protocol" positioning.

---

## Part 6 - The cultural moments (what people remember)

These are the bounties / events that put POIDH on the map:

### 1. Jesse Pollak adds 0.25 ETH to a $5 bounty (Base)

Reference: [bounty 906 on Base](https://poidh.xyz/base/bounty/906). The Coinbase / Base lead casually tossed 0.25 ETH into a small open bounty, triggering "a wave of submissions and social engagement" (per the POIDH team's own Gitcoin proposal). Established that POIDH's open bounty mechanic IS its viral loop.

### 2. The Haberdashery kickflip bounty (Sep 2025)

[Bounty 1167 on Degen Chain](https://poidh.xyz/degen/bounty/1167) - "do more than 36 kickflips on a skateboard in 60 seconds, break the Guinness World Record."

- $30K peak pot value (3.3M DEGEN + ETH contributions)
- The Haberdashery (a Degen-holder group Kenny belongs to) funded 1/3
- Result: **Guinness World Record actually broken**
- 100K+ social views, [covered by Decrypt](https://www.jfsky.com/article/kickflips-for-crypto-project-pay-28k-guinness-world-record)
- Pattern: large open bounty + crypto-native donor coalition + IRL stunt + media pickup

### 3. The "rat hotspot" bounty (NY)

Referenced in Decrypt article. Local civic improvement bounty - someone paid for proof of where NYC's worst rat zones are. Showcases the "POIDH for public goods" angle Kenny pitched in his 2023 founding essay.

### 4. Multichain ship sprint (Onchain Summer 2024)

Per Devfolio submission: "It was a sprint to the finish to get [POIDH] launched on Base in time for onchain summer... I had to coordinate 6 different open-source contributors to get the project across the finish line." Established the open-source contributor flywheel.

### 5. BCZ YapZ Ep 19 (May 2026) - the ZAO entry point

Kenny on BCZ YapZ explaining the framework. This is the source episode for BCZ POIDH Round 2 (bounty 1166), the first cross-pollination between ZAO + POIDH at the operations layer. [YouTube link](https://www.youtube.com/watch?v=IFG_34K7Vig).

---

## Part 7 - Why this matters for ZAO (the strategic frame)

POIDH's history tells a coherent story Zaal can mirror in his own pitch:

1. **2.5 years of building before noise** - Kenny started solo in Nov 2023 and didn't get mainstream-crypto-media coverage until the Sep 2025 kickflip moment. ZAO has been building since 2023 too. Compounding > virality.

2. **The protocol IS the product** - Kenny doesn't have a marketing team. The protocol's mechanics (open bounty + NFT proof + Frame distribution) carry the brand. Mirror for ZAO: invest in mechanics (Fractal Mondays, ZABAL Empire, POIDH bounties) more than marketing.

3. **One handle, one channel, one site** - `@kenny` on Farcaster, `/poidh` channel, `poidh.xyz`. No DAO infrastructure, no 10 bots, no metaverse. Zaal's "5 surfaces" decision (per doc 601) matches Kenny's discipline.

4. **Co-funded bounties beat solo bounties** - The Haberdashery kickflip moment was POIDH's biggest. The model is exactly what BCZ + Empire Builder + ZAO Fractal can replicate: ZAO funds 1/3, Empire Builder treasury 1/3, community 1/3 of a Round-N meta-bounty.

5. **AI agents are POIDH-compatible by design** - Kenny himself flagged this in the Gitcoin proposal: "Agents can propose bounties and select claims while humans maintain verification control." This is the canonical hook for the @zao-sentinel fork (doc 757).

---

## ZAO Ecosystem Integration

Codebase touchpoints:
- `/Users/zaalpanthaki/Documents/BetterCallZaal/poidh.html` - BCZ leaderboard hub (slot 8 of $ZABAL Empire)
- `/Users/zaalpanthaki/Documents/BetterCallZaal/scripts/refresh-poidh-leaderboard.py` - tRPC scraper for poidh.xyz, defaults to [1151, 1166]
- `/Users/zaalpanthaki/Documents/BetterCallZaal/poidh-round2-judging.html` - Round 2 judging page (live)
- `community.config.ts` (ZAO OS) - implicit POIDH album URL reference
- `bots/poidh/` (per doc 468 spec) - the bot architecture POIDH-Sentinel pre-empted

Related docs:
- Doc 415 - POIDH bounties / WaveWarZ early integration ideas
- Doc 468 - POIDH Farcaster bot architecture (pre-empted by Sentinel)
- Doc 533 - POIDH clip-up bounty for BCZ YapZ (Hannah ep)
- Doc 625 - POIDH x ZAO operational playbook (18 templates)
- Doc 626 - Empire Builder + ZABAL POIDH airdrop architecture
- Doc 627 - $ZABAL Empire ground truth + EB v3 capabilities
- Doc 628 - Bounty-writing learnings (Kenny's POIDH framework)
- Doc 629 - Live leaderboard data architecture
- Doc 631 - POIDH x $ZABAL x Sentinel convergence map
- Doc 757 - poidh-sentinel fork surface for @zao-sentinel

---

## Sources

- [FULL] [about pics or it didn't happen (Kenny, 2023-11-07)](https://words.poidh.xyz/about-pics-or-it-didnt-happen) - founding essay, full text retrieved via exa
- [FULL] [poidh v2 planning post (Kenny, 2024-01-02)](https://words.poidh.xyz/poidh-v2) - v1->v2 plan
- [FULL] [how poidh v2 "open" bounties work (Kenny, 2024-05-08)](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained) - multiplayer launch
- [FULL] [poidh beginner guide (2024-08-31)](https://words.poidh.xyz/poidh-beginner-guide) - team attribution
- [FULL] [poidh: the most seamless Freecash alternative (Kenny, 2025-11-14)](https://words.poidh.xyz/poidh-seamless-freecash-alternative) - positioning pivot
- [FULL] [GitHub - picsoritdidnthappen org](https://github.com/picsoritdidnthappen) - 5 repos, retrieved via `gh api` (poidh-app, poidh-v2-contracts, poidh-frame, poidh-v3, wei-names)
- [FULL] [poidh-app repo metadata](https://github.com/picsoritdidnthappen/poidh-app) - created 2024-01-09, 1,992 commits, MIT, retrieved via `gh api`
- [FULL] [poidh-app contributors list](https://github.com/picsoritdidnthappen/poidh-app/graphs/contributors) - 24 contributors, top 10 commit counts via `gh api repos/.../contributors`
- [FULL] [POIDH Dune dashboard by @yesyes](https://dune.com/yesyes/poidh-pics-or-it-didnt-happen) - 3,474 users, 2,863 bounties, chain split (retrieved 2025-12-09)
- [FULL] [Decrypt: Kickflips for Crypto - $28K Guinness Bounty (Sep 2025)](https://www.jfsky.com/article/kickflips-for-crypto-project-pay-28k-guinness-world-record) - Kenny interview, FTX motivation, SEO consultant detail, Haberdashery role
- [FULL] [Gitcoin Grants Round 30 proposal (Issue #227, Mar 2026)](https://github.com/gitcoinco/gitcoin_co_30/issues/227) - "Launched Spring 2024, $65K distributed, 3 chains, Jesse Pollak moment"
- [FULL] [Devfolio Onchain Summer Buildathon submission (Jun 2024)](https://devfolio.co/projects/pics-or-it-didnt-happen-poidh-764a) - multichain ship sprint story
- [FULL] [kenny on Farcaster](https://farcaster.xyz/kenny) - "social bounties to program reality"
- [FULL] [kenny Web3.bio profile](https://web3.bio/kenny.farcaster) - FID 6, joined 2023-11-07, 75,545 followers, Seattle, wallet `0x10fc...96a8`
- [PARTIAL] [poidh Paragraph publication landing](https://words.poidh.xyz/) - landing page found via exa (subscribers 400+, 22 posts) but post listing not enumerable from page HTML (paginates via JS). Individual post URLs found via search instead.
- [FULL] [BCZ YapZ Ep 19 with Kenny (Zaal, 2026-05-06)](https://www.youtube.com/watch?v=IFG_34K7Vig) - 25-min interview, POIDH framework, "use cases for family" pitch verbatim
- [FAILED - 404] `https://words.poidh.xyz/poidh-v2-an-overview` - URL pattern guessed, returned 404. The actual v2 overview lives at the open-bounties-explained URL above.

Cross-repo search: skipped (POIDH is not a `bettercallzaal` org pattern, search not applicable).

Verified URLs 2026-05-26: All `gh api` calls returned 200 with current data. words.poidh.xyz returned 200. Dune dashboard returned current data. Decrypt mirror at jfsky.com returned full article. Devfolio submission returned 200.

---

## Also See

- [Doc 757 - poidh-sentinel fork surface for @zao-sentinel](../../agents/757-poidh-sentinel-fork-surface-zao-sentinel/) - the fork plan that uses POIDH's history as its credibility footing
- [Doc 631 - POIDH x $ZABAL x Sentinel convergence map](../631-poidh-zabal-sentinel-convergence/) - strategic frame for ZAO using POIDH as back-end coordination layer
- [Doc 625 - POIDH x ZAO operational playbook](../../community/625-poidh-zao-bounty-playbook/) - 18 bounty templates built on this protocol's mechanics
- [Doc 626 - Empire Builder + ZABAL POIDH airdrop architecture](../626-empire-builder-zabal-poidh-airdrop/) - the apiLeaderboard wiring
- [Doc 628 - Bounty-writing + integration learnings from Kenny](../628-bounty-writing-integration-learnings/) - Kenny's framework distilled
- Tracker task `pr-auto:13` (todo, due 2026-05-28) - BCZ POIDH refresh PR test plan
- Tracker task `pr-auto:14` (todo, due 2026-05-29) - BCZ POIDH Round 2 overnight PR test plan

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Cite Kenny's "use cases to show family" framing verbatim in BCZ Round 3 bounty copy | @Zaal | Bounty draft | Before Round 3 launch |
| Mention POIDH's 2.5-year track record + 3,474 users + 1,565 completed bounties in any ZABAL Empire onboarding copy (validates partner choice) | @Zaal | nexus.html + poidh.html copy | Next BCZ deploy |
| Add a "Why POIDH" section to /poidh.html quoting the 2023 founding essay (gives the hub gravitas) | @Zaal | poidh.html edit | Within 7 days |
| Monitor `poidh-v3` repo for release; when v3 contracts deploy to Base, update BCZ `scripts/refresh-poidh-leaderboard.py` if contract address changes | @Zaal / @ClaudeBot | Recurring check | Bi-weekly until v3 lands |
| When meta-bounty pattern hits (per doc 631 Tier B #8 ZABAL Games hackathon), invite The Haberdashery to co-fund - mention their kickflip precedent | @Zaal | Outreach | After Round 3 close |
| Re-validate this doc in 30 days (POIDH user count + v3 release status) | @Zaal | Doc update | 2026-06-25 |
