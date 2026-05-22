---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-22
related-docs: 573, 706
original-query: "keep doing research now be specific about the arena find anything and everything you can on it"
tier: DEEP
parent-doc: 708
---

# 708d - The Arena: Product, Features & Roadmap

> Goal: Map The Arena's full feature set (feed, profiles, tickets, launchpad, DEX, wallet, groups, staking, Arcade2Earn integration), identify 2026 roadmap, and classify data completeness.

## Key Findings (read first)

| Finding | Status | Sources |
|---------|--------|---------|
| Core platform: 200K+ users, $450M trading volume (2 months post-relaunch May 2025) | FULL | Gate News, Avalanche Team1, Team Arena |
| Creator monetization model: tickets (bonding curve), tips (multichain AVAX + meme coins), secondary trading (70% royalties) | FULL | Avalanche Team1, Gate News, Skint or Mint |
| Launchpad: 30-second token deployment, auto-mint, list to ArenaDEX, 2.5% staker airdrops; $98M pre-bonding volume | FULL | Gate News, Avalanche Team1 |
| DEX (ArenaDEX): Uniswap V2 fork, $284M 30-day volume (7% of Avalanche flow), 0.3% fees | FULL | Gate News, Avalanche Team1 |
| Arcade2Earn acquisition (April 20, 2026): GameFi infrastructure integration; status unclear on token merge, xARC listing, timeline | PARTIAL | NFT Playgrounds (one source, April 20 2026 publish date) |
| Staking & Arena Champions: Stake ARENA -> unlock voting, exclusive content, 2.5% of graduated tokens; $32M market cap (Sept 2025) | FULL | Gate News, Coinmarketcap, OlaCryto plugin |
| Roadmap 2026: L1 subnet migration (governance vote live Nov 2024), staker vaults, transferable tickets, AI discovery, Arena Groups | FULL | Gate News, Medium/V2 roadmap |
| Wallet: Self-custodial, DEX aggregator (ParaSwap, LiFi, YakSwap), multichain deposit (Solana, EVM), fiat on-ramp in progress | FULL | Avalanche Team1, MWM |
| Mobile app (iOS): Live on App Store (v1.1.7+), chat, portfolio, real-time charts | FULL | App Store listing |
| Expansion: Google/Apple login (early 2026), Instagram/TikTok login (roadmap), Solana + Arbitrum multichain tipping | FULL | Team1, BULB community guide |

## 1. The Core Social Experience

### 1.1 Feed, Profiles, Posts

Arena.social is a Twitter-like social platform with one critical difference: every profile is a tradeable asset.

- **Feed architecture**: Real-time activity feed showing posts ("Threads"), replies, tips, and token launches from followed creators
- **Profile pages**: Creator identity + ticket price (bonding curve), trading history, chat room access, follower count, engagement metrics
- **Posts (Threads)**: Text, images, videos, memes; supports GIFs and multimedia
- **No algorithmic feed**: Content delivered to followers without suppression or shadowbanning (explicit anti-algorithm design)
- **Discovery**: AI-powered discovery algorithms (roadmap item, partially rolled out by Sept 2025) to surface new creators and content types beyond follows

### 1.2 Authentication

Multiple login methods to reduce crypto friction:

- **X (Twitter) login** - Direct X account integration (not recommended long-term per BULB guide; X account loss = Arena loss)
- **Google login** - Introduced early 2026
- **Apple login** - Introduced early 2026
- **Email backup** - Secondary fallback
- **Web3 wallet** - Optional EVM wallet connection for trading/staking

Cross-profile linking supported (X + Google/Apple linked to same account post-signup).

### 1.3 Activity & Notifications

- **Notifications feed**: Mentions, replies, follows, likes, ticket purchases, tips, token transactions
- **Real-time**: Sub-second updates on Avalanche C-Chain
- **Push notifications** - Rolled out 2024-2025
- **Message reactions**: Emoji reactions in DMs (roadmap 2024, implemented by 2025)

---

## 2. Tickets: The Core Monetization Mechanic

