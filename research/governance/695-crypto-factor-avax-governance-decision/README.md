---
topic: governance
type: decision
status: research-complete
last-validated: 2026-05-20
superseded-by:
related-docs: 56, 133, 572, 573, 567
original-query: "avax and avalache ive wanted to do stuff with for a while [+ pasted Telegram conversation between Zaal and 'Matt | Crypto Factor' offering to build a fresh $ZAO token ecosystem dApp on Avalanche] heres a convo lets do a research doc on this and see what might make sense for us to do to bring the governance side to avax"
tier: STANDARD
---

# 695 — Crypto Factor + $ZAO on Avalanche: Should ZAO Bring Governance to Avax?

> **Goal:** Synthesize the Telegram conversation with "Matt | Crypto Factor" (a third party offering to deploy a fresh $ZAO token ecosystem dApp on Avalanche), vet the counterparty, and decide what - if anything - ZAO should do about putting governance on Avalanche.

## Key Decisions (read first)

| Decision | Recommendation | Reason |
|----------|----------------|--------|
| Let Crypto Factor deploy a token branded "$ZAO"? | **NO** | $ZAO is already a soulbound, non-transferable Respect token. Matt's pitch is a tradeable token with staking + LP mining. Two contradictory things cannot both be "$ZAO". |
| Move ZAO governance to Avalanche? | **NO - keep it on Optimism** | Avalanche gives zero governance advantage. Tooling (Snapshot, Aragon) is chain-agnostic. Moving fragments the Respect token across 3 chains and kills quorum. |
| Sign anything with Crypto Factor now? | **NO** | Counterparty is unverified: pseudonymous team, two "client" sites that are empty shells registered the same day, refuses video calls. Verdict: unverifiable, medium scam risk. |
| Build the shared doc Matt asked for? | **YES - but as a vetting tool, not a commitment** | A shared doc costs nothing and lets ZAO probe whether Crypto Factor is real. Share only public info. Treat their doc as the test. |
| Hard gate before ANY engagement | Real names + a video call + a reference client Zaal can phone + on-chain proof of a live client token with liquidity | If they refuse any of these, walk. A real shop passes all four. |
| Want Avalanche exposure anyway? | **Yes - but via $ZABAL surfaces, not governance, not this vendor** | Docs 572/573 already mapped the legit Avax path (The Arena, Retro9000). That is a marketing/liquidity move, separate from governance and separate from Crypto Factor. |
| Fuji testnet sandbox? | **OK as a "prove yourselves" exercise only** | Use a throwaway token name, never "$ZAO", fully isolated from the ZAO brand. A testnet demo is free and reveals their actual skill level. |

## TL;DR

Matt from "Crypto Factor" cold-messaged Zaal on Telegram and, after a friendly back-and-forth, pitched deploying a "fresh $ZAO Token Ecosystem dApp" on Avalanche - branded to ZAO, with staking, LP mining, and reward distribution, integrated into thezao.com/zao-token. He proposes a Fuji testnet demo first, then a shared requirements doc, then production.

Two findings stop this in its tracks:

1. **The product contradicts what $ZAO is.** Matt quoted ZAO's own line back at himself - "$ZAO Respect token is illiquid and soulbound (non-transferable)" - and then in the next breath pitched a token with "staking and LP mining all the good stuff." Those are opposite things. $ZAO Respect is a non-transferable reputation token on Optimism. A tradeable token with liquidity pools branded "$ZAO" would create a second, speculative "$ZAO" that competes with and muddies the real one. That is a brand and legal problem before it is a tech problem.

2. **Crypto Factor cannot be verified.** The company has a real shell (UK registration, a 4-year-old domain, a GitHub org, a claimed Polygon grant) but the team is fully pseudonymous, the two "client ecosystems" Matt linked are empty "Bootstrapping..." pages on domains registered on the exact same day six months ago, there are zero independent reviews anywhere, and Matt explicitly said "we don't usually interact over calls." That last one is the loudest tell.

On the actual question - "bring the governance side to Avax" - the answer is no. Governance tooling (Snapshot, Aragon) is chain-agnostic; Avalanche adds nothing. ZAO's Respect token is soulbound and lives on Optimism. You cannot cleanly "bridge" a soulbound token, so "governance on Avax" really means "mint a fresh token on Avax" - which is exactly the contradiction in point 1.

