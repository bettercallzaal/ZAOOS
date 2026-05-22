---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-20
superseded-by:
related-docs: 56, 58, 102, 103, 104, 109, 114, 115, 184, 285, 306, 346, 498
original-query: "prepare a full summary of respect zao fractal edenfractal optimsm fractal fractally etc"
tier: STANDARD
---

# 696 — Respect & Fractal Governance: The Complete Lineage

> **Goal:** One canonical summary of the entire fractal-governance lineage ZAO sits inside - Fractally, Eden Fractal, Optimism Fractal, ZAO Fractal, the Respect token, and the ORDAO/OREC/frapps tooling - synthesized from the 16 governance research docs that currently hold this knowledge scattered across the library.

## What this doc is

The ZAO governance story is documented across ~16 separate research docs (56, 58, 102-115, 184, 285, 306, etc). This doc consolidates all of it into one readable reference. No new research - this is a synthesis. If you need depth on any one piece, the per-section "see" pointers route you to the source doc.

## The lineage at a glance

```
"More Equal Animals" (Larimer, 2021) - the theory
        |
   Fractally (2022) - the protocol + the Respect token concept
        |
   Eden on EOS (2021) -> Genesis Fractal (2022) - first real implementations
        |
   Eden Fractal (May 2022, EOS -> Base 2025) - the R&D fractal, still running
        |
   Optimism Fractal (Oct 2023, OP Mainnet) - brought it to Ethereum L2; PAUSED Jan 2026
        |
   ZAO Fractal (Aug 2024, Optimism) - the music fractal; 90+ weeks, still running
```

Every fractal in this chain shares the same DNA: a weekly small-group consensus meeting (the Respect Game) that distributes a soulbound reputation token (Respect) on a Fibonacci curve, with on-chain governance (ORDAO/OREC) executing decisions weighted by that Respect. The differences are chain, community focus, and maturity.

| Term | One-line definition |
|------|---------------------|
| **Fractally** | The 2022 governance protocol by Dan Larimer's team that defined fractal democracy + the Respect token. Now dormant. |
| **Respect** | A soulbound (non-transferable, non-tradeable) reputation token earned by peer ranking. Governance weight = Respect. |
| **Respect Game** | The weekly meeting: random groups of ~6, each shares contributions, group ranks members, Respect distributed by rank. |
| **Eden Fractal** | The longest-running practical fractal (since May 2022). Moved EOS -> Base. ZAO's sibling community. |
| **Optimism Fractal** | The fractal that brought the model to Ethereum (OP Mainnet, Oct 2023). Paused Jan 2026, folded into Eden. |
| **ZAO Fractal** | The ZAO's own weekly fractal since Aug 2024. Music-focused. The only active fractal on Optimism. |
| **ORDAO** | Optimistic Respect-based DAO - the governance software stack by Optimystics. |
| **OREC** | Optimistic Respect-based Executive Contract - the on-chain contract that executes proposals. |
| **frapps** | "Fractal apps" - the deployment platform; each fractal gets a subdomain (e.g. `zao.frapps.xyz`). |
| **Optimystics** | The dev team (Dan SingJoy, Tadas Vaitiekunas, Rosmari) that builds ORDAO/OREC/frapps. |

## 1. Fractally - the origin protocol

**Theory.** Dan Larimer - creator of BitShares (2014), Steem/Hive (2016), and EOS (2018) - published the book *"More Equal Animals: The Subtle Art of True Democracy"* in 2021. Its argument: large-group voting fails because of rational ignorance and voter apathy, and token-weighted voting just recreates plutocracy (whoever holds the most tokens wins). The fix is **small-group sortition**: randomly sort everyone into groups of 3-6, each group reaches consensus and elects representatives, those representatives form new groups, and the process repeats - a nested "fractal" that scales to any population while keeping every decision a small-group conversation.

