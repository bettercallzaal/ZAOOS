# 252 — Publish.new: Paragraph's AI-Native Marketplace for Digital Goods

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Evaluate publish.new as a monetization channel for ZAO OS community — sell music, research, LoRAs, datasets, agent skills to humans AND AI agents

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use publish.new** | USE immediately — zero setup, no account needed, upload file + set price + share link. ZAO can list: research docs, custom ACE-Step LoRAs, curated playlists, music production guides, fractal meeting recordings |
| **x402 agent payments** | This is the killer feature — AI agents can autonomously buy ZAO's digital goods using USDC via the x402 protocol (HTTP 402 status code). Same URL works for humans (credit card) AND agents (x402/USDC). No intermediary takes 30-50% |
| **ZOE as seller** | DEPLOY ZOE as a publish.new seller — ZOE generates research, analysis, and community digests. These can be auto-listed on publish.new and sold to other agents who need music community data |
| **ZOE as buyer** | ZOE can use x402 to buy datasets, research, and tools from other agents on publish.new — expanding ZAO's knowledge base autonomously |
| **Article opportunity** | WRITE a Paragraph article about ZAO's journey into agent commerce — first music DAO selling to AI agents. Build-in-public content opportunity |
| **Paragraph connection** | ZAO already publishes on Paragraph (`paragraph.com/@thezao`). Publish.new is Paragraph's new product — natural extension of existing relationship |

## Comparison: Digital Goods Marketplaces

| Platform | Agent Support | Payment | Fees | Setup | Best For |
|----------|--------------|---------|------|-------|----------|
| **publish.new** | Native (x402) | Credit card + USDC | Undisclosed (low) | Zero — no account needed | Digital goods for humans AND agents |
| **Gumroad** | None | Credit card + PayPal | 10% | Account required | Ebooks, courses, templates |
| **Zora** | None (on-chain only) | ETH/crypto | ~$1.05/release | Wallet required | NFTs, collectibles |
| **BazAR (Arweave)** | None | AR token | Protocol fees | Arweave wallet | Permanent storage, atomic assets |
| **x402 Bazaar** | Native (x402) | USDC | Per-request | API registration | APIs and data feeds |

**Publish.new wins for ZAO** because it's the only marketplace where both humans AND agents can buy, with zero setup, and it's built by Paragraph (where ZAO already publishes).

## What ZAO Can Sell on Publish.new

| Product | Price | Who Buys | Source in ZAO OS |
|---------|-------|----------|-----------------|
| **ZAO Research Library** (250+ docs) | $2-5 per doc or $25 bundle | Agents building music apps, researchers | `research/` folder |
| **Custom ACE-Step LoRAs** | $5-15 each | Music producers, AI agents | Trained from `src/app/api/music/generate/` pipeline |
| **Community Music Dataset** | $10 | ML researchers, music AI companies | From `src/app/api/music/submissions/route.ts` |
| **Fractal Governance Playbook** | $5 | DAOs, community builders | From fractal docs + `src/app/api/fractals/` |
| **Weekly Music Digest** | $1 per issue | Music discovery agents | From `src/app/api/music/digest/route.ts` |
| **ZAO OS Starter Kit** | $15 | Developers forking for their community | `community.config.ts` + setup guide |
| **Agent Skills** | $3-10 | Other OpenClaw/Claude Code users | `.claude/skills/` |

## x402 Protocol — How It Works

1. Agent requests a resource (GET `publish.new/item/xyz`)
2. Server responds with HTTP 402 (Payment Required) + payment details (USDC amount, wallet address)
3. Agent's smart wallet sends USDC payment on Base
4. Server verifies payment, delivers content
5. No API keys, no accounts, no OAuth — just HTTP + crypto

**Integrations available:** Claude Code MCP, ChatGPT GPTs, LangChain, Telegram Bot, Auto-GPT, n8n, SDK, CLI, Bazaar Discovery. 9 total.

## ZAO OS Integration

### Already Connected

- ZAO publishes on **Paragraph** (`paragraph.com/@thezao`) — referenced in `src/lib/publish/` cross-posting pipeline
- ZAO has an **auto-cast system** at `src/lib/publish/auto-cast.ts` that posts from `@thezao` official account
- The cross-platform publishing pipeline (`src/lib/publish/`) already handles Farcaster, X, Bluesky, Threads, Discord, Telegram

### New Integration Points

| Feature | File | What It Does |
|---------|------|-------------|
| **Publish to publish.new** | New: `src/lib/publish/publishnew.ts` | Auto-list community research docs and music datasets |
| **ZOE seller skill** | VPS: `/skills/publish-new/` | ZOE auto-lists generated content for sale |
| **Ecosystem link** | Update: `community.config.ts` | Add publish.new to ecosystem partners |
| **x402 payment for API routes** | Future: `src/middleware.ts` | Gate premium ZAO OS API endpoints behind x402 payments |

## Sources

- [publish.new](https://publish.new) — Paragraph's AI-native digital marketplace
- [Paragraph Blog: Your Work, Paid for by Agents](https://paragraph.com/@blog/your-work-paid-for-by-agents) — April 2, 2026 announcement
- [x402 Protocol Guide](https://calmops.com/web3/x402-protocol-programmable-payments-ai-agents-2026/) — Complete x402 technical deep dive
- [x402 on Stellar](https://stellar.org/blog/foundation-news/x402-on-stellar) — Multi-chain x402 support
- [Coinbase x402](https://www.digitalapplied.com/blog/x402-payment-protocol-ai-agents-pay-coinbase-cloudflare) — How agents pay online
- [x402 Bazaar on SKALE](https://blog.skale.space/blog/x402-bazaar-launches-on-skale-on-base-enabling-autonomous-ai-agent-payments-for-apis) — Agent marketplace infrastructure
