# Hub Streaming Plan

## Why
Replace Neynar feed polling with real-time Farcaster Hub streaming via `@farcaster/shuttle` to:
- Eliminate Neynar credit costs for feed reads (~80% of current usage)
- Get real-time message delivery (no 30s polling delay)
- Full control over data pipeline

## Architecture

```
Farcaster Hub → @farcaster/shuttle → Supabase (channel_casts) → Client reads from DB
```

### Components
1. **Hub Worker** — Long-running process using `@farcaster/shuttle` to subscribe to channel events
2. **Message Handler** — Filters for ZAO channels (zao, zabal, cocconcertz), transforms to our Cast schema, upserts to Supabase
3. **Real-time Push** — Supabase Realtime or SSE to push new casts to connected clients

### Implementation Steps
1. Set up a separate worker service (can be a simple Node.js process on Railway/Fly.io)
2. Install `@farcaster/shuttle` and configure Hub connection (use Neynar's free hub or public hubs)
3. Subscribe to `CastAdd` messages filtered by parent URL (channel)
4. On each new cast: transform → upsert to `channel_casts` → broadcast via Supabase Realtime
5. Remove Neynar feed polling from the client entirely
6. Keep Neynar only for: posting casts, user search, signer management

### Hub Providers
- **Neynar Hub** — Free tier available, `hub-grpc.neynar.com:2283`
- **Pinata Hub** — `hub-grpc.pinata.cloud:2281`
- **Self-hosted** — Run your own Hubble node

### Cost Impact
- Current: ~500 CU/day on Neynar feed reads
- After: 0 CU for feed reads, only posting costs remain (~10 CU/cast)

## Timeline
This is a Phase 2 optimization. Current webhook + DB cache approach works well for MVP scale.
Implement when daily active users exceed ~50 or Neynar credits become a bottleneck.
