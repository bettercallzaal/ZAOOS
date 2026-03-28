# 20 — Followers / Following Feed (Sortable, Filterable)

> **Status:** Research complete
> **Goal:** Build the best followers/following experience in any Farcaster client — sortable, filterable, enriched with ZAO context
> **Gap:** No existing Farcaster client (Warpcast, Herocast, Supercast) offers sorting or filtering on followers/following lists. This is a genuine differentiator.

---

## Neynar API Endpoints

### GET `/v2/farcaster/followers`

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `fid` | int | Yes | Target user's FID |
| `viewer_fid` | int | No | Adds `viewer_context` (mutual follow, muted, blocked) |
| `sort_type` | string | No | `desc_chron` (default) or `algorithmic` |
| `limit` | int | No | 1–100, default 20 |
| `cursor` | string | No | Pagination token |

### GET `/v2/farcaster/following`

Same params as followers. Default limit 25, max 100. Same cursor pagination.

### GET `/v2/farcaster/followers/relevant`

"Followed by people you know" — social proof.

| Param | Type | Required |
|-------|------|----------|
| `target_fid` | int | Yes |
| `viewer_fid` | int | Yes |

Returns `top_relevant_followers_hydrated` (full objects) + `all_relevant_followers_dehydrated` (minimal).

### GET `/v2/farcaster/user/bulk`

Bulk lookup up to **100 FIDs** per request. Pass `viewer_fid` for relationship context.

### User Object Fields (all endpoints)

```
fid, username, display_name, pfp_url
custody_address, registered_at
profile.bio.text, profile.location, profile.banner_url
follower_count, following_count
power_badge (boolean)
verifications (array of addresses)
verified_addresses: { eth_addresses: [], sol_addresses: [] }
verified_accounts (X/GitHub links)
experimental.neynar_user_score (0–1 float, quality score)
viewer_context: { following, followed_by, muted, blocked }
```

### Pagination

Cursor-based. `next.cursor` is `null` when exhausted. Max 100 per page.

---

## Sorting Strategies

The API only has two native sorts (`desc_chron`, `algorithmic`). Advanced sorts are **client-side** on fetched data or via a **Supabase cache**.

### Recommended Sort Tabs (MVP)

| Tab | How | Source |
|-----|-----|--------|
| **Recent** | `sort_type=desc_chron` | API native |
| **Relevant** | `sort_type=algorithmic` | API native |
| **Popular** | Sort by `follower_count` desc | Client-side |
| **Mutual** | Filter where `viewer_context.following && viewer_context.followed_by` | Client-side filter |
| **ZAO Members** | Cross-ref with `allowlist` table by FID | Supabase batch query |

### Filter Toggles

| Filter | Data | Notes |
|--------|------|-------|
| **Power badge only** | `user.power_badge === true` | Boolean filter |
| **Hide spam** | `user.experimental.neynar_user_score < 0.55` | Neynar recommended threshold |
| **Search** | Match `username` or `display_name` | Client-side, debounced 300ms |

### Phase 2 Sort Ideas

| Sort | Requires | Notes |
|------|----------|-------|
| **Engagement score** | Backend cron aggregating likes/recasts/replies by FID on your casts | Compelling but needs Supabase cache + cron |
| **FarScore / FarRank** | Airstack GraphQL API | Additional API dependency |
| **Shared channels** | Fetch both users' channel memberships, intersect | Expensive at scale |
| **"Music people"** | Filter by channel membership (`/music`, `/sound`, etc.) | Neynar channel member API |

---

## Data Enrichment

### ZAO Allowlist Badge

Already have `checkAllowlist()` in `src/lib/gates/allowlist.ts`. For batch:

```sql
SELECT fid FROM allowlist WHERE fid = ANY($1) AND is_active = true
```

Show a gold "ZAO" badge on member cards.

### Neynar User Score

Available at `experimental.neynar_user_score` (0–1, updated weekly).

- 0.55+ = not spam (recommended threshold)
- Can show as quality dot: green (0.7+), yellow (0.55–0.7), hidden (< 0.55)

### Airstack FarScore (Phase 2)

```graphql
query {
  Socials(input: {
    filter: { dappName: { _eq: farcaster }, userId: { _eq: "12345" } }
    blockchain: ethereum
  }) {
    Social {
      farcasterScore { farScore, farRank, farBoost }
    }
  }
}
```

Trade-off: another API key, another rate limit, per-batch lookups.

---

## UI Design

### Mobile-First Follower Card

```
┌──────────────────────────────────────────────┐
│ [PFP]  Display Name        [Follow] button   │
│         @username  ⚡ power badge             │
│         Bio snippet (1 line, truncated)       │
│         12.3K followers  ★ ZAO member         │
└──────────────────────────────────────────────┘
```

