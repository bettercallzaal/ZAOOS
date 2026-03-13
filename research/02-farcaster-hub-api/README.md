# Farcaster Hub API

> Source: [github.com/farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo)

## Hub Monorepo Packages

| Package | npm Name | Purpose |
|---------|----------|---------|
| **Hubble** | (binary) | Full Hub node — Rust core + TypeScript wrapper |
| **hub-nodejs** | `@farcaster/hub-nodejs` | Node.js gRPC client SDK |
| **hub-web** | `@farcaster/hub-web` | Browser gRPC-Web client SDK |
| **core** | `@farcaster/core` | Shared types, protobuf defs, crypto, message builders |
| **shuttle** | (app) | ETL pipeline: Hub → PostgreSQL |

---

## Default Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| **2283** | gRPC | Full-featured API + streaming |
| **2281** | HTTP | REST-like wrapper |
| **2282** | libp2p | Gossip/sync |

---

## HTTP API Endpoints

Base: `http://<hub>:2281/v1/`

### Casts
```
GET /v1/castById?fid=<fid>&hash=<hash>
GET /v1/castsByFid?fid=<fid>&pageSize=N&pageToken=T&reverse=bool
GET /v1/castsByParent?fid=<parent_fid>&hash=<parent_hash>
GET /v1/castsByParent?url=<parent_url>              # channel feed
GET /v1/castsByMention?fid=<fid>
```

### Reactions
```
GET /v1/reactionById?fid=<fid>&target_fid=<tfid>&target_hash=<thash>&reaction_type=<1|2>
GET /v1/reactionsByFid?fid=<fid>&reaction_type=<1|2>
GET /v1/reactionsByCast?target_fid=<fid>&target_hash=<hash>&reaction_type=<1|2>
GET /v1/reactionsByTarget?url=<url>&reaction_type=<1|2>
```

### Links (Follows)
```
GET /v1/linkById?fid=<fid>&target_fid=<tfid>&link_type=follow
GET /v1/linksByFid?fid=<fid>&link_type=follow          # who you follow
GET /v1/linksByTargetFid?target_fid=<fid>&link_type=follow  # followers
```

### User Data
```
GET /v1/userDataByFid?fid=<fid>                        # all profile data
GET /v1/userDataByFid?fid=<fid>&user_data_type=<1-6>   # specific field
```

### Verifications & Identity
```
GET /v1/verificationsByFid?fid=<fid>
GET /v1/userNameProofByName?name=<fname>
GET /v1/userNameProofsByFid?fid=<fid>
GET /v1/onChainSignersByFid?fid=<fid>
GET /v1/onChainEventsByFid?fid=<fid>&event_type=<type>
```

### Storage & Info
```
GET /v1/storageLimitsByFid?fid=<fid>
GET /v1/info
GET /v1/info?dbstats=1
```

### Write
```
POST /v1/submitMessage     # body: serialized protobuf Message
```

### Real-time Events
```
GET /v1/events?from_event_id=<id>   # SSE stream
```

### Pagination
All list endpoints support: `pageSize` (max 1000), `pageToken` (cursor), `reverse` (bool)

---

## gRPC API (Streaming)

The gRPC `Subscribe` RPC is critical for real-time feeds:

```typescript
const stream = await client.subscribe({
  eventTypes: [HubEventType.MERGE_MESSAGE]
});
for await (const event of stream.value) {
  // real-time: new casts, reactions, follows
}
```

---

## Hosted Hub Providers

| Provider | gRPC | HTTP | Notes |
|----------|------|------|-------|
| **Neynar** | `hub-grpc-api.neynar.com:443` | `hub-api.neynar.com` | API key required. Also has higher-level REST API. |
| **Pinata** | `hub-grpc.pinata.cloud:443` | `hub.pinata.cloud` | Free public access. Auth Kit. |
| **Airstack** | (GraphQL) | `hubs.airstack.xyz` | GraphQL layer + onchain data. |

---

## Neynar Higher-Level REST API (v2)

Much easier than raw hub API for common operations:

```
GET  /v2/farcaster/feed?feed_type=following&fid=<fid>
GET  /v2/farcaster/feed/trending
GET  /v2/farcaster/cast?identifier=<hash>&type=hash
GET  /v2/farcaster/user/bulk?fids=3,2
POST /v2/farcaster/cast         # managed signer
Header: api_key: <your-key>
```

Neynar also offers **managed signers** — handles key registration and signing flow.

---

## SDK Usage Examples

### Connect to Hub (Node.js)
```typescript
import { getSSLHubRpcClient } from "@farcaster/hub-nodejs";
const client = getSSLHubRpcClient("hub-grpc.pinata.cloud:443");
```

### Read Casts
```typescript
const casts = await client.getCastsByFid({ fid: 3, pageSize: 25 });
if (casts.isOk()) {
  for (const cast of casts.value.messages) {
    console.log(cast.data?.castAddBody?.text);
  }
}
```

### Submit a Cast
```typescript
import { makeCastAdd, NobleEd25519Signer, FarcasterNetwork } from '@farcaster/hub-nodejs';

const signer = new NobleEd25519Signer(ed25519PrivateKey);
const cast = await makeCastAdd(
  {
    text: 'Hello ZAO!',
    embeds: [{ url: 'https://sound.xyz/track/...' }],
    mentions: [], mentionsPositions: [], embedsDeprecated: [],
    parentUrl: 'https://farcaster.group/music',
  },
  { fid: 12345, network: FarcasterNetwork.MAINNET },
  signer
);
await client.submitMessage(cast.value);
```

### Browser Client
```typescript
import { getHubRpcClient } from "@farcaster/hub-web";
const client = getHubRpcClient("https://hub.pinata.cloud");
```

---

## Key Takeaways for ZAO OS

- Use **Neynar API** for primary data access (feeds, search, trending)
- Use **hub HTTP API** for direct queries when needed
- Use **gRPC Subscribe** for real-time feed updates
- **Shuttle** pattern (Hub → PostgreSQL) is useful for custom feed algorithms
- All writes require Ed25519-signed protobuf messages
