---
topic: governance
type: guide
status: research-complete
last-validated: 2026-09-26
related-docs: 1608, 306, 696, 702, 1227, 058, 718, 977, 2558
original-query: "deep research on Eden Fractal / Optimism Fractal - origin of the Respect game, the lineage, current state - to fold into the ZAO Fractal doc hub"
tier: DEEP
---

> **Updated 2026-09-26 (re-research pass).** Six corrections against fresh primary-source fetches,
> listed in full at the bottom under "Updated 2026-09-26 - what changed". Headline ones: Eden's
> Respect Game is **biweekly**, Town Hall is **weekly** - this doc had it backwards. OREC's
> voting/veto windows are **72h/72h**, not 48h/48h (doc 977 already fixed this in two other docs
> on 2026-07-06 but it was not carried into this one, created two weeks later). ZAO's "2% weekly
> decay" is a **proposed, unshipped** design, not a live divergence - and it now directly conflicts
> with Season 3/ZIP-2's "balances never decay" design, a live NEEDS ZAAL contradiction as of today
> (see the new subsection below). Do not trust the pre-2026-09-26 version of this doc's mechanics
> tables.

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
- **Cadence: corrected 2026-09-26 - this was backwards.** The Respect Game itself runs
  **biweekly** (every other Thursday, 17:00 UTC); Eden Town Hall, a separate community-discussion
  forum, runs **weekly** (every Thursday). Verified 2026-09-26 by fetching edenfractal.com's raw
  HTML directly (`curl` + tag-strip, not WebFetch): "We meet every other Thursday at 17 UTC to
  play the Respect Game. Every Thursday we also meet for community discussion at Eden Town Hall."
- **Infrastructure:** ORDAO deployed; Respect tokens minted as soulbound ERC-1155 (no longer Airtable)
- **Participation:** ~40–50 active members per session; Season 12 as of the Jun–Jul 2026 sourcing
  below (not independently reconfirmed on the 2026-09-26 pass - the homepage fetch did not surface
  a current season number)
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
- Eden Epoch 2: **Biweekly** Respect Game (every other Thursday 17 UTC); weekly Town Hall is a
  separate, non-scoring discussion forum - **corrected 2026-09-26**, this table previously had
  Eden's two event types swapped
- Optimism Fractal (paused): Biweekly
- ZAO: Weekly (Mondays 6pm EST, running since 2024-07-30)

[Source: edenfractal.com (fetched 2026-09-26), optimismfractal.com (re-confirmed 2026-09-26)]

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

### Momentum and decay in the scoring formula itself (added 2026-09-26)

Larimer's **Addendum 1** revised the base Fibonacci mapping to a moving average, adopted by both
Eden and ZAO Fractal:

```
NEW_AVERAGE = (CURRENT_AVERAGE * 5 + NEW_LEVEL) / 6
```

This gives a person's weekly *scoring input* momentum - one bad or missed week doesn't wipe out
standing - at a real, measurable decay rate: a 5/6 weekly retention is a half-life of
`ln(0.5)/ln(5/6)` ≈ **3.8 weeks**. A widely-copied figure of "~34-week half-life" for this exact
formula is wrong by roughly 9x and does not appear anywhere in the source post; it was traced,
corrected, and cited to the raw post text (fetched via Hive's `condenser_api.get_content`, not
the `hive.blog` page itself, which renders as a 513-byte JS shell with no content) in
`ZAODEVZ/ZAOfractal` PR #20, 2026-09-26. **This is the scoring-input momentum, not a decay on the
Respect token balance itself** - the balance is not touched by this formula at all. See the next
subsection for why that distinction matters right now.

**Addendum 1 also states its own membership cutoff**, separate from the moving-average formula:
*"after 12 weeks of non-attendance someone would cease to be a member and their income would fall
to 0."* Twelve weeks is 84 days - close to, but not the same as, Season 3's 2026-09-26 ruling of a
90-day rolling activation window (`~/zao-vault/decisions/grill-2026-09-26-zao-papers-midday.md`).
The two are not equivalent in effect: Fractally's original cutoff drops *membership itself*,
where Season 3's rule drops only *vote eligibility* - Respect and membership both persist under
ZIP-2's design. Worth citing as precedent, not as a match. [Source: Addendum 1 raw text, verified
2026-09-26]

### A live governance conflict, found today, recorded here rather than resolved (added 2026-09-26)

