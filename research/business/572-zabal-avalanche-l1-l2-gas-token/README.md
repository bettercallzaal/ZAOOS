---
topic: business
type: decision
status: research-complete
last-validated: 2026-04-30
related-docs: 553, 555, 567
tier: STANDARD
---

# 572 — $ZABAL Chain: Avalanche L1, L2, or Stay on Base?

> **Goal:** Decide whether to launch a dedicated chain (Avalanche L1, OP Stack L2, Arbitrum Orbit, Cosmos zone) with $ZABAL as native gas, or keep $ZABAL as an ERC20 on Base.

## Key Decisions (read first)

| Decision | Recommendation | Reason |
|----------|----------------|--------|
| Launch own chain in 2026? | **NO** — stay on Base | 188 members, token liquidity unproven, no app-specific bottleneck Base cannot solve |
| Best chain stack IF we eventually launch? | **Avalanche L1 with $ZABAL as native gas via ICTT** | 99.9% cheaper than 2024, full sovereignty, no rev-share to OP/Arb, built-in cross-chain to Base |
| Path to gasless UX TODAY? | **USE Coinbase Paymaster on Base** (Doc 553) | Zero new chain, zero bridge risk, users feel gasless |
| Re-evaluate chain decision when? | At ≥5,000 active wallets OR a concrete bottleneck Base can't fix (priv mempools, custom precompile, sub-cent fees at 100+ TPS) | Per Avalanche's own warning: "If new chains stay idle or mostly farm grants, the impact stays cosmetic." |
| If we do launch, who builds? | QuadWork + AvaCloud managed validators | Don't run validator infra ourselves; get to mainnet in weeks not months |

## TL;DR

Avalanche made launching a chain trivially cheap in Dec 2024 (Etna upgrade / Avalanche9000): drop the 2,000 AVAX stake, replace with ~1.33 AVAX/month per validator subscription. 83 new chains launched in 2025, 80 active L1s, 834 validators.

You CAN make $ZABAL the native gas token of a new Avalanche L1 by transferring it via ICTT (Interchain Token Transfer) from Base, then configuring it as the L1's native fee token. The Avalanche tooling for this is documented and shipping.

You SHOULD NOT do this yet. The math is favorable but the strategic case is weak: ZAO has 188 members, $ZABAL liquidity is thin, and the costs people forget (validator infra hosting, ICTT integration time, liquidity fragmentation, security surface) dwarf the protocol fee. The right answer is gasless on Base via Coinbase Paymaster (Doc 553) plus continued ZABAL utility expansion. Re-open this decision when there is a concrete capability Base/L2s cannot deliver.

## Where we are today (ground truth)

From `src/lib/agents/types.ts:48`:

```
ZABAL: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07'
```

- $ZABAL is a Base ERC20
- Used by VAULT/BANKER/DEALER agent stack (`src/app/api/cron/agents/`)
- Staking contract via env var `ZABAL_STAKING_CONTRACT` (`types.ts:60`)
- Conviction contract: `contracts/ZabalConviction.sol`
- Community surfaces: SongJam ZABAL leaderboard, Incented stake/earn, Nouns DAO on Base (`community.config.ts:181-205`)

Existing rails are deep in the Base/EVM stack. Migrating off costs migration tax.

## Avalanche L1 math (post-Etna, current as of 2026-04-30)

| Item | Number | Note |
|------|--------|------|
| Old subnet model (pre-Dec 2024) | 2,000 AVAX stake required | ~$18,380 lockup at $9.19/AVAX |
| New L1 model (post-Etna, ACP-77) | 1.33 AVAX / validator / month | Subscription, not stake |
| AVAX price | $9.19 (2026-04-30) | Source: CoinMarketCap |
| Per-validator protocol fee | ~$12.22 / month | 1.33 × $9.19 |
| 5-validator chain protocol fee | ~$61 / month | Bare minimum, no infra |
| Validator hardware (cloud) | $50-150 / validator / month | Estimate, hosting on cheap VPS |
| 5-validator full run-rate | ~$310-810 / month | $3,700 - $9,700 / year |
| AvaCloud managed validators | Pricing not publicly listed | Quote required; "managed" = they run it |
| New L1s launched 2025 | 83 (3× 2024) | Ava Labs ecosystem report |
| Active L1s on Avalanche | 80 | Q3 2025 Nansen report |
| Validators across all L1s | 834 | Q3 2025 |

So the floor is real: a 5-validator $ZABAL chain costs ~$300-800/month protocol+infra. That's cheap. The hidden costs are bigger.

