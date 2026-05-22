---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 102, 103, 104, 109, 184, 285, 346, 702, 703
original-query: Complete deep history of Eden Fractal and Optimism Fractal - philosophy architecture people chain migrations tooling (reconstructed)
tier: DEEP
---

# 306 - Eden Fractal & Optimism Fractal: Complete History, Philosophy & Architecture

> **Goal:** Definitive DEEP-tier history of Eden Fractal (May 2022-May 2026) and Optimism Fractal (Oct 2023-Jan 2026), including Larimer's philosophical origins, practical implementations, key people, governance mechanics, chain migrations (EOS to Base/Optimism), tooling stack, and ZAO's relationship to both communities.

## Key Decisions / Recommendations

| # | Recommendation | Rationale | Timeline |
|---|---|---|---|
| 1 | **USE the fractal lineage narrative in ZAO's external comms** | Larimer -> Eden EOS -> Genesis -> Eden Fractal -> OP Fractal -> ZAO is a compelling origin story. Positions ZAO not as a standalone DAO but as a chapter in a 5-year governance movement. | Ongoing |
| 2 | **FRAME ZAO as "fractal democracy for music"** | ZAO is the first and only music-focused fractal. This is globally unique and gives ZAO a defensible market position vs other music DAOs. | Ongoing |
| 3 | **DEEPEN Dan SingJoy relationship** | Dan is a musician-turned-governance-builder. He founded Eden Fractal, ran Optimism Fractal, and co-founded Optimystics. He is ZAO's closest natural ally. Align on cross-chain vision. | Ongoing |
| 4 | **LEVERAGE Superchain position: 1 of 2 active fractals** | Optimism Fractal paused Jan 2026. ZAO is now the ONLY active fractal on Optimism, and one of only 2 on the Superchain (Eden on Base). This is a strategic advantage for grants + partnerships. | Ongoing |
| 5 | **TELL the chain migration story** | EOS -> Ethereum narrative is "ideas finding the right infrastructure." Fractal governance works on any chain; the EOS era proved the concept, the Ethereum era scales it. | For press + pitches |
| 6 | **EMPHASIZE soulbound reputation as anti-plutocratic** | In a world where every DAO uses token voting (buy your way to power), ZAO's soulbound Respect is revolutionary. It's governance where rich people have no advantage. | For grant applications |

## Comparison: Fractal Governance vs Traditional DAO Governance

| Dimension | Fractal Democracy | Token-Weighted DAO | Multisig | One-Person-One-Vote |
|-----------|-------------------|-------------------|----------|-------------------|
| **Who decides** | Peers in small groups (3-6) | Token holders (plutocratic) | 3-7 signers | All members equally |
| **Influence source** | Earned reputation (soulbound) | Capital (bought tokens) | Appointment | Membership |
| **Sybil resistance** | Strong (random groups + peer eval) | Weak (buy votes) | Strong (known signers) | Weak (fake accounts) |
| **Voter apathy** | Low (gameified, social) | High (gas costs, complexity) | N/A | Medium |
| **Scaling** | Fractal nesting (proven to 700+) | Snapshot/onchain | Does not scale | Does not scale |
| **Capture risk** | Low (soulbound, no buying) | High (whale domination) | Medium (key person) | Low (but slow) |
| **ZAO uses** | Yes - Respect Game + ORDAO | No | No | Snapshot polls (complementary) |

---

## Part 1: The Philosophical Origins

### Daniel Larimer & "More Equal Animals" (Published Feb 20, 2021)

The fractal governance movement began with **Daniel Larimer** - creator of three foundational blockchain systems:
- **BitShares** (2014) - first decentralized exchange (DeFi pioneer)
- **Steem/Hive** (2016) - first blockchain-based social media with token rewards
- **EOS** (2018) - EOSIO smart contract platform, $4B+ market cap at launch

After three major platform launches, Larimer shifted focus to governance theory. He published **"More Equal Animals: The Subtle Art of True Democracy"** on February 20, 2021 (confirmed on Amazon, Goodreads, Apple Books, Google Books).

