# 77 — Bluesky Cross-Posting Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Add Bluesky as a cross-posting target from ZAO OS compose bar + explore community features
> **Builds on:** Doc 28 (Cross-Platform Publishing)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK** | `@atproto/api` v0.19.3 — official TypeScript SDK, free, no API key needed |
| **Phase 1 auth** | App Password — simplest for community account cross-posting. Store as `BLUESKY_APP_PASSWORD` env var. |
| **Phase 2 auth** | OAuth via `@atproto/oauth-client-node` — "Connect Your Bluesky" for individual members |
| **Phase 3** | Custom "ZAO Music" feed generator + ZAO labeler on Bluesky |
| **Cost** | **$0** — Bluesky API is completely free |
| **Rate limits** | 5,000 points/hr (1,666 posts/hr) — will never hit for a 100-member community |
| **Text limit** | 300 chars — shorter than Farcaster (1,024). Need truncation logic. |
| **"The Area"** | Probably means **Area.cx** (music collaboration messenger) or **The Arena** (Avalanche SocialFi). Neither has a public API. Not integrable. |

## Why Bluesky Matters for ZAO

- **40.2M users** vs Farcaster's 900K — 50x larger audience
- **Free API** — no Neynar-like paid tier
- **771+ musician starter packs** — active music community already there
- **Custom feeds** — create a "ZAO Music" feed visible to all Bluesky users
- **Labelers** — community moderation/curation system built into the protocol
- ZAO OS already has cross-posting UI (`crossPostChannels` in ComposeBar) — extending to Bluesky is natural

## Implementation Plan

### Phase 1: Community Account Cross-Post (1-2 days)

Post to a ZAO community Bluesky account alongside Farcaster channels.

**New env vars:**
```
BLUESKY_HANDLE=thezao.bsky.social
BLUESKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**New file:** `src/lib/bluesky/client.ts`
```typescript
import { AtpAgent, RichText } from '@atproto/api'

let agent: AtpAgent | null = null;

export async function getBlueskyAgent(): Promise<AtpAgent> {
  if (agent) return agent;
  agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({
    identifier: process.env.BLUESKY_HANDLE!,
    password: process.env.BLUESKY_APP_PASSWORD!,
  });
  return agent;
}

