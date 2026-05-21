---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: [017-neynar-onboarding, 173-farcaster-miniapps-integration]
original-query: "What is the Farcaster Hub API and how do we connect to it for data reads and writes? (reconstructed)"
tier: STANDARD
---

# 002 - Farcaster Hub API

> **Goal:** Connect to Hubble (Farcaster's consensus node) via gRPC or HTTP to read casts, reactions, follows, and write signed messages.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | Use **Neynar REST API** (v2) for primary reads | Simpler than raw Hub API, handles pagination, includes user enrichment. ZAO OS uses Neynar for feed + user lookup. |
| 2 | Use **HTTP API** (port 2281) for direct hub queries when Neynar unavailable | Faster fallback than gRPC for stateless reads; no connection overhead. |
| 3 | Use **gRPC Subscribe** (port 2283) for real-time feed updates | Only path to streaming; critical for live chat, notifications. |
| 4 | Send writes via **Neynar managed signers**, not raw ED25519 | Neynar sponsors gas costs and handles key rotation. ZAO never touches Farcaster private keys. |

## Findings

### Hub Monorepo Packages (as of 2026-02-24, latest release @farcaster/shuttle@0.9.6)

| Package | npm | Purpose | Version Status |
|---------|-----|---------|-----------------|
| **@farcaster/hub-nodejs** | hub-nodejs | Node.js gRPC client SDK | Active, 110 releases total |
| **@farcaster/hub-web** | hub-web | Browser gRPC-Web client SDK | Active |
| **@farcaster/core** | core | Types, protobuf, crypto, message builders | Shared dependency |
| **@farcaster/shuttle** | shuttle | ETL Hub → PostgreSQL (latest 0.9.6) | Actively maintained |
| **Hubble** | binary | Full Hub node (Rust core + TS wrapper) | Production-grade |

### HTTP API Endpoints (Port 2281, Base: `http://<hub>:2281/v1/`)

**Casts:**
```
GET /v1/castById?fid=<fid>&hash=<hash>
GET /v1/castsByFid?fid=<fid>&pageSize=N&pageToken=T&reverse=bool
GET /v1/castsByParent?fid=<fid>&hash=<hash>
GET /v1/castsByParent?url=<channel_url>              # for channel feeds
GET /v1/castsByMention?fid=<fid>
```

**Reactions (1=like, 2=recast):**
```
GET /v1/reactionsByFid?fid=<fid>&reaction_type=<1|2>
GET /v1/reactionsByCast?target_fid=<fid>&target_hash=<hash>&reaction_type=<1|2>
```

**Links (Follows):**
```
GET /v1/linksByFid?fid=<fid>&link_type=follow       # who user follows
GET /v1/linksByTargetFid?target_fid=<fid>&link_type=follow  # user's followers
```

**User Data:**
```
GET /v1/userDataByFid?fid=<fid>                    # full profile
GET /v1/userDataByFid?fid=<fid>&user_data_type=1  # display name only
```

**Verifications & Signers:**
```
GET /v1/verificationsByFid?fid=<fid>
GET /v1/userNameProofByName?fname=<username>
GET /v1/onChainSignersByFid?fid=<fid>
```

**Metadata:**
```
GET /v1/storageLimitsByFid?fid=<fid>
GET /v1/info                                        # hub version + sync status
GET /v1/info?dbstats=1                              # with DB stats
```

**Writes:**
```
POST /v1/submitMessage     # body: serialized protobuf (used for managed signers internally)
```

**Real-time Events (SSE):**
```
GET /v1/events?from_event_id=<id>   # stream new messages as they merge
```

### gRPC API (Port 2283)

The gRPC Subscribe RPC is the ONLY way to stream real-time updates:

```typescript
const stream = await client.subscribe({
  eventTypes: [HubEventType.MERGE_MESSAGE]
});
for await (const event of stream.value) {
  // new cast, reaction, follow, or onchain event
}
```

Other key gRPC calls: `getCastsByFid`, `getLinksByFid`, `getReactionsByFid`, `getVerificationsByFid`.

### Public Hub Providers (2026)

| Provider | gRPC Endpoint | HTTP Endpoint | Auth | Notes |
|----------|---------------|---------------|------|-------|
| **Neynar** | `hub-grpc-api.neynar.com:443` | `hub-api.neynar.com/v1/` | API key | Also offers v2 REST wrapper |
| **Pinata** | `hub-grpc.pinata.cloud:443` | `hub.pinata.cloud/v1/` | Free | Public access, no key needed |
| **Airstack** | N/A (GraphQL only) | `hubs.airstack.xyz` (GraphQL) | API key | GraphQL layer on top of hub data |

**SDK requirements:** Node.js 22.11.0+ for optimal compatibility (especially for Mini Apps).

## ZAO Application

1. **Reads:** Use Neynar v2 REST API (`/v2/farcaster/feed`, `/v2/farcaster/cast`, `/v2/farcaster/user/bulk`) in `src/lib/neynar/` for feed fetching and user lookups. Fallback to Pinata HTTP API if Neynar is rate-limited.

2. **Real-time Updates:** Route `/api/farcaster/subscribe` uses gRPC Subscribe (via `@farcaster/hub-nodejs` + Pinata endpoint) to stream new casts/reactions for `/chat` page. Emit via WebSocket or Server-Sent Events.

3. **Writes:** Never call submitMessage directly. Writes are Neynar managed signers only (see doc 017). ZAO SDK in `src/lib/neynar/managedSigner.ts` wraps `/v2/farcaster/signer` and `/v2/farcaster/cast` POST.

4. **Self-hosted Future:** Shuttle (v0.9.6) available if ZAO runs a custom PostgreSQL-indexed feed. Currently unused.

## Sources

- [farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) [FULL] - GitHub repo, 831 stars, 160 contributors, last push 2026-02-24, 110 releases
- [Pinata Farcaster Hubs Docs](https://docs.pinata.cloud/farcaster/hubs) [PARTIAL - timeout, used WebSearch results]
- [Farcaster Hub gRPC API Reference](https://docs.farcaster.xyz/reference/hubble/grpcapi/grpcapi) [FAILED - 404]
- [QuickNode Farcaster Frame Guide](https://www.quicknode.com/guides/social/how-to-build-a-farcaster-frame) [PARTIAL - mentions hub architecture]
- [dTech Hub Overview](https://dtech.vision/farcaster/hubs/) [PARTIAL - hub role explained, endpoints mentioned]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Benchmark Neynar vs Pinata HTTP latency under load | Dev | Performance | 2026-06-10 |
| Implement gRPC Subscribe stream to WebSocket tunnel | Dev | Code | 2026-06-03 |
| Add Shuttle PostgreSQL indexing POC (optional, if volume hits 10k/day) | Dev | Infrastructure | 2026-07-01 |