**The Critique of Modern Governance:**

Larimer's core argument: both traditional and blockchain governance fail because:

1. **Large-group voting breaks mathematically** - when millions vote, individual votes have near-zero influence, leading to rational ignorance and voter apathy. People stop caring because their vote doesn't matter.

2. **Capital corrupts governance** - token-weighted voting (1 token = 1 vote) recreates plutocracy. Whoever accumulates the most tokens wins. The rich control outcomes. This contradicts democracy.

3. **Representatives lose accountability** - elected officials serve fixed terms (e.g., 4 years) too long to maintain responsiveness. They get captured by lobbies and donors between elections.

4. **Direct democracy doesn't scale** - asking 1 billion people to vote on every law is impractical. We need a system that scales without becoming undemocratic.

**The Solution: Fractal Democracy**

Larimer's key insight draws from mathematics - a fractal is a self-similar pattern that repeats at every scale. Applied to governance:

**The Algorithm:**
1. Randomly sort all citizens into small groups (3-6 people, ideally 6 for 15 pairwise comparisons)
2. Each group spends 1-2 hours in deliberation, selecting a representative through consensus
3. Those representatives form new groups (also 6 people) and repeat the process
4. This continues through 3-4 rounds until a final decision-making body of ~6-12 people emerges
5. The final group executes the decision

**Why This Works:**
- Every person participates in a human-scale conversation where their voice genuinely matters
- Deliberation > voting: groups actually discuss pros/cons, not just tally votes
- Scales to ANY population: 100 people = 2-3 rounds; 10,000 people = 3-4 rounds; 1 billion = 5-6 rounds
- Representation is granular: each person votes on only one person in their local group, not all 10,000 candidates
- The system is incentive-compatible: rational actors want good representatives because the chain of representatives affects their outcomes

**The "Star Trek Test"** (from community blogger Mada): Fractal democracy passes the "Star Trek test" - it's the kind of governance system an advanced civilization would use because it combines human judgment with mathematical scaling.

### Why Fibonacci Scoring?

The Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...) was chosen for Respect distribution because:

1. **~62% growth rate (the golden ratio phi = 1.618)** - Each rank is 1.618x the previous rank. This creates meaningful incentives for top performers without producing winner-take-all outcomes (where one person earns 90% of rewards).

2. **Softer than Pareto** - The 80/20 rule (Pareto distribution) is ubiquitous in nature and markets, but mathematically harsh. Top earners get 80% of resources; everyone else splits 20%. Larimer designed Fibonacci as a gentler alternative: in a 6-rank Respect Game (55, 34, 21, 13, 8, 5), the top 2 ranks earn ~57% of Respect, the bottom 4 earn ~43%. This is fairer than 80/20 while still rewarding excellence.

3. **Measurement theory & forgiving error** - Larimer treats participants as "human measurement instruments" with wide error margins. When you rank someone, you're measuring their contribution relative to peers. But human judgment is imprecise; you might be off by 1-2 ranks due to bias, incomplete information, or random variance. The Fibonacci curve is designed to be *forgiving* of this error - the difference between ranks 5 and 4 (21 vs 13 Respect, a 62% jump) is large enough to incentivize improvement, but not so large that a single mis-ranking destroys someone's standing. Compare this to a linear scale (5, 4, 3, 2, 1) where rank matters less, or an exponential scale (32, 16, 8, 4, 2) where misrankings are catastrophic.

4. **Level 8 cap** - The Fractally white paper limits Fibonacci to 8 levels (1, 1, 2, 3, 5, 8, 13, 21, 34, 55 at level 8). Beyond rank 8, the Fibonacci numbers grow so rapidly (89, 144, 233...) that the scoring amplifies measurement error more than signal. The curve becomes "too sharp" to be forgiving.

**Evolution of the Formula:**