What to actually do: build the shared doc as a low-cost way to test Crypto Factor, gate hard on real names + a call + a reference + on-chain proof, never let the word "$ZAO" touch their deployment, and keep governance on Optimism. If Zaal wants Avalanche exposure for its own sake, that is the $ZABAL path in Docs 572/573, not this.

## Part 1 - What Crypto Factor actually pitched (conversation synthesis)

The Telegram thread, condensed to its load-bearing parts:

| Stage | What happened |
|-------|---------------|
| Opener | Zaal cold-messaged Crypto Factor's account asking for "links to check out your music stuff" - so the first contact direction is slightly ambiguous, but Matt drove all subsequent BD. |
| Matt's framing | "We build token and data ecosystems, on-chain infrastructure for clients." Moving into "Social Intelligence and Rewards, Loyalty." Open to "sovereign rewards structures for artists and creators." |
| Disarming line | "We're not trying to sell anything. We scout around for ideas and projects to work with to add value." Fee model: "we get some - like 0.5% on service and deployment fees." |
| Credibility claims | Built their own "private application blockchain" ("Interchain") for cross-chain bridging; "granted by Labs" on Polygon; moved to Avalanche for payments-heavy clients (carbon credits, bond protocols). |
| Sample links | dapp.crypto-factor.io (core), dapp.dex-trading.live and dapp.tax-token.com (client "replicas"). Self-aware aside: "Feel free not to trust the links." |
| The actual ask | "Would you be interested in running a fresh $ZAO Token Ecosystem dApp - which could be integrated into thezao.com/zao-token?" Branded to ZAO, built on-chain, default functionality = staking, reward distribution, creator benefits, NFT-shareholding governance. |
| Proposed path | Fuji testnet demo -> shared requirements doc -> production. Alternative: deploy on Polygon now, bridge to AVAX later via their "Interchain." |
| Call posture | "We don't usually interact over calls" - offered to "set something up" only after Zaal pushed twice. Prefers to "filter to be efficient" and get "further down the line" before talking. |
| Current state | Matt is writing a synthesis doc + proposed ecosystem design ("probably need a few days"). Crypto Factor's own gear "fully deployed... sometime in June." |

The pitch is competent and friendly. It is also a textbook incremental-commitment ladder: cold contact -> shared doc -> testnet -> production contract with a perpetual 0.5% fee. Nothing in it is money-up-front or key-grabbing, which is good. But the shape is a template, not a tailored proposal - see Part 2.

## Part 2 - The core conflict: $ZAO is soulbound, the pitch is a tradeable token

This is the single most important finding in this doc.

ZAO's `$ZAO` is **Respect** - a reputation token. From `community.config.ts:101-115`:

```
respect: {
  ogContract:  '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957',  // ERC-20 "OG" on Optimism
  zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c',  // ERC-1155 "ZOR" on Optimism
  chain: 'optimism',
}
```

Respect is **non-transferable, illiquid, soulbound** by design. It is earned through the Fractal process (Doc 56, Doc 133), it cannot be bought or sold, and that property is the entire point - it makes voting weight track contribution, not capital. ZAO's whole governance philosophy (ORDAO / OREC / Respect Game) is explicitly anti-speculation.

Matt quoted that exact property back - "illiquid (not for sale or trade) and soulbound (non-transferable)" - and then pitched a token ecosystem with "staking and LP mining all the good stuff" and "reward distribution." A token you can stake in a liquidity pool is, by definition, transferable and tradeable. That is the opposite of Respect.

So "a fresh $ZAO token ecosystem on Avalanche" is not an extension of $ZAO. It is a **second, contradictory token** wearing the same name. The consequences:

- **Brand collision.** Two assets both called "$ZAO," one soulbound on Optimism, one tradeable on Avalanche. Members, press, and partners will not distinguish them. The reputation system's credibility leaks into a speculative asset and vice versa.
- **It looks like ZAO launched a speculative token.** ZAO has deliberately never done this. A tradeable "$ZAO" with staking rewards reads, externally, as a token launch - a reputational reversal of everything ZAO has said.
- **Securities / legal exposure.** A new transferable token with staking yield and LP rewards is the kind of instrument regulators scrutinize. ZAO has no legal entity of its own (BCZ Strategies LLC is the legal hub - see memory `project_zao_brand_legal_architecture`). Letting an unverified third party mint a yield-bearing "$ZAO" with no legal wrapper is a real liability, not a hypothetical one.
- **It is a templated pitch.** Matt heard "soulbound, non-transferable" and pitched LP mining anyway. Either he did not register the contradiction or the offer is the same one Crypto Factor sends every project that has a token. Both readings mean the proposal is not actually built around ZAO.

