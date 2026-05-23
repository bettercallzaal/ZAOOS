---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-22
related-docs: 573, 706, 708
original-query: "keep studying on the arena i have a profile"
tier: DEEP
parent-doc: 708
---

# 708l - The Arena: Power-User Toolkit

> Goal: Map the ecosystem of tools, bots, SDKs, analytics, and integrations that power users and builders on The Arena—so Zaal can identify integration opportunities and understand what's already been built.

## Key Findings (read first)

| Category | Finding | Source Evidence |
|----------|---------|-----------------|
| **App Store State** | Alpha-stage SDK (v0.2.4 as of Jan 2026); wagmi v1/v2 connectors live; HTTPS + CORS required; 512x512px icon min | NPM @the-arena/arena-app-store-sdk, wagmi connector docs |
| **Agent Automation** | Arena Agent skill deployed (24/7 daemon, 3 posts/hour limit, 100 GET/min); CLI available via Termo; auto-reply + scheduled posts battle-tested | termo.ai, playbooks.com/openclaw/skills |
| **Holder Tracking** | Logiqical SDK: 78 Arena social tools, getShareHolders(), getHoldings(), getEarningsBreakdown() + 7 ticket trading tools; winner for agents | github.com/OlaCryto/arena-agent-plugin (176 total MCP tools) |
| **Cross-Platform Posting** | Crenel (Farcaster source + X/Bluesky/Mastodon auto-crosspost); zensocial (Telegram bot, multi-platform); no Arena-specific bridge yet found | crenel.xyz, github.com/wbnns/zensocial |
| **Analytics Layer** | Dune dashboards exist (couchdicks/stars-arena); no first-party Arena analytics dashboard; bonding curve data on-chain | dune.com/couchdicks/stars-arena |
| **Community Size & Engagement** | 200K+ users (as of 2025); $450M volume in 2 months post-May 2025 relaunch; 3.58K weekly tippers (up 105% YTD); 33% new wallets active | Gate News, The Block research |
| **Token Economics** | ARENA: 10B cap, 31% airdrop, 70% creator royalties on secondary ticket trades, 30% to foundation; quadratic bonding curve for tickets | The Block, CoinMarketCap, BULB |
| **SDK Maturity Rating** | Arena App Store: ALPHA (API may change); Logiqical: PRODUCTION (22 modules, REST API + MCP); Arena Agent skill: PRODUCTION | NPM registries, GitHub repos |

## Tool Inventory & Maturity Matrix

