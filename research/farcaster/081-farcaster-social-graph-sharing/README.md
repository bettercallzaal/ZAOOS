# 87 — Farcaster Social Graph APIs & Social Sharing Features

> **Note:** Folder is named `81-farcaster-social-graph-sharing` due to numbering collision. Canonical number is **87**.

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Document Neynar user data APIs, social graph analysis patterns, and Farcaster sharing/compose features for building pre-generated member profiles and social sharing in ZAO OS
> **Related:** Doc 20 (followers/following feed), Doc 73 (Farcaster ecosystem 2026), Doc 68 (Mini Apps)

---

## Key Decisions / Recommendations for ZAO OS

| Decision | Recommendation |
|----------|----------------|
| **Richest profile endpoint** | `/v2/farcaster/user/bulk` with `viewer_fid` — returns everything in one call for up to 100 FIDs |
| **Social graph computation** | Pre-compute and cache in Supabase on a cron (every 6 hours). Already have `community-graph` route — extend it. |
| **Share to Farcaster** | Use Mini App SDK `composeCast()` inside ZAO OS. Use `https://farcaster.xyz/~/compose` URL for external/web contexts. |
| **Rich cast previews** | Already have `fc:miniapp` meta tags. Add per-page OG images for member profiles and shared content. |
| **Cast templates** | Use Neynar `POST /v2/farcaster/cast` with pre-formatted text + embeds for "share this" flows. |
| **New endpoints to add** | `active_channels`, `channel_memberships`, `reciprocal_followers`, `best_friends` — none currently used. |

---

## 1. Neynar User Data APIs

### The Complete User Object

Every user-related endpoint returns the same hydrated user object. Here are ALL available fields:

```typescript
interface NeynarUser {
  // Core identity
  object: 'user';
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;       // Ethereum address that registered the FID
  registered_at: number;         // Unix timestamp — proxy for "FID age"

  // Profile
  pfp_url: string;
  profile: {
    bio: {
      text: string;
      mentioned_profiles: { fid: number; username: string }[];
      mentioned_channels: { id: string; name: string; image_url: string }[];
    };
    location?: {
      latitude: number;
      longitude: number;
      address: { city: string; state: string; country: string };
    };
    banner?: { url: string };
  };

  // Social metrics
  follower_count: number;
  following_count: number;

  // Verification & wallets
  verifications: string[];       // Array of verified Ethereum addresses
  verified_addresses: {
    eth_addresses: string[];     // Sorted oldest to newest
    sol_addresses: string[];
    primary: string;             // Primary verified address
  };
  verified_accounts: { platform: string; username: string }[];  // X, GitHub, etc.
  auth_addresses: { address: string; app: string }[];

  // Status
  power_badge: boolean;          // Farcaster power user badge
  pro?: { expires_at: string };  // Farcaster Pro subscription

  // Quality score
  experimental: {
    neynar_user_score: number;   // 0-1 float, probability account is legitimate
  };

  // Viewer context (only when viewer_fid is passed)
  viewer_context?: {
    following: boolean;          // Does viewer follow this user?
    followed_by: boolean;        // Does this user follow the viewer?
    blocking: boolean;
    blocked_by: boolean;
  };
}
```

### User Data Endpoints (Ranked by Usefulness for ZAO OS)

| Endpoint | Method | Path | Best For |
|----------|--------|------|----------|
| **Bulk by FIDs** | GET | `/v2/farcaster/user/bulk` | Pre-generating profiles for all 100 members in 1 call |
| **By username** | GET | `/v2/farcaster/user/by_username` | Single user lookup from @mention or URL |
| **By wallet address** | GET | `/v2/farcaster/user/bulk-by-address` | Resolving wallet -> Farcaster identity (up to 350 addresses) |
| **Search** | GET | `/v2/farcaster/user/search` | Autocomplete / @mention search |
| **Power users** | GET | `/v2/farcaster/user/power_users` | Finding influential members |
| **Power users lite** | GET | `/v2/farcaster/user/power_users_lite` | Lightweight power user list |

### `/v2/farcaster/user/bulk` — The Workhorse

This is the richest endpoint for ZAO OS. One call gets full profiles for up to 100 FIDs.

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `fids` | string | Yes | Comma-separated FIDs, max 100 |
| `viewer_fid` | integer | No | Adds `viewer_context` (follow relationships) |
| `x-neynar-experimental` | header | No | Enables experimental features |