If ZAO ever does want a tradeable community token, it already has one: **$ZABAL** (`0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`, Base - see Doc 572). The tradeable-token slot is filled, on Base, with a contract ZAO controls. There is no open lane for a Crypto Factor "$ZAO" token.

## Part 3 - Crypto Factor: counterparty due diligence

Skeptical due diligence was run on Crypto Factor (domains, whois, GitHub, company filings, web footprint, the X account, the pitch pattern).

**Verdict: UNVERIFIABLE - insufficient footprint. Medium scam risk. Do not transact without passing the hard gates below.**

Crypto Factor is not a clear, obvious scam - there are real artifacts. But it is also nowhere near verified enough to hand brand or deployment authority to.

### Red flags

| Flag | Severity | Evidence |
|------|----------|----------|
| Two "client" sites are empty shells | HIGH | dapp.dex-trading.live and dapp.tax-token.com both return a "Bootstrapping dApp..." loading state. No live product, no UI, no on-chain token found. They were presented as proof of working client ecosystems. |
| Both client domains registered the **same day** | HIGH | whois: dex-trading.live and tax-token.com both created 2024-11-24. Batch-registering shell domains and using them as social proof is a token-mill pattern. |
| Fully pseudonymous team | HIGH | crypto-factor.io's team page lists "Crypto Factor Founder", "Shadows Crypto", "Crypto" - no real names, no LinkedIn, no bios. "Matt" could not be matched to any public profile. |
| Refuses video calls | HIGH | "We don't usually interact over calls." Agreed to "set something up" only under repeated pressure. Avoiding synchronous identity verification is the loudest single tell. |
| Cold BD to a project with a token | MEDIUM | "I see you have a $ZAO token" - Crypto Factor's model is to find projects that already have a token and pitch them. Hunt-for-revenue mode, not selective partnership. |
| Zero independent footprint | MEDIUM | No third-party reviews, no audits, no crypto-media mention, no Reddit/X discussion - positive or negative. A real B2B infra shop usually has some. |
| Perpetual 0.5% fee on a contract they deploy | MEDIUM | The fee itself is reasonable; the concern is it is collected by a contract Crypto Factor wrote and controls the upgrade path of. |
| "Interchain" private blockchain | LOW-MEDIUM | Marketed as "COMING SOON." Unverifiable. Adds an in-house bridge dependency between ZAO and AVAX. |

### Green flags / mitigating factors

- `crypto-factor.io` is a real, ~4-year-old domain (whois: created 2022-01-09), not a fresh registration.
- A UK company "Crypto Factor Ltd" (no. 13975058, registered 2022) exists and is active - a real legal entity, though directors were not independently confirmed in this session.
- A public GitHub org `Crypto-Factor-Labs` exists with ~5 Solidity/TypeScript repos (GPL-3.0). Commit recency was not confirmed.
- Crypto Factor appears on Polygon's public grantees list, and a Partisia Blockchain grant (Jan 2025) was announced for their "Interchain" work. Grant amounts not disclosed.
- They are **not** asking for money up front and **not** asking for keys. The proposed first step (Fuji testnet) is genuinely how legitimate dev shops de-risk.
- The fee model is transparent and documented (docs.crypto-factor.io).

The honest read: this is most likely either a small, real-but-junior dev shop running generic outreach, or a low-quality token mill. It is not, on the evidence, an obvious drain-your-wallet scam. But "probably real, possibly a mill, fully pseudonymous, refuses calls" is not a counterparty you let near the ZAO brand. The fix is verification gates, not a yes or a no.

### Hard gates before any engagement

All four must pass. Any refusal = walk away.

1. **Real names + verifiable identity** for Matt and the EU co-founder (LinkedIn, prior work history). Pseudonyms fail.
2. **A video call.** A real shop will do one call. If they keep "filtering to be efficient" past a synthesis doc, that is avoidance.
3. **A reference client Zaal can phone** - a real, named project Crypto Factor built for, with a contact who will talk.
4. **On-chain proof** - a live client token on Polygon or Avalanche with real transaction history and non-trivial liquidity, viewable on a block explorer. The two shell dApps do not count.