## How $ZABAL becomes native gas (mechanism)

Avalanche officially supports ERC20-as-native-gas via two patterns:

### Pattern A: Custom native token (new mint)
- Genesis allocates a brand-new native token at chain launch
- Pro: simple, full control of supply
- Con: it's a NEW token, not $ZABAL — defeats purpose for ZAO

### Pattern B: Bridge $ZABAL from Base via ICTT
- Lock $ZABAL on Base (ICTT contract)
- Mint wrapped $ZABAL on the new Avalanche L1 as native fee token
- Use Avalanche Warp Messaging (AWM) + Teleporter for messaging
- Avalanche says: "ICTT is not a bridge. It's a set of audited, permissionless contracts that allow any Avalanche L1 to move tokens between chains... using the security of the protocol itself"

This is the path you'd want for $ZABAL. Caveats:
- ICTT secures the message via Avalanche validator set, not Base validators — different trust model from Base ↔ Optimism style bridges
- Liquidity fragments: $ZABAL on Base ≠ $ZABAL on the new L1; users must bridge in/out
- Existing ZABAL holders on Base do NOT automatically get gas on the new chain
- Once you commit, undoing is painful (token now lives on two chains)

### Cross-chain comparison: Avalanche L1 vs OP Stack vs Arbitrum Orbit vs Cosmos zone vs Stay-on-Base

| Stack | Sovereignty | Custom Gas Token | Rev-share | Time to launch | Music/community fit |
|-------|-------------|------------------|-----------|----------------|---------------------|
| **Avalanche L1** | Full — your own consensus, validators, governance | YES (ICTT or genesis mint) | NONE; pay 1.33 AVAX/validator/mo | Days via AvaCloud | Strong — 2GATHR (TITAN), Record Financial + 11am royalty infra are music-on-Avalanche case studies |
| **OP Stack (Superchain)** | Shared with Optimism Collective | YES (custom gas token Plasma mode) | 2.5% of revenue OR 15% of onchain profit (Superchain) | Weeks via Conduit/Caldera | Strong — Base IS OP Stack; ecosystem you already know |
| **Arbitrum Orbit** | Independent chain on Nitro | YES (custom gas token rollup mode) | 10% profit share for chains independent of Arb One | Weeks via Caldera/Conduit | Medium — strong DeFi, weaker creator-economy footprint |
| **Cosmos zone (CometBFT)** | Total — own validator set, IBC interop | YES (native staking + fee token) | NONE | Months — much higher engineering | Niche — heavy migration cost from EVM, no Base path |
| **Stay on Base** | None (Coinbase chain) | No (gas in ETH) | None | Zero — already there | Strong — Farcaster/Coinbase rails, agents already here |

### The real cost stack (what's not in the 1.33 AVAX/mo headline)

| Cost | One-time | Recurring |
|------|----------|-----------|
| Protocol L1 fees (5 validators) | 0 | $61/mo |
| Validator hardware/cloud | 0 | $250-750/mo |
| ICTT integration + audit | $20-60K | 0 |
| Custom precompile dev (if any) | $30-100K | 0 |
| Block explorer (managed) | $0-5K | $200-1K/mo |
| RPC infra (Ankr/Quicknode equivalent) | 0 | $200-2K/mo |
| Indexer/subgraph for new chain | $5-15K | $100-500/mo |
| Wallet integration push (Rainbow, MetaMask add-network UX) | 0 | dev-time tax forever |
| Liquidity bootstrap (DEX on new chain) | 5-10K $ZABAL + ETH | ongoing IL risk |
| Bridge UX (sending $ZABAL Base ↔ new L1) | 10-30K | support burden |
| Ecosystem/grants to attract apps | varies | ongoing |

Realistic year-1: $50-200K cash + materially all of QuadWork's bandwidth.

## Sentiment + ghost-chain risk

Avalanche themselves admit it: "If the 99.9% reduction in launch cost translates into dozens of serious, revenue-generating L1s, then AVAX benefits... If the new chains stay idle or mostly farm grants, the impact stays cosmetic."

Token-launch failure mode #1 (a16z, Onchain Magazine, multiple sources): launching a token (and by extension a chain) before product-market fit / community demand exists. ZAO is 188 members. $ZABAL has utility (staking, conviction voting, agent loops) but the 188-member surface area cannot saturate a sovereign chain.

The ghost-chain risk is real and named: 80 active L1s, 834 validators total = ~10 validators/L1 average. Many of those L1s will be near-empty for years. ZAO joining that long tail without a clear capability story = brand risk and burned engineering cycles.

