# 306 - Farcaster Protocol Features Gap Analysis for ZAO OS

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Map every Farcaster protocol feature available and identify what ZAO OS should add to be the best community hub client

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Creator/Developer Rewards** | BUILD - surface weekly reward winners in member profiles. Neynar: `fetchCreatorRewardsWinnerHistory`. $25,000+/week USDC distributed. ZAO members who create quality content deserve visibility |
| **Account Verifications** | BUILD - show X/GitHub/Discord badges on member profiles. Farcaster Client API: `GET /fc/account-verifications`. Beta but working |
| **Subscriptions (Hypersub/Fabric)** | BUILD - detect who subscribes to ZAO channels. Neynar: `fetchSubscribedToForFid`, `fetchSubscribersForFid`, `fetchSubscriptionCheck`. Enables gated content |
| **Best Friends / Affinity** | BUILD - show mutual affinity scores. Neynar: `getUserBestFriends`. Strengthens community graph |
| **Trending Topics** | BUILD - show what /zao is talking about. Neynar: `listTrendingTopics`. Quick win for engagement |
| **Cast Metrics** | BUILD - show engagement stats on member casts. Neynar: `fetchCastMetrics`. Respect-weighted curation data |
| **Popular Casts** | BUILD - highlight top casts by ZAO members. Neynar: `fetchPopularCastsByUser` (top 10 by engagement) |
| **User Locations** | BUILD - show member map. Neynar: `fetchUsersByLocation`. Already have `MemberMap.tsx` component |
| **Storage Management** | BUILD - show storage usage in settings. Neynar: `lookupUserStorageUsage`, `buyStorage`. Users need to know when they're running low |
| **FName Availability** | BUILD - check username availability for new members. Neynar: `isFnameAvailable` |
| **X Username Lookup** | BUILD - cross-reference ZAO members' X accounts. Neynar: `lookupUsersByXUsername` |
| **Direct Cast Intents** | BUILD - "DM this member" links. Use `https://farcaster.xyz/~/inbox/create/[fid]` intent URLs. Protocol-native, zero code |
| **Notifications (full)** | UPGRADE - add channel-specific notifications and mark-as-seen. Neynar: `fetchAllNotifications`, `fetchChannelNotificationsForUser`, `markNotificationsAsSeen` |
| **Mute/Block APIs** | BUILD - let users mute/block from within ZAO OS. Neynar: `publishMute`, `publishBlock`, `fetchMuteList` |
| **Farcaster Actions** | SKIP for now - actions are for cross-client interactions. Build when ZAO has mini app adoption |
| **Token/Onchain APIs** | SKIP for now - Neynar has token deploy/trade/balance APIs but ZAO's token strategy uses separate infrastructure |
| **Farcaster Pro detection** | BUILD - detect Pro subscribers via user data (pro badge in profile). Show premium status on profiles |
| **Conversation Summaries** | BUILD - AI-generated thread summaries. Neynar: `lookupCastConversationSummary`. LLM-powered, free in API |
| **Follow Suggestions** | UPGRADE existing DiscoverPanel. Neynar: `fetchFollowSuggestions` is better than current custom logic |

## Complete Neynar API Coverage: Used vs Unused

### Currently Used (22 endpoints)

| Category | Endpoint | ZAO OS File |
|----------|----------|-------------|
| Feed | getTrendingFeed | `src/lib/farcaster/neynar.ts` |
| Feed | getChannelFeed | `src/lib/farcaster/neynar.ts` |
| Cast | postCast | `src/lib/farcaster/neynar.ts` |
| Cast | getCastThread | `src/lib/farcaster/neynar.ts` |
| User | getUserByFid | `src/lib/farcaster/neynar.ts` |
| User | getUsersByFids | `src/lib/farcaster/neynar.ts` |
| User | getUserByAddress | `src/lib/farcaster/neynar.ts` |
| User | searchUsers | `src/lib/farcaster/neynar.ts` |
| Social | getFollowers | `src/lib/farcaster/neynar.ts` |
| Social | getFollowing | `src/lib/farcaster/neynar.ts` |
| Social | getRelevantFollowers | `src/lib/farcaster/neynar.ts` |
| Social | followUser | `src/lib/farcaster/neynar.ts` |
| Social | unfollowUser | `src/lib/farcaster/neynar.ts` |
| Signer | createSigner | `src/lib/farcaster/neynar.ts` |
| Signer | registerSignedKey | `src/lib/farcaster/neynar.ts` |
| Signer | getSignerStatus | `src/lib/farcaster/neynar.ts` |
| Auth | registerUser | `src/lib/farcaster/neynar.ts` |
| Reaction | like | `src/app/api/neynar/like/route.ts` |
| Reaction | recast | `src/app/api/neynar/recast/route.ts` |
| Webhook | receive | `src/app/api/webhooks/neynar/route.ts` |
| Notification | send | `src/app/api/notifications/send/route.ts` |
| Search | searchCasts | `src/app/api/chat/search/route.ts` |

