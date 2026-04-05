# 199 — Advanced Social Graph Features: Visualization, Growth Tracking, Influence Mapping

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate advanced social graph features beyond basic followers/discovery — unfollower tracking, force-directed visualization, growth analytics, conversation clustering, and influence mapping
> **Related:** Doc 198 (social graph analytics foundation), Doc 20 (followers/following feed), Doc 87 (social graph APIs), Doc 110 (community directory CRM), Doc 134/135 (reputation signals)
> **Builds on:** Doc 198 covered Neynar v2 + OpenRank + Airstack comparison and a 4-phase integration plan. This doc extends into advanced features that 198 deferred or did not cover.

---

## Recommendations Table

| Feature | Priority | Effort | Recommendation | Reason |
|---------|----------|--------|---------------|--------|
| **Unfollower tracker** | BUILD NOW | 2-3 days | Snapshot follower FIDs in Supabase daily, diff to detect unfollows | Neynar webhooks support follow events; daily cron + diff is simpler and more reliable than real-time |
| **Force-directed community graph** | BUILD NOW | 2-3 days | Use `react-force-graph-2d` to replace list-based CommunityGraph | WebGL rendering handles 40+ ZAO members easily; react-force-graph has native React support, 2D/3D/VR modes |
| **Growth analytics dashboard** | BUILD NOW | 2-3 days | Add follower count history table + sparkline charts in SocialAnalytics | Store daily snapshots via cron; display 7d/30d/90d growth with `recharts` (already in bundle) |
| **Influence mapping (OpenRank channel)** | BUILD SOON | 3-5 days | Overlay OpenRank channel scores onto force graph; color/size nodes by influence | OpenRank channel rankings API is free; ZAO already has `getChannelRankings()` in `src/lib/openrank/client.ts` |
| **Conversation clustering** | BUILD SOON | 5-7 days | Group ZAO members by channel activity overlap and interaction frequency | Requires new API route to fetch cast activity per member, then compute co-occurrence matrix |
| **Who unfollowed you notifications** | BUILD SOON | 2-3 days | Push notification when unfollower detected, integrated with existing notification system | Depends on unfollower tracker cron being built first |
| **Social graph export** | BUILD LATER | 1-2 days | Export connections as JSON/CSV for portability | Low priority but aligns with web3 data ownership ethos |
| **Cross-protocol graph merge** | BUILD LATER | 5-7 days | Merge Farcaster + Lens + Bluesky social graphs via Airstack | Requires Airstack integration (paid); defer until cross-posting is mature |
| **Engagement decay tracking** | BUILD LATER | 3-5 days | Track which followers stopped engaging (ghost followers) | Needs cast-level interaction history, heavy on API calls |

---

## What's Already Built (Baseline from Doc 198)

ZAO OS has 9 social components, 4 API routes, and 3 external integrations:

| Component | Key Capabilities |
|-----------|-----------------|
| `SocialPage.tsx` | 5 tabs (Followers, Following, Community, Analytics, Discover), 6 sort modes, 6 advanced filters, virtual scrolling |
| `SocialAnalytics.tsx` | Network stats (follower/following counts, ratio, ZAO %, mutuals, power badge %), top engaged followers by `neynar_user_score`, /thezao channel rankings via OpenRank |
| `CommunityGraph.tsx` | List-based view of all ZAO members with connection stats, sort by mutuals/community followers/total followers/ZID, click-to-select shows mutual connections, density metric |
| `DiscoverPanel.tsx` | 3 sub-tabs (For You, ZAO Members, Search), Neynar suggestions + unfollowed ZAO members, Farcaster user search |
| `src/lib/openrank/client.ts` | `getEngagementScores()`, `getPersonalizedScores()`, `getChannelRankings()` — all already implemented |

**Key gap:** No historical data. Everything is a point-in-time snapshot. No growth tracking, no unfollower detection, no engagement trends.

---

## 1. Unfollower Tracking

### How Hatecast Does It

