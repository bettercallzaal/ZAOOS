---
topic: identity/ip
type: REFERENCE
status: CANONICAL — update as new IP is created; ZOE updates Arweave links as episodes are archived
created: 2026-07-17
related-docs: 1280, 1312, 1330, 1339, 1344, 1349, 1351
owner: Zaal (IP authority) + ZOE (Arweave link maintenance)
---

# 1352 — ZAO IP Catalog + On-Chain Asset Registry (Jul 2026)

> **Purpose:** A single canonical inventory of all ZAO intellectual property — software, content, tokens, events, and research — with chain addresses, license terms, and access points. This doc is the source of truth for grant applications, academic citations, press kits, and Wikipedia submissions.
>
> **IP North Star:** 8.5/10 → target 9.5/10 after this catalog is maintained actively through 2026. The gap is not creating new IP — it's having a single place to point to that proves all existing IP is documented and accessible.

---

## Section 1: Software + Platforms

### 1A. WaveWarZ Platform

| Field | Value |
|-------|-------|
| Type | Music battle platform (SaaS) |
| Live URL | wavewarz.info |
| Public API | wavewarz.info/api/public/stats |
| Chain | Solana Mainnet |
| Auth required | No (public read, CORS open) |
| Open source | No (platform is proprietary; API is open) |
| Operator | Hurricane (WaveWarZ team) |
| ZAO relationship | ZAO is a governance and community partner; ZAO co-hosts MAIN events |
| Documentation | See doc 1350 (WaveWarZ 101 explainer) |

**WaveWarZ on-chain activity (Jul 2026):**
- 1,245 battles completed
- 523.991 SOL total volume
- 9.0988 SOL artist payouts
- 127.343 SOL trader claims
- 50 MAIN events
- Source: wavewarz.info/api/public/stats

---

### 1B. wwtracker (Open Source)

| Field | Value |
|-------|-------|
| Type | WaveWarZ battle analytics dashboard |
| Repository | github.com/bettercallzaal/wwtracker |
| License | MIT |
| Live URL | [wwtracker deployment URL] |
| Tech stack | [from code — Next.js/React + Solana API] |
| Status | Active |
| Owner | Zaal Panthaki |

**License note:** MIT license = any researcher, journalist, or developer can use, modify, and redistribute with attribution. This makes wwtracker a public good under the Gitcoin / OP RF framing.

---

### 1C. ZAOOS (Open Source Research Repository)

| Field | Value |
|-------|-------|
| Type | Public research repository |
| Repository | github.com/bettercallzaal/ZAOOS |
| License | To be declared (recommend CC-BY 4.0 for research docs) |
| Doc count (Jul 2026) | 1,350+ documents |
| Format | Markdown (README per doc directory) |
| Topics | Music, governance, WaveWarZ, ZAOstock, AI, events, identity |
| Maintainer | ZAOOS Loop (AI agent) + Zaal Panthaki |
| Status | Active (40-80 new docs/month) |

**Action needed:** Add CC-BY 4.0 license declaration to ZAOOS root README so researchers know they can freely cite. (See doc 1351 Part 4)

---

## Section 2: Governance Tokens + Contracts (Optimism Mainnet)

### 2A. OG Token (ERC-20)

| Field | Value |
|-------|-------|
| Name | OG |
| Standard | ERC-20 |
| Chain | Optimism Mainnet |
| Contract | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |
| Optimism explorer | optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957 |
| Purpose | ZAO governance participation token (OG Respect) |
| Distribution | Earned via weekly Fractal governance sessions |
| Total supply | [ZOE: pull from Optimism] |
| Unique holders | [ZOE: pull from Optimism] |

---

### 2B. ZOR Token (ERC-1155)

| Field | Value |
|-------|-------|
| Name | ZOR |
| Standard | ERC-1155 (multi-token — supports NFT editions) |
| Chain | Optimism Mainnet |
| Contract | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Optimism explorer | optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c |
| Purpose | ZAO recognition + achievement tokens (ZOR Respect) |
| Distribution | Issued via governance sessions |
| Total minted | [ZOE: pull from Optimism] |

---

### 2C. OREC (On-Chain Governance Contract)

| Field | Value |
|-------|-------|
| Name | OREC (On-chain Respect Contract) |
| Chain | Optimism Mainnet |
| Contract | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| Purpose | Fractal governance execution — sessions recorded on-chain |
| Governance sessions | 63+ consecutive weeks (as of Jul 2026) |
| Verifiable | All session results on Optimism Mainnet public ledger |

**Governance streak significance:** 63+ consecutive weekly governance sessions is extraordinary for a small DAO. Most DAOs have 0-3 on-chain governance events. ZAO has 63+ documented weeks of Fractal with on-chain recording. This is the core proof-of-persistence for grant applications and academic citations.

---

## Section 3: Content IP (COC Concertz + ZAOville)

### 3A. COC Concertz Episodes

COC Concertz is ZAO's virtual concert series. Each episode features an independent artist performing live, with the recording permanently archived on Arweave.

