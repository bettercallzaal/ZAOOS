# 258 — ZABAL + SANG Research + FISHBOWLZ Buyback

**Date:** 2026-04-04
**Status:** Researching — waiting on ZOEY deep research

---

## Token Data (On-Chain)

### ZABAL
| Field | Value |
|-------|-------|
| Contract | `0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07` (Base) |
| Total Supply | 100,000,000,000 (100B) |
| Decimals | 18 |
| Price (DexScreener) | $0.0000001429 |
| Liquidity | $552.05 (Uniswap V4 pair) |
| 24h Volume | $0.23 |
| FDV | $14,257 |
| Market Cap | $14,257 |
| Pair | ZABAL/ETH on Uniswap V4 |

**Key insight:** ZABAL is extremely early. $14K FDV with $552 liquidity. 20% of supply at current price = ~$2.86. At $0.001/ZABAL = $20M.

### SANG — Songjam by Virtuals
| Field | Value |
|-------|-------|
| Contract | `0x4ff4d349caa028bd069bbe85fa05253f96176741` (Base) |
| Name | Songjam by Virtuals |
| Symbol | SANG |
| Total Supply | 1,000,000,000 (1B) |
| Circulating | 825,470,000 (82.5%) |
| Price (CoinGecko) | $0.00001458 |
| 24h Volume | $17.29 |
| FDV | $14,581 |
| Market Cap | $12,036 |
| Rank | #9424 |
| Pair | SANG/VIRTUAL on Uniswap V2 |

**What is SANG:** Powers the Songjam voice verification network. "Cryptographic voice verification for AI era." Used for AI DJ, agentic CRM, InfoFi oracle on X Spaces. From Virtuals Protocol ecosystem.

---

## FISHBOWLZ Token Buyback Mechanism

### How it works
```
User pays FISHBOWLZ fee (ETH or USDC)
  → FISHBOWLZ contract collects fee
  → WALLET agent (EOA) receives proceeds
  → WALLET swaps ETH/USDC → SANG via 1inch API
  → SANG bought on Uniswap V2 (Base)
  → SANG accumulates in FISHBOWLZ treasury
```

### Buyback Math
| Daily Spend | SANG Bought | % of MCap/day |
|-------------|-------------|----------------|
| $1 | 68,587 | 0.057% |
| $10 | 685,871 | 0.57% |
| $100 | 6,858,710 | 5.7% |
| $1,000 | 68,587,105 | 57% ← too aggressive |

**Recommendation:** Start with $5-10/day. SANG market cap is only $12K — even $100/day would be a significant buyer and would move price.

### Risks
1. **Thin order book** — $17/day volume means even small buys move price significantly
2. **Slippage** — WALLET must set 1-2% slippage on 1inch
3. **SANG liquidity** — pair is on Uniswap V2, less efficient than V4
4. **No guaranteed execution** — if SANG volume stays thin, buyback fills could fail

---

## Empire Builder Integration

- 10% of ZABAL allocated to Empire Builder
- ZOEY to research: what is Empire Builder? How does ZAO interact with it?
- Burning half of Empire Builder ZABAL = reduce supply, bullish for price

---

## Clanker Integration

- FISHBOWLZ token can be launched via Clanker (tag @clanker with token name/symbol)
- Clanker auto-deploys ERC-20 on Base with initial liquidity
- ZAO could create $FISH token for FISHBOWLZ via Clanker
- Use: tip speakers, pay for premium fishbowl access, governance

---

## Open Questions
- [ ] Where is the ZAO treasury address that holds 20% ZABAL?
- [ ] What is Empire Builder contract/platform?
- [ ] How does 10% Empire Builder allocation work exactly?
- [ ] What is the Clanker fee? (usually 0.1-0.5 ETH or % of supply)
- [ ] Is there a VIRTUAL/SANG pair? What's the best route SANG on Base?
- [ ] WALLET private key — who holds it?