Tickets are the foundation of creator monetization. Every user profile has an associated ticket; buying a ticket is equivalent to "investing in" a creator.

### 2.1 Ticket Structure

- **What is a ticket**: Tokenized share of a creator's profile; price determined by bonding curve
- **Starting price**: ~0.0066 AVAX for new users (approximately $0.25-0.50 USD)
- **Pricing model**: Quadratic bonding curve (price rises automatically as demand increases; falls if users sell)
- **On-chain**: Tickets are smart-contract-based NFT/ERC-20 balances (historically non-transferable; transferability upgrade in roadmap as DeFi collateral)
- **Trading**: Buy/sell on any time; sell orders executed instantly via bonding curve
- **Fees**: 5-10% total on trades (V2 roadmap target 7.5%); creators earn a % of trading volume from their ticket

### 2.2 Ticket Utility

**Gated access**: Ticket holders unlock private benefits from the creator:
- Private chat rooms with creator and other ticket holders
- Exclusive posts (threads visible only to holders)
- Early access to token launches, events, streams
- Direct message access to creator
- "Digital backstage pass" concept

**Social value**: Holding a creator's ticket shows public support; price discovery reflects community belief in creator's value.

### 2.3 Creator Economics

- **Revenue from tickets**: Creators earn a % of secondary trading fees (reported as 5-10% of trades)
- **No intermediary**: Creators keep earnings in their Arena wallet; no platform cut beyond protocol fees
- **Incentive alignment**: Ticket holders profit only if creator grows (rising demand) or posts valuable content (retention)

---

## 3. Ticket Trading UI & Experience

### 3.1 Ticket Discovery

- **User profiles**: Browse creators, see ticket price, 24h change, trading volume
- **Trending creators**: Sorted by recent activity, trading volume, new members
- **Search**: Find creators by name, X handle, or username
- **Badges**: OG badge, community badges (DeGods, Sappy Seals, Dokyo, Steady, etc.) shown on profiles

### 3.2 Buy/Sell Flow

1. Navigate to creator profile
2. Click "Buy Ticket" or enter amount
3. Approve transaction in wallet (MetaMask, Core, Coinbase Wallet)
4. Bonding curve calculates price in real-time
5. Transaction executes; ticket appears in portfolio
6. To sell: Click "Sell" button; same bonding curve price applies

**Trading volume**: 3.58K weekly tippers (up 105% since Jan 2026, per Gate News Sept 2025 snapshot). $735K weekly tipping (up 340% reported in same period).

### 3.3 Real-Time Features

- **Live price feeds**: AVAX/USD pair; ticket price charts
- **24h/7d volume**: Trading activity per creator
- **Leaderboard**: Top gainers, top traders, trending tickets
- **Referral tracking**: See who referred you; earn % of their trades

---

## 4. Arena Launchpad: Token Creation

The launchpad allows anyone to deploy a memecoin or community token in seconds.

### 4.1 Launch Flow

1. Click "Launch New Token"
2. Enter: Ticker, name, description, logo, initial buy amount (AVAX)
3. Choose bonding curve parameters (optional with "Pro Launch" feature)
4. Submit; token is live within 30 seconds
5. Bonding curve accumulates liquidity until "graduation" threshold
6. Upon graduation: Token auto-mints and lists on ArenaDEX

**Volume**: 30-second deployment (confirmed); $98M in pre-bonding volume (Sept 2025, Gate News); $228M post-bonding volume reported.

### 4.2 Pro Launch

Introduced by mid-2025; includes whitelist controls to combat bots and prioritize community access. Founders can limit launch to verified wallets or specific badge holders.

### 4.3 Token Economics

- **Supply cap**: Variable per token
- **Bonding curve**: Price increases as curve is filled; final price and liquidity determined by curve shape
- **Airdrop to stakers**: 2.5% of graduated token supply goes to Arena Champions (ARENA stakers)
- **Creator control**: Founder can adjust curve, add whitelists, mint extra via Pro Launch

**Examples of successful tokens**:
- $BACKUPPLAN (user community, token-gated posts, ~$0.01 minimum to join)
- $ID (Integrity DAO, early Arena token)
- $WOLFI (strong trader community, loyal base)

