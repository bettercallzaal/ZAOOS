---
topic: governance
type: audit
status: research-complete
last-validated: 2026-09-26
corrections: "section 3b, 2026-09-26: IRespect zero was repo-scoped; ZOR measured as an existing OREC drop-in"
superseded-by:
related-docs: "governance/703-zao-fractal-current-state-may-2026, governance/1312-zao-fractal-respect-governance-deepdive-jul2026, governance/2301-zao-fractal-weekly-record, governance/2558-dao-periodic-reactivation-precedent, governance/188-zao-fractal-bot-process, governance/103-fractal-governance-ecosystem, governance/1772-eden-fractal-lineage, governance/109-optimystics-tooling-ecosystem, governance/115-zao-data-reconciliation"
original-query: "everything about fractals and where we are at and what we need to build"
tier: DISPATCH
---

# 2562 - The ZAO Fractal: Where We Are, and What We Need To Build

> **Goal:** One measured picture of the fractal as of 2026-09-26 - what runs, what is broken, what the upstream ecosystem is doing, and the ranked build list for Season 3's 1 November launch.

Four parallel research agents (measured onchain and session state, the cross-repo build backlog, upstream ecosystem liveness, and how a session actually runs), with every headline figure re-verified by the parent session. Where this doc and an older doc disagree, this doc says so explicitly rather than quietly overwriting.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | The weekly game earns ZOR, but OREC reads OG for vote weight, and OG has been frozen since 2025-12-20 | **RAISE THIS BEFORE ANY SEASON 3 BUILD.** Decide whether the activation wrapper wraps OG, ZOR, or a sum of both. | MEASURED by this session: `OREC.respectContract()` returns `0x34cE...6957`, the OG ERC-20, whose newest transfer is 2025-12-20. ZOR is what the game has minted every week since. So ~9 months of weekly participation currently carry **zero** governance weight, and a wrapper installed over OG would gate a frozen ledger held by 122 addresses at Gini 0.73. This is a bigger problem than anything in ZIP-2's Open Items and ZIP-2 does not mention it. |
| 2 | Five of Season 3's seven launch pieces are zero code | **SEQUENCE THEM: manifesto text, then the wrapper spec for review, then join flow.** | Verified with a control search (29 ZAOOS files mention Hats, `TREE_ID = 226` is in `src/lib/hats/constants.ts`, while "manifesto", "IRespect" and "setRespectContract" each return 0). 36 days to 1 November. |
| 3 | The ORDAO upstream is dormant | **PLAN AS THE MAINTAINER, not as an integrator.** | Verified by this session: `sim31/ordao` last commit 2026-04-02T13:46:17Z, `@ordao/orec` latest 1.4.4 published the same day, 17 open issues, not archived. Nothing upstream has shipped in ~5.5 months, including an open denial-of-Respect-distribution issue. |
| 4 | The database has a 21-week hole and two unapplied migrations | **FIX THE RECORD BEFORE BUILDING ON IT.** Apply migrations 0005 and 0007, then backfill. | The repo's own audit (`docs/audits/2026-09-08-all-weeks-points-audit-scope.md`) reports 133 `fractal_sessions` rows, 801 `fractal_scores` rows, newest session of any kind 2026-04-14, and 18 consecutive partially-scored periods. A public points page built on this today would publish a hole. |
| 5 | Our own library is contradicting itself on basic facts | **RETIRE OR CORRECT docs 703 and 1312.** | Doc 1312 claims 505 OREC transactions as of July; the live counter reads 334 today, and a monotonic counter cannot shrink, so that figure is wrong rather than stale. It also dates the fractal to October 2022 against a measured July 2024 start, and repeats a 157-holder figure that measurement does not reproduce. |
| 6 | The service-role key bypasses RLS across all of ZAO OS | **DECIDE THE REMEDIATION.** | `docs/deploy/bot-hosting-runbook.md` in zao-fractal-bot names this as an open risk with two proposed and zero implemented fixes. The blast radius includes user social tokens and payout wallets. |

## Findings

### 1. Measured state, 2026-09-26

