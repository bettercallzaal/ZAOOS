---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-26
related-docs: 415, 468, 533, 625, 626, 627, 628, 629, 631, 757
original-query: "POIDH history - origin story, founders, milestones, timeline, evolution from v1 to v3, who built it, key moments, current state. STANDARD tier."
tier: STANDARD
revisions:
  - "2026-05-26 rev2 - Added Parts 8-12 covering pre-POIDH Kenny (Bitcoin Magazine 2014, food truck era, SEO consulting). CORRECTED two claims: (1) The Haberdashery is the DegenDAO grants council founded by PurpLetariat + wake, NOT a Kenny-led group - Kenny is a member + /degen channel co-host. (2) @kaspotz on Twitter IS Kenny's old handle (real name = Kenny Spotz), NOT a co-founder. The actual co-founder is 'J' - identity still unconfirmed."
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

### Founders (corrected 2026-05-26 rev2)

Three distinct team eras, often conflated:

**Era 1: Kenny + J (pre-Nov 2023 -> Feb 2024) - the v1 era.**

Per Kenny's own [2023-11-03 "poidh needs design help"](https://words.poidh.xyz/poidh-needs-design-help) post, "When **J and I** set out to build poidh." The v1 contract on Arbitrum (`0xdffe8a4a4103f968ffd61fd082d08c41dcf9b940`) was deployed by this two-person team. J's full identity is not publicly disclosed in any source found - the initial "J" is used consistently across the early posts.

**Era 2: Kenny + Rhovian (Feb 2024 -> present) - the v2 codebase.**

