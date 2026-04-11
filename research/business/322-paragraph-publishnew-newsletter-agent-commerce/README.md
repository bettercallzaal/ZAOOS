# 322 — Paragraph + Publish.new: Newsletter Platform, Agent Commerce & COC Concertz Integration

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Map Paragraph's full platform (newsletters, publish.new marketplace, coins, API/SDK/MCP, distribution) and design how COC Concertz promoters can use it with ZABAL token for monetized content creation and agent commerce

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Newsletter platform** | USE Paragraph — ZAO already publishes at `paragraph.com/@thezao`. Paragraph has full API, SDK (`paragraph-sdk-js`), CLI, and MCP server (18 tools). COC Concertz promoters publish newsletters through Paragraph, not a custom system |
| **Content monetization** | USE publish.new for selling digital goods (show recaps, artist packs, promo kits). Zero setup, Privy embedded wallet auto-created on email signup. Accepts credit card + USDC on Base/Ethereum/Tempo |
| **Agent commerce** | USE x402 protocol (zero fees) for agent-to-agent transactions. Publish.new has an "Agent" tab with copy-paste instructions for AI agents to buy content. ZOE can both sell ZAO research and buy community data |
| **Promoter payments** | USE ZABAL token ($0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07 on Base) as the ecosystem reward currency. Promoters earn ZABAL for creating content, can trade on Uniswap via Privy embedded wallets |
| **Post coins** | USE Paragraph post coins (Base/Doppler protocol, 1B supply per post, 0.475% creator fee per trade). Each COC Concertz show recap or newsletter can have its own coin — fans support by buying |
| **Writer coins** | USE writer coins for promoters who build audiences. 50% supply vests over 3 years, 2% of every transaction goes to creator |
| **MCP integration** | USE Paragraph MCP server (`mcp.paragraph.com`) — 18 tools for posts, publications, subscribers, coins, search, feed. Claude Code can publish directly. Install: `claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp` |
| **Distribution** | Paragraph handles email + XMTP wallet delivery + Farcaster Mini App notifications. COC Concertz newsletter builder generates content, pushes to Paragraph via API, Paragraph handles distribution |
| **x402 vs MPP** | USE x402 for one-shot purchases (publish.new content, API calls). WATCH MPP (Tempo) for streaming/batched payments (live show tipping, continuous subscriptions). MPP is newer, centralized (4 nodes) |

---

## Comparison: Newsletter + Content Monetization Platforms

| Platform | Web3 Native | Agent Sales | API/SDK | Coins | Email + Wallet | Pricing | ZAO Fit |
|----------|-------------|-------------|---------|-------|----------------|---------|---------|
| **Paragraph** | YES (Arweave, Base, XMTP) | YES (publish.new + x402) | Full API + SDK + CLI + MCP (18 tools) | Post coins + Writer coins (Base/Doppler) | Email + XMTP + Farcaster Mini App | Free (coins have 0.475% creator fee) | **BEST** — already in use |
| **Beehiiv** | No | No | REST API + webhooks | No | Email only | Free to $99/mo | Good API but no web3 |
| **Substack** | No | No | No public API | No | Email only | 10% of paid subs | No web3, no API |
| **Mirror** | YES (merged into Paragraph Jan 2025) | No | Deprecated | Writing NFTs (deprecated) | No email | Free | Dead — migrated to Paragraph |
| **Custom (self-built)** | Possible | Possible | Full control | Custom | Custom | Dev time | Too much work for 13 promoters |

---

## Paragraph Platform Architecture

### Core Features (2026)

| Feature | Details |
|---------|---------|
| **Publishing** | Rich editor, sections, custom domains, SEO, themes |
| **Newsletter delivery** | Email (from `slug@newsletter.paragraph.xyz`) + XMTP wallet delivery |
| **Farcaster Mini App** | Push notifications to Farcaster subscribers on new posts |
| **Post coins** | ERC-20 on Base (Doppler protocol). 1B supply/post. Creator gets 10% vested over 1 year + 0.475% per trade |
| **Writer coins** | 1B supply. Creator gets 50% vested over 3 years + 2% per trade. Readers earn rewards for subscribing, following on Farcaster, collecting posts |
| **Arweave storage** | All posts permanently stored on Arweave (decentralized, censorship-resistant) |
| **Subscriber management** | Add, import CSV, list subscribers via API |
| **Analytics** | Post views, subscriber growth, coin performance |
| **Automated emails** | Welcome sequences, re-engagement |
| **Team management** | Multiple team members per publication |
| **Multiple publications** | One account, many publications (e.g., one for COC Concertz, one for ZAO) |

### API & Developer Tools

