---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-10
related-docs: "2656, 2642, 2562, 2558, 059, 075, 102, 1069, 696, 115"
original-query: "zao-core lane job 4 (brief 2026-10-10, item 67): Respect as the binding token - design note on how Respect gates the platform (grill 2026-09-22 morning item 1), Hats roles (doc 059), and the fractal; no new token, no on-chain change without Zaal's word. Written after grill 2026-10-10 item 78 ruled vote weight = OG + ZOR summed."
tier: STANDARD
lane: zao-core
---

# 2657 - Respect as the binding token: how one ledger gates the platform, the roles and the fractal

> **Goal:** The design note Zaal asked for in job 4. One answer to "what does holding Respect do" across zingfisher, Hats tree 226 and the weekly fractal, written against the 2026-10-10 ruling that vote weight is OG + ZOR summed (item 78). Design only. No new token, nothing minted, nothing on chain. Every path and number measured 2026-10-10 unless dated otherwise.

## Key Decisions

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | One definition of Respect weight everywhere | **Respect weight = whole OG + ZOR, read live from Optimism, truncated to integers.** Every surface prints the two balances and the sum, and names the ledger it read | Item 78 (grill 2026-10-10). OG is an 18-decimal ERC-20, ZOR an integer ERC-1155; zingfisher PR #2 fixes the fork to this (pinned: Zaal 3,094 + 858 = 3,952). ZAO OS already does it (`src/lib/respect/voteWeight.ts`). The Snapshot space already does it (doc 2642). OREC does not yet (reads frozen OG) and is the one surface that needs a proposal, not code |
| 2 | Gate access with CharmVerse's own token gates, not a parallel gate | **USE `TokenGate` + `TokenGateToRole`** (`packages/lib/src/tokenGates/`) for "who may see or do what". Keep `respectGate.ts` only for weight and display | CharmVerse gates already evaluate ERC20 with on-chain `decimals()` (`packages/lib/src/tokenGates/validateTokenGateCondition.ts:42-54` at zingfisher a8214a99), **Hats** through the Hats contract's `balanceOf` (same file, 56-67), and ERC1155 by token id (76-87), and map a passing gate to a Role. The fork's `ZaoMemberGate` duplicates a subset of this, still says "$ZABAL (Base)" at lines 12, 40 and 41 against 09-22 morning item 6, and gates one page (`pages/learn.tsx:71`) |
| 3 | Roles come from Hats, rights come from Respect | **A hat is a role; Respect is standing.** Tree 226 hats map to CharmVerse roles through the Hats gate type. No hat grants vote weight or proposal power until Season 3's Manifesto Hat ships | Grill 2026-09-22 afternoon item 18: org chart only. ZIP-2 section 5: achievements, titles and roles through Hats after a human-checked phase. Hats voting modules are flat per hat and never balance-weighted (season3-hats-protocol-research Q6), so weight stays with the token |
| 4 | The fractal is the only mint path for governance Respect | **Nothing in zingfisher or Hats creates Respect.** The weekly game ranks, OREC mints ZOR; one-time achievements become OG through OREC custom transactions (09-26 r1); festivals and sub-DAOs get their own ledgers (09-26 r2) | Grill 2026-09-22 item 26, verbatim: "the only way to get governance in the zao is participating in fractals". ZIP-2 section 2: existing holders keep every point; nothing burns (09-26 r6) |
| 5 | Three gates, not one | **Read: anyone. Comment: any member (ZID). Endorse and vote: Respect > 0. Publish: 1,000 peer Respect behind the draft.** Weight at vote: OG + ZOR snapshotted at proposal open | Grill 2026-09-22 morning items 1 (weight), 2 (any Respect drafts; 1,000 peer Respect publishes), 3 (snapshot at open) and 15 (zero-Respect members read and comment), which keeps the 1,000 peer bar meaningful |
| 6 | Vote strategy inside CharmVerse | **Extend the `token` vote strategy to carry two Snapshot strategies** (`erc20-balance-of` on OG with decimals 18, `erc1155-balance-of` on ZOR id 0) at `blockNumber`; or use the `snapshot` strategy and let the Snapshot space do the sum | CharmVerse `Vote.strategy` is `regular`, `token` or `snapshot` (`schema.prisma:280-284`); `token` calls `score.snapshot.org get_vp` with one `erc20-balance-of` strategy (`packages/lib/src/snapshot/getTokenAmountOnBlockNumber.ts`). The Snapshot space `zaal.eth` already carries both strategies, so the sum is one payload change, not a new scorer. Item 79: holder votes on ZIPs run in Snapshot; zingfisher's vote is advisory |