**Already implemented in codebase:** `getUserByFid()`, `getUsersByFids()` in `src/lib/farcaster/neynar.ts`

**What we can auto-generate per member:**
- Display name, bio, PFP, banner image, location
- All verified wallets (ETH + SOL) and connected accounts (X, GitHub)
- Follower/following counts
- Power badge status
- Account age (from `registered_at`)
- Neynar user quality score
- Whether they follow the viewer (mutual follow detection)

### `/v2/farcaster/user/by_username` — Single Lookup

**Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `viewer_fid` | integer | No |

Returns identical user object. Useful for profile pages at `/member/@username`.

**Not yet in codebase.** Recommended addition to `neynar.ts`:

```typescript
export async function getUserByUsername(username: string, viewerFid?: number) {
  const params = new URLSearchParams({ username });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  const res = await fetch(`${NEYNAR_BASE}/user/by_username?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar username lookup error: ${res.status}`);
  const data = await res.json();
  return data.user || null;
}
```

---

## 2. Social Graph APIs

### Available Endpoints

| Endpoint | Method | Path | Purpose |
|----------|--------|------|---------|
| **Followers** | GET | `/v2/farcaster/follower/user` | Who follows a user |
| **Following** | GET | `/v2/farcaster/following` | Who a user follows |
| **Relevant followers** | GET | `/v2/farcaster/follower/relevant` | "Followed by people you know" |
| **Reciprocal followers** | GET | `/v2/farcaster/user/reciprocal_followers` | Mutual follows between two users |
| **Best friends** | GET | `/v2/farcaster/user/best_friends` | Closest connections |

### Already Implemented in ZAO OS

- `getFollowers()` — paginated follower list
- `getFollowing()` — paginated following list
- `getRelevantFollowers()` — social proof ("followed by A, B, C")
- `followUser()` / `unfollowUser()` — follow actions
- Community graph route (`/api/social/community-graph`) — computes intra-community connections

### New Endpoints to Add

#### Reciprocal Followers (Mutual Follows)
```
GET /v2/farcaster/user/reciprocal_followers?fid={fid}&viewer_fid={viewer_fid}
```
Returns users who mutually follow each other. More efficient than computing from two separate follower/following lists.

#### Best Friends
```
GET /v2/farcaster/user/best_friends?fid={fid}
```
Returns algorithmically-determined closest connections. Useful for "inner circle" features.

### Channel-Related Endpoints (New for ZAO OS)

| Endpoint | Method | Path | Purpose |
|----------|--------|------|---------|
| **User's channels** | GET | `/v2/farcaster/user/channels` | Channels a user has created/manages |
| **Channel memberships** | GET | `/v2/farcaster/user/channel_memberships` | All channels a user is a member of |
| **Active channels** | GET | `/v2/farcaster/user/active_channels` | Channels where a user is most active |

These are valuable for ZAO member profiles — show shared channel interests.

```typescript
export async function getUserActiveChannels(fid: number) {
  const params = new URLSearchParams({ fid: String(fid) });
  const res = await fetch(`${NEYNAR_BASE}/user/active_channels?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar active channels error: ${res.status}`);
  return res.json();
}

export async function getUserChannelMemberships(fid: number) {
  const params = new URLSearchParams({ fid: String(fid) });
  const res = await fetch(`${NEYNAR_BASE}/user/channel_memberships?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar channel memberships error: ${res.status}`);
  return res.json();
}
```

### Social Graph Analysis for 100 ZAO Members

#### Computing Mutual Connections (Already Partially Built)

The existing `/api/social/community-graph` route does N-member graph computation using `viewer_fid` context on bulk lookups. Current approach:

1. Fetch all member FIDs from Supabase
2. For each member as `viewer_fid`, bulk-lookup all other members
3. `viewer_context.following === true` means viewer follows that user
4. Build directed edge list, compute mutual connections

**Optimization opportunity:** Replace the N*100 viewer-context calls with the `reciprocal_followers` endpoint per member, which directly returns mutual follows.

#### Pre-Computed Social Graph Cache (Recommended Schema)