## Part 4 - Does governance belong on Avalanche? No.

Separate research was run on what "DAO governance on Avalanche" actually means in 2026.

**Conclusion: keep ZAO governance on Optimism. Avalanche offers no governance advantage.**

Why:

- **Governance tooling is chain-agnostic.** Snapshot - which runs ~68% of DAO voting - is off-chain and gasless; it can read token balances from any chain regardless of where the "space" nominally points. "Governance on Avalanche" via Snapshot is a meaningless distinction; the voting never touches Avalanche.
- **Aragon works on Avalanche, but also on Optimism and Base** with identical maturity. There is no Avalanche-only governance feature.
- **Avalanche L1s and the ACP process are not community governance.** ACP-77 (the Dec 2024 "reinventing subnets" upgrade) is about cheaply launching sovereign L1 chains. The ACP (Avalanche Community Proposal) process governs the Avalanche protocol itself, not a community DAO. Matt's "deeply ingrained governance models on NFT shareholding" is a product feature, not anything Avalanche-native.
- **Soulbound + cross-chain do not mix.** ZAO's Respect token is soulbound on Optimism. You cannot cleanly bridge a non-transferable token - bridging is a transfer. So "move governance to Avax" can only mean "mint a new token on Avax," which loops straight back to the Part 2 contradiction.
- **Cross-chain governance fragments quorum.** Respect is on Optimism, ZOUNZ Nouns DAO is on Base, $ZABAL is on Base. Adding Avalanche makes a fourth surface. Multi-chain governance is a documented participation killer - split balances, harder quorum, added attack surface (vote-then-unwind exploits during bridge desync).

| Tool | Avalanche support | Cost | Maturity | Note for ZAO |
|------|-------------------|------|----------|--------------|
| Snapshot (off-chain) | Yes (chain-agnostic) | Free, gasless | Mature, ~68% of DAO voting | Already usable; reads Optimism balances fine |
| Aragon OSx | Yes | ~$0.01-0.15/vote | Mature | No advantage over Optimism deployment |
| ORDAO / OREC (current) | Optimism only | Low | In use by ZAO | This is the system ZAO already runs |
| Tally | Was adding Avax | n/a | Shut down 2025 | Do not build on it |
| Snapshot X (on-chain) | No (Ethereum/OP/Arb/Polygon) | ~$0.02-0.10 | Emerging | Cannot read Avalanche state anyway |

If ZAO ever genuinely needed Avalanche voters to participate, the answer is **Snapshot with storage proofs** reading Optimism Respect balances - free, gasless, ~2/10 difficulty, no contracts, no bridge, no migration. That option exists permanently and costs nothing to add later. It is not a reason to move anything now.

## Part 5 - Where ZAO governance actually lives today (ground truth)

From the codebase and Docs 56 + 133:

- **Tier 1 - ZOUNZ on-chain:** Nouns Builder DAO on **Base**. Token `0xCB80...883`, governor `0x9d98...17f`. NFT holders, trustless on-chain execution.
- **Tier 2 - Respect / ORDAO:** ERC-20 "OG" + ERC-1155 "ZOR" reputation tokens on **Optimism**. OREC (Optimistic Respect-based Executive Contract) by Optimystics. Hats Protocol roles on Optimism. This is the Fractal-driven, soulbound layer.
- **Tier 3 - Snapshot weekly polls:** off-chain signaling.
- **$ZABAL:** tradeable ERC-20 on **Base** (`0xbB48...0b07`), used by the agent stack.

ZAO governance is already a deliberate, working three-tier system spread across Optimism and Base. It is not missing an Avalanche piece. Adding one subtracts coherence.

## Part 6 - If Zaal wants Avalanche exposure anyway

The opening line of the request - "avax and avalanche I've wanted to do stuff with for a while" - is a real, separate motivation, and it is legitimate. But it is a **marketing/liquidity** interest, not a governance one, and it has already been researched:

- **Doc 572** - decided: do NOT launch a $ZABAL Avalanche L1 in 2026; stay on Base. Re-evaluate at 5,000+ active wallets.
- **Doc 573** - found the real Avax surfaces worth ZAO's time without launching a chain: **The Arena** (arena.social SocialFi - 200K+ users, 70% of trade fees stream to creators), **Retro9000** retroactive grants, and the Record Financial music-royalty pattern.