| Tool | Details |
|------|---------|
| **REST API** | Full CRUD for posts, publications, subscribers, coins, users. Auth via API key from publication settings. Alpha status, breaking changes possible |
| **TypeScript SDK** | `paragraph-sdk-js` (GitHub: paragraph-xyz/paragraph-sdk-js) |
| **CLI** | `npx @paragraph-com/cli` — publish from terminal |
| **MCP Server** | 18 tools. Remote: `mcp.paragraph.com/mcp`. Local: `npx @paragraph-com/mcp`. Auth via browser or `PARAGRAPH_API_KEY` env var |
| **OpenAPI spec** | Available for code generation |
| **Onchain events** | Listen to coin transactions, post publications on-chain |
| **Arweave reads** | Read published posts directly from Arweave |

### MCP Server Tools (18 total)

| Toolset | Operations |
|---------|-----------|
| **Posts** | Create, retrieve, update, delete, send test email |
| **Publications** | Fetch publication data |
| **Subscribers** | List, count, add new |
| **Users** | Get user info |
| **Coins** | Get coin details, holder lists |
| **Search** | Query posts, blogs, coins |
| **Feed** | Retrieve feed content |
| **Me** | Authenticated user data |

---

## Publish.new — Agent-Native Digital Marketplace

| Feature | Details |
|---------|---------|
| **URL** | `publish.new/sell` to list, `publish.new` to browse |
| **Setup** | Zero — no account needed. Sign in with EVM wallet or email (auto-creates Privy embedded wallet) |
| **File limit** | Up to 100MB per upload |
| **Pricing** | Creator sets price. Microtransactions supported ($0.10+) |
| **Payment methods** | Credit card (humans) + USDC on Base/Ethereum/Tempo (humans + agents) |
| **Agent purchases** | "Agent" tab on each listing with copy-paste instructions for AI to buy via x402 |
| **Fees** | Lower than Gumroad (10% + $0.50). Exact Paragraph fee undisclosed but minimal |
| **Payout** | Direct to creator's wallet address |
| **Content types** | Any digital file: PDFs, datasets, ebooks, prompts, apps, archives, music packs |

### What COC Concertz Promoters Can Sell

| Product | Price | Buyers | Source |
|---------|-------|--------|--------|
| **Show recap packs** (photos + setlists + highlights) | $1-3 | Fans, collectors | Generated from `src/app/admin/` recap tool |
| **Artist promo kits** (bio + photos + social handles) | $0.50-2 | Other promoters, press | From `src/components/portal/` artist data |
| **Newsletter archives** | $2-5 bundle | Researchers, AI agents | From Paragraph publication |
| **Concert flyers** (high-res) | $0.10-1 | Designers, community members | From Cloudinary uploads |
| **Community data digest** | $1/issue | Discovery agents, music AI | From Firestore event/artist data |

---

## x402 Protocol — Technical Details

| Aspect | Details |
|--------|---------|
| **Standard** | HTTP 402 (Payment Required) — open HTML standard, revived by Coinbase |
| **Version** | v2 (Dec 2025) — added reusable sessions, multi-chain, wallet identity, modular SDK |
| **Protocol fees** | **Zero** — only pay network gas fees |
| **Supported chains** | Base, Ethereum, Stellar, SKALE, Solana (expanding) |
| **Currencies** | USDC, DAI (primary). Custom tokens possible |
| **How it works** | 1) Agent sends HTTP GET → 2) Server returns 402 + payment details → 3) Agent's wallet pays USDC → 4) Server verifies → 5) Content delivered |
| **No accounts** | No API keys, no OAuth, no registration. Just HTTP + crypto |
| **SDK** | `x402-fetch` (v1.1.0) — drop-in replacement for `fetch()` |
| **Agent integrations** | Claude Code MCP, ChatGPT GPTs, LangChain, Telegram Bot, Auto-GPT, n8n, SDK, CLI, Bazaar Discovery (9 total) |
| **Galaxy estimate** | Agentic commerce = $3-5 trillion B2C revenue by 2030 |

### MPP (Machine Payment Protocol) — Tempo

| Aspect | Details |
|--------|---------|
| **Use case** | Streaming/batched payments (1 signature for many transactions) |
| **Operator** | Tempo (4 centralized nodes) |
| **Best for** | Live show tipping, continuous subscriptions, batched API calls |
| **vs x402** | x402 = one-shot transactions. MPP = session-based continuous payments |
| **Status** | Newer, less mature than x402. Paragraph accepts MPP payments alongside USDC |

---

## ZABAL Token Integration for COC Concertz Promoters

| Aspect | Details |
|--------|---------|
| **Contract** | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` on Base (launched via Clanker, Jan 1 2026) |
| **Purpose** | Liquid reward token for ecosystem contributors — media, promotion, community incentives |
| **NOT governance** | ZABAL is tradeable but has no governance power (that's Respect tokens) |
| **Promoter flow** | 1) Promoter creates content via newsletter builder → 2) Earns ZABAL reward → 3) Can trade ZABAL on Uniswap via Privy embedded wallet → 4) Or hold for ecosystem value |
| **Buy/sell** | Uniswap V4 on Base. Privy embedded wallet signs swaps via `getEthereumProvider()` → viem WalletClient. Permit2 approval required for ERC-20 inputs (per doc 283) |

### Promoter Incentive Model

```
Promoter creates content (newsletter, show announcement, recap)
    ↓