```sql
CREATE TABLE member_social_graph (
  from_fid INTEGER NOT NULL,
  to_fid INTEGER NOT NULL,
  is_mutual BOOLEAN DEFAULT false,
  shared_channels TEXT[],          -- channels both are members of
  computed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (from_fid, to_fid)
);

CREATE TABLE member_profiles_cache (
  fid INTEGER PRIMARY KEY,
  username TEXT,
  display_name TEXT,
  pfp_url TEXT,
  bio TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  power_badge BOOLEAN,
  neynar_score FLOAT,
  verified_eth_addresses TEXT[],
  verified_sol_addresses TEXT[],
  connected_accounts JSONB,       -- {platform, username}[]
  active_channels JSONB,          -- channel objects
  registered_at TIMESTAMPTZ,
  community_mutuals INTEGER,      -- count of mutual follows within ZAO
  community_followers INTEGER,    -- ZAO members who follow this user
  community_following INTEGER,    -- ZAO members this user follows
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Hub Node Detection

From the cached graph, identify most-connected members:

```typescript
// Compute hub score: weighted combination of mutuals + followers + following within ZAO
function computeHubScore(member: MemberGraphNode): number {
  return (member.communityMutuals * 3) +
         (member.communityFollowers * 1) +
         (member.communityFollowing * 1);
}
```

#### "You Both Follow" Recommendations

Using the `relevant_followers` endpoint:

```typescript
// For a profile page: "You and @artist both follow @producerA, @producerB, and 5 others"
const relevantData = await getRelevantFollowers(targetFid, viewerFid);
// Returns: { top_relevant_followers_hydrated: User[], all_relevant_followers_dehydrated: { fid, fname }[] }
```

#### Shared Channel Detection

```typescript
async function findSharedChannels(fidA: number, fidB: number): Promise<string[]> {
  const [channelsA, channelsB] = await Promise.all([
    getUserChannelMemberships(fidA),
    getUserChannelMemberships(fidB),
  ]);
  const setB = new Set(channelsB.channels?.map((c: { id: string }) => c.id) || []);
  return channelsA.channels
    ?.filter((c: { id: string }) => setB.has(c.id))
    .map((c: { id: string }) => c.id) || [];
}
```

---

## 3. Farcaster Compose / Share URLs

### Method 1: Mini App SDK `composeCast()` (Best for In-App)

When ZAO OS runs as a Mini App inside the Farcaster client, use the SDK:

```typescript
import sdk from '@farcaster/mini-app';

const result = await sdk.actions.composeCast({
  text: 'Check out this track on ZAO OS',
  embeds: ['https://zaoos.com/music/track/123'],
  channelKey: 'zao',       // Posts to /zao channel
});

if (result?.cast) {
  console.log('Cast published:', result.cast.hash);
  // result.cast.channelKey available if posted to channel
}
```

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `text` | string (optional) | Suggested text, user can edit before posting |
| `embeds` | `[] \| [string] \| [string, string]` (optional) | Max 2 URL embeds |
| `parent` | `{ type: 'cast'; hash: string }` (optional) | For replies |
| `channelKey` | string (optional) | Channel to post to (e.g., `'zao'`) |
| `close` | boolean (optional) | Close the mini app after compose |

**Mentions:** Use `@username` in the text string. The client resolves them.

### Method 2: Compose URL (Best for Web / External Links)

For when users access ZAO OS in a browser (not inside Farcaster app):

```
https://farcaster.xyz/~/compose?text={encodedText}&embeds[]={encodedUrl1}&embeds[]={encodedUrl2}&channelKey={channel}
```

**Examples:**

```typescript
// Share a member profile
function getFarcasterShareUrl(text: string, embedUrl?: string, channel?: string): string {
  const params = new URLSearchParams();
  params.set('text', text);
  if (embedUrl) params.append('embeds[]', embedUrl);
  if (channel) params.set('channelKey', channel);
  return `https://farcaster.xyz/~/compose?${params.toString()}`;
}

// Usage examples:
const shareProfileUrl = getFarcasterShareUrl(
  'Check out @bettercallzaal on ZAO OS - founder of The ZAO music community',
  'https://zaoos.com/member/bettercallzaal',
  'zao'
);

const shareSongUrl = getFarcasterShareUrl(
  'Listening to Ambition by Stilo World on ZAO Radio',
  'https://zaoos.com/music/now-playing',
  'zao'
);
```

**Note on URL:** The Farcaster app (formerly Warpcast) is rebranding. Both `warpcast.com` and `farcaster.xyz` work as of March 2026. Use `farcaster.xyz` going forward as per doc 73.

### Method 3: `farcaster://` URI Scheme (Experimental)