| Value | Measured | How |
|---|---|---|
| OG Respect (ERC-20) `0x34cE...6957` total supply | 38,484 | `eth_call totalSupply()` via mainnet.optimism.io, re-run by the parent session |
| OG holders | 122 | Blockscout `/tokens/{addr}/counters` |
| OG newest transfer | **2025-12-20T22:52:43Z** | Blockscout `/transfers`, confirmed on two hosts |
| ZOR Respect (ERC-1155) `0x9885...445c` holders | 64 | Blockscout counters, re-run by the parent session |
| ZOR transfers | 373 | same |
| ZOR total supply | UNKNOWN | `totalSupply()` and `totalSupply(uint256)` both revert; no verified ABI found |
| ZOR newest mint | 2026-09-24T23:53:05Z, onchain `periodNumber` 114, metadata "for week 115" | Blockscout NFT instance metadata |
| `OREC.respectContract()` | `0x34cE...6957` = the OG ERC-20 | `cast call`, verified by the parent session |
| `OREC.voteLen()` / `vetoLen()` | 259200s each (72h) | `cast call` |
| `OREC.minWeight()` | 1000e18 = 1,000 OG Respect | `cast call`, verified by the parent session |
| `OREC.owner()` | the OREC address itself | `cast call` - unusual, flagged, not decoded further |
| OREC transactions | 334 | Blockscout address counters |
| Most recent OREC tx | 2026-09-24, method `execute`, from zaal.eth | Blockscout, ENS reverse lookup |
| OREC senders, last 50 txs (to 2026-07-28) | zaal.eth 49, ohnahji.eth 1 | Blockscout - note this corrects the long-repeated "zaal.eth and civilmonkey.eth" pairing for the recent window |
| Typical session attendance | UNKNOWN, not re-verified | needs Discord or Supabase credentials |

### 2. The finding that reframes Season 3

The game mints ZOR every week. OREC reads OG. OG has not moved since 2025-12-20.

Everything that follows from that:

- **Participation since December 2025 produces no vote weight at all.** Roughly 40 weeks of peer-ranked contribution, settled onchain as ZOR, is invisible to the contract that decides proposals.
- **Governance weight is a frozen 2024-2025 artifact.** 122 addresses, Gini 0.73, top 10 holding 53% (project CLAUDE.md verified reference data, Doc 981 audit 2026-07-05). Nobody can earn into it and nobody can be diluted out of it.
- **An activation wrapper over OG would gate the frozen ledger, not the community.** Season 3's active pool would become "OG holders who activated," which excludes every member whose entire history is ZOR. Doc 2558's central risk - that activation requirements concentrate power in fewer holders - lands twice as hard when the underlying ledger is already closed.
- **The fix is available and cheap in contract terms, and expensive in governance terms.** `setRespectContract` is in the deployed bytecode and one passed proposal can repoint OREC. What it should point AT is the open question, and it is Zaal's, not a lane's.

This is not in ZIP-2. ZIP-2 section 3 describes the wrapper as answering "is this address's activation current" over "real Respect" without naming which ledger is real for voting purposes.

### 3. What exists, and what is zero

| Season 3 piece | Where, if anywhere | State |
|---|---|---|
| Manifesto text | nowhere | **Zero.** ZIP-2 Open Item 1. Gates the launch outright |
| Manifesto Hat on tree 226 | `ZAOOS/src/lib/hats/constants.ts` has `TREE_ID = 226` and project hat IDs | **Zero for the manifesto itself.** 0 hits for "manifesto" across ZAOOS src, against a 29-file control for "hats" |
| Gasless Privy join at fractal.thezao.com | Privy exists in ZAOOS only for agent wallets (`src/lib/agents/wallet.ts`); the live join is `src/app/onboard/page.tsx`, an allowlist check with a placeholder signature | **Zero.** No DNS for the subdomain. The existing onboard path is one of the five conflicting member definitions ZIP-2 exists to replace |
| Monthly (now rolling 90-day) activation signal | nearest neighbour is `zao-fractal-bot/src/lib/asyncEligibility.ts` | **Zero** |
| `IRespect` wrapper OREC reads | **CORRECTED 2026-09-26, see below.** `bettercallzaal/zaofractal-contracts` (PRIVATE, last pushed 2026-07-22) holds `src/IRespect.sol` and `src/ZAORespect.sol`, a soulbound ERC-20 written as an OREC drop-in | **Partial, not zero.** The activation-gating wrapper still does not exist, but the IRespect-shaped token template does. No reviewer assigned (ZIP-2 Open Item 2) |
| Public points page | `ZAOfractal/dao/` React app reading static `data/*.json`; `ZAOOS/src/app/(auth)/zao-leaderboard/` is auth-gated | **Partial.** Neither is public and live against onchain state |
| @-able bot | `zao-fractal-bot` is slash-command and Supabase-queue driven; 0 mention listeners; `src/lib/fractalKnowledge.ts` is the nearest building block | **Partial** |

