---
topic: governance
type: comparison
status: draft
last-validated: 2026-09-26
superseded-by:
related-docs: "governance/056-ordao-respect-system, governance/059-hats-tree-integration, governance/075-hats-protocol-v2-updates, community/1441-zao-lapsed-member-reengagement-jul2026, business/863-unlock-protocol-event-ticketing, business/1039-research, governance/1207-zao-improvement-proposals-framework"
original-query: "DEEP: How other DAOs and member orgs run periodic (monthly) re-activation of voting rights - precedent for The ZAO Season 3's active pool. Cover: orgs that require a recurring signal to stay in the voting pool (re-signature, check-in, attendance, dues, staking renewal, expiring keys/memberships); how they avoid burning membership or points when someone lapses; auto-activation by participation; how re-signing updated terms is handled; observed effects on turnout, capture and quorum. Include Optimism/Hats/Unlock/Moloch/Nouns/1Hive/Gitcoin/Eden and non-crypto precedents (unions, co-ops, professional bodies, clubs). Output feeds ZIP-2 (merged Draft at zips/zip-0002-season-3.md) Rationale and the manifesto framing. Flag anything that contradicts decisions in ~/zao-vault/projects/zao-membership-brainstorm-2026-09-11.md."
tier: DEEP
---

# 2558 - Periodic Re-activation of Voting Rights: Precedent for Season 3's Active Pool

> **Goal:** Give ZIP-2's Rationale outside precedent for "you must re-activate monthly to vote, and nothing ever burns," from DAOs, membership tooling and a century of non-crypto member organisations - plus the evidence on what it does to turnout, quorum and capture.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Is "vote lapses, membership and points survive" a sound design? | KEEP IT. It is the majority pattern outside crypto and the rarer, better-behaved one inside it. | CentralStar Cooperative's bylaws gate voting on an annual activity level while stating that losing voting-member status "will not affect rights and obligations of the member in any allocated patronage accounts"; the UAW constitution gives retired members "all of the privileges of membership except the right to vote". Optimism is the crypto org running the closest mechanism and it is HARSHER than Season 3 - a citizen who votes zero times in a round loses the badge itself. |
| 2 | Hard monthly deadline, or trailing window? | CHANGE ZIP-2 TO A TRAILING WINDOW: active = signed or attended within the last N days, evaluated at vote time. | Optimism's Token House counts quorum only against "active votable OP supply" - power used within the past 6 months - which has no cliff to miss. ZIP-2's calendar month creates a monthly cliff and a deadline cluster no precedent found here imposes. OREC reads weight live per voter at cast time (season3-protocol-survey), so a trailing window is strictly easier to implement than a month boundary: one timestamp comparison, no month arithmetic, no cron. |
| 3 | What N? | 90 DAYS, matching doc 1441's existing definition of an active ZAO member. | The ZAO already defines "active" as at least one qualifying action in the past 90 days (community/1441-zao-lapsed-member-reengagement-jul2026). Shipping a second, stricter 30-day definition creates exactly the multiple-meanings-of-member problem ZIP-2 exists to end. NEEDS ZAAL: this contradicts brainstorm #18/#32's "monthly". |
| 4 | Quorum against what denominator? | Define quorum as a percentage of the CURRENT active pool, never as a fixed number of members or a share of all members. | Compound hardcodes `quorumVotes = 400000e18; // 400,000 = 4% of Comp` as a constant - a fixed figure that cannot track a changing electorate. Optimism's percentage-of-active-supply model is the design that survives a shrinking pool. With 6-30 actives in a 156-member org, a fixed quorum either freezes governance or is trivially met. |
| 5 | How to answer the "small pool is more capturable" objection? | ANSWER IT IN THE ZIP, do not omit it. Pair activation with a published active-pool size and a quorum floor. | arXiv:2604.25959 finds registration and verification requirements "sharply reduce the fraction of token holders that can participate in governance votes, concentrating the voting power in few holders". This is the strongest argument against Season 3's core mechanism and ZIP-2's Rationale currently does not mention it. |
| 6 | Is auto-activation by attendance supported by precedent? | YES, and it is the part of Season 3 with the least precedent risk. | Robert's Rules Sec. 64 computes quorum from those who attend where the member roll "is not reliable as a list of the bona fide members"; Optimism's citizen removal is triggered by not voting, the participation signal itself. Attendance-as-activation is the oldest form of this rule, not a novelty. |

