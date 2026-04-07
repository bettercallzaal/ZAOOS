# 293 - Sopha External Feed API Integration

> **Status:** Research complete
> **Date:** April 7, 2026
> **Goal:** Document the Sopha Social API integration, fix bugs, and plan improvements for cleaner use of curated feed data

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Curator field mapping** | FIX `_curatorInfo` bug - API returns `_curators` (array), code maps `_curatorInfo` (single object). Currently always `undefined`. |
| **Sopha config** | MOVE Sopha URL + feature flags to `community.config.ts` so forks can swap or disable the provider |
| **Lib extraction** | EXTRACT Sopha fetch logic into `src/lib/sopha/client.ts` - the route handler is doing too much (fetching, mapping, caching, merging) |
| **Category filtering** | ADD category filter chips in TrendingFeed - Sopha returns 7 categories, users should be able to filter |
| **Quality threshold** | ADD `minQualityScore` param (default 65) - all 50 casts score 65-85, so a threshold filters noise |
| **Cursor/pagination** | SKIP pagination for now - Sopha returns 50 casts max, `nextCursor` is always null |
| **Error logging** | ADD Sopha-specific error logging with response status, currently fails silently to `null` |
| **www redirect** | KEEP `www.` prefix - Node `fetch()` strips `Authorization` on 307 cross-subdomain redirects |

## Comparison: Integration Approaches

| Approach | Complexity | Benefit | Recommendation |
|----------|-----------|---------|----------------|
| **Current: inline in route** | Low | Works, but messy - 155 lines mixing Sopha + Neynar + caching | Refactor |
| **Lib extraction: `src/lib/sopha/client.ts`** | Medium | Clean separation, testable, reusable for future Sopha endpoints | USE THIS |
| **Dedicated API route: `/api/sopha/feed`** | Medium | Full separation from Neynar trending | Overkill - Sopha IS the trending source |
| **Background sync to Supabase** | High | Fastest reads, offline resilience, queryable | SKIP for now - 50 casts with 5min cache is fine for 188 members |

## Bugs Found

### Bug 1: `_curators` field never mapped (Critical)

The API returns `_curators` (array of curator objects), but the code maps `_curatorInfo` (single object). This means curator attribution **never renders** in the UI.

**API response:**
```json
"_curators": [{ "fid": 5406, "username": "bradq", "display_name": "bradq", "pfp_url": "..." }]
```

**Code at `src/app/api/chat/trending/route.ts:61`:**
```typescript
_curatorInfo: (c._curatorInfo as TrendingCast['_curatorInfo']) || undefined,
// Should be:
_curators: (c._curators as TrendingCast['_curators']) || undefined,
```

**Fix:** Rename `_curatorInfo` to `_curators` (array) in `TrendingCast` interface, route mapper, and `TrendingFeed.tsx`.

### Bug 2: No error logging for Sopha failures

At `route.ts:96-101`, if Sopha returns a non-200 response, it silently resolves to `null`. No log tells you WHY it failed (expired creds, rate limit, endpoint change).

**Fix:** Log the status code before returning null:
```typescript
.then(r => {
  if (!r.ok) logger.warn('[sopha] API returned', r.status);
  return r.ok ? r.json() : null;
})
```

## Sopha API Reference (Undocumented)

No public docs exist. This is based on direct API testing on April 7, 2026.

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.sopha.social/api/external/feed` |
| **Auth** | HTTP Basic Auth (`Authorization: Basic base64(user:pass)`) |
| **Method** | GET |
| **Response** | `{ casts: Cast[], count: number, nextCursor: null }` |
| **Cast count** | 50 per request (fixed) |
| **Pagination** | `nextCursor` exists but always null (single page) |
| **Cache headers** | `cache-control: public, max-age=0, must-revalidate` |
| **Hosting** | Vercel (Next.js App Router) |
| **www requirement** | MUST use `www.sopha.social` - non-www 307 redirects strip auth headers |

### Sopha-specific fields on casts

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_qualityScore` | number | 0-100 quality rating | 78 |
| `_category` | string | Content category | `platform-analysis` |
| `_title` | string | Editorial title | `"Farcaster's Flywheel: Onchain Game Collaboration"` |
| `_summary` | string | 1-2 sentence summary | `"The cast describes how two Farcaster-native projects..."` |
| `_curators` | array | Curator(s) who selected this cast | `[{ fid, username, display_name, pfp_url }]` |

