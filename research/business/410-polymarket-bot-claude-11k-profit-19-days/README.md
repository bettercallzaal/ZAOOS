# 410 - Polymarket Trading Bot via Claude: $11,400 Profit in 19 Days

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Analyze Lunar's Polymarket bot architecture - 4 open-source repos + Claude API consensus voting strategy
> **Source:** [@lunarresearcher on X](https://x.com/lunarresearcher/status/2043690015675318360)
> **Updates:** Doc 244 (Polymarket trading as treasury revenue)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Is this viable for ZOUNZ treasury?** | YES - validates Doc 244's thesis. $11.4K from $20/mo Claude + $5 VPS. Low cost, high upside. |
| **Architecture** | USE multi-agent consensus (2+ agents must agree before trade). Reduces false positives. |
| **Key repos** | USE poly_data (historical analysis), polymarket-cli (market scanning), Polymarket/agents (LLM framework), Polymarket-Trading-Bot (execution) |
| **What to avoid** | SKIP sports markets (52% win rate). SKIP low-volume markets (slippage). EXIT at 73% max profit, don't hold to resolution. |
| **Cost** | $25/month total ($20 Claude API + $5 VPS). ROI: 456x in first 19 days. |

---

## Bot Architecture

```
poly_data (86M historical trades)
  → Identifies 47 high-performing wallets
  → Pattern analysis: "91% of exits before resolution at ~73% max profit"

polymarket-cli (market scanner)
  → Scans 500+ markets
  → Finds mispriced opportunities

Polymarket/agents (LLM framework)
  → 4 independent Claude agents
  → Each analyzes from different angle

Polymarket-Trading-Bot (execution)
  → Consensus voting: trade ONLY when 2+ agents agree
  → Automated execution
```

### The 4-Agent Consensus System

Each agent independently evaluates a trade opportunity. Trade executes ONLY when 2+ agents agree. This is the key innovation - single-agent systems have lower win rates.

---

## Performance Numbers

| Metric | Value |
|--------|-------|
| **Profit** | $11,400 in 19 days |
| **Trades** | 214 total |
| **Win rate** | 74% |
| **Sharpe ratio** | 2.31 |
| **Cost** | $20/mo Claude API + $5/mo VPS |
| **Uptime** | 24/7, minimal intervention |

---

## Critical Failure Modes

| What Failed | Win Rate | Lesson |
|-------------|----------|--------|
| **Sports markets** | 52% (near coin flip) | Too unpredictable, too many variables |
| **Low-volume markets** | Poor (slippage) | Can't exit positions cleanly |
| **Holding to settlement** | -15-30% vs early exit | "91% of top wallets exit before resolution" |

### The 73% Rule

Analysis of 86M trades across 47 top wallets: exits happen at ~73% of max potential profit. The last 27% isn't worth the risk of reversal. This is the key alpha.

---

## Open-Source Repos

| Repo | Purpose | Stars |
|------|---------|-------|
| **poly_data** | Historical trade analysis (86M trades) | Community tool |
| **polymarket-cli** | Market scanning, opportunity detection | CLI tool |
| **Polymarket/agents** | LLM integration framework | Official |
| **Polymarket-Trading-Bot** | Execution strategies | Community |

---

## ZAO OS / ZOUNZ Treasury Application

Doc 244 proposed Polymarket trading as ZOUNZ DAO treasury revenue. This post validates:

| Doc 244 Hypothesis | Validation |
|-------------------|------------|
| Claude can analyze prediction markets | YES - 74% win rate |
| Low-cost infrastructure works | YES - $25/month |
| Autonomous 24/7 operation | YES - minimal intervention |
| Meaningful returns possible | YES - $11.4K in 19 days |

### Implementation Path for ZOUNZ

1. Deploy on ZAO VPS (already have Hostinger KVM 2 at 31.97.148.88)
2. Fund with small ZOUNZ treasury allocation ($500-1K test)
3. Use 4-agent consensus architecture
4. Avoid sports markets, target political/crypto/tech markets
5. Auto-exit at 73% max profit threshold
6. Report earnings to DAO dashboard

### Risk Mitigation

- Start with paper trading (Polymarket sandbox)
- $500 max initial allocation
- Hard stop-loss at -20% of allocated capital
- Only markets with $50K+ volume
- DAO vote required to increase allocation

---

## Sources

- [@lunarresearcher - Polymarket Bot $11.4K](https://x.com/lunarresearcher/status/2043690015675318360)
- [Doc 244 - Polymarket Trading as Treasury Revenue](../244-polymarket-claude-api-trading-analysis/)
- [Polymarket Agents - GitHub](https://github.com/Polymarket/agents)