## Findings

### 1. The pattern exists, and outside crypto it is ordinary

Every non-crypto membership body examined separates three things The ZAO's code currently conflates: belonging, standing, and the right to vote this cycle.

| Org type | Recurring signal | Period | Lapse costs membership? | Lapse costs the vote? | Reinstatement |
|---|---|---|---|---|---|
| Agricultural co-op (CentralStar) | Minimum patronage ("member activity level") | Annual, board-set | No | Yes, voting-member status suspended | Automatic on meeting the terms again |
| UAW | Dues | Monthly | No, "automatically delinquent" is short of expulsion | Yes, until reinstated | Initiation fee plus back dues |
| IBEW | Dues | Monthly, counted in months of arrears | Not at 3 months (suspension); yes at 6 months (dropped) | Yes, immediately on suspension | Arrears plus a fee, inside the 3-6 month window |
| Teamsters | Continuous good standing | 24 consecutive months, for candidacy only | No | No, only candidacy is gated | Timely withdrawal card preserves continuity |
| Federal credit unions (NCUA model bylaws) | None by default | N/A | No | NO - "members not in good standing retain their right to attend, participate, and vote" | N/A |
| State bar (Nevada) | CLE hours | Annual | Licence suspended | Yes | 15 hours including 6 ethics and 1 substance abuse, within the 12 months before applying |
| Political caucus (Colorado) | Party affiliation on file | 22 days before the caucus | N/A | Yes for that cycle only | Re-affiliate 22+ days before the next one, no penalty |

Two of these deserve to be quoted in ZIP-2 directly, because they are the design Season 3 chose, written by organisations that have run it for decades:

> "Termination of voting member status under this provision will not affect rights and obligations of the member in any allocated patronage accounts or other classes of equity securities issued by the Cooperative." - CentralStar Cooperative, Inc. Bylaws (Mar. 1, 2021), Art. II Sec. 6

> "...shall entitle them to all of the privileges of membership except the right to vote in elections..." - UAW Constitution (through 2023), Art. 16 Sec. 19, on retired membership status

The credit-union row is the useful dissent: the NCUA model bylaws deliberately do the OPPOSITE, preserving the vote for members not in good standing. Gating the vote on a recurring signal is a choice, not a default, and ZIP-2 should say so rather than treat it as obvious.

### 2. Inside crypto, almost nobody does per-member periodic re-activation

| Org | Recurring action | Period | What lapses | What survives | Trigger |
|---|---|---|---|---|---|
| Optimism Citizens' House | Vote in the Retro Funding round | Per round, roughly 4-6 months | The citizen badge itself is removed for zero votes | Eligibility to be re-selected later | Foundation, after the round closes |
| Optimism Token House | Vote on proposals | Per Season, ~4 months | Reward eligibility and standing; NOT the delegation | Delegated power persists with no staleness clock | Foundation snapshot at season end |
| Colony | None - decay is automatic, not an action | Every 600,000 blocks | Reputation halves, ~3.5-month half-life | Token balance untouched | Automatic onchain, permissionless mining |
| 1Hive / Gardens conviction voting | Keep support allocated | Continuous, ~7-day half-life in the docs' worked example | Accrued conviction on a proposal | Token balance and reputation | Automatic per-block decay |
| Coordinape | Allocate GIVE within the epoch | Admin-set, 1 to 100 days | Unallocated GIVE does not carry over | Historical GET received | Admin opens and closes the epoch |
| Moloch v2 | None recurring | N/A | On a passed guild kick, shares convert to loot; voting and sponsoring lost | Economic claim on the bank, as loot | Member proposal, then permissionless `ragekick` |
| Nouns | None | N/A | Nothing | Everything | N/A - delegation has no time dimension in the contracts |
| Gitcoin | None found for GTC delegation | N/A | N/A | N/A | Citizen Rounds are retro funding, not voting renewal |

