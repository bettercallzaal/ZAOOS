---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-31
related-docs: "2656, 2657, 2562, 2558, 2642, 2419, 1327, 1307, 059, 056"
original-query: "i shared it whats next we shold do mroe with this info deep research where this lies and whats the best source of truth we wanna make new ercs tbh for respect and zao overall and incpportate the hats tree aswell"
tier: DEEP
lane: zao-members
---

# 2726 - Where ZAO member and Respect data lives, the source of truth for each question, and which new contracts are worth making

> **Goal:** Answer Zaal's 31 Oct 2026 ask from measurement: where this data lives, what should be trusted for what, whether to make new ERCs for Respect and The ZAO overall, and how Hats tree 226 fits. Research only. Nothing was deployed, signed or sent. Chain reads are Optimism, 31 Oct 2026. No member names or personal wallets appear here.

## Key Decisions

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | One source of truth for everything | **SKIP. USE one owner per question** (table below). Chain owns balances, Hats owns roles, ZID owns the person-to-wallet link | 15 stores hold overlapping data and they disagree (Conflicts). No single store can answer balance, reason and person together |
| 2 | Replace OG and ZOR with new Respect tokens | **SKIP.** Keep both contracts as the earned record | A new contract is a new distribution: ORDAO's own upgrade path says so, and Optimism Fractal took a "totally fresh" one. Moving 58,248 Respect across 172 wallets while 27 people have no wallet on file and 864 is unexecuted would re-open every flag in the audit. ZIP Season 3 already leaves both "untouched" |
| 3 | The contract that makes one ZAO-wide number | **BUILD the `IRespect` wrapper Zaal ruled on 10 Oct 2026 (item 78).** This is the "ZAO overall" contract. It is not a token: it holds no balances and only answers OG + ZOR | OREC still reads OG only: `respectContract()` returned the OG address on 31 Oct, while the last OG event is at block 145336193 and all weekly Respect goes to ZOR. One passed `setRespectContract` proposal fixes it with no migration. It waits on an external reviewer, and that ask is drafted but unsent per the zao-papers status file |
| 4 | OG's admin keys | **FIX BEFORE ANY OG ACHIEVEMENT MINT. New finding.** One personal wallet (no contract code) holds all three OG roles: admin, minter, transfer. OREC holds none of them | Measured with `getRoleMember` and `hasRole`. So the 26 Sep ruling that achievements become OG "through OREC" cannot execute as things stand: OREC has no mint right on OG. It also means OG is not under governance and depends on one key. ZOR by contrast is owned by OREC |
| 5 | Festival supporters | **The one new token worth making: a separate non-transferable Festivals Respect. Zaal chooses the form (table below); USE a second ORDAO deployment unless he wants plain ERC-20.** SKIP any transferable token until a lawyer has read it | 22 Sep ruled festival helpers earn in a ZAO Festivals fractal, 26 Sep ruled Respect splits by org, 31 Oct he raised an ERC-20. A search of vault decisions, status and project files found no ruling picking a form |
| 6 | The 4,650 festival points already inside OG | **LEAVE THEM IN OG. Zaal decides later whether the wrapper discounts them** | Nothing on chain separates festival Respect inside OG, and the no-burn ruling (26 Sep r6) blocks removing it. OG's admin also cannot burn other wallets' tokens under the thirdweb role model as read here, UNVERIFIED against the implementation source |
| 7 | Hats tree 226 | **KEEP org chart only until Season 3, per the 22 Sep ruling. Then USE the module already deployed: `ERC20Eligibility`, pointed at the wrapper, for role hats. Never for the Manifesto Hat** | It already exists: hat 226.1.1.4.1.1 reads OG with a minimum of 1, and has 0 wearers. Eligibility failure burns the hat (ZIP Season 3 section 3), so a lapse in activation would burn membership if the Manifesto Hat used it |
| 8 | Read Hats through RPC, not the subgraph | **USE direct `viewHat` calls.** A recursive walk of all 132 hats ran with no subgraph | Hats core's last commit is 2024-05-29. The deployed contract keeps working, but do not build on the hosted services. Doc 1307 already hit a dead subgraph URL on 2026-07-17 |
| 9 | Attestations (EAS) for "why was this earned" | **SKIP for Season 3.** ZOR award ids already encode meeting and wallet on chain; the gap is OG and festivals only, and a dated file in the vault covers it now | EAS is live on Optimism at the predeploy address, but ZIP Season 3 measured that EAS cannot be OREC's weight source. Building it now is a new project during the lock-in |
| 10 | Ali's gifted stock allocated by token balance | **Lawyer before any allocation rule. This doc gives no legal answer** | SEC page fetch failed and only law-firm search snippets came back. Not established here, not legal advice |