## What Respect does, surface by surface

| Surface | Reads | Gives | State 2026-10-10 |
|---|---|---|---|
| **OREC** (Optimism `0xcB05...e532`) | `respectContract()` = OG only, frozen since 2025-12-20 | Vote weight on on-chain proposals; mints ZOR when a breakout passes | Needs one passed proposal calling `setRespectContract` to a contract answering OG + ZOR (item 78). ZOR already answers `respectOf` (doc 2562 section 3b: interface id `0x58970ca8`, Zaal 842 on 09-26). A summing wrapper is the Season 3 `IRespect` build, reviewer unassigned (ZIP-2 OI2) |
| **Snapshot space `zaal.eth`** | `erc20-balance-of` OG + `erc1155-balance-of` ZOR | Gasless holder vote; the ZIP approval route (item 79) | Dormant: 16 proposals, last 2025-12-21 (doc 2642). Counts the right people today |
| **ZAO OS** (`zaoos.com`) | viem multicall OG + ZOR, `formatEther` on OG | In-app proposal vote weight; refuses a vote on a failed read | Live, number of proposals UNKNOWN (doc 2642 row 5) |
| **zingfisher** | `respectGate.ts` OG + ZOR, whole units after PR #2 | Membership (any Respect > 0), display on the member page, permissions object | PR #2 open; ZID profiles in memory; proposals not built; `ZaoMemberGate` copy stale |
| **Hats tree 226** | Nothing. Manual eligibility on all top-level hats (doc 059) | Roles: Configurator 2/5, Governance Council Members 3/5, 17 project hats, level-4 Manager hats | Season 3 adds the Manifesto Hat as membership and Hats as achievements; not wired |
| **The weekly fractal** (bot v2 + Discord) | Bot reads chain for governance stage (`src/lib/governance.ts`); writes rankings to Supabase | The only mint path: breakout result goes to OREC, OREC mints ZOR | Bot v2 `src/` has no submit path (zero hits for frapps or submitBreakout outside tests); the last 12 mints came from one address (ZIP-2 security). Submission is a human at zao.frapps.xyz |

## The binding: one read, four uses

```
                 Optimism, read live, whole units
     OG ERC-20 (18 dec)  +  ZOR ERC-1155 id 0   =  Respect weight
            |                     |                     |
   OREC (after item 78 proposal)  Snapshot zaal.eth      ZAO OS vote route        zingfisher respectGate
   on-chain execution             ZIP holder vote        in-app vote              membership, display, permissions
                                                                                        |
                                                              CharmVerse TokenGate (ERC20 / ERC1155 / Hats) -> Role
                                                                 "Respect holder", "Council member", "Festivals manager"
                                                                                        |
                                                              Proposal workflow: draft (any Respect) -> publish (1,000 peer)
                                                              -> discuss (any ZID) -> vote (OG + ZOR at open, 72 h + 72 h)
                                                              -> advisory record; ZIP vote on Snapshot; on-chain via OREC
```

**How a fractal result becomes a record on the member page.** Breakout ranks six people; the bot stores the ranking (`fractal_sessions`, `fractal_scores`); a human submits to OREC at frapps; after 72 h + 72 h OREC mints ZOR per the Fibonacci ladder 110 / 68 / 42 / 26 / 16 / 10; the member page reads ZOR live and the fractal-history panel mirrors the mint (grill 09-22 item 16, records not votes). Two gaps break the chain today: the bot has no submit path, and the mirror (panel 3, `MemberProfileView.tsx:467`) has no data source until the session rows are repaired (21-week hole, doc 2562 KD4).

## Gates, precisely

