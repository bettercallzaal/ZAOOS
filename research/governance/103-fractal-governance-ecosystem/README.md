---
topic: governance
type: comparison
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 102, 104, 105, 106, 109, 114, 115, 188, 285, 306, 346, 444, 450, 498, 502, 664
original-query: "Research into the fractal governance ecosystem for ZAO OS integration - Eden Fractal, Optimism Fractal, Fractally, Optimystics tooling, and music-specific adaptations (reconstructed)"
tier: DEEP
---

# 103 - Fractal Governance Ecosystem: State of the Art (May 2026)

> **Goal:** Deep understanding of the fractal governance ecosystem - active communities, tooling maturity, blockchain deployment, and opportunities for ZAO to become the first music-specific fractal network.

---

## 1. Eden Fractal - The Flagship Community (Status: ACTIVE, Epoch 2 Full Deployment May 2026)

**What it is:** Primary active fractal governance community. Founded June 2022, they pioneered the Respect Game + fractal consensus processes for large-scale decentralized coordination.

**Current State (May 2026):**
- **Epoch 2** (launched June 5, 2025; Season 12 began Jan 15, 2026)
- **Event count:** 130+ events since June 2022 (Epoch 1 on EOS + Epoch 2 on Base combined)
- **Blockchain:** Base (Ethereum Superchain L2), migrated from EOS
- **Respect Game:** Reintroduced June 2025; running every 2 weeks (alternating with Optimism Town Hall)
- **ORDAO:** Deployed to Base; proposals executing onchain for fund distribution + governance
- **Consensus process:** Eden+Fractal (elected delegate councils); 2/3 quorum on-chain
- **Member estimate:** ~40 active Respect holders (Season 12, began Jan 15 2026); 77 Epoch 1 OG token holders. Eden does not prominently publish a current season number; verify before external use.
- **Recorded:** All events archived on [Eden Creators YouTube](https://www.youtube.com/@Optimystics_)

**Epoch 2 Architecture (Tripartite Governance):**

| Branch | Component | Mechanism |
|--------|-----------|-----------|
| **Judiciary** | Respect Game players | Biweekly peer-ranking breakout sessions |
| **Legislative** | Eden+Fractal council | Elected delegates (8-week rolling terms); ORDAO proposal creation |
| **Executive** | OREC contract on Base | Automated on-chain proposal execution; 2/3 consensus required |

**Technical Stack:** Fractalgram UI, ORDAO contracts, ornode API, Hats Protocol, EAS attestations, Charmverse for async proposals.

**Key Events Documented:**
- EF 133 (Jan 22, 2026): Reviewed 2026 strategy + upcoming Eden+Fractal reactivation
- EF 134 (Feb 3, 2026): Building Homes for Coordination; demoed ORDAO proposal system
- EF 120 (May 22, 2025): Epoch 1 finale; transition to Epoch 2 on Base

**Key URLs:**
- [edenfractal.com](https://edenfractal.com)
- [edenfractal.com/epoch2](https://edenfractal.com/epoch2) - Full Epoch 2 vision + timeline
- [edenfractal.com/plus](https://edenfractal.com/plus) - Eden+Fractal consensus process docs
- [edenfractal.com/epoch2-implementation-plan](https://edenfractal.com/epoch2-implementation-plan) - Technical roadmap
- [Eden Creators YouTube (Optimystics_)](https://www.youtube.com/@Optimystics_) - All 130+ event videos
- [gov.optimism.io - Eden Fractal Epoch 2 Proposal](https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976) - Optimism governance forum post

---

## 2. Optimism Fractal - Case Study in ORDAO Adoption (Status: PAUSED Jan 2026, ORDAO Model Preserved)

**What it is:** Second-largest fractal community. Pioneered production ORDAO deployment on OP Mainnet. Built infrastructure for public goods funding on Optimism Superchain.

**Timeline & Status:**
- **Founded:** October 2023 (sparked by Eden Fractal members)
- **Peak:** Season 1-5 (Oct 2023 - Nov 2024); 60+ events
- **Status:** Indefinitely paused (Jan 2026) to consolidate into Eden Fractal
- **Reason for pause:** "To better serve the growing ecosystem of fractal communities" - resources redirected to Eden + Superchain-wide initiatives
- **Archive:** All 57 event videos remain public; ORDAO contracts remain live on OP Mainnet

**ORDAO Achievement (First Production Use Case):**
- **Deployment:** Nov 2024 (Season 5 launch)
- **Proposals executed:** 300+ on OP Mainnet
- **Council:** Optimism Fractal Sages Council (up to 6 elected members)
- **Voting power:** 65+ Respect holders across Seasons 1-5
- **Execution model:** 2/3 consensus; optimistic voting (low quorum for routine decisions; high requirement for contentious ones)

**Tripartite Governance (Template for ZAO + Other Communities):**
1. **Judiciary:** Respect Game participants (biweekly peer ranking)
2. **Legislative:** Council (elected delegates) + Snapshot proposals
3. **Executive:** OREC contract (automated execution of approved proposals)

**Blockchain:** OP Mainnet (0xcB05F9254765CA521F7698e61E0A6CA6456Be532 OREC address). Respect tokens: soulbound ERC-1155.

**Relationship to ZAO:**
- Attabotty + Zaal presented ZAO Fractal work in OF 48 (Nov 2024)
- Dan Singjoy (Optimism Fractal lead) deeply involved in Optimystics + Eden Fractal strategy
- ZAO now the only active Respect Game community on OP Mainnet (OF paused, Eden on Base)
- ORDAO model from Optimism Fractal serves as exact blueprint for ZAO's upcoming governance

**Key URLs:**
- [optimismfractal.com](https://optimismfractal.com) - Paused announcement + ORDAO case study
- [optimismfractal.com/council](https://optimismfractal.com/council) - Council structure + governance breakdown
- [OF 48: Season Finale video (Nov 2024)](https://optimismfractal.com/48) - ZAO Fractal segment (25:02 onwards)

---

## 3. Fractally / Dan Larimer - Theoretical Pioneer (Status: DORMANT Since ~2023)

**What it is:** Vision project announced Jan 2022 by Dan Larimer (BitShares, Steem/Hive, EOS founder). Proposed combining DeFi, social network, smart contract platform, + fractal governance in one system.

**Timeline & Status:**
- **Announced:** Jan 2022 (white paper released Feb 22, 2022)
- **Funding:** EOS Network Foundation grant
- **Peak activity:** 2022
- **Status (May 2026):** Dormant; no blog posts, community activity, or development updates since ~2023
- **Website:** fractally.com still live (lists 11 "freedom engineers" including Larimer)
- **Community:** No active events; Larimer active on social media but Fractally not mentioned

**Why It Stalled:**
1. **EOS ecosystem decline** - original chain struggled post-2021; became secondary to Ethereum
2. **Creator migration** - Eden Fractal + Optimism Fractal moved to Base + OP Mainnet (Ethereum Superchain)
3. **Lack of critical mass** - never launched public testnet or mainnet deployment
4. **Complexity** - all-in-one vision too ambitious vs. modular Optimystics approach

**Theoretical Legacy (PRESERVED in Optimystics tools):**
- **Fractal democracy** - small groups + delegate chains + quorum-based consensus
- **Fibonacci-weighted Respect** - ranking scale of 5, 8, 13, 21, 34, 55 (all used today by Eden + Optimism Fractal)
- **Soulbound reputation** - non-transferable tokens as governance primitive (ERC-1155 in ORDAO)
- **Tripartite governance** - judiciary (game), legislative (council), executive (on-chain execution)

**Key URLs:**
- [fractally.com](https://fractally.com) - Home page (dormant since 2023)
- [medium.com/gofractally](https://medium.com/gofractally/introducing-fractally-the-next-generation-of-daos-7c94981514d8) - Original announcement blog
- [Fractally whitepaper PDF](https://fractally.com/uploads/Fractally%20White%20Paper%201.0.pdf)

---

## 4. Active Fractal Communities (Ecosystem Map, May 2026)

### Production Fractals (Respect Game + Onchain)

| Community | Chain | Est. Members | Cadence | Status | Highlights |
|-----------|-------|--------------|---------|--------|------------|
| **Eden Fractal** | Base | 40-80 | Bi-weekly (Thu 17 UTC) | ACTIVE | Epoch 2 full deployment; 133+ events |
| **ZAO Fractal** | Optimism | ~40 | Weekly (Mon 6pm EST) | ACTIVE | Only music-focused fractal; 90+ sessions |
| **Roy Fractal** | EOS | 700+ | Regular | ACTIVE | Largest by participant count; governance |
| **Fractal Hispano** | EOS | 30+ | Regular | ACTIVE | Spanish-speaking governance |
| **Alien Worlds Fractal** | WAX/EOS | ~10 avg | Weekly | ACTIVE | Gaming/metaverse use case |
| **Aquadac** | Zoom-based | 20-30 | Weekly (Tue 16:00 GMT) | ACTIVE | Personal development focus; Respect Game for goal-tracking |
| **EOS Respect** | EOS | Dozens | Monthly elections | ACTIVE | Trust network + reputation |
| **ZEOS Fractal** | EOS | Small | Weekly | ACTIVE | Privacy protocol + governance |

### Paused / Dormant

| Community | Chain | Status | Date | Notes |
|-----------|-------|--------|------|-------|
| **Optimism Fractal** | OP Mainnet | Indefinite pause | Jan 2026 | Consolidated into Eden; ORDAO model preserved |
| **Genesis Fractal** | EOS/Hive | Concluded | - | 30-week experiment; 130 participants; reports published |
| **Fractally** | EOS | Dormant | ~2023 | Website live, no activity; theoretical reference only |
| **Fractal Fiction** | N/A | One-time event | 2022 | Storytelling experiment |
| **Eden on EOS** | EOS | Concluded | April 2021 - | Epoch 1 precursor; 400+ peak, token migration to Base |

### Emerging / Early Stage

- **Eden Korea** (EOS) - internal testing
- **Upland Fractal** (Upland chain) - metaverse governance
- **Upscale Fractal** (EOS) - evolved from Eden on EOS
- **ThiagoRe** (EOS/BTC) - SocialFi with fractal council
- **dNews** - decentralized news curation + fractal voting
- **Supercivilization** - collective advancement framework
- **Dynamics of Hegemony** - strategy game with fractal mechanics

### Chain Distribution (May 2026)

| Chain | Active Communities | Notes |
|-------|-------------------|-------|
| **Base (Superchain)** | 1: Eden Fractal | Superchain hub; Epoch 2 primary |
| **OP Mainnet (Superchain)** | 1: ZAO Fractal | Only active (Optimism Fractal paused) |
| **EOS/Antelope** | 7-8 | Declining ecosystem but largest participant count (Roy = 700+) |
| **WAX** | 1: Alien Worlds Fractal | Gaming-specific |
| **Other** (Zoom, Discord, etc.) | 2-3: Aquadac, dNews, Supercivilization | Infrastructure-agnostic |
| **Arbitrum, Polygon, Solana, L1 Ethereum** | 0 | No fractal governance deployments |

### Music / Creative Fractals (Non-existent = Greenfield)

**Zero dedicated music fractals exist as of May 2026.** Related projects (all non-fractal):
- **Friends With Benefits (FWB)** - Social club (token-gated, traditional governance)
- **SongCamp** - Music collective (shared revenue, no peer ranking)
- **Botto** - AI art DAO (voting on generated art + taste model, not Respect Game)
- **Fractal Visions** - Generative art (no community voting)

**ZAO Position:** Only fractal focused on music curation + artist reputation. First-mover advantage; no competition in space.

---

---

## 5. Optimystics - The Tooling Layer (Production-Grade Stack, May 2026)

**Optimystics** (optimystics.io) is the primary development team building the fractal governance technology stack. Founded ~2022; 16 GitHub repos (Optimystics org); most repos updated Feb-May 2026.

### Core Production Tools

| Tool | Purpose | Status | License | Latest Version |
|------|---------|--------|---------|-----------------|
| **ORDAO** | Governance contracts + SDK for Respect-based DAOs | Production (OP Mainnet + Base) | GPL-3.0 | v1.3.2 (@ordao/orclient, May 17, 2026) |
| **OREC** | Optimistic Respect Executive Contract (core of ORDAO) | Production | GPL-3.0 | Deployed on 2+ chains |
| **Fractalgram** | Live Respect Game web UI (peer ranking breakout rooms) | Production | GPL-3.0 | MIT fork available [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) |
| **frapps** | Modular deployment platform for fractal apps | Production | MIT/GPL-3.0 | [Optimystics/frapps](https://github.com/Optimystics/frapps) |
| **Respect.Games** | Async Respect Game app (MVP form filling) | Beta → Production (roadmap) | MIT | In-progress |
| **ORConsole** | Advanced governance operations + monitoring dashboard | Available | GPL-3.0 | orclient-docs.frapps.xyz |
| **ortypes** | Shared TypeScript interfaces across tools | Production | Part of ordao repo | Part of v1.3.2 |

### Additional Tools & Components

| Name | Purpose | Status |
|------|---------|--------|
| **RetroPolls** | Retrospective community polling / survey tool | Roadmap |
| **Respect Trees** | Hierarchical visualization of Respect distribution + flows | Development |
| **Cagendas** | Community agenda management (topic triage) | Development |
| **OPTOPICS** | Topic selection + prioritization for Respect Game prompts | Development |
| **Competition App** | Ranking speeches, musical performances, creative work | Development (explicitly for music use cases) |
| **EAS Integration** | Ethereum Attestation Service for Respect record keeping | Experimental |
| **Hats Protocol Integration** | Dynamic role management based on Respect earned | In use (Eden Fractal, ZAO) |

### Deployment URLs (May 2026)

| Service | URL | Purpose |
|---------|-----|---------|
| **ORDAO Fractal App** | ordao.frapps.xyz | Governance proposal UI |
| **Optimism Fractal** | of.frapps.xyz | Proposal + voting interface (legacy, paused) |
| **Eden Fractal** | eden-fractal.frapps.xyz | Session recording + results |
| **ZAO Fractal** | zao.frapps.xyz | ZAO-specific app (available when deployed) |
| **ORConsole Docs** | orclient-docs.frapps.xyz | API reference + integration guide |
| **Fractalgram Demo** | respect-game.vercel.app | Live UI demo (standalone) |

### ORDAO Technical Architecture

**Consent-Based Voting (not majority-based):**
- Low quorum (e.g., 1-2 voters) enables active members to act immediately
- Time-delayed execution window (e.g., 24 hours) allows opposition to block
- High-friction proposals (contentious topics) increase quorum + extend delay

**Soulbound Respect Tokens:**
- ERC-1155 standard (non-transferable, non-fungible)
- Voting power earned through Respect Game rankings, not purchased
- One address = one vote (no whale attacks)
- Metadata on-chain: session, date, rank, scorer identities

**Modular Parameters (per-community customization):**
- Voting periods: 1 day - 7 days
- Quorum: 1-65+ members
- Execution delay: immediate - 1 week
- Proposal creation: min Respect threshold (e.g., 55)

**Superchain ORDAO (Hub-and-Spoke Model):**
- Hub chain (e.g., OP Mainnet for ZAO, Base for Eden)
- Spoke chains (e.g., other Superchain L2s) relay voting
- Cross-chain message passing via native Superchain interop

### Roadmap / What's Coming (2026-2027)

- **Respect.Games app** → production (async gameplay for any community, no live event required)
- **Superchain ORDAO** → full cross-chain expansion (Base ↔ OP Mainnet ↔ World ↔ Zora, etc.)
- **Integrated video** → Fractalgram embeds session recordings + AI transcript indexing
- **Hats Protocol tier-gating** → dynamic role access based on cumulative Respect
- **Higher-Order Fractals** → earned Respect in local fractals (ZAO, Eden) contributes to ecosystem-wide reputation
- **Multi-chain deployment** → ORDAO on all Superchain L2s (Zora, Ink, Arbitrum Orbit, etc.)
- **Competition App** → public launch (explicitly designed for "ranking speeches and musical performances")

---

## 6. Music-Specific Fractal Features - ZAO Adaptation Analysis

### The Respect Game Mechanics (recap for music context)

1. **Random breakout rooms** of 3-6 people
2. **Each person presents** (~4 min) relating work to a shared prompt
3. **Collaborative ranking** - group discusses and ranks contributions
4. **2/3 consensus required** - discussion continues until reached
5. **Fibonacci-weighted Respect** - each higher rank earns ~60% more Respect
6. **Onchain recording** - soulbound tokens on Base

### Direct Adaptations for ZAO

#### A. Song Battles as Breakout Rooms
**Prompt:** "What music did you create, curate, or contribute to ZAO this week?"

- 3-6 members per room, each plays their track or describes their contribution
- Group ranks by impact/quality/originality
- Top-ranked earn more Respect (Fibonacci: 1, 1, 2, 3, 5, 8...)
- Multiple rooms run simultaneously - scales to any community size
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
Explicitly designed for "ranking speeches and musical performances" - this is the closest existing tool to what ZAO needs. Worth monitoring and potentially contributing to.

### Technical Integration Path for ZAO

1. **Deploy ORDAO on Base** - ZAO is already on Optimism/Superchain ecosystem
2. **Use Respect.Games app** (beta) or fork Fractalgram for ZAO-branded experience
3. **Custom prompt:** "What did you do to grow ZAO's music community?"
4. **Soulbound Respect tokens** complement existing Respect token system on Optimism
5. **Hats Protocol integration** - already used by both ZAO and fractal communities
6. **FRAPPS toolkit** - build custom fractal app modules specific to music curation

### What Doesn't Exist Yet (Greenfield for ZAO)

- **No music-specific fractal app UI** - only generic Fractalgram available
- **No audio playback integration** in breakout room UI
- **No fractal community focused on music** - ZAO is the first (40 members, 90+ sessions)
- **No "taste model" + fractal consensus hybrid** - Botto has AI taste ranking (non-fractal); fractal communities use peer voting (non-AI)
- **No Competition App public launch yet** - in development; expected 2026-2027
- **No cross-chain Respect aggregation** - ZAO (OP Mainnet) + Eden (Base) earn separate Respect tokens; merger possible via Higher-Order Fractals (roadmap)

---

## Findings: Updates Since March 2026

**Significant Changes (March → May 2026):**

1. **Optimism Fractal officially paused (Jan 2026, confirmed May 2026)**
   - Consolidated into Eden Fractal per council vote
   - ORDAO model preserved; contracts remain live on OP Mainnet
   - 300+ proposals executed; case study for Superchain governance

2. **orclient SDK now v1.3.2 (May 17, 2026)**
   - Improved wallet integration + error handling vs. v1.0.15 (March)
   - Published to npm; ZAO can integrate immediately

3. **Eden Fractal Epoch 2 fully operational (May 2026)**
   - 130+ events since June 2022 (Epoch 1 + Epoch 2 combined)
   - Season 12 running (biweekly, alternating with Optimism Town Hall)
   - ORDAO proposals executing on Base for fund distribution

4. **ZAO Fractal is now the ONLY active Optimism-chain fractal**
   - Optimism Fractal paused; no other OP Mainnet fractals exist
   - Unique position to pioneer ORDAO governance for music

5. **Optimystics Competition App explicit about music use cases**
   - "Ranking speeches and musical performances" - directly relevant to ZAO
   - Public launch expected 2026-2027; ZAO can contribute/influence

6. **Superchain ORDAO cross-chain expansion planned**
   - ZAO (OP Mainnet) + Eden (Base) could eventually share governance
   - Hub-and-spoke model enables Respect flow between chains (roadmap)

---

## 7. Comparative Analysis: ZAO vs. Ecosystem Leaders

| Metric | ZAO Fractal | Eden Fractal | Optimism Fractal (paused) |
|--------|-----------|--------------|--------------------------|
| **Age** | ~1 year (2024-) | 4 years (2022-) | 1.5 years (2023-2026) |
| **Member Count** | ~40 | 40-80 | ~65 (peaked) |
| **Events Held** | 90+ | 133+ | 60 |
| **Chain** | OP Mainnet | Base | OP Mainnet |
| **ORDAO Status** | Ready (not yet used) | Active (Epoch 2) | Active (300+ proposals executed) |
| **Primary Focus** | Music + artist reputation | Governance innovation + education | Public goods funding (Optimism ecosystem) |
| **Community Composition** | Musicians, producers, curators | Builders, researchers, governance enthusiasts | Optimism contributors + public goods devs |
| **Unique Advantage** | Only music fractal; first-mover in creative space | Largest active fractal; ecosystem hub | Proven ORDAO production model |

**Key Insight:** ZAO has clear market differentiation (music) + template from Optimism Fractal (ORDAO architecture). Can ship governance faster than Eden (since model proven) while maintaining creative/music focus.

---

## Summary & Recommendations for ZAO

| Factor | Assessment |
|--------|------------|
| Ecosystem maturity | Moderate - 3+ years of iteration, production contracts on Base/OP |
| Active communities | 1 primary (Eden Fractal), 1 paused (Optimism Fractal) |
| Tooling readiness | ORDAO production-ready; Respect.Games in beta; FRAPPS modular |
| Chain alignment | Strong - Base/Superchain matches ZAO's Optimism deployment |
| Music-specific tools | None exist - greenfield opportunity |
| Integration complexity | Medium - open-source, modular, well-documented |
| Community overlap | Potential - governance innovators interested in creative applications |

**Recommended next steps:**
1. Attend an Eden Fractal event to experience the Respect Game firsthand
2. Test Respect.Games beta with a small ZAO cohort
3. Explore forking/extending FRAPPS for music-specific features (audio playback in breakout rooms)
4. Connect with Optimystics team about the Competition App roadmap
5. Consider ZAO as a pilot "music fractal" - first of its kind

---

## Also See

Related fractal governance docs: 56, 58, 102, 104, 105, 106, 109, 114, 115, 188, 285, 306, 346, 444, 450, 498, 502, 664, 698, 699.

---

## Next Actions for ZAO

| Action | Owner | Timeline | Outcome |
|--------|-------|----------|---------|
| Propose first ORDAO test (e.g., small Respect bonus) | Zaal | This sprint | Validate on-chain execution |
| Attend Eden Fractal event (livestream or IRL) | Zaal + core | May-June 2026 | Learn processes; network with founders |
| Reach out to Optimystics re: Competition App | Zaal | June 2026 | Influence music-specific roadmap |
| Plan Fractalgram fork for ZAO audio UI | Tech lead | June 2026 | Phase 2 in-app session recording |
| Document ZAO music fractal model | Research | July 2026 | Case study + attraction tool for ecosystem |

---

## Sources

- [Eden Fractal](https://edenfractal.com) - [FULL] Main site + Epoch 2 docs
- [Eden Fractal About](https://edenfractal.com/about) - [FULL] Org overview
- [edenfractal.com/epoch2](https://edenfractal.com/epoch2) - [FULL] Epoch 2 vision + architecture
- [edenfractal.com/plus](https://edenfractal.com/plus) - [FULL] Eden+Fractal consensus docs
- [Eden Fractal Epoch 2 Timeline Clarification](https://edenfractal.com/epoch2-implementation-plan/elements-of-epoch-2/clarifying-eden-fractals-epoch-1-and-epoch-2-timeline) - [FULL] Epoch 1 vs Epoch 2 timeline
- [Eden Creators YouTube Channel](https://www.youtube.com/@Optimystics_) - [FULL] 130+ event videos (EF 133, EF 134, etc.)
- [gov.optimism.io - Eden Fractal Epoch 2 Proposal](https://gov.optimism.io/t/eden-fractal-epoch-2-implementing-fractal-decision-making-on-the-superchain/9976) - [FULL] Optimism governance forum post
- [optimismfractal.com](https://optimismfractal.com/) - [FULL] Paused announcement + ORDAO case study + OF 48 video
- [optimismfractal.com/council](https://optimismfractal.com/council) - [FULL] Sages Council structure
- [OF 48 video (Optimism Fractal Nov 2024)](https://optimismfractal.com/48) - [FULL] ZAO Fractal segment + governance discussion
- [optimystics.io/ordao](https://optimystics.io/ordao) - [FULL] ORDAO docs + architecture
- [optimystics.io/tools](https://optimystics.io/tools) - [FULL] Full Optimystics tool index
- [optimystics.io/fractalgram](https://optimystics.io/fractalgram) - [FULL] Fractalgram product page
- [optimystics.io/respectgame](https://optimystics.io/respectgame) - [FULL] Respect Game explainer
- [optimystics.io/blog](https://optimystics.io/blog) - [FULL] Optimystics blog
- [optimystics.io/2025-strategy](https://optimystics.io/2025-strategy) - [FULL] Optimystics strategy doc
- [GitHub Optimystics org](https://github.com/Optimystics) - [FULL] 16 repos; frapps, fractalgram, ordao, etc.
- [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) - [FULL] Live Respect Game UI (MIT license, forkable)
- [Optimystics/frapps](https://github.com/Optimystics/frapps) - [FULL] Fractal apps toolkit
- [Optimystics/ordao](https://github.com/Optimystics/ordao) - [FULL] Smart contracts + orclient SDK monorepo
- [@ordao/orclient npm](https://www.npmjs.com/package/@ordao/orclient) - [PARTIAL] npm package page (v1.3.2 confirmed via WebSearch; npm registry returned 403 on direct fetch)
- [Aquariusacademy.substack.com - Aquadac](https://aquariusacademy.substack.com/p/aquadac-collective-self-realization) - [FULL] Personal development fractal
- [ZAO Whitepaper Draft 3 (HackMD)](https://hackmd.io/@bB0dXoPfSAuUEqyo43pHZw/H1edVWM7eg) - [FULL] ZAO vision including ORDAO integration
- [fractally.com](https://fractally.com) - [FULL] Dormant site; white paper available
- [medium.com/gofractally - Introducing Fractally](https://medium.com/gofractally/introducing-fractally-the-next-generation-of-daos-7c94981514d8) - [FULL] Original Jan 2022 announcement
- [EdenOS Medium - Fractal Governance](https://medium.com/edenos/edenos-a-fractal-governance-solution-for-blockchain-communities-5e7324369abf) - [FULL] EdenOS fractal governance background
- [Optimism Fractal Respect Game Research (Optimism Gov Forum)](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617) - [FULL] Democratic fund distribution research
- [Fractal Sortition (FreeDAO)](https://medium.com/freedao/revolutionising-dao-governance-with-fractal-sortition-ff18fdda8692) - [FULL] Sortition mechanics
- [DAO-Based Music Communities](https://www.makingascene.org/dao-based-music-communities-the-future-of-fan-engagement/) - [FULL] Music DAO context
