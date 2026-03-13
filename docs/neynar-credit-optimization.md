# Neynar API Credit Optimization — ZAO OS Research

*Researched: 2026-03-13*

---

## How Credits Are Counted

Credits are consumed **per API request** with a **multiplier based on page size**:

```
Feed endpoints: Credits = 4 × limit (page size)
```

Example: `limit=20` → 80 credits per poll call.
At 30s polling, 1 channel: **80 × 2/min × 60 × 24 = 230,400 credits/day** just from one user.

---

## Complete Credit Cost Reference (Confirmed from Neynar Pricing Page)

### Feed & Cast (what ZAO OS uses most)

| Endpoint | Credits |
|---|---|
| `GET /v2/farcaster/feed/channels` | **4 per cast returned** |
| `GET /v2/farcaster/feed` (general) | 4 per cast returned |
| `GET /v2/farcaster/cast/conversation` (threads) | **10 per cast returned** |
| `GET /v2/farcaster/cast` (single cast) | 4 |
| `GET /v2/farcaster/casts` (bulk lookup) | 4 per cast |
| `POST /v2/farcaster/cast` (post a cast) | **150** |
| `DELETE /v2/farcaster/cast` | 10 |

### Reactions & Channels

| Endpoint | Credits |
|---|---|
| `POST /v2/farcaster/reaction` (like/recast) | 10 |
| `DELETE /v2/farcaster/reaction` | 10 |
| `GET /v2/farcaster/reactions/cast` | 2 per reaction |

### Webhooks & Streaming

| Method | Credits |
|---|---|
| **Data webhooks** (HTTP POST to your endpoint) | **100 cu per delivery** |
| Kafka stream `cast.created` | 15 cu per event (Growth tier+) |
| `POST /v2/farcaster/webhook` (create webhook) | 20 (one-time) |

### Signers & Writes

| Item | Credits |
|---|---|
| Monthly active signer fee | **20,000 cu/month per active signer** |
| Sponsored signer add-on | 4,000 cu (managed signer) / 40,000 cu (signed key) |

---

## Webhook vs. Polling Cost Comparison (Corrected)

| Method | Credits (200 casts/day channel) |
|---|---|
| Polling every 30s, limit=20, 1 user | ~230,400 credits/day |
| Polling every 30s, limit=20, 5 users | ~1,152,000 credits/day |
| **Webhooks (100 cu per delivery)** | **20,000 credits/day** |
| Kafka stream (Growth tier, 15 cu/event) | 3,000 credits/day |

**Webhooks are ~11x cheaper than polling for 1 user, ~57x cheaper with 5 users.**
The savings compound with every additional user since polling is per-session.

> Note: Earlier research incorrectly stated 15 cu/webhook — that is the Kafka stream
> price (a different, higher-tier product). HTTP webhooks cost 100 cu per delivery.

---

## Webhook Setup for Channel Casts

Neynar supports `cast.created` events filtered by **`root_parent_urls`**.
Each Farcaster channel has a root parent URL.

### Channel root_parent_urls for ZAO OS
```
zao:    https://warpcast.com/~/channel/zao
zabal:  https://warpcast.com/~/channel/zabal
coc:    https://warpcast.com/~/channel/coc
```

### Create webhook via Neynar SDK (one-time setup script)
```typescript
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
}));

await client.publishWebhook({
  name: "zao-channel-casts",
  url: "https://zaoos.com/api/webhooks/neynar",
  subscription: {
    "cast.created": {
      root_parent_urls: [
        "https://warpcast.com/~/channel/zao",
        "https://warpcast.com/~/channel/zabal",
        "https://warpcast.com/~/channel/coc",
      ],
    },
  },
});
```

Or set it up manually in the Neynar developer dashboard.

### Webhook security
Neynar signs every delivery with **HMAC-SHA512** via `X-Neynar-Signature` header.
Verify against `NEYNAR_WEBHOOK_SECRET` from your dashboard. ✅ Already implemented in `/api/webhooks/neynar/route.ts`.

### Webhook payload (cast.created)
```json
{
  "type": "cast.created",
  "data": {
    "hash": "0x...",
    "text": "...",
    "timestamp": "...",
    "embeds": [],
    "author": { "fid": 123, "username": "..." },
    "channel": { "id": "zao" },
    "parent_url": "https://warpcast.com/~/channel/zao",
    "root_parent_url": "https://warpcast.com/~/channel/zao",
    "reactions": { "likes_count": 0, "recasts_count": 0 },
    "replies": { "count": 0 }
  }
}
```

---

## What Neynar Does NOT Support

- ❌ ETags / `If-Modified-Since` conditional headers — no native HTTP caching
- ❌ SDK built-in caching — the SDK is auto-generated, just a thin HTTP wrapper
- ❌ Push for reaction updates — reactions are not webhookable per-cast

---

## Additional Optimizations

### Batch multi-channel reads (if polling fallback needed)
`/v2/farcaster/feed/channels` accepts up to **10 channel IDs in one call**.
One call for all 3 channels = same credit cost as one single-channel call.

### gRPC stream (advanced alternative)
Neynar exposes a gRPC hub at `hub-grpc-api.neynar.com` using `@farcaster/hub-nodejs`.
Provides real-time stream of ALL Farcaster events. You filter client-side by channel URL.
More complex than webhooks, credits undocumented, but useful for high-volume monitoring.

### Signer fee awareness
Each **monthly active signer** (used for writing) costs **20,000 credits/month**.
For ZAO OS with ~40 members all posting: potentially 800,000 credits/month in signer fees alone.
Use a single app-level signer for system posts where possible.

---

## ZAO OS Current Architecture (Post-Webhook)

```
Neynar webhook (cast.created, root_parent_urls filtered)
  → POST /api/webhooks/neynar
  → Verify HMAC-SHA512
  → Insert into channel_casts (Supabase)

Client → GET /api/chat/messages?channel=zao
  → Read from channel_casts (Supabase) — ZERO Neynar credits
  → Only falls back to Neynar on first load (backfill)

Result: /v2/farcaster/feed/channels goes from ~650k credits/month → ~0
```

---

## Sources
- https://docs.neynar.com/reference/compute-units
- https://docs.neynar.com/docs/how-to-integrate-neynar-webhooks-for-real-time-events
- https://docs.neynar.com/reference/publish-webhook
- https://docs.neynar.com/reference/fetch-feed-by-channel-ids
- https://docs.neynar.com/docs/create-a-stream-of-casts