| Action | Who | Checked by | Source of the rule |
|---|---|---|---|
| Read any proposal or page | Anyone with the link | None | Item 15 |
| Comment, discuss | Any member with a ZID | CharmVerse space membership | Items 12, 15 |
| Draft a proposal | Respect weight > 0 | TokenGate ERC20 OG OR ERC1155 ZOR, quantity 1, mapped to role "Respect holder" | 09-22 morning item 2 |
| Endorse a draft | Respect weight > 0; endorsement carries the endorser's weight | Role "Respect holder"; sum of endorsers' weights | Items 2 and 15 |
| Publish to vote | 1,000 Respect from peers (author excluded, open question in the spec) | Sum reaches 1,000 | Item 2 verbatim: "publish get to 1000 respect from peers" |
| Vote | Respect weight > 0 at proposal open | `Vote.strategy = token`, `blockNumber` = open block, two Snapshot strategies | Items 1 and 3 |
| Pass | 72 h vote then 72 h veto | Vote deadline + a second evaluation step | Item 4: "match orec for now" |
| Execute | Nobody automatically | Advisory record; OREC by hand; ZIP approval on Snapshot | Item 7, item 79 |
| Hold a role | Wearer of the hat | TokenGate type Hats, tree 226 hat id | Item 18, doc 059 |
| Earn Respect | Fractal participants only | Not in the platform | Item 26 |

## What this note rules out

- A new token, a bridge, or any mint from the platform (item 26; 09-22 item 10 reading: specs, never mints).
- Hat-weighted votes. No found mechanism multiplies a hat by a balance; flat-per-hat voting would contradict item 78.
- $ZABAL anywhere in the gate (09-22 morning item 6). The fork's `ZaoMemberGate.tsx` still names it at lines 12, 40 and 41 (zingfisher a8214a99).
- A second gate implementation. CharmVerse's `TokenGate` covers ERC20, ERC1155 and Hats on any EVM chain id; the fork's `PARENT_ZAO_GATES` becomes seed data for two `TokenGate` rows, not a competing system.

## Also See

- [Doc 2656](../2656-zao-core-system-map/) - the five-piece map this note hangs off
- [Doc 2642](../2642-zao-holder-approval-systems-inventory/) - the four voting systems; Snapshot for ZIPs
- [Doc 2562](../2562-zao-fractal-state-and-build-plan/) - OREC reads frozen OG; ZOR answers `respectOf`
- [Doc 2558](../2558-dao-periodic-reactivation-precedent/) - why activation is a wrapper, not a Hats module
- [Doc 059](../059-hats-tree-integration/), [Doc 075](../075-hats-protocol-v2-updates/) - tree 226 and Hats eligibility modules
- [Doc 1069](../1069-fractal-discord-bot-voting-mechanism/), [Doc 696](../696-respect-fractal-lineage-summary/), [Doc 115](../115-zao-data-reconciliation/), [Doc 102](../102-fractals-frapps-ordao-page/)
- zao-vault: `projects/season3-hats-protocol-research-2026-09-11.md` (Q6, fit table), `projects/zao-governance-and-proposal-platform-spec-2026-09-22.md`, `decisions/grill-2026-10-09-seat-morning.md` items 78-85

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Wrapper spec for OREC: an `IRespect` contract returning whole OG + ZOR, installed by one `setRespectContract` proposal; shipped when the spec is a READY PR in zao-papers as a ZIP-2 amendment and the reviewer ask to Tadas and Eden Fractal is sent by Zaal | @zao-core lane (spec); @Zaal (ask, proposal, signature) | PR, then Zaal's taps | 2026-10-17 |
| zingfisher PR: replace `ZaoMemberGate` with two CharmVerse `TokenGate` rows (OG ERC20 decimals 18, ZOR ERC1155 id 0) mapped to a "Respect holder" role; drop the $ZABAL copy; shipped when the PR is READY and the gate test passes | @zao-core lane | PR to bettercallzaal/zingfisher | 2026-10-17 |
| Vote strategy: extend `getTokenAmountOnBlockNumber` to accept a strategies array and seed OG + ZOR; shipped when a unit test pins Zaal's wallet at a fixed block | @zao-core lane, after Postgres is decided | PR to bettercallzaal/zingfisher, behind `ZAO_PROPOSALS_ENABLED=false` | 2026-10-31 |
| Hats roles: seed `TokenGate` rows of type Hats for Configurator, Governance Council Members and the live project hats, mapped to roles; shipped when the member page shows the wearer's hats from these gates | @zao-core lane | PR to bettercallzaal/zingfisher | 2026-10-31 |
| Bot submit path: decide whether v2 submits breakouts to OREC itself or keeps the human at frapps; shipped when a decisions file carries his words | @Zaal via Grill, prepared by @zao-core | Grill, A/B | 2026-10-17 |
| Repair the session record (21-week hole) so the fractal-history panel has a source; shipped when `fractal_sessions` has a row per period since 2026-04-14 | @season3 lane (parked) or @fractaldata lane; reopen is Zaal's | Data work, PR-only | 2026-11-14 |