## The owner per question

| Question | Owner | Reader today | State 31 Oct 2026 |
|---|---|---|---|
| How much Respect does a wallet hold? | **Chain.** OG `balanceOf`, ZOR `balanceOf(w, 0)` | `src/lib/respect/voteWeight.ts`, `src/app/api/proposals/vote/route.ts` | 172 wallets, OG 38,484 = `totalSupply()`, ZOR 19,764 = `totalRespect()` |
| How much is coming but not minted? | **OREC stage, read live** | Fractal lane, audit scripts | 864 in 4 live proposals (14 awards). Up to 2,760 in expired or failed proposals (51 awards whose exact id `tokenExists` reads false), of which 1,010 is in the unexecuted re-mint packet and some is repeat attempts at one award, so the true amount is lower and unsettled. ZOR lags a meeting by at least 6 days (`voteLen` + `vetoLen`, 259,200 s each) |
| Why was ZOR earned? | **ZOR award id plus ornode title** | Audit | Filled for 337 held award ids |
| Why was OG earned? | **Airtable, hand-kept, then freeze a dated copy in the vault** | Audit, `src/app/api/admin/respect-import/route.ts` | Airtable differs from OG on 8 wallets. Chain wins on amount |
| Who is this wallet? | **ZID (22 Sep ruling: primary key). Built: not yet.** Until then the private audit CSV | `users`, `data/members.json`, Airtable all partly | 23 wallets unmatched, 27 people with no wallet, 2 candidate duplicate pairs |
| Who holds which role? | **Hats tree 226** | `src/lib/hats/`, `src/app/api/hats/check/route.ts` | Below |
| Who is a member? | **Unresolved: four definitions.** Manifesto Hat in Season 3 | Doc 1327, `allowlist`, any Respect above 0 | Needs Zaal at Season 3, ZIP not yet Accepted |
| Anything in Supabase `respect_members`, `fractal_scores` | **Cache only. Never quote as truth** | `respect_members`: 45 files under `src`, tests included | Keyed by name. Deployed v1 bot "wrote nothing from 2026-03-23" per ZAOfractal research |

## Where it lives, all 15 stores

| Store | Holds | Writer | Freshness evidence | Trust |
|---|---|---|---|---|
| OG ERC-20 | Early Respect, OREC's weight today | One wallet by role | Last event block 145336193 | High on balance |
| ZOR ERC-1155 | Weekly Respect | OREC | Live, 393 events | High, lags by 6+ days |
| Hats tree 226 | Roles | Tree admins | Walked on chain 31 Oct | High |
| `users` | Login, `respect_wallet`, `zid`, `role` | Auth, admin routes | Rows not read | Medium |
| `allowlist` | App access | Admin, seed script | Rows not read | Medium |
| `respect_members` | Cached totals by name | Airtable import, sync, webhook | Rows not read | Low to medium |
| `fractal_sessions`, `fractal_scores` | Game results | Bot webhook, import | Gap reported | Low |
| `respect_transfers` | Transfer log | Alchemy webhook | Delivery not checked | Unknown |
| `proposal_votes` | App votes | Vote route | Rows not read | Off-chain only |
| Ornode | Proposal index and titles | Frapps indexer | 179 proposals pulled 31 Oct | Medium |
| Airtable exports | Points, name-to-wallet | By hand | Vault copy 2026-09-27 | Not proof of control |
| ZAOfractal `data/members.json` | 144 rows, wallet and name | Build script | `generatedAt` 2026-08-26 | Stale snapshot |
| `crm_contacts`, `contacts` | CRM | One-time script | Rows not read | Low for membership |
| Audit CSV (private) | Join of the above | zao-members lane | Block 158930150 | Best join so far |
| Vault member map | 12 Oct census | Build script | ZOR column summed all ids | Superseded |

Rows marked "not read" are a limit of this run: no Supabase row was queried.

## Conflicts

