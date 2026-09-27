---
topic: governance
type: decision
status: research-complete
last-validated: 2026-09-26
superseded-by:
related-docs: "governance/2562-zao-fractal-state-and-build-plan, governance/2558-dao-periodic-reactivation-precedent, governance/103-fractal-governance-ecosystem, governance/718-zao-fractal-whitepaper-foundations, governance/941-respect-burn-decay-proposal, governance/1772-eden-fractal-lineage, business/1349-zabal-gamez-empire-tokenless-first-jul2026"
original-query: "keep researching more on this idea its not somethign to be decided overnight - per-project Respect (ZAO Festivals Respect, ZAO Fractal Respect for governance, WaveWarZ Respect later), each split to its own org, with OG Respect becoming a one-time achievements ledger"
tier: DISPATCH
---

# 2563 - Per-Project Respect: What the Precedent Says Before We Commit

> **Goal:** Zaal proposed splitting Respect by project, each to its own org, with OG becoming a one-time achievements ledger, and said explicitly this is not to be decided overnight. This doc is the homework: who has done it, what it costs to build, how it gets gamed, and the two questions that decide whether it works here.

Four parallel agents (sub-unit reputation precedent, the fractal tradition's own design, implementation on Optimism, and gaming and social failure), with load-bearing claims re-verified by the parent session. Companion to `governance/2562-zao-fractal-state-and-build-plan`, which found the problem this idea has to solve.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Is per-project Respect consistent with the fractal tradition? | **YES for splitting, NO for the part Zaal wants most.** Independent per-community Respect IS the tradition's base case. One fractal governing the others is not in it anywhere. | Larimer's whitepaper glossary defines a fractal as "A community with its own independent currency (Respect) and governance," and designs for "hundreds or thousands of ƒractals." But Respect never composes across them: the only cross-fractal link described is an "Extended Community" of investors who hold multiple tokens. ORDAO matches this - Eden, Optimism Fractal and ZAO each run a wholly separate instance with no cross-instance composition. **The governing layer is new ground, not tradition being reactivated.** |
| 2 | How should project Respect reach an org-wide vote? | **START WITH THE GATE MODEL, NOT THE WEIGHT MODEL.** Project Respect makes you eligible to represent that project in fractal governance; it does not become org-wide voting power. | This is how unions, co-ops and church polity have always done it: local standing is a gate, not a weight. It sidesteps the two hardest problems at once - no exchange rate between a Festival unit and a fractal unit, and no way for a project to mint itself org-wide power. MakerDAO is the cautionary case: its subDAO tokens do not vote at the parent, and a proposal to give parent holders an automatic claim on sub-org tokens was **rejected**. |
| 3 | If we do want proportional weight later, whose model? | **COLONY'S, and only Colony's.** | Colony is the one live implementation of exactly this shape. Verified from their docs by this session: "When reputation is earned in a Team, a proportion is also earned in the Root DAO," with a worked example of 15.5% of a team reading as 5.5% at root. Its anti-inflation property is structural - root reputation is a share of the whole org's activity, so a project inflating itself dilutes its own share unless the org grows. It also requires the two things we just ruled against or have not built: continuous decay, and minting only from verified payment events. |
| 4 | Does this fit in Season 3, launching 1 December? | **NO. Design it in Season 3, ship the second ledger in Season 4.** | Nobody has built the thing Zaal actually wants (see #1), our own pool is 6-30 active weekly, and the risk with the least evidence behind it is exactly fragmentation at small scale. 66 days is not enough to be first at something and also launch a production cutover. |
| 5 | Which ledger shape, when we do build it? | **Separate contract per project.** | `bettercallzaal/zaofractal-contracts` (private) already holds `ZAORespect.sol`, a soulbound ERC-20 written as an OREC drop-in. Deploying two more with different constructor args needs no changes to OG or ZOR, and pushes all new complexity into one small aggregator. |
| 6 | Achievements ledger shape | **ERC-1155 with an id per achievement**, on the pattern ZOR already runs. | It is the only option where "earned once" is enforced by the contract rather than promised by a script: the deployed `Respect1155Base` reverts on re-mint via its existing `TokenAlreadyExists` check. Cost is trivial - roughly $0.13 in L2 execution gas for 780 awards, batched. |
| 7 | Do we already have a per-project points system? | **YES, and it should be the pilot.** ZABAL Gamez. | `business/1349-zabal-gamez-empire-tokenless-first-jul2026` already specifies a public leaderboard with per-action points and soulbound achievement NFTs, season-based with history persisting. That is per-project Respect in all but name, already designed and owned. Dogfood there before touching governance. |

## Findings

### 1. The tradition splits, but it does not federate

Larimer designed for many fractals. The whitepaper's own glossary: a fractal is "A community with its own independent currency (Respect) and governance... A group or community with its own smart contract, respect, and governance process," and it anticipates "hundreds or thousands of ƒractals" where people "govern in their 'local' community" while participating in extended ones.

What it does not contain, anywhere: sub-fractals, federated fractals, a fractal of fractals, or any mechanism by which Respect earned in one fractal carries weight in another. The only cross-fractal relationship described is economic - an "Extended Community" of people who hold several fractals' tokens and "vote with their feet/wallet."

"Fractal Democracy" sounds like the missing mechanism and is not: it is recursive small-group escalation **inside one fractal's own currency**, not a federation of separately-tokened communities.

ORDAO's tooling matches the tradition exactly. Eden Fractal, Optimism Fractal and ZAO Fractal each run a separate instance (`eden.frapps.xyz`, `optimism.frapps.xyz`, `zao.frapps.xyz`) with no cross-instance Respect composition. The "Parent Respect" naming in ORDAO's own docs is **not** an org hierarchy - it is temporal versioning, the old contract weighting votes during migration to a new one.

So: **the half of Zaal's idea that says "each project gets its own Respect, split to its own org" is the tradition's base case. The half that says "the fractal governs the whole" has no precedent in the tradition, no contract in ORDAO, and no design doc anywhere.** The closest thing in our own library is doc 103's "Higher-Order Fractals" line, which sits under a 2026-2027 roadmap heading, is explicitly unbuilt, and is marked reconstructed rather than primary-sourced.

The tradition's one relevant caution is cultural: fractals "will likely work best when composed of people from a similar culture," which is an argument for keeping groups small and independent rather than merging pools.

### 2. Everyone who tried a version of this

| Org | How reputation splits | How it reaches an org-wide vote | Inflation defence | Outcome |
|---|---|---|---|---|
| **Colony** | Per team/domain, in a tree under Root | **Proportional flow-up**: earning in a team earns a smaller share at Root. Docs example: 15.5% in Dev Team, 5.5% at Root | Non-transferable, minted only from verified payment events, decays (~3.5-month half-life). Inflating a team drains that team's own treasury and dilutes its relative share | Live since 2020, not reversed, but narrowly adopted. No large DAO copied it |
| **MakerDAO / Sky Stars** | Each Star issues its own token | **It does not.** Star tokens never vote at the parent | A proposal to guarantee parent holders 25% of every Star token was **rejected** (2025-02-18) | Live but contentious; holders blamed Star emissions for parent-token decline |
| **Optimism** | Two chambers: OP tokens, and non-transferable Citizen identity | Not aggregation - **separation of powers**, with Citizens' House holding veto over Token House | The uninflatable chamber checks the inflatable one | Operating, with whale concentration tracked as a live risk |
| **Gitcoin workstreams** | Separate budgets and identities, one shared token | N/A, no per-workstream reputation existed | N/A | **Abandoned** over roughly three years. Scope and budget accreted faster than output, with nothing making that visible but a once-a-season budget review |
| **Moloch / DAOhaus** | Each DAO fully separate | Only via explicit delegation contracts (minions/shamans) | A DAO must be admitted as a normal member elsewhere | Live, and the opposite design choice: separation by default |
| **1Hive Gardens** | Each swarm its own token | **No org-wide layer at all** | N/A | Live, and the negative case: a contributor active in one Garden has zero standing anywhere else |
| **Unions, co-ops, church polity** | Local standing per chapter | **Standing is a GATE, not a weight.** It decides whether you can be a delegate; the delegate then casts one vote | A chapter cannot inflate individual influence because individual standing never becomes numeric org-wide power | Centuries of operation |

The last row is the design nobody has put in front of Zaal, and it is the one that fits his stated goal - projects run themselves, the fractal decides shared things - without requiring an exchange rate between Festival Respect and governance Respect.

### 3. What it would take to build

OREC's read path decides everything. `OREC.respectOf()` branches at set-time: if the target contract answers `supportsInterface(type(IRespect).interfaceId)`, it calls `IRespect.respectOf`, otherwise it falls back to `IERC20.balanceOf`. `setRespectContract` and `setMinWeight` are both `onlyOwner`, and OREC's constructor runs `Ownable(address(this))`, so **only a passed proposal can change either**.

Measured by this session, 2026-09-26: the IRespect interface id is `0x58970ca8`; `ZOR.supportsInterface(0x58970ca8)` is **true**; `ZOR.respectOf()` on a live address returns **842**. ZOR is already a drop-in. Repointing OREC at the live ledger needs no new contract, only a proposal (plus a `setMinWeight` recalibration, since OG and ZOR are not on one scale).

For the multi-ledger version, the shape with least migration is one contract per project, because `ZAORespect.sol` already exists as an OREC-shaped soulbound ERC-20 in the private `zaofractal-contracts` repo. All the new complexity goes into one aggregator that implements `IRespect`, reads each ledger, applies a per-project coefficient and optional cap or square-root damping, and returns a single number. The coefficients live in storage rather than code, and if the aggregator is owned by OREC then changing a project's weight is itself a governance proposal rather than an admin action.

Order matters in one place: the activation gate must run **per ledger, before aggregation**, not after. Once balances are summed, the aggregator cannot tell which units came from which project, so a per-project activation rule ("your Festivals Respect counts only if you did something in Festivals lately") becomes impossible to express. If the gate is account-wide, both orders give the same answer.

Costs are not a constraint. 156 members across 5 achievement types is 780 awards: roughly 61.6M gas unbatched, 48.5M batched, which at the measured Optimism L2 gas price works out around $0.17 and $0.13 respectively. That excludes the L1 data-posting component, which the agent could not fetch, so the true figure is higher by an unknown but small amount.

### 4. How it gets gamed, and the honest gaps

Ranked for a 156-member org with 6 to 30 active weekly:

1. **Fragmentation thinning peer evaluation.** Three ledgers across a pool this size can put single digits in each project's weekly session. Peer ranking depends on enough peers. **No study exists on minimum viable group size for peer assessment at this scale** - searched and not found. This is the risk with the least evidence and the highest chance of quietly breaking the thing that works today.
2. **One-time achievements as permanent voting power.** The badge literature models achievement-seeking as optimising toward the badge criteria rather than the behaviour it was meant to signal, and warns of intrinsic motivation eroding when badges are disconnected from ongoing feedback. Five cheap achievements minting permanent weight rewards completion, not contribution.
3. **Sybil exposure, which our own onboarding design creates.** Gasless, sponsored, email-capable Privy onboarding makes a second identity nearly free, and each identity can complete every achievement independently. Gitcoin's own published finding is that cheap-identity-plus-small-reward cannot cleanly separate newcomers from farmers; Optimism paid wallets flagged as sybils in its first airdrop again in its second.
4. **A project minting itself into org-wide power.** Defences exist on paper - caps, parent-set coefficients, quadratic aggregation. **No case was found of a parent DAO auditing a sub-unit's ledger for inflation and applying a correction.** Colony's structural answer (share-of-whole, decay, mint-only-from-payments) is the only one with a mechanism rather than an intention behind it.
5. **In-group formation and a thin org-wide vote.** Members specialise into their project and stop showing up for shared decisions. Unstudied for sub-ledger fragmentation specifically.

What nobody has studied, stated as absence rather than reasoned around: no paper or forum thread on a DAO splitting reputation into project ledgers that feed one parent vote; no minimum-group-size evidence for peer assessment at 100-200 members; no empirical postmortem of a parent correcting a sub-unit's inflated ledger; no academic POAP literature at all.

### 5. We already have a per-project points system, and it is not in governance

`business/1349-zabal-gamez-empire-tokenless-first-jul2026` specifies, for ZABAL Gamez: a public leaderboard scoring workshop attendance (1 point), project submission (5), peer-voted bid accepted (10), WaveWarZ song uploaded (3), mentorship given (2), cohort completion (15 bonus); soulbound achievement NFTs; season-based with past scores persisting in history; deliberately tokenless first, because "tokens create front-running, speculation pressure, and regulatory caution before the product proves itself."

That is the pilot. It is already designed, already owned by Zaal and Iman, and it carries no governance risk because it feeds no votes. Two notes: its achievement NFTs were specified on Base while the fractal, OG, ZOR and OREC are all on Optimism, and its "season resets, history persists" rule is the same shape as the 2026-09-26 no-burn ruling.

### 6. A live contradiction in our own library

`governance/941-respect-burn-decay-proposal` is frontmatter status `proposal-draft`, last validated 2026-07-02, and states as ground truth "confirmed in code, 2026-07-02: Respect has NO decay and NO burn today." **It was never ratified**, so cutting decay from the whitepaper on 2026-09-26 contradicts no passed proposal.

But `governance/1772-eden-fractal-lineage`, validated two weeks later on 2026-07-20, lists "Decay model: 2% weekly decay (34-week half-life) - unique to ZAO" in a comparison table as though it were live. Two of our own docs, two weeks apart, disagree about whether ZAO runs decay. The chain says no ledger has ever decayed. Doc 1772's row needs correcting.

## Also See

- [governance/2562 - The ZAO Fractal: Where We Are and What We Need To Build](../2562-zao-fractal-state-and-build-plan/) - the OG-versus-ZOR finding this doc responds to
- [governance/2558 - Periodic Re-activation of Voting Rights](../2558-dao-periodic-reactivation-precedent/)
- [governance/718 - ZAO Fractal Whitepaper: Research Foundations](../718-zao-fractal-whitepaper-foundations/)
- [governance/941 - Respect Burn/Decay: the votable proposal](../941-respect-burn-decay-proposal/) - never ratified, see section 6
- [governance/1772 - Eden Fractal Lineage](../1772-eden-fractal-lineage/) - carries a decay row that contradicts the chain
- [business/1349 - ZABAL Gamez Empire: Tokenless-First Design](../../business/1349-zabal-gamez-empire-tokenless-first-jul2026/) - the pilot
- Decisions: `~/zao-vault/decisions/grill-2026-09-26-zao-papers-afternoon.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rule between the gate model (project Respect makes you eligible to represent that project) and the weight model (project Respect becomes org-wide voting power) | @Zaal | Decision | 2026-10-10 |
| Confirm per-project Respect is Season 4, with Season 3 shipping one governance ledger and the design written down | @Zaal | Decision | 2026-10-10 |
| Decide whether ZABAL Gamez is the dogfood pilot, and on which chain, since doc 1349 says Base and everything else is Optimism | @Zaal | Decision | 2026-10-17 |
| Correct doc 1772's "2% weekly decay - unique to ZAO" row against the chain and the 2026-09-26 no-burn ruling | @Zaal (lane drafts) | PR | 2026-10-17 |
| Open-source or at least document `zaofractal-contracts`, which is private and holds the OREC drop-in the whole design depends on | @Zaal | Decision | 2026-10-24 |
| If the weight model wins, spec the aggregator with coefficients in storage and OREC as its owner, and put the per-ledger activation gate before aggregation | @Zaal (lane drafts) | Spec | wontfix unless the weight model is chosen |

## Sources

Fractal tradition
- [Fractally White Paper](https://fractally.com) - glossary definition of a fractal, "hundreds or thousands of ƒractals", Extended Community, "similar culture" caution. [FULL - the PDF links 404 directly and resolve via a build proxy to a Google Drive file; downloaded and read with pdftotext -layout, 1869 lines]
- [Fractally White Paper Addendum 1](https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1) - no multi-fractal content; grepped for sub-fractal, federation, composition: zero matches. [FULL - Hive API condenser_api.get_content, 13,728 chars]
- @dan's full Hive blog, 662 posts 2016-2024, paginated. No "Addendum 2" exists under that name. [FULL - condenser_api.get_discussions_by_blog]
- [sim31/ordao](https://github.com/sim31/ordao) - `docs/OF2-CONCEPT.md`, `docs/UPGRADE_PATH.md`: "Parent Respect" is temporal versioning during contract migration, not an org hierarchy. Separate instances per community. LICENSE read: GPLv3. [FULL - gh api]
- Eden Fractal YouTube feed - two interleaved series (EF weekly game, ETH town hall), no evidence of multiple Respect pools. [FULL - Atom feed, no auth]
- respect.games - [FAILED - curl hung, no content returned]

Precedent
- [docs.colony.io/learn/governance/teams](https://docs.colony.io/learn/governance/teams) - "When reputation is earned in a Team, a proportion is also earned in the Root DAO", the 15.5%/5.5% example. [FULL - curl + HTML strip, re-verified by the parent session]
- [docs.colony.io/learn/governance/reputation](https://docs.colony.io/learn/governance/reputation) - non-transferability, minting from payment events, decay. [FULL - curl + HTML strip]
- [MakerDAO forum AEP#7](https://forum.makerdao.com/t/aep-7-securing-mkr-holder-airdrop-of-spk-subsequent-stars/26010) - status "Rejected-Misaligned", 2025-02-18. [FULL - Discourse JSON]
- [MakerDAO forum, economics of Star creation](https://forum.makerdao.com/t/the-economics-of-star-creation/25975) - 70/15/15 emission split, buy-and-burn. [FULL - Discourse JSON]
- [gov.optimism.io topic 9966](https://gov.optimism.io/t/the-weight-of-influence-an-analysis-of-the-power-in-the-collective/9966) - Citizens' House veto over Token House; ~2.7% of OP supply delegated. [FULL - Discourse JSON]
- [gov.gitcoin.co topic 12612](https://gov.gitcoin.co/t/refactoring-gitcoin-dao-evolving-the-fdd/12612) - Jan 2023 proposal to end the FDD workstream. [FULL - Discourse JSON]
- [DAOhaus docs](https://docs.daohaus.club/) and [Moloch v2 README](https://raw.githubusercontent.com/Moloch-Mystics/moloch/master/README.md) - minions/shamans as explicit delegation, not shared reputation. [FULL]
- [1Hive Gardens docs](https://1hive.gitbook.io/gardens/) - each swarm its own token, no parent layer. [FULL]
- Union, co-op and church-polity federation practice (standing as a gate, not a weight). [PARTIAL - drawn from the agent's background knowledge, NOT raw-fetched this pass. Needs a sourcing pass against actual constitutions before it is quoted in a ZIP]

Implementation
- OREC `Orec.sol` source, `respectOf` branch logic, `setRespectContract`/`setMinWeight` both `onlyOwner` with `Ownable(address(this))`. [FULL - Blockscout verified source]
- OG Respect is an EIP-1167 clone of TokenERC20 at `0x21bDBa30AFc2B8205E8a173626346868077572FB`, no IERC165, so OREC uses the ERC-20 fallback. [FULL - Blockscout verified source]
- `Respect1155Base` implements IRespect and reverts on re-mint via `TokenAlreadyExists`. [FULL - Blockscout verified source]
- IRespect id `0x58970ca8`; `ZOR.supportsInterface` true; `ZOR.respectOf` returns 842 on a live address. [FULL - `cast` against mainnet.optimism.io, measured by the parent session]
- [bettercallzaal/zaofractal-contracts](https://github.com/bettercallzaal/zaofractal-contracts) - PRIVATE, pushed 2026-07-22, holds `src/IRespect.sol` and `src/ZAORespect.sol`. No LICENSE file at root; SPDX headers say GPL-3.0-or-later, which is a header claim rather than a licence file. [FULL - gh api]
- Optimism L2 gas price 1,002,935 wei/gas and ETH at $2,687.93, both measured 2026-09-26. Per-mint gas is INFERRED from the storage writes in the read source, not from a live transaction. L1 data-posting fee [FAILED - GasPriceOracle call errored], so the dollar figures are L2 execution only and the real cost is higher.

Gaming and social failure
- arXiv 1607.00537, Badge System Analysis and Design - badges as a cost-reward game optimised toward the threshold. [FULL]
- arXiv 2512.08551, Gamification with Purpose - "erosion of intrinsic motivation" from badges disconnected from feedback. [FULL]
- [gov.gitcoin.co topic 11524, The limits of Sybil defense](https://gov.gitcoin.co/t/the-limits-of-sybil-defense/11524) - "Reliably linking actions to identities is therefore a subtle science." [FULL - Discourse JSON]
- [gov.optimism.io topic 5242](https://gov.optimism.io/t/why-did-the-sybillers-get-2nd-airdrop/5242) - wallets flagged as sybils in airdrop 1 rewarded again in airdrop 2. [FULL - Discourse JSON]
- arXiv 2603.11222, Monitoring Limits in DAO Governance - control drifts to a smaller set of highly active participants as workload rises. [FULL]
- Hacker News item 32128891, sybil attacks on airdrops - a fund ran a farming operation and returned funds only after public pressure. [FULL - HN Algolia API]
- reddit - [FAILED - no OAuth credentials at ~/.zao/private/reddit.env and the public endpoint returned an anti-bot page; HN used instead]
- POAP farming and secondary-market statistics - [FAILED - no academic literature exists on arXiv and no primary figures were reachable by curl]
