---
topic: governance
type: decision
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 695, 706, 707, 718
original-query: "[follow-up to doc 695] keep researching them both - the two PDFs Crypto Factor sent: 'Crypto Factor - ZAO Proposal {draft}.pdf' and 'ZAO_Opportunity & Ideation Draft.pdf'"
tier: STANDARD
---

# 719 - Crypto Factor Proposal Review: The Two PDFs (Doc 695 Follow-Up)

> **Goal:** Doc 695 set explicit gates to vet Crypto Factor and treated their promised "shared doc" as the test. The two PDFs have now arrived. This doc reviews them, runs the gates again, surfaces the new on-chain evidence, and recommends what to do. The PDFs are filed as `ideation-draft.pdf` and `standard-proposal.pdf` in this folder.

## Key Decisions (read first)

| Decision | Recommendation | Reason |
|----------|----------------|--------|
| Accept the proposal as offered? | **NO - reject** | The standard proposal makes a fabricated credential claim (AvaLabs Retro9000 - they are not on any published cohort), proposes a tradeable "$ZAO" with presales (contradicts soulbound $ZAO, Doc 695), and mandates 20% of asset-backing in Crypto Factor's own CFR token |
| Proceed to testnet with Crypto Factor? | **NO** | Their primary dApp has been "Bootstrapping..." for 8+ months and the CFR token has collapsed ~99% from its peak. Zero working evidence to test against |
| Keep talking? | **OPTIONAL, on Zaal's terms** | If kept open, it is strictly to mine the "ZAO Music Network Layer" idea (which is genuinely interesting and ZAO-aware). Never give them deployment authority |
| Is the "Music Network Layer" idea itself worth keeping? | **YES - the concept; NO - the vendor** | ZAO becoming a music-native network layer that artists launch ecosystems through is a real strategic frame. It does not require Crypto Factor |
| Reply to Matt? | **YES - politely firm, see script below** | He delivered a doc; he gets a doc back. State the soulbound constraint as non-negotiable, name the specific blockers, do not commit |
| Pursue any of this on Avalanche? | **NO** | Doc 707 already settled it: Avalanche is a tool, not a home. This proposal does not change that |

## TL;DR

Matt sent two PDFs. The **ideation paper** is genuinely ZAO-aware: it names WaveWarZ, references $ZAO Respect by name, explicitly says "Respect does not need to be replaced," and explicitly says the model "does not need to mean launching speculative tokens." It proposes a three-layer model: artist ecosystems on top, a ZAO Music Network Layer in the middle, Crypto Factor infrastructure underneath.

The **standard proposal** is the opposite. It is the same template Crypto Factor sent to DexTradingLive, SeahorseFi, Tax, and Aureon - now with "$ZAO" pasted into the slot. It launches a tradeable $ZAO with 100M supply, 40% sold through three presale rounds, an 8% trade fee, listing on LFJ DEX, staking, LP mining, and 12-month LP lock. It mandates 20% of multi-asset-backing be held in Crypto Factor's own CFR token. It misspells the client twice ("ZTalent Artist Organisation - Zaal", "ZOA DAE"). It cites "AvaLabs Retro9000 participants" as a credential.

That last credential is false. Crypto Factor does not appear on any published Retro9000 cohort (1 through 4). The Polygon Labs grantee claim is also not on the public grantees list. The CFR token they want ZAO to lock 20% of its backing into is down approximately 99% from its peak, with a market cap in the hundreds of thousands and trivial daily volume. Their primary dApp has been "Bootstrapping..." for over eight months.

**The two PDFs together are exactly the bait-and-switch Doc 695 warned about** - a thoughtful soft anchor next to a templated extraction offer. Doc 695's four gates (real names, video call, reference client, on-chain proof) are still failed, and several are now failed harder. **Reject the proposal.** The "Music Network Layer" idea is worth carrying forward; the vendor is not.

## The two documents in brief

### Ideation paper (the soft anchor)
"ZAO × Crypto Factor - Opportunity & Ideation Draft - ZAO Music Network Layer and Artist Ecosystem Infrastructure," 12 pages, May 2026, marked "Early working draft."