| # | Surface A | Surface B | Resolve |
|---|---|---|---|
| 1 | OREC weight: OG only (measured) | App and Snapshot: OG + ZOR. Discord vote route: `total_respect` from `respect_members` (`src/app/api/discord/proposals/vote/route.ts`) | Wrapper for OREC (KD3). Discord route should stop reading the cache |
| 2 | `src/app/api/respect/leaderboard/route.ts` tries `respect_members` first | `src/lib/respect/leaderboard.ts` reads `users`, and line 197 calls a function ZOR lacks (card 10650) | One read path, from chain |
| 3 | `src/app/api/fractals/proposals/route.ts` uses host `ornode2.frapps.xyz`, which did not resolve from this Mac | ZAOfractal and the audit use `zao-ornode.frapps.xyz` | Confirm from a second network, then change the host |
| 4 | Older docs say OG is soulbound | OG has 449 moves, 447 from one wallet: it is transfer-restricted, with one wallet allowed to send | Say "transfer-restricted". 38,484 was minted to that wallet and sent out |
| 5 | Vault status file: Respect "never burns" | Batch burn of 848 at block 142844934 | Past event, before the rule. Say so |
| 6 | Docs 1531 and 1532 give 157 holders | Chain 31 Oct: 172 wallets | Docs are dated counts. Never quote without a block |
| 7 | 22 Sep: Hats has no platform powers | `src/app/api/music/track-of-day/select/route.ts` grants a hat permission | Zaal's to rule or the code changes |

## New contract options

| Option | What it is | Good | Bad | Verdict |
|---|---|---|---|---|
| Wrapper (`IRespect`) | Reads OG + ZOR, gated by activation | No migration, already ruled, one proposal to install, reversible by another | New unaudited code on the vote path, needs external reviewer | **BUILD**, after review |
| New unified Respect token | One ledger, re-minted | Clean single contract | Fresh distribution, migration errors, drops ZOR's award history, breaks no-burn | **SKIP** |
| Festivals as second ORDAO deployment (`Respect1155` + OREC) | Same stack as ZOR, own ledger | Non-transferable awards that sum to a balance, per-award provenance, the fractal Zaal ruled on 22 Sep, no custom Solidity. GPL-3.0 | A second governance surface to run | **USE** unless Zaal wants simpler |
| Festivals as non-transferable ERC-20 | OpenZeppelin ERC-20 with `_update` reverting when both sides are non-zero | Simplest, every wallet shows it, what Zaal named on 31 Oct | No award history, someone must hold mint rights, which repeats KD4 unless a Safe or OREC owns it | Acceptable if owned by a Safe or OREC |
| Festivals as `SolidRespect` | ORDAO's ERC-20-compatible token with a fixed distribution at deployment | Fits a one-time thank-you snapshot | Cannot grow | Only for a closed past event |
| Soulbound NFT standards (ERC-5192, ERC-5484) | One token per award | Both Final | Our Respect is an amount, and ZOR already does awards. Wallet support not checked | **SKIP** |
| Transferable supporter token | Tradable ERC-20 | Liquidity | Securities questions, and doc 1327 says membership needs no purchase | **SKIP** without counsel |

## Hats tree 226, measured

Walked recursively with `viewHat` on `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`, 31 Oct 2026.

| Fact | Value |
|---|---|
| Hats | 132, down to 7 levels below the top hat |
| With a wearer | 35. Empty: 97 |
| Sum of supply | 146 |
| Active / inactive | 129 / 3 |
| Immutable | 1 (the top hat) |
| Eligibility is the default no-module address `0x...4a75` | 95 |
| `AgreementEligibility` modules | 32, carrying 77 wearers |
| `ERC20Eligibility` modules | 1, on 226.1.1.4.1.1, reads OG, minimum 1, 0 wearers |
| Module with no verified name | 2, carrying 5 wearers. UNVERIFIED what they do |
| Eligibility set to a plain wallet / to the zero address | 1 / 1 |

Doc 059 and doc 1307 describe 17 project hats and manual eligibility. The tree has grown past that, and "manual" no longer holds for 35 hats. A hat's wearers were not read, so no person is linked to a hat here.

## Risks found while reading

