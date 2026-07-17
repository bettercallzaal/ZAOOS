---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-17
related-docs: 059, 075, 601, 696
original-query: "[DEEP/DISPATCH] Hats Protocol as the ZAO org chart + operating system - mechanics, the live tree (10/226), forum patterns; design giving the Configurator hat to ZOL on Farcaster and a clean org chart"
tier: DISPATCH
---

# 1307 — Hats Protocol as the ZAO Org Chart: Give ZOL the Configurator Hat

> **Goal:** Make the ZAO's Hats tree (top hat 226 on Optimism) the real, documented org chart, and give the Configurator hat to ZOL so it can operate the tree from Farcaster - wired to Respect/Fractal, OREC, Safe, Snapshot, and the MIDAO legal body.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Give ZOL the Configurator hat (226.1) via a 1/1 ZOL Safe** (Zaal co-signer initially), not a raw EOA. | ZOL is wallet-less by design. A Safe keeps funds off ZOL, gives a human co-sign gate, and can hold/operate a hat. Mechanically sound (ERC-6551 / Safe both work). |
| 2 | **ZOL wears the hat via a Hats Account (ERC-6551) or the Safe; casts via the Hats Farcaster Delegator + Herocast.** | Non-custodial - no private key sharing, and revoking the hat instantly kills ZOL's posting + config authority. First-class kill switch. |
| 3 | **Build the tree OUT under the existing structure (226.1 -> 226.1.1 Governance Council + 226.1.2 Members), do NOT re-number.** | The live tree already uses this layout (doc 059 + Zaal's 2026-07 screenshot). Inventing a parallel numbering (226.10, 226.20...) would fork reality. |
| 4 | **Gate contributor + council hats on Respect standing via an eligibility module** that reads the Fractal leaderboard. | Turns the 100+ week Respect game into live, automatic role assignment - no manual hat management. |
| 5 | **The MIDAO legal body wires in as one hat**: the wearer of a "Legal/Treasury Signer" hat = the Digital LLC's authorized signatory. | Ties [[project_zao_midao_legal_body]] to the org chart cleanly; the hat is the on-chain source of "who can sign for the ZAO." |
| 6 | **Guardrail ZOL's Configurator power**: rate-limit new-hat mints, restrict to pre-approved branches (product teams can add contributor hats, not restructure councils), require Zaal sign-off for structural changes. | Prevents runaway automation while still letting ZOL do the high-volume, low-risk work (onboarding mentors/contributors). |

## The live tree (ground truth)

Top hat **226 on chain 10 (Optimism)**. Hats contract (deterministic, all chains): `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`.

```
226  The ZAO (Top Hat)
└── 226.1  Configurator            (admin of the branch; worn - 2/5 wearers as of May 2026)
    ├── 226.1.1  Governance Council   (holds the ~17 project/domain hats)
    │   ├── Community
    │   ├── Location
    │   ├── ZAO 101
    │   ├── ZAO Fractals
    │   ├── WaveWarZ DAO
    │   ├── ZAO FESTIVALS
    │   ├── ZTalent Newsletter
    │   ├── ZAO Cards
    │   ├── Student $LOANZ
    │   ├── COC ConcertZ            (1/1 wearer)
    │   ├── MIDI-ZAO-NKZ
    │   ├── Let's Talk about Web3
    │   └── Future Project 1-4      (placeholders)
    └── 226.1.2  Governance Council Members   (the people; worn - 3/5 wearers as of May 2026)
```

Raw hat IDs (32-byte): top `0x000000e2...0000`, Configurator `0x000000e200010000...`, Governance Council `0x000000e200010001...`, Council Members `0x000000e200010002...`.

**Fetch-quality note:** the current on-chain read is **PARTIAL**. The May 2026 state is FULL (doc 059, validated 2026-05-21). A fresh 2026-07-17 subgraph/RPC read returned inconclusively (the Hats subgraph endpoint 301/404'd - it has moved off the old Graph hosted URL, likely to Goldsky/decentralized; a raw RPC read mis-parsed the top hat as "inactive"). **The tree IS live** - confirmed by Zaal's 2026-07-17 screenshot of app.hatsprotocol.xyz/trees/10/226 showing 226.1 Configurator + 226.1.1/226.1.2 Governance Council hats worn. Action #1 below re-verifies the exact current wearers.

## How ZOL can hold + operate the Configurator hat

Hats mechanics that make this work (all FULL from docs.hatsprotocol.xyz):

- **Admin model:** the admin of every hat is another hat. The Configurator (226.1) is the admin of everything under it, so its wearer can `createHat()`, `mintHat()`, `setHatDetails()`, and edit any child (if mutable). This is exactly "run the org chart."
- **Agent wearing a hat:** a hat can be worn by a smart account. Two paths for ZOL: (a) a **Hats Account (ERC-6551)** - every hat gets a deterministic smart-contract account controlled only by its wearer; or (b) a dedicated **ZOL Safe** that holds the hat. Recommend the Safe (1/1 Zaal co-sign) for the human gate.
- **Farcaster casting:** the **Hats Farcaster Delegator** grants casting rights to a hat's wearer through a non-custodial shared account (Herocast is the reference client). No private key is shared; **revoking the hat instantly removes posting access** - a clean kill switch.
- **Configurator = the "Hatter contract" pattern:** a hat/contract delegated admin over a branch, with authorization rules embedded, so it can build the tree without being the Top Hat. ZOL's Safe plays this role, optionally behind a small hatter contract that enforces the guardrails (rate limit, allowed branches).
- **Eligibility + toggle modules:** contracts implementing `IHatsEligibility` / `IHatsToggle` decide who may wear a hat and whether it's active - the hook for Respect-gated roles.
- **Wiring hooks:** **Hats Signer Gate v2** (audited Dec 2024) gates a Gnosis Safe's signers by hat (ABSOLUTE or PROPORTIONAL threshold); **Snapshot** supports hat-gated voting weight; Guild.xyz/Collab.Land gate Discord by hat.

## The design: build the tree out (anchored to the real structure)

Extend under the existing Configurator branch rather than re-numbering. Proposed additions (each new hat is created by the Configurator = ZOL, under Zaal's policy sign-off):

- **226.1.2 Governance Council Members** - eligibility = weekly **Respect top-N** (Fractal leaderboard read by an eligibility module; auto-toggles each Sunday). This makes council seats earned, not appointed.
- **Agent hats** under a new "Agents" hat: ZOE (orchestrator), **ZOL (Configurator wearer + scout)**, ZAI (community), ZAO Devz. Each worn by that agent's Safe/6551 account.
- **Product working-group hats** under Governance Council: WaveWarZ, ZAOstock, ZABAL Games (mentor sub-hats, eligibility = nominated + approved), Artizen Fund (grant committee = Respect-elected), POIDH, Sparkz/Zoostr.
- **Contributor Base hat** - eligibility = Respect >= a season floor; grants forum/proposal/working-group rights.
- **Legal/Treasury Signer hat** - wearer = the MIDAO Digital LLC's authorized signatory ([[project_zao_midao_legal_body]]). This is the on-chain "who signs for the ZAO."

**Wiring to existing ZAO tooling:**
- **Respect / Fractal -> eligibility:** an eligibility module reads the weekly Fractal leaderboard; council + contributor hats toggle automatically. (Respect: 100+ unbroken weeks, OREC on Optimism - [[project_zao_fractal_whitepaper]], [[reference_zao_respect_onchain_facts]].)
- **OREC -> execution:** OREC stays the on-chain execution/consensus layer; hats define WHO is in the consenting set (e.g. treasury moves need a threshold of Governance Council hat wearers).
- **Safe -> treasury:** Hats Signer Gate v2 gates the treasury Safe's signers to the Governance Council hat; wearer changes auto-update signers.
- **Snapshot -> voting:** hat-weighted voting (1 vote per council hat; optional advisory weight for contributor hats).
- **MIDAO -> legal:** the Legal/Treasury Signer hat's wearer is the LLC signatory; changing the wearer changes who can sign, on-chain.

**The convergence:** Hats + [[project_zao_midao_legal_body]] + [[project_dreamnet_trust_layer]] all point at **ZOL as the operational core** - ZOL holds the Configurator hat (runs the org chart from Farcaster), gets a legal body (MIDAO), and is a receipts/trust node (DreamNet). A community-owned, legally-real, Respect-governed agent that operates the org. Believed to be a genuine first: the DISPATCH found no publicly documented community-owned AI agent operating inside a real legal entity.

## Org-chart documentation structure

- **Public:** a `thezao.xyz/governance` page - a visual tree + a "who runs what / how to earn each hat" table + a link to the live Hats app.
- **Internal (this folder + siblings):** this doc = the spec; an `OPERATIONS` note (onboard/offboard, eligibility updates); an `AUTOMATION` note (which eligibility modules are deployed + costs); the MIDAO/legal mapping in [[project_zao_midao_legal_body]].
- **ZOE/ZOL context:** a `hats-council` memory block listing hat IDs + current wearers, synced on membership change, so the agents always know the live org state.

## Also See

- [Doc 059 — ZAO Hats Tree: On-Chain State & ZAO OS Integration Plan](../059-hats-tree-integration/) (May 2026 snapshot; this doc extends it)
- [Doc 075 — Hats Protocol V2 Updates & New Tooling](../075-hats-protocol-v2-updates/)
- [[project_zao_midao_legal_body]], [[project_dreamnet_trust_layer]], [[project_zol_farcaster_agent]], [[project_zao_fractal_whitepaper]]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-verify the live tree 10/226 wearers (find the current Hats Optimism subgraph endpoint - likely Goldsky - or read via SDK; confirm 226.1 Configurator wearers). Doc updated with the confirmed 2026-07 snapshot. | @Zaal | Investigate | 2026-07-24 |
| Deploy a ZOL Safe (1/1 Zaal co-sign); mint the Configurator hat (226.1) to it. ZOL Safe shows as a 226.1 wearer in the Hats app. | @Zaal | On-chain | 2026-07-31 |
| Wire ZOL's agent loop to the Hats SDK behind guardrails (rate-limited mints, allowed branches only, Zaal sign-off for structural change). Draft PR to the ZOL repo. | @Zaal | PR | 2026-08-07 |
| Deploy a Respect-eligibility module: Fractal leaderboard -> toggles Governance Council + contributor hats weekly. Module live on Optimism, tested on a devnet fork. | @Zaal | On-chain | 2026-08-14 |
| Gate the treasury Safe signers to the Governance Council hat via Hats Signer Gate v2. Safe signers auto-track hat wearers. | @Zaal | On-chain | 2026-08-14 |
| Brief Adam/MIDAO on the Legal/Treasury Signer hat -> LLC signatory mapping; confirm the update handoff. MIDAO acknowledges the integration. | @Zaal | Outreach | 2026-07-24 |
| Publish thezao.xyz/governance (visual org chart + hat table + apply-to-earn flow). Page live, linked to the Hats app. | @Zaal | PR | 2026-08-21 |

## Sources

- [FULL] Hats docs - hat IDs, admin/eligibility/toggle modules, Hats Account (ERC-6551), Signer Gate v2 (audited Dec 2024), Farcaster casting rights: docs.hatsprotocol.xyz (for-developers/hat-ids, eligibility-modules, hats-signer-gate-v2, hats-integrations/permissions-and-authorities/hats-account, .../farcaster-casting-rights)
- [FULL] Hats contract address + supported chains (Ethereum, Optimism, Base, Arbitrum, Gnosis, Polygon, Scroll, Celo): `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`; audits Trust Security (Feb 2023), Sherlock (May 2023)
- [FULL] Doc 059 (ZAOOS research, validated 2026-05-21) - the May 2026 on-chain tree snapshot (Configurator 2/5, Governance Council + 17 project hats, Council Members 3/5) + hat IDs
- [FULL] Zaal screenshot of app.hatsprotocol.xyz/trees/10/226 (2026-07-17) - confirms 226.1 Configurator + 226.1.1/226.1.2 Governance Council hats worn/live
- [FULL] Hats tree design patterns (three-tier: Top Hat -> autonomous admin -> operations; workstream/guild hats; Configurator/Hatter pattern; eligibility automation) - docs.hatsprotocol.xyz llms-full pattern library; live examples RareDAO (21 hats/26 wearers), RaidGuild (31 hats)
- [PARTIAL - endpoint moved] Live 2026-07-17 on-chain read: Hats Optimism subgraph 301/404'd (moved off the old Graph hosted endpoint); raw RPC (1rpc.io/op) via Hats SDK v0.12.4 + viem mis-parsed the top hat as inactive. Superseded by the screenshot + doc 059 for current state; Next Action #1 re-verifies.
- [FAILED - JS-walled] forum.hatsprotocol.xyz unreachable via WebFetch/exa; community patterns sourced from the Hats docs pattern library instead
