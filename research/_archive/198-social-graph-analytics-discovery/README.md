# 198 — Social Graph Analytics & Discovery for Farcaster

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate APIs, tools, and patterns for social graph analytics and user discovery in ZAO OS
> **Related:** Doc 20 (followers/following feed), Doc 87 (social graph APIs), Doc 110 (community directory CRM), Doc 124 (Sopha curation), Doc 134/135 (reputation signals)

---

## Key Decisions / Recommendations

| Decision | Recommendation | Reason |
|----------|---------------|--------|
| **Primary social graph API** | USE Neynar v2 | Already integrated, bulk endpoints, viewer context, suggestions endpoint — no new dependency |
| **Reputation scoring** | ADD OpenRank API | Free, open-source, EigenTrust-based ranking, Neynar integration guides exist, on-chain scores on Base |
| **On-chain social graph** | DEFER Airstack | Powerful but adds a paid dependency — evaluate after OpenRank integration |
| **Community graph storage** | EXTEND Supabase caching | Already have `community-graph` route with 10-min cache — extend to 6-hour cron + persistent table |
| **Discovery algorithm** | USE OpenRank Personalized Graph + Neynar suggestions | Combine Neynar's "suggested users" with OpenRank's engagement-based personalized ranking |
| **Trending feeds** | USE Neynar trending + OpenRank channel rankings | Neynar provides trending casts; OpenRank provides channel-level user rankings |
| **Spam filtering** | USE Neynar `neynar_user_score` + OpenRank global rank | Already filter spam at score >= 0.55 in SocialPage — add OpenRank rank as secondary signal |
| **Graph visualization** | DEFER (low priority) | Current list-based CommunityGraph is sufficient — force-directed graph is cool but not critical |

---

## Comparison of Options

| Feature | Neynar v2 | OpenRank | Airstack |
|---------|-----------|----------|----------|
| **Type** | Managed Farcaster API | Open reputation protocol | Cross-chain data API (GraphQL) |
| **Free tier** | No free tier; Starter plan ~$59/mo (300 RPM) | Free / permissionless | Free tier available (reduced in 2024, check current) |
| **Rate limits** | Starter: 5 RPS / 300 RPM; Growth: 10 RPS; Scale: 20 RPS | Not publicly documented; appears permissionless | Varies by plan |
| **User profiles** | Full Farcaster user object (bio, pfp, follower count, power badge, viewer context) | FID-based scores only (no profile data) | Full profile + on-chain data (NFTs, POAPs, tokens) |
| **Social graph** | Followers, following, mutual follows, relevant followers | Personalized graph (follows + engagement), direct/extended network | SocialFollowers/SocialFollowings APIs + Onchain Graph |
| **Discovery** | `/user/suggestions`, `/followers/relevant`, user search | Global ranking, personalized engagement, channel rankings | FarScore sorting, user search with SCS ordering |
| **Reputation score** | `neynar_user_score` (0-1, experimental) | EigenTrust-based score (follows + recasts + mentions + replies), on-chain on Base | FarScore (dynamic, ever-increasing), FarBoost, Cast Score |
| **Trending** | `/feed/trending` (casts), channel trending | Channel trending feeds, top engagement profiles | Trending Casts API with Social Capital Value |
| **On-chain data** | Verified addresses, custody address | Scores available on Base (weekly updates) | Full on-chain: NFTs, ERC-20, POAPs, ENS, cross-chain |
| **SDK** | `@neynar/nodejs-sdk` (already in ZAO OS) | `openrank-sdk` (npm), REST API | `@airstack/airstack-react`, `@airstack/node` |
| **Next.js integration** | Direct fetch to REST endpoints | REST API + SDK | GraphQL client + React hooks |
| **Relevance to ZAO** | **Critical** — already the foundation | **High** — adds quality ranking we lack | **Medium** — powerful but overlaps with Neynar for social |

---

## What's Already Built in ZAO OS

### Components (9 files in `src/components/social/`)