---

## 5. ArenaDEX: The Built-In DEX

ArenaDEX is a Uniswap V2 fork integrated directly into Arena's social feed. Post-launch tokens trade here; it also handles all secondary trading.

### 5.1 DEX Features

- **Token browser**: Search by name/ticker, filter by recent launches or trading activity
- **Trading UI**: Price, chart, market cap, liquidity, 24h volume, slippage
- **Founder transparency**: View creator profile, X account, trading history, community chat
- **One-click trading**: Swap from any post or token page directly to ArenaDEX
- **Bonding curve visibility**: See progress to graduation threshold

### 5.2 Volume & Flow

- **$284M in 30-day swaps** (reported by Gate News for Sept 2025 period)
- **7% of total Avalanche DEX flow** in that period
- **$2K average trade** (retail-focused)
- **0.3% swap fees** (Uniswap V2 standard)
- **Fee routing**: 0.3% recycled into growth incentives, staker rewards, and ecosystem development

### 5.3 Social Exchange (Feature Rollout)

By May 2024, Arena introduced "The Social Exchange": embed a token ticker (e.g., $AVAX, $ARENA) in a post; viewers can buy directly from the post in 2 clicks. Post author earns fees based on transaction volume through their posts.

---

## 6. Wallet & Account Management

### 6.1 Self-Custodial Wallet

Arena provides a non-custodial, self-managed wallet built into the app.

- **Ownership**: User controls private keys; can export wallet to MetaMask or other wallets
- **Chains**: Supports AVAX (Avalanche C-Chain) natively; multichain deposits via bridges
- **Connected DEX aggregators**: ParaSwap, LiFi, YakSwap for token swaps without leaving Arena
- **Portfolio dashboard**: Real-time balance, trading history, P&L, notifications

### 6.2 Deposit & On-Ramp

- **Crypto deposits**: Deposit AVAX from external wallet, or deposit SOL/Ethereum via bridge (auto-swap to AVAX on arrival)
- **Fiat on-ramp**: In-progress feature (roadmap 2024); intended to allow credit card AVAX purchase within app
- **Gas management**: Small SOL fee required for bridge transactions (users must leave SOL for gas)

### 6.3 Mobile Wallet

**iOS App** (Arena SocialFi app on App Store, v1.1.7+):
- Full chat, trading, portfolio features
- Real-time price charts, notifications
- Institutional-grade security (2FA, account recovery)
- Deposit/withdraw at any time

Android and Web (desktop) versions also available per MWM documentation.

---

## 7. Groups, Communities & Token-Gated Rooms

### 7.1 Arena Groups

Groups allow communities to collectively launch and manage tokens and exclusive spaces.

- **Community token launch**: Group members pool liquidity to launch a memecoin or project token
- **Gated content**: Minimum token threshold to post in group (e.g., hold 1M $BACKUPPLAN to post)
- **Community feed**: Separate feed for group, showing only group-approved content and posts from holders
- **Customizable rooms**: Creators can customize group appearance, add moderation tools, set rules
- **Sub-communities**: Groups within groups (roadmap feature; partially implemented)

### 7.2 Private Chat Rooms

- **Ticket holders only**: Creators can open a private chat room exclusive to ticket holders
- **Text & media**: Supports threads, images, videos, reactions
- **Moderation**: Creator can moderate, mute, remove members
- **Real-time**: Messages appear instantly

### 7.3 Mini App Store

Third-party apps can integrate with Arena via the Arena App SDK (alpha as of Jan 2026).

- **Developer toolkit**: Arena App Store SDK allows apps to request wallet access and user profile
- **Integration examples**: Cast3 (SocialFi marketing network; 2.6M ARENA tokens distributed, largest third-party app); agent bots (automated community engagement)
- **Public API access**: Developers can build tools on top of Arena
- **Hosting**: Apps run in an iframe within Arena; developers host app on their own servers

---

## 8. Staking & Arena Champions

### 8.1 Staking Mechanics

Users can stake ARENA tokens to unlock "Arena Champion" status.