### Not Used - High Value for Community Hub (47 endpoints)

| Priority | Category | Endpoint | Why ZAO Needs It |
|----------|----------|----------|-----------------|
| **P0** | Notification | `fetchAllNotifications` | Full notification center in-app |
| **P0** | Notification | `fetchChannelNotificationsForUser` | /zao channel-specific alerts |
| **P0** | Notification | `markNotificationsAsSeen` | Read state management |
| **P0** | Block/Mute | `publishMute` + `publishBlock` | User safety controls |
| **P0** | Block/Mute | `fetchMuteList` + `fetchBlockList` | Settings page for managing blocks |
| **P1** | User | `getUserBestFriends` | Affinity-ranked community connections |
| **P1** | User | `fetchVerifications` | Show verified addresses on profiles |
| **P1** | User | `lookupUsersByXUsername` | Cross-platform identity matching |
| **P1** | User | `fetchUsersByLocation` | Member map (`src/components/social/MemberMap.tsx` exists) |
| **P1** | User | `updateUser` | Edit profile from within ZAO OS |
| **P1** | Cast | `fetchPopularCastsByUser` | Top 10 casts per member (engagement leaderboard) |
| **P1** | Cast | `lookupCastConversationSummary` | AI thread summaries (LLM-powered, free) |
| **P1** | Cast | `fetchCastQuotes` | Show who quoted a cast |
| **P1** | Cast | `fetchEmbeddedUrlMetadata` | Rich link previews |
| **P1** | Metric | `fetchCastMetrics` | Engagement data for curation |
| **P1** | Feed | `fetchFeedForYou` | Personalized "For You" feed (alternative to Sopha) |
| **P1** | Feed | `fetchPopularCastsByUser` | Highlight member's best content |
| **P1** | Feed | `fetchTrendingFeed` (channel mode) | Trending in /zao specifically |
| **P1** | Topic | `listTrendingTopics` | What the community is discussing |
| **P1** | Storage | `lookupUserStorageUsage` | Show storage in settings |
| **P1** | Storage | `buyStorage` | Buy more storage from within ZAO |
| **P1** | FName | `isFnameAvailable` | Username check during onboarding |
| **P1** | Subscription | `fetchSubscribedToForFid` | Detect Hypersub/Fabric subscribers |
| **P1** | Subscription | `fetchSubscribersForFid` | Who subscribes to ZAO |
| **P1** | Subscription | `fetchSubscriptionCheck` | Gate content by subscription |
| **P2** | Follow | `fetchFollowSuggestions` | Better suggestions than custom logic |
| **P2** | Follow | `fetchReciprocalFollowers` | Mutual follow detection |
| **P2** | Channel | `fetchTrendingChannels` | Discover relevant channels |
| **P2** | Channel | `fetchUsersActiveChannels` | Where ZAO members are active |
| **P2** | Channel | `fetchRelevantFollowersForAChannel` | Notable /zao followers |
| **P2** | Channel | `fetchUserChannelMemberships` | Which channels a member belongs to |
| **P2** | Channel | `searchChannels` | Channel discovery |
| **P2** | Cast | `deleteCast` | Let users delete own casts |
| **P2** | Cast | `fetchComposerActions` | Rich compose UI |
| **P2** | Reaction | `fetchCastReactions` | Show who liked/recasted |
| **P2** | Reaction | `fetchUserReactions` | User's reaction history |
| **P2** | Frame | `fetchFrameCatalog` | Mini app discovery feed |
| **P2** | Frame | `searchFrames` | Search mini apps |
| **P2** | Frame | `fetchRelevantFrames` | Recommended mini apps for user |
| **P3** | Token | `fetchUserBalance` | Show token balances by FID |
| **P3** | Token | `fetchTrendingFungibles` | Trending tokens in community |
| **P3** | Token | `fetchFungibleTrades` | Token activity feed |
| **P3** | Auth | `fetchNonce` | SIWN (Sign In With Neynar) |
| **P3** | Webhook | `publishWebhook` | Dynamic webhook management |
| **P3** | Action | `publishFarcasterAction` | Cross-client actions |
| **P3** | Frame | `publishFrameNotifications` | Push to mini app users |
| **P3** | Signer | `publishMessageToFarcaster` | Raw protocol message publishing |