## Music-industry signal on Avalanche (positive)

This part is encouraging if/when ZAO does pull this trigger:
- **2GATHR / TITAN L1**: AvaCloud-built fan-engagement chain for artists like AtHeart
- **Record Financial + 11am**: real-time royalty infrastructure on Avalanche, artists include Armani White, RealestK, Lil Tjay, A$AP Ferg, Alex Warren, Maddox Batson
- **Koroshi**: launched L1 on Avalanche with AvaCloud (entertainment/community)

So the precedent exists: a music/creator community on its own Avalanche L1 is a thing real artists with real fan bases are doing. ZAO is not yet at that scale. ZAOstock Oct 3, ZAO Music DBA, BMI/DistroKid pipeline (Doc 475), and the Cipher release would all need to be live + producing royalties before a chain layer makes economic sense.

## Recommendation in three tiers

### TODAY (2026-Q2/Q3)
- **STAY on Base.** $ZABAL stays where it is.
- **Implement Coinbase Paymaster gasless UX** (Doc 553 already in research library).
- **Deepen $ZABAL utility** on Base: staking, agent payments, ZAOfestivals points settlement, Cipher royalty splits via 0xSplits.
- **Spec the music economy on Base**: ZAO Music releases, royalty splits, ticketing (Unlock Protocol, Doc 555).

### NEAR-TERM (2026-Q4 / 2027-Q1)
- **Build the case.** Track Base bottlenecks honestly: are gas spikes blocking ZAOstock minute-of-event activity? Are agent loops getting priced out? Does ZAO Music need privacy primitives Base doesn't have?
- **Pilot ICTT** in testnet: fork an Avalanche L1 testnet, transfer fake $ZABAL via ICTT, measure dev experience.
- **Quote AvaCloud + Zeeve** for managed validator pricing in writing.

### MAYBE (2027+)
- **Launch Avalanche L1 ONLY IF** there is a concrete capability the chain unlocks (custom precompile for music royalty math, sub-cent fees at sustained 100+ TPS, MEV-resistant ticketing, etc.) AND ZAO has ≥5,000 active wallets producing recurring activity.
- **Use Pattern B** (ICTT-bridged $ZABAL as native gas) so existing holders' supply is honored.
- **Use AvaCloud managed validators** — do not run validator infra in-house.
- **Keep Base presence** — settle big TVL on Base, use the L1 for app-specific high-frequency activity.

## Why NOT OP Stack / Arbitrum Orbit (if we ever do launch)

| Stack | Why we'd skip |
|-------|---------------|
| OP Stack | 2.5% revenue OR 15% profit share to Optimism Collective for Superchain. Base is already OP Stack — adding another OP Stack chain = more of the same, no new sovereignty |
| Arbitrum Orbit | 10% profit share for independent chains, DeFi-first ecosystem (weaker for music/creator brands), no music-on-Orbit precedents matching 2GATHR / Record Financial |
| Cosmos zone | Engineering cost is much higher (CosmWasm or Ethermint), no Base path for existing $ZABAL holders, IBC ecosystem doesn't include where ZAO users actually live (Farcaster, X, Coinbase Wallet) |
| Polygon CDK | Possible alternative to OP Stack. Not researched here; if reopening, audit AggLayer rev terms |

Avalanche L1 is the cleanest path IF and WHEN we launch: zero rev-share, music precedent, 1.33 AVAX/mo unit economics, ICTT does what we need natively.

## Open questions for Zaal

1. Is there a SPECIFIC product feature that requires a chain (vs. just "we want our chain")? If yes, write it down. If no, we have our answer.
2. Do we treat $ZABAL chain as a 2027+ ZAO Music settlement layer (royalties, splits, ticketing) or a 2027+ general-purpose ZAO chain?
3. Does Maine-based ZAO Music DBA + Fractured Atlas fiscal sponsor introduce US-securities exposure if $ZABAL becomes gas (i.e., consumed/burned per tx)? Legal review needed before launch — flagged, not researched here.
4. Would we use AVAX-staked validators or pure ZABAL-economic-secured validators? Avalanche L1 model still uses AVAX staking economics on the P-Chain side; sovereignty has limits.

## Also See