- **The holder audit undercounted unminted awards.** PR 385's 33 awards and 1,780 came from a filter that dropped an award when the wallet held the same value within 2 meetings, which also removes real repeat ranks. A recount of all 179 ornode proposals with no filter, checking `tokenExists` per award id on 31 Oct, gives 864 live and up to 2,760 dead. The fractal lane caught it against its re-mint packet (1,010, matched here). Balances were never affected.
- **ERC-7702 and mints.** ORDAO issue 27 (opened 2026-02-23, open) is "Denial of respect distribution through ERC-7702". Six holder wallets are 7702-delegated, and a failed execute cannot be retried, per the fractal lane. Replay before executing awards to those wallets.
- **Governance parameter issue.** ORDAO issue 23 (opened 2025-09-29, open): "passing rejected proposal by changing minWeight". The reviewer should read it. OREC's `minWeight` here is 1,000 Respect.
- **Upstream pace.** ORDAO's last commit is 2026-04-02 and it has 3 stars. It works and is deployed, but The ZAO is close to being its own maintainer. Hats core has not moved since 2024.
- **Season 3 date.** ZIP Season 3 and the 26 Sep ruling say 1 December 2026, and the wrapper review has not been asked for. The date is at risk from that one unsent message.

## Evidence quality

Reddit returned 403 and `forum.optimism.io` did not resolve. Community evidence is thin and old: the ERC-5192 Ethereum Magicians thread (2022, including dissent that non-transferable tokens block key rotation and that the standard "will severely limit adoption"), low-point HN results from 2022 and 2023, and two live ORDAO issues. No consensus is claimed. Not established: wallet and indexer support for soulbound standards, Hats fees and chain list, a named DAO running a token-threshold hat, Merkle claim cost on Optimism, and all legal questions. Supabase rows, live Airtable and Discord were not read.

## Also See

- [Doc 2656](../2656-zao-core-system-map/) - the system map and contradictions as of 10 Oct
- [Doc 2657](../2657-respect-binding-token-design/) - Respect as the binding token, one definition of weight
- [Doc 2562](../2562-zao-fractal-state-and-build-plan/) - the OG-frozen finding
- [Doc 2558](../2558-dao-periodic-reactivation-precedent/) - activation, and why it cannot be a Hats module
- [Doc 2642](../2642-zao-holder-approval-systems-inventory/) - voting systems inventory
- [Doc 2419](../../identity/2419-zid-state-and-signup-spec/) - ZID state
- [Doc 1327](../../community/1327-zao-membership-definition-jul2026/) - membership definitions
- [Doc 1307](../1307-hats-protocol-zao-org-chart/), [Doc 059](../059-hats-tree-integration/) - Hats, now behind the measured tree above
- Vault: `notes/private/zao-respect-holders-audit-2026-10-31.md` on PR 385, `decisions/grill-2026-10-09-seat-morning.md` item 78, `decisions/grill-2026-09-26-zao-papers-afternoon.md`, `decisions/grill-2026-09-22-seat-morning.md` item 28, `decisions/grill-2026-09-22-seat-afternoon.md` item 18
- Board: card 10649 (re-run holder list after mints), card 10650 (leaderboard line 197)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send the wrapper reviewer ask; shipped when `projects/reviewer-ask-activation-wrapper-2026-09-26.md` is sent to an outside Solidity reviewer and the status file says who | @Zaal | Outbound | 2026-11-05 |
| Decide OG roles (KD4): grant OREC minter, and move admin to a Safe or keep it; shipped when a decisions file carries his words. No transaction from any lane | @Zaal | Decision, then on-chain by him | 2026-11-14 |
| Pick the Festivals Respect form (KD5) and whether festival OG keeps vote weight (KD6); shipped when a decisions file carries his words | @Zaal | Decision | 2026-11-14 |
| Ask a lawyer about allocating stock by token balance; shipped when the answer is in the vault | @Zaal | Outbound | 2026-11-14 |
| Code PR: Discord vote route and leaderboard read chain, ornode host fixed if a second network confirms; shipped when a ready ZAOOS PR with tests is open | @zao-members lane | PR | 2026-11-21 |
| Identify the 2 unnamed Hats modules and read wearers on chain into the private audit; shipped as a dated vault note | @zao-members lane | Vault note | 2026-11-21 |

## Sources

Method is per source. "raw" means raw GitHub text or the REST API, "RPC" a direct `eth_call`, "WF" a WebFetch model summary, so its wording is not a quotation of the page. "Re-read" means this session read it again after the research agent did.