- Full-width cards, 72–88px tall
- Entire row tappable → navigate to profile
- Follow/unfollow button right-aligned, min 40x32px touch target
- `line-clamp-1` for bio truncation
- Gold ZAO badge for allowlist members

### Page Layout

```
┌──────────────────────────────────────────────┐
│ ← Followers (1,247)                          │
│                                              │
│ [🔍 Search users...]                         │
│                                              │
│ Recent | Relevant | Popular | Mutual | ZAO   │
│                                              │
│ ☐ Power badge only   ☐ Hide spam             │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Follower card                            │ │
│ │ Follower card                            │ │
│ │ Follower card                            │ │
│ │ ...infinite scroll...                    │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Tab Bar for Followers vs Following

Top-level toggle between "Followers" and "Following" — each has the same sort tabs and filters.

---

## Technical Architecture

### Virtual Scrolling

Use **`@tanstack/react-virtual`** (recommended over react-window):
- Modern, headless API (no wrapper components)
- Handles variable-height rows (bios vary in length)
- ~3KB bundle size
- Works with any scroll container

### Data Fetching

Use **`@tanstack/react-query`** with `useInfiniteQuery`:
- Cursor-based pagination maps directly to Neynar's API
- Built-in caching, deduplication, background refetch
- `getNextPageParam` returns `next.cursor` or `undefined`

### Infinite Scroll

- Intersection Observer on a sentinel element at the bottom
- `rootMargin: "200px"` to prefetch before user reaches bottom
- Show skeleton cards while loading next page

### Loading States

- 5–8 skeleton cards matching card layout
- PFP circle placeholder + text line placeholders
- Tailwind `animate-pulse` on `bg-navy-700/50` blocks

### API Route

```
GET /api/users/[fid]/followers?cursor=X&sort=recent|relevant|popular|mutual|zao
GET /api/users/[fid]/following?cursor=X&sort=recent|relevant|popular|mutual|zao
```

Server-side wrapper that:
1. Calls Neynar with appropriate `sort_type`
2. Enriches with allowlist membership (batch Supabase query)
3. For `sort=popular`, fetches then sorts by `follower_count`
4. For `sort=mutual`, passes `viewer_fid` and filters
5. For `sort=zao`, filters to allowlist FIDs only

### Supabase Cache (Phase 2)

- Cache follower/following lists with timestamps
- Enables offline sorts, engagement scoring, faster loads
- Refresh via Neynar webhooks (follow/unfollow events)

---

## Packages to Add

| Package | Purpose | Size |
|---------|---------|------|
| `@tanstack/react-virtual` | Virtual scrolling for large lists | ~3KB |
| `@tanstack/react-query` | Data fetching, caching, infinite scroll | ~39KB |

Both are likely already useful elsewhere in the app.

---

## Implementation Plan

### Phase 1 (MVP Enhancement)

1. API routes for followers/following with Neynar proxy
2. Follower card component (mobile-first)
3. Sort tabs: Recent, Relevant, Popular, Mutual
4. Search filter (client-side)
5. Infinite scroll with virtual scrolling
6. Loading skeletons
7. ZAO member badge (cross-ref allowlist)

### Phase 2

8. Engagement score (who interacts with your casts most)
9. Supabase cache for faster loads
10. FarScore integration via Airstack
11. "Music people" filter (channel membership)
12. Bulk follow/unfollow actions
13. Export follower list

---

## Competitive Advantage

No Farcaster client currently offers:
- ✅ Sortable followers/following
- ✅ Quality score filtering (spam removal)
- ✅ Mutual follow highlighting
- ✅ Community member badges
- ✅ Search within followers
- ✅ Mobile-optimized virtual scrolling

This feature alone makes ZAO OS the best place to manage your Farcaster social graph.

---

## Sources

- [Neynar Followers API](https://docs.neynar.com/reference/fetch-user-followers)
- [Neynar Following API](https://docs.neynar.com/reference/fetch-user-following)
- [Neynar Relevant Followers](https://docs.neynar.com/reference/fetch-relevant-followers)
- [Neynar Mutual Follows Guide](https://docs.neynar.com/docs/how-to-fetch-mutual-followfollowers-in-farcaster)
- [Neynar User Score](https://docs.neynar.com/docs/neynar-user-quality-score)
- [Neynar Bulk Users](https://docs.neynar.com/reference/fetch-bulk-users)
- [Airstack FarScores](https://docs.airstack.xyz/airstack-docs-and-faqs/moxie/farscores-and-farboosts)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [TanStack React Query](https://tanstack.com/query/latest)