## Sources

- Vault `decisions/grill-2026-10-09-seat-morning.md` items 78-85 (vote weight, Snapshot for ZIPs, spend review, ICM cut-over, test.thezao.com, Season 3 date) and `decisions/grill-2026-09-22-seat-morning.md` items 1-31, `-afternoon.md` items 18-19, `decisions/grill-2026-09-26-zao-papers-afternoon.md` rulings 1-6 - [FULL, file and `git show origin/main`]
- Vault `projects/season3-hats-protocol-research-2026-09-11.md` sections Q6 and "Fit against each Zaal decision" - [FULL, `git show origin/main`]
- ZAOOS docs 2642 (rows 1-10, decisions), 2562 (KD1-6, section 3b), 2558, 2656, 059, 075, 102, 1069, 696, 115 - [FULL for the sections cited, file; numbers resolved with `zao-research-health --resolve`]
- zingfisher at a8214a99 (branch fix/zao-core-hygiene): `packages/lib/src/tokenGates/interfaces.ts`, `validateTokenGateCondition.ts`, `evaluateEligibility.ts`, `packages/lib/src/votes/getVotingPowerForVotes.ts`, `castVote.ts`, `packages/lib/src/snapshot/getTokenAmountOnBlockNumber.ts`, `node_modules/@charmverse/core/src/prisma/schema.prisma` (`TokenGate` 1149, `TokenGateToRole` 1231, `VoteStrategy` 280, `Vote` 715, `ProposalEvaluation` 1466), `components/zao/ZaoMemberGate.tsx`, `pages/learn.tsx`, `packages/lib/src/zao/respectGate.ts` - [FULL, file]
- ZAO OS V1: `src/lib/respect/voteWeight.ts`, `src/app/api/proposals/vote/route.ts`, `src/lib/hats/constants.ts` - [FULL, file]
- zao-fractal-bot at bdfa6fa: `src/lib/governance.ts`, `src/commands/`, `src/game/`, `docs/audits/2026-09-08-respect-games-app-evaluation.md`; control search `grep -rn frapps src` returns only a test file - [FULL, file]
- OG `decimals()` on Optimism via `optimism.publicnode.com` eth_call - [FULL, JSON-RPC, 18]; Zaal's live gate read `OG 3094000000000000000000, ZOR 858` from zingfisher-webapp.vercel.app - [FULL, curl, 2026-10-10]
- Community: [sim31/ordao issue #20](https://github.com/sim31/ordao/issues/20) (OREC lets zero-Respect accounts create proposals; ornode spam risk) and [issue #27](https://github.com/sim31/ordao/issues/27) (one rejecting receiver aborts a whole Respect distribution) - [FULL, gh api]; both bear on why the platform gates drafting on Respect > 0 and why minting stays in OREC
- [Hats Protocol core contracts](https://github.com/Hats-Protocol/hats-protocol) AGPL-3.0, LICENSE read - [FULL, gh api]; [sim31/ordao](https://github.com/sim31/ordao) GPL-3.0, LICENSE read - [FULL, gh api]
- [Snapshot scoring API](https://score.snapshot.org) as called by CharmVerse (`get_vp`, `erc20-balance-of`) - [PARTIAL: endpoint and payload read from the fork's code; not called this session]