A FIP (Farcaster Improvement Proposal) exists for a `farcaster://` URI scheme but it remains at Stage 1 (Ideas) with no consensus on adoption. Not recommended for production use.

Proposed format: `farcaster://+cast=Hello%20World!`

**Status: Do not use.** Stick with HTTPS compose URLs.

### Compose URL Parameter Reference

| Parameter | Format | Example |
|-----------|--------|---------|
| `text` | URL-encoded string | `text=Hello%20%40username` |
| `embeds[]` | URL-encoded URL (max 2) | `embeds[]=https%3A%2F%2Fzaoos.com` |
| `channelKey` | Channel slug | `channelKey=zao` |
| `parentCastHash` | Cast hash for replies | `parentCastHash=0xabc123...` |

### @Mentions in Pre-filled Text

Mentions work by including `@username` in the text. The Farcaster client resolves them to the correct FID at compose time. Example:

```
text=Shoutout%20to%20%40bettercallzaal%20for%20building%20ZAO%20OS
```

Renders as: "Shoutout to @bettercallzaal for building ZAO OS" with a clickable mention.

---

## 4. Cast Embeds & Rich Previews

### OpenGraph Tags for ZAO OS Pages

Farcaster clients scrape OG tags when a URL is embedded in a cast. These are cached at scrape time and do NOT update later.

**Current implementation** in `src/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  openGraph: {
    title: 'ZAO OS',
    description: 'The ZAO Community on Farcaster...',
    url: 'https://zaoos.com',
    siteName: 'ZAO OS',
    type: 'website',
  },
};
```

**Recommended OG tags for best Farcaster previews:**

```html
<!-- Required -->
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Description (max ~200 chars)" />
<meta property="og:image" content="https://zaoos.com/og/page-specific.png" />
<meta property="og:url" content="https://zaoos.com/page" />

<!-- Recommended -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="ZAO OS" />
<meta property="og:type" content="website" />

<!-- Twitter/summary card (Farcaster also reads these) -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Description" />
<meta name="twitter:image" content="https://zaoos.com/og/page-specific.png" />
```

**Image specs for Farcaster:**
- Format: PNG, JPG, GIF, WebP
- Aspect ratio: 1.91:1 (1200x630) for `summary_large_image`, or 1:1 for `summary`
- Minimum: 600x315px
- Max file size: <10MB (keep under 1MB for fast loading)
- Always serve over HTTPS

### Mini App Embed vs Regular Link Embed

**Regular link embed:** Farcaster scrapes OG tags, shows image + title + description as a card.

**Mini App embed:** Uses `fc:miniapp` meta tag (already implemented in ZAO OS). Shows image with a "launch" button that opens the Mini App directly. Much richer interaction.

```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://zaoos.com/og.png","button":{"title":"Open ZAO OS","action":{"type":"launch_miniapp","url":"https://zaoos.com","name":"ZAO OS","splashImageUrl":"https://zaoos.com/splash.png","splashBackgroundColor":"#0a1628"}}}' />
```

**When to use which:**
| Scenario | Embed Type | Why |
|----------|-----------|-----|
| Share a member profile | Regular OG link | Opens profile page, familiar UX |
| Share a track/playlist | Mini App embed | Inline playback possible |
| Share ZAO OS itself | Mini App embed | Direct launch into app |
| Share a governance vote | Regular OG link | Simple info card is sufficient |

### Dynamic OG Images per Page

For member profiles, generate dynamic OG images using Next.js `generateMetadata()`:

```typescript
// src/app/(auth)/member/[username]/page.tsx
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await getUserByUsername(params.username);
  return {
    openGraph: {
      title: `${user.display_name} (@${user.username}) - ZAO OS`,
      description: user.profile?.bio?.text || 'ZAO Community Member',
      images: [`https://zaoos.com/api/og/member/${user.fid}`],  // Dynamic OG image
    },
  };
}
```

Dynamic OG image API route using `@vercel/og` or `satori`:

```typescript
// src/app/api/og/member/[fid]/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(req: Request, { params }: { params: { fid: string } }) {
  const user = await getUserByFid(Number(params.fid));
  return new ImageResponse(
    (
      <div style={{ display: 'flex', background: '#0a1628', color: 'white', width: '1200', height: '630' }}>
        <img src={user.pfp_url} width={200} height={200} style={{ borderRadius: '50%' }} />
        <div>
          <h1 style={{ color: '#f5a623' }}>{user.display_name}</h1>
          <p>@{user.username}</p>
          <p>{user.follower_count} followers</p>
          {user.power_badge && <span>Power Badge</span>}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 5. Neynar Cast Publishing — Pre-Designed Templates

### Publish Cast via API

Already implemented in `src/lib/farcaster/neynar.ts` as `postCast()`. Here is the full Neynar endpoint:

```
POST /v2/farcaster/cast
```

**Request body:**

```typescript
{
  signer_uuid: string;       // Required — user's approved signer
  text: string;              // Cast text (1024 bytes max for protocol)
  channel_id?: string;       // Channel slug (e.g., "zao")
  parent?: string;           // Parent cast hash (for replies) or parent_url
  parent_author_fid?: number;
  idem?: string;             // Idempotency key (16 chars recommended)
  embeds?: (
    | { url: string }                                    // URL embed
    | { cast_id: { hash: string; fid: number } }         // Quote cast embed
  )[];                       // Max 2 embeds
}
```

### Pre-Designed Cast Templates for ZAO OS

```typescript
// Template: Share a member profile
function composeProfileShare(member: { username: string; displayName: string }): CastTemplate {
  return {
    text: `Check out ${member.displayName} (@${member.username}) on ZAO OS - a fellow ZAO community member`,
    embeds: [{ url: `https://zaoos.com/member/${member.username}` }],
    channel_id: 'zao',
  };
}

// Template: Share now-playing track
function composeNowPlaying(track: { name: string; artist: string; url: string }): CastTemplate {
  return {
    text: `Listening to "${track.name}" by ${track.artist} on ZAO Radio`,
    embeds: [{ url: track.url }],
    channel_id: 'zao',
  };
}

// Template: Governance vote announcement
function composeVoteAnnouncement(proposal: { title: string; id: string }): CastTemplate {
  return {
    text: `New governance proposal in The ZAO: "${proposal.title}"\n\nVote now on ZAO OS`,
    embeds: [{ url: `https://zaoos.com/governance/proposal/${proposal.id}` }],
    channel_id: 'zao',
  };
}

// Template: Welcome new member
function composeWelcome(member: { username: string }): CastTemplate {
  return {
    text: `Welcome @${member.username} to The ZAO! Another artist joins the community.\n\nExplore ZAO OS:`,
    embeds: [{ url: 'https://zaoos.com' }],
    channel_id: 'zao',
  };
}