The [poidh beginner guide](https://words.poidh.xyz/poidh-beginner-guide) (2024-08-31) attribution: "poidh was built by [warpcast.com/kenny](https://warpcast.com/kenny) and [github.com/Rhovian](https://github.com/Rhovian)". This refers to the Next.js codebase Rhovian initialized on **2024-02-04** with commit "feat(init): init". J appears to have stepped back by this point.

**Era 3: Kenny + 24 open-source contributors (Summer 2024 -> present).**

The Devfolio Onchain Summer Buildathon submission (Jun 2024): "I had to coordinate 6 different open-source contributors to get the project across the finish line." Has scaled to 24 contributors per `gh api repos/.../contributors`.

| Person | Era | Role | Receipts |
|--------|-----|------|----------|
| **Kenny (Kenny Spotz)** | All eras | Vision, product, ongoing dev | Real name = Kenny Spotz (confirmed via Bitcoin Magazine 2014 byline). `@kenny` on Farcaster (FID 6, 75,545 followers, joined 2023-11-07). `@kennyistyping` on X (current). `@kaspotz` on X (LEGACY handle - same person, used through 2023). GitHub: `picsoritdidnthappen` (1,002 commits = 50% of poidh-app). Wallet `0x10fc964ef70c8467cd8c53e9ed9347422adf96a8`. Based Seattle, WA. SEO consultant; full-time crypto since 2022. Co-host of /degen Farcaster channel. Member of The Haberdashery. |
| **"J"** | Era 1 (v1) | Co-founder, identity unconfirmed | Per 2023-11-03 post: "J and I set out to build poidh." No public surname / handle / wallet attribution found in any source. Appears to have stepped back before the v2 codebase init in Feb 2024. Open research question - DM Kenny if his identity matters for ZAO collaboration. |
| **Rhovian** | Era 2 (v2 codebase) | Codebase architect, init | `github.com/Rhovian`. First poidh-app commit 2024-02-04. 48 commits total. Started the Next.js codebase; less long-term involvement. |

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

### Adjacent contacts (corrected 2026-05-26)

| Handle | Role |
|--------|------|
| `@kaspotz` (Twitter) | **= Kenny himself.** Old X handle, derived from his real name (Kenny Spotz). Bitcoin Magazine bylines 2014 use it. Author bio: "Kenny is a freelance writer specializing in cryptocurrency and can be found on Twitter @kaspotz." Later migrated to `@kennyistyping`. NOT a separate person. |
| **The Haberdashery** | Official/unofficial DegenDAO grants council, founded by **PurpLetariat (Purp)** and **wake**. Kenny is a MEMBER not the founder. Funded 1/3 of the $30K kickflip pot. Acts as "grants council, culture leads, and some of the strongest voices in the [Degen] community" (per [sgt_slaughtermelon Mirror article](https://mirror.xyz/sgtslaughtermelon.eth/D3YdzE4JY8Yb44vCYWxSzUeVY6N-MMYasvLswujhfy4)). |
| `@poidhxyz` (X) + `poidhxyz@gmail.com` | Primary public POIDH support channels |

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

---

## Part 8 - Pre-POIDH Kenny (2013 - 2023): 10 years before the launch

POIDH was not a sudden idea. Kenny was a **crypto journalist + early Bitcoin user since 2013**. Full timeline:

### 2013: The food truck era

Per Kenny on BCZ YapZ Ep 19: "Had a food truck that took Bitcoin back in 2013 era."

The Seattle-area "Cheese Wizards" grilled-cheese food truck began accepting Bitcoin in **October 2013** ([GeekWire coverage](https://www.geekwire.com/2013/seattle-foodtruck-bitcoin-accept-payments-grilled-cheese-sandwiches/), 2013-10-14). Cheese Wizards was run by the Saxbe brothers (Bo + Tom). Kenny's claim of "had a food truck" may be a loose reference to the Seattle Bitcoin food truck scene he was around, or a separate truck not surfaced in public records. Cite both: Cheese Wizards as the documented 2013 Seattle Bitcoin food truck, and Kenny's own claim of having had one.

### 2014: Bitcoin Magazine staff writer

[Kenny Spotz author page on Bitcoin Magazine](https://bitcoinmagazine.com/authors/kenny-spotz) shows 7+ articles in 2014 alone:

| Date | Title | Category |
|------|-------|----------|
| 2014-04-29 | (untitled in archive) | CULTURE |
| 2014-05-20 | [An Interview With Coinme, The Company Behind Seattle's First Bitcoin ATM](https://bitcoinmagazine.com/business/interview-coinme-company-behind-seattles-first-bitcoin-atm-1400536862) | BUSINESS |
| 2014-05-28 | [Bitcoin in the Twenty-First Century: What Piketty Can Learn From The Blockchain](https://bitcoinmagazine.com/culture/bitcoin-piketty-in-the-twenty-first-century-what-blockchain-technology-can-do-to-curb-inequality-1401258612) | CULTURE |
| 2014-06-23 | (BUSINESS piece) | BUSINESS |
| 2014-07-26 | (CULTURE piece) | CULTURE |
| 2014-08-29 | (CULTURE piece) | CULTURE |
| 2014-10-11 | Coinme Brings Bitcoin to the University of Washington | CULTURE |

Author bio across all 2014 articles: "Kenny is a freelance writer specializing in cryptocurrency and can be found on Twitter @kaspotz. He also operates cryptocurrencyposters.com."

### 2014 - 2019: Continued crypto writing

Per the [Real Finance Guy guest post (2019-01-05)](https://www.realfinanceguy.com/home/2019/1/5/lessons-from-a-real-bear-market-in-crypto), Kenny's bio expanded: "Kenny has written about cryptocurrency for **Bitcoin Magazine, CoinTelegraph, and VICE Motherboard**. He is a digital marketer by trade. His current favorite side project is **CryptocurrencyPosters.com**."

The 2019 RFG post is the bridge document - written as a "crypto veteran from 2013" reflecting on the 2017-2018 bear market. Establishes Kenny was actively in the space across multiple crypto cycles.

### 2017: DeFi summer / ICO season participation

Per Kenny on BCZ YapZ Ep 19: "Participated in DeFi summer, the ICO season back in 2017." Not a builder yet in this era - participant + observer + writer.

### Late 2010s -> 2022: SEO consulting (still in crypto)

Kenny describes his progression in BCZ YapZ Ep 19:
- "Digital marketer by trade. I do SEO. I generally do SEO for crypto clients."
- "I was doing that in the late 2010s and I went full-time into crypto around 2022."
- "That's when I started specializing doing crypto for SEO for crypto companies and then also when I started building POI."

So 2022 = the inflection point. He left SEO-as-side-gig and went full-time crypto. Started building POIDH ~12 months later (Oct/Nov 2023).

### 2022-11: FTX collapse - the trigger

Per Decrypt interview (Sep 2025): "FTX's high-profile collapse in 2022 left him frustrated" with the speculative direction of the industry. This was the proximate cause for building POIDH - "use cases I can show to my friends and family and be proud of."

---

## Part 9 - The Haberdashery + the /degen Channel ecosystem (corrected)

I had this wrong in rev1. The Haberdashery is **the official/unofficial DegenDAO** - a Degen-token-holder community NOT a Kenny project. Kenny is a *member* and one of multiple voices.

### The /degen Farcaster channel co-hosts

Per [Folklore's $DEGEN Archives (2024-03-30)](https://paragraph.com/@folklore-2/the-degen-archives):

> "The Original /degen Farcaster channel: You'll find most $DEGEN activity here... This channel is hosted by **0xen, kenny, wake, purp, pedrowww, and Jacek** himself."

So **Kenny is one of 6 co-hosts of the /degen channel** alongside Jacek (Degen founder), Purp (Haberdashery co-founder), wake, 0xen, and pedrowww. This puts Kenny inside the Degen inner circle, which explains:
- Why POIDH was launched on Degen Chain first
- Why The Haberdashery (DegenDAO) co-funded the Sep 2025 kickflip bounty
- Why /degen + /poidh communities overlap

### The Haberdashery founding (corrected attribution)

Per [sgt_slaughtermelon's Mirror post](https://mirror.xyz/sgtslaughtermelon.eth/D3YdzE4JY8Yb44vCYWxSzUeVY6N-MMYasvLswujhfy4):

> "PurpLetariat, a longtime ghoul holder and general chat frequenter put out a message on Warpcast asking if anyone would make some new NFTs for the $DEGEN DAO that he helped found... So we [sgt_slaughtermelon + Tartaria Archivist] started making hats."

Attribution:
- **PurpLetariat (Purp)** + **wake** = co-founded the DegenDAO that became The Haberdashery
- **sgt_slaughtermelon + Tartaria Archivist** = designed the hat NFTs that became the Haberdashery's iconography
- **Kenny** = member, /degen channel co-host, contributor

The Haberdashery acts as the DegenDAO's grants council + culture lead. Their kickflip funding ($30K via 3.3M DEGEN) was a textbook DAO grant - not a personal Kenny pledge.

### Haberdashery's Farcaster footprint

Per Web3.bio: `@thehaberdashery` on Farcaster active since **May 26, 2024**, 2,669 followers. Bio: "A crowdfunded DAO deploying funds to builders scaling the Base ecosystem. General updates: /degendao. Proposals: /haberdash-props. Voting: /haberdash-vote."

So they have a proper governance setup with 3 dedicated Farcaster channels for general updates, proposals, and voting. Pattern to study for ZAO Fractal v2.

---

## Part 10 - The Maceo connection (how Zaal + Kenny converge)

The reason Zaal's POIDH bounties live under the `wethemmedia` album traces back to **Maceo Whatley**.

### Maceo Whatley

| Field | Value |
|-------|-------|
| Real name | Maceo Whatley |
| Farcaster | `@wethemniggas.eth` (active since Mar 28, 2024) |
| Lens | `wethemniggas.lens` (active since Nov 3, 2022 - older than his Farcaster) |
| X | `@maceo_whatley` |
| Website | `wethem.xyz` + `linktr.ee/wethemmedia` |
| Wallet | `0xf143db60a0b1cbb8076b786eb6635b93f18db744` |
| Bio | "Founder @wethemmedia, a God dream." / "Founder of We Them Niggas - a music collective centering bipoc artists from around the world." |

### Maceo's role in POIDH origin

Per BCZ YapZ Ep 19 description: "Kenny... got introduced through **Maceo on Let's Talk About Eth**."

So Maceo hosts (or co-hosts) the **Let's Talk About Eth** podcast, where Kenny was a guest. That episode is the moment Kenny got introduced to the Farcaster/Ethereum-cultural ecosystem he now operates in.

### Why /wethemmedia hosts BCZ POIDH bounties

The album field on BCZ's POIDH bounties 1151 and 1166 is "wethemmedia" because **Zaal and Maceo's music collectives overlap** (We Them Media = bipoc-centered music collective; ZAO = music community). Maceo runs the /wethemmedia Farcaster channel, and Kenny actively posts there ("$500 in Base ETH by filming your pizza day experience for /wethemmedia").

This is the **three-way Venn**:
- Kenny (POIDH) ↔ Maceo (We Them Media) via Let's Talk About Eth podcast
- Maceo (We Them Media) ↔ Zaal (ZAO/BCZ) via music collective overlap
- Zaal (ZAO/BCZ) ↔ Kenny (POIDH) via BCZ YapZ Ep 19 + bounty 1166

Maceo is the bridging connector across this network. For any ZAO + POIDH meta-bounty, **invite Maceo to co-host or co-fund** - he's already in both rooms.

---

## Part 11 - The full POIDH publication catalog

22 Paragraph posts confirmed at words.poidh.xyz (per the Paragraph publication landing page metadata: "Posts: 22, Subscribers: 400+, Collects: 20"). The ones I fetched and verified:

| Date | Title | Why it matters |
|------|-------|----------------|
| 2023-11-03 | [poidh needs design help](https://words.poidh.xyz/poidh-needs-design-help) | **Earliest known POIDH post.** Mentions "J and I" as co-founders, reveals v1 contract address, "nearing 50 completed bounties." Proves POIDH launched well before Nov 3 2023. |
| 2023-11-07 | [about pics or it didn't happen](https://words.poidh.xyz/about-pics-or-it-didnt-happen) | Founding essay - the canonical "why POIDH exists" doc. |
| 2024-01-02 | [poidh v2](https://words.poidh.xyz/poidh-v2) | v2 planning post - "by end of Q1 2024" target |
| 2024-04 (approx) | "poidh on Degen Chain 🎩" | Referenced in May 8 post as "our last blog" - Degen launch announcement |
| 2024-05-08 | [how poidh v2 "open" bounties work](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained) | Multiplayer launch - the v2 capstone post |
| 2024-08-31 | [poidh beginner guide](https://words.poidh.xyz/poidh-beginner-guide) | First public team attribution (Kenny + Rhovian) |
| 2025-11-14 | [poidh: the most seamless Freecash alternative](https://words.poidh.xyz/poidh-seamless-freecash-alternative) | Positioning pivot toward "earn-onchain" audience |
| ~2026-05 | "the ephemeral DAO machine" | Kenny's current framing - DAO without committees, optimizing for "did this thing get done yes/no". Referenced in his Farcaster bio link. |

15 more posts in the catalog not enumerated (paginated behind JS - would need Playwright with full browser to scrape). The above 8 are the load-bearing posts for the history.

---

## Part 12 - The earlier-than-Nov 2023 launch date (rev2 correction)

Rev1 of this doc treated 2023-11-07 as "Day 0." Rev2 corrects: the 2023-11-03 "poidh needs design help" post says POIDH is "**nearing 50 completed bounties all-time**." For there to be ~50 completed bounties before Nov 3, POIDH must have been live by **late September or early October 2023** at the latest.

The v1 contract `0xdffe8a4a4103f968ffd61fd082d08c41dcf9b940` on Arbitrum was deployed before Nov 3, 2023. Arbiscan would confirm the exact deploy block (exa CRAWL_LIVECRAWL_TIMEOUT on direct fetch; recommend manual check via `cast tx` or `etherscan.io` lookup with API key).

Revised opening:
- **Sept-Oct 2023** (estimated): Kenny + J ship v1 contract on Arbitrum, run first ~50 bounties
- **2023-11-03**: "needs design help" post (asks community for UI redesign via 0.3 ETH bounty)
- **2023-11-07**: Founding essay published
- **2024-04-24**: Official multichain re-launch (Gitcoin Grants treats this as launch date)

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

### Rev2 sources (added 2026-05-26)

- [FULL] [poidh needs design help (Kenny, 2023-11-03)](https://words.poidh.xyz/poidh-needs-design-help) - earlier-than-founding post, "J and I" attribution, v1 contract address `0xdffe8a4a4103f968ffd61fd082d08c41dcf9b940`, "nearing 50 completed bounties" by Nov 3, Discord `discord.gg/hDVzpasJGH` + email `poidhxyz@gmail.com`
- [FULL] [Kenny Spotz author archive on Bitcoin Magazine](https://bitcoinmagazine.com/authors/kenny-spotz) - 7+ articles from Apr-Oct 2014, confirms real name and `@kaspotz` is his old handle (NOT a separate person)
- [FULL] [Interview With Coinme - Seattle's First Bitcoin ATM (Kenny Spotz, 2014-05-20)](https://bitcoinmagazine.com/business/interview-coinme-company-behind-seattles-first-bitcoin-atm-1400536862) - confirms writing voice + Seattle base in 2014
- [FULL] [Lessons from a REAL bear market in Crypto (Kenny Spotz guest on RealFinanceGuy, 2019-01-05)](https://www.realfinanceguy.com/home/2019/1/5/lessons-from-a-real-bear-market-in-crypto) - bridge document, expanded bio: Bitcoin Magazine + CoinTelegraph + VICE Motherboard
- [FULL] [Cheese Wizards food truck (GeekWire, 2013-10-14)](https://www.geekwire.com/2013/seattle-foodtruck-bitcoin-accept-payments-grilled-cheese-sandwiches/) - documented 2013 Seattle Bitcoin food truck (Saxbe brothers ran it)
- [FULL] [The $DEGEN Archives (Folklore on Paragraph, 2024-03-30)](https://paragraph.com/@folklore-2/the-degen-archives) - confirms Kenny as one of 6 /degen channel co-hosts (Jacek/Purp/wake/0xen/pedrowww) + The Haberdashery as DegenDAO grants council
- [FULL] [Haberdashers & Memes (sgt_slaughtermelon on Mirror)](https://mirror.xyz/sgtslaughtermelon.eth/D3YdzE4JY8Yb44vCYWxSzUeVY6N-MMYasvLswujhfy4) - The Haberdashery founding attribution to PurpLetariat + wake, NOT Kenny
- [FULL] [The Haberdashery Farcaster profile via Web3.bio](https://web3.bio/thehaberdashery.farcaster) - active since May 26, 2024, 2,669 followers, 3 governance channels
- [FULL] [Maceo Whatley Farcaster profile via Web3.bio](https://web3.bio/wethemniggas.eth.farcaster) - Maceo = wethemmedia founder, the Let's Talk About Eth podcast host who introduced Kenny to Farcaster
- [FULL] [Maceo Whatley Lens profile](https://web3.bio/wethemniggas.lens) - active since Nov 3, 2022 (older than his Farcaster), founder of We Them Niggas / We Them Media bipoc music collective
- [PARTIAL - LIVECRAWL_TIMEOUT] [poidh v1 escrow contract on Arbiscan](https://arbiscan.io/address/0xdffe8a4a4103f968ffd61fd082d08c41dcf9b940) - exa timed out, gh API auth-only. Confirm contract creation block + date via Arbiscan UI or `cast tx` with RPC. Estimated Sept/Oct 2023 deploy based on "nearing 50 completed bounties" by Nov 3 2023.
- [FAILED - SOURCE_NOT_AVAILABLE] Kenny's "ephemeral DAO machine" article on X status `2057507451189293556` - exa cannot fetch X long-form posts. Future option: Playwright headless browser.

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
| Confirm v1 contract deploy date via Arbiscan (rev2 follow-up) | @Zaal | One-shot RPC query | When convenient |
| DM Maceo (@wethemniggas.eth / @maceo_whatley) for ZAO + POIDH + We Them Media tri-fold meta-bounty proposal | @Zaal | Farcaster DM | After Round 2 winner cast |
| Pitch The Haberdashery for co-funding ZABAL Games Round-N bounty (cite kickflip precedent) - reach out via /haberdash-props channel | @Zaal | Farcaster channel post | Before next ZABAL Games meta-bounty |
| Listen to Maceo's Let's Talk About Eth episode with Kenny (find link via wethem.xyz) for direct quote source | @Zaal | Listen | Before BCZ YapZ Ep 20 prep |
| OPEN QUESTION: who is "J" (Kenny's v1 co-founder)? DM Kenny on Farcaster to confirm. Not blocking - useful for ZAO history doc completeness | @Zaal | Farcaster DM | Anytime |