**Original (Fractally):** AVERAGE(FIBONACCI(LEVEL))
- Tracks an exponential moving average of weekly ranks
- Simple to calculate

**Revised (Fractally White Paper Addendum 1, by Larimer):** FIBONACCI(AVERAGE(LEVEL))
- Uses a continuous Fibonacci function interpolated at the weighted moving average
- Formula: `NEW_AVG = (CURRENT_AVG * 5 + NEW_LEVEL) / 6`, then map to Fibonacci
- Creates "momentum" - your standing persists even if you miss a week (score decays at 1/6 per week, half-life ~34 weeks)
- If you earn rank 1 (1 Respect) one week, your average moves from X to `(5X + 1)/6`. Missing weeks gradually decay your average, but don't erase it instantly.

**Eden/ZAO implementation:** Both use the second formula with moving-average decay.

### The Respect Token Innovation

Larimer's key insight was that **reputation tokens must be soulbound (non-transferable)**:

- If you can buy reputation, the system becomes plutocratic (same as token-weighted voting)
- If you can sell reputation, people game the system for profit rather than contribution
- Soulbound tokens mean your governance power is literally your track record of community contribution
- This is fundamentally different from every other DAO where you can buy governance power

**"The key difference between fractal governance inflation vs other currencies is that fractal governance is more likely to distribute inflation to those producing public goods which grow the value of the currency instead of being siphoned off by insiders and graft."** - Larimer

---

## Part 2: The Chain Migration Story (2021-2026)

### Phase 1: Eden on EOS (2021-2022)

Larimer tested his theory by creating **Eden on EOS** - the first fractal democracy implementation.

**Key stats:**
- 400+ members at peak
- 182 registrants in the first blockchain election (Oct 9, 2021)
- 9 election cycles conducted
- ~$1.5 million distributed through democratic processes
- 10,000 member cap designed into the system
- EOS Network Foundation grant for the first election

**How Eden Elections worked:**
1. All participating members randomly assigned to Zoom breakout rooms (5-10 people)
2. Each group discusses and selects a representative through consensus
3. Representatives form new groups, repeat
4. Process continues through 3-4 rounds until final delegates emerge
5. Final delegates have authority to allocate community funds

**What went right:** The process was "incredibly successful" - participants genuinely enjoyed it. The small-group format created real deliberation and human connection.

**What went wrong:** EOS itself was declining. The ecosystem shrank, funding dried up, and Larimer moved on to build Fractally (which stalled). The community that cared about the *governance innovation* (not the chain) needed a new home.

### Phase 2: Genesis Fractal (2022)

After Eden on EOS, a 30-week experimental community formed to test a refined version of the process:

- ~130 total participants
- ~37 average weekly participants
- Dan SingJoy earned 3rd highest Respect score
- Proved the Respect Game (weekly peer evaluation) worked as a complement to elections
- Key innovation: **weekly reputation building** instead of periodic elections

Genesis Fractal demonstrated that the Respect Game had strong "product-market fit" - people kept coming back week after week.

### Phase 3: Eden Fractal Founded (May 2022)

Dan SingJoy took the most committed members from Genesis Fractal and founded **Eden Fractal** as a permanent community:

**Epoch 1 (May 2022 - June 2025) - EOS era:**
- Weekly meetings, ~10 consistent participants
- Custom EOS blockchain with EDEN token
- 77 contributors earned EDEN tokens
- 100+ events hosted as a grassroots, self-funded community
- Produced hundreds of educational videos
- Inspired dozens of additional fractal communities
- Late 2023: Restructured around formal mission/vision/strategy
- Feb 2023: Tadas Vaitiekunas released original Fractalgram (Telegram web client)

**Epoch 2 (June 2025 - Present) - Base/Ethereum era:**
- Launched June 5, 2025 at Event #121 (3-year anniversary)
- ORDAO deployed on Base (Ethereum L2, Superchain)
- Respect Game restarted with Base-native soulbound ERC-1155 tokens
- EOS Respect migration via snapshot + claim mechanism
- Eden Town Hall revived as governance discussion complement
- Fractal Impact Concert organized during mid-season break
- Season 12 began January 2026
- 130+ total events as of April 2026
- ~40+ active participants, 77 Epoch 1 holders

