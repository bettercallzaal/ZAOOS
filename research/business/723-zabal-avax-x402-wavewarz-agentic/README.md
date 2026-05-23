---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-23
superseded-by:
related-docs: 572, 573, 706, 707, 718
original-query: "ok now lets actually research avax for what it could be for the zabal might be good for x402s for wavewarz agentic aswell"
tier: DISPATCH
---

# 723 - $ZABAL on Avalanche through x402 + Agentic WaveWarZ (Hub)

> **Goal:** Re-open the Avalanche question with a specific lens this time. Not "should ZAO migrate" - that is settled (Docs 572, 707: no). The specific question: through the **x402 agent-payment standard** and **agentic WaveWarZ** flows, does Avalanche actually offer $ZABAL anything new? Four DEEP agents researched x402, Avalanche's agentic-commerce stack, the bridging path, and the WaveWarZ category. This hub synthesizes them.

## Key Findings (read first)

| Question | Answer | Confidence |
|----------|--------|------------|
| Is x402 live on Avalanche? | **Technically yes, economically no.** Four facilitators support Avalanche (Dexter, PayAI, infra402, 0xGasless); Coinbase's official facilitator does not. On-chain indexers show zero measurable x402 settlement on Avalanche. Base has 79% of x402 resources and 80% of volume | High |
| Should ZAO bridge $ZABAL to Avalanche? | **NO** | High |
| Is there a real Avalanche surface for agentic ZAO use? | **Kite AI L1** - genuinely interesting for one narrow lane (autonomous agents that need sub-second finality + ultra-low fees), launched 29 Apr 2026, ~2 months old, unproven at scale | Medium |
| What chain is WaveWarZ on? | **Solana** - verified directly. This corrects an earlier session-turn note that disputed Doc 706r; the 706r agent was right and WaveWarZ is Solana-native | High |
| Does anything here change Doc 572/707? | **No - it confirms them.** $ZABAL stays on Base. Avalanche stays a tool, not a home. Now we know one specific Avax tool (Kite AI) worth monitoring | High |

## TL;DR

Four threads, one answer.

**Thread 1 - x402 itself.** x402 is real and shipping in May 2026, and roughly 80% of its volume and resources are on Base. Avalanche is technically supported but dormant: indexed services on Avax = zero settlement volume. Coinbase's own facilitator does not even serve Avax. The agent-payment economy is on Base.

**Thread 2 - Avalanche's agentic stack.** There is one credible new surface: **Kite AI**, an AI-focused Avalanche L1 that went mainnet 29 Apr 2026 with sub-second finality and sub-cent fees. Aethir's GPU compute fund is co-located on it. Five plausible use cases were identified (music marketplace splits, streaming micropayments, autonomous trader rebalancing, GPU-paid-during-trade, agent bounty escrows) - all of them are bottlenecked by latency or per-tx cost in a way Base cannot solve. **But it is two months old, unproven at scale, and Base still owns the user pre-verification (Coinbase) and the distribution.**

**Thread 3 - bridging $ZABAL.** Bottom line: do not. The tech path exists (Axelar, Celer, LayerZero at ~1-2% cost and 5-30 minutes), ICTT does not support Base as source. The blocker is economic: a wrapped $ZABAL on Avax has no DEX pool, no DeFi collateral value, no liquidity. The EURC precedent shows wrapped tokens on Avax concentrate to single-EOA liquidity even with Circle backing - $ZABAL would be far worse. Use AVAX natively when an Avax-native action is needed; keep $ZABAL on Base for everything else.

**Thread 4 - the WaveWarZ category, and a correction.** Agent 723d verified directly: **WaveWarZ runs on Solana** (472+ SOL cumulative volume, 735 live battles). My previous-turn note that disputed Doc 706r's "WaveWarZ Solana-native" claim was wrong - Doc 706r was right. ZAO's actual chain footprint is **Base + Optimism + Solana**, not Base + Optimism. The agentic-prediction category is shipping at scale (Agora, GuessMarket, Prediction Arena, MOLT, Orca) with x402 micropayments running on Celo/Base/Ethereum. There is no technical case for putting WaveWarZ-style agentic flows on Avalanche.

**Net for the ask.** $ZABAL gains nothing concrete from Avalanche through the x402 / agentic-WaveWarZ lens. The honest one-line: keep $ZABAL on Base, run agentic WaveWarZ on Solana + Base + Celo (where the actual x402 traffic and tooling lives), monitor Kite AI as a possible high-frequency lane only if a specific use case (autonomous judge agents making thousands of x402 micropayments) shows up.

## A correction worth surfacing

In the previous session turn I told you the 706r agent's claim that "WaveWarZ is Solana-native" looked wrong - I grounded that on `src/app/zabal/_components/ZabalHub.tsx` referencing WaveWarZ as a ZAO-orbit project. That was a misread. The ZabalHub component lists wavewarz.com as a hub-link to a separate product; it does not mean the product is deployed on Base. Agent 723d went directly to wavewarz.com and verified the on-chain footprint - WaveWarZ is on Solana Mainnet. Doc 706r had it right.

