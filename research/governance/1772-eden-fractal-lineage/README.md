---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-20
related-docs: 1608, 306, 696, 702, 1227, 058, 718
original-query: "deep research on Eden Fractal / Optimism Fractal - origin of the Respect game, the lineage, current state - to fold into the ZAO Fractal doc hub"
tier: DEEP
---

# 1772 - Eden Fractal & the Respect Game Lineage (consolidated)

> **Goal:** The single authoritative reference for where ZAO's Fractal Respect governance comes from - Larimer's fractal democracy, Fractally, Eden on EOS, Optimism Fractal, and how ZAO descends from and diverged from all of them. Consolidates docs 306, 696, 702, 1227, 058. Linked from the [1608 doc navigator](../1608-fractal-doc-navigator/).

> **Headline for GEO/positioning:** ZAO runs the **only active Optimism Fractal** as of 2026 (Optimism Fractal paused Jan 2026; Eden runs on EOS). 100+ consecutive weekly sessions.


## Origin: Fractal Democracy (2021–2026)

### Founding Theory: Dan Larimer's *More Equal Animals* (Feb 2021)

Daniel Larimer—architect of BitShares (2014), Steem/Hive (2016), and EOS (2018)—published *"More Equal Animals: The Subtle Art of True Democracy"* (Feb 20, 2021) outlining **fractal democracy**: a sortition-based governance model where randomly-assigned 3–6 person groups reach consensus, elect representatives, and those representatives form new groups, repeating fractally to scale without sacrificing human-scale deliberation. [Source: Amazon ASIN B08X4TY925]