So the Avalanche itch is best scratched by getting ZAO leaders and Cipher artists onto The Arena and bridging $ZABAL to C-Chain for tipping (Doc 573's plan) - not by handing the ZAO governance token to an unverified vendor. That keeps Avax exposure, the ZAO brand, and the Respect system all intact and separate.

## Part 7 - How to handle the shared doc and Matt

Matt asked for a synthesized doc and is writing his own. Zaal already said "I'm in for a shared doc." Good news: a shared doc is free, reversible, and is itself the best vetting tool. Recommended posture:

- **Do the shared doc - as a probe, not a promise.** Crypto Factor's version will reveal a lot: is it ZAO-specific or a template with the name swapped? Does it acknowledge that $ZAO is soulbound? Generic = mill.
- **Share only what is already public** - thezao.com, nexus.thezao.com, bettercallzaal.com, the public Respect/Fractal model. Do not share roadmap, member data, contracts beyond what is on-chain, or anything sensitive.
- **State the constraint plainly in the doc:** "$ZAO" is a soulbound, non-transferable Respect token and will stay that way; ZAO is not launching a tradeable token under that name. Any Crypto Factor build is, at most, a **separate, differently-named experiment**. See how they respond - a good partner adapts, a mill pushes the LP-mining template.
- **Take the Fuji testnet demo - on their dime, with a throwaway name.** A testnet build costs ZAO nothing and shows their real skill. Insist the testnet token is NOT called "$ZAO" (use e.g. "ZAO-SANDBOX-TEST"). Brand isolation is non-negotiable even on testnet.
- **Push the call once more, kindly.** Frame it as Zaal being newer to Avax and wanting context. If they hold firm against ever doing a call even after a doc exchange, treat that as a failed gate.
- **Sign nothing. Deploy nothing branded. Connect no ZAO-controlled wallet** to anything Crypto Factor built until all four hard gates (Part 3) pass.

A suggested reply to Matt, in Zaal's voice, that keeps the door open without committing:

> "Love it - let's do the shared doc. One thing to flag up front so we build on solid ground: our $ZAO is a soulbound, non-transferable Respect token - it's a reputation system, not a tradeable asset, and that's core to ZAO. So anything we'd test with you would be a separate, differently-named experiment, not a $ZAO token. With that framing, a Fuji testnet demo sounds like a great way to see what you can do. I'd still love a quick call at some point - I'm newer to Avax and some context would speed this up - but happy to start async with the doc. Send yours over and I'll mark it up."

This is honest, keeps Crypto Factor engaged, surfaces the soulbound constraint immediately (which will itself tell Zaal a lot), and commits to nothing.

## Comparison: the three things on the table

| Option | What it is | Recommendation | Why |
|--------|-----------|----------------|-----|
| Crypto Factor "$ZAO" token on Avax | Tradeable token + staking + LP mining, branded $ZAO | **REJECT as pitched** | Contradicts soulbound $ZAO; brand + legal risk; vendor unverified |
| ZAO governance migrated to Avalanche | Move voting/Respect to Avax | **REJECT** | Zero tooling advantage; soulbound token can't bridge; fragments quorum |
| Avax exposure via $ZABAL surfaces | The Arena, Retro9000, C-Chain tipping (Docs 572/573) | **PURSUE (separately)** | Real, low-risk, brand-safe Avax presence; already researched |
| Shared doc + Fuji testnet with Crypto Factor | Low-commitment vetting exercise | **DO - as a probe** | Free, reversible, reveals if Crypto Factor is real |

## Also See

- [Doc 56](../056-ordao-respect-system/) - ORDAO / OREC / Respect Game; how ZAO's soulbound governance works
- [Doc 133](../133-governance-system-audit/) - full audit of the three-tier governance system in ZAO OS
- [Doc 572](../../business/572-zabal-avalanche-l1-l2-gas-token/) - decided NOT to launch a $ZABAL Avalanche L1; stay on Base
- [Doc 573](../../business/573-zabal-avax-surfaces-arena-music/) - the legit Avalanche surfaces for ZAO (The Arena, Retro9000)
- [Doc 567](../567-nouns-dao-deep-zao-angles/) - Nouns DAO governance patterns relevant to ZAO

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Reply to Matt with the Part 7 script - shared doc yes, soulbound constraint stated, call requested | @Zaal | Message | This week |
| When Crypto Factor's doc arrives, check: ZAO-specific or template? Does it acknowledge soulbound $ZAO? | @Zaal | Review | On receipt |
| Run the four hard gates (real names, call, reference, on-chain proof) before any further step | @Zaal | Due diligence | Before testnet |
| Insist any Fuji testnet token is NOT named "$ZAO" - brand isolation | @Zaal | Constraint | Before testnet build |
| Keep governance on Optimism - no migration; no config changes to `community.config.ts` respect block | @Zaal | Decision | Standing |
| If Avax exposure still wanted, action Doc 573 (The Arena profiles for ZAO leaders + Cipher artists) | @Zaal | Separate track | Q3 2026 |
| Re-validate this doc if Crypto Factor passes the hard gates or sends a non-template proposal | @Zaal | Doc update | On trigger |

## Sources

Counterparty due diligence:
- [Crypto Factor - main site](https://www.crypto-factor.io/) `[FULL]` - substantive product landing page
- [dapp.crypto-factor.io](https://dapp.crypto-factor.io/) `[FULL]` - "Bootstrapping dApp..." shell, no functional product
- [dapp.tax-token.com](https://dapp.tax-token.com) `[PARTIAL - loading-state shell only; no functional UI rendered]`
- [dapp.dex-trading.live](https://dapp.dex-trading.live) `[FAILED - resolves to IP 89.58.17.64 but returned only a loading shell; no independent footprint]`
- [Crypto Factor docs / fee structure](https://docs.crypto-factor.io/crypto-factor) `[FULL]`
- [Crypto-Factor-Labs GitHub org](https://github.com/Crypto-Factor-Labs) `[PARTIAL - org + ~5 repos confirmed; commit recency/authorship not verified]`
- [Crypto Factor Ltd - UK Companies House #13975058](https://find-and-update.company-information.service.gov.uk/company/13975058) `[PARTIAL - company active, registration ~2022 confirmed; directors not independently verified this session]`
- [Polygon grantees list](https://polygon.technology/grants/grantees) `[PARTIAL - Crypto Factor listed; grant amount/scope not confirmed]`
- [Partisia Blockchain grant announcement](https://partisiablockchain.com/grant-announcements-from-partisia-blockchains-12-days-of-shipmas/) `[FULL]`
- X account @_Crypto_Factor `[FAILED - x.com returned 402 Payment Required; follower count, account age, activity not retrievable]`
- whois crypto-factor.io / dex-trading.live / tax-token.com `[FULL - via Bash; creation dates 2022-01-09, 2024-11-24, 2024-11-24]`
- [FBI IC3 PSA on crypto cold-outreach / dApp scam patterns](https://www.ic3.gov/PSA/2025/PSA250603) `[FULL]`

Avalanche governance landscape:
- [ACP-77 - Reinventing Subnets](https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/77-reinventing-subnets/README.md) `[FULL]`
- [Avalanche Etna upgrade press release](https://avax.network/about/press/etna-enhancing-the-sovereignty-of-avalanche-l1-networks) `[FULL]`
- [Snapshot docs - FAQ (Avalanche premium network)](https://docs.snapshot.box/faq) `[FULL]`
- [Snapshot docs - voting strategies](https://docs.snapshot.box/user-guides/voting-strategies) `[FULL]`
- [Aragon lock-to-vote plugin](https://github.com/aragon/lock-to-vote-plugin) `[FULL]`
- [Aragon Toucan multi-chain voting plugin](https://github.com/aragon/toucan-voting-plugin) `[FULL]`
- [Multi-chain DAO governance solutions (Markaicode, 2026)](https://markaicode.com/multi-chain-dao-governance-solutions/) `[FULL]` - community/practitioner pain points on cross-chain governance fragmentation
- [Metagovernance trilemma (Frontiers in Blockchain, peer-reviewed, Feb 2026)](https://www.frontiersin.org/articles/10.3389/fbloc.2026.1759073) `[FULL]`
- [Cross-chain governance attacks (TheBitTimes, Feb 2026)](https://thebittimes.com/cross-chain-governance-attacks-tbt125278.html) `[FULL]`

Internal:
- `community.config.ts:101-115` (Respect contracts, Optimism), `:226-235` (ZOUNZ Nouns DAO, Base) `[FULL]`
- Doc 56, Doc 133, Doc 572, Doc 573 (existing research library) `[FULL]`