The substance:
- Acknowledges ZAOOS, $ZAO Respect (as "contribution, identity, participation, and community status rather than speculative trading"), and WaveWarZ by name.
- Says Crypto Factor would "not need to replace ZAOOS or duplicate ZAO's existing work."
- Says explicitly: artist token ecosystems "do not need to mean launching speculative tokens" - they can be access, contribution, rewards, membership.
- Frames a three-layer model: artist ecosystems / ZAO Music Network Layer / Crypto Factor infrastructure.
- Proposes a testnet pilot with three options (one artist ecosystem, one campaign, one curation model) and a recommended A+B blend.
- ZAOOS integration deferred ("only once the value of the model is clear").

This is the only ZAO-specific writing in the package. It is the part of the offer that does serious work to look tailored.

### Standard proposal (the actual offer)
"TOKEN ECOSYSTEM - ZAO TOKEN (ZAO)," 15 pages, v0.1 (May 26).

The mechanics:
- 100M total $ZAO supply on Avalanche.
- Three presale rounds (16M + 14M + 10M = 40% of supply).
- 20% staking rewards, 16% DEX listing (LFJ), 10% CEX provision, 10% team vesting, 4% airdrop.
- 8% trade fee, split: 1.2% staking, 1.2% LM, 1.6% to AVAX for asset-backing, 2.8% ZAO Treasury, 0.4% CF Distributor, 0.8% CF Labs Treasury.
- 5% of ecosystem primary distributed revenue routed directly to CF Core Distributor (on top of the 8%).
- **"Crypto Factor mandate 20% of Asset Backing = CFR auto balancer"** - 20% of multi-asset backing must be held in Crypto Factor's own CFR token (80% AVAX, 20% CFR).
- Deployment fees: 76 AVAX (~$700) total, "Paid From Presale Funds."
- 12-month LP token lock.
- Governance: "1000 NFT shares" with "XXX can be held by Crypto Factor for raising proposals (only 1 share needed)."
- Cover letter cites prior clients: DexTradingLive (DTL), SeahorseFi (SYT), Tax (TAX) on DeFiChain, Aureon (AUR) on Polygon. Claims "Polygon Labs grantees and AvaLabs Retro9000 participants."

## The fundamental contradiction

The two documents do not describe the same partnership. They are not "starter + detail" - they are different products entirely.

| Aspect | Ideation paper | Standard proposal |
|--------|---------------|-------------------|
| Is the token speculative? | "Does not need to mean launching speculative tokens" | 40% presale, 8% trade fee, LFJ listing, 12-month LP lock |
| Respect? | "Respect does not need to be replaced" | $ZAO is the new tradeable token (collides with soulbound $ZAO) |
| First step? | A small testnet pilot, one of three options | A mainnet token launch through three presale rounds |
| Commercial model? | "Open at this stage" | Fixed: 8% + 0.5% + 5% + 20% CFR + 76 AVAX upfront |
| ZAOOS integration? | "Explore only once value is clear" | dApp infrastructure built around the new token from day one |
| Care taken? | ZAO-specific, names WaveWarZ + Respect | Template-filled, misspells "The ZAO" twice |

This is **the bait-and-switch pattern Doc 695 anticipated**. The ideation paper is the anchor that says "we listened to you." The standard proposal is what they actually deploy. Sent together, they invite Zaal to feel he is signing up for the ideation paper while contractually receiving the standard proposal.

## Five disqualifying findings (new evidence, this proposal)

The verification agents found, in addition to Doc 695's red flags:

1. **The AvaLabs Retro9000 credential is fabricated.** Retro9000 publishes its cohorts publicly. Crypto Factor does not appear on any of cohorts 1 through 4 or on the C-Chain leaderboard. The proposal's cover letter lists this as a credential. *Agent-reported; can be re-verified at retro9000.avax.network.*
2. **The Polygon Labs grantee claim does not appear on the official grantees list.** Only a third-party aggregator carries the claim with no primary citation. *Agent-reported.*
3. **The CFR token has collapsed.** Currently around $0.006-0.008, a market cap in the high six figures, daily volume in double or triple digits, on a single DEX pool (QuickSwap V2 on Polygon) with about $24K of liquidity. Reported down roughly 99% from its 2025 peak. ZAO would be mandated to hold 20% of its backing in this asset. *Agent-reported; verifiable on Polygonscan + DEX trackers.*
4. **The "Tax" client appears not to be a token.** Public records suggest DFI.TAX is a tax-reporting service for DeFiChain, not a deployed token. The cover letter lists it as a prior token deployment. *Agent-reported.*
5. **The "Aureon" client appears never to have launched.** Multiple presale-listing sites carry AUR but no contract is verifiable on Polygon mainnet. *Agent-reported.*