### 3b. Two corrections to this doc, made the same day it shipped

**The IRespect zero was scoped too narrowly.** Section 3 above originally read "nowhere; no `.sol`
in either repo". That search covered `ZAOOS` and `zao-fractal-bot` only. `bettercallzaal/zaofractal-contracts`
is a **private** repo, last pushed 2026-07-22, and it holds `src/IRespect.sol` and `src/ZAORespect.sol` -
a soulbound ERC-20 with `respectOf() = balanceOf()`, `MINTER_ROLE`, and batch minting, described in the
repo's own metadata as a drop-in for OREC. The activation gate is still unwritten, but the template
under it exists and did not need discovering. Stated as a lesson rather than an excuse: a zero is only
as wide as the repo list behind it, and private repos were not in that list.

**ZOR is already an OREC drop-in, measured.** `OREC.respectOf()` branches at set-time on
`supportsInterface(type(IRespect).interfaceId)`, using `IRespect.respectOf` when true and falling back
to `IERC20.balanceOf` when false. Verified by this session on 2026-09-26: the IRespect interface id is
`0x58970ca8` (a single-function interface, so the id equals the `respectOf(address)` selector), and
`ZOR.supportsInterface(0x58970ca8)` returns **true**, against an ERC-1155 control (`0xd9b67a26`) that
also returns true. `ZOR.respectOf(0x7234c36A71ec237c2Ae7698e8916e0735001E9Af)` returns **842** right now.

The consequence is concrete: **repointing OREC's vote weight from the frozen OG ledger to the live ZOR
ledger requires no new contract at all.** It is one passed proposal calling
`setRespectContract(0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c)`, plus almost certainly a
`setMinWeight` recalibration in the same proposal, since OG and ZOR are not on the same scale. Both are
`onlyOwner` and OREC owns itself, so neither can be called any other way than by a passed proposal.
That does not decide Key Decision 1 - what OREC *should* read is still Zaal's ruling, and the
2026-09-26 grill pointed at OG-as-achievements plus per-project ledgers, which needs an aggregator -
but it removes "we would have to build something first" as a reason for the current state to persist.

### 4. How a session actually runs, and where it breaks

The live code is `bettercallzaal/zao-fractal-bot`, a TypeScript rebuild. Docs 188, 1619, 1684 and 1706 describe an older Python bot and a Telegram and ZOE flow that **does not exist in the current codebase** - treat those four docs as historical.

