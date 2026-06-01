---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-31
superseded-by:
related-docs: 791, 674, 745, 406, 792
original-query: "https://tasern.quest/fund/mint.html please"
tier: STANDARD
---

# 794 — Tasern Charity Vaults: the Aave-V3-backed implementation behind the MemeForTrees "charity fund token" (closes Doc 791's open question)

> **Goal:** Read the actual mint/burn page Zaal forwarded, identify the live mechanism behind the MemeForTrees "charity fund token" pitch decoded in Doc 791, and decide what the Charity Vault architecture means for a ZAO Impact Token / ZAO Fund.

## Key Decisions (Recommendations First)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | This page ANSWERS the open question Doc 791 flagged: the yield is real (Aave V3 USDC lending), not inflation | Doc 791 said "where does the 'earn more' + funding stream come from? unanswered - if reserve yield, sustainable; if inflation, ponzi." mint.html states "Powered by Aave V3", "Yield buys MfT and distributes", principal redeemable 1:1 any time. It is the SUSTAINABLE shape Doc 791 recommended investigating. | @Zaal |
| 2 | Partly CORRECT Doc 791: the charity-stablecoin product is LIVE, not "aspirational marketing" | Doc 791 treated the funding-stream framing as separate/aspirational from the $MfT meme/game token. The vault contract is deployed on Base, immutable, no admin keys, with two live vaults (MfT global + PRGT Nigeria). The mechanism is shipped. | @Zaal |
| 3 | COPY the architecture for a "ZAO Impact Vault", do NOT integrate $MfT | Clean copyable pattern: USDC -> Aave V3 -> yield split 3 ways -> proof-of-deposit token redeemable at par. Build ZAO's own on the same rails (cite `community.config.ts` contracts block + `src/lib/agents/runner.ts`). Skip the $MfT/Baselings meme-game layer entirely - it adds reflexive-token risk Doc 792 warns against. | @Zaal |
| 4 | The "proof of deposit, not a stablecoin, follows aUSDC legal precedent" framing is the key legal unlock - copy it verbatim into any ZAO spec | This is how they sidestep money-transmitter / payment-instrument regulation: the token is a deposit position (like Aave's aUSDC receipt), not a payment token. BCZ Strategies LLC counsel should validate before any ZAO vault ships. | @Zaal |

## What mint.html actually is (FULL)

Title: **"Charity Vaults — Mint & Burn"**. A two-vault USDC deposit/redeem dApp on Base. Vault selector offers:

- **MfT — Money for Trees (Global)**
- **PRGT — Poly Raiders (Pankshin, Plateau State, Nigeria)** — a second, geo-specific charity vault using the same contract template.

### The Money for Trees vault, verbatim

> "Deposit USDC. Receive MfT 1:1 as proof of deposit (not a stablecoin). Yield buys MfT and distributes to holders, the Meme for Trees reactor (helping people funds having fun too), and operations. Redeem anytime. No lock-up. No admin keys. Immutable contract. Follows aUSDC legal precedent -- deposit position, not a payment instrument."

### Yield split (three-way, near-even)

| Bucket | Share | What it does |
|--------|-------|--------------|
| Holders | 33.33% | Yield-buys MfT, distributed to depositors (the "hold-to-earn" Doc 791 saw) |
| Meme for Trees | 33.33% | The charity / regen reactor (the "funding stream" Doc 791 saw) |
| Operations | 33.34% | Runs the thing |

### Mechanics

- **Mint:** Deposit USDC -> receive MfT 1:1 (proof-of-deposit receipt).
- **Burn:** Burn MfT -> receive USDC 1:1 back. No lock-up, redeem anytime.
- **Yield engine:** "Powered by Aave V3" - deposited USDC is supplied to Aave V3 on Base; the lending APY (page shows a live "Aave USDC Rate" stat) is the only money that moves to holders/charity/ops. Principal stays fully reserved and redeemable.
- **Trust model:** "No admin keys. Immutable Contract." Stats surfaced: Total Deposited, Total Harvested, Pending Yield, Aave USDC Rate.
- **Contact:** `<redacted-email>` (a single Gmail address is the only human handle on the page).

This is the honest version of Doc 791's decode: principal is never at risk (1:1 redeem), only the Aave yield is split. The "for normies this still seems risky" objection from the original tweet is structurally answered - though the UX still asks a normie to trust an immutable contract + Aave.

## How this fits the wider Tasern / Meme for Trees network

The forwarded page is one surface of a larger agent-first regen network at tasern.quest (founder James Magee, "Tales of Tasern" homebrew D&D universe, `memefortrees.base.eth`, contact carbon-counting-club.com per Doc 791). Other surfaces, from llms.txt (FULL):

- **Unrugable Launcher** - token factory on Base (chain 8453). $5 USDC seed -> 8 permanently locked Uniswap V3 LP positions. "No withdraw function. Liquidity is locked by the absence of code." 100% to LP, nobody (not even the team) receives tokens.
- **Reactor chain** - 35+ reactors firing every 2hrs, 180+ Uniswap V3 pools, 5 fully renounced. Bottom-up fee cascade: token reactors -> CHAR reactors -> Unrugable Hub -> Reactor Prime (final buy-back). Permissionless `fire_reactor` costs ~$0.01 gas.
- **CHAR** (`0x20b048fA035D5763685D695e66aDF62c5D9F5055`) - carbon-retirement token; 6% of each launch seed funds the CHAR reactor; every trade burns CHAR. Confirmed via Toucan Protocol: CHAR is Toucan's biochar-credit token on Base, 1 CHAR = 1 tonne carbon removed.
- **Baselings** - MCP-driven pet/yield game that burns $MfT (the meme/game layer Doc 791 described).
- **Agent-first by design** - llms.txt, `/.well-known/ai-plugin.json`, OpenAPI spec, `agents.json`, and a `baselings-mcp` npm package (49 tools, v1.2.0) with an ElizaOS plugin path. The whole network is built to be operated by autonomous agents.

Naming nuance to flag: the token ticker is **MfT**; the project is **Meme for Trees**; the global vault is labeled **"Money for Trees."** Doc 791 wrote "MemeForTrees." All three refer to the same thing. Use "MfT (Meme for Trees)" going forward.

## ZAO Application — a copyable "ZAO Impact Vault" spec

ZAO is positioned as a "decentralized impact network" (memory: `project_zao_canonical_pitch`) and already runs impact-funding surfaces: the ZAO Fund for Emerging Culture on Artizen (Doc 674), Jose Acabrera's monthly Impact Concert with ETH + quadratic funding (Doc 745, the 22nd), and ZAOstock fundraising ($7K min / $20K target, Fractured Atlas fiscal sponsorship).

The Charity Vault is a near-drop-in primitive for these. Minimum viable ZAO version:

1. **Deposit:** Supporter deposits USDC, receives `zIMPACT` 1:1 (proof-of-deposit, NOT a stablecoin - copy the aUSDC-precedent framing verbatim).
2. **Yield:** USDC supplied to Aave V3 on Base. Only the APY moves.
3. **Split:** Configurable, e.g. 50% chosen ZAO cause (an artist, ZAOstock, the match fund) / 30% depositor rewards / 20% ops. Tunable per vault.
4. **Redeem:** Burn `zIMPACT` -> USDC back 1:1, any time, no lock-up.
5. **Geo/cause templates:** Tasern proves the same contract can spawn cause-specific vaults (Money for Trees global, PRGT Nigeria). ZAO could spawn per-artist or per-event vaults from one template.

Pitch to a normie: "Your money is never at risk - redeem 1:1 any time. Only the interest is donated." That is the inverse of the creator-coin delusion in Doc 792 and the honest realization of Doc 791's recommendation.

Integration points in this codebase: contract addresses would land in `community.config.ts` (contracts block); any agent-driven harvest/distribute loop would extend `src/lib/agents/runner.ts`; payment rails already researched via Coinflow (Doc 406). Smart-contract work would live in `contracts/`.

Open risk to resolve BEFORE building: (a) BCZ Strategies LLC counsel must validate the "deposit position, not payment instrument" framing for a US entity; (b) Aave V3 USDC APY on Base is currently low single digits - at small TVL the charity stream is tiny, so this is a narrative/loyalty primitive first, a real funding engine only at scale; (c) immutable-no-admin-keys is great for trust but means a bug is permanent - audit is non-negotiable.

## ZAO Giveback Vault — ideation (2026-05-31 brainstorm, captured for later)

This started as a read of the Tasern page and turned into a brainstorm about building ZAO's own version. Below is the captured thinking - NOT a committed build, a seed for a future spec.

### Concept

A ZAO flagship "**giveback**" primitive: deposit USDC, principal stays 1:1 redeemable forever, only the Aave yield streams to a ZAO cause. Depositors get non-financial status (leaderboard, ZOLs/Respect, badge) and earn $ZABAL. Honest no-loss pitch ("your money is never at risk, only the interest is donated"), the inverse of the creator-coin delusion in Doc 792 and the sustainable realization of Doc 791's recommendation. Dogfooded by ZAO first; a factory so others can deploy their own comes later.

### Decisions locked in the brainstorm

| Decision | Choice | Notes |
|----------|--------|-------|
| v1 wedge | **ZAO dogfoods it** | One real vault, ZAO-chosen cause. Prove the mechanism on ourselves before a factory / before anyone else deposits. Smallest surface, fastest trust. |
| Yield split | **100% yield to cause + non-financial perks** | All interest to the cause. Depositors earn status: leaderboard, ZOLs/Respect credit, a badge (POAP/NFT), gated access. No depositor yield-cut -> keeps the "pure giveback" story. |
| Modularity | **Configurable split at deploy time** | Contract is a general template supporting 100%-cause / cause+ops / cause+depositor / cause+perks. v1 deploys the simple config; the factory vision reuses the same template. Build the primitive, deploy the simple instance. |
| Asset / yield / chain | **USDC + Aave V3 + Base now; ZABAL-LP vault later** | USDC+Aave is the proven, principal-safe base. A ZABAL-deposit (Uniswap V3 LP-fee) vault comes later as a separate, clearly-labeled "advanced / NOT principal-protected" vault type via the same factory. |
| $ZABAL role | **Reward layer now (Path A), LP-vault later (Path B)** | See tension below. |

### The $ZABAL tension (important - resolve before any build)

The no-loss model needs the deposited asset to earn real reserve yield. USDC does (Aave lending APY). **$ZABAL (`0xbB48...0b07`, Base) cannot** - no lending market exists for it. Three ways to involve ZABAL:

- **Path A (chosen for v1): USDC vault, ZABAL as the reward.** Deposit USDC -> Aave V3 -> 100% yield to cause. Depositors EARN $ZABAL + leaderboard + ZOLs. ZABAL gets genuine new utility ("earn ZABAL by giving") with zero reflexive risk and principal stays 1:1 safe.
- **Path B (later, separate vault type): ZABAL deposit via Uniswap V3 LP fees.** Deposit ZABAL -> LP -> trading fees donated to cause. Drives ZABAL liquidity + volume (this is literally Tasern's reactor mechanic). BUT impermanent loss means principal is NOT perfectly 1:1 safe, and fee yield is volatile/low. Must be labeled "not principal-protected."
- **Path C: ZABAL staking emissions. SKIP.** Inflationary, reflexive - the exact shape Docs 791/792 told us to avoid.

Decision: ship Path A as the safe dogfood, add Path B as an opt-in advanced vault later through the same factory.

### Inspiration landscape (what to steal, May 2026)

| Project | What it is | What to take | Link |
|---------|-----------|--------------|------|
| **Octant v2** (Golem Foundation) | THE production "yield-donating vault" framework. ERC-4626 + Yearn v3, yield routes to an allocation address (`dragonRouter`), principal preserved. Spearbit-audited. Gitcoin deployed $1M treasury into it May 2026. | Build ON this rather than from scratch. The reference architecture for exactly this. | gitcoin.co/case-studies (Octant) |
| **OnlyYield** | "Patreon, but you keep your principal." USDC -> Aave V3 -> yield funds creators -> unlock content. On Base. | The artist-support angle + the per-user yield accounting pattern. ZAO-native. | github.com/SamFelix03/OnlyYield |
| **Kinetic** | Deploy-your-own yield-donation vault, multi-recipient custom %, ERC-1167 clones + PaymentSplitter. | The factory + multi-recipient split pattern for the "others deploy" phase. | github.com/DeborahOlaboye/Kinetic |
| **aave-octant-integration** | Minimal Aave V3 ERC-4626 + 100%-yield-donation reference, principal-protected, with a full test scenario. | The simplest correct contract to copy for the dogfood. | github.com/amrro/aave-octant-integration |
| **CanopySplit / YieldRelay / EthBanka** | Same primitive, climate/humanitarian/Ukraine framings. EthBanka ships **Farcaster Frames** for viral vault sharing (ZAO's exact stack). | EthBanka's Farcaster Frame distribution. Epoch-based split config. | github.com/N-45div/CanopySplit, github.com/damhuman/bankacast |
| **Rari charity-vaults** (2021) | The OG "share interest with a charity," permissionless `deployCharityVault` factory, Endaoment-integrated. | The original factory + referral-link-per-cause idea. | github.com/Rari-Capital/charity-vaults |
| **PoolTogether V5** | No-loss PRIZE: yield becomes a prize pool, gamified, permissionless ERC-4626 prize vaults. | The gamification / leaderboard / prize mechanic for the perks layer. | docs.pooltogether.com |
| **Glo Dollar** | Hold a stablecoin, its reserve yield funds public goods. 100% backed, 1:1 redeemable, choose your cause. | The "passive giving by holding" framing + cause-choice UX. | glodollar.org |
| **Endaoment** | Tax-compliant onchain Donor-Advised Fund, 1.8M nonprofits, instant tax receipts, fiat on-ramp, deploys idle funds into Aave/Compound. | The legal/tax/fiat rail if ZAO ever wants real charity compliance. | endaoment.org/donors |
| **Giveth + Superfluid / Drips** | Recurring streaming donations on Base + GIVbacks token rewards / stream-and-split to causes. | The streaming + GIVbacks-style reward (maps to the ZABAL reward layer). | giveth.io, drips.network |
| **Aave governance temp-check** (May 2026) | Aave community is itself proposing a "principal-preserving charitable giving layer" - explicitly says it does NOT need a tradable token, wants fiat on-ramp + cause choice + "$100 in -> $100 out". | Validation that this is a live, credible pattern; the "$100 in -> $100 out" framing + no-token stance. | governance.aave.com/t/...24937 |
| **VaultGuard** + OZ ERC-4626 | ERC-4626 vaults keep getting drained via share-inflation / donation attacks (Resupply $10M Jun 2025, sDOLA $240k Mar 2026). | MANDATORY: virtual-shares/decimal-offset mitigation + audit. Biggest build risk. | github.com/tagupta/VaultGuard |

### Build approach (proposed, for the future spec)

Fork the **aave-octant-integration / Kinetic** pattern (audited OZ ERC-4626 + Aave V3 strategy + PaymentSplitter, ERC-1167 clones) rather than writing from scratch, OR build directly on **Octant v2** if its vault factory is open enough. Either way: USDC asset, Aave V3 Base strategy, 100%-yield-to-cause router, virtual-shares inflation guard, no upgrade keys, audited before mainnet. Perks (leaderboard, ZOLs, ZABAL reward, badge) live off-chain in ZAO OS + a Farcaster Frame for distribution (EthBanka pattern). Surfaces TBD: ZAO OS route vs Farcaster mini app vs standalone graduate.

### Open questions for the spec session

- Which exact ZAO cause does the dogfood vault fund first - ZAOstock, the Artizen match fund (Doc 674), or a specific artist (Jose's Impact Concert, Doc 745)?
- Where does it live - a ZAO OS app route, a Farcaster mini app/Frame, or a standalone graduate repo from day one?
- Perks: on-chain badge (NFT/POAP) vs purely off-chain leaderboard + ZOLs? How is the ZABAL reward funded (treasury allocation, not emissions)?
- Build on Octant v2 directly vs fork the Aave-Octant reference - needs a spike to see how open Octant's factory is.
- Legal: does BCZ Strategies LLC counsel need to bless the "deposit position, not payment instrument" framing (copied from Tasern's aUSDC-precedent line) before US users deposit?

## Also See

- [Doc 791](../791-charity-fund-token-mechanism-regen/) - the tweet-level decode this doc completes (its open question is answered here)
- [Doc 674](../../events/674-edge-esmeralda-artizen-telamon-outreach/) - ZAO Fund for Emerging Culture (Artizen)
- [Doc 745] (memory `project_jose_acabrera`) - Impact Concert, ETH + quadratic funding
- [Doc 406](../406-coinflow-isv-deep-dive-wavewarz-zao/) - Coinflow payment rails for ZAO
- [Doc 792](../792-nicky-sap-juke-founder-worldview-farcaster-strategy/) - why reflexive creator/social tokens fail (the meme-game layer this avoids)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run a brainstorm -> spec session on the "ZAO Giveback Vault" using the captured decisions + open questions above | @Zaal | Spec | When ready to build |
| Pick the dogfood cause (ZAOstock / Artizen match fund / an artist) before the spec | @Zaal | Decision | Before spec |
| Spike: build directly on Octant v2 vs fork aave-octant-integration / Kinetic | @Zaal | Research | At spec time |
| Run the "deposit position not payment instrument" framing past BCZ Strategies LLC counsel BEFORE any US deposits | @Zaal | Legal | Before mainnet |
| Mandatory: ERC-4626 inflation-guard (virtual shares) + external audit before mainnet (VaultGuard catalog) | @Zaal | Security | Before mainnet |
| Do NOT integrate / endorse $MfT or the Baselings/Unrugable layer - architecture inspiration only | @Zaal | Note | Done |

## Sources

- [Charity Vaults — Mint & Burn (the forwarded page)](https://tasern.quest/fund/mint.html) - `[FULL - JS-rendered, fetched via exa web_fetch after WebFetch returned title-only]`
- [Tasern / Unrugable llms.txt](https://tasern.quest/llms.txt) - `[FULL]` - network architecture, contracts, MCP tools, reactor chain
- [tasern.quest home (Meme For Trees Arcade)](https://tasern.quest/) - `[FULL - exa search highlights]`
- [CHAR — Liquid market for biochar credits (Toucan Protocol)](https://blog.toucan.earth/onchain-climate-action-char/) - `[FULL]` - confirms CHAR = Toucan biochar token on Base, address matches
- [idl3o/tasern-4 (Tales of Tasern AI RPG, GitHub)](https://github.com/idl3o/tasern-4) - `[FULL - exa highlights]` - the game-universe side of the project
- Doc 791 (internal) - the tweet-level decode of the same project - `[FULL]`

Inspiration-landscape sources (for the ZAO Giveback Vault ideation section):

- [Gitcoin x Octant: yield-powered matching (Octant v2)](https://gitcoin.co/case-studies/from-one-off-rounds-to-ongoing-impact-gitcoin-s-new-sustainable-funding-model) - `[FULL]` - $1M treasury into ERC-4626 yield-donating vault, May 2026
- [OnlyYield (Patreon-with-yield, Base)](https://github.com/SamFelix03/OnlyYield) - `[FULL - exa highlights]`
- [Kinetic (deploy-your-own yield-donation vault)](https://github.com/DeborahOlaboye/Kinetic) - `[FULL - exa highlights]`
- [aave-octant-integration (minimal principal-protected reference)](https://github.com/amrro/aave-octant-integration) - `[FULL - exa highlights]`
- [CanopySplit (climate yield-split vault)](https://github.com/N-45div/CanopySplit) - `[FULL - exa highlights]`
- [EthBanka / bankacast (Aave donation vaults + Farcaster Frames, Base)](https://github.com/damhuman/bankacast) - `[FULL - exa highlights]`
- [Rari-Capital charity-vaults (OG permissionless factory)](https://github.com/Rari-Capital/charity-vaults) - `[FULL - exa highlights]`
- [PoolTogether V5 (no-loss prize, permissionless ERC-4626)](https://docs.pooltogether.com) - `[PARTIAL - docs landing + 2026 review; not the full contract spec]`
- [Glo Dollar (public-goods stablecoin)](https://www.glodollar.org/) - `[FULL - exa highlights]`
- [Endaoment (onchain DAF, tax-compliant)](https://endaoment.org/donors) - `[FULL - exa highlights]`
- [Giveth recurring donations (Superfluid, Base)](https://docs.giveth.io/recurringdonation) - `[FULL]`
- [Drips Network (stream + split to causes)](https://www.drips.network/) - `[FULL - exa highlights]`
- [Aave governance temp-check: principal-preserving charitable giving layer](https://governance.aave.com/t/temp-check-principal-preserving-charitable-giving-layer-for-aave-app/24937) - `[FULL]` - May 2026, validates the pattern
- [VaultGuard (ERC-4626 inflation/donation-attack detector)](https://github.com/tagupta/VaultGuard) - `[FULL - exa highlights]` - the security risk catalog
- [OpenZeppelin ERC-4626 (inflation-attack mitigation)](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/token/ERC20/extensions/ERC4626.sol) - `[FULL]`