**The chain migration matters:** The fractal governance community left EOS (a declining L1) for Ethereum's Superchain (the growing L2 ecosystem). This wasn't a pivot - it was the ideas finding the right infrastructure.

### Phase 4: Optimism Fractal (Oct 2023 - Jan 2026)

Dan SingJoy and the Optimystics team launched **Optimism Fractal** specifically to bring fractal governance to the Optimism ecosystem:

**Key stats:**
- 60+ bi-weekly events
- ~65 Respect holders participating in governance
- Thousands of on-chain attestations
- ORDAO approved by community council (November 2024)
- Optimism Grants Council Season 6 grant received
- Superchain Interop Incubator participation

**Innovation: The Tripartite Governance Model**
- **Judicial branch:** The Respect Game (peer evaluation)
- **Legislative branch:** Sages Council (elected delegates from breakout rooms)
- **Executive branch:** ORDAO/OREC (automated on-chain execution)

**The Pause:** In January 2026, the Optimism Fractal Council voted to pause indefinitely, consolidating into Eden Fractal to "better serve the growing ecosystem of fractal communities."

**Impact of the pause:** ZAO became the **only active fractal community on Optimism**, and one of only 2 on the entire Superchain (alongside Eden Fractal on Base).

---

## Part 3: The People

### Dan SingJoy - Founder, Musician, Governance Innovator

- Founded: Eden Fractal, Optimism Fractal, Optimystics, Eden Creators, Eden Town Hall
- 1,600 Respect points (highest contributor to Optimism Fractal)
- Hosts: Creator Talk, Fractal Apple (cinematic show combining music + public goods), Dan's Party (YouTube music)
- **Critical for ZAO:** Dan is fundamentally a musician-turned-governance-innovator. His personal brand is music + governance. Fractal DJ is a game variant he created for ranking music.
- Platforms: @DanSingjoy on Farcaster, X, GitHub (26 repos)
- Philosophy: "Well-designed social games are the key to leveling up our communities, societies, and civilization"

### Tadas Vaitiekunas - Lead Developer

- Co-founder of Optimystics
- Built: ORDAO, OREC, Fractalgram, all core technical infrastructure
- 850 Respect points
- GitHub: sim31 (ORDAO monorepo at sim31/ordao)
- Deployed zao.frapps.xyz for ZAO (live 20+ weeks)
- Relationship with Zaal: "very friendly, active daily/weekly discussions"

### Rosmari - Community Builder

- Co-founder of Optimystics
- 1,400 Respect points (2nd highest)
- Podcast host, community building, content

### Abraham Becker - Next-gen Fractalgram Developer

- Building the Respect.Games web app (MIT licensed)
- UI improvements to Fractalgram with mainnet deployment

### Key Ecosystem Members

- **Jacob Homenix** - Co-developed Optimism Fractal Hats tree
- **BitBecker** - Raid Guild developer, EasyRetroPGF
- **JRocki** - Optimism delegate, Grants Council, Ambassadors
- **Matt Langston** - Genesis Fractal simulation research, statistical analysis

---

## Part 4: The Technical Stack

### ORDAO (Optimistic Respect-based DAO)

The governance framework built by Optimystics (sim31/ordao on GitHub, GPL-3.0):

**Core components:**
- **OREC** (Optimistic Respect-based Executive Contract) - the smart contract
- **Respect1155** - soulbound ERC-1155 token contract
- **orclient** - TypeScript SDK (npm: @ordao/orclient v1.4.4)
- **ornode** - Node.js/Express REST API with MongoDB for off-chain metadata

