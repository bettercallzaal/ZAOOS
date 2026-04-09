# 306 - Eden Fractal & Optimism Fractal: Complete History, Philosophy & Architecture

> **Status:** Research complete
> **Date:** 2026-04-08
> **Goal:** Definitive deep dive into Eden Fractal and Optimism Fractal - origins, philosophy, mechanics, people, chain migrations, tooling, and ZAO's place in the fractal movement

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Content strategy** | USE the fractal origin story (Larimer -> Eden on EOS -> Genesis -> Eden Fractal -> OP Fractal -> ZAO) as ZAO's founding narrative on Farcaster - it's compelling, unique, and positions ZAO as the music chapter of a larger movement |
| **Philosophical framing** | FRAME ZAO Fractals as "fractal democracy applied to music curation" - the only community doing this worldwide |
| **Key relationship** | DEEPEN the Dan SingJoy / Tadas relationship - Dan is a musician-turned-governance-innovator, natural alignment with ZAO |
| **Writing angle** | WRITE about fractals as "the alternative to plutocratic DAOs" - soulbound reputation vs token-weighted voting is the killer narrative |
| **Cross-community** | LEVERAGE ZAO being the sole active Optimism fractal (since OF paused Jan 2026) and one of only 2 Superchain fractals |
| **Historical context** | TELL the chain migration story (EOS -> Ethereum/Base/Optimism) as a "finding the right home" narrative |

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

### Dan Larimer and "More Equal Animals" (2021)

The fractal governance movement began with Daniel Larimer - the creator of BitShares (2014), Steem/Hive (2016), and EOS (2018). After building three of the most significant blockchain platforms, Larimer turned to governance.

In 2021, he published **"More Equal Animals: The Subtle Art of True Democracy"** - a 200+ page book arguing that modern democracy is broken because:

1. **Large-group voting fails** - when millions vote, individual votes become meaningless, leading to rational ignorance and apathy
2. **Capital captures governance** - token-weighted voting (1 token = 1 vote) recreates plutocracy on-chain
3. **Representatives become disconnected** - elected officials serve terms too long to maintain accountability

**Larimer's solution: Fractal Democracy**

The core insight comes from mathematics - a fractal is a pattern that repeats at every scale. Applied to governance:

- Sort people into random small groups (3-6 people)
- Each group selects a representative through deliberation
- Representatives form new groups and repeat
- This continues until a final decision-making body emerges

The result: **every person participates in a human-scale discussion** where their voice genuinely matters, while the system scales to any population size through nesting.

**The "Star Trek Test"** (from community blogger Mada): Fractal democracy passes the "Star Trek test" - it's the kind of governance system an advanced civilization would use because it combines human judgment with mathematical scaling.

### Why Fibonacci Scoring?

The Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34, 55...) was chosen for Respect distribution because:

1. **~60% increase per rank** - rewards top contributors without winner-take-all
2. **Softer than Pareto** - Larimer explicitly designed it as a gentler alternative to the 80/20 Pareto distribution that dominates most systems
3. **Measurement theory** - Larimer frames participants as "scientific instruments" measuring relative value. Human judgment has wide margins of error, so the scoring must be forgiving. Fibonacci provides enough differentiation to incentivize excellence without amplifying measurement noise
4. **Level 8 cap** - beyond rank 8, further differentiation amplifies error more than signal

**Original formula:** AVERAGE(FIBONACCI(LEVEL))
**Revised formula (Addendum 1):** FIBONACCI(AVERAGE(LEVEL)) - uses a continuous Fibonacci function with weighted moving average: `NEW_AVG = (CURRENT_AVG * 5 + NEW_LEVEL) / 6`

This creates "momentum" - you build reputation over time, and missing one week doesn't destroy your standing.

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
- **orclient** - TypeScript SDK (npm: @ordao/orclient v1.4.3)
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

## Sources

- [Eden Fractal](https://edenfractal.com)
- [Eden Fractal About](https://edenfractal.com/about)
- [Eden Fractal - Fractal Decision-Making Processes](https://edenfractal.com/fractal-decision-making-processes)
- [Eden Fractal - Upvote Elections](https://edenfractal.com/blog/upvote-elections)
- [Eden Fractal - Fractal Governance Architecture](https://edenfractal.com/117)
- [Optimism Fractal](https://optimismfractal.com)
- [Optimism Fractal Council](https://optimismfractal.com/council)
- [Optimystics - History of Fractal Communities](https://optimystics.io/blog/fractalhistory)
- [Optimystics Tools](https://optimystics.io/tools)
- [Optimystics ORDAO](https://optimystics.io/ordao)
- [Optimystics Respect Game](https://optimystics.io/respectgame)
- [Dan Larimer - "More Equal Animals" (book)](https://moreequalanimals.com/)
- [Dan Larimer - Introducing Fractally (Medium)](https://medium.com/gofractally/introducing-fractally-the-next-generation-of-daos-7c94981514d8)
- [Dan Larimer - Fractally White Paper Addendum 1 (Hive)](https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1)
- [Fractally White Paper (PDF)](https://fractally.com/uploads/Fractally%20White%20Paper%201.0.pdf)
- [First Blockchain Election on Eden on EOS (Medium)](https://medium.com/edenoneos/first-blockchain-election-using-eden-on-eos-receives-grant-from-eos-foundation-3447221d8980)
- [Genesis Fractal Results (Hive)](https://hive.blog/fractally/@mattlangston/first-results-from-the-fractal-governance-experiments)
- [Fractal Democracy and the Star Trek Test (Hive)](https://hive.blog/eden/@mada/fractal-democracy-and-the-star-trek-test)
- [ORDAO GitHub (sim31/ordao)](https://github.com/sim31/ordao)
- [Optimystics GitHub](https://github.com/Optimystics)
- [Eden Fractal Epoch 2 - Optimism Governance Forum](https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976)
- [Optimism Fractal Respect Game Grant](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617)
- [DanSingjoy.com](https://dansingjoy.com/)
- [Fractal Democracy - Two Consensus Rounds (Medium)](https://medium.com/gofractally/fractal-democracy-two-consensus-rounds-8134eaba3281)
- [On Simulating Fractal Governance (Hive)](https://hive.blog/fractally/@mattlangston/on-simulating-fractal-governance)