Content published to Paragraph + distributed to socials
    ↓
Post coin launched (fans can buy to support)
    ↓
Promoter earns: post coin fees (0.475%) + ZABAL reward
    ↓
ZABAL tradeable on Uniswap (Base) or usable in ZAO ecosystem
```

---

## ZAO Ecosystem Integration

### COC Concertz — Current State

| What Exists | File | Status |
|-------------|------|--------|
| Email subscriber collection | `src/components/home/EmailSignup.tsx` | Built — saves to Firestore `subscribers` collection |
| Subscriber CSV export | Admin dashboard | Built |
| Artist social links | `src/components/portal/` profile forms | Built — X, Farcaster, YouTube, etc. |
| Show recap generator | Admin dashboard | Built — auto-counts visitors, chat, artists |
| Farcaster share | `src/components/home/ShareSection.tsx` | Built — cast + X intent + clipboard |
| Brand config | `concertz.config.ts` | Built — centralized branding |

### What to Build (Newsletter Builder)

| Feature | Integration Point | How |
|---------|------------------|-----|
| **Content templates** | New: `/admin/newsletter/` page | Show announcement, artist spotlight, recap, custom freeform |
| **AI content generation** | New: `/api/newsletter/generate` | Claude API with brand-aware prompts per project context |
| **@mention resolver** | New: `/api/social/resolve` | Pull artist social handles from Firestore `artists` collection → format per platform |
| **Paragraph publishing** | New: `src/lib/paragraph.ts` | Use Paragraph SDK or MCP to create post + send newsletter |
| **Social post generation** | New: `/api/newsletter/socials` | Transform newsletter into platform-specific posts (X, Farcaster, Bluesky, Telegram, Discord) |
| **Publish.new listing** | Future: `src/lib/publishnew.ts` | Auto-list show recap packs for sale |
| **ZABAL rewards** | Future: smart contract interaction | Reward promoters with ZABAL on content creation |

### Paragraph MCP for COC Concertz

Add to COC Concertz `.claude/settings.json`:
```json
{
  "mcpServers": {
    "paragraph": {
      "command": "npx",
      "args": ["@paragraph-com/mcp"],
      "env": {
        "PARAGRAPH_API_KEY": "your-key-here"
      }
    }
  }
}
```

Or remote:
```bash
claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp
```

---

## Cross-Reference with Existing Research

| Doc | Title | Relevance |
|-----|-------|-----------|
| **252** | Publish.new: AI-Native Marketplace | Foundational research on publish.new + x402. This doc EXTENDS 252 with Paragraph platform details, coins system, MCP, and COC Concertz-specific integration |
| **280** | FID Registration & x402 Deep Dive | x402 technical implementation details, why fid-forge failed, direct on-chain path |
| **316** | Agentic Bootcamp Week 2 | x402 vs MPP comparison, agent commerce patterns, Tempo session payments |
| **283** | Privy Embedded Wallets + Token Mechanics | ZABAL buy/sell via Uniswap, Privy wallet integration, fee splits |
| **065** | ZABAL Partner Ecosystem | MAGNETIQ, Empire Builder, Clanker — ZABAL token context |
| **096** | Cross-Post API Deep Dive | Platform-by-platform SDK comparison for social distribution |

---

## Sources

- [Paragraph Documentation Index](https://paragraph.com/docs/llms.txt) — complete docs listing (API, SDK, CLI, MCP, coins)
- [Paragraph API & SDK Overview](https://paragraph.com/docs/development/api-sdk-overview.md) — TypeScript SDK, REST API, authentication
- [Paragraph MCP Server](https://paragraph.com/docs/development/mcp.md) — 18 tools, remote + local setup
- [Paragraph Writer Coins](https://paragraph.com/docs/earn/writer-coins.md) — 50% vested supply, 2% trade fee to creator
- [Paragraph Post Coins](https://paragraph.com/docs/earn/post-coins.md) — Base/Doppler, 1B supply, 0.475% creator fee
- [x402.org](https://www.x402.org/) — Official x402 protocol spec, zero fees, multi-chain
- [Bankless: Paragraph's Publish Marketplace](https://www.bankless.com/read/paragraphs-publish-marketplace-human-agents) — publish.new features, Agent tab, Privy wallet
- [skylen.eth: publish.new article](https://paragraph.com/@skylen/publishnew-my-creative-work-is-now-being-bought-by-robots) — agent-as-customer paradigm, x402/MPP currencies
- [Stellar x402](https://stellar.org/blog/foundation-news/x402-on-stellar) — multi-chain expansion
- [Doc 252: Publish.new Research](../252-publish-new-agent-marketplace/) — prior ZAO OS research on publish.new