**Fractally the protocol** (announced ~January 2022) turned that theory into a system. Its core primitive is the **Respect token**: a soulbound (non-transferable) reputation token earned only through peer evaluation. Governance power tracks contribution track-record, never capital. Larimer's framing: fractal governance "is more likely to distribute inflation to those producing public goods which grow the value of the currency instead of being siphoned off by insiders and graft."

**The Respect Game mechanics** (inherited by every downstream fractal):
- Random breakout groups of 3-6 people (6 is ideal - it produces 15 pairwise comparisons).
- Each person gets ~4 minutes to describe their contributions.
- The group discusses and collaboratively ranks members 1-6.
- A 2/3 consensus is required on the final ranking.
- Respect is distributed on a **Fibonacci curve** by rank (1, 2, 3, 5, 8, 13 in the base scheme). Each level earns roughly 60% more than the one below (the phi ratio, ~1.618). The top third earns about two-thirds of the Respect - meaningfully unequal, but far softer than typical DAOs.

**Why Fibonacci.** Larimer treats participants as imprecise "measuring instruments" - human judgment of relative value has wide error bars, so the reward curve must be forgiving and resist gaming. You cannot buy your way up a Fibonacci rank ladder; you can only be recognized by peers.

**Status:** Dormant since ~2023. The website is still up but there is no active development or community. As the EOS ecosystem declined, the live communities (Eden, Optimism) migrated to Ethereum L2s. *See Doc 103, Doc 306.*

## 2. Eden Fractal

Eden is the practical proving ground for the Fractally idea, and ZAO's closest sibling.

**Eden on EOS (April 2021).** The first fractal-democracy implementation, by Larimer. Peaked at 400+ members; 182 registrants in its first on-chain election (Oct 2021); ran 9 election cycles and distributed roughly $1.5M through democratic processes. It proved fractal scaling worked - and that people genuinely enjoyed the small-group format.

**Genesis Fractal (2022).** A 30-week experiment (~130 participants) to refine the weekly Respect Game. It found strong product-market fit for the weekly cadence. Dan SingJoy placed 3rd.

**Eden Fractal proper (May 2022 - today):**
- **Epoch 1 (May 2022 - June 2025):** On EOS. Weekly meetings, ~10 regulars, 77 contributors earned EDEN Respect, 100+ self-funded events.
- **Epoch 2 (June 5, 2025 - today):** Re-launched on **Base** (Ethereum L2) at event #121, its 3-year anniversary. ORDAO deployed with soulbound ERC-1155 tokens; EOS Respect migrated via a snapshot-and-claim. As of early 2026: 130+ total events, ~40 active participants, Season 12 running.

Eden is the R&D fractal - the place where ORDAO and new tooling get tested before other fractals adopt them. Zaal has been an active Eden member and sat on its council. *See Doc 103, Doc 184, Doc 306.*

## 3. Optimism Fractal

The fractal that carried the model from EOS to Ethereum.

- **Launched October 2023** by Dan SingJoy and the Optimystics team, on **OP Mainnet**, to bring fractal governance into the Optimism ecosystem.
- ~65 Respect holders participated. It ran a **tripartite governance model**: a Judicial branch (the Respect Game peer evaluation), a Legislative branch (an elected Sages Council - up to 6 highest-Respect members, managed via Hats Protocol), and an Executive branch (ORDAO/OREC automated on-chain execution).
- **Season 5** debuted the ORDAO software integration; the community council formally approved ORDAO in November 2024. Hundreds of proposals executed - it was the live testbed before Eden adopted ORDAO.
- Won an Optimism Grants Council (Season 6) grant for "Respect Game: Research into Democratic Fund Distribution."
- Ran 60+ bi-weekly events.
- Contracts on OP Mainnet: Parent Respect account (Seasons 1-4) `0x53C9...C5CC`, Respect1155 (Season 5+) `0x0741...5121`, OREC `0x73eb...cCE3`.