- [Doc 553 — Coinbase Paymaster gasless UX on Base](../../infrastructure/553-coinbase-paymaster-gasless-base/) — the right answer for 2026
- [Doc 555 — Unlock Protocol ticketing for ZAOstock](../../infrastructure/555-unlock-protocol-zaostock/) — Base-native, no chain needed
- [Doc 567 — HF local models stack](../../agents/567-hf-local-models-stack/) — orthogonal, off-chain
- [Doc 475 — ZAO Music entity](../../music/475-zao-music-entity/) — the actual music economy this would serve
- [Doc 567 — Nouns DAO ZAO picks](../../governance/567-nouns-dao-zao-picks/) — Flows.wtf is on Base; another reason to stay there

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decision: NO chain launch in 2026, stay on Base | @Zaal | Confirm | This week |
| Implement Coinbase Paymaster on Base for $ZABAL/agent UX | @QuadWork | PR | Doc 553 already filed |
| Track Base bottlenecks honestly — log gas spikes / dev frustrations | @Zaal + agents | Issue tracker | Recurring monthly review |
| Quote AvaCloud + Zeeve for managed L1 (no-commit RFQ) | @Zaal | Outbound emails | When chain question reopens |
| Re-evaluate chain decision | @Team | Decision | At ≥5K active wallets OR concrete capability gap on Base |
| Music-economy on Base first: $ZABAL as Cipher royalty token via 0xSplits | @Zaal + DCoop | PR / contract deploy | Q3 2026 (pre-Cipher release) |

## Sources

- [Avalanche9000 upgrade goes live (The Block, 2024)](https://www.theblock.co/post/331101/anticipated-avalanche9000-upgrade-goes-live-reducing-costs-and-making-it-easier-to-launch-avalanche-subnets)
- [Etna: Enhancing Sovereignty of Avalanche L1s (Builder Hub)](https://build.avax.network/blog/etna-enhancing-sovereignty-avalanche-l1s)
- [How L1 Validator Fees Work (Builder Hub)](https://build.avax.network/guides/l1-validator-fee)
- [Use ERC-20 as Native Token (Builder Hub Academy)](https://build.avax.network/academy/avalanche-l1/l1-native-tokenomics/02-custom-tokens/02-custom-native-vs-erc20-native)
- [Avalanche L1s vs Layer 2 (Builder Hub)](https://build.avax.network/academy/avalanche-fundamentals/03-multi-chain-architecture-intro/04-custom-blockchains-vs-layer-2)
- [How Avalanche Became the Perfect Platform to Launch 100+ L1s in 2025 (Zeeve)](https://www.zeeve.io/blog/how-avalanche-became-the-perfect-platform-to-launch-100-l1s-in-2025/)
- [Avalanche Q3 2025 Ecosystem Report (Nansen)](https://research.nansen.ai/articles/avalanche-q3-2025-ecosystem-report)
- [Avalanche L1s and the Appchain Thesis (Chaintum, Jul 2025)](https://chaintum.io/2025/07/12/avalanche-l1s-and-the-appchain-thesis-a-new-internet-of-value/)
- [Koroshi Launches L1 on Avalanche with AvaCloud (GAM3S)](https://gam3s.gg/news/koroshi-launches-l1-on-avalanche-with-ava-cloud/)
- [Artist Spotlight: Music NFTs on Avalanche (Avax.network)](https://www.avax.network/about/blog/artist-spotlight-the-evolution-of-music-nfts)
- [OP Stack vs Arbitrum Orbit (Zeeve)](https://www.zeeve.io/blog/op-stack-vs-arbitrum-orbit-which-l2-stack-would-you-bet-on/)
- [OP Stack vs Arbitrum Orbit (Gelato)](https://gelato.cloud/blog/op-stack-vs-arbitrum-orbit-the-best-l2-rollup-comparison)
- [Launch a Custom Native Gas Token for Polygon CDK Chain (Polygon)](https://polygon.technology/blog/tutorial-launch-a-custom-native-gas-token-for-a-polygon-cdk-chain)
- [Configure Custom Gas Token for Arbitrum Rollup (Arbitrum Docs)](https://docs.arbitrum.io/launch-arbitrum-chain/configure-your-chain/common-configurations/use-a-custom-gas-token-rollup)
- [Avoid These Common Token Launch Mistakes (Onchain Magazine)](https://onchain.org/magazine/avoid-these-common-token-launch-mistakes/)
- [a16z: Getting Ready to Launch a Token](https://a16zcrypto.com/posts/article/getting-ready-to-launch-a-token/)
- [AvaCloud managed services FAQ](https://support.avacloud.io/what-managed-services-does-avacloud-offer)
- [erc20-as-subnet-gas-token-tutorial (GitHub, zicoz18)](https://github.com/zicoz18/erc20-as-subnet-gas-token-tutorial)
- [AVAX price (CoinMarketCap, 2026-04-30)](https://coinmarketcap.com/currencies/avalanche/)
