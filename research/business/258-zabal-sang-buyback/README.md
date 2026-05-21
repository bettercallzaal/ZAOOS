---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: []
original-query: "How can ZABAL and SANG tokens execute a sustainable buyback mechanism, and what does integration look like for FISHBOWLZ? (reconstructed)"
tier: STANDARD
---

# 258 — ZABAL + SANG Token Economics & Buyback Strategy

> **Goal:** Evaluate token buyback mechanics for ZABAL treasury, SANG integration, and on-chain incentive structures for community engagement.

## Key Decisions (DO THIS)

| # | Decision | Why |
|----|----------|-----|
| 1 | Execute buyback via 1inch aggregator on Base, NOT direct Uniswap | Lower slippage (1-2%), better liquidity routing across Base DEXs |
| 2 | Start with $10-50/week buyback minimum, NOT daily | Avoids moving thin order book; compound growth over 52 weeks |
| 3 | Burn 1% of ZABAL post-swap (optional) | Signals long-term commitment to holders; reduces supply inflation |
| 4 | Store SANG accumulation in treasury multisig, NOT agent wallet | Clearer audit trail; prevents single-point-of-failure on agent key compromise |

## Findings

### Token Data (On-Chain, May 2026)

### ZABAL Token (Base L2)

| Metric | Value | Note |
|--------|-------|------|
| Contract Address | `0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07` | Base mainnet |
| Total Supply | 100,000,000,000 (100B) | 18 decimals |
| Market Cap | ~$14,300 USD | Extremely early stage |
| Liquidity | ~$550-1,200 USDC | Thin order book on Uniswap V4 |
| 24h Volume | $0.23-2 | Low daily trading activity |
| Primary Pair | ZABAL/ETH | Uniswap V4 on Base |

**Strategic insight:** At $0.00000142 per token, ZAO treasury can accumulate meaningful ZABAL with minimal capital deployment. $100/week buyback = 70M tokens/week. Key risk: thin liquidity means slippage on buys above $50 per transaction.

### SANG Token (Songjam by Virtuals)

| Metric | Value | Note |
|--------|-------|------|
| Contract Address | `0x4ff4d349caa028bd069bbe85fa05253f96176741` | Base network |
| Token Name | Songjam by Virtuals | Voice verification network |
| Symbol | SANG | Ticker symbol |
| Total Supply | 1,000,000,000 (1B) | 18 decimals |
| Circulating Supply | 830M+ | ~83% circulating |
| Market Cap | ~$12,800 | As of May 2026 |
| Price | ~$0.0000155 USDC | Per CoinGecko |
| 24h Volume | $4-18 USDC | Extremely thin |
| Primary Pair | SANG/VIRTUAL | Uniswap V2 on Base |

**Purpose:** SANG powers Songjam voice node infrastructure. Cryptographic voice verification using zero-knowledge proofs to authenticate voiceprints and prevent deepfake cloning. Used in agentic workflows, voice authentication, and Virtuals Protocol ecosystem. Both ZABAL and SANG are community-aligned tokens with minimal venture capital involvement.

---

## Buyback Mechanics & Economics

### ZABAL Buyback Flow (Recommended)

```
STEP 1: ZAO treasury collects USDC/ETH from ecosystem activities
STEP 2: Cron job triggers on weekly/bi-weekly cadence (not daily)
STEP 3: Treasury executes swap USDC → ZABAL via 1inch API
STEP 4: 1inch aggregator routes through best Base DEX
STEP 5: ZABAL sent to treasury multisig (cold storage)
STEP 6: Optional: burn 1% of acquired ZABAL (announcement to holders)
STEP 7: Log event in Supabase for transparency dashboard
```

### Buyback Economics: Weekly $50 Scenario

| Budget | Tokens Acquired | % of Circulating Supply | Slippage Risk | Feasibility |
|--------|-----------------|------------------------|---------------|-------------|
| $50/week | ~35M ZABAL | 0.0035% | Very low (1-2%) | HIGH - recommended |
| $100/week | ~70M ZABAL | 0.007% | Low (2-3%) | HIGH - sustainable |
| $250/week | ~175M ZABAL | 0.0175% | Moderate (3-5%) | MEDIUM - watch slippage |
| $500/week | ~350M ZABAL | 0.035% | High (5-7%) | LOW - avoid |

**Note:** At $12.8K SANG market cap and $550 liquidity, SANG buybacks face severe execution risk. Recommend shelving SANG accumulation until Songjam has deeper Base liquidity.

### Execution Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Thin order book** | $50+ buy can move price 3-5% | Use 1inch for routing; set 2% max slippage |
| **MEV sandwich attack** | Bots extract value between swap intent and execution | Use private mempool option if available (MEV blocker) |
| **Treasury key compromise** | All accumulated ZABAL stolen | Use multisig (2-of-3) on treasury address; cold storage after swaps |
| **Swap failure mid-execution** | USDC stuck in failed swap; no ZABAL received | Wrap swap in try/catch; log failures for manual intervention |
| **Liquidity evaporation** | ZABAL liquidity disappears; swap reverts | Monitor weekly LPs on DEXScreener; maintain $2K emergency swap pool |

## ZAO Application

For ZAO community:
1. **Treasury accumulation:** Allocate $50-100/week to ZABAL buyback starting in Q3 2026
2. **Transparency:** Monthly publication of treasury ZABAL holdings on Paragraph + snapshot to Farcaster
3. **Burning signal:** On each $500 accumulated, burn 1% to show long-term commitment (announce in Spaces)
4. **Price floor support:** Buybacks create micro-demand that dampens dump risk from small whales
5. **Holder alignment:** Members see treasury backing ZABAL through bear periods (psychological moat)

## Sources

- [DexScreener - Base Network Token Discovery](https://dexscreener.com/base) [PARTIAL - token metadata but no live API public endpoint]
- [Songjam by Virtuals on CoinGecko](https://www.coingecko.com/en/coins/songjam-by-virtuals) [FULL - pricing, supply, volume]
- [Coinbase x402 Protocol Documentation](https://docs.cdp.coinbase.com/x402/welcome) [FULL - payment routing for USDC swaps]
- [1inch Protocol Aggregation API](https://docs.1inch.io/) [FULL - swap execution, slippage optimization]
- [Uniswap V4 on Base](https://app.uniswap.org/explore/tokens/base/0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07) [PARTIAL - liquidity snapshot, volume]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm ZAO treasury multisig address | Zaal | Decision | 2026-05-22 |
| Test 1inch swap on Base testnet: $50 USDC → ZABAL | Engineering | Build | 2026-05-25 |
| Draft Supabase table: `zabal_buyback_events` with tx hash, amount, slippage | Engineering | Schema | 2026-05-25 |
| Launch weekly buyback cron job (low priority backlog) | Engineering | Deploy | 2026-06-15 |
| Announce to community: "Treasury now auto-buying ZABAL" | Zaal | Social | After cron deployed |