Three things follow for Season 3.

**The closest living precedent is harsher than what Season 3 proposes.** Optimism removes the badge - the membership artifact - from a citizen who casts zero votes in a round. Season 3 removes only the month's vote weight and keeps the hat, the Respect and the history. The ZIP can say plainly that it is adopting the milder end of an already-practiced spectrum.

**Decay systems decay the WEIGHT, never the record.** Colony halves reputation while leaving the token balance untouched; Gardens decays conviction on a proposal while leaving reputation intact; Coordinape resets GIVE each epoch while GET history persists. This is the same separation as Season 3's "the pool changes, nothing burns" and it is the dominant design where periodicity exists at all.

**Fractally's own design loses membership at 12 weeks of non-attendance, which is the closest thing to a precedent for the 90-day window.** From the same addendum, verbatim: "Note that after 12 weeks of non-attendance someone would cease to be a member and their income would fall to 0." Twelve weeks is 84 days. The rolling 90-day window ruled for Season 3 on 2026-09-26 sits just outside that, and it is milder in what it costs: fractally drops membership, Season 3 drops only the vote. The protocol The ZAO's fractal descends from already treats roughly a quarter-year of absence as the point where participation stops counting, which is independent support for the window Zaal chose over the calendar month in ZIP-2.

**Nobody found does what Season 3 needs per-member.** The absence is real, not a search failure: the Nouns contracts were read directly and have no time or activity dimension in delegation. This corroborates the ZIP-2 and season3-hats-protocol-research finding that the activation wrapper is a genuine build gap rather than a wheel already invented.

### 2b. The tooling, and the one mechanic that decides the build

| Tool | What expires | What survives | Who triggers | Licence | Fits per-member monthly activation? |
|---|---|---|---|---|---|
| Unlock PublicLock | The key's validity window (`keyExpirationTimestampFor`) | The ERC-721 itself, never burned | Anyone: `renewMembershipFor` (ERC20 locks) or `extend`; manager `grantKeyExtension` free | MIT | Partial. Lapse is non-destructive, but no points ledger and renewal is pull-based |
| Hats SeasonToggle | The hat's active bit, for a whole branch | The ERC-1155 balance slot, untouched | Branch admin calls `extend()` | MIT | Partial. Right behaviour, wrong granularity - branch-wide, not per-member |
| Hats AgreementEligibility | The wearer's eligible flag after a new agreement's grace period | Standing, and the right to re-claim by signing | Anyone calls `checkHatWearerStatus` | MIT | NO. Lapse BURNS the hat - see below |
| EAS attestation | `expirationTime` on the attestation | Everything else; attestations are just signed data | Anyone with schema authority calls `attest()` | MIT (LICENSE file read) | Yes as a signal, not as a mechanism |
| ERC-5643 subscription NFT | `expiresAt(tokenId)` | The NFT, never burned by the standard | `renewSubscription(tokenId, duration)` | CC0 | Structurally the closest shape, but no deployed reference to integrate |
| Snapshot `erc1155-balance-of` | Nothing, it is a read | N/A | N/A | MIT | Yes when pointed at Hats.sol with tokenId = hatId, since `balanceOf` already returns 0 for inactive |
| A published `IRespect`-style expiring-power wrapper | - | - | - | - | DOES NOT EXIST. See below |

**The mechanic that decides the build.** Hats has two ways to make a hat stop counting, and they are not equivalent:

- **Eligibility path (per-member).** In `Hats.sol`, `_processHatWearerStatus` calls `_burnHat(_wearer, _hatId)` when a wearer is ineligible. That is a real ERC-1155 burn.
- **Toggle path (branch-wide).** `_processHatStatus` flips the hat's active bit. `balanceOf()` computes `_isActive(hat) && _isEligible(wearer, hat)` on every read and returns 0 while inactive, but `_balanceOf[wearer][hatId]` is never written, so the balance reappears the moment the toggle flips back.