Automated today: roster capture (`src/lib/rosterCapture.ts`), group splitting for 7+ people (`src/game/split.ts`, fixed in PR #26 on 2026-09-07, before which `/start` hard-failed on what the code calls "the ordinary case"), elimination voting with a strict-majority rule (`src/lib/voteThreshold.ts`, fixed 2026-09-01 from an "exactly half" bug), and score writing (`src/lib/gameRepo.ts`).

Manual today: the call itself, presentations (no timer code survived the rebuild), the onchain submission, and the archive.

Broken or unresolved:

1. **Five months of silent non-recording.** The deployed v1 had no Supabase credentials; the game ran correctly and wrote nothing. Discovered 2026-09-01.
2. **The record itself.** 133 session rows, 801 score rows, newest session 2026-04-14, 18 consecutive partially-scored periods, and only 7 of 133 sessions ever written by the bot.
3. **`respect_points` is zero on 771 of 801 rows** - a wrong value, not a missing one. `score` is authoritative (489 of 801 match the rank ladder).
4. **Migrations 0005 and 0007 are written and not applied** to the live project, so meeting numbers and the duplicate-session guard are absent in production.
5. **Single-relayer submission.** 49 of the last 50 OREC transactions came from one address. ZIP-2 states Season 3 does not fix this.
6. **Service-role key bypasses RLS** across the whole ZAO OS project.

### 5. The upstream is dormant and we are the live implementation

| Project | Last activity | Status |
|---|---|---|
| ORDAO (`sim31/ordao`, `@ordao/*`) | 2026-04-02, commit and npm publish the same day | **Dormant.** 17 open issues, newest opened 2026-02-23 |
| Optimystics / sim31 | blog newest post Jan 2026; 0 public GitHub events in the trailing window | Dormant as maintainer |
| Optimism Fractal | text unchanged since the Jan 2026 indefinite-pause notice | Paused |
| fractally / Larimer | whitepaper PDF `last-modified: 2022-02-22`; @dan's last Hive post 2024-03-22 | **Confirmed dormant**, measured from the account's own fields |
| gofractally team | `psibase` pushed 2026-09-25 | Alive but pivoted away from fractal governance |
| Eden Fractal | EF 145 "Season 13 Kickoff", 2026-09-15 | **Alive**, and their event titles study The ZAO: "The Growth of ZAO Fractal" (Jun 18), "ZAO Fractal Ecosystem and Starting Sparkz" (Aug 8) |
| Any other ORDAO adopter | GitHub code search for `@ordao/orclient` returns 2 repos: `sim31/ordao` and `bettercallzaal/ZAOOS` | None found on GitHub |

The ZAO and Eden Fractal are the two live implementations of this governance model on the Superchain, and The ZAO is the one whose dependency has gone quiet. Every roadmap item our docs attribute to Optimystics (Superchain ORDAO, Competition App, Respect.Games production) should be re-scoped to "The ZAO builds it, or it does not happen."

### 6. Our own library is wrong in places

| Claim | Where | Measured today |
|---|---|---|
| "505 total OREC governance transactions" | doc 1312 (July 2026) | 334. A monotonic counter cannot shrink, so this is wrong, not stale |
| "157 unique holders" | docs 1312, 1619, 1723 | OG holders 122, ZOR holders 64. The project's own verified reference (Doc 981) says 156 unique across both with overlap; the bare "157 OG" attribution is a propagated error |
| "running since October 2022" | doc 1312 | OG deployment dates the onchain record to 2024-07-30 |
| ZOR holders "4 (early adoption)" | doc 703 (May 2026) | 64 |
| OREC "242 transactions" | doc 703 | 334 |
| Fractal number "100-104" | doc 703 | onchain `periodNumber` 114, metadata "week 115" |
| Session day: "Monday 6pm EST" vs "every Thursday" | doc 703 vs docs 1312/1706 | UNRESOLVED. No surface this session could read settles it |
| OG "122 holders, 38,484 supply" | doc 703 | **Still exactly right**, because OG is frozen |

### 7. What we need to build, ranked

1. **Decide what OREC should read** (Key Decision 1). Everything else in Season 3 is built on the answer.
2. **Capture the manifesto.** 30 minutes with Zaal. Nothing else can start without the text.
3. **Write the `IRespect` wrapper spec and get it to a reviewer.** Tadas at ORDAO and Eden Fractal were named on 2026-09-26; neither has been asked yet. If neither commits, the season moves.
4. **Fix the record**: apply migrations 0005 and 0007, backfill the 21-week hole, stop writing `respect_points`.
5. **Build the join flow** (Manifesto Hat, Privy, gasless claim) and point fractal.thezao.com at it. DNS does not exist yet.
6. **Make the points page public** against live state rather than static JSON.
7. **Resolve the RLS service-role risk** before the bot handles member identity for Season 3.
8. **Take over upstream maintenance explicitly**, or pin to `@ordao/orec@1.4.4` and accept it is frozen.

## Also See

- [governance/703 - ZAO Fractal: Current State (May 2026)](../703-zao-fractal-current-state-may-2026/) - superseded on currency by this doc
- [governance/1312 - Respect Governance Deep Dive (July 2026)](../1312-zao-fractal-respect-governance-deepdive-jul2026/) - carries three measured errors, see section 6
- [governance/2301 - ZAO Fractal Weekly Record](../2301-zao-fractal-weekly-record/)
- [governance/2558 - Periodic Re-activation of Voting Rights](../2558-dao-periodic-reactivation-precedent/) - the precedent research this build plan rests on
- [governance/115 - ZAO Respect Data Reconciliation Plan](../115-zao-data-reconciliation/)
- [governance/103 - Fractal Governance Ecosystem](../103-fractal-governance-ecosystem/) and [governance/1772 - Eden Fractal Lineage](../1772-eden-fractal-lineage/) - both need the liveness update in section 5
- ZIP-2 (Season 3), merged Draft: `bettercallzaal/zao-papers`, `zips/zip-0002-season-3.md`
- Tracker: research-doc:2558, pr-auto:3658, handoff:season3-fractal-membership

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rule on what OREC's `respectContract` should point at: frozen OG, live ZOR, or a wrapper summing both | @Zaal | Decision | 2026-10-03 |
| Send the wrapper-review ask to Tadas (ORDAO) and Eden Fractal; season moves if neither commits | @Zaal | Outbound | 2026-10-03 |
| 30-minute manifesto capture session, text committed to zao-papers | @Zaal | Meeting | 2026-10-02 |
| PR to ZIP-2 adding the OG-versus-ZOR question as a named Open Item | @Zaal (lane drafts, zj reviews) | PR | 2026-10-08 |
| Apply migrations 0005 and 0007 to the live Supabase project, then backfill the 21-week hole | @Zaal | Deploy | 2026-10-17 |
| Decide the RLS service-role remediation named in the bot-hosting runbook | @Zaal | Decision | 2026-10-17 |
| Correct or retire docs 703 and 1312 against section 6 | @Zaal (lane drafts) | PR | 2026-10-24 |
| Pin `@ordao/orec@1.4.4` explicitly and record that upstream is dormant, or open maintainership talks with sim31 | @Zaal | Decision | 2026-10-31 |
| Re-measure ZOR total supply once a verified ABI is available | @Zaal | Research | wontfix unless the wrapper design needs it |

## Sources

Onchain, all Optimism chain 10, measured 2026-09-26
- `OREC.respectContract()` = `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`, `minWeight()` = 1000e18, `voteLen()`/`vetoLen()` = 259200s. [FULL - `cast call` against https://mainnet.optimism.io, re-run by the parent session]
- OG Respect total supply 38,484. [FULL - `eth_call totalSupply()`, raw `0x...082638c9370784d00000`, decoded by the parent session]
- OG newest transfer 2025-12-20T22:52:43Z; ZOR 64 holders, 373 transfers. [FULL - Blockscout v2 API, confirmed on both explorer.optimism.io and optimism.blockscout.com]
- ZOR newest mint 2026-09-24T23:53:05Z, periodNumber 114. [FULL - Blockscout NFT instance metadata]
- ZOR total supply. [FAILED - `totalSupply()` and `totalSupply(uint256)` both revert; no verified ABI on the explorer]

Repos, read-only via gh api and local clones
- [bettercallzaal/zao-fractal-bot](https://github.com/bettercallzaal/zao-fractal-bot) - `docs/audits/2026-09-08-all-weeks-points-audit-scope.md` (133 sessions, 801 scores, newest 2026-04-14, 771 of 801 zero), `src/game/split.ts`, `src/lib/voteThreshold.ts`, `src/lib/gameRepo.ts`, `src/lib/governance.ts`, `docs/deploy/bot-hosting-runbook.md`. [FULL - gh api, audit numbers re-verified by the parent session]
- [bettercallzaal/ZAOOS](https://github.com/bettercallzaal/ZAOOS) - `src/lib/hats/constants.ts` (`TREE_ID = 226`), `src/app/onboard/page.tsx`, `src/lib/agents/wallet.ts`. Zero hits for manifesto, IRespect, setRespectContract against a 29-file control for hats. [FULL - local grep with control]
- [ZAODEVZ/ZAOfractal](https://github.com/ZAODEVZ/ZAOfractal) - `whitepaper/draft/` 12 chapters, `dao/` dashboard app, open PR #20. [FULL - gh api]
- [bettercallzaal/zao-papers](https://github.com/bettercallzaal/zao-papers) - `zips/zip-0002-season-3.md`, status Draft, 5 Open Items, 0 open PRs. [FULL - git show]

Upstream liveness
- [sim31/ordao](https://github.com/sim31/ordao) - last commit 2026-04-02T13:46:17Z, 17 open issues, not archived. [FULL - gh api, verified by the parent session]
- `@ordao/orec` latest 1.4.4 published 2026-04-02T13:47:47Z. [FULL - registry.npmjs.org, verified by the parent session]
- Eden Fractal EF 145 "Season 13 Kickoff Game", 2026-09-15. [FULL - YouTube Atom feed for the channel, no auth]
- fractally.com whitepaper PDF `last-modified: 2022-02-22`; @dan last Hive post 2024-03-22. [FULL - `curl -I` and api.hive.blog condenser_api]
- optimismfractal.com, unchanged pause notice. [FULL - curl + HTML strip]
- GitHub code search for `@ordao/orclient`: 2 distinct repos. [FULL - gh api search/code. Bounded to GitHub; npm reverse-dependencies not checked]

Tooling note
- `gh search code` returned empty results for strings confirmed present in the target repos during this research (tested with a known-good control). The build-backlog dimension fell back to shallow clones plus local grep. The zao-research skill mandates `gh search code` at Step 2.5; that step is currently unreliable on this account and needs its own fix.