### Category distribution (April 7, 2026 snapshot)

| Category | Count | Description |
|----------|-------|-------------|
| `platform-analysis` | 19 | Farcaster/crypto platform discussions |
| `ai-philosophy` | 12 | AI, philosophy, deep thought |
| `life-reflection` | 6 | Personal essays, life observations |
| `creator-economy` | 5 | Content creation, monetization |
| `crypto-critique` | 5 | Critical takes on crypto/web3 |
| `community-culture` | 2 | Community building, culture |
| `art-culture` | 1 | Art, music, creative work |

### Quality score distribution

- Min: 65, Max: 85, Average: 77.1
- All 50 casts have scores (none missing)
- Tight range suggests consistent curation standards

## ZAO OS Integration

### Current architecture

```
TrendingFeed.tsx (client)
  -> GET /api/chat/trending
    -> Promise.allSettled([
         fetch(sopha external/feed),  // curated casts with metadata
         getTrendingFeed(neynar),      // engagement-based trending
       ])
    -> merge, dedupe by hash, sort by timestamp
    -> 5-min in-memory cache
```

### Files to modify

| File | Change |
|------|--------|
| `src/lib/sopha/client.ts` | NEW - extract Sopha fetch, auth, mapping, error handling |
| `src/app/api/chat/trending/route.ts` | SIMPLIFY - import from sopha/client, remove inline fetch logic |
| `src/components/chat/TrendingFeed.tsx` | FIX `_curators` mapping, ADD category filter chips |
| `community.config.ts` | ADD `sopha` config block (url, enabled flag) |
| `src/types/index.ts` | ADD `SophaCast` type with proper `_curators` array type |

### Proposed `src/lib/sopha/client.ts`

```typescript
// Core responsibilities:
// 1. Auth (Basic Auth from env vars)
// 2. Fetch with www. requirement enforced
// 3. Map raw response to typed SophaCast[]
// 4. Log errors with status codes
// 5. Export fetchSophaFeed() for route handler

export interface SophaCurator {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export interface SophaCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curators?: SophaCurator[];
  _source: 'sopha';
}
```

### Proposed `community.config.ts` addition

```typescript
sopha: {
  enabled: true,
  apiUrl: 'https://www.sopha.social/api/external/feed',
  attribution: 'Curated by Sopha',
  attributionUrl: 'https://sopha.social',
  minQualityScore: 65,
  maxAge: 30, // days - filter out casts older than this
},
```

## Improvement Roadmap

### Phase 1: Bug fixes + cleanup (1-2 hours)

1. Fix `_curators` mapping (route + component)
2. Add Sopha error logging with status codes
3. Extract `src/lib/sopha/client.ts`
4. Add Sopha config to `community.config.ts`
5. Move `SophaCast` type to `src/types/`

### Phase 2: Better UX (2-4 hours)

1. Category filter chips in TrendingFeed header
2. Quality score as visual indicator (not just text)
3. Curator avatars in the metadata bar
4. "Why this is trending" tooltip using `_summary`

### Phase 3: Deeper integration (future)

1. Surface Sopha categories in search/discovery
2. Cross-reference Sopha casts with ZAO member activity
3. "Curated for ZAO" - filter Sopha feed to casts by/about ZAO members
4. Ask Sopha team about channel-specific feeds or music category

## Sources

- [Sopha.social](https://www.sopha.social) - main app
- [Doc 124 - Sopha: Deep Social on Farcaster](../../farcaster/124-sopha-deep-social-farcaster/) - prior research
- [Farcaster API docs](https://docs.farcaster.xyz/reference/farcaster/api) - protocol context
- [Neynar feed docs](https://docs.neynar.com/docs/fetching-casts-from-memes-channel-in-farcaster) - our other feed source