// Template: Weekly community stats
function composeWeeklyStats(stats: { members: number; casts: number; tracks: number }): CastTemplate {
  return {
    text: `This week in The ZAO:\n\n${stats.members} active members\n${stats.casts} community casts\n${stats.tracks} tracks shared\n\nJoin the conversation:`,
    embeds: [{ url: 'https://zaoos.com' }],
    channel_id: 'zao',
  };
}
```

### "Share to Farcaster" Button Flow

Two approaches depending on context:

**Approach A: In-App (Mini App context)**
```typescript
// User clicks "Share" button on a track
async function handleShareTrack(track: Track) {
  const result = await sdk.actions.composeCast({
    text: `Listening to "${track.name}" by ${track.artist} on ZAO Radio`,
    embeds: [`https://zaoos.com/music/track/${track.id}`],
    channelKey: 'zao',
  });
  if (result?.cast) {
    toast.success('Shared to Farcaster!');
  }
}
```

**Approach B: Web context (user has signer)**
```typescript
// Server-side: publish cast via Neynar API using user's signer
async function handleShareTrack(track: Track, signerUuid: string) {
  const result = await postCast(
    signerUuid,
    `Listening to "${track.name}" by ${track.artist} on ZAO Radio`,
    'zao',
    undefined, // no parent
    undefined, // no embedHash
    [`https://zaoos.com/music/track/${track.id}`],
  );
  return result;
}
```

**Approach C: Web context (no signer, fallback)**
```typescript
// Open Farcaster compose in new tab
function handleShareFallback(text: string, embedUrl: string) {
  const url = getFarcasterShareUrl(text, embedUrl, 'zao');
  window.open(url, '_blank');
}
```

### How Other Apps Handle "Share to Farcaster"

| App | Method | Notes |
|-----|--------|-------|
| **Sonata** | Mini App SDK `composeCast()` | Pre-fills with track name + embed URL |
| **Paragraph** | OG embed + compose URL | "Share on Farcaster" button opens compose URL |
| **Zora** | Frame embed | Rich interactive frame for minting |
| **Supercast** | Native compose | Built-in client, no external share needed |
| **Generic Web3 apps** | Compose URL with OG tags | Most common pattern |

---

## 6. Implementation Plan for ZAO OS

### Phase 1: Pre-Generated Member Profiles (Low Effort, High Value)

1. **Add new Neynar wrappers** to `src/lib/farcaster/neynar.ts`:
   - `getUserByUsername()`
   - `getUserActiveChannels()`
   - `getUserChannelMemberships()`

2. **Create profile cache cron** (Supabase scheduled function or Vercel cron):
   - Every 6 hours, call `getUsersByFids()` for all member FIDs
   - Store in `member_profiles_cache` table
   - Include active channels, verified wallets, scores

3. **Build member profile pages** at `/member/[username]`:
   - Bio, PFP, banner, location
   - Verified wallets and connected accounts
   - Power badge, Neynar score, FID age
   - Community connections ("followed by 12 ZAO members")
   - Shared channels with viewer
   - Activity in ZAO channels

### Phase 2: Social Graph Enhancement (Medium Effort)

1. **Extend community-graph route** with:
   - Shared channel detection between members
   - Hub node scoring
   - "Best friends" within ZAO

2. **Add "You both follow" widget** to member profiles using `getRelevantFollowers()`

3. **Cache social graph in Supabase** (`member_social_graph` table)
   - Refresh every 6 hours
   - Expose via API for instant member profile loading

### Phase 3: Social Sharing Features (Medium Effort)

1. **Add "Share to Farcaster" button component**:
   - Detect Mini App context vs web context
   - Use SDK `composeCast()` when available
   - Fall back to compose URL
   - Pre-fill with appropriate template

2. **Dynamic OG images** for member profiles and shared content

3. **Cast template system** for common share actions

### API Credit Budget (for 100 members)

| Operation | Calls | Frequency | Credits/Day |
|-----------|-------|-----------|-------------|
| Bulk profile refresh | 1 call (100 FIDs) | Every 6 hours | 4 |
| Active channels (per member) | 100 calls | Every 6 hours | 400 |
| Community graph (viewer context) | ~100 calls | Every 6 hours | 400 |
| On-demand profile lookups | ~50/day | Per request | 50 |
| Cast publishing | ~20/day | Per share action | 20 |
| **Total** | | | **~874/day** |

This is well within Neynar's free tier limits.

---

## Sources

- [Neynar User Bulk API](https://docs.neynar.com/reference/user-bulk)
- [Neynar User by Username](https://docs.neynar.com/reference/lookup-user-by-username)
- [Neynar Bulk by Address](https://docs.neynar.com/reference/fetch-bulk-users-by-eth-or-sol-address)
- [Neynar Publish Cast](https://docs.neynar.com/reference/publish-cast)
- [Neynar Power Users](https://docs.neynar.com/reference/fetch-power-users)
- [Neynar Mutual Followers Guide](https://docs.neynar.com/docs/how-to-fetch-mutual-followfollowers-in-farcaster)
- [Neynar Feed API Guide](https://docs.neynar.com/docs/how-to-use-the-feed-api-1)
- [Neynar API Complete Index](https://docs.neynar.com/llms.txt)
- [Farcaster Mini Apps: Sharing Guide](https://miniapps.farcaster.xyz/docs/guides/sharing)
- [Farcaster Mini Apps: composeCast SDK](https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast)
- [Farcaster Mini Apps: Share Extensions](https://miniapps.farcaster.xyz/docs/guides/share-extension)
- [Farcaster Mini Apps: Manifest vs Embed](https://miniapps.farcaster.xyz/docs/guides/manifest-vs-embed)
- [Farcaster Docs: Create Casts](https://docs.farcaster.xyz/developers/guides/writing/casts)
- [Farcaster URI Scheme FIP Discussion](https://github.com/farcasterxyz/protocol/discussions/123)
- [Neynar User Quality Score](https://docs.neynar.com/docs/neynar-user-quality-score)