| File | What It Does | Status |
|------|-------------|--------|
| `SocialPage.tsx` | Main `/social` page — 4 tabs (Followers, Following, Community, Discover), search, sort (Recent/Relevant/Popular/Mutual/ZAO), advanced filters (power badge, min followers, ZAO-only, mutual-only, has bio, hide spam), virtual scrolling | **Complete** |
| `DiscoverPanel.tsx` | Discover tab — 3 sub-tabs (For You, ZAO Members, Search), horizontal scroll of unfollowed ZAO members, Neynar suggestions, Farcaster user search, follow buttons | **Complete** |
| `CommunityGraph.tsx` | Community tab — shows all ZAO members with connection stats (mutuals, community followers/following), sort by mutuals/community followers/total followers/ZID, click-to-select shows mutual connections, graph density stats | **Complete** |
| `FollowerCard.tsx` | Individual user card — pfp with relationship ring (green = mutual), ZAO badge, OG badge, power badge, follow/unfollow toggle, bio, follower count | **Complete** |
| `ShareToFarcaster.tsx` | Universal share button — Mini App compose or direct Neynar post | **Complete** |
| `FollowerSkeleton.tsx` | Loading skeleton for follower lists | **Complete** |
| `MiniSpaceBanner.tsx` | Live audio room banner on social page | **Complete** |
| `CastActionBar.tsx` | Cast action buttons (like, recast, share) | **Complete** |
| `SocialIcons.tsx` | Social platform icons | **Complete** |

### API Routes (4 routes)

| Route | What It Does |
|-------|-------------|
| `src/app/api/social/community-graph/route.ts` | Builds full community graph: fetches all ZAO members from Supabase, does N bulk Neynar lookups with viewer context, computes connections/mutuals/density, caches 10 minutes in memory |
| `src/app/api/social/suggestions/route.ts` | Combines Neynar `/user/suggestions` with unfollowed ZAO members, enriches with ZAO membership |
| `src/app/api/users/[fid]/followers/route.ts` | Paginated followers with sort (algorithmic/chronological), enriched with ZAO membership + ZID |
| `src/app/api/users/[fid]/following/route.ts` | Same as followers but for following list |

### What Works Well

1. **Rich filtering** — power badge, spam score, min followers, ZAO-only, mutual-only, has bio (more filters than any Farcaster client)
2. **Community graph** — unique feature showing intra-community connections with density metrics
3. **Virtual scrolling** — handles large lists efficiently with `@tanstack/react-virtual`
4. **ZAO context enrichment** — every user is enriched with ZAO membership status and ZID

### What's Missing

1. **No reputation/quality scoring** — relies only on Neynar's experimental `neynar_user_score` (binary spam filter at 0.55)
2. **No engagement analytics** — no data on who engages with your casts, who you interact with most
3. **No trending content** — no trending casts or trending users feed
4. **No "who to follow" algorithm** — Neynar suggestions are generic, not ZAO-context-aware
5. **No channel-based discovery** — doesn't surface active users in ZAO channels
6. **Graph cache is in-memory** — lost on server restart, no persistence
7. **No on-chain social signals** — doesn't use shared NFTs, tokens, or POAP attendance as connection signals
8. **No profile analytics** — members can't see their engagement metrics or growth over time

---

## API Capabilities Deep Dive

### Neynar v2 (Already Integrated)

**Discovery endpoints currently used:**
- `GET /v2/farcaster/user/suggestions?fid={fid}&limit=20` — generic follow suggestions
- `GET /v2/farcaster/user/bulk?fids={csv}&viewer_fid={fid}` — bulk profile + viewer context
- `GET /v2/farcaster/followers?fid={fid}&sort_type={algorithmic|desc_chron}` — paginated followers
- `GET /v2/farcaster/following?fid={fid}&sort_type={algorithmic|desc_chron}` — paginated following

**Discovery endpoints NOT yet used:**
- `GET /v2/farcaster/followers/relevant?target_fid={fid}&viewer_fid={fid}` — "followed by people you know" (social proof). Returns `top_relevant_followers_hydrated` + `all_relevant_followers_dehydrated`. **High value for ZAO.**
- `GET /v2/farcaster/feed/trending?time_window={1h|6h|24h}&provider={openrank|neynar}` — trending casts with OpenRank or Neynar ranking. Can filter by `channel_id`.
- `GET /v2/farcaster/channel/members?channel_id={id}` — all members of a channel (useful for ZAO channel activity).
- `GET /v2/farcaster/user/search?q={query}&viewer_fid={fid}` — user search with viewer context.
- `GET /v2/farcaster/user/power_lite` — lightweight power user check.

**Data already available in user objects but unused:**
- `registered_at` — FID registration timestamp (account age)
- `profile.location` — user location data
- `verified_accounts` — linked X/GitHub accounts
- `active_status` — whether user is active
- `notes` — Farcaster Notes (long-form)

### OpenRank (New — Recommended Addition)

**Base URL:** `https://graph.cast.k3l.io`

**Global Profile Ranking:**
- `GET /scores/global/engagement/rankings` — all Farcaster users ranked by engagement score
- `GET /scores/global/engagement/fids?fids={csv}` — engagement scores for specific FIDs
- Weight formula: Likes=1, Replies=6, Recasts=3, Mentions=12, Follows=1
- Updated every 2 hours