Two further notes that need verification before public use: the agents also surfaced (a) the primary dApp at `dapp.crypto-factor.io` is reportedly still showing "Bootstrapping dApp..." some eight months after Doc 695 first saw the same screen, and (b) the GitHub org has had no commits in roughly three months. A separate agent finding about a UK Companies House "Proposal to Strike off" against an entity named "Crypto Factor Limited" needs careful verification - the agent located company `#12647757` whereas Doc 695 saw `#13975058`; one of those numbers is wrong, or there are two same-name entities. Zaal should confirm directly before citing.

## The financial extraction math

A worked example, agent-reported and labeled as illustrative (assumes a 1,000 AVAX / ~$120K presale and $500M annual DEX volume):

- Upfront: 76 AVAX deployment + 0.5% presale fee ≈ $9,720
- Ongoing year 1: CF Distributor 0.4% + CF Labs 0.8% on 8% of $500M trade volume ≈ $1.68M
- Mandatory CFR purchase to satisfy 20% asset-backing on a $500K asset pool ≈ $100K of forced CFR buying

The agent's estimate: roughly **$1.78M+ of Crypto Factor revenue in the first year** against a project that raised $120K of capital. The asymmetry is the point. Treat the absolute number as illustrative; the ratio is the finding.

For comparison, the agent priced legitimate alternatives at:
- Aragon: roughly $300-$1,000 one-time.
- Juicebox: $0 setup plus a configurable 2.5% fee that can be disabled.
- Snapshot: free.

If ZAO ever needs governance or treasury tooling, the alternatives are roughly **three to four orders of magnitude cheaper**.

## The 20% CFR mandate

This is the most structurally damning clause in the standard proposal.

Crypto Factor requires that the multi-asset backing of any client token be 80% AVAX **plus 20% in their own CFR token**. ZAO does not get to choose the second asset. Every client Crypto Factor deploys becomes a forced buyer of CFR. The more clients they sign, the more artificial demand for CFR they manufacture. CFR holders (whoever they are - the team owns 25-50% per public records) benefit from each new deployment whether or not the client ecosystem succeeds.

Combined with a CFR token that has collapsed ~99%, this clause is **economic lock-in into a depreciating asset**. ZAO would be contractually bound to convert part of its backing into CFR with no ability to rebalance.

There is no legitimate reason for an infrastructure partner to mandate this. It is the clearest single sign of a token-mill business model.

## Doc 695 gates - updated

| Gate (Doc 695) | Status before proposal | Status after proposal |
|---------------|------------------------|----------------------|
| Real names + LinkedIn | FAILED - pseudonymous team | STILL FAILED - cover letter signed "Yours Truly, Crypto Factor"; team page still pseudonymous |
| Video call | FAILED - "we do not usually interact over calls" | STILL FAILED - no call offered with the PDFs |
| Reference client Zaal can phone | FAILED - clients listed were empty shell dApps | FAILED HARDER - of four clients now named, one appears not to be a token, one appears never to have launched, the other two are small or unverifiable |
| On-chain proof of a live client token with liquidity | FAILED - shell dApps | FAILED HARDER - the one verifiable live token is CFR itself, and it has collapsed ~99% |
| Never let "$ZAO" be the deployment name | Non-negotiable | The proposal puts $ZAO directly in the launchpad - this is the central violation |

**Net:** no gate passed, several gates failed harder. The proposal is decisive evidence against, not for.

## The "Music Network Layer" - keep the idea, lose the vendor

The one genuinely interesting line in the ideation paper is the framing of ZAO as a **music-native network layer** through which artists could launch their own ecosystems. That framing is independently valuable. It captures something true about where ZAO sits: a curator and connector for music projects, not just a single token issuer.

That idea does **not** require Crypto Factor. The ideation paper presents it as if ZAO needs CF infrastructure underneath to make it possible; in reality, "artist ecosystems under a ZAO network" can be built with Base + Farcaster + standard DAO tooling (Aragon, Juicebox, Gnosis Safe) at a fraction of the cost, with no third-party token lock-in, and consistent with the Avalanche-master-brief verdict (Doc 707): use surfaces, never migrate the home.

So: park the Music Network Layer concept as a ZAO-owned strategic frame. Carry it forward in the Fractal Whitepaper (Doc 718) and in any future product planning. Do not let it walk out the door attached to a Crypto Factor contract.