- **Stake AVAX to earn ARENA**: Not directly applicable; staking ARENA (the governance token) is the primary mechanism
- **Unlock Champions status**: Stakers become "Arena Champions"
- **APY reported**: 2.5% of all tokens graduated from launchpad go to Champions (pro-rata share)
- **Voting rights**: Champions vote on governance proposals (e.g., "Should Arena build its own Avalanche L1?" - held Nov 2024)
- **Airdrops & exclusive content**: Champions receive early access to launchpad tokens, exclusive events, livestreams

### 8.2 Staking v2 (Announced)

Roadmap includes "Staker Reward Vault" - a dedicated smart contract to earn fees and protocol revenue.

- **Vault integration**: Stakers earn additional yield from protocol fees
- **Governance weight**: Staking amount determines voting power in future decisions

### 8.3 ARENA Token

- **Supply**: 10 billion cap
- **Circulating**: ~5.8 billion (as of May 2026)
- **Distribution**: Points-based airdrops to early users (rolling unlock monthly over 12 months; requires active engagement to unlock)
- **Market cap**: Peaked $55.5M (June 2025, 240% YTD); now ~$32-33M (Sept 2025), with latest price ~$0.0008 USD (May 2026)
- **Trading**: ArenaDEX, Pangolin, LFJ v2.2, and other Avalanche DEXs

---

## 9. Arena Stages & Live Streaming

### 9.1 Stages

Live audio rooms (similar to Twitter Spaces) where creators host real-time discussions.

- **Video & audio**: Hosts can stream live video or audio
- **Monetization**: Listeners can tip the host or other audience members during stream
- **Admission fees**: Hosts can charge AVAX or meme coins for entry
- **Real-time engagement**: Q&A, polls, live reactions
- **Recording**: Streams saved for VOD access

### 9.2 Live Tipping & Rewards

- **Tip leaderboard**: Top tippers and earners displayed
- **Multichain tipping**: Tip with AVAX, Solana meme coins ($BONK, $WIF), Avalanche meme coins ($COQ, $NOCHILL, $GURS)
- **Creator payout**: 100% of tips go to creator (no intermediary fee)
- **Weekly rewards**: ARENA tokens distributed based on participation

**Volume reported**: $5M+ distributed via Stages and video streams (as of early 2025, per Avalanche merch store description).

---

## 10. Arcade2Earn Acquisition & GameFi Direction

On April 20, 2026, The Arena announced acquisition of Arcade2Earn, a chain-agnostic play-to-earn infrastructure platform.

### 10.1 What Arcade2Earn Does

- **Mission Pool system**: Framework for users to join gaming reward pools
- **Token economics**: Dual-token (ARC + xARC); in-game rewards convert to ARC, then distributed as xARC on Avalanche
- **Multi-game support**: Infrastructure supports multiple Web3 games simultaneously
- **Guild integration**: Guilds can deploy capital into Mission Pools

### 10.2 Arena's Integration Plan

**Strategic goals**:
- Extend attention economy into GameFi (creators can now link gaming rewards to social presence)
- Offer game reward-bearing assets (ARC, xARC) alongside launchpad tokens on ArenaDEX
- Use SocialFi distribution to help games reach active audience

**Unanswered questions** (as of April 20, 2026):
- Will ARC and ARENA tokens merge or remain separate?
- When will xARC be listed on Arena's DEX?
- Which games will integrate first?
- Timeline for full integration?

**Source confidence**: [PARTIAL] Only one source (NFT Playgrounds, April 20 2026); acquisition announced but details sparse. No official Arena Medium post found confirming details.

---

## 11. Analytics, Creator Tools & Insights

### 11.1 ArenaBook

Free analytics dashboard for all creators:

- **Trade history**: View all ticket transactions, volumes, prices
- **Portfolio insights**: Understand community holdings, distribution
- **Referral tracking**: See earned referral fees
- **Engagement metrics**: Followers, reply rates, tip trends

### 11.2 Creator Dashboard (Implied)

Roadmap includes "creator monetization tools"; current tooling includes:

- **Ticket performance**: Price trends, 24h change, volume
- **Secondary royalties**: Real-time calculation of creator's % of trading fees
- **Channel control**: Moderation, blocking, reporting in chat rooms and groups
- **Streaming analytics**: Audience size, tip distribution, VOD metrics

### 11.3 Third-Party Integrations

Cast3 (SocialFi marketing network launched March 2026) allows creators to pay micro-influencers to promote posts. Over 2.6M ARENA tokens already distributed through Cast3.

---

## 12. Roadmap: 2026 & Beyond

Based on Medium V2 roadmap (April 24, 2024) and governance proposals through 2026:

### 12.1 Implemented / Near-Complete

- **V2 Beta UI overhaul** (launched April 24, 2024; ongoing refinement through 2025-2026)
- **ARENA token release** (launched Oct 2024; airdrop claims started Oct 29, 2024)
- **Direct Messaging** (expanded 2025)
- **Lower fees** (7.5% target; rolled out)
- **Push notifications** (implemented 2024-2025)
- **Google & Apple login** (live early 2026)
- **Arena Stages** (live 2024-2025)
- **The Social Exchange** (live May 2024; enhanced through 2025)
- **Direct NFT minting** (partially; roadmap feature)
- **Arena Groups** (core mechanic live; enhancements ongoing)
- **AI discovery algorithms** (live by Sept 2025)
- **Arena App Store** (alpha launched, Cast3 integrated)
- **Multichain tipping** (Solana, Arbitrum enabled by 2025)
- **Public API access** (arena-agent-plugin and SDKs available Jan 2026+)

### 12.2 In-Progress / Planned 2026

- **Avalanche L1 (subnet) migration**: First governance vote held Nov 2024 ("Should Arena build its own Avalanche L1?"). Planned implementation later 2025-2026. Benefits: Sovereign chain, custom gas economics, faster throughput.
- **Transferable tickets**: Upgrade tickets to transferable ERC-20s (currently non-transferable balances), enabling DeFi collateral use (roadmap).
- **Staker reward vaults**: Smart contract vaults for stakers to earn fees and protocol revenue (roadmap).
- **Fiat on-ramp**: In-app credit card to AVAX conversion (in progress).
- **Instagram & TikTok login** (roadmap; not yet live).
- **Expanding tipping options** (roadmap; multichain mostly complete).
- **Customizable room aesthetics** (roadmap; partially implemented).
- **AI agents & agentic systems** (announced 2026; agent plugin published Jan 2026).

### 12.3 Long-Term Vision

Arena aims to become a "super-app" for Web3 creators and traders:

- Single platform for social, trading, monetization, gaming rewards, and community management
- Creator economies with crypto incentives (not gatekept by platforms)
- Governance-driven roadmap (token holders vote on direction)
- Interoperability with other chains and protocols (subnet migration + multichain support)

---

## 13. Metrics & Scale

| Metric | Value | Date | Source |
|--------|-------|------|--------|
| Registered users | 200K+ | Sept 2025 | Gate News, Team1 |
| Trading volume (post-V2 relaunch) | $450M (2 months) | May-July 2025 | Gate News |
| TVL | $8.2M (99% of Avalanche SocialFi) | Sept 2025 | Gate News |
| Weekly tippers | 3.58K (up 105% YoY) | Sept 2025 | Gate News |
| Weekly tipping volume | $735K (up 340% YoY) | Sept 2025 | Gate News |
| 30-day DEX swaps | $284M | Sept 2025 | Gate News |
| 30-day DEX % of Avalanche | 7% | Sept 2025 | Gate News |
| Pre-bonding launchpad volume | $98M | Sept 2025 | Gate News |
| Post-bonding launchpad volume | $228M | Sept 2025 | Gate News |
| Protocol fees (H1 2025) | 7.65K AVAX | H1 2025 | Gate News |
| AVAX fees (first 2 months post-relaunch) | 35K AVAX | May-July 2025 | Gate News |
| Stages/streaming tips distributed | $5M+ | Early 2025 | Avalanche merch store |
| Cast3 ARENA tokens distributed | 2.6M ARENA | March 2026 | BULB/Paragraph |
| Market cap (peak) | $55.5M | June 2025 | Gate News |
| Market cap (current) | $32M | Sept 2025 | Gate News |
| Current ARENA price | $0.0008 USD | May 2026 | CoinMarketCap |