### Farcaster Client API Features (Not in Neynar)

These require Ed25519 auth (see Doc 305):

| Feature | Endpoint | Status |
|---------|----------|--------|
| Channel bans | `POST /fc/channel-bans` | Researched in Doc 305 |
| Cast moderation | `POST /fc/moderated-casts` | Researched in Doc 305 |
| Pin casts | `PUT /fc/pinned-casts` | Researched in Doc 305 |
| Channel invites | `POST /fc/channel-invites` | Researched in Doc 305 |
| User blocking | `POST /fc/blocked-users` | Researched in Doc 305 |
| Account verifications | `GET /fc/account-verifications` | NEW - show X/GitHub/Discord on profiles |
| Creator rewards | `GET /v1/creator-rewards-winner-history` | NEW - surface in community |
| Developer rewards | `GET /v1/developer-rewards-winner-history` | NEW - surface in community |
| Starter pack members | `GET /fc/starter-pack-members` | NEW - for "Follow All ZAO" feature |
| Direct Cast intents | URL scheme: `farcaster.xyz/~/inbox/create/[fid]` | NEW - zero-code DM links |

## Comparison: What Makes a Great Farcaster Community Client

| Feature | Warpcast | Herocast | Supercast | ZAO OS (current) | ZAO OS (with gaps filled) |
|---------|----------|----------|-----------|-------------------|--------------------------|
| Feeds (home, trending, channel) | Full | Full | Full | Partial (channel + trending) | Full + "For You" + topic feeds |
| Notifications center | Full | Basic | Full | Send only, no read | Full (read, channel, mark-seen) |
| Mute/Block controls | Full | Full | Full | None | Full (mute + block + ban) |
| Channel moderation | Full (owner only) | Via Hats delegation | Limited | AI queue only | Protocol-level (Doc 305) |
| Creator rewards visibility | Built-in | None | None | None | Weekly winners on profiles |
| Account verifications | Built-in (X badge) | None | None | None | X/GitHub/Discord badges |
| Storage management | Built-in | None | None | None | Usage + buy UI |
| Subscriptions | Hypersub integration | None | None | None | Subscriber detection + gating |
| Profile editing | Full | Full | Full | None | Full via `updateUser` |
| Cast deletion | Built-in | Built-in | Built-in | None | `deleteCast` API |
| AI summaries | None | None | None | None | Thread summaries via Neynar |
| Community graph | None | None | None | Partial (force-directed) | Best friends + affinity + map |
| Music integration | None | None | None | Full (30+ components) | Full + cast metrics curation |
| XMTP messaging | None | None | None | Full (MLS groups) | Full + DC intents |
| Cross-posting | None | None | None | Full (5 platforms) | Full |

## Farcaster Pro & Creator Economy

### Farcaster Pro ($120/year)

| Feature | Standard | Pro |
|---------|----------|-----|
| Cast length | 1,024 characters | 10,000 characters |
| Embeds per cast | 2 | 4 |
| Custom banner | No | Yes |
| Purple badge | No | Yes |
| Price | Free | $120/year or 12,000 Warps |

**10,000 Pro subscriptions sold in under 6 hours** at launch (May 2025), generating $1.2M. 100% redistributed to weekly creator pools.

### Creator Rewards

- $25,000+ USDC distributed weekly across hundreds of creators
- Scoring: cube-root-of-active-followers (prevents gaming)
- Viewable via `GET /v1/creator-rewards-winner-history`

**ZAO integration:** Surface which ZAO members won creator rewards. Add to member profiles and community leaderboards.

## Direct Casts

Direct Casts are NOT part of the Farcaster protocol yet (planned for later 2026). Currently they're a Warpcast-only feature with a separate API (via Notion docs).

**ZAO's approach:** KEEP XMTP for private messaging (E2E encrypted, protocol-native). USE DC intent URLs (`https://farcaster.xyz/~/inbox/create/[fid]?text=gm`) as "Message on Farcaster" links on member profiles. Zero implementation effort.

## ZAO OS Integration: Priority Build Order

### Phase 1: Quick Wins (2-4 hours each, no new auth needed)

| Feature | Endpoint | Where in ZAO OS | Effort |
|---------|----------|-----------------|--------|
| Full notification center | `fetchAllNotifications` + `markNotificationsAsSeen` | New `/notifications` page | 4 hrs |
| Mute/block controls | `publishMute`, `publishBlock`, `fetchMuteList` | Settings page + user menu | 3 hrs |
| DC intent links | URL scheme | `src/components/social/FollowerCard.tsx` | 30 min |
| Trending topics | `listTrendingTopics` | `src/components/chat/ChatRoom.tsx` sidebar | 2 hrs |
| AI thread summaries | `lookupCastConversationSummary` | Cast thread view | 2 hrs |
| Cast deletion | `deleteCast` | Cast action menu | 1 hr |
| FName check | `isFnameAvailable` | Onboarding flow | 1 hr |
| Storage info | `lookupUserStorageUsage` | Settings page | 2 hrs |