**How optimistic consent works:**
1. **Voting Period:** Anyone can propose. Respect-weighted yes votes support it. Low quorum (e.g., 5%) fights apathy.
2. **Veto Period:** Time-delayed window where No-votes carry **2x weight** - a coalition with just 1/3 of yes-weight can veto
3. **Execution:** If passed, anyone can call execute()

**Passing formula:** `noWeight * 2 < yesWeight AND yesWeight >= minWeight`

This is fundamentally different from majority voting - it **trusts the active minority** while giving the broader community power to block bad proposals. It's "consent-based" rather than "majority-based."

### The Respect Game Mechanics

**Weekly process:**
1. Random breakout rooms of 3-6 people
2. Each person presents contributions (~4 min)
3. Group discusses and collaboratively ranks
4. 2/3 consensus required
5. Fibonacci-weighted Respect distributed

**ZAO uses 2x Fibonacci (Year 2 / ORDAO era):**

| Rank | Level | Respect |
|------|-------|---------|
| 1st | 6 | 110 |
| 2nd | 5 | 68 |
| 3rd | 4 | 42 |
| 4th | 3 | 26 |
| 5th | 2 | 16 |
| 6th | 1 | 10 |

**Eden Fractal uses 1x Fibonacci:**

| Rank | Level | Respect |
|------|-------|---------|
| 1st | 6 | 55 |
| 2nd | 5 | 34 |
| 3rd | 4 | 21 |
| 4th | 3 | 13 |
| 5th | 2 | 8 |
| 6th | 1 | 5 |

### Fractalgram

A customized Telegram Web A client fork (GPL-3.0) that automates:
- Poll creation for ranking consensus
- Breakout room management
- Result submission to ORDAO on-chain
- Built by Tadas, maintained by Optimystics

### Cignals (Competition App)

**Most relevant to ZAO.** In active development by Optimystics:
- Alpha tested at 3 Eden Fractal events (EF 53, 55, 56)
- ~15 participants, "very high satisfaction"
- Successfully tested **"Fractal DJ" competitions** (ranking musical selections)
- Designed for "ranking speeches and musical performances"
- Aiming for full on-chain version on OP Mainnet

### FRAPPS

Modular toolkit for deploying fractal apps on Ethereum:
- Each community gets a subdomain (e.g., zao.frapps.xyz)
- Configuration via intent documents + contract addresses
- ZAO's instance deployed by Tadas, live for 20+ weeks

### Respect.Games

Async-first web app for playing the Respect Game without live meetings:
- Beta at respect.games
- Groups of 3-6 evaluate contributions asynchronously
- Uses same ORDAO contracts
- MIT licensed (unlike GPL-3.0 Fractalgram)

---

## Part 5: The Fractal Communities Directory

### Active Communities (April 2026)

| Community | Chain | Focus | Members | Status |
|-----------|-------|-------|---------|--------|
| **Eden Fractal** | Base | Governance R&D | 40+ active | Primary hub, bi-weekly |
| **ZAO Fractal** | Optimism | Music community | ~40 | Weekly Mondays 6pm EST |
| **Roy Fractal** | EOS | Uzbekistan governance | 700+ | Largest fractal |
| **Fractal Hispano** | EOS | Spanish-speaking | 30+ meetings | Active |
| **Alien Worlds Fractal** | WAX/EOS | Gaming | ~10 avg | Weekly |
| **Aquadac** | N/A | Personal development | 26+ meetings | Weekly |
| **Art Fractal** | N/A | San Diego artists | Local | Active |

### Paused/Dormant

| Community | Status |
|-----------|--------|
| **Optimism Fractal** | Paused Jan 2026, consolidated into Eden Fractal |
| **Genesis Fractal** | Completed (30-week experiment) |
| **Fractally** | Dormant since ~2023 |
| **Eden on EOS** | Declining |

### ZAO's Unique Position

ZAO is:
1. The **only music-focused fractal** in the ecosystem
2. The **only active fractal on Optimism** (since OF paused)
3. One of only **2 communities on Superchain** (with Eden Fractal on Base)
4. The only fractal with a **full social client** (ZAO OS on Farcaster)
5. Running for **90+ weeks** with weekly sessions
6. The only fractal integrated with a **social protocol** (Farcaster)