**Personalized Network:**
- `GET /scores/personalized/engagement/fids?fids={csv}&k={depth}&limit={n}` — engagement-weighted ranking personalized to a specific user
- Direct network (1-hop: who you follow) vs Extended network (2-hop: friends of friends)
- Served on-demand (not pre-computed)

**Channel Rankings:**
- `GET /channels/{channel_id}/rankings` — top users in a specific channel
- Directly useful for ranking ZAO channel participants

**On-Chain Scores:**
- OpenRank scores available on Base chain (updated weekly)
- Contract for reading scores on-chain — useful for future on-chain gating

**Integration with Neynar:**
- OpenRank provides official guides for combining with Neynar:
  - "Build User Search" — Neynar search results re-ranked by OpenRank
  - "Build For You Feeds" — Neynar feed + OpenRank personalized engagement
  - "Build Channel Trending" — Neynar channel feed + OpenRank channel rankings

### Airstack (Deferred)

**GraphQL endpoint:** `https://api.airstack.xyz/gql`

**Unique capabilities not available in Neynar/OpenRank:**
- **Onchain Graph** — recommends contacts based on shared NFTs, POAPs, token transfers, and Lens/Farcaster follows. Strength-of-relationship scoring across all on-chain activity.
- **FarScore (Social Capital Score)** — dynamic influence score for every Farcaster user. Different methodology from OpenRank (on-chain criteria vs. engagement actions).
- **Cast Score (Social Capital Value)** — quality score per individual cast.
- **Cross-chain queries** — single query across Ethereum, Base, Optimism, Polygon for NFTs, tokens, POAPs.
- **Token gating queries** — "does this user hold X NFT?" in a single GraphQL call.
- **Common connections** — find shared NFTs, POAPs, or token holdings between two users.

**When to add Airstack:**
- When building on-chain profile enrichment (Doc 135)
- When implementing music NFT collecting (Doc 155) and want to show "collectors in common"
- When community grows beyond ZAO allowlist and needs broader discovery

---

## Reference Implementations

| Project | License | Key Files/Patterns | What to Learn |
|---------|---------|-------------------|---------------|
| **Herocast** (hero-org/herocast) | MIT | Multi-account, analytics, command palette, scheduled posts | Desktop power-user UX, keyboard-first navigation, multi-account social graph |
| **Opencast** (stephancill/opencast) | MIT | Self-hostable Twitter-style client | Full Farcaster client reference, feed rendering, user profiles |
| **Recaster** | Closed | Configurable home tabs, OpenRank/Airstack integration | How to integrate OpenRank + Airstack as ranking providers |
| **Eigencaster** | Open | OpenRank-powered feed ranking | Reference implementation for OpenRank feed integration |
| **Sonata** | MIT | Music discovery on Farcaster | Music-specific social discovery patterns |
| **Sopha** (sopha.social) | Closed | Curation-focused client, topic-based filtering | "Deep social" curation UX, quality over quantity |
| **Neynar + OpenRank guides** | Docs | docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip | Step-by-step integration: user search, For You feeds, channel trending |

---

## ZAO OS Integration Plan

### Phase 1: OpenRank Integration (2-3 days)

**Priority: HIGH** — adds quality ranking with no cost.

| Task | File(s) | Description |
|------|---------|-------------|
| Add OpenRank client | `src/lib/openrank/client.ts` (new) | REST client for OpenRank API. Functions: `getGlobalEngagementScores(fids)`, `getPersonalizedScores(viewerFid, fids)`, `getChannelRankings(channelId)` |
| Enrich suggestions with OpenRank | `src/app/api/social/suggestions/route.ts` | After Neynar suggestions, fetch OpenRank scores for all FIDs, re-rank by combined score (Neynar suggestion order + OpenRank engagement) |
| Add OpenRank to community graph | `src/app/api/social/community-graph/route.ts` | Fetch OpenRank scores for all members, add `engagementScore` to each node, sort by engagement as new option |
| Add "Engagement" sort option | `src/components/social/SocialPage.tsx` | New sort tab: "Engagement" — sorts by OpenRank score |
| Display engagement score on cards | `src/components/social/FollowerCard.tsx` | Show engagement score badge (e.g., top 10% indicator) |

### Phase 2: Relevant Followers + Trending (1-2 days)

**Priority: HIGH** — uses existing Neynar endpoints we already pay for.