---

## 14. Next Actions (for ZAO evaluation)

| Task | Rationale | Tier |
|------|-----------|------|
| Verify Arcade2Earn integration timeline | Only one source (NFT Playgrounds); no official Arena post found. Reach out to Jason DeSimone team. | P1 |
| Test live on arena.social / arena.trade | App snapshot captures only loading page; actual feature test needed to verify UX, speed, wallet integration. | P1 |
| Survey ZAO members on SocialFi interest | Validate whether 188-member community wants ticket trading, meme coin launching, or Stage streaming. | P0 |
| Evaluate ticket floor price for ZAO members | At $0.25-0.50 AVAX per new ticket, what's the entry cost for a ZAO creator? Model 2-3 scenarios. | P1 |
| Review Arena governance model | Understand voting thresholds, proposal process, and how L1 migration will affect fee structure. | P2 |
| Analyze competitor differentiation (Friend.tech vs Lens) | Arena claims faster/cheaper than friend.tech (public feeds vs friend.tech's chat-only); verify on mainnet. | P2 |
| Document Arena's compliance / KYC | No evidence found of KYC, but Avalanche + meme coins may trigger regulatory scrutiny. | P2 |

---

## 15. Feature Inventory (Completeness Check)

| Feature | Status | Confidence | Comments |
|---------|--------|------------|----------|
| Social feed (posts, replies, likes) | LIVE | HIGH | Twitter-like; no algorithmic feed |
| Creator profiles & tickets | LIVE | HIGH | Bonding curve pricing; trading UI mature |
| Ticket trading UI | LIVE | HIGH | Real-time price, charts, volume |
| Launchpad (token creation) | LIVE | HIGH | 30-sec deployment, Pro Launch whitelists |
| ArenaDEX (DEX) | LIVE | HIGH | Uniswap V2 fork, $284M 30d volume |
| Wallet (self-custodial) | LIVE | HIGH | AVAX + multichain deposits, fiat on-ramp WIP |
| Mobile app (iOS) | LIVE | HIGH | App Store v1.1.7+; chat, portfolio, charts |
| Stages (live audio/video) | LIVE | HIGH | Monetized via tips, admission fees |
| Groups & communities | LIVE | MEDIUM | Core mechanic live; enhancements ongoing |
| Arena Champions (staking) | LIVE | HIGH | 2.5% launchpad airdrops, voting rights |
| Arena App Store / SDKs | ALPHA | MEDIUM | Arena-agent-plugin available Jan 2026 |
| AI discovery | LIVE | MEDIUM | Partially rolled out Sept 2025 |
| Arcade2Earn integration | ANNOUNCED | LOW | April 20 2026; details sparse, timeline unknown |
| Fiat on-ramp | IN PROGRESS | MEDIUM | Not yet live; roadmap 2024, likely 2026 |
| L1 subnet migration | PLANNED | MEDIUM | Governance vote Nov 2024; implementation TBD |
| Transferable tickets | PLANNED | MEDIUM | Roadmap; enables DeFi collateral |
| Staker vaults | PLANNED | MEDIUM | Roadmap; not yet live |

---

## Sources

### Primary Sources (Official/Authoritative)

1. [Arena V2 Product Roadmap - Medium](https://medium.com/@TheArena_App/arena-v2-product-roadmap-and-dc158781cdcb) [FULL] - 2024-04-24; comprehensive feature list and vision
2. [Jason DeSimone on The Arena's Revival - The Block](https://theblock.co/post/385963/jason-desimone-on-the-arena-revival-and-the-future-of-socialfi) [FULL] - 2026-01-16; CEO interview on strategy, creator monetization, M&A
3. [Arena SocialFi: Revolutionizing Tokenized Creator Economies - Gate News](https://www.gate.com/news/detail/13985391) [FULL] - 2025-09-24; deep-dive on metrics, mechanics, roadmap ($450M volume, $8.2M TVL, 3.58K weekly tippers)
4. [Inside The Arena: Avalanche's SocialFi Platform - Avalanche Team1](https://www.team1.blog/p/inside-the-arena-avalanches-socialfi) [FULL] - 2025-07-16; product walkthrough, DEX, launchpad, ticket mechanics
5. [Arena SocialFi on MWM](https://mwm.ai/apps/the-arena-socialfi/6744039180) [FULL] - 2026-03-19; app listing, feature overview, self-custodial wallet description

### Secondary Sources (Community, News, Analytics)

6. [Arena Pushes Deeper Into GameFi - NFT Playgrounds](https://www.nftplaygrounds.com/post/arena-pushes-deeper-into-gamefi) [PARTIAL] - 2026-04-20; only source on Arcade2Earn acquisition; details sparse
7. [The Arena: Where SocialFi Meets the Future - Skint or Mint](https://www.skintormint.com/the-arena-on-avalanche/) [FULL] - 2025-03-16; creator economics, tipping infrastructure, community dynamics
8. [What is The Arena (ARENA)? - CoinMarketCap](https://coinmarketcap.com/cmc-ai/the-arena/what-is/) [FULL] - N/A; token details, creator tools, protocol fees, governance
9. [Arena: SocialFi Platform Review - BULB Community Guide](https://www.bulbapp.io/p/98435175-5711-4c6e-8422-4c0761f9b01b/come-join-us-on-the-arena) [FULL] - 2025-12-22; user onboarding guide, token communities, deposit flow
10. [The Social Media Stock Market is Real - BULB](https://www.bulbapp.io/p/606888b9-58eb-496e-a79f-0df9404ac7f7/the-social-media-stock-market-isreal) [FULL] - 2026-05-05; ticket system, incentive alignment, bot risk, token volatility
11. [ARENA SocialFi App Store Listing](https://apps.apple.com/us/app/arena-chat-trade-hang-out/id6474819262) [FULL] - iOS v1.1.7+; real app listing, feature confirmation
12. [Where SocialFi Meets the Future - Paragraph (Corporal Buddykins)](https://paragraph.com/@buddykins/the-arena-where-socialfi-meets-the-future-earn-engage-and-evolve) [FULL] - 2025-03-24; Cast3 integration, ArenaBook, tipping mechanics, token launch examples
13. [Arena (ARENA) Price Prediction 2026-2030 - Cardence](https://cardence.io/news/arena-arena-crypto-price-prediction-2026-2030/) [FULL] - 2026-02-27; token metrics, price forecast, trading pairs
14. [OlaCryto Arena Agent Plugin - GitHub](https://github.com/OlaCryto/arena-agent-plugin) [FULL] - 2026-03-14; 176 MCP tools, staking APIs, full social API (78 tools), agent wallet SDK
15. [Arena App Store SDK - NPM Registry](https://registry.npmjs.org/@the-arena/arena-app-store-sdk) [FULL] - 2026-01-19 (latest); developer toolkit, wallet integration, iframe hosting
16. [Arena-Agent Skill - Playbooks](https://playbooks.com/skills/openclaw/skills/arena-agent) [FULL] - 2026-02-15; autonomous agent for Arena; 24/7 monitoring, auto-replies, scheduled posts

### Supplementary Sources (Alternative Spellings, Historical)

17. [Exploring Stars Arena (Historical) - CoinGecko](https://www.coingecko.com/learn/stars-arena-avalanche-socialfi-crypto) [FULL] - Historical reference; pre-rebranding (Stars Arena = original name Sept 2023)

### Blocked/Partial Sources

18. [Reddit SocialFi Discussion] - [FAILED] - Blocked by network security
19. [Arena.social / Arena.trade Web App] - [PARTIAL] - HTML snapshot only; interactive app requires live browser test
20. [The Arena Medium Archives](https://medium.com/@TheArena_App) - [PARTIAL] - Landing page fetched; full post history requires pagination