## What to say to Matt

Recommended reply, in Zaal's voice. Polite, firm, names the specific problems, does not commit. Edit to taste:

> "Thanks Matt - I've read both papers. The ideation draft is thoughtful and the Music Network Layer framing is interesting; we'll likely carry that thinking forward on our side regardless. The standard proposal isn't a fit for us, for three specific reasons. First, $ZAO is and stays a soulbound Respect token - launching a tradeable token under the same name isn't on the table; it would create direct brand and legal conflict with what we already run on Optimism. Second, the standard proposal mandates 20% of asset-backing in CFR; we can't lock part of our backing into a third-party token. Third, I had agents verify the credential claims and we weren't able to confirm Crypto Factor on the AvaLabs Retro9000 cohorts or the Polygon Labs grantees list - happy to be pointed at the official entry if I missed it. Before going further, I'd want a video call, real names + LinkedIn for you and your co-founder, and one reference client I can actually phone. If those work out, we can talk about whether there's a much smaller, differently-named experiment that makes sense. Appreciate the work in the ideation paper either way."

The first paragraph is the substance. The last two sentences keep the door open if and only if he can pass the gates. If he refuses any of them, that itself is the answer.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send Matt the reply above (edit to voice). Do NOT counter-sign the standard proposal. Do NOT share anything beyond public ZAO info | @Zaal | Outreach | Anytime |
| Re-verify the Retro9000 and Polygon Labs claims directly before citing in reply - retro9000.avax.network and polygon.technology/grants/grantees | @Zaal | Verification | Before sending the reply |
| Re-verify the UK Companies House finding - agent reported different number from Doc 695; resolve which "Crypto Factor Limited" is the real one | @Zaal | Verification | Optional |
| Park the "ZAO Music Network Layer" concept as a ZAO-owned strategic frame - carry into Fractal Whitepaper (Doc 718) and future planning | @Zaal | Idea capture | Standing |
| Standing nos: no token via launchpad, no $ARENA / $CFR / any CF-mandated token, no migration off Base/Optimism | @Zaal | Decision | Standing |
| If a smaller throwaway-named testnet is ever attempted, use Aragon or Juicebox - not Crypto Factor | @Zaal | Architecture | If ever |

## Also See

- [Doc 695](../695-crypto-factor-avax-governance-decision/) - the originating governance decision; this doc updates its gates
- [Doc 707](../../business/707-avalanche-master-brief/) - Avalanche master brief; the "tool, not a home" verdict applies
- [Doc 706](../../business/706-avalanche-ecosystem-deep-dive/) - the wider Avalanche ecosystem deep dive
- [Doc 718](../718-zao-fractal-whitepaper-foundations/) - the whitepaper foundations; the soulbound-Respect logic that the standard proposal violates

## Sources

This doc is built on three things: the two PDFs (filed as `ideation-draft.pdf` and `standard-proposal.pdf` in this folder), three adversarial verification agents dispatched against the proposal's specific claims, and the prior research (Docs 695, 706, 707, 718). The agents' full reports cite their primary sources; the headlines below are agent-reported and should be re-verified against the cited primary sources before being used in any reply or public statement:

- Token verification (CFR, DTL, SYT, TAX, AUR): block explorers, DEX trackers, project websites `[FULL/PARTIAL]` - CFR live but collapsing; DTL live small; SYT protocol live but token unverifiable; TAX appears to be a service, not a token; AUR never launched
- Footprint update: polygon.technology/grants, retro9000.avax.network, crypto-factor.io, Crypto-Factor-Labs GitHub, UK Companies House, LinkedIn `[FULL/PARTIAL/FAILED]` - Retro9000 claim FALSE, Polygon grantee claim UNVERIFIED, GitHub dormant since Feb 2026, dApp still "Bootstrapping"
- Financial review: the standard proposal PDF + legitimate alternatives (Aragon, Juicebox, Snapshot) `[FULL]` - extraction math, 20% CFR lock-in analysis, bait-and-switch diagnosis

The two PDFs themselves are archived in this folder as `ideation-draft.pdf` (313 KB, 12 pages) and `standard-proposal.pdf` (3.0 MB, 15 pages). They are the primary source for every quote in this doc.

Per the staleness flags in Doc 695: the credential claims (Retro9000, Polygon Labs) and the live-product status should be re-verified by Zaal directly before being cited in any reply to Matt, since these are the points he is most likely to push back on.
