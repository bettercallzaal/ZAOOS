# 128 — Free API Keys & Alchemy Enhancements for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Identify free APIs that add value to existing ZAO OS features

## Key Decisions / Recommendations

| Priority | API | Free Tier | Feature | Effort |
|----------|-----|-----------|---------|--------|
| **1** | **Alchemy NFT API** | 30M CU/month (already have key) | Replace fragile Sound.xyz + Zora direct queries with single reliable `getNFTsForOwner` | Low |
| **2** | **Zerion** | 3K calls/day | Rich member portfolio views (tokens, NFTs, DeFi positions) | Low |
| **3** | **The Graph** | 100K queries/month | Full historical respect/proposal analytics via OREC subgraph | Medium-high |
| Skip | Etherscan | Optimism removed from free tier Nov 2025 | N/A — $49/mo minimum for Optimism | N/A |
| Skip | CoinGecko | 10K calls/month | ZAO tokens not listed on exchanges | N/A |
| Skip | SimpleHash | Shut down Mar 2025 (acquired by Phantom) | Dead | N/A |
| Skip | Reservoir | Rate-limited | Overkill for display-only NFT needs | N/A |

## What We Already Have (On-Chain)

| Feature | Current Approach | API Used |
|---------|-----------------|----------|
| ENS resolution | `src/lib/ens/resolve.ts` via Alchemy RPC | `ALCHEMY_API_KEY` |
| Respect token balances | Direct multicall on Optimism | Public RPC `mainnet.optimism.io` |
| OREC proposal reads | Direct event log query | Public RPC `mainnet.optimism.io` |
| Music NFT discovery | Sound.xyz GraphQL + Zora discover API | No API key (direct) |
| On-chain sync | Admin-triggered multicall | Public RPC |

## Alchemy — What the Free Tier Includes (Already Have Key)

We're only using Alchemy for ENS. The same key unlocks:

| API | What It Does | ZAO OS Use Case |
|-----|-------------|-----------------|
| **NFT API** | `getNFTsForOwner`, metadata, collections | Replace fragile music NFT discovery. Show all audio NFTs across Ethereum/Optimism/Base/Zora in one call |
| **Token API** | Balances, metadata, transfers, prices | Better respect token display with transfer history |
| **Transfers API** | Historical transfers by address | Respect token transfer timeline (who sent, when) |
| **Webhooks** | Real-time on-chain event notifications | Auto-detect when respect tokens are minted (instead of manual sync) |

**Highest value:** Alchemy NFT API replaces `src/app/api/music/wallet/route.ts` with a single reliable call.

## Zerion API (New Key Needed)

- **Free:** 3,000 calls/day (~90K/month)
- **What it gives:** Unified portfolio across all EVM chains + Solana. Token balances, NFTs, DeFi positions, transaction history.
- **ZAO OS use:** "Member Portfolio" section on profiles showing full on-chain identity
- **Pricing jump:** $149/mo after free tier
- **Sign up:** [zerion.io/api](https://zerion.io/api)

## The Graph (Future — Medium Effort)

- **Free:** 100K queries/month on Subgraph Studio
- **What it gives:** Indexed historical data from any smart contract
- **ZAO OS use:** Deploy OREC subgraph → full historical proposal data, vote history, respect distribution timeline
- **Current limitation:** `fetchProposalsOnChain` only looks back ~7 days of blocks. A subgraph would give complete history.
- **Effort:** Requires writing AssemblyScript mappings for OREC events, deploying to Subgraph Studio

## ENV Variables Summary

| Variable | Service | Status | Used For |
|----------|---------|--------|----------|
| `ALCHEMY_API_KEY` | Alchemy | **Active** | ENS resolution, future: NFT API, Token API |
| `NEYNAR_API_KEY` | Neynar | Active | Farcaster data |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog | Active | Analytics |
| Future: `ZERION_API_KEY` | Zerion | Not yet | Portfolio data |
| Future: `GRAPH_API_KEY` | The Graph | Not yet | Subgraph queries |

## Sources

- [Alchemy Pricing](https://www.alchemy.com/pricing)
- [Alchemy NFT API](https://www.alchemy.com/docs/reference/nft-api-endpoints)
- [Zerion API](https://zerion.io/api)
- [The Graph Studio Pricing](https://thegraph.com/studio-pricing/)
- [Etherscan Free Tier Changes](https://info.etherscan.com/whats-changing-in-the-free-api-tier-coverage-and-why/)
- [CoinGecko API Pricing](https://www.coingecko.com/en/api/pricing)
