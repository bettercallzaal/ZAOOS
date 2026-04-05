# 103 — Fractal Governance Ecosystem Deep Dive (March 2026)

> **Date:** 2026-03-05

Research into the fractal governance ecosystem for ZAO OS integration — Eden Fractal, Optimism Fractal, Fractally, Optimystics tooling, and music-specific adaptations.

---

## 1. Eden Fractal

**What it is:** An independent educational community focused on improving collective decision-making through fractal consensus processes and prosocial games. The primary active fractal community as of March 2026.

**Status:** Active and operating. Currently in **Epoch 2**, launched June 5, 2025 (event #121, their 3-year anniversary). Season 12 began January 2026 and is ongoing through Spring 2026.

**Blockchain:** Deployed on **Base** (Ethereum L2, part of the Superchain). Migrated from EOS (Epoch 1) to Base (Epoch 2). A claim interface enables participants to migrate Respect tokens earned during Epoch 1 on EOS to Ethereum/Base.

**Events:** 120+ bi-weekly events hosted since May 2022. Bi-weekly cadence on alternating weeks with Optimism-ecosystem events.

**Tools/Platform:**
- Fractalgram web app for live event consensus
- ORDAO smart contracts on Base for onchain governance
- Events hosted via Zoom, listed on Luma
- Videos archived on Eden Creators YouTube channel
- Hats Protocol integration for role management

**Epoch 2 core features:**
- Respect Game reintroduced with onchain recording on Base
- ORDAO deployed for democratic fund distribution
- Eden+Fractal consensus process creating a legislative branch with elected delegates and rolling councils
- Synchronous Respect Trees game for community-driven topic selection

**Member count:** Not publicly disclosed. 65+ Respect holders from the Optimism Fractal side have governance power; Eden Fractal likely has a comparable or overlapping cohort.

**Key URLs:**
- https://edenfractal.com
- https://edenfractal.com/about
- https://edenfractal.com/epoch2-implementation-plan

---

## 2. Optimism Fractal

**What it is:** A community that pioneered fractal governance and the Respect Game on the Optimism Superchain. Participants share contributions to Optimism, collaboratively rank each other, and earn soulbound Respect tokens.

**Status: PAUSED INDEFINITELY.** The Optimism Fractal Council approved an indefinite hiatus in **January 2026**, consolidating efforts into Eden Fractal to "better serve the growing ecosystem of fractal communities."

**History:**
- Launched and ran 60+ bi-weekly events before the pause
- Season 5 debuted ORDAO software integration
- Hosted RetroFunding event series showcasing public goods creators
- ORDAO approved for adoption by the community in November 2024

**Blockchain:** OP Mainnet, with plans supporting multiple Superchain networks (Base, World, Soneium, Ink, Unichain, Zora, Mode, Redstone).

**Council Structure:** The **Optimism Fractal Sages Council** used Respect tokens for governance through democratic peer selection and onchain attestations. ~65 Respect holders participated in legislative functions, with OREC handling automated execution.

**Tripartite Governance Model:**
- ORDAO = Executive branch (automated onchain execution)
- Council = Legislative branch (proposal creation, parameter voting)
- Respect Game players = Judiciary (peer evaluation, reputation)

**Relationship to ORDAO:** First full production deployment of ORDAO. Hundreds of proposals successfully executed. Served as the living testbed before Eden Fractal adoption.

**Key URLs:**
- https://optimismfractal.com
- https://optimismfractal.com/council

---

## 3. Fractally by Dan Larimer

**What it is:** Announced January 2022 by Daniel Larimer (creator of BitShares, Steem/Hive, EOS). Intended to deliver "the original EOS vision of 2017" — combining a decentralized exchange, social media network, high-performance smart contract platform, and fractal governance.

**Status: Effectively dormant.** The fractally.com website remains live (lists 11 "freedom engineers" including Larimer), but there is no evidence of active community events, recent development updates, or meaningful adoption since ~2023. No recent blog posts, no community activity metrics, no deployment announcements.

**Blockchain:** Originally EOS-based. Received funding from the EOS Network Foundation (ENF) and took on maintaining Mandel (community-driven EOSIO fork).

**What happened:**
- Larimer's book "More Equal Animals" laid the theoretical foundation
- Eden on EOS tested the election concepts with hundreds of participants
- Fractally was announced as the productized vision but never achieved critical mass
- The EOS ecosystem itself declined significantly
- The practical community (Eden Fractal, Optimism Fractal) migrated to Ethereum/Superchain
- Dan Larimer remains active on social media but Fractally appears to have stalled

**Legacy:** The core ideas (fractal democracy, small-group consensus, Fibonacci-weighted reputation) survived and thrived through Eden Fractal and Optimystics — they just moved to Ethereum. Fractally's white paper remains the theoretical reference.

**Key URLs:**
- https://fractally.com
- https://medium.com/gofractally/introducing-fractally-the-next-generation-of-daos-7c94981514d8

---

## 4. Other Fractal Communities

### Known Communities (from Eden Fractal's history)
- **Eden Fractal** — Primary active community (see above)
- **Optimism Fractal** — Paused January 2026 (see above)
- **Spanish Speaking Fractal** — Focused on bringing fractal democracy to Spanish-speaking communities worldwide
- **Alien Worlds Fractal** — Gaming/metaverse community using fractal governance
- **Aquadac** — Fractal community (limited public information)
- **FractalJoy** — Referenced in Optimism Fractal promotional tasks

### Fractal Communities on Other Chains
- **Base:** Eden Fractal Epoch 2 is the primary Base deployment (live since June 2025)
- **Superchain ORDAO:** MVP completed through Optimism Superchain Interop Incubator. Enables governance across multiple Superchain networks via hub-and-spoke model
- **Arbitrum:** No known fractal governance communities. Arbitrum DAO uses traditional token-weighted governance with sub-DAOs
- **Ethereum Mainnet:** No direct fractal governance deployment; the communities operate on L2s (OP Mainnet, Base)

### Music/Creative Fractals
**None exist yet.** No fractal governance community has been specifically built for music or creative curation. This represents a clear greenfield opportunity for ZAO.

### Related Creative DAOs (non-fractal)
- **Friends With Benefits (FWB):** Social club for musicians/artists/creatives, token-gated, but uses traditional token-weighted governance
- **SongCamp:** Music collective DAO with shared revenue, but no fractal process
- **Botto:** AI art DAO with community voting on generated art — uses a "taste model" trained by DAO votes (interesting parallel to music curation)
- **Fractal Visions:** Gitcoin-listed project focused on generative art, but not fractal governance

---

## 5. Optimystics Tooling & Roadmap

**Optimystics** (optimystics.io) is the development team building the open-source fractal governance stack. 16 repositories on GitHub, most recently updated May 2025.

### Core Tools

| Tool | Purpose | Status | License |
|------|---------|--------|---------|
| **ORDAO** | Optimistic respect-based DAO governance contracts | Production (OP Mainnet + Base) | GPL-3.0 |
| **OREC** | Optimistic Respect-based Executive Contract (ORDAO's core) | Production | GPL-3.0 |
| **Fractalgram** | Telegram-style web client for live Respect Game events | Production | GPL-3.0 |
| **Respect.Games** | All-in-one async Respect Game app | Beta | MIT |
| **FRAPPS** | Modular toolkit for fractal apps on Ethereum/EVM | Active development | MIT/GPL-3.0 |
| **ORConsole** | Advanced governance operations & monitoring | Available | GPL-3.0 |

### Additional Tools (in various stages)
- **RetroPolls** — Retrospective community polling
- **Respect Trees** — Hierarchical respect visualization
- **Cagendas** — Community agenda management
- **OPTOPICS** — Topic selection/prioritization
- **Firmament** — (details limited)
- **Cignals** — (details limited)

### Key URLs for Tools
- ORDAO Fractal App: ordao.frapps.xyz
- ORConsole: orclient-docs.frapps.xyz
- Submission Interface: of.frapps.xyz
- Fractalgram: respect-game.vercel.app
- GitHub: https://github.com/Optimystics (16 repos, 7 followers)

### ORDAO Technical Details
- **Consent-based voting** (not majority): Low quorum enables active members to act; time-delayed execution allows opposition to block contentious proposals
- **Respect tokens** are soulbound ERC-1155 — voting power from demonstrated contribution, not capital
- **Modular:** Customizable voting periods, quorum, execution delays
- **Spam prevention:** Limits on concurrent live proposals
- **Superchain ORDAO MVP:** Cross-chain message passing with hub-and-spoke model (hub on primary chain, spokes on other Superchain networks)

### Roadmap / What's Coming
- **Respect.Games app** moving from beta to production — async gameplay for any community
- **Superchain ORDAO** expanding cross-chain governance capabilities
- **Integrated video** capabilities within fractal apps
- **Hats Protocol integration** for dynamic role management based on earned reputation
- **"Higher Order Fractal" concept** — earned Respect tokens contributing to broader fractal ecosystem distribution
- **Multi-chain deployment** across Superchain (Base, Zora, Ink, WorldChain, etc.)
- **Competition App** (in development) — helps communities play consensus games at live events with Respect, such as ranking speeches and musical performances

---

## 6. Music-Specific Fractal Features — ZAO Adaptation Analysis

### The Respect Game Mechanics (recap for music context)

1. **Random breakout rooms** of 3-6 people
2. **Each person presents** (~4 min) relating work to a shared prompt
3. **Collaborative ranking** — group discusses and ranks contributions
4. **2/3 consensus required** — discussion continues until reached
5. **Fibonacci-weighted Respect** — each higher rank earns ~60% more Respect
6. **Onchain recording** — soulbound tokens on Base

### Direct Adaptations for ZAO

#### A. Song Battles as Breakout Rooms
**Prompt:** "What music did you create, curate, or contribute to ZAO this week?"

- 3-6 members per room, each plays their track or describes their contribution
- Group ranks by impact/quality/originality
- Top-ranked earn more Respect (Fibonacci: 1, 1, 2, 3, 5, 8...)
- Multiple rooms run simultaneously — scales to any community size
- Results recorded onchain as soulbound reputation

**ZAO-specific modifications:**
- 4-minute presentation could include 60-90 seconds of audio playback + context
- Contributions could span: original tracks, remixes, playlist curation, event organizing, community support
- Prompt could rotate: "Best new discovery," "Most impactful collaboration," "Best live moment"

#### B. Listening Sessions with Fibonacci Scoring
**Format:** Dedicated listening events where submitted tracks are evaluated

- Pre-submit tracks before the session
- Random groups listen to the same 4-6 tracks
- Discuss and rank collaboratively
- Fibonacci Respect distribution to submitters
- Creates a community-curated quality signal without relying on algorithms

#### C. Curation Councils via Earned Respect
- Members who accumulate Respect through consistent participation gain council seats
- Council decides: playlist features, event lineups, collaboration grants, treasury allocation
- ORDAO enables onchain execution of council decisions
- Rolling councils prevent entrenchment (new elections each season)

#### D. Creative Contribution Categories
The Respect Game already supports evaluating diverse contribution types in a single round:
- Music production
- Visual art / cover design
- Event organizing
- Community building / onboarding
- Technical contributions (tools, bots, integrations)
- Cross-promotion / marketing

#### E. Competition App (Optimystics, in development)
Explicitly designed for "ranking speeches and musical performances" — this is the closest existing tool to what ZAO needs. Worth monitoring and potentially contributing to.

### Technical Integration Path for ZAO

1. **Deploy ORDAO on Base** — ZAO is already on Optimism/Superchain ecosystem
2. **Use Respect.Games app** (beta) or fork Fractalgram for ZAO-branded experience
3. **Custom prompt:** "What did you do to grow ZAO's music community?"
4. **Soulbound Respect tokens** complement existing Respect token system on Optimism
5. **Hats Protocol integration** — already used by both ZAO and fractal communities
6. **FRAPPS toolkit** — build custom fractal app modules specific to music curation

### What Doesn't Exist Yet (Opportunities)
- No music-specific fractal app or UI
- No audio playback integration in Fractalgram/Respect.Games
- No fractal community focused on music curation
- No "taste model" (like Botto's) combined with fractal consensus
- ZAO could be the first music fractal community

---

## 7. Key Contacts & Entry Points

- **Optimystics team** — primary developers of the stack (optimystics.io, @optimystics_ on Twitter)
- **Eden Fractal** — active bi-weekly events, best place to experience the Respect Game firsthand
- **Optimism Collective governance forum** — Eden Fractal Epoch 2 proposal: https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976
- **GitHub** — https://github.com/Optimystics (all code MIT/GPL-3.0)

---

## 8. Summary & Recommendations for ZAO

| Factor | Assessment |
|--------|------------|
| Ecosystem maturity | Moderate — 3+ years of iteration, production contracts on Base/OP |
| Active communities | 1 primary (Eden Fractal), 1 paused (Optimism Fractal) |
| Tooling readiness | ORDAO production-ready; Respect.Games in beta; FRAPPS modular |
| Chain alignment | Strong — Base/Superchain matches ZAO's Optimism deployment |
| Music-specific tools | None exist — greenfield opportunity |
| Integration complexity | Medium — open-source, modular, well-documented |
| Community overlap | Potential — governance innovators interested in creative applications |

**Recommended next steps:**
1. Attend an Eden Fractal event to experience the Respect Game firsthand
2. Test Respect.Games beta with a small ZAO cohort
3. Explore forking/extending FRAPPS for music-specific features (audio playback in breakout rooms)
4. Connect with Optimystics team about the Competition App roadmap
5. Consider ZAO as a pilot "music fractal" — first of its kind

---

## Sources

- [Eden Fractal](https://edenfractal.com)
- [Eden Fractal About](https://edenfractal.com/about)
- [Eden Fractal Epoch 2 Timeline](https://edenfractal.com/epoch2-implementation-plan/elements-of-epoch-2/clarifying-eden-fractals-epoch-1-and-epoch-2-timeline)
- [Optimism Fractal](https://optimismfractal.com)
- [Optimism Fractal Council](https://optimismfractal.com/council)
- [Eden Fractal Epoch 2 on Optimism Governance Forum](https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976)
- [Optimystics Tools](https://optimystics.io/tools)
- [Optimystics ORDAO](https://optimystics.io/ordao)
- [Optimystics Fractalgram](https://optimystics.io/fractalgram)
- [The Respect Game](https://optimystics.io/respectgame)
- [Optimystics Blog](https://optimystics.io/blog)
- [Optimystics 2025 Strategy](https://optimystics.io/2025-strategy)
- [Optimystics GitHub](https://github.com/Optimystics)
- [FRAPPS GitHub](https://github.com/Optimystics/frapps)
- [Fractally.com](https://fractally.com)
- [EdenOS Medium](https://medium.com/edenos/edenos-a-fractal-governance-solution-for-blockchain-communities-5e7324369abf)
- [Optimism Fractal Respect Game Research (Optimism Gov Forum)](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617)
- [Fractal Sortition (FreeDAO)](https://medium.com/freedao/revolutionising-dao-governance-with-fractal-sortition-ff18fdda8692)
- [DAO-Based Music Communities](https://www.makingascene.org/dao-based-music-communities-the-future-of-fan-engagement/)