| Episode | Artist | Date | Arweave link |
|---------|--------|------|-------------|
| COC #1 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #2 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #3 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #4 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #5 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #6 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #7 | [artist] | [date] | [ZOE: add Arweave URL] |
| COC #8 | [TBD] | Jul 21+ | [ZOE: add Arweave URL after archiving] |

**ZOE action:** Fill this table with Arweave URLs for all archived episodes. Arweave links = permanent, censorless, Wikipedia-eligible sources.

**IP note:** COC Concertz recordings are owned jointly by ZAO and the performing artist. The archive is publicly accessible but not CC licensed — the artist retains rights to their performance.

---

### 3B. ZAOville Episodes

ZAOville is ZAO's earlier virtual event series, also archived on Arweave (see doc 1228).

| Episode | Artist/Format | Date | Arweave link |
|---------|-------------|------|-------------|
| ZAOville [N] | [artist] | [date] | [ZOE: add Arweave URL] |

**ZOE action:** Pull all ZAOville Arweave links from doc 1228 and fill this table.

---

### 3C. ZAOstock 2026

| Field | Value |
|-------|-------|
| Event type | Outdoor music festival |
| Date | October 3, 2026 |
| Location | Ellsworth, Maine |
| Artists | 8 (selected by WaveWarZ battle history) |
| Format | Live performance + livestream |
| Archive | Arweave (post-event — see doc 1346 for protocol) |
| IP ownership | ZAO (event) + artists (performance rights) |
| Post-event doc | 1337 (report template) |

---

## Section 4: Research IP (ZAOOS)

### High-citation reference docs (link these externally)

These ZAOOS docs are the most citable external-facing documents:

| Doc | Title | Why cite it |
|-----|-------|------------|
| 1350 | WaveWarZ Platform Explainer 101 | Canonical "what is WaveWarZ" for press/grants |
| 1339 | ZAO Proof-Points + Verifiable Claims | All ZAO claims with on-chain verification |
| 1280 | ZAO Fractal Governance Explainer | Governance model documentation |
| 1312 | ZAO Governance History | Historical record of sessions |
| 1344 | ZAO AI-Native DAO Narrative | AI fleet documentation |
| 1349 | ZAO Grant Applications Hub | Funding documentation |
| 1351 | Academic Researcher Outreach | Research context + citations |
| **1352** | **ZAO IP Catalog (this doc)** | **Master IP registry** |

---

## Section 5: AI Fleet (Operational IP)

ZAO's 8-agent AI fleet is itself an IP asset — the documented methodology for operating a DAO with AI agents.

| Agent | Function | IP type |
|-------|----------|---------|
| ZOE | Telegram daily ops, social media, community management | Process IP |
| ZOL | Farcaster / social media ops | Process IP |
| ZAOOS Loop | Research publication (40-80 docs/month) | Process IP + content (docs) |
| ZAOcowork | VPS pipeline, infrastructure | Process IP |
| Bonfire | Knowledge graph, episode logging | Process IP + data (graph) |
| wwtracker bots | Battle analytics | Code (MIT license) + data |
| fractalbotjuly2026 | Fractal governance automation | Process IP |
| ZAOscribe | Documentation | Process IP + content |

**Total operating cost:** Under $1,000/month for all 8 agents
**Documentation:** See doc 1344 (AI-native DAO narrative) + this catalog

---

## Section 6: IP Summary Table

| Asset | Type | Chain/Repo | License | Status |
|-------|------|-----------|---------|--------|
| WaveWarZ platform | SaaS | Solana | Proprietary | Live |
| WaveWarZ public API | API | Solana | Open (no auth) | Live |
| wwtracker | Software | GitHub | MIT | Active |
| ZAOOS | Research | GitHub | CC-BY (pending) | Active |
| OG token | Governance token | Optimism | N/A | Live |
| ZOR token | NFT/token | Optimism | N/A | Live |
| OREC | Smart contract | Optimism | N/A | Live |
| COC Concertz episodes | Content | Arweave | Artist + ZAO | Ongoing |
| ZAOville episodes | Content | Arweave | Artist + ZAO | Ongoing |
| ZAOstock 2026 | Event | [Arweave post-event] | Artist + ZAO | Planning |
| AI fleet methodology | Process | ZAOOS docs | CC-BY (pending) | Live |

---

## Section 7: IP Actions Needed

1. **Add CC-BY 4.0 to ZAOOS root README** — enables researchers to freely cite. 15-minute task.
2. **ZOE: fill Arweave links** for COC Concertz and ZAOville tables above
3. **Register ZAO in DAOstar** (daostar.org) — indexes governance contracts in academic DAO registry. 30-minute self-serve. (See doc 1351 template R-A04)
4. **wwtracker: confirm MIT license is in repo** — verify LICENSE file exists
5. **ZAOstock post-event:** archive to Arweave and add link to this doc's Section 3C

---

*Created: 2026-07-17 | CANONICAL — update as new IP is created | ZOE: fill Arweave links for COC Concertz and ZAOville tables | Related: 1280, 1312, 1330, 1339, 1344, 1349, 1351*