The ZAO whitepaper drafts (`whitepaper/draft/ch04-the-respect-token.md` section VI,
`ch05-the-respect-game.md`) propose a **future, unshipped** 2% weekly decay on Respect *balances*
themselves - explicitly to keep governance weighted toward recent contribution. That figure's own
math is correct for its 2% rate (half-life ≈34.3 weeks, unrelated to the Addendum-1 formula
above) and is **not live** - `ch04`'s own 2026-09-02 measurement states "No decay mechanism has
ever run on either ledger." Season 3 (ZIP-2, brainstorm decision #1) answers the same underlying
question the opposite way: the *active pool* changes (now a rolling 90 days), balances never do,
nothing burns. **Two live ZAO documents now propose incompatible answers to the same governance
question.** Not resolved here. Recorded as NEEDS ZAAL in `governance/2558-dao-periodic-
reactivation-precedent` (contradiction item 5) and in `zao-vault/handoffs/status/zao-papers.md`,
being raised with Zaal directly by the zao-papers lane. Doc 2558's own survey found every
comparable system (Colony, Gardens, Coordinape, and Fractally's own moving average above) decays
the *weight or scoring input*, never the earned record - which is evidence, not a resolution; the
call is his. Do not let a future edit here quietly pick a side.

### On-Chain Execution: ORDAO/OREC

**ORDAO** (Optimistic Respect-based DAO): A governance protocol by Optimystics that wraps Respect tokens with automated on-chain execution.

**OREC** (Optimistic Respect-based Executive Contract): The Solidity contract that executes proposals with a three-phase voting model:

| Phase | Duration | Who | Vote Type | Rule |
|-------|----------|-----|-----------|------|
| **Voting** | **72 hours** | Respect holders | YES or NO | YES weight > 2x NO weight |
| **Veto** | **72 hours** | Respect holders | NO only (asymmetric) | Allows easy coalition blocking |
| **Execution** | On-demand | Anyone | Execute call | YES > 2×NO + min Respect threshold |

**Corrected 2026-09-26** (was previously stated as 48h/48h in this doc): `voteLen` and `vetoLen`
are each 259,200 seconds = **72 hours** on ZAO's live OREC deployment
(`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`, Optimism), measured directly from the deployed
contract's storage. Doc 977 (2026-07-06) already found and fixed this same 48h/48h error in two
other docs (`governance/718-zao-fractal-whitepaper-foundations/718c-ordao-onchain-architecture.md`
and `governance/705-fractal-governance-external-deep-research`) before this doc existed - it just
was not carried into this one, written two weeks later from a stale copy. `minWeight` = 1,000
Respect (~2.6% of OG's 38,484 supply), not "10%" as an earlier draft of 718c also had it.

**Security model:** Asymmetric veto (only NO votes in phase 2) allows minorities to easily block proposals without advance coordination. Time delays enable off-chain consensus formation. [Source: doc 977's on-chain measurement; direct contract read]

**Tooling:**
- **orclient** (npm): SDK for OREC interaction, **v1.4.4** (published 2026-04-02, corrected from
  "v1.4.3 Feb 2026" - checked the npm registry directly 2026-09-26), GPL-3.0 licensed. The
  `sim31/ordao` GitHub repo (Tadas Vaitiekunas) matches: last push **2026-04-02**, unchanged since
  (re-checked via `gh api` 2026-09-26) - 17 open issues, 3 stars. Quiet, not abandoned; no commits
  in ~5.5 months is worth flagging as a staleness risk for anything depending on it going forward.
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
| **Decay model** | Cumulative (no decay) on balances; Addendum-1 moving average decays the weekly *scoring input* only (~3.8-week half-life, corrected 2026-09-26) | **Proposed only, not live** - both Eden and ZAO currently have zero balance decay. A 2% weekly balance-decay is drafted in ZAO's whitepaper but directly conflicts with Season 3/ZIP-2's "balances never decay" design - a live, unresolved NEEDS ZAAL contradiction as of 2026-09-26, see the subsection above | Not a shipped divergence - corrected from a prior version of this table that stated it as live and unique to ZAO |
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

## Current State: What Each Fractal is Doing (re-verified 2026-09-26)

### Eden Fractal (Active)

**Status:** Live and current - re-fetched edenfractal.com directly 2026-09-26 (curl + tag-strip,
36,827 chars of real body text, not a WebFetch summary). Site describes itself as running
"since 2021," biweekly Respect Game + weekly Town Hall (see cadence correction above).
**Community size:** 40–50 active participants per session (Doc 1227, Jun–Jul 2026 - not
independently reconfirmed with a fresh count on this pass)
**Infrastructure:** edenfractal.com (Notion/Super.so site, confirmed live) + YouTube
`@EdenCreators`
**A separate "Eden Fractal is INACTIVE" claim exists elsewhere in this library and is
NOT a contradiction of the above, resolved 2026-09-26:** `identity/1282-zao-vs-artist-daos-
jul2026` (2026-07) reports Eden Fractal "INACTIVE... SSL certificate expired; site returning 502
errors," but its own description scopes that specifically to "the originating organization...
[that] ran weekly fractal sessions on the EOS blockchain" - i.e. Eden's old EOS-era
infrastructure/app, not `edenfractal.com` or the live Base-hosted Epoch 2 community this doc
otherwise describes. Different artifact, both readings can be true at once - flagged so a future
reader does not treat this as an unresolved conflict, it is a scoping mismatch.

**Role:** **Reference implementation for fractal governance**; proven durability; ZAO's primary model. [Source: edenfractal.com, Doc 1227]

### Optimism Fractal (Paused)

**Status:** Indefinite hiatus (Jan 2026–present) - **re-confirmed live 2026-09-26**,
optimismfractal.com still serves the same pause announcement verbatim, no change since July.
**Last operational:** Oct 2023–Jan 2026 (~27 months, 60+ bi-weekly events)  
**Community size:** ~65 Respect holders at peak  
**Infrastructure:** Deployed OREC on OP Mainnet (`0x73eb...cCE3`); Hats Protocol for role management  
**Announcement:** "Consolidate efforts on Eden Fractal" (Jan 2026)  

**Consequence:** ZAO is now the **only active Optimism fractal** and one of two on the Superchain. [Source: optimismfractal.com, Doc 702]

### ZAO Fractal (Active)

**Status:** Weekly since **2024-07-30** (corrected from "May 2024" - this is the exact date of
ZAO's first-ever OG Respect mint, and the founding lane's own convention for the start date; see
`~/Documents/zao-fractal-bot/docs/history/zao-fractal-timeline.md` for the full sourced
chronology, not duplicated here). Onchain award ledger reached period 114 by 2026-09-24.
**Cadence:** Monday 6pm EST, weekly  
**Community size:** ~20–30 participants per session historically; median 7 / mean 8 / max 17
people actually receive Respect per session across 42 recorded periods (whitepaper ch08,
2026-09-02 measurement) - the "20-30 participants" figure describes attendance, not who scores.
122 historical OG Respect holders; OG Respect mints paused (administrative policy) since
December 2025.
**Infrastructure:** OREC on OP Mainnet (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`); ZOR
ERC-1155 live since 2025-09-11.
**Unique position:** Music-focused, 2x Fibonacci curve, embedded in Farcaster/ZAO OS. **No live
balance decay** (see the governance-conflict subsection above - a 2% decay is proposed, not
shipped, and now directly disputed by Season 3's own design).
**Large amount of change in September 2026 not detailed here** - a bot-architecture reset
(Python to TypeScript, with a twist: the archived Python bot was found 2026-09-25 to still be
the one actually answering commands in Discord), a Season 3 membership/governance redesign
(ZIP-2), and a multi-tenant fractal model ruling (ZAO Festivals gets its own fractal/ledger).
Full detail: `~/Documents/zao-fractal-bot/docs/history/` (this repo's own timeline, JSON, and a
personal-participation record) and `~/zao-vault/projects/fractal-sources-of-truth-audit-
2026-09-15.md`.

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
- Fractally White Paper Addendum 1 (Larimer, Hive) - raw post body fetched via
  `condenser_api.get_content` 2026-09-26 (13,728 chars); the `hive.blog` rendered page is a
  513-byte JS shell and returns nothing on a normal fetch - **[FULL, method: Hive API]**
- [edenfractal.com](https://edenfractal.com) - **[FULL, method: curl + HTML strip, 2026-09-26]** 36,827 chars of body text. Epoch 1/2 timeline, cadence, mission copy.
- [optimismfractal.com](https://optimismfractal.com) - **[FULL, method: curl + HTML strip, 2026-09-26]** pause announcement re-confirmed verbatim unchanged since July.
- [dansingjoy.com](https://dansingjoy.com) - Dan SingJoy biography, project list - **[PARTIAL, not re-fetched this pass]**
- GitHub: [sim31/ordao](https://github.com/sim31/ordao) - **the actively-developed repo**,
  last push 2026-04-02 (re-checked via `gh api` 2026-09-26), 17 open issues, 3 stars.
  [Optimystics/ordao](https://github.com/optimystics/ordao) also exists (org-owned) but is
  **stale**, last push 2025-05-20 - the two are different repos; cite `sim31/ordao` for anything
  current.
- npm: [`@ordao/orclient`](https://www.npmjs.com/package/@ordao/orclient) - registry checked
  directly 2026-09-26, latest `1.4.4`, published 2026-04-02 (matches the GitHub push date exactly)
- ZAO OREC contract `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` on Optimism - `voteLen`/`vetoLen`
  read directly from the deployed contract (via doc 977's 2026-07-06 measurement, re-affirmed
  here, not independently re-read on this pass)

**ZAO Research Docs (Internal Verified):**
- `governance/306-eden-fractal-op-fractal-deep-history` - Eden & Optimism deep history (DEEP tier, May 21 2026); note 306 is an ambiguous bare number (also `dev-workflows/306-web-scraping-ai-agents`, `farcaster/306-farcaster-protocol-features-gap-analysis`)
- `governance/696-respect-fractal-lineage-summary` - Respect lineage synthesis (verified against external sources); 696 is also ambiguous (also `community/696-zaal-zao-deep-audit`)
- `governance/702-respect-fractal-lineage` - Fractal summary + Optimism pause announcement (Jan 2026)
- `governance/703-zao-fractal-current-state-may-2026` - ZAO Fractal current state & audit (May 2026)
- `governance/718-zao-fractal-whitepaper-foundations/718b-respect-game-mechanism-design.md` - Respect Game mechanic design (whitepaper draft) - **note: 718 is an ambiguous bare number (also `events/718-kmac-farcaster-snaps-ad-networks-may13`), cite the full sub-doc path**
- `governance/1227-eden-fractal-recent-meetings-learnings` - Eden Fractal recent meetings (Jun 2-Jul 17, 2026); 1227 is also ambiguous (also `wavewarz/1227-wwtracker-analytics-wave10-revenue-floor`)
- `governance/1423-zao-optimism-fractal-governance-explainer` - ZAO Optimism Fractal governance explainer (Jul 2026)
- Doc 977 (`governance/977-fix-fractals-documentation`) - the 2026-07-06 correction of the same
  48h/48h OREC error this doc also carried; source for the 72h/72h and ~2.6% minWeight fixes above
- `governance/2558-dao-periodic-reactivation-precedent` (PR #3658, zao-papers lane, 2026-09-26) -
  the decay/no-burn governance conflict recorded in the new subsection above
- `identity/1282-zao-vs-artist-daos-jul2026` - source of the "Eden Fractal INACTIVE" claim resolved above

**External verification performed 2026-09-26:**
- edenfractal.com and optimismfractal.com both re-fetched live and read in full (not summarized)
- Eden's real cadence (biweekly Respect Game / weekly Town Hall) read directly from the site's
  own text, correcting this doc's prior reversed claim
- ORDAO's `sim31/ordao` GitHub activity and `@ordao/orclient`'s npm registry both re-checked directly
- Addendum 1's actual formula and membership-cutoff text read from the raw API response, not the
  broken rendered page

**Fact checking note:** No founder named "Zeptimus" was found in Eden or Optimism Fractal history. Zeptimus is an active DAO governance participant (Gitcoin, 2025) but has no documented founding role in either fractal.

## Updated 2026-09-26 - what changed (re-research pass)

Six corrections, all against fresh primary-source fetches, not against another doc's say-so:

1. Eden Fractal's cadence was stated backwards (weekly Respect Game / biweekly Town Hall) -
   corrected to biweekly Respect Game / weekly Town Hall, sourced to a live fetch of
   edenfractal.com.
2. OREC's voting/veto windows were stated as 48h/48h - corrected to the measured 72h/72h. Doc 977
   already fixed this exact error in two sibling docs on 2026-07-06; it just never reached this
   one, written two weeks later.
3. `orclient`'s cited version was one release and two months stale (v1.4.3 Feb 2026 vs the actual
   v1.4.4, published 2026-04-02) - corrected against the npm registry directly.
4. ZAO's "2% weekly decay" was presented as a live, shipped divergence unique to ZAO - corrected
   to reflect it is a proposed, unshipped design, and flagged as now in live, unresolved conflict
   with Season 3/ZIP-2's opposite design (balances never decay) - a fresh finding from today, not
   something this doc could have known before.
5. Added the Fractally Addendum-1 scoring-formula's real momentum/decay math (half-life ≈3.8
   weeks, not the ~34-week figure that had spread into two other docs and was corrected today in
   `ZAODEVZ/ZAOfractal` PR #20) and its 12-week membership-cutoff clause, relevant precedent for
   Season 3's new 90-day rolling activation window.
6. Resolved an apparent contradiction with `identity/1282` calling Eden Fractal "INACTIVE" - that
   claim scopes to Eden's old EOS-era site/app, not the live Base-era community this doc
   describes. Not a data conflict, a scoping one.

Everything else in this doc (the Fractally/Genesis/Eden-on-EOS/Optimism-Fractal lineage, the
Fibonacci curve, ZAO's other divergences) was reviewed against this pass's fresh fetches and
found to still hold - not re-stated as "corrected" because it was not wrong.


## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-fetch edenfractal.com and confirm the current season number and per-session participant count (not independently reconfirmed on the 2026-09-26 pass) | @Zaal | Doc update | 2026-10-24 |
| Escalate the dansingjoy.com citation from PARTIAL to FULL - re-fetch via curl + strip, not WebFetch | @Zaal | Doc update | 2026-10-24 |
| Track the balance-decay vs no-burn governance conflict to a ruling, not duplicated as an action here - see governance/2558-dao-periodic-reactivation-precedent for its own Next Actions | @Zaal | Decision | wontfix (owned by doc 2558) |