This matters beyond the correction. ZAO's chain footprint is wider than Doc 707 acknowledged - **Base + Optimism + Solana, not Base + Optimism.** Any future "where does ZAO live" framing should include Solana for the WaveWarZ surface. Doc 707's verdict (Avax is a tool not a home) is unchanged, but the home itself is bigger than I had written.

## The four threads

### 723a - x402 ecosystem in May 2026
x402 is the Coinbase-led HTTP-402 agent-payment standard. As of May 2026 it is real and live; the v2 spec supports any EVM chain via Permit2 and CAIP-2 chain identifiers. Avalanche has facilitator coverage (Dexter, PayAI, infra402, 0xGasless) and the CAIP-2 id `eip155:43114` is supported by SDKs. Settlement on Avax takes about 1.5-2 seconds. **But on-chain data from 19 May 2026 shows Avalanche has zero measurable x402 settlement** - the three indexed Avax services produced no revenue, while Base accounts for roughly 80% of all x402 volume. Coinbase's own facilitator does not serve Avalanche; new builders are directed to Base. *See `723a-x402-ecosystem-may-2026.md`. 28 sources (21 FULL, 7 PARTIAL).*

### 723b - Avalanche's agentic-commerce ecosystem
The genuinely new surface is **Kite AI**, an AI-purpose Avalanche L1 (Kite K2.6's settlement chain). Mainnet went live 29 Apr 2026 after ~1.9B testnet interactions. Quoted finality is sub-second, per-tx cost around $0.000001, with PayPal and Shopify integration claims. Aethir's $100M GPU compute fund is co-located on Kite, which is the one structurally distinct thing: an agent can atomically book GPU inference, pay in ATH, and receive proof-of-compute inside a single sub-second finality window - on Base that would mean bridging out, waiting, bridging back. The agent identified five concrete use cases where Kite plausibly beats Base: (1) agent-to-agent music marketplaces with remix-split settlement, (2) streaming micropayment settlement, (3) autonomous trader rebalancing, (4) GPU-compute-during-trading, (5) Hermes-style bounty escrows. Honest caveat: Kite is two months old, no long-term stability track record, and Base still owns the user base (110M+ pre-verified Coinbase users) plus the distribution. The agent's recommendation is parallel deployment: Base for primary commerce, Kite only for the high-frequency or compute-bundled lanes. Treat these specific claims as agent-reported; verify before any commitment. *See `723b-avalanche-agentic-commerce-may-2026.md`.*

### 723c - Bridging $ZABAL Base to Avalanche
The clean negative finding. The tech path is fine: Axelar (1-2% per transfer, ~5-30 min), Celer cBridge (similar), LayerZero / Stargate (similar). ICTT, Avalanche's native bridge, does NOT support Base as a source chain in May 2026. The economic story kills it: a wrapped $ZABAL on Avalanche would have zero DEX liquidity, no Pharaoh / LFJ pool, no DeFi collateral value (Aave, Benqi do not list it). The EURC case study (a Circle-backed stablecoin) shows even quality wrapped tokens on Avax concentrate to single-EOA liquidity supply - $ZABAL would be worse. The April 2026 KelpDAO incident ($292M via LayerZero RPC poisoning, since remediated with hardened DVN defaults) is the recent reminder that bridge ops carry residual infrastructure risk. **Bottom line:** keep $ZABAL on Base. Use AVAX natively (7-10x cheaper, no bridge) for any Avax-side agent operations. *See `723c-bridging-zabal-base-to-avax.md`.*

### 723d - Agentic prediction & battle games (and the WaveWarZ chain answer)
Two outputs. First, the chain answer: **WaveWarZ runs on Solana Mainnet**, verified directly at wavewarz.com, with about 472+ SOL of cumulative volume across 735 live battles. Second, the category map: agent-driven prediction / battle games are shipping at scale - five identified platforms (Agora, GuessMarket, Prediction Arena, MOLT Productions, Orca) are doing millions of autonomous trades, with agent-as-judge models settled via x402 micropayments on Celo, Base, and Ethereum. The infrastructure cluster for this category is **Solana for the live battle settlement** (sub-second finality, ephemeral tokens), **Base / Arbitrum for agent coordination** (Virtuals Protocol, Orca, x402), with no Avalanche presence anywhere. Three concrete agentic patterns for WaveWarZ: (a) autonomous judge agents that score battles and get paid via x402, (b) artist agents that generate music (Suno-style) and compete in agent tournaments with SOL budgets, (c) trader agents that discover upcoming battles and execute positions autonomously. *See `723d-agentic-prediction-battle-games.md`. 16 sources + 3 community sources.*

## What this changes (and what it does not)

| Prior position | Status after this research |
|----------------|---------------------------|
| $ZABAL stays on Base (Doc 572) | **Unchanged - reinforced.** No bridging case |
| Avax is a tool, not a home (Doc 707) | **Unchanged.** Now with one specific tool (Kite AI) to monitor |
| Use Avalanche surfaces only where they uniquely fit (Doc 707) | **Sharpened.** The unique fit for Kite is sub-second + ultra-cheap, useful only at agent-payment scale ZAO does not yet have |
| ZAO's chain footprint is Base + Optimism | **Wrong - actually Base + Optimism + Solana** (because WaveWarZ is Solana). Update memory and future docs |
| Agentic WaveWarZ probably runs on Base | **Wrong - runs on Solana** with Base/Celo as the x402 coordination layer |

## A concrete agentic WaveWarZ architecture (if you build it)

Based on 723b + 723d, a coherent agentic-WaveWarZ stack as of May 2026:

- **Solana:** battle creation, ephemeral battle tokens, settlement (where WaveWarZ already is).
- **Base:** $ZABAL custody and ZAO-side identity. Agent coordination layer (Virtuals Protocol pattern).
- **Celo / Base / Ethereum:** x402 micropayments for autonomous judge agents and per-call agent-to-agent payments. Where x402 volume actually is.
- **Kite AI (Avalanche L1):** OPTIONAL future lane for very-high-frequency judge or trader agents if x402 volume on Avax ever shows up. Today: monitor, don't deploy.
- **AVAX C-Chain:** not in the picture for this stack. No bridging $ZABAL, no $ZABAL-on-Avax presence.

This is consistent with Doc 707's "tool not a home" framing: each chain does one thing it actually wins at; nothing migrates.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update Doc 707's "ZAO's chain footprint" framing to include Solana (WaveWarZ) | @Zaal | Doc update | When next opened |
| Update relevant memory files (and any 1-pagers) that say "ZAO is Base + Optimism" to add Solana | @Zaal | Memory update | This week |
| Hold the line: $ZABAL stays on Base, do not bridge to Avalanche | @Zaal | Decision | Standing |
| Monitor Kite AI - if x402 volume on Avalanche moves from zero, revisit (specifically for any agentic-WaveWarZ judge-agent flow) | @Zaal | Watch | Quarterly |
| For agentic WaveWarZ flows: design around Solana (battles) + Base/Celo (x402), not Avalanche | @Zaal | Architecture | If/when WaveWarZ ships agentic features |
| Verify the Kite AI mainnet claims (uptime, real volume) before any commitment | @Zaal | Verification | Before any pilot |
| Re-verify x402-on-Avalanche traffic in 2-3 months - if it grows past noise, the calculus changes | @Zaal | Re-check | ~Aug 2026 |

## Also See

- [Doc 572](../572-zabal-avalanche-l1-l2-gas-token/) - the $ZABAL chain decision (stay on Base)
- [Doc 573](../573-zabal-avax-surfaces-arena-music/) - the original Avax surfaces research
- [Doc 706](../706-avalanche-ecosystem-deep-dive/) - the 21-dimension Avalanche deep dive
- [Doc 706n](../706-avalanche-ecosystem-deep-dive/706n-ai-and-agents.md) - the prior, lighter pass on Kite + Avax AI/agents
- [Doc 706r](../706-avalanche-ecosystem-deep-dive/706r-regional-ecosystems.md) - first noted "WaveWarZ Solana-native" (now verified correct)
- [Doc 707](../707-avalanche-master-brief/) - the Avalanche master brief; the "tool not a home" frame
- [Doc 695](../../governance/695-crypto-factor-avax-governance-decision/) + [Doc 719](../../governance/719-crypto-factor-proposal-review/) - the Crypto Factor track (different question, but related to "things on Avax that aren't worth doing")

## Sources

DISPATCH hub. Four DEEP-tier sub-docs, each with its own full Sources section and per-source FULL/PARTIAL/FAILED marks. Across the four agents, roughly 70+ external sources were consulted - Coinbase CDP docs, the x402 GitHub, Agenstry x402 indexer, Avalanche Builder Hub, Kite AI docs, Aethir docs, DexScreener / DeFiLlama, the LayerZero / Axelar / Celer docs, the KelpDAO post-mortem, Polymarket / Virtuals / Orca docs, and the wavewarz.com site itself. Headline counts:

- 723a - x402 ecosystem: 28 sources (21 FULL, 7 PARTIAL, 0 FAILED), on-chain data through 19 May 2026
- 723b - Avalanche agentic commerce: 10+ sources, classified FULL/PARTIAL/FAILED; Kite-mainnet metrics agent-reported
- 723c - bridging: 10+ sources, classified FULL; bridge cost numbers and the KelpDAO incident are real but should be re-verified before citation
- 723d - agentic battle games + WaveWarZ chain: 16 sources + 3 community sources; **WaveWarZ-on-Solana directly verified** at wavewarz.com

Two notes on agent-reported facts that should be verified before they drive a commitment: (1) Kite AI's specific finality and fee numbers (`<1s`, `$0.000001`/tx) and its PayPal/Shopify integrations are credible but two months old; verify uptime and real traffic before pilot. (2) The "Avalanche x402 = zero settlement" finding is from one indexer dated 19 May 2026; re-check in 2-3 months because this is the figure that, if it changes, changes the recommendation.
