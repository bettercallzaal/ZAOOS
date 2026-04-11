# 344 -- Bankr Bot: AI Trading Agent + Skills Marketplace for ZABAL Swarm

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Map Bankr Bot's architecture, skills marketplace, and how VAULT/BANKER/DEALER can use Bankr skills for trading, payments, and Farcaster integration

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use Bankr skills for trading** | USE `bankr` skill for token launches + wallet management, `symbiosis` for cross-chain swaps, `zerion` for portfolio data. Install into OpenClaw or use directly via Bankr API |
| **Use Bankr for Farcaster posting** | USE `neynar` Bankr skill -- full Farcaster API: post casts, like, recast, follow, search. Already built and tested at scale |
| **Use Bankr for x402 payments** | USE `moltycash` skill -- USDC payments from agents to humans on Base via x402. Perfect for VAULT paying promoters |
| **Use Bankr for identity** | USE `erc-8004` Bankr skill -- registers agents on ERC-8004 directly. Already built |
| **Use Bankr for staking** | USE `stakr` skill -- ERC-4626 tokenized vaults. Could be used for ZABAL staking (conviction governance) |
| **Bankr vs our custom code** | USE Bankr skills alongside our custom agents. Bankr handles the DeFi primitives (swaps, bridges, payments), our code handles the ZABAL-specific logic (schedules, burns, content commerce). Not either/or -- both |
| **BNKR token integration** | SKIP buying BNKR for now. Focus on using Bankr's free skills. Revisit if we want Bankr Club premium features |

## What Bankr Is

An AI crypto assistant on Farcaster + X. Users say "@bankr buy $100 ETH" and it executes. Built on:
- **Privy** for wallets (same as us!)
- **CoWSwap** for order routing
- **Coinbase Wallet** for Base integration
- **x402** for agent-to-agent payments
- **Zerion** for portfolio data
- Backed by **Coinbase Ventures Base Ecosystem Fund**

## Bankr Skills We Should Install

| Skill | What It Gives VAULT/BANKER/DEALER | Install |
|-------|----------------------------------|---------|
| `bankr` | Wallet management, token launch, hallucination guards | `install bankr from github.com/BankrBot/skills/bankr` |
| `symbiosis` | Cross-chain swaps across 54+ chains including Base | `install symbiosis skill` |
| `zerion` | Portfolio balances, DeFi positions, PnL across 41+ chains | `install zerion skill` |
| `neynar` | Full Farcaster API (post, like, follow, search) | `install neynar skill` |
| `moltycash` | USDC payments to humans via x402 on Base | `install moltycash skill` |
| `erc-8004` | On-chain agent identity registration | `install erc-8004 skill` |
| `stakr` | ERC-4626 tokenized vaults for staking | `install stakr skill` |
| `quicknode` | RPC access for Base with x402 pay-per-request | `install quicknode skill` |

## How Bankr Complements Our Architecture

```
Our code (custom):                 Bankr skills (plug-and-play):
- VAULT/BANKER/DEALER schedules    - Swap execution (symbiosis/CoWSwap)
- 0x quote routing                 - Portfolio tracking (zerion)
- Auto-burn logic                  - Farcaster posting (neynar)
- Supabase event logging           - x402 payments (moltycash)
- Admin dashboard                  - ERC-8004 identity (erc-8004)
- Community governance             - Cross-chain bridges (symbiosis)
```

## Sources

- [Bankr Bot](https://bankr.bot/)
- [Bankr Skills GitHub](https://github.com/BankrBot/skills)
- [Build AI Agent with Bankr + Zerion](https://zerion.io/blog/build-best-ai-crypto-agent/)
- [Bankr on IQ.wiki](https://iq.wiki/wiki/bankr)
- [BNKR on MEXC](https://www.mexc.co/en-IN/learn/article/what-is-bankr-bnkr-the-ai-powered-crypto-banker-using-x402-payments/1)