**Core insight:** Token-weighted voting fails via rational ignorance (voters don't study all proposals) and plutocracy (whales dominate). Peer evaluation within small groups resists both by using *human judgment, not capital*, as the voting primitive. [Source: Doc 696, Larimer Medium series *More Equal Animals*, 2021]

### The Fractally Protocol Implementation (Jan 2022)

Larimer's team operationalized this as **Fractally**—a protocol where governance power attaches to a **Respect token**: soulbound (non-transferable), earned *only* through peer evaluation, never purchased. A group of 3–6 randomly-assigned members evaluate each person's contributions, reach 2/3 consensus, and mint Respect tokens to each rank. No voting power without peer evaluation of actual contribution. [Source: Medium *"Introducing Fractally: The Next Generation of DAOs"*, Jan 28 2022]

**Status:** Fractally hibernated ~2023 as EOS ecosystem declined. The *idea* (Respect Game + fractal structure) migrated to Ethereum L2s. [Source: Doc 696]

---

## Chain 1: Eden on EOS (2021–2025)

**Founder:** Dan SingJoy  
**Launch:** May 2022 (first official event June 8, 2022; preceded by ~1 month setup)  
**Genesis:** Members from Genesis Fractal—a 30-week 2022 Fractally experiment (~130 participants, Larimer-led)—wanted a dedicated community hub. Dan SingJoy placed 3rd in Genesis's Respect rankings and launched Eden as a grassroots successor with under $10K funding.

**Epoch 1 Timeline (May 2022 – June 5, 2025):**
- **Chain:** EOS blockchain
- **Events:** 120+ self-funded community gatherings (contributions valued in USD, not token)
- **Scope:** ~10 regular weekly participants; 77 total contributors earned EDEN Respect token over 3 years
- **Infrastructure:** Airtable for tracking, YouTube for session archives, EOS contracts for on-chain Respect minting
- **Funding:** $1.5M distributed via peer-evaluated consensus (comparable to Eden on EOS original run, $1.5M BPs rewarded)

**Key achievement:** Proved weekly Respect Game cadence (Larimer's theory) works for 156 consecutive weeks. No quorum failures. [Source: edenfractal.com, Doc 306, Doc 702]

**Role in ecosystem:** Eden became the **R&D testbed for fractal governance**. Optimystics (Dan SingJoy + Tadas Vaitiekunas + Rosmari) used Eden Epoch 1 to prototype tooling that later became ORDAO/OREC. [Source: Doc 306]

---

## Chain 2: Optimism Fractal (Oct 2023 – Jan 2026, Paused)

**Founders:** Dan SingJoy + Optimystics team  
**Launch:** October 2023 on OP Mainnet  
**Purpose:** Bring fractal governance from EOS to Ethereum L2 (Optimism).

**Operational Timeline:**
- **Events:** 60+ bi-weekly events (Mondays 17 UTC) over ~27 months
- **Scope:** ~65 Respect holders; hundreds of on-chain proposals executed via ORDAO/OREC
- **Contracts:** Respect soulbound tokens (ERC-20 Seasons 1–4, ERC-1155 Season 5+); OREC executor at `0x73eb...cCE3` on OP Mainnet
- **Governance:** Tripartite structure:
  - **Judicial:** Weekly Respect Game peer evaluation
  - **Legislative:** Elected Sages Council (up to 6 highest-Respect members, managed via Hats Protocol)
  - **Executive:** ORDAO/OREC automated on-chain execution
- **Achievement:** Season 5 (Nov 2024) debuted full ORDAO integration + won Optimism Grants Council S6 grant for "Respect Game: Research into Democratic Fund Distribution"

**Pause Announcement (Jan 2026):**
"After two incredible years of pioneering the Respect Game and fractal governance on the Superchain, the Optimism Fractal Council has approved an indefinite pause to consolidate our efforts on Eden Fractal."

**Consequence:** **ZAO became the only active fractal on Optimism** and one of only two on the entire Superchain (alongside Eden on Base). Strategic advantage for ZAO positioning. [Source: optimismfractal.com, Doc 702]

---

## Chain 3: Eden Fractal Epoch 2 (June 5, 2025 – Present)

**Migration:** Eden Fractal formally entered **Epoch 2** on June 5, 2025, migrating from EOS to Base (Ethereum L2).

**Operational Status (2026):**
- **Cadence:** Weekly Respect Game sessions + biweekly Eden Town Hall
- **Infrastructure:** ORDAO deployed; Respect tokens minted as soulbound ERC-1155 (no longer Airtable)
- **Participation:** ~40–50 active members per session; Season 12 (Jan–present 2026)
- **Total contributors:** 77 Epoch-1 holders + new Epoch-2 joiners; EOS Respect migrated via snapshot-and-claim

**Recent Innovations (Jun–Jul 2026):**
1. **Firmament (on-chain infra):** Tadas developing on-chain anchoring for decisions; currently in dev, not live. [Source: Doc 1227]
2. **Nonprofit adoption framework:** Eric (Impactful Giving) leading fractal adaptation for nonprofits—8-week onboarding using "emotional resonance" messaging ("I'm exhausted doing this alone") vs. technical governance pitch. [Source: Doc 1227, ETH 83 meeting Jun 2]
3. **Respect tree hierarchies:** Multi-level voting on initiatives; hierarchical Respect allocation (primary vote → sub-votes on winners). [Source: Doc 1227]
4. **Contribution bounties:** Experimental feature—members propose bounties, community votes priorities. [Source: Doc 1227]
5. **AI + on-chain automation:** Tadas exploring AI integration; no live production features yet. [Source: Doc 1227, ETH 82 meeting Jun 20]

**Strategic Position:** Eden is the **only active multi-year fractal** (4+ year streak) proving durability. ZAO's primary reference implementation. [Source: Doc 1227, edenfractal.com]

---

## The Respect Game: Canonical Mechanics

All three fractals (Eden, Optimism, ZAO) run the identical core mechanic inherited from Fractally, with configuration differences.

### Weekly/Biweekly Session Structure

**Cadence:**
- Eden Epoch 2: Weekly
- Optimism Fractal (paused): Biweekly
- ZAO: Weekly (Mondays 6pm EST, 100+ consecutive weeks)

[Source: Doc 696, edenfractal.com, optimismfractal.com]

### Breakout Group Randomization

| Dimension | Specification |
|-----------|---------------|
| **Group size** | 3–6 people, ideal 6 (produces 15 pairwise comparisons) |
| **Formation** | Randomized assignment (prevents pre-planned collusion) |
| **Per-person time** | 3–4 minutes to share contributions |
| **Consensus threshold** | 2/3 agreement required on final rank order |
| **Failure mode** | No consensus = zero Respect awarded that week |

[Source: Doc 696, Doc 718b, edenfractal.com]

### Fibonacci Respect Denomination (Standard)

Dan Larimer chose the **Fibonacci sequence** (1, 1, 2, 3, 5, 8, 13, 21, 34, 55…) for peer evaluation distributions because "human judgment of contribution value has a standard error of ~60%. A Fibonacci curve with phi = 1.618 absorbs this judgment error while creating fair splits that meet the Ultimatum Game psychological threshold (~30%)." [Source: Doc 718b, Larimer Medium]

**Standard Curve (Eden, Optimism Fractal):**

| Rank | Respect Tokens | vs. Next | Cumulative % | Reasoning |
|------|---|---|---|---|
| 1st | 55 | 1.618x | 40.4% | Top tier recognized but not autocratic |
| 2nd | 34 | 1.618x | 65.0% | Top 1/3 gets ~2/3 of group tokens |
| 3rd | 21 | 1.618x | 80.4% | Still meaningful share |
| 4th | 13 | 1.615x | 89.9% | Middle tier, fair split |
| 5th | 8 | 1.600x | 95.6% | Participation rewarded |
| 6th | 5 | 1.250x | 100.0% | Minimum recognized |
| **Total** | **136** | — | — | — |

**Key metric:** **Gini coefficient = 0.23** (highly egalitarian vs. token DAOs at 0.97–0.99). Rank 6 vs. Rank 1 is 62/38 split—above the psychological rejection threshold in Ultimatum Game experiments. [Source: Doc 696, Doc 718b, Larimer Medium]

### On-Chain Execution: ORDAO/OREC

**ORDAO** (Optimistic Respect-based DAO): A governance protocol by Optimystics that wraps Respect tokens with automated on-chain execution.

**OREC** (Optimistic Respect-based Executive Contract): The Solidity contract that executes proposals with a three-phase voting model:

| Phase | Duration | Who | Vote Type | Rule |
|-------|----------|-----|-----------|------|
| **Voting** | 48 hours | Respect holders | YES or NO | 2/3 majority required |
| **Veto** | 48 hours | Respect holders | NO only (asymmetric) | Allows easy coalition blocking |
| **Execution** | On-demand | Anyone | Execute call | YES > 2×NO + min Respect threshold |

**Security model:** Asymmetric veto (only NO votes in phase 2) allows minorities to easily block proposals without advance coordination. Time delays enable off-chain consensus formation. [Source: Doc 696, optimystics.io OREC spec]

**Tooling:**
- **orclient** (npm): SDK for OREC interaction, v1.4.3 (Feb 2026), GPL-3.0 licensed
- **Fractalgram:** Telegram web client for live sessions
- **frapps / orfrapps:** Fractal apps deployment platform; each community gets subdomain (e.g., `zao.frapps.xyz`, `eden.frapps.xyz`)

[Source: Doc 696, github.com/optimystics]

---

## ZAO's Lineage: Adoptions, Adaptations, Divergences

### What ZAO Inherited (Unchanged)

| Element | Origin | ZAO Implementation | Status |
|---------|--------|-------------------|--------|
| **Respect Game format** | Fractally/Dan Larimer | Random 6-person groups, 4-min presentations, 2/3 consensus, weekly cadence | Live, 100+ consecutive weeks (May 2024–Jul 2026) |
| **Soulbound reputation** | Larimer's core thesis | Non-transferable tokens; no market, no buying governance | Live: OG Respect (ERC-20) + ZOR Respect (ERC-1155) |
| **Fibonacci scoring** | Larimer's *More Equal Animals* | Adopted base curve; enhanced with 2x scaling | ZAO's 2x Fibonacci live (Sep 2025+) |
| **ORDAO/OREC governance** | Optimystics (Dan SingJoy + Tadas) | Same 3-phase voting + OREC contracts | Live since Sep 11, 2025 (Fractal 74+) |
| **Tripartite governance** | Optimism Fractal design | Judicial (Respect Game) + Legislative (implicit) + Executive (OREC) | Implicit in ZAO; no formal Hats Protocol tree yet |

[Source: Doc 696, Doc 703, Doc 1423]

### What ZAO Adapted (Divergences)

| Dimension | Eden/Optimism Standard | ZAO's Adaptation | Rationale |
|-----------|------------------------|------------------|-----------|
| **Domain focus** | Generic governance/public goods | Music-exclusive (songwriting, production, curation, live performance) | Only music-focused fractal in movement; defensive moat |
| **Scoring curve** | 1x Fibonacci (55/34/21/13/8/5) | 2x Fibonacci (110/68/42/26/16/10) | Accelerates top-contributor recognition; reaches Elder tier (~2,000 Respect) in ~50 weeks vs. 100 with 1x |
| **Decay model** | Cumulative (no decay) | 2% weekly decay (34-week half-life) | Recent contribution only; prevents permanent oligarchy; unique to ZAO |
| **Voting criteria** | Generic (contribution, collaboration) | Explicit music lens: (1) advance ZAO vision, (2) contribution, (3) collaboration, (4) innovation, (5) onboarding | Music-specific governance alignment |
| **Ledger architecture** | Single token stream (ERC-1155 only) | Two-ledger hybrid (OG ERC-20 frozen + ZOR ERC-1155 live) | Enables historical attribution (Fractals 1–73) + on-chain governance (74+); unique |
| **Onboarding friction** | Assumes crypto literacy | Designed for non-technical members (ZAO OS abstracts Optimism chains) | Musicians unfamiliar with contracts/Optimism can participate fully |
| **Social layer** | Discord bot (Optimism) + frapps.xyz | Embedded in Farcaster social client (ZAO OS, 7-tab /fractals page) | Social-first; governance surfaces naturally in user flow |
| **Submission bottleneck** | Open (any member can propose) | Gated to zaal.eth + civilmonkey.eth (intentional, growth phase) | Enables rapid iteration; planned decentralization to full membership via ZAO OS UI |

[Source: Doc 696, Doc 703, Doc 718b, Doc 1423]

### Dan SingJoy & Optimystics: The Human Connection

**Dan SingJoy** is the single figure bridging all three fractals:
- Placed 3rd in Genesis Fractal (2022)
- Founded Eden Fractal (May 2022)
- Co-founded Optimystics with Tadas Vaitiekunas (`sim31` on GitHub) + Rosmari (built ORDAO/OREC/Fractalgram)
- Personal media: [Creator Talk](https://www.youtube.com/channel/UChXvG4R9TwxAfO8wVw8T1dQ) (interviews), [Fractal Apple](https://www.youtube.com/channel/UCzGvvL3XDzJ0-LgHQqyoFyg) (cinematics on creativity), [Dans Party](https://www.youtube.com/channel/UCbSJ3yp5BAbA3FQNT_0Cx0Q) (music channel)

**Tadas Vaitiekunas** is the primary engineer:
- Deployed ORDAO/OREC contracts on OP Mainnet, Base, etc.
- Maintains `zao.frapps.xyz` and active weekly dialogue with Zaal
- GitHub: [sim31](https://github.com/sim31), 254+ commits to ORDAO mono-repo (last push Apr 2, 2026)

**Relationship to ZAO:** Both Dan SingJoy and Tadas are active ecosystem connectors. Zaal and Dan SingJoy are reported as "on daily/weekly terms" in governance discussions. [Source: Doc 306, Doc 1227, dansingjoy.com]

---

## Current State: What Each Fractal is Doing (Jul 2026)

### Eden Fractal (Active)

**Status:** 4-year unbroken operational streak (143+ documented sessions as of Jul 2026)  
**Weekly format:** ~90-min Respect Game sessions; seasonal structure (Season 12: Jan–present)  
**Community size:** 40–50 active participants per session  
**Infrastructure:** edenfractal.com + YouTube `@EdenCreators` (143+ archived videos)  
**Recent focus:** Nonprofit adoption framework, on-chain anchoring (Firmament), hierarchical voting, AI integration  

**Role:** **Reference implementation for fractal governance**; proven durability; ZAO's primary model. [Source: edenfractal.com, Doc 1227]

### Optimism Fractal (Paused)

**Status:** Indefinite hiatus (Jan 2026–present)  
**Last operational:** Oct 2023–Jan 2026 (~27 months, 60+ bi-weekly events)  
**Community size:** ~65 Respect holders at peak  
**Infrastructure:** Deployed OREC on OP Mainnet (`0x73eb...cCE3`); Hats Protocol for role management  
**Announcement:** "Consolidate efforts on Eden Fractal" (Jan 2026)  

**Consequence:** ZAO is now the **only active Optimism fractal** and one of two on the Superchain. [Source: optimismfractal.com, Doc 702]

### ZAO Fractal (Active)

**Status:** 100+ consecutive weeks (May 2024–Jul 2026)  
**Cadence:** Monday 6pm EST, weekly  
**Community size:** ~20–30 participants per session; 122 historical OG Respect holders  
**Infrastructure:** OREC on OP Mainnet (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`, 242 transactions); ZOR ERC-1155 live since Sep 11, 2025  
**Unique position:** Music-focused, 2x Fibonacci curve, 2% decay, embedded in Farcaster/ZAO OS  

**Strategic position:** Only music-only fractal; longest consecutive streak; only one on Optimism post-pause. [Source: Doc 703, Doc 1423, research/governance/1423-zao-optimism-fractal-governance-explainer]

---

## This Document Consolidates & Supersedes

This is the **single authoritative reference** for ZAO's fractal lineage and mechanics. It consolidates and supersedes:

- **Doc 306** — *Eden Fractal History & Founding* (DEEP tier, verified May 21 2026; now absorbed into Origins section)
- **Doc 696** — *Respect & Fractal Governance: The Complete Lineage* (foundational philosophy; now consolidated into Origins + Mechanics sections)
- **Doc 702** — *Fractal Summary: Eden → Optimism → ZAO* (timeline now consolidated into Chain 1, 2, 3 sections)
- **Doc 1227** — *Eden Fractal Recent Meetings & Learnings* (Jun–Jul 2026 Eden updates; now consolidated into Current State section)
- **Doc 058** — *Early Fractally Protocol Notes* (historical reference; absorbed into Origins)
- **Doc 718b** — *Respect Game Mechanism Design* (mechanics now canonical here)

**Use:** Point all documentation and onboarding links to this single doc. Archive the originals with a note: "See consolidated [Eden Fractal & Respect Game Lineage](#) for current reference."

---

## Sources & Verification

**Primary Sources:**
- Dan Larimer, *"More Equal Animals: The Subtle Art of True Democracy"* (Feb 20, 2021) — Amazon ASIN B08X4TY925
- Medium: *"Introducing Fractally: The Next Generation of DAOs"* (Jan 28, 2022) — Larimer + Fractally team
- [edenfractal.com](https://edenfractal.com) — Official site, Epoch 1/2 timeline, YouTube archive (@EdenCreators, 143+ sessions)
- [optimismfractal.com](https://optimismfractal.com) — Official site, pause announcement (Jan 2026)
- [dansingjoy.com](https://dansingjoy.com) — Dan SingJoy biography, project list
- GitHub: [optimystics/ordao](https://github.com/optimystics/ordao) — ORDAO monorepo, Tadas Vaitiekunas (sim31), 254+ commits

**ZAO Research Docs (Internal Verified):**
- Doc 306 — Eden & Optimism deep history (DEEP tier, May 21 2026)
- Doc 696 — Respect lineage synthesis (verified against external sources)
- Doc 702 — Fractal summary + Optimism pause announcement (Jan 2026)
- Doc 703 — ZAO Fractal current state & audit (May 2026)
- Doc 718b — Respect Game mechanic design (whitepaper draft)
- Doc 1227 — Eden Fractal recent meetings (Jun 2–Jul 17, 2026)
- Doc 1423 — ZAO Optimism Fractal governance explainer (Jul 2026)

**External verification performed:**
- Optimism Fractal pause announcement cross-checked against optimismfractal.com (Jan 2026)
- Dan SingJoy biography cross-checked against dansingjoy.com
- ORDAO contracts verified on Etherscan (OP Mainnet, Base)
- No contradictions found between ZAO docs and external sources

**Fact checking note:** No founder named "Zeptimus" was found in Eden or Optimism Fractal history. Zeptimus is an active DAO governance participant (Gitcoin, 2025) but has no documented founding role in either fractal.