export async function postToBluesky(text: string, url?: string) {
  const bsky = await getBlueskyAgent();

  // Truncate to 300 chars, leaving room for link
  const maxLen = url ? 270 : 300;
  const truncated = text.length > maxLen ? text.slice(0, maxLen - 3) + '...' : text;
  const fullText = url ? `${truncated}\n\n${url}` : truncated;

  const rt = new RichText({ text: fullText });
  await rt.detectFacets(bsky); // Resolves @mentions and URLs

  return bsky.post({
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  });
}
```

**Modify:** `src/app/api/chat/send/route.ts` — add Bluesky to the cross-post fan-out:
```typescript
// After posting to Farcaster channels, optionally cross-post to Bluesky
if (parsed.data.crossPostBluesky) {
  postToBluesky(text, `https://zaoos.com/chat`).catch(err =>
    console.error('[bluesky]', err)
  );
}
```

**Modify:** ComposeBar — add "Bluesky" toggle alongside existing cross-post channel checkboxes.

### Phase 2: Individual Account OAuth (1 week)

Let members connect their own Bluesky accounts.

**Package:** `npm install @atproto/oauth-client-node`

**New routes:**
- `POST /api/bluesky/login` — initiates OAuth, redirects to Bluesky
- `GET /api/bluesky/callback` — handles OAuth callback, stores DID in session
- `POST /api/bluesky/post` — posts on behalf of connected user

**Database:** Add `bluesky_did` column to `users` table. Store OAuth sessions in Supabase.

**OAuth client metadata** must be hosted at a public URL:
```json
{
  "client_id": "https://zaoos.com/oauth/bluesky/client-metadata.json",
  "client_name": "ZAO OS",
  "redirect_uris": ["https://zaoos.com/api/bluesky/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "scope": "atproto",
  "dpop_bound_access_tokens": true,
  "token_endpoint_auth_method": "none",
  "application_type": "web"
}
```

**Settings page:** Add Bluesky connection status alongside existing Farcaster/Wallet/XMTP connections.

### Phase 3: ZAO Feed + Labeler (2-3 days)

**Custom Feed Generator:**
- Subscribe to Bluesky firehose, index posts from ZAO members (by DID)
- Implement `getFeedSkeleton` — return ZAO member posts
- Publish as "ZAO Music" feed discoverable by all Bluesky users
- Host on existing Vercel deployment or separate worker
- Starter template: `github.com/bluesky-social/feed-generator`

**ZAO Labeler:**
- Label ZAO member accounts as "ZAO Member"
- Label content types: original-music, remix, collaboration, event
- Use labels as signal for feed algorithm
- Community moderators manage via Ozone dashboard

## Bluesky API Reference

### Authentication
```typescript
// App Password (Phase 1)
const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({ identifier: 'handle.bsky.social', password: 'app-password' })

// OAuth (Phase 2)
import { NodeOAuthClient } from '@atproto/oauth-client-node'
const client = new NodeOAuthClient({ clientMetadata, stateStore, sessionStore })
const authUrl = await client.authorize(handle, { scope: 'atproto' })
```

### Creating Posts
```typescript
// Simple text
await agent.post({ text: 'Hello', createdAt: new Date().toISOString() })

// Rich text (auto-detect mentions + links)
const rt = new RichText({ text: '@handle check https://example.com' })
await rt.detectFacets(agent)
await agent.post({ text: rt.text, facets: rt.facets, createdAt: new Date().toISOString() })

// Image embed (up to 4 images, 50MB max per file)
const { data } = await agent.uploadBlob(imageBuffer, { encoding: 'image/png' })
await agent.post({
  text: 'Check this',
  embed: {
    $type: 'app.bsky.embed.images',
    images: [{ alt: 'Description', image: data.blob, aspectRatio: { width: 1000, height: 500 } }]
  },
  createdAt: new Date().toISOString()
})

// Link card embed
await agent.post({
  text: 'Check this link',
  embed: {
    $type: 'app.bsky.embed.external',
    external: { uri: 'https://example.com', title: 'Title', description: 'Desc', thumb: data.blob }
  },
  createdAt: new Date().toISOString()
})
```

### Rate Limits
| Action | Points | Limit |
|--------|--------|-------|
| Create record | 3 | 5,000 pts/hr, 35,000 pts/day |
| Update record | 2 | Same pool |
| Delete record | 1 | Same pool |
| Login (createSession) | — | 30/5min, 300/day per account |
| API requests (IP) | — | 3,000/5min |

### Post Formatting Differences (Farcaster vs Bluesky)

| Feature | Farcaster | Bluesky |
|---------|-----------|---------|
| Text limit | 1,024 chars | **300 chars** |
| Rich text | Plain text + embeds | **Facets** (byte-offset annotations) |
| Mentions | `@username` in text | Facet with DID resolution |
| Links | Auto-detected | Facet with byte range |
| Images | Via embeds | Up to 4, with alt text + aspect ratio |
| Link cards | Via embeds | `app.bsky.embed.external` |

**Key difference:** Bluesky's 300-char limit means Farcaster posts need truncation. Add "... [read more on ZAO OS]" with link.

## "The Area" Research

Two possible matches found — neither has a public API:

### Area.cx — Music Collaboration Messenger
- Upload audio, leave timestamp comments on tracks, manage versions
- "Not a crypto company" but sympathetic to web3/DAOs
- No API, no integrations, no blockchain
- Could recommend to ZAO members as a standalone tool

### The Arena — Avalanche SocialFi (Doc 28)
- Social tokens with bonding curves on Avalanche
- 200K+ users, $10M+ in tips, $284M 30-day swap volume
- No public developer API — on-chain interaction only
- Social token model interesting but not integrable

**Recommendation:** Neither is integrable into ZAO OS. If members use Area.cx for music collaboration, link to it from a community resources page. The Arena's social token model is interesting for future reference but blocked by lack of API.

## Existing Code to Extend

ZAO OS already has cross-posting infrastructure:

- `src/components/chat/ComposeBar.tsx` — cross-post channel checkboxes UI
- `src/app/api/chat/send/route.ts` — `crossPostChannels` array, `Promise.allSettled` fan-out
- `src/lib/validation/schemas.ts` — `crossPostChannels` in `sendMessageSchema`
- `src/hooks/useChat.ts` — cross-post state management

Adding Bluesky means:
1. New `src/lib/bluesky/client.ts` (SDK wrapper)
2. Add `crossPostBluesky: z.boolean().optional()` to `sendMessageSchema`
3. Add Bluesky toggle in ComposeBar
4. Add fire-and-forget `postToBluesky()` call in send route
5. Add Bluesky connection status in Settings page

## Sources

- [@atproto/api on npm](https://www.npmjs.com/package/@atproto/api) — v0.19.3 (Mar 2026)
- [Bluesky Creating a Post Tutorial](https://docs.bsky.app/docs/tutorials/creating-a-post)
- [Bluesky OAuth Documentation](https://docs.bsky.app/docs/advanced-guides/oauth-client)
- [Bluesky OAuth Blog Post](https://docs.bsky.app/blog/oauth-atproto)
- [Bluesky Rate Limits](https://docs.bsky.app/docs/advanced-guides/rate-limits)
- [Custom Feeds Starter Template](https://github.com/bluesky-social/feed-generator)
- [Bluesky Moderation Architecture](https://docs.bsky.app/blog/blueskys-moderation-architecture)
- [@atproto/oauth-client-node](https://www.npmjs.com/package/@atproto/oauth-client-node)
- [OAuth with Next.js Tutorial](https://atproto.com/guides/oauth-tutorial)
- [Bluesky Statistics 2026](https://backlinko.com/bluesky-statistics)
- [Musicians on Bluesky Starter Packs](https://blueskystarterpack.com/musicians)
- [Area.cx](https://www.area.cx/)
- [The Arena on Avalanche](https://www.avax.network/about/blog/the-arenas-comeback-socialfi-app-on-avalanche)
- [Doc 28 — Cross-Platform Publishing](../028-cross-platform-publishing/)