### Phase 2: Profile Enrichment (3-6 hours each)

| Feature | Endpoint | Where in ZAO OS | Effort |
|---------|----------|-----------------|--------|
| Account verifications | `GET /fc/account-verifications` | `src/app/members/[username]/page.tsx` | 3 hrs |
| Best friends affinity | `getUserBestFriends` | Social graph + profile sidebar | 4 hrs |
| X username linking | `lookupUsersByXUsername` | Member profiles | 2 hrs |
| Popular casts | `fetchPopularCastsByUser` | Member profile "Best Casts" | 3 hrs |
| Creator rewards | Farcaster Client API + Neynar | Member profiles + leaderboard | 4 hrs |
| Cast metrics | `fetchCastMetrics` | Engagement stats on casts | 3 hrs |
| Edit profile | `updateUser` | Settings page | 4 hrs |
| Location map | `fetchUsersByLocation` | `src/components/social/MemberMap.tsx` | 3 hrs |

### Phase 3: Community Intelligence (4-8 hours each)

| Feature | Endpoint | Where in ZAO OS | Effort |
|---------|----------|-----------------|--------|
| Subscriptions detection | `fetchSubscribedToForFid` | Member badges + gated content | 6 hrs |
| "For You" feed | `fetchFeedForYou` | New feed tab | 4 hrs |
| Channel activity map | `fetchUsersActiveChannels` | Social graph | 4 hrs |
| Mini app discovery | `fetchFrameCatalog` + `searchFrames` | Ecosystem page | 4 hrs |
| Follow suggestions upgrade | `fetchFollowSuggestions` | `src/components/social/DiscoverPanel.tsx` | 3 hrs |
| Reciprocal followers | `fetchReciprocalFollowers` | "Mutual follows" badge | 2 hrs |
| Channel notifications | `fetchChannelNotificationsForUser` | Per-channel notification settings | 4 hrs |

### Phase 4: Channel Moderation (See Doc 305)

Requires Ed25519 App Key setup. Ban, hide, pin, invite, block at protocol level.

## What ZAO OS Already Does Better Than Any Farcaster Client

| Unique to ZAO OS | Description |
|-------------------|-------------|
| Music player (30+ components) | 9-platform player, crossfade, binaural beats, MediaSession |
| Respect-weighted curation | Community reputation affects content visibility |
| XMTP E2E messaging | Private DMs + group chat alongside public casts |
| Cross-platform publishing | Farcaster + X + Bluesky + Telegram + Discord |
| AI content moderation | Perspective API scoring with admin review queue |
| Gated community | Allowlist + NFT + Hats Protocol gates |
| Spaces (live audio) | Stream.io + 100ms with RTMP multistream |
| Governance (3-tier) | ZOUNZ on-chain + Snapshot polls + Community proposals |
| FISHBOWLZ | Token-gated rooms with Privy auth |

**The gap isn't in unique features - it's in protocol-native basics.** ZAO OS has killer features no other client has, but is missing standard Farcaster client capabilities like notifications, mute/block, storage management, and profile editing. Filling these gaps makes ZAO OS a complete client AND a unique community hub.

## Sources

- [Neynar API Complete Reference (llms.txt)](https://docs.neynar.com/llms.txt) - ~200 endpoints documented
- [Farcaster Client API Reference](https://docs.farcaster.xyz/reference/farcaster/api) - Protocol-level endpoints
- [Farcaster Developer Docs](https://docs.farcaster.xyz/reference/) - Full navigation
- [Farcaster Direct Casts Reference](https://docs.farcaster.xyz/reference/farcaster/direct-casts) - DC intent URLs
- [Farcaster Pro Launch (PANews)](https://www.panewslab.com/en/articles/1jgd4p4p) - $120/year, 10K chars, $25K weekly rewards
- [Farcaster Pro NFT Sale (DeepNewz)](https://deepnewz.com/startups/farcaster-sells-10000-pro-subscriptions-120-usdc-offering-nfts-raising-1-2-5069df0a) - 10K subs in 6 hours, $1.2M generated
- [Neynar Mutes, Blocks, Bans](https://docs.neynar.com/docs/mutes-blocks-and-bans) - Moderation system docs
- [Farcaster Protocol Spec](https://github.com/farcasterxyz/protocol) - Protocol-level reference