`IHatsToggle.getHatStatus(uint256 _hatId)` takes no wearer argument, so a stock toggle module **structurally cannot be per-member**, and the only per-member path, eligibility, always burns. This is the concrete reason Season 3 cannot implement monthly activation as a Hats module without violating brainstorm #1's "nothing burns" - and therefore the concrete justification for ZIP-2's choice of an `IRespect` wrapper that OREC reads instead. ZIP-2 currently argues this from module coverage ("SeasonToggle is branch-wide"); the stronger argument is this burn-versus-toggle asymmetry, and it should be added.

**Nothing published does the wrapper's job.** GitHub code searches for `IRespect`, `expiring voting power` and `ERC20VotesWrapper` returned nothing on topic. The search path was sanity-checked first against a known-good query (`IHatsEligibility`, 83 hits), so the zero is a measured absence rather than a broken query - though it is bounded by the strings tried, and a differently named project could exist.

Also corrected by measurement: the permissionless toggle-check function is **`checkHatStatus`**, not `checkHatsToggleStatus` as named in our earlier Season 3 notes. And Unlock has **no documented ERC-4337 paymaster or gas sponsorship**; its gasless experience is the fiat checkout flow. Any design assuming an Unlock paymaster on Optimism is assuming something that is not there. [to confirm: current Optimism gas cost per attestation or renewal transaction - no live gas source answered during this research.]

### 3. The strongest argument against Season 3, stated properly

ZIP-2's Rationale argues from Zaal's decisions and our own measurements. It does not engage the published counter-evidence, which is this:

> "We find that both anonymous and verified registration sharply reduce the fraction of token holders that can participate in governance votes, concentrating the voting power in few holders." - arXiv:2604.25959, "On the Centralization of Governance Power in DAOs"

> "The combination of extreme Gini values and low Nakamoto coefficients across layers confirms systemic vulnerability to capture, where a small number of delegates... can dictate governance outcomes." - arXiv:2510.05830v2, "Fairness in Token Delegation"

Applied here: The ZAO has 156 unique Respect holders, OG Respect distribution Gini 0.73 with the top 10 holding 53% of supply, and 6-30 people at a typical session. An activation gate shrinks the electorate from 122 OG holders to whoever signed, on top of a distribution that is already concentrated. The published finding is that this direction of change concentrates power further.

The honest counter-argument, and the one ZIP-2 should make, is that the alternative is not a broad electorate but a nominal one. Industry-wide DAO turnout runs roughly 5-20% of holders; Compound and Uniswap see under 10% of supply vote per proposal, and roughly 7.5% of circulating tokens would have won an average past vote. A roster of 122 who mostly do not vote does not dilute a determined minority; it only hides it. Activation makes the real electorate visible and countable, which is the precondition for a quorum rule that means anything.

There is also a named defender of exactly this direction:

> "What if DAO governance of blockchain protocols could somehow make governance power conditional on participation?" - Vitalik Buterin, soulbound tokens post, 2022-01-26

And the case for having no quorum at all, from a live governance forum rather than a paper:

> "I think quorums are evil... Not having quorums means that only active people have a voice in the governance process and that the active minority can make decisions without being blocked by the inactive majority." - clesaege, GnosisDAO forum topic 901, 2020-12-03

### 4. Turnout, quorum and the numbers