[Hatecast](https://github.com/mattwelter/hatecast) is the only known Farcaster unfollower tracker. Built with Next.js + TypeScript + Tailwind CSS. It snapshots a user's follower list and diffs against previous snapshots to detect unfollows. Roadmap includes "Most unfollowed in past 24h/7d/28d" trending.

### Recommended Approach for ZAO OS

**Strategy:** Daily cron job snapshots all follower FIDs into a Supabase table. A diff query detects new unfollows.

```
Table: follower_snapshots
- id (uuid, PK)
- fid (int, the user being tracked)
- follower_fids (int[], array of all follower FIDs)
- snapshot_date (date)
- created_at (timestamptz)

Table: unfollow_events
- id (uuid, PK)
- user_fid (int, who lost the follower)
- unfollower_fid (int, who unfollowed)
- detected_at (timestamptz)
- notified (boolean, default false)
```

**Neynar webhook alternative:** Neynar supports fine-grained webhooks for Farcaster events including follows. You could subscribe to `follow.created` and `follow.deleted` events. However, webhook reliability for unfollows is uncertain (Farcaster protocol treats links as append-only with remove messages). The cron approach is more reliable for a community of 40 members.

**API cost:** Fetching followers for 40 members = 40 Neynar API calls per day (well within rate limits at 300 RPM on Starter plan).

**Integration points:**
- New cron route: `src/app/api/cron/follower-snapshot/route.ts`
- New API route: `src/app/api/social/unfollowers/route.ts`
- UI in: `src/components/social/SocialAnalytics.tsx` (new "Unfollowers" section)

---

## 2. Graph Visualization Libraries Comparison

### Detailed Comparison

| Library | Rendering | Max Nodes | React Integration | Bundle Size | Best For |
|---------|-----------|-----------|-------------------|-------------|----------|
| **react-force-graph-2d** | Canvas/WebGL | 5,000-10,000+ | Native React component | ~150 KB | Small-medium graphs with interactivity; 2D/3D/VR modes |
| **@react-sigma/core** (v5) | WebGL (sigma.js v2) | 10,000-100,000+ | Native React hooks/components | ~200 KB | Large-scale graphs; best WebGL performance |
| **d3-force** | SVG (default) or Canvas | ~500 (SVG), ~5,000 (Canvas) | Wrapper needed (react-d3-graph) | ~30 KB (force module only) | Custom visualizations with full control |
| **vis.js** | Canvas | ~5,000 | Thin wrapper (react-vis-network) | ~400 KB | Clustering, Gephi import, timeline graphs |
| **G6/Graphin** | Canvas | ~10,000 | Graphin React wrapper | ~500 KB+ | Feature-rich (minimap, time bar), but docs partly in Chinese |
| **cytoscape.js** | SVG/Canvas | ~10,000 | react-cytoscapejs wrapper | ~300 KB | Scientific/biological networks, rich layout algorithms |

### Recommendation: **react-force-graph-2d**

For ZAO OS with ~40 members and ~200-400 connections:

1. **Native React** — no wrapper indirection, works with Next.js dynamic import (`ssr: false`)
2. **Perfect scale** — 40 nodes is trivial; library handles up to 10K+ nodes
3. **Interactive** — built-in zoom, pan, node drag, hover tooltips, click events
4. **Multi-mode** — same data model renders in 2D, 3D, VR, and AR
5. **Active maintenance** — v1.29.1, by Vasco Asturiano, 900+ GitHub stars, weekly npm downloads ~15K
6. **Small bundle** — ~150 KB vs sigma.js ~200 KB or G6 ~500 KB+

**When to upgrade to @react-sigma/core:** If community grows beyond 500 members or you need WebGL-accelerated rendering for dense graphs. Sigma.js v2 with graphology data layer is the performance king for large networks.

**Install:** `npm i react-force-graph-2d`

**Data format:** `{ nodes: [{ id, name, val, color }], links: [{ source, target }] }` — maps directly to the `MemberNode` and `Connection` types already in `CommunityGraph.tsx`.

---

## 3. Growth Analytics Approaches

### Comparison of Analytics Approaches

| Approach | Data Source | Storage | Refresh | Complexity |
|----------|-----------|---------|---------|------------|
| **A: Daily cron snapshot** | Neynar `/user/bulk` for all ZAO members | Supabase `member_stats_history` table | Every 24h via Vercel Cron | Low — 1 API call per member per day |
| **B: Neynar webhook stream** | Neynar webhooks for follow events | Supabase increment/decrement counters | Real-time | Medium — webhook setup, delivery reliability |
| **C: OpenRank score history** | OpenRank `/scores` endpoint | Supabase `openrank_history` table | Every 2h (match OpenRank refresh) | Low — single batch POST |
| **D: Hub-level indexing** | Direct Farcaster Hub gRPC | Custom indexer + PostgreSQL | Continuous | High — run your own Hub or use Shuttle |

### Recommendation: **Approach A + C combined**

- **Daily snapshot** captures: `follower_count`, `following_count`, `neynar_user_score`, `power_badge` status
- **OpenRank history** captures: engagement score, channel rank, percentile
- Both stored in Supabase with `(fid, date)` composite key
- UI renders sparkline charts using recharts (already a dependency)

**Schema:**

```sql
CREATE TABLE member_stats_history (
  fid          INT NOT NULL,
  snapshot_date DATE NOT NULL,
  follower_count INT,
  following_count INT,
  neynar_score   FLOAT,
  power_badge    BOOLEAN,
  openrank_score FLOAT,
  channel_rank   INT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (fid, snapshot_date)
);
```

**Metrics to display:**
- Follower growth: +/- count over 7d, 30d, 90d
- Growth rate: % change per period
- OpenRank score trend: sparkline showing engagement quality over time
- Channel rank movement: up/down arrows with delta
- Community comparison: "Your growth vs ZAO average"

**Integration points:**
- New cron route: `src/app/api/cron/member-stats/route.ts`
- Extend: `src/components/social/SocialAnalytics.tsx` (add growth sparklines)
- New component: `src/components/social/GrowthChart.tsx`

---

## 4. Farcaster Analytics Ecosystem

9 analytics tools exist in the Farcaster ecosystem as of March 2026:

| Tool | Features | Pricing | Relevance to ZAO |
|------|---------|---------|------------------|
| **Farcaster Studio** | User stats, channel insights, growth tools | Free + $14/mo paid | Medium — general analytics, not community-specific |
| **CastSense** | User + channel analytics, engagement trends, follower activity | Free | High — closest to what we want in SocialAnalytics |
| **Farcaster Network** | Network-wide dashboard, health metrics | Free | Low — macro metrics, not per-user |
| **Trendcaster** | Global trends, popular topics, cast volume | Free | Medium — trend detection |
| **Farcaster Hot 100** | Trending accounts, influential voices | Free | Low — already have OpenRank channel rankings |
| **Farcaster User Stats** | Profile analytics, follower growth, engagement, content performance | Free | High — reference for growth tracking UI |
| **Casterscan** | Block explorer for Farcaster transactions | Free | Low — developer tool |
| **Farcarte** | World map of Hub locations | Free | Low — infrastructure tool |
| **Dune Dashboards** | Custom SQL analytics on Farcaster data | Free (Dune account) | Medium — good for one-off analysis, not real-time |

**Key insight:** None of these tools offer community-scoped analytics. ZAO OS's analytics are unique because they focus on intra-community metrics (ZAO member %, mutual connections within the community, channel rankings). Building our own growth tracking is the right approach.

---

## 5. Conversation Clustering & Interest Mapping

### Approach

Group ZAO members by their interaction patterns and channel activity to surface interest clusters (e.g., "beat producers", "vocalists", "governance enthusiasts").

**Data pipeline:**
1. For each ZAO member, fetch their recent casts (Neynar `/feed/user/{fid}`)
2. Extract channels they post in and users they reply to
3. Build a co-occurrence matrix: members who post in the same channels / reply to each other
4. Apply simple clustering (k-means or community detection via Louvain algorithm)
5. Label clusters by dominant channel names

**Simpler MVP approach:**
- Skip NLP topic modeling entirely
- Group by **channel activity overlap**: members active in the same Farcaster channels are in the same cluster
- Display as colored groups in the force-directed graph

**API endpoints needed:**
- Neynar: `GET /v2/farcaster/feed/user/{fid}?limit=50` — recent casts per member
- Neynar: `GET /v2/farcaster/channel/members?channel_id=thezao` — channel membership

**Integration points:**
- New API route: `src/app/api/social/clusters/route.ts`
- Enhance: force-directed graph with color-coded cluster groups
- New component: `src/components/social/InterestClusters.tsx`

---

## 6. Influence Mapping with OpenRank

### What's Available Now

ZAO OS already has `getChannelRankings('thezao')` returning top users with scores. The `SocialAnalytics` component displays top 5 channel rankings.

### What to Add

**Influence overlay on force graph:**
- Node size = OpenRank engagement score (higher score = larger node)
- Node color = channel rank bracket (gold for top 5, silver for top 10, bronze for top 20)
- Edge thickness = interaction frequency between two members

**Specific OpenRank endpoints:**

| Endpoint | URL | What It Returns | Update Frequency |
|----------|-----|-----------------|-----------------|
| Global engagement scores | `POST https://graph.cast.k3l.io/scores` | Score per FID (0-1 range) | Every 2 hours |
| Personalized scores | `POST https://graph.cast.k3l.io/scores/personalized/{fid}` | Engagement scores relative to a specific user | On-demand |
| Channel rankings | `GET https://graph.cast.k3l.io/channels/rankings/{channelId}` | Top users in a channel with rank + score | Every 2 hours |
| Personalized popular casts | `POST https://graph.cast.k3l.io/casts/personalized/popular` | Trending casts personalized to viewer | On-demand |

**Weight formula:** Likes = 1x, Replies = 6x, Recasts = 3x, Mentions = 12x, Follows = 1x

**Integration points:**
- Extend: `src/lib/openrank/client.ts` (already has all 3 needed functions)
- Extend: new `ForceGraphView.tsx` component with OpenRank data overlay
- Extend: `src/components/social/SocialAnalytics.tsx` (add influence section)

---

## 7. Implementation Architecture

### New Files Needed

| File | Purpose | Priority |
|------|---------|----------|
| `src/components/social/ForceGraphView.tsx` | react-force-graph-2d visualization with OpenRank overlay | BUILD NOW |
| `src/components/social/GrowthChart.tsx` | Sparkline charts for follower/score growth over time | BUILD NOW |
| `src/components/social/UnfollowerList.tsx` | List of recent unfollowers with timestamps | BUILD NOW |
| `src/app/api/cron/follower-snapshot/route.ts` | Daily cron to snapshot follower FIDs for all ZAO members | BUILD NOW |
| `src/app/api/cron/member-stats/route.ts` | Daily cron to snapshot follower counts + OpenRank scores | BUILD NOW |
| `src/app/api/social/unfollowers/route.ts` | GET unfollowers for a user over a time range | BUILD NOW |
| `src/app/api/social/growth/route.ts` | GET growth stats (follower history, score trends) | BUILD NOW |
| `src/app/api/social/clusters/route.ts` | GET interest clusters based on channel co-occurrence | BUILD SOON |
| `src/components/social/InterestClusters.tsx` | Visual display of member interest groups | BUILD SOON |
| `supabase/migrations/xxx_social_graph_history.sql` | Tables for follower_snapshots, unfollow_events, member_stats_history | BUILD NOW |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/social/CommunityGraph.tsx` | Replace list view with `ForceGraphView` (dynamic import, ssr: false) |
| `src/components/social/SocialAnalytics.tsx` | Add growth sparklines, unfollower section, influence map |
| `src/components/social/SocialPage.tsx` | No changes needed — existing 5 tabs accommodate all new features |
| `vercel.json` | Add cron schedules for daily snapshots |

### Data Flow

```
Daily Cron (Vercel)
  -> /api/cron/member-stats
  -> Neynar /user/bulk (40 members)
  -> OpenRank /scores (40 FIDs)
  -> Supabase member_stats_history INSERT

Daily Cron (Vercel)
  -> /api/cron/follower-snapshot
  -> Neynar /followers (per member, paginated)
  -> Supabase follower_snapshots INSERT
  -> Diff vs yesterday -> unfollow_events INSERT
  -> Notification trigger
```

---

## 8. Key Numbers

- **40 ZAO members** currently — all graph features scale easily at this size
- **~200-400 connections** between members (based on existing community-graph density metric)
- **300 RPM** Neynar rate limit on Starter plan — daily cron for 40 members uses ~80 calls (well under limit)
- **2-hour refresh** on OpenRank global scores — no point polling more frequently
- **150 KB** bundle size for react-force-graph-2d — acceptable with dynamic import
- **9 Farcaster analytics tools** exist, but none offer community-scoped analytics
- **6x weight** on replies in OpenRank's EigenTrust formula — replies are the strongest engagement signal
- **$0 additional cost** — OpenRank is free, Neynar calls fit within existing plan, Supabase storage is minimal

---

## Sources

- [Hatecast — Farcaster Unfollower Tracker (GitHub)](https://github.com/mattwelter/hatecast)
- [react-force-graph — React component for 2D/3D/VR force graphs (GitHub)](https://github.com/vasturiano/react-force-graph)
- [@react-sigma/core — React Sigma.js v5 (npm)](https://www.npmjs.com/package/@react-sigma/core)
- [Comparison of JavaScript Graph Visualization Libraries (Cylynx)](https://www.cylynx.io/blog/a-comparison-of-javascript-graph-network-visualisation-libraries/)
- [Best Libraries for Large Force-Directed Graphs (Medium)](https://weber-stephen.medium.com/the-best-libraries-and-methods-to-render-large-network-graphs-on-the-web-d122ece2f4dc)
- [OpenRank Farcaster Integration](https://docs.openrank.com/integrations/farcaster)
- [OpenRank Channel User Rankings](https://docs.openrank.com/integrations/farcaster/channel-user-rankings)
- [OpenRank Ranking Strategies on Farcaster](https://docs.openrank.com/integrations/farcaster/ranking-strategies-on-farcaster)
- [OpenRank + Neynar: Build For You Feeds](https://docs.openrank.com/integrations/farcaster/neynar-x-openrank-guides-wip/build-for-you-feeds-for-your-client-using-neynar-and-openrank)
- [Neynar User Quality Score](https://docs.neynar.com/docs/neynar-user-quality-score)
- [Neynar Scores: Tackling Onchain Reputation](https://neynar.com/blog/neynar-scores-under-the-hood)
- [Neynar Webhooks via Convoy (Customer Story)](https://www.getconvoy.io/blog/neynar-customer-story)
- [Neynar: Unfollowing Inactive Users with SDK](https://docs.neynar.com/docs/unfollowing-inactive-farcaster-users-with-neynar-sdk)
- [Neynar: Fetch Mutual Follows/Followers](https://docs.neynar.com/docs/how-to-fetch-mutual-followfollowers-in-farcaster)
- [Top Farcaster Analytics Tools (PERCS / Medium)](https://medium.com/percs/top-farcaster-analytics-tools-3c150db2f908)
- [CastSense — Farcaster User Analytics (ETHGlobal)](https://ethglobal.com/showcase/castsense-oz4tw)
- [Farcaster Social Graph (GitHub — nounder)](https://github.com/nounder/farcaster-social-graph)
- [Farcaster vs Lens: The $2.4B Battle for Web3's Social Graph (BlockEden)](https://blockeden.xyz/blog/2026/01/13/farcaster-vs-lens-socialfi-web3-social-graph/)
- [Niche Farcaster Channels for High-Value Leads (2026)](https://www.influencers-time.com/niche-farcaster-channels-a-2026-playbook-for-high-value-leads/)
- [Dune Farcaster Dashboard](https://dune.com/pixelhack/farcaster)
- [a16z Awesome Farcaster](https://github.com/a16z/awesome-farcaster)