Chain and code, this run:
- [OREC on Blockscout](https://optimism.blockscout.com/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532) - [FULL, RPC: `respectContract`, `owner`, `voteLen`, `vetoLen`, `minWeight`]
- [OG on Blockscout](https://optimism.blockscout.com/address/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957) - [FULL, RPC for roles, implementation name `TokenERC20` from the Blockscout API. Implementation source not read]
- [ZOR on Blockscout](https://optimism.blockscout.com/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c) - [FULL, RPC and log replay]
- [Hats contract on Blockscout](https://optimism.blockscout.com/address/0x3bc1A0Ad72417f2d411118085256fC53CBdDd137) - [FULL, RPC walk of tree 226, module names from the Blockscout API]
- [Live tree view](https://app.hatsprotocol.xyz/trees/10/226) - [FAILED as a source: not opened, the chain read replaces it]
- ZAOOS `community.config.ts`, `src/lib/hats/constants.ts`, `src/lib/respect/voteWeight.ts`, routes named above - [FULL, git at origin/main]
- [ZIP Season 3](https://github.com/bettercallzaal/zao-papers/blob/main/zips/zip-0000-season-3.md) - [PARTIAL: sections 3 and rationale read, not all 492 lines]

ORDAO:
- [sim31/ordao](https://github.com/sim31/ordao) and [README](https://raw.githubusercontent.com/sim31/ordao/main/README.md) - [FULL, raw]
- [LICENSE](https://raw.githubusercontent.com/sim31/ordao/main/LICENSE) - [FULL, raw, re-read: GPL-3.0]
- [UPGRADE_PATH.md](https://raw.githubusercontent.com/sim31/ordao/main/docs/UPGRADE_PATH.md) - [FULL, raw, re-read: "a new Respect token at a different onchain address", "totally fresh token distribution"]
- [OF_ORDAO_UPGRADE.md](https://raw.githubusercontent.com/sim31/ordao/main/docs/OF_ORDAO_UPGRADE.md) - [FULL, raw, re-read]
- [OREC.md](https://github.com/sim31/ordao/blob/main/docs/OREC.md) - [PARTIAL, WF only]
- [Issue 27, ERC-7702](https://github.com/sim31/ordao/issues/27) and [Issue 23, minWeight](https://github.com/sim31/ordao/issues/23) - [PARTIAL: titles and dates re-read through the API, bodies not read]

Standards:
- [ERC-5192](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-5192.md), [ERC-5484](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-5484.md), [ERC-4973](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-4973.md), [ERC-5805](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-5805.md) - [FULL for status, raw frontmatter re-read: Final, Final, Review, Review]
- [ERC-6239](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-6239.md), [ERC-6982](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-6982.md), [ERC-6372](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-6372.md) - [FULL for status, raw frontmatter, research agent only]
- [OpenZeppelin ERC20.sol](https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol) - [FULL, raw: `_update` is the virtual hook]
- [ERC-5192 discussion, Ethereum Magicians](https://ethereum-magicians.org/t/eip-5192-minimal-soulbound-nfts/9814) - [PARTIAL, WF summary, community source with dissent]
- [HN search, "soulbound token"](https://hn.algolia.com/?q=soulbound%20token) - [PARTIAL, API result list only, low points]

Hats and attestations:
- [Hats-Protocol/hats-protocol](https://github.com/Hats-Protocol/hats-protocol) - [FULL, REST re-read: last commit 2024-05-29, 98 stars. LICENSE file re-read: AGPL-3.0]
- [Hats-Protocol/hats-module](https://github.com/Hats-Protocol/hats-module) and [hats-account](https://github.com/Hats-Protocol/hats-account) - [PARTIAL, REST metadata, pushed 2025-03-15 and 2024-06-20]
- [Hats docs](https://docs.hatsprotocol.xyz/) - [PARTIAL, WF: developer pages not fetched]
- [EAS contracts README](https://raw.githubusercontent.com/ethereum-attestation-service/eas-contracts/master/README.md) - [FULL, raw, re-read: Optimism `0x4200...0021`]

Failed after escalation, with nothing here resting on them:
- [SEC small business exemptions](https://www.sec.gov/smallbusiness/exemptofferings) - [FAILED: 404 by WF. Law-firm results were search snippets only, so no legal claim is made]
- `reddit.com` - [FAILED: 403]
- `forum.optimism.io` - [FAILED: did not resolve]

Credit: the fractal lane (Fractal 122 run sheet) supplied the proposal stages, the failed-execute behaviour and the 864 split, as a peer view on 31 Oct. Respect stack by sim31 and Optimystics (GPL-3.0). Hats Protocol (AGPL-3.0). OpenZeppelin Contracts (MIT).