| Claim | Figure | Source | Date |
|---|---|---|---|
| Compound/Uniswap turnout per proposal | Under 10% of total supply; ~15% of circulating | arXiv:2204.01176 | 2022 |
| Share of circulating tokens that would have won an average past vote | ~7.5% | arXiv:2204.01176 | 2022 |
| US public-company shareholder meeting participation, for contrast | ~70% | arXiv:2204.01176, citing prior literature | 2022 |
| Industry-wide DAO turnout | ~20% average, often 1 in 10 | ForkLog | 2026-04-10 |
| Voting-power concentration | Gini 0.94-0.99 across Aave, Compound, ENS, Uniswap; Nouns 0.75 | arXiv:2510.05830v2 | 2026 |
| Compound quorum | `quorumVotes = 400000e18; // 400,000 = 4% of Comp`, a hardcoded constant | GovernorBravoDelegate.sol, read via gh api | verified 2026-09-25 |
| Optimism quorum denominator | 30%, measured against active votable OP supply (power used in the past 6 months) | OPerating-manual/manual.md | fetched 2026-09-25 |
| Optimism delegate participation | Community analysis: of the top 100 delegates, 40% at 0% participation, 27% at 100% | gov.optimism.io topic 9287 | community post, not Foundation data |
| Optimism Citizens' House round participation | 133 of 145 badgeholders voted in RetroPGF 3; 132 citizens after removals | gov.optimism.io topic 7506 | - |
| Colony reputation half-life | ~3.5 months (600,000 blocks) | docs.colony.io | fetched 2026-09-25 |
| The ZAO, for comparison | 156 holders, Gini 0.73, 6-30 per session, ~101 unbroken fractal weeks | zao-papers CLAUDE.md verified reference data | 2026-07-05 audit |

### 5. What contradicts the brainstorm log or ZIP-2

1. **Monthly vs 90 days.** Brainstorm #18/#32 and ZIP-2 section 3 set a monthly activation. Doc 1441 already defines an active ZAO member as one qualifying action in the past 90 days. Two live definitions of "active" is the exact failure ZIP-2 was written to end. NEEDS ZAAL.
2. **Hard month boundary vs trailing window.** No precedent found imposes a calendar cliff. Optimism, Colony and Gardens all use trailing windows or continuous decay. A trailing window also removes the deadline-cluster risk and is simpler against OREC's live per-voter read.
3. **Doc 1039 recommends Unlock on Base.** Season 3 is entirely on Optimism (tree 226, OG Respect, OREC). Any Unlock-derived pattern must be re-scoped to Optimism before it is cited as a ZAO recommendation.
4. **Colony "monthly decay" was wrong in my own brief.** Primary source says a ~3.5-month half-life. Recorded here so the error does not propagate into the ZIP.
5. **Not a contradiction, a closure:** brainstorm #20 ("what counts as attending") was still listed as open on the lane board. ZIP-2 section 3 records that Zaal ruled on it on 2026-09-15: a fractal, hosting a call, making an intro, a festival, an article or a workshop count; signature alone does not.

### 6. Where the evidence runs out

