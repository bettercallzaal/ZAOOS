# Chat & Messaging on Farcaster

> How to build the ZAO OS chat experience

## Two Approaches

| Approach | Privacy | Best For | Protocol |
|----------|---------|----------|----------|
| **Farcaster Channels** | Public | Community chat rooms, open discussion | Farcaster Hubs / Neynar |
| **XMTP** | E2E Encrypted | DMs, private groups | XMTP Network |

**Warpcast deprecated its native DMs and switched to XMTP.** Farcaster has no protocol-level DM system.

---

## Approach 1: Farcaster Channels as Chat Rooms (MVP)

Treat a channel's cast feed as a real-time chat stream. Simple, public, and ships fast.

### Read Channel Messages
```typescript
// Neynar API — fetch channel casts as "chat history"
const res = await fetch(
  `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=zao&limit=50`,
  { headers: { api_key: process.env.NEYNAR_API_KEY! } }
);
const { casts } = await res.json();
```

### Post a Message (Cast to Channel)
```typescript
await fetch("https://api.neynar.com/v2/farcaster/cast", {
  method: "POST",
  headers: { api_key: NEYNAR_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    signer_uuid: userSignerUUID,
    text: "Hello ZAO!",
    channel_id: "zao",
  }),
});
```

### Reply Threads (Sub-Conversations)
```typescript
await fetch("https://api.neynar.com/v2/farcaster/cast", {
  method: "POST",
  headers: { api_key: NEYNAR_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    signer_uuid: userSignerUUID,
    text: "Replying in thread",
    parent: "0xCAST_HASH",  // parent cast hash
  }),
});
```

### Real-Time Updates (Hub gRPC Stream)
```typescript
import { getSSLHubRpcClient } from "@farcaster/hub-nodejs";

const hub = getSSLHubRpcClient("hub-grpc.pinata.cloud");

const stream = await hub.subscribe({
  eventTypes: [1], // MERGE_MESSAGE
});

if (stream.isOk()) {
  for await (const event of stream.value) {
    const msg = event.mergeMessageBody?.message;
    if (msg?.data?.castAddBody?.parentUrl?.includes("zao")) {
      // New message in ZAO channel
      console.log(msg.data.castAddBody.text);
    }
  }
}
```

### Limitations
- All casts are **public** — no private rooms
- Storage limits apply (casts cost storage units)
- No typing indicators, read receipts, or presence
- Polling or Hub subscription needed for real-time

---

## Approach 2: XMTP (Private DMs + Group Chat)

### Packages
| Package | Platform | Purpose |
|---------|----------|---------|
| `@xmtp/xmtp-js` | JS/TS | Core 1:1 messaging |
| `@xmtp/mls-client` | JS/TS | Group chat (MLS protocol) |
| `@xmtp/react-sdk` | React | React hooks + components |
| `@xmtp/content-type-reaction` | JS/TS | Reactions on messages |
| `@xmtp/content-type-reply` | JS/TS | Threaded replies |
| `@xmtp/content-type-remote-attachment` | JS/TS | File attachments |
| `@xmtp/content-type-read-receipt` | JS/TS | Read receipts |

### 1:1 Messaging
```typescript
import { Client } from "@xmtp/xmtp-js";

// Create client from wallet signer
const xmtp = await Client.create(signer, { env: "production" });

// Check if address can receive messages
const canMessage = await xmtp.canMessage("0xRecipient");

// Start conversation
const convo = await xmtp.conversations.newConversation("0xRecipient");
await convo.send("Hello from ZAO!");

// Stream incoming messages
for await (const msg of await convo.streamMessages()) {
  console.log(`${msg.senderAddress}: ${msg.content}`);
}
```

### Group Chat (MLS)
```typescript
import { Client } from "@xmtp/mls-client";

const client = await Client.create(signer, {
  env: "production",
  dbPath: "./xmtp-db",
});

// Create group
const group = await client.conversations.newGroup([
  "0xAddress1", "0xAddress2", "0xAddress3",
]);

await group.send("Hello group!");
await group.addMembers(["0xNewMember"]);
await group.removeMembers(["0xOldMember"]);

// Stream
for await (const msg of await group.streamMessages()) {
  console.log(`${msg.senderAddress}: ${msg.content}`);
}
```

### Resolving Farcaster FID → XMTP Address
```typescript
async function fidToXmtpAddress(fid: number): Promise<string | null> {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    { headers: { api_key: process.env.NEYNAR_API_KEY! } }
  );
  const { users } = await res.json();
  const address = users[0]?.verified_addresses?.eth_addresses?.[0]
    || users[0]?.custody_address;

  if (!address) return null;
  const canMsg = await xmtp.canMessage(address);
  return canMsg ? address : null;
}
```

---

## Recommended Architecture for ZAO OS

### MVP: Channel Chat
- Create a `/zao` Farcaster channel
- ZAO OS client renders it as a chat UI (not a feed)
- Cast = message, reply = thread
- Neynar API for reads/writes, Hub subscription for real-time
- **Public, simple, ships fast**

### Phase 2: Add XMTP DMs
- 1:1 private messaging between ZAO members
- Resolve FID → ETH address → XMTP
- Rich message types (reactions, replies, attachments)

### Phase 3: XMTP Group Chat
- Private group conversations for ZAO sub-communities
- MLS protocol for secure group messaging

```
┌──────────────────────────┐
│      ZAO OS Chat UI      │
├──────────┬───────────────┤
│ Public   │ Private       │
│ Channels │ Messages      │
│          │               │
│ Farcaster│ XMTP          │
│ Casts    │ E2E Encrypted │
│ via      │ via           │
│ Neynar   │ @xmtp/xmtp-js│
└──────────┴───────────────┘
```

---

## Open Source References

| Repo | Description |
|------|-------------|
| `xmtp/xmtp-quickstart-reactjs` | Minimal React chat with XMTP |
| `xmtp/example-chat-react` | Full-featured chat UI |
| `ephemerahq/converse` | Open-source XMTP mobile client with Farcaster identity |
| `xmtp-labs/xmtp-inbox-web` | Reference web inbox |

---

## Key Takeaways

- **MVP = Farcaster channel rendered as chat.** Public, no extra infra, uses Neynar API you already need.
- **XMTP for private messaging later.** Separate protocol, separate SDK, separate infra.
- **Identity bridge:** FID → ETH address → XMTP. Neynar resolves this.
- **Real-time:** Hub gRPC subscription or Neynar webhooks for live channel updates.
- **No native Farcaster DMs** — XMTP is the standard.