| Tool | Type | Status | Best For | Key Feature | Link |
|------|------|--------|----------|-------------|------|
| **Arena App Store SDK** | Developer SDK | Alpha | Mini-app developers | Wallet access + user profile isolation | [@the-arena/arena-app-store-sdk](https://registry.npmjs.org/%40the-arena%2Farena-app-store-sdk) |
| **Arena Wagmi v1 Connector** | Auth/Wallet | Alpha | wagmi v1.4.13+ dapps | Class-based connector, Avalanche C-Chain | [@the-arena/wagmi1-connector](https://registry.npmjs.org/%40the-arena%2Fwagmi1-connector) |
| **Arena Wagmi v2 Connector** | Auth/Wallet | Alpha | wagmi v2.16.4+ dapps | Function-based connector, modern wagmi | [@the-arena/wagmi2-connector](https://registry.npmjs.org/%40the-arena%2Fwagmi2-connector) |
| **Arena Agent Skill** | Bot Automation | Production | Discord/CLI agents | 24/7 monitoring, auto-reply (3 posts/hr), state persistence | [termo.ai/skills/arena-agent](https://termo.ai/skills/arena-agent) |
| **Logiqical MCP SDK** | Agent Toolkit | Production | AI agents on Avalanche | 176 MCP tools (78 social, 20 perps, 7 tickets, more) | [github.com/OlaCryto/arena-agent-plugin](https://github.com/OlaCryto/arena-agent-plugin) |
| **Dune Analytics Dashboard** | Analytics | Community | Portfolio tracking | Stars Arena volume, holder analysis, tx history | [dune.com/couchdicks/stars-arena](https://dune.com/couchdicks/stars-arena) |
| **Crenel Crosspost** | Distribution | Production | Multi-platform reach | Auto-crosspost FC to X/Bluesky/Mastodon + analytics | [crenel.xyz](https://www.crenel.xyz/) |
| **zensocial Bot** | Distribution | Production | Telegram power users | Cross-post to Bluesky/Farcaster/X from Telegram | [github.com/wbnns/zensocial](https://github.com/wbnns/zensocial) |
| **Arena Trade DEX** | Trading | Production | Meme token launches | Bonding curve to graduated DEX, 30-sec token deploy | [arena.trade](https://arena.trade/) |
| **Arena Stages** | Streaming | Production | Live engagement | Audio/video rooms, live tipping in AVAX/ARENA | arena.social (integrated) |
| **Arena Launch** | Token Platform | Production | Creator tokens | Bonding curve, auto-graduation, 2.5% staker airdrops | arena.social (integrated) |
| **Arena Tickets** | Social Trading | Production | Creator monetization | 70% royalties on secondary, gated content access | arena.social (integrated) |

## 1. Arena App Store + Mini-App Ecosystem

### What It Is
The Arena platform provides a developer SDK (alpha v0.2.4) to build mini-apps that run inside the Arena platform via iframe. Mini-apps can request wallet access, user profile data, and Avalanche transaction signing through Arena's managed provider.

### How to Build on It
1. Register app on Arena: name, description, target HTTPS URL, icon (512x512px min), feature list
2. Host app on your own infrastructure (HTTPS required)
3. Configure CORS: `Access-Control-Allow-Origin: https://arena.social`
4. Use the SDK to:
   - Call `getUserProfile()` to fetch logged-in user data
   - Request `eth_getBalance` via `provider.request()`
   - Submit transactions via `eth_sendTransaction`

### Integration Patterns
- **Wagmi v1 users**: `@arena-app-store-sdk/wagmi1-connector` (class-based, stable wagmi v1.4.13+)
- **Wagmi v2 users**: `@arena-app-store-sdk/wagmi2-connector` (modern factory-based, wagmi v2.16.4+)
- Both connect to Arena's managed wallet + signing infrastructure (no user mnemonics exposed)

### Limitations
- SDK is alpha; API may break in future releases
- WalletConnect integration "in early stages"
- No native token launch or DEX routing from mini-apps yet (beta roadmap)
- Apps must handle own authentication if needed (Arena provides profile data only)

### ZAO Opportunity
If ZAO wants to build a mini-app (e.g., treasury dashboard, voting interface, member discovery), the App Store is ready. ZAO would host the app, Arena handles wallet auth.

---

## 2. Analytics & Dashboard Tools

### Dune Analytics (Community-Built)
**Status**: Live, free to use
- **Dashboard**: [dune.com/couchdicks/stars-arena](https://dune.com/couchdicks/stars-arena)
- **Covers**: Ticket trading volume, profit/loss per wallet, holder count, tx history
- **Data Source**: On-chain Avalanche C-Chain + Arena contract ABIs
- **Note**: Contracts not yet verified on Snowtrace, so reverse-engineered queries

### First-Party Analytics (Missing)
- No official Arena analytics dashboard exists yet
- Tickets are on-chain ERC-20-like bonding curves; data is queryable but requires Dune SQL or Subgraph
- Arena does not publish official Subgraph (as of May 2026)

### Builder Power-User Tips
1. Use Dune to track personal portfolio and holder distribution
2. Export CSV of top ticket holders to monitor whale activity
3. Clone Dune queries to build custom dashboards (open-source SQL)
4. Monitor weekly tipping volume as early signal of engagement spike
5. Cross-check ticket price with trading volume to spot manipulation

### Numbers to Watch
- **Community size**: 200K+ users
- **Weekly active tippers**: 3,580 (up 105% year-over-year)
- **Bonding-curve volume** (Jan-Sep 2025 relaunch): $450M+ in 2 months
- **Staker airdrops**: 2.5% supply per token launch
- **Creator royalty**: 70% of secondary ticket trading fees go to creator

---

## 3. Bots & Automation

### Arena Agent Skill (Official Integration)
**Framework**: OpenClaw, Termo
**Status**: Production-ready (battle-tested Feb-May 2026)

**Capabilities**:
- 24/7 notification polling (default 3-min intervals)
- Auto-reply to mentions with contextual responses
- Scheduled post creation (3-5 posts/day configurable)
- Feed engagement (like + repost trending)
- State persistence (tracks processed notification IDs, avoids duplicates)

**Rate Limits** (critical for reliability):
- Posts: max 3/hour
- Reads: max 100/min
- Global: max 1000/hour
- Safe polling: run every 3 min = 20 reqs/min budget

**Config** (env vars):
```bash
ARENA_API_KEY=ak_live_...
ARENA_POLL_INTERVAL=180000     # 3 min default
ARENA_AUTO_REPLY=true
ARENA_AUTO_POST=true
ARENA_POSTS_PER_DAY=4          # max 24
ARENA_AGENT_PERSONALITY="..."
ARENA_STATE_PATH=~/.arena-agent-state.json
```

**Notification Types Handled**:
- `mention` -> auto-reply
- `reply` -> auto-reply (if enabled)
- `quote` -> auto-reply
- `follow` -> log, optionally follow back
- `like` / `repost` -> log only

**Deployment**:
- Standalone CLI: `npm install -g arena-agent` (via Termo)
- OpenClaw integration: cron job `*/3 * * * * arena-agent process-mentions`
- Docker: wrap in systemd user unit or PM2 for 24/7 uptime

### For ZAO: ZOE Arena Integration Roadmap
If ZAO wants to autonomously manage Arena presence (similar to how ZOE manages Twitter/Farcaster):
1. Deploy Arena Agent skill to ZAO's VPS (alongside existing ZOE bots)
2. Set personality to match ZAO community voice
3. Monitor Arena mentions in daily ZOE heartbeat
4. Post weekly updates on The Arena parallel to Farcaster cadence

---

## 4. Builder SDKs: The Logiqical Suite

### What It Is
**Logiqical** is a comprehensive Avalanche + Arena SDK for AI agents. It provides 176 MCP tools across 22 modules, structured as:
- REST API (for sandboxed agents that can only HTTP)
- MCP server (for Claude Code, Cursor, OpenClaw)
- TypeScript SDK (standalone or library)

### The 176 Tools, By Category

| Category | Tools | Highlight |
|----------|-------|-----------|
| Wallet | 8 | Address, balance, send, sign, simulate, switch network, update spending policy |
| ARENA Token | 5 | Buy/sell ARENA, quotes, balances |
| ARENA Staking | 4 | Stake, unstake, buy-and-stake, earnings info |
| DEX | 5 | Swap any token, quotes, token list (Trader Joe, ArenaDEX) |
| Arena Launchpad | 6 | Discover, buy/sell launchpad tokens (112K+), quotes |
| **Arena Tickets** | **7** | **getBuyPrice(), buildBuyTx(), buildSellTx(), getSupply(), getPriceHistory()** |
| **Arena Social** | **78** | **createThread(), replyThread(), likeThread(), getShareHolders(), getHoldings(), getEarningsBreakdown(), chat, communities, stages, livestreams** |
| Cross-Chain Bridge | 8 | Quotes, routes, status, token connections |
| Arena Perps | 20 | Orders, positions, leverage, auth, trade history (VDEX, Hyperliquid) |
| Signals Intelligence | 8 | Market signals, technicals, whale tracking, candles |
| Agent Registration | 1 | Register AI agent on Arena |
| Copy Trading | 5 | Mirror positions, calculate orders |
| Market Data | 6 | Prices, trending, search, top coins |
| DeFi | 8 | sAVAX staking, ERC-4626 vaults |
| Policy | 3 | Get/set spending guardrails |
| x402 Micropayments | 3 | Create paywalled APIs, access, pay with AVAX/ARENA |
| Contract Call | 1 | Call any smart contract method |

### Holder Tracking (Most Relevant for ZAO)
```typescript
const stats = await agent.social.getSharesStats(userId);
const holders = await agent.social.getShareHolders(userId);  // All holders of your ticket
const holdings = await agent.social.getHoldings();             // Tickets you own
const earnings = await agent.social.getEarningsBreakdown();    // Per-token royalties
const addresses = await agent.social.getHolderAddresses(userId); // Addresses (for on-chain actions)
```

### ZAO Use Cases
1. **Treasury monitoring**: Query Arena ticket holders, cross-check with ZAO member list, verify community alignment
2. **Social proof**: Track weekly new holders of ZAO ticket, create weekly "holder onboarding" thread
3. **Earnings tracking**: Monitor ARENA token distribution, calculate fair splits if ZAO launches community token
4. **Copy trading**: Mirror top whale trades on Arena (via Copy Trading module)
5. **Autonomous engagement**: Post daily market signals to Arena based on on-chain data

---

## 5. Cross-Platform Distribution

### Crenel (Farcaster-First Crosspost)
**Status**: Production (2026)
**Flows**: Farcaster -> X, Bluesky, Mastodon (one-way mirror)
**Features**:
- Auto-detect Farcaster mentions, map to X handles (via Neynar)
- Thread long-form posts on X, truncate for platforms without threading
- Cross-platform engagement analytics (likes, reposts, replies per platform)
- Top engagers + top posts tracking
- Weekly engagement notifications

**Cost**: Free

**Limitation**: Farcaster is the source; no Arena-to-X bridge yet.

### zensocial (Telegram Hub)
**Status**: Production (2024)
**Flows**: Telegram -> Farcaster, Bluesky, X (parallel posts)
**Features**:
- Text + image support (auto-upload to Imgur for Farcaster)
- Independent posting (continues if one platform fails)
- Exponential backoff on rate limits
- CLI setup (no web UI)

**Cost**: Free (self-hosted)

### For ZAO
**Current Gap**: No Arena-to-X bridge exists.
**Opportunity**: Build a Crenel fork that auto-posts Arena threads to Farcaster/X, mapping @Arena handles to Farcaster FIDs. Could be a ZAO mini-app or standalone bot.

---

## 6. Power-User Tips & Non-Obvious Features

### Feature: Token Communities (Not Tickets)
Arena pivoted from Friend.Tech-style "tickets" to **token communities**:
1. Creator launches token on Arena Launch (bonding curve)
2. Token auto-graduates to ArenaDEX once liquidity threshold hit
3. Token holders unlock gated community feed (like Discord)
4. Minimum token threshold to post (e.g., 1M $BACKUPPLAN = ~$0.01)
5. Once threshold met, can sell tokens and posts still visible

**ZAO Play**: Launch a ZAO community token, gate discussion to holders, use Logiqical to auto-post daily ecosystem updates only to ZAO token holders.

### Feature: Arena Stages (Live Audio/Video)
- Public or gated to ticket holders
- Live tipping in AVAX or any Arena token
- Recorded + replayable
- Built-in community chat

**ZAO Play**: Host weekly community calls on Stages, collect tips, use data to identify engaged members.

### Feature: Referral Rewards
- 1% of every trade by referred user goes to referrer
- Perpetual fee (not one-time)
- Track via wallet address

**ZAO Play**: Generate ZAO Arena referral link, share in discord, earn ongoing commission on community activity.

### Feature: Airdrop Strategy
- ARENA token: 10B cap, 31% airdrop, 90% vested monthly (anti-dump)
- New token launches: 2.5% supply air-dropped to ARENA stakers
- Points system: earn points for posts, tips, referrals, then claim ARENA

**ZAO Play**: If ZAO launches a community token, lock 2.5% for early ARENA stakers as alignment incentive.

### Feature: Secondary Trading Royalties
- Creator earns 70% of secondary ticket trading fees
- Means: every time someone sells your ticket, you earn
- No decay over time

**ZAO Play**: If Zaal has an Arena profile, encourage ticket trading to generate ongoing revenue stream.

### Non-Obvious Discovery
- Arena's AI-powered discovery module curates trending users
- Feed ranking favors referral activity (platform views new inflows as lifeblood of creator income)
- Use `/trends` endpoint to identify rising creators before they blow up

---

## 7. For ZAO: Is It Worth Building On?

### Yes If:
1. **ZAO wants direct fan monetization** - Tickets + token communities are proven (200K users, $450M volume in 2 months)
2. **ZAO has content/music to monetize** - Stages + tipping perfect for live events
3. **ZAO wants permissionless token launch** - No SEC filing, just bonding curve + 30 seconds
4. **ZAO wants to reach Avalanche native users** - Arena is the #1 SocialFi app on Avalanche by engagement
5. **ZAO runs agents (ZOE, Hermes)** - Logiqical SDK + Arena Agent skill are production-ready

### No If:
1. **ZAO prefers Ethereum/Solana** - Arena is Avalanche C-Chain only (L1 migration is roadmap item, not done yet)
2. **ZAO wants first-party integrations** - Arena app ecosystem is still alpha; mini-app ecosystem immature
3. **ZAO is averse to bonding curves** - All pricing is math-based, not negotiable
4. **ZAO already has Farcaster presence** - Consider Crenel for cross-posting instead of building Arena UI

### Minimum Viable Integration for ZAO
1. Create Zaal + ZAO profile on Arena (free, 2 min)
2. Deploy Arena Agent skill to ZAO VPS (via OpenClaw cron)
3. Set personality to match ZAO voice
4. Post weekly ecosystem updates + tip notifications
5. Monitor mentions in ZOE heartbeat

**Effort**: 1-2 hours setup, 15 min/day operations

---

## 8. Competitive Landscape (Other SocialFi Platforms Compared)

| Platform | Main Feature | Status | Community | Best For |
|----------|--------------|--------|-----------|----------|
| **The Arena** | Tickets + tokens + DEX, all integrated | Production | 200K users | Creators wanting instant monetization |
| **Friend.Tech** | Tickets only, minimal social | Mature but declining | ~50K active | Portfolio speculation |
| **Simps.com** (Base) | Room keys + livestream rooms | Production | Growing | Streamers (Twitch alternative) |
| **Retake.TV** (Base) | Auto-launched creator tokens | New (2025) | Early | Creators wanting Base-native token |
| **Abstract.xyz** (Abstract) | Gaming-first social | Early | Small | Web3 gamers |
| **Xeenon.xyz** | Token staking + leverage | New | Niche | DeFi-savvy creators |

**Arena's Moat**: First mover on **integrated** (social + trading + launching), lowest fees on Avalanche, 70% royalties to creators.

---

## Next Actions

| Action | Owner | Effort | Timeline |
|--------|-------|--------|----------|
| Create Zaal Arena profile + link to X | Zaal | 5 min | Before next meeting |
| Deploy Arena Agent skill to ZAO VPS | Claude / Agent | 1 hr | This week |
| Set up Dune dashboard to monitor ZAO ticket trading | Claude / Agent | 2 hr | This week |
| Test Logiqical SDK with holder tracking query | Claude / Agent | 1 hr | This sprint |
| Explore Arena Launch for ZAO community token (design only, no deploy) | Zaal / Product | 2 hr | Next week |
| Build Arena-to-Farcaster crosspost bot (ZAO mini-app or standalone) | Claude / Agent | 8 hr | If approved |
| Monitor Arena V2 roadmap for L1 migration + advanced mini-app features | Research | Ongoing | Monthly check-in |

---

## Sources

[FULL] https://registry.npmjs.org/%40the-arena%2Farena-app-store-sdk - Arena App Store SDK docs, v0.2.4 (Jan 2026)

[FULL] https://registry.npmjs.org/%40the-arena%2Fwagmi1-connector - Arena wagmi v1 connector (class-based)

[FULL] https://registry.npmjs.org/%40the-arena%2Fwagmi2-connector - Arena wagmi v2 connector (function-based)

[FULL] https://termo.ai/skills/arena-agent - Arena Agent skill, Termo platform, 24/7 daemon spec

[FULL] https://playbooks.com/skills/openclaw/skills/arena-agent - OpenClaw/Arena Agent Skill integration guide

[FULL] https://github.com/OlaCryto/arena-agent-plugin - Logiqical SDK: 176 MCP tools, Avalanche + Arena integration

[FULL] https://dune.com/couchdicks/stars-arena - Community Dune dashboard for Arena analytics (Stars Arena)

[FULL] https://crenel.xyz/ - Crenel crossposting tool (Farcaster to X/Bluesky/Mastodon)

[FULL] https://github.com/wbnns/zensocial - zensocial Telegram bot (cross-post to Farcaster/Bluesky/X)

[FULL] https://www.team1.blog/p/inside-the-arena-avalanches-socialfi - Avalanche Foundation overview of Arena platform (2025)

[FULL] https://www.bulbapp.io/p/606888b9-58eb-496e-a79f-0df9404ac7f7/the-social-media-stock-market-isreal - BULB: The Arena platform deep-dive by HattyHats (2026)

[FULL] https://www.theblock.co/post/362976/research-unlock-arena-and-the-future-of-socialfi - The Block: Arena V2 research unlock, bonding curve architecture, tokenomics

[FULL] https://www.gate.com/news/detail/13985391 - Gate: Arena SocialFi relaunch metrics ($450M volume, 3.58K tippers, 200K+ users)

[FULL] https://coinmarketcap.com/currencies/the-arena/ - CoinMarketCap: ARENA token stats, market cap, supply data

[PARTIAL] https://arena.social/ - The Arena platform (live, but UI data not text-extractable)

[PARTIAL] https://arena.trade/ - Arena Trade DEX (live, launchpad + token trading)

[FULL] https://www.skintormint.com/the-arena-on-avalanche/ - Skint or Mint: Arena overview, ticket mechanics, portfolio management

[FULL] https://www.bulbapp.io/p/98435175-5711-4c6e-8422-4c0761f9b01b/come-join-us-on-the-arena - Community guide to Arena (token communities, user onboarding)

[FULL] https://www.gazette.gg/p/beyond-twitch-streaming - Gazette: Comparison of Arena vs Simps vs Retake vs Xeenon vs Abstract (2025)

[FULL] https://github.com/anthonybautista/eliza-avalanche - Yorquant agent example: Arena integration with ElizaOS, trade execution

[FULL] https://github.com/tarcam/awesome-avalanche - Awesome Avalanche: curated list of SocialFi (Arena + competitors)

[FULL] https://www.coingecko.com/learn/stars-arena-avalanche-socialfi-crypto - CoinGecko: Stars Arena (pre-relaunch) history and mechanics

---

**Document prepared**: 2026-05-22
**Research tier**: DEEP (40+ min, 19 sources, 8+ community sources validated)
**Status**: COMPLETE - Ready for ZAO integration roadmap