| Task | File(s) | Description |
|------|---------|-------------|
| Add relevant followers API | `src/app/api/users/[fid]/relevant-followers/route.ts` (new) | Call Neynar `/followers/relevant` — "followed by people you know" |
| Add "People You May Know" section | `src/components/social/DiscoverPanel.tsx` | New section in For You tab showing relevant followers with social proof ("Followed by @alice and 3 others") |
| Add trending casts API | `src/app/api/social/trending/route.ts` (new) | Call Neynar `/feed/trending?provider=openrank&channel_id=zao` for ZAO channel trending |
| Add Trending tab | `src/components/social/SocialPage.tsx` | 5th tab: "Trending" — trending casts in ZAO channels |

### Phase 3: Persistent Graph + Analytics (2-3 days)

**Priority: MEDIUM** — improves reliability and adds member-facing analytics.

| Task | File(s) | Description |
|------|---------|-------------|
| Create `social_graph_cache` table | `supabase/migrations/` (new) | Store graph data in Supabase instead of in-memory cache. Schema: `fid`, `connections`, `openrank_score`, `neynar_score`, `updated_at` |
| Add cron job for graph refresh | `src/app/api/cron/social-graph/route.ts` (new) | Vercel Cron or Supabase Edge Function to rebuild graph every 6 hours |
| Member analytics dashboard | `src/components/social/AnalyticsPanel.tsx` (new) | Show member their: follower growth (7d/30d), engagement score trend, most active mutuals, community rank |
| Channel activity rankings | `src/components/social/ChannelActivity.tsx` (new) | Show most active members in each ZAO channel using OpenRank channel rankings |

### Phase 4: On-Chain Social Signals (Future)

**Priority: LOW** — requires Airstack or custom indexing.

| Task | Description |
|------|-------------|
| Shared NFT connections | "You and @alice both collect music from @artist" — requires Airstack Onchain Graph |
| POAP co-attendance | "You both attended ETHDenver 2026" — requires Airstack POAP queries |
| Token-gated discovery | "Other ZOUNZ NFT holders" — can do with existing Alchemy/Supabase data |
| Cross-platform social graph | Import Lens/Bluesky follows to find Farcaster accounts — requires Airstack cross-protocol queries |

### Priority Order

1. **OpenRank integration** — free, no new dependency cost, immediate quality improvement
2. **Relevant followers + trending** — uses Neynar endpoints we already pay for
3. **Persistent graph + analytics** — better reliability + member-facing value
4. **On-chain social signals** — defer until music NFTs are live (Doc 155)

---

## Sources

- [Neynar API Quickstart](https://docs.neynar.com/reference/quickstart)
- [Neynar Rate Limits & Credits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis)
- [Neynar Trending Feed with External Providers](https://docs.neynar.com/docs/trending-feed-w-external-providers)
- [OpenRank Farcaster Integration](https://docs.openrank.com/integrations/farcaster)
- [OpenRank Ranking Strategies on Farcaster](https://docs.openrank.com/integrations/farcaster/ranking-strategies-on-farcaster)
- [OpenRank + Neynar: Build User Search](https://docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip/build-user-search-using-neynar-and-openranks-global-ranking-api)
- [OpenRank + Neynar: Build For You Feeds](https://docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip/build-for-you-feeds-for-your-client-using-neynar-and-openrank)
- [OpenRank + Neynar: Build Channel Trending](https://docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip/build-channel-trending-feeds-for-your-client-using-neynar-and-openrank-apis)
- [OpenRank Channel User Rankings](https://docs.openrank.com/integrations/farcaster/channel-user-rankings)
- [OpenRank Top Profiles (Engagement)](https://docs.openrank.com/integrations/farcaster/global-profile-ranking/top-profiles-based-on-engagement)
- [OpenRank On-Chain Scores](https://docs.openrank.com/integrations/farcaster/openrank-scores-onchain)
- [OpenRank Ideas to Build](https://docs.openrank.com/integrations/farcaster/ideas-to-build-using-openrank-apis)
- [Airstack Social Capital / FarScore](https://docs.airstack.xyz/airstack-docs-and-faqs/social-capital-value-and-social-capital-scores)
- [Airstack Onchain Graph](https://docs.airstack.xyz/airstack-docs-and-faqs/guides/onchain-graph)
- [Airstack Search Farcaster Users](https://docs.airstack.xyz/airstack-docs-and-faqs/farcaster/farcaster/search-farcaster-users)
- [Airstack Farcaster Casts](https://docs.airstack.xyz/airstack-docs-and-faqs/farcaster/farcaster/farcaster-casts)
- [Herocast GitHub](https://github.com/hero-org/herocast)
- [a16z Awesome Farcaster](https://github.com/a16z/awesome-farcaster)
- [Neynar Username Search Recommendation](https://docs.neynar.com/docs/implementing-username-search-suggestion-in-your-farcaster-app)
- [Neynar Pricing](https://dev.neynar.com/pricing)