**Status: PAUSED INDEFINITELY as of January 2026.** The Optimism Fractal Council voted to consolidate into Eden Fractal. The consequence for ZAO: **ZAO Fractal became the only active fractal on Optimism**, and one of only two on the entire Superchain (alongside Eden on Base). *See Doc 103, Doc 184, Doc 306.*

## 4. ZAO Fractal

ZAO's own weekly fractal - the only music-focused fractal in the entire ecosystem.

**Origin & cadence.** Started Q2/Q3 2024 (around August 2024). Running 90+ continuous weeks as of early 2026 - the longest unbroken streak of any fractal. Meets **Mondays 6pm EST**; can also run any time with 4+ members who have not yet played that week.

**Where it runs.** Today the primary surface is a **Discord bot** (`fractalbotmarch2026` - Python, 52 slash commands, hosted on bot-hosting.net). The ZAO OS app has a `/fractals` page intended to become the long-term hub ("one place for all data"), with both Discord and app working in a dual mode.

**The two Respect ledgers.** This is the most important and most confusing part of ZAO's setup:

| Ledger | Token | Contract (Optimism) | Era | Role |
|--------|-------|---------------------|-----|------|
| **OG** | ERC-20 | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Fractals 1-73, deployed Jul 30 2024 | One-time distributions + historical ledger. 122 holders, ~38,484 supply. Frozen (last activity Dec 2025). |
| **ZOR** | ERC-1155 | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Fractals 74+, deployed Sep 11 2025 | Weekly Respect Game scoring. Minted democratically via OREC. Actively minting. |

Both are **soulbound** at the contract level - the ERC-20 via a locked TRANSFER_ROLE, the ERC-1155 via transfer functions that throw. Fractal 74 is the dividing line: 1-73 were tracked off-chain in Airtable (the OG era), 74+ are minted on-chain through OREC (the ZOR era).