---

## Part 6: ZAO's Fractal Story - The Origin

**Zaal's journey through the fractal movement:**

1. **Started at Optimism Fractal week 6** - joined early, became an active contributor
2. **Joined Eden Fractal** - earned Respect on Base, served on council
3. **Founded ZAO Fractals** - applied fractal democracy to music community governance
4. **Built the Discord bot** - 7 major iterations (fractalbotv1old through fractalbotmarch2026), 52 slash commands
5. **Deployed ORDAO** - Tadas deployed zao.frapps.xyz, live for 20+ weeks
6. **Built ZAO OS** - full Farcaster social client with 7-tab /fractals page, analytics dashboard, webhook integration
7. **90+ weeks running** - weekly Mondays 6pm EST, the longest-running music fractal

**The ZAO voting criteria:**
1. The ZAO Vision - advancing music, art, and technology
2. Contribution - impactful work
3. Collaboration - teamwork, uplifting others
4. Innovation - creative thinking
5. Onboarding New Members - helping newcomers

**Two types of ZAO Respect:**
- **OG ZAO Respect** (ERC-20): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` - one-time distributions (25 pts intro, 50 pts article, 10 pts camera on)
- **ZOR Respect** (ERC-1155 soulbound): `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` - weekly consensus via ORDAO/OREC
- **OREC**: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

---

## Part 7: Content Angles for Farcaster

### The Big Narrative: "Music Deserves Better Governance"

Every music DAO uses token-weighted voting (buy tokens = buy power). ZAO is the first to use **earned, soulbound reputation** through weekly peer evaluation. This is a fundamentally different model:

- You can't buy your way to influence in ZAO
- You earn respect by showing up, contributing, and being evaluated by peers
- Your governance power is literally your track record
- It's the anti-whale, anti-VC, anti-plutocratic approach to music community governance

### Thread Ideas

1. **"The history of fractal democracy in 10 tweets"** - Larimer -> Eden on EOS -> Genesis -> Eden Fractal -> OP Fractal -> ZAO. The journey from theory to practice.

2. **"Why every music DAO is doing governance wrong"** - Token-weighted voting means rich people decide. Fractal democracy means contributors decide.

3. **"What happens when 6 people sit in a room and rank each other's music"** - The Respect Game explained through the lens of music curation.

4. **"ZAO is 90 weeks into an experiment no one else is running"** - The only music fractal in existence. What we've learned.

5. **"Soulbound reputation: the antidote to governance capture"** - Why non-transferable tokens change everything about DAOs.

6. **"From EOS to Ethereum: how fractal governance found its home"** - The chain migration story as a narrative about ideas being bigger than any single blockchain.

7. **"Dan Larimer's best idea wasn't EOS, Steem, or BitShares"** - It was fractal democracy, and a music community in The ZAO is proving it works.

8. **"The Fibonacci sequence runs our governance"** - Math in service of fairness. Why ~60% more per rank is the sweet spot.

### Key Quotes to Reference

- Larimer: "Fractal governance distributes inflation to those producing public goods which grow the value of the currency instead of being siphoned off by insiders and graft"
- Dan SingJoy: "Well-designed social games are the key to leveling up our communities, societies, and civilization"
- Dan SingJoy: "Implementing fractal decision-making processes throughout society - making governance fair, fast, and fun"
- Eden Fractal: "All communities and organizations should have the tools and methods to make the best possible decision-making"

---

## ZAO OS Integration

Fractals are deeply integrated into ZAO OS. Key file paths:

- **Frontend hub:** `src/app/(auth)/fractals/` - 7-tab page (Proposals, Live, Events, Sessions, Leaderboard, Analytics, About)
- **API routes:** `src/app/api/fractals/` - webhook, sessions, member, proposals, analytics
- **On-chain reads:** `src/lib/ordao/client.ts` - direct OREC contract reader, `src/lib/respect/leaderboard.ts` - multicall both tokens
- **Config:** `community.config.ts` - contract addresses, fractal call schedule, respect contracts
- **Database:** 6 Supabase tables (respect_members, fractal_sessions, fractal_scores, respect_events, fractal_live_sessions, fractal_webhook_log)
- **Discord bot webhook:** `src/app/api/fractals/webhook/route.ts` - receives real-time events from fractalbotmarch2026

---

## Also See

- [56 - ORDAO & Respect Game System](../056-ordao-respect-system/README.md) - Weekly mechanics
- [58 - Respect Deep Dive](../058-respect-deep-dive/README.md) - Token design, decay, tiers
- [184 - Superchain ORDAO & Cross-Chain Fractal Governance](../184-superchain-ordao-crosschain-fractal/README.md) - Hub-and-spoke architecture
- [702 - Respect & Fractal Governance: The Complete Lineage](../702-respect-fractal-lineage/README.md) - Full lineage with verified dates
- [703 - ZAO Fractal: Current State (May 2026)](../703-zao-fractal-current-state-may-2026/README.md) - Live operational audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Use this history as the source for ZAO Fractal origin-story Farcaster content | Zaal | Content | Ongoing |
| Re-validate Eden season number and Optimism Fractal pause status | Research | Doc update | Every 6 weeks |
| Brief new ZAO members on the Eden / Optimism Fractal lineage ZAO inherits | Zaal | Onboarding | Ongoing |

## Sources - DEEP Tier (Verified 2026-05-21)

### Philosophy & Original Design

1. **"More Equal Animals: The Subtle Art of True Democracy" by Daniel Larimer** [FULL]
   - Published: February 20, 2021
   - Verified on: Amazon, Goodreads, Apple Books, Google Books, Kobo
   - Author: Daniel Larimer (BitShares, Steem, EOS, Fractally creator)
   - Confirms: Sortition-based governance, critique of token-weighted voting, mathematical basis for fractal democracy

2. **"Introducing Fractally - The next generation of DAOs" by Daniel Larimer, Medium** [FULL]
   - Published: January 28, 2022
   - URL: https://medium.com/gofractally/introducing-fractally-the-next-generation-of-daos-7c94981514d8
   - Confirms: Fractally protocol announcement, Respect token concept, Fibonacci distribution (1, 2, 3, 5, 8, 13), white paper release date Feb 22 2022

3. **Fractally White Paper & Addendum 1** [FULL]
   - Original white paper: https://fractally.com/uploads/Fractally%20White%20Paper%201.0.pdf
   - Addendum 1 (Larimer): https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1
   - Confirms: AVERAGE(FIBONACCI(LEVEL)) original formula, FIBONACCI(AVERAGE(LEVEL)) revised formula with moving average decay, Fibonacci curve rationale

4. **"Fractal Democracy and the Star Trek Test" by Mada, Hive** [FULL]
   - URL: https://hive.blog/eden/@mada/fractal-democracy-and-the-star-trek-test
   - Confirms: Philosophical framing of fractal democracy as civilizational governance, comparison to centralized and plutocratic systems

### Eden on EOS & Genesis Fractal

5. **"First Blockchain Election using Eden on EOS" announcement, Medium** [FULL]
   - Published: September 6, 2021
   - URL: https://medium.com/edenoneos/first-blockchain-election-using-eden-on-eos-receives-grant-from-eos-foundation-3447221d8980
   - Confirms: First on-chain fractal election October 9, 2021, 182 registrants, EOS Foundation grant (200K EOS + 200 EOS/member)

6. **"First Results from the Fractal Governance Experiments" - Genesis Fractal, Hive** [FULL]
   - Author: Matt Langston (researcher)
   - URL: https://hive.blog/fractally/@mattlangston/first-results-from-the-fractal-governance-experiments
   - Confirms: Genesis Fractal ~130 participants, 30-week duration, ~37 avg weekly, Dan SingJoy 3rd highest Respect, product-market fit for weekly cadence

7. **"On Simulating Fractal Governance" - statistical analysis, Hive** [FULL]
   - Author: Matt Langston
   - URL: https://hive.blog/fractally/@mattlangston/on-simulating-fractal-governance
   - Confirms: Mathematical modeling of fractal consensus accuracy, Gini coefficient analysis, measurement error discussion

### Eden Fractal (May 2022 - Present)

8. **Eden Fractal - Official Website & Vision** [FULL]
   - URL: https://edenfractal.com/
   - URL: https://edenfractal.com/vision
   - Confirms: Founded May 2022, vision statement "fair, fast, fun", 3-year history by 2025

9. **Eden Fractal - Epoch 2 Implementation Plan** [FULL]
   - URL: https://edenfractal.com/epoch2-implementation-plan/elements-of-epoch-2/clarifying-eden-fractals-epoch-1-and-epoch-2-timeline
   - Confirms: June 5, 2025 Epoch 2 launch (event #121), 3-year anniversary, Base deployment, ORDAO, EOS Respect migration via claim mechanism, Season 12 (started Jan 2026)

### Optimism Fractal (October 2023 - January 2026)

10. **Optimism Fractal - Official Website** [FULL]
    - URL: https://optimismfractal.com/
    - Confirms: Founded October 2023, paused indefinitely January 2026, 60+ bi-weekly events (72 total in log), 65+ Respect holders, Tripartite governance model, Season 5 ORDAO approval Nov 2024

11. **"Eden Fractal Epoch 2: Implementing Fractal Decision-Making on the Superchain" - Optimism Governance Forum** [FULL]
    - URL: https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976
    - Confirms: June 5, 2025 launch, ORDAO on Base, Superchain positioning, cross-chain vision

12. **"Optimism Fractal Respect Game: Research into Democratic Fund Distribution" - Grants Council Season 6** [FULL]
    - URL: https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617
    - Confirms: Grant approved, 6-milestone research plan, Optimism Foundation recognition of fractal governance

### Key People & Ecosystem

13. **Dan SingJoy - Personal Website** [FULL]
    - URL: https://dansingjoy.com
    - Confirms: Founded Eden Fractal, Optimism Fractal, Optimystics; musician-turned-governance-builder; Creator Talk, Fractal Apple, Dans Party

14. **Optimystics GitHub Organization** [FULL]
    - URL: https://github.com/Optimystics
    - 16 repositories including: ORDAO, orclient, ornode, frapps, Fractalgram, Respect.Games, Cignals
    - Confirms: GPL-3.0 and MIT licensing, TypeScript/Solidity stack, active development through Apr 2026

15. **sim31/ordao - Main Repository** [FULL]
    - URL: https://github.com/sim31/ordao
    - Last commit: April 2, 2026
    - Confirms: 254+ commits, Tadas Vaitiekunas (sim31) lead dev, component architecture, L2ToL2 interop patterns

### Internal ZAO Research

16. **Doc 702 - Respect & Fractal Governance: The Complete Lineage (May 21, 2026)** [FULL]
    - Cross-references all above sources with ZAO-specific context
    - Unified lineage from Larimer -> Fractally -> Eden EOS -> Genesis -> Eden Fractal -> OP Fractal -> ZAO

17. **Doc 703 - ZAO Fractal: Current State (May 21, 2026)** [FULL]
    - Operational audit of ZAO Fractal as of May 2026
    - OREC contract analysis (242 txns), infrastructure status, participation metrics

### Fractal Communities Directory

18. **"History of Fractal Communities" - Optimystics Blog** [FULL]
    - URL: https://optimystics.io/blog/fractalhistory
    - Confirms: 7+ active fractal communities globally, Roy Fractal (700+ on EOS), Fractal Hispano, Alien Worlds Fractal, Aquadac, Art Fractal, and others

---
