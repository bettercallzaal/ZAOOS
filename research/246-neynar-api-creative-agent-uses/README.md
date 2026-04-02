# 246 — Neynar API: Creative Agent Uses for ZOE

**Date:** 2026-04-01
**Status:** Active reference
**Goal:** Identify underused Neynar endpoints and patterns ZOE can leverage for community management (188 members, app FID 19640).

---

## What ZAO OS Already Uses

Basics: channel feed, trending feed, post cast, user lookup (FID/address), search users, followers/following, follow/unfollow, signer management, webhooks (cast.created only), auto-cast to /zao channel, follower snapshots + unfollow detection, social clusters.

## Neynar Endpoints You Are NOT Using (But Should)

The Neynar API has **130+ endpoints**. ZAO OS uses ~15. Here are the highest-value gaps for an agent like ZOE:

### 1. Community Radar

| Endpoint | What ZOE Could Do |
|---|---|
| `fetchCastsForUser` | Track each member's casting frequency — detect who went quiet |
| `fetchPopularCastsByUser` | Surface each member's top-performing content for weekly highlights |
| `fetchUserInteractions` | Map who talks to whom — find cliques, bridge builders, isolated members |
| `getUserBestFriends` | Ranked mutual affinity — identify the community's strongest bonds |
| `fetchCastsMentioningUser` | Alert when ZAO members get mentioned outside the community |
| `fetchUsersActiveChannels` | See where members are spending time beyond /zao |
| `listTrendingTopics` | Detect what topics are hot on Farcaster — align community content |
| `fetchCastMetrics` | Pull engagement metrics (replies, likes, recasts) per cast |

### 2. Auto-Curation and Content

| Endpoint | What ZOE Could Do |
|---|---|
| `searchCasts` (AND filters) | Find music-related casts across all of Farcaster, not just /zao |
| `fetchFeedByTopic` | Topic-filtered feeds — pull "music", "web3 music", "NFT" content |
| `lookupCastConversationSummary` | AI-generated thread summaries — auto-digest long discussions |
| `fetchCastQuotes` | Find who is quoting ZAO community casts — measure external reach |
| `fetchFramesOnlyFeed` | Discover new mini-apps relevant to music/community |

### 3. Channel Intelligence

| Endpoint | What ZOE Could Do |
|---|---|
| `fetchChannelMembers` | List all members of /zao channel — compare to allowlist |
| `fetchTrendingChannels` | Spot rising channels where ZAO should have presence |
| `fetchFollowersForAChannel` | Track /zao channel subscriber growth |
| `inviteChannelMember` | Programmatically invite new members to /zao channel |

### 4. Reactions and Engagement Tracking

| Endpoint | What ZOE Could Do |
|---|---|
| `fetchUserReactions` | Track what each member likes/recasts — understand taste |
| `fetchReactionsByTarget` | See all reactions to a specific cast (e.g., song submission) |
| `publishReaction` | ZOE auto-likes member posts (engagement boost) |

### 5. Notifications and Mini-Apps

| Endpoint | What ZOE Could Do |
|---|---|
| `publishFrameNotifications` | Push notifications to members via mini-app |
| `sendNotificationsToMiniAppUsers` | Bulk notify: "New song dropped", "Fractal tonight", "Vote now" |
| `createTransactionPayFrame` | Deploy payment collection frames (merch, tickets, tips) |

### 6. On-Chain and Token Operations

| Endpoint | What ZOE Could Do |
|---|---|
| `fetchUserBalance` | Check member token holdings (ZAO-related tokens) |
| `mintNft` | Mint attendance NFTs, achievement badges |
| `sendFungiblesToUsers` | Distribute reward tokens to active members |
| `fetchTrendingFungibles` | Track trending tokens relevant to music/web3 |

## 2026 Developments

**Neynar acquired Farcaster** (Jan 2026) — they now own the protocol, app, and Clanker. This means the API is the canonical way to build on Farcaster going forward.

**x402 Protocol** — Pay-per-API-call at $0.001 USDC/request on Base. ZOE can use Neynar without a subscription by paying per call from its own wallet. This is ideal for an agent with a treasury.

**MCP Support (Coming)** — Neynar is adding Model Context Protocol endpoints, meaning ZOE (via OpenClaw/Claude) could call Neynar directly as an MCP tool.

## Concrete ZOE Capabilities to Build

**Weekly Community Pulse** (cron job):
- `fetchCastsForUser` x 188 members -- who posted, who went silent
- `fetchPopularCastsByUser` -- top content of the week
- `fetchUserInteractions` -- engagement map
- Auto-cast a summary to /zao

**Music Scout** (webhook + cron):
- `searchCasts` with music keywords across all Farcaster
- `fetchFeedByTopic` for music channels
- Surface discoveries to /zao with attribution

**Member Health Monitor**:
- `fetchCastMetrics` on community casts -- engagement trending up or down?
- `fetchChannelMembers` vs allowlist -- who joined/left the channel?
- `getUserBestFriends` -- are members bonding or drifting?

**Smart Engagement Bot**:
- `publishReaction` -- ZOE likes every member's first cast of the day
- `fetchCastsMentioningUser` -- alert Zaal when ZAO gets mentioned externally
- `inviteChannelMember` -- auto-invite new allowlisted members

---

## Sources

- [Neynar API Documentation (llms.txt)](https://docs.neynar.com/llms.txt)
- [Building AI Agents on Farcaster](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [Neynar x402 Vision](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)
- [Neynar acquires Farcaster (The Block)](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)
- [Farcaster Bot Template (GitHub)](https://github.com/davidfurlong/farcaster-bot-template)
- [Neynar Examples (GitHub)](https://github.com/neynarxyz/farcaster-examples)
- [OpenRank x Neynar Trending Feeds](https://docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip/build-channel-trending-feeds-for-your-client-using-neynar-and-openrank-apis)