- **No study found on signature-gated periodic activation specifically.** Griefing, forgetting to activate and deadline clustering are unmeasured for this mechanism. They are named risks, not quantified ones.
- **No controlled study** on whether a recurring re-activation requirement raises or lowers turnout against a default-active design. Neither direction is established.
- **RESOLVED 2026-09-26, from the primary source.** The fractal lane pointed at Larimer's "Fractally White Paper Addendum 1" (hive.blog, 2022-07-15); this session fetched the raw post body through the Hive API (`condenser_api.get_content`, 13,728 chars) rather than the JS page. Verbatim: "The average is calculated as NEW_AVERAGE = (CURRENT_AVERAGE * 5 + NEW_LEVEL)/6. This moving weighted average is an approximation that is easy to calculate". So what decays is the **moving average of your weekly Level**, the input used to compute each week's fresh distribution - not the Respect balance itself. The distinction is exactly the one Season 3 draws: the weight moves, the record does not.
  Two corrections to the summary this arrived in, both made against the fetched text: the identifiers are `NEW_AVERAGE`/`CURRENT_AVERAGE`, and the half-life is **~3.8 weeks**, not 34. A 5/6 weekly retention gives ln(0.5)/ln(5/6) = 3.80 weeks; the post itself states only that "a pure moving window average would go from 0 to max in just 6 weeks", and names no half-life. The claim that neither ZAO ledger has ever run a decay (zero OG burns; ZOR's only burns a 2025-10-24 correction of periods 67-70) is the fractal lane's own measurement, cited here as theirs, not re-verified by this session.
- **Compound's "10% quorum then lowered to 4%" history is NOT verified.** Only the current 4% constant is, from the contract source. The history is excluded from this doc rather than repeated.
- **Union and co-op turnout figures could not be raw-fetched** (DOL page Akamai-blocked, Co-operatives UK PDF behind Cloudflare). No turnout percentage from those sectors is asserted here.


## Also See

- [governance/056 - ORDAO & Respect System](../056-ordao-respect-system/) - OREC mechanics this design installs into
- [governance/059 - ZAO Hats Tree](../059-hats-tree-integration/) - tree 226 onchain state
- [governance/075 - Hats Protocol V2 Updates](../075-hats-protocol-v2-updates/) - existing ZAO OS Hats integration, `src/lib/hats/client.ts`, `constants.ts`, `gating.ts`, `tree.ts`
- [governance/1207 - ZIPs Framework and Registry](../1207-zao-improvement-proposals-framework/)
- [community/1441 - Lapsed vs Active Member Re-engagement](../../community/1441-zao-lapsed-member-reengagement-jul2026/) - the existing 90-day "active" definition this doc says to reuse
- [business/863 - Unlock Protocol for ZAO Event Ticketing](../../business/863-unlock-protocol-event-ticketing/)
- [business/1039 - Unlock Protocol evaluation](../../business/1039-research/) - recommends Base; Season 3 is Optimism, re-scope before citing
- ZIP-2 (Season 3), merged Draft: `bettercallzaal/zao-papers`, `zips/zip-0002-season-3.md`
- Decision log: `~/zao-vault/projects/zao-membership-brainstorm-2026-09-11.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide monthly vs 90-day trailing window for activation (Key Decision 3 contradicts brainstorm #18/#32) | @Zaal | Decision | 2026-10-06 |
| PR to zao-papers adding a Precedent subsection to ZIP-2's Rationale, quoting CentralStar Art. II Sec. 6, UAW Art. 16 Sec. 19, Robert's Rules Sec. 64, and Optimism's active-votable-supply quorum | @Zaal (lane drafts, zj reviews) | PR | 2026-10-10 |
| PR to zao-papers adding the capture counter-argument (arXiv:2604.25959) and its answer to ZIP-2's Security and Governance Considerations | @Zaal (lane drafts, zj reviews) | PR | 2026-10-10 |
| Replace ZIP-2's module-coverage argument with the Hats burn-versus-toggle asymmetry as the reason for the IRespect wrapper | @Zaal (lane drafts, zj reviews) | PR | 2026-10-10 |
| Define quorum as a percentage of the current active pool in the wrapper spec, never a fixed member count | @Zaal | Decision | 2026-10-13 |
| Name an external Solidity reviewer for the activation wrapper (ZIP-2 Open Item 2; season moves without one) | @Zaal | Decision | 2026-10-03 |
| Re-verify Respect-decay behaviour in the Eden Fractal / Respect Game model from a primary source | @Zaal | Research | wontfix unless the wrapper design depends on it |

## Sources

Non-crypto membership rules
- [IBEW Constitution, 2022](https://ibew702.org/wp-content/uploads/2023/04/2022-IBEW-Constitution.pdf) - arrears, suspension, reinstatement. [FULL - curl + pdftotext]
- [IBT Teamsters Constitution, 2021](https://teamster.org/wp-content/uploads/2022/03/2021IBTCONSTITUTIONBooklet.pdf) - 24-month continuous good standing for candidacy. [FULL - curl + pdftotext]
- [UAW Constitution, through 2023](https://uaw.org/wp-content/uploads/2023/11/Updated-2022-Constitution-8.30.23.pdf) - Art. 16 delinquency and the retired-member voting carve-out. [FULL - curl + pdftotext]
- [NCUA Federal Credit Union Bylaws, 2020](https://ncua.gov/files/bylaws/federal-credit-union-bylaws-2020.pdf) - the counter-example: voting preserved for members not in good standing. [FULL - curl + pdftotext]
- [CentralStar Cooperative Bylaws, 2021](https://mycentralstar.com/wp-content/uploads/2024/01/Bylaws-CentralStar.pdf) - activity level gates voting, patronage equity survives. [FULL - curl + pdftotext]
- [ACCA CPD quick guide](https://www.accaglobal.com/content/dam/ACCA_Global/Members/Doc/cpd/cpd-quick-guide.pdf) - 40 units, 21 carry-forward, waivers. [FULL - curl + pdftotext]
- [State Bar of Nevada, CLE reinstatement](https://nvbar.org/clereinstatement/) - 15 hours including 6 ethics, 1 substance abuse. [FULL - curl + strip]
- [Colorado SoS, caucus FAQs](https://www.sos.state.co.us/pubs/elections/Candidates/FAQs/caucuses.html) - 22-day affiliation deadline. [FULL - curl + strip]
- [Robert's Rules of Order Revised, Sec. 64](https://robertsrules.org/rror-11.htm) - quorum from those who attend. [FULL - curl + strip]
- DOL/OLMS Statement of Reasons, LIUNA Local 1197 - union election turnout. [FAILED - Akamai "Access Denied"; no turnout figure asserted from it]
- [Co-operatives UK AGM guide](https://www.uk.coop/sites/default/files/2021-10/AGM_guide.pdf) - co-op AGM turnout. [FAILED - Cloudflare challenge; no figure asserted]

DAO mechanics
- [Moloch v2 README](https://raw.githubusercontent.com/MolochVentures/moloch/master/README.md) - guild kick, jailing, loot, `ragekick`. [FULL - curl raw]
- [gov.optimism.io topic 7506](https://gov.optimism.io/t/7506) - citizen badge removed for zero votes; 133 of 145 voted in RetroPGF 3. [FULL - Discourse JSON API]
- [gov.optimism.io topic 9297](https://gov.optimism.io/t/9297) - Season 6 delegate reward criteria, >70% participation. [FULL - Discourse JSON API]
- [gov.optimism.io topic 9287](https://gov.optimism.io/t/9287) - delegate participation analysis. [FULL - Discourse JSON API; community member's analysis, NOT Foundation data]
- [gov.optimism.io topic 5240](https://gov.optimism.io/t/5240) - top 20% of delegates hold 82% of delegated power. [FULL - Discourse JSON API]
- [OPerating manual](https://raw.githubusercontent.com/ethereum-optimism/OPerating-manual/main/manual.md) - 30% quorum against active votable OP supply, 6-month window. [FULL - curl raw]
- [docs.colony.io reputation](https://docs.colony.io/learn/governance/reputation) - decay factor 2 per 600,000 blocks, ~3.5-month half-life. [FULL - curl + strip]
- [docs.gardens.fund conviction parameters](https://docs.gardens.fund/conviction-voting/conviction-parameters) - conviction half-life worked example. [FULL - curl + strip]
- [docs.coordinape.com epochs](https://docs.coordinape.com/get-started/epochs) - 1 to 100 day epochs, GIVE resets, GET persists. [FULL - curl + strip]
- [nounsDAO/nouns-monorepo NounsDAOVotes.sol](https://github.com/nounsDAO/nouns-monorepo) - `getPriorVotes(voter, proposal.startBlock)`, no staleness dimension. [FULL - gh api]
- [gov.gitcoin.co topics 13462, 16302, 11639](https://gov.gitcoin.co/t/16302) - Citizen Rounds are retro funding, not voting renewal. [FULL - Discourse JSON API]
- [Fractally White Paper Addendum 1, Larimer, 2022-07-15](https://hive.blog/fractally/@dan/fractally-white-paper-addendum-1) - `NEW_AVERAGE = (CURRENT_AVERAGE * 5 + NEW_LEVEL)/6`; "after 12 weeks of non-attendance someone would cease to be a member". [FULL - Hive API `condenser_api.get_content`, raw post body, 13,728 chars; the hive.blog page itself is a JS shell returning 513 chars and was NOT the source]
- respectgame.com and fractally.com/whitepaper. [FAILED - JS shell and 404; superseded by the Hive API fetch above]

Tooling
- [unlock-protocol/unlock IPublicLockV15.sol](https://github.com/unlock-protocol/unlock) - `grantKeys`, `renewMembershipFor`, `extend`, `grantKeyExtension`, non-expiring keys via `type(uint).max`. [FULL - gh api + base64]
- [Unlock renewals docs](https://docs.unlock-protocol.com/core-protocol/public-lock/renewals) - "Once expired, a key is not considered valid anymore"; no key is burned. [FULL - curl + strip]
- [Hats-Protocol/hats-protocol Hats.sol](https://github.com/Hats-Protocol/hats-protocol) - `_processHatWearerStatus` burns on ineligibility; `_processHatStatus` does not; `checkHatStatus` is the real function name; LICENSE read: AGPL-3.0. [FULL - gh api + base64]
- [Hats-Protocol/season-toggle](https://github.com/Hats-Protocol/season-toggle) - `createSeasonToggle(branchRoot, seasonDuration, extensionDelay)`, 3600s minimum, MIT per LICENSE. [FULL - gh api + base64]
- [Hats-Protocol/agreement-eligibility](https://github.com/Hats-Protocol/agreement-eligibility) - `signAgreement`, grace period, eligible=false and standing=true on lapse, MIT per LICENSE. [FULL - gh api + base64]
- [eas-contracts IEAS.sol and deployments/optimism](https://github.com/ethereum-attestation-service/eas-contracts) - `expirationTime`, `revoke`, Optimism predeploy `0x4200000000000000000000000000000000000021`, MIT per LICENSE file. [FULL - gh api + base64]
- [ethereum/ercs ERC-5643 and ERC-5484](https://github.com/ethereum/ercs) - subscription and soulbound interfaces. [FULL - gh api + base64]
- [snapshot-labs/snapshot-strategies](https://github.com/snapshot-labs/snapshot-strategies) - `erc1155-balance-of`, `api`, `whitelist`; MIT per root LICENSE. [FULL - gh api + base64]
- GitHub code search for `IRespect`, `expiring voting power`, `ERC20VotesWrapper` - no on-topic result; sanity-checked against `IHatsEligibility` (83 hits) before trusting the zero. [FULL - gh api search/code]

Evidence on turnout, capture and quorum
- [arXiv:2204.01176](https://arxiv.org/abs/2204.01176) - Compound/Uniswap turnout, 7.5% capture threshold, 70% shareholder baseline. [FULL - curl + strip]
- [arXiv:2302.12125](https://arxiv.org/abs/2302.12125) - ENS delegate representation, vote-size distribution. [FULL - curl + strip]
- [arXiv:2510.05830v2](https://arxiv.org/html/2510.05830v2) - Gini and Nakamoto coefficients across major DAOs. [FULL - curl + strip]
- [arXiv:2604.25959](https://arxiv.org/html/2604.25959) - registration requirements concentrate voting power; the central counter-argument. [FULL - curl + strip]
- [Vitalik Buterin, soulbound tokens](https://vitalik.eth.limo/general/2022/01/26/soulbound.html) - "governance power conditional on participation". [FULL - curl + strip]
- [Vitalik Buterin, moving beyond coin voting](https://vitalik.eth.limo/general/2021/08/16/voting3.html) - coin-voting critique. [FULL - curl + strip]
- [GnosisDAO forum topic 901](https://forum.gnosis.io/t/901) - "quorums are evil" argument for active-only voice. [FULL - Discourse JSON API] (community source)
- [Hacker News item 29273425](https://news.ycombinator.com/item?id=29273425) - ConstitutionDAO, informal concentration under pressure. [FULL - HN Algolia API] (community source)
- [ForkLog, DAOs in 2026](https://forklog.com/en/good-or-nothing-how-daos-are-faring-in-2026/) - 2026 turnout and concentration figures. [FULL - curl + strip]
- [Compound GovernorBravoDelegate.sol](https://github.com/compound-finance/compound-protocol) - `quorumVotes = 400000e18; // 400,000 = 4% of Comp`. [FULL - gh api + base64, verified by this session]
- Compound "10% quorum then lowered" history - [FAILED to verify against a primary source; excluded from this doc rather than repeated]
- ACM DL, Concentration of Power and Participation in Online Governance - [FAILED - HTTP 403; no claim rests on it]