**The OREC contract** at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` on Optimism is ZAO's governance executor: it reads the OG token for vote weights and owns the ZOR token to mint it. ~175 transactions as of early 2026.

**Voting criteria** members rank each other on: (1) advancing the ZAO vision of music/art/technology, (2) contribution, (3) collaboration, (4) innovation, (5) onboarding new members.

**Scoring.** ZAO uses a "2x Fibonacci" curve (Year 2): rank 6 = 110 Respect, 5 = 68, 4 = 42, 3 = 26, 2 = 16, 1 = 10. (Eden/Optimism use the standard Fibonacci: 55/34/21/13/8/5.)

**The weekly bot flow:** members gather in Discord voice -> `/randomize` builds 6-person groups -> `/timer` runs 4-min-per-speaker turns -> `/zaofractal` runs voting from rank 6 down to rank 1 by sequential elimination (public, simple majority, votes changeable) -> final rankings submitted via a pre-filled URL to `zao.frapps.xyz/submitBreakout`. *See Doc 56, Doc 58, Doc 102, Doc 113, Doc 114, Doc 115, Doc 188.*

## 5. The Respect token - mechanics

Respect is the primitive the whole system rests on.

- **Soulbound / non-transferable / illiquid.** It cannot be bought, sold, or transferred - by contract-level enforcement, not just convention. This is deliberate: it makes voting weight track contribution rather than capital, which is the entire anti-plutocracy point. (This is also exactly why a tradeable "$ZAO token" with LP mining is incompatible with $ZAO - see Doc 695.)
- **Earned two ways:** (1) weekly Respect Game ranking on the Fibonacci curve, (2) one-time activities - in ZAO, e.g. 25 pts for an intro, 50 for an article, 10 for camera-on, 50 for an artist listing.
- **OG (ERC-20) vs ZOR (ERC-1155):** OG is fungible, cumulative, used for one-time awards and the historical ledger. ZOR is a non-transferable token-type (NTT) where each award is its own ERC-1155 id, distributed by ORDAO consensus for weekly scoring.
- **Optional decay.** ZAO applies 2% weekly decay: `R(t) = R(t-1) * 0.98 + earned(t)`. Equilibrium under constant earning is `R_eq = earned / 0.02`; 2% gives a ~34-week half-life. Decay keeps governance weight tied to *recent* contribution, not a one-time burst years ago.
- **Voting weight.** OREC reads OG Respect balances during a voting window. A proposal passes when `yesWeight > 2 x noWeight` (the 2/3+1 rule) and a minimum Respect threshold votes yes; 1/3 of participating Respect can veto.
- **Equality.** A single Fibonacci round produces a Gini coefficient around 0.23 - dramatically more equal than typical token-voting DAOs (often 0.97-0.99). *See Doc 56, Doc 58, Doc 306.*

## 6. ORDAO / OREC / frapps / Optimystics

The software layer, all built by **Optimystics** (GitHub org, ~16 repos, mostly GPL-3.0).

**ORDAO** ("Optimistic Respect-based DAO") is the governance system. Its core is **OREC** ("Optimistic Respect-based Executive Contract") - a Solidity contract that solves voter apathy by being *optimistic*: it trusts a proactive minority to propose, then runs a challenge window. Three phases per proposal:
1. **Voting period** - anyone votes yes/no, weighted by Respect.
2. **Veto period** - a time-delayed challenge window; only NO votes count, vetoes carry 2x weight.
3. **Execution** - if it survived, anyone can trigger it on-chain.

**Repos and tooling:**
- `ordao` - the core monorepo (OREC contracts, `orclient`, `ornode`, `ortypes`, GUI, console). Upstream dev repo is `sim31/ordao` (254+ commits, Tadas).
- `orclient` - the SDK, published on npm as `@ordao/orclient` (v1.4.3, Feb 2026). Built on ethers v6 + zod. Functions: `proposeBreakoutResult()`, `vote()`, `execute()`, `getRespectOf()`, etc.
- `ornode` - Node/Express + MongoDB backend storing off-chain proposal content. ZAO's instance (`zao-ornode.frapps.xyz`) is currently down - reads now go straight to the OREC contract.
- `frapps` - the "fractal apps" deployment platform. Each fractal gets a subdomain: `zao.frapps.xyz`, `of.frapps.xyz`, `eden-fractal.frapps.xyz`.
- `orfrapps` - a newer (April 2026) separate repo for production deployment and multi-instance configuration, with a 9-command CLI.
- `fractalgram` - a Telegram web client for running live sessions (GPL-3.0).
- Other Optimystics tools: **Cignals** (a competition app for ranking live performances - alpha-tested with Fractal DJ competitions, directly relevant to ZAO's music focus), `Respect.Games` (async Respect Game app, beta), Cagendas, OPTOPICS, Respect Trees, RetroPolls.

**License/stack note for ZAO OS:** orclient and friends are GPL-3.0; ZAO OS is MIT. Using `orclient` as an npm dependency (linking) is fine. There is also a stack mismatch - orclient uses ethers v6, ZAO OS uses viem/wagmi - so the integration pattern is viem for reads, orclient for writes. *See Doc 56, Doc 102, Doc 109, Doc 285.*

## 7. The wider fractal ecosystem

Active fractals as of early 2026:

| Community | Chain | Size | Founded | Focus |
|-----------|-------|------|---------|-------|
| **Eden Fractal** | Base | ~40 active, 77 Epoch-1 holders | May 2022 | Governance R&D |
| **ZAO Fractal** | Optimism | ~40 members | Aug 2024 | Music community |
| **Roy Fractal** | EOS | 700+ | 2022 | Uzbekistan governance |
| **Fractal Hispano** | EOS | 30+ meetings | 2022 | Spanish-speaking |
| **Alien Worlds Fractal** | WAX | ~10 avg | 2022 | Gaming metaverse |
| **Aquadac** | - | 26+ meetings | 2022 | Personal development |
| **EOS Respect** | EOS | dozens | 2022 | Trust network |

Dormant or paused: Fractally (since ~2023), Eden on EOS (declining), Genesis Fractal (experiment completed), Optimism Fractal (paused Jan 2026). The movement has clearly migrated from EOS/Antelope to Ethereum L2s - but only two fractals are actually on the Superchain (Eden on Base, ZAO on Optimism).

Related inter-DAO work: **Fractal Nouns** (a cross-chain governance bridge experiment using the Open Intents Framework / ERC-7683) and **IYKYK DAO** (a Nouns Builder DAO on Base with a multi-DAO dashboard template).

**ZAO's unique position:** the only music-focused fractal, the only active fractal on Optimism, one of only two on the Superchain, the longest continuous streak (90+ weeks), and the only fractal embedded inside a full social client (ZAO OS on Farcaster). *See Doc 104, Doc 346, Doc 306.*

## 8. Key people

| Person | Role |
|--------|------|
| **Dan Larimer** | Philosophical founder. Built BitShares/Steem/EOS; wrote "More Equal Animals"; created Fractally + the Respect concept. |
| **Dan SingJoy** | Founded Eden Fractal, Optimism Fractal, and co-founded Optimystics. A musician-turned-governance-builder - the bridge between music and fractal governance. Hosts Creator Talk / Fractal Apple. |
| **Tadas Vaitiekunas** (`sim31`) | Co-founder of Optimystics; lead developer of ORDAO, OREC, Fractalgram. Deployed `zao.frapps.xyz`. Works closely with Zaal. |
| **Rosmari** | Co-founder of Optimystics; podcast host, community building. |
| **Abraham Becker** | Next-gen Fractalgram / Respect.Games developer. |
| **Zaal** | ZAO founder. Path: joined Optimism Fractal early -> active in Eden Fractal (incl. council) -> founded ZAO Fractal Aug 2024. On daily/weekly terms with Dan SingJoy and Tadas. |

## 9. Timeline

| When | Event |
|------|-------|
| 2014-2018 | Larimer builds BitShares, Steem, EOS |
| 2021 | Larimer publishes "More Equal Animals" |
| April 2021 | Eden on EOS launches (400+ peak members) |
| ~Jan 2022 | Fractally protocol announced |
| 2022 | Genesis Fractal - 30-week experiment, ~130 participants |
| May 2022 | Eden Fractal founded (Epoch 1, on EOS) |
| Feb 2023 | Tadas releases Fractalgram |
| October 2023 | Optimism Fractal launches on OP Mainnet |
| ~Aug 2024 | ZAO Fractal begins |
| Jul 30 2024 | ZAO OG Respect (ERC-20) deployed on Optimism |
| Nov 2024 | Optimism Fractal Council approves ORDAO |
| June 5 2025 | Eden Fractal Epoch 2 launches on Base |
| Sep 11 2025 | ZAO ZOR Respect (ERC-1155) deployed on Optimism |
| January 2026 | Optimism Fractal pauses, folds into Eden -> ZAO becomes the only active Optimism fractal |
| Feb-Apr 2026 | orclient v1.4.3 on npm; ORFrapps repo released |

## 10. Open issues and tensions (ZAO-specific)

- **OG/ZOR ledger reconciliation.** Fractals 1-73 live in Airtable (OG era); 74+ are on-chain via OREC (ZOR era). They have never been unified into one ledger (target: Supabase import). Edge cases: what a "0" in Airtable means post-Fractal-74, and video-participation points still tracked only in Airtable. *Doc 115.*
- **OREC submission bottleneck.** Only two wallets (zaal.eth, civilmonkey.eth) have ever called Vote/Execute on the OREC contract - Zaal personally submits most fractal results on behalf of breakout groups. The fix is making on-chain submission accessible to every member through the ZAO OS UI. *Doc 114, fractal_vision memory.*
- **Infrastructure down.** ZAO's `ornode` endpoints are unreachable; reads now go directly to the OREC contract. The Vercel bot dashboard was deleted; the Discord bot remains the live surface. *Doc 114.*
- **Attribution bias in sprint fractals.** In ZAOstock-style sprint fractals, infrastructure/tech work can rank artificially low against more "visible" marketing work - mitigations are explicit infra-contribution framing and facilitator pre-briefing. *Doc 498.*
- **License + stack mismatch.** ORDAO tooling is GPL-3.0 and ethers-v6-based; ZAO OS is MIT and viem/wagmi-based. Resolved by treating orclient as an npm dependency and using viem-for-reads / orclient-for-writes. *Doc 58, Doc 109.*

## Also See

- [Doc 56](../056-ordao-respect-system/) - ORDAO & Respect Game system, full mechanics
- [Doc 58](../058-respect-deep-dive/) - Respect token deep dive (decay, Gini, tiers)
- [Doc 103](../103-fractal-governance-ecosystem/) - the fractal governance ecosystem
- [Doc 104](../104-fractal-communities-directory/) - directory of all fractal communities
- [Doc 109](../109-optimystics-tooling-ecosystem/) - Optimystics tooling
- [Doc 114](../114-zao-fractal-live-infrastructure/) - ZAO Fractal live infrastructure
- [Doc 306](../306-eden-fractal-op-fractal-deep-history/) - Eden & Optimism Fractal deep history
- [Doc 695](../695-crypto-factor-avax-governance-decision/) - why a tradeable "$ZAO" contradicts soulbound Respect

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Use this doc as the explainer when describing ZAO governance to outside parties (e.g. the Crypto Factor shared doc) | @Zaal | Reference | Ongoing |
| Re-validate the "active fractals" list + Eden season number - those churn | @Zaal | Doc update | Every 4-6 weeks |
| Unify OG + ZOR ledgers into one Supabase view (Doc 115 plan) | @Zaal | Build | Future sprint |
| Open OREC submission to all members via ZAO OS UI (removes the 2-wallet bottleneck) | @Zaal | Build | Future sprint |
| Stand `ornode` back up or formally retire it in favor of direct-contract reads | @Zaal | Infra | Next infra session |

## Sources

This doc is a synthesis of existing ZAO research docs - no new external research. Each source is a research doc read in full:

- Doc 56 - ORDAO & Respect Game System `[FULL]`
- Doc 58 - Respect Deep Dive `[FULL]`
- Doc 102 - Fractals Page: frapps, ORDAO, ZAO Integration `[FULL]`
- Doc 103 - Fractal Governance Ecosystem `[FULL]`
- Doc 104 - Fractal Communities Directory `[FULL]`
- Doc 109 - Optimystics Tooling Ecosystem `[FULL]`
- Doc 114 - ZAO Fractal Live Infrastructure `[FULL]`
- Doc 115 - ZAO Data Reconciliation Plan `[FULL]`
- Doc 184 - Superchain ORDAO & Cross-Chain Fractal Governance `[FULL]`
- Doc 188 - ZAO Fractal Bot + Process `[FULL]`
- Doc 285 - ORDAO & ORFrapps Updated Documentation `[FULL]`
- Doc 306 - Eden Fractal & Optimism Fractal: Complete History `[FULL]`
- Doc 346 - IYKYK DAO + Fractal Nouns: Inter-DAO Governance `[FULL]`
- Doc 444 - ZAO Fractal Submission `[FULL]`
- Doc 450 - Pre-Fractal Discord Talking Points `[FULL]`
- Doc 498 - ZAOstock Fractal Adaptation `[FULL]`
- Memory: `project_fractal_process.md`, `project_fractal_vision.md` `[FULL]`

Note: external facts about Fractally / Eden / Larimer originate in Docs 103 and 306; they were not re-verified against primary web sources in this synthesis pass. If this doc is used externally, spot-check the pre-2024 dates against fractally.com and the gofractally Medium posts.
