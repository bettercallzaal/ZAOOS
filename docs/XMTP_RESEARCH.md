# XMTP Research — On-Chain Messaging for ZAO OS

## Overview

XMTP (Extensible Message Transport Protocol) is a decentralized, end-to-end encrypted messaging protocol for web3. It enables secure communication between wallet addresses, Farcaster IDs, ENS names, and other on-chain identities.

## Core Architecture

- **MLS encryption** (Messaging Layer Security) — same standard used by Signal/WhatsApp
- **Three-tier identity**: Inbox ID → Identities (wallets/FIDs) → Installations (devices)
- **Message storage**: encrypted payloads stored on XMTP network indefinitely
- **Client-side encryption**: SDK handles everything via WASM in browser, no server needed
- **Quantum-resistant**: hybrid encryption using NIST PQC standards (Kyber)

## XMTP v3 Features

- Group chat: up to **250 members** (encrypted)
- Forward secrecy via key rotation epochs
- Post-compromise security
- Native message streaming (`streamAllMessages()`)
- 228M+ messages processed since v3 launch
- NCC Group security audit completed (Dec 2024)

---

## SDK Landscape (Critical Detail)

### `@xmtp/browser-sdk` — THE Only Path

| Field | Value |
|-------|-------|
| Package | `@xmtp/browser-sdk` v6.4.0 |
| Status | **Alpha** — breaking changes expected |
| Engine | Rust core compiled to WASM (`@aspect-build/aspect-xmtp-wasm-bindings`) |
| Requirements | SharedArrayBuffer, COEP/COOP headers |
| Storage | OPFS (Origin Private File System) — **single tab limitation** |

```bash
npm install @xmtp/browser-sdk
```

### Dead/Deprecated SDKs — DO NOT USE

| Package | Status | Why |
|---------|--------|-----|
| `@xmtp/react-sdk` | **DEAD** | V2 only, no MLS/groups, deprecated |
| `@xmtp/xmtp-js` | **DEAD** | V2 protocol, replaced by browser-sdk |
| `xmtp` (npm) | Unrelated | Different package entirely |

### Other SDKs

| SDK | Package | Use Case |
|-----|---------|----------|
| Node.js | `@xmtp/node-sdk` | Server-side, bots, agents |
| React Native | `@xmtp/react-native-sdk` | Mobile apps |
| Agent | `@xmtp/agent-sdk` | ElizaOS/bot integration (persistent server, NOT serverless) |

---

## Next.js Integration — Headers & Config

### Required Headers (COEP/COOP)

XMTP's WASM engine requires `SharedArrayBuffer`, which browsers only allow with these headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

**Problem:** These headers break iframe embeds (Spotify, YouTube, SoundCloud players) because third-party content can't load under `require-corp`.

### Solution: Route-Scoped Headers

Apply COEP/COOP **only** to `/messages` routes, not globally:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['@xmtp/user-preferences-bindings-wasm'],

  async headers() {
    return [
      {
        // ONLY apply to messaging routes — protects music embeds
        source: '/messages/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};
```

### Alternative: `credentialless` Mode

Chrome 96+ supports `Cross-Origin-Embedder-Policy: credentialless` which is less restrictive — allows iframes that don't send credentials. Safari support is limited.

### Webpack Config for WASM

```typescript
// next.config.ts
webpack: (config) => {
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
  };
  return config;
},
```

---

## OPFS Single-Tab Limitation

XMTP browser SDK uses Origin Private File System (OPFS) for encrypted local storage. **OPFS locks are exclusive** — only one tab can hold an XMTP client at a time.

### Implications for ZAO OS
- User opens ZAO OS in two tabs → second tab's XMTP client fails to initialize
- No graceful degradation in the SDK currently

### Mitigation Strategies
1. **BroadcastChannel API** — detect other tabs, show "messaging active in another tab" warning
2. **SharedWorker** — share single XMTP client across tabs (complex, experimental)
3. **Accept the limitation** — small community, unlikely to be a frequent issue
4. **Recommendation**: Option 1 (BroadcastChannel detection) — simple, good UX

```typescript
// Tab detection example
const channel = new BroadcastChannel('zao-xmtp');
channel.postMessage({ type: 'xmtp-active' });
channel.onmessage = (e) => {
  if (e.data.type === 'xmtp-active') {
    // Show warning: "Messaging is active in another tab"
  }
};
```

---

## Farcaster Identity → XMTP Signer

### The Identity Bridge

Farcaster users have a **custody address** (the wallet that owns their FID). This same wallet can sign XMTP messages.

```typescript
import { Client } from '@xmtp/browser-sdk';

// 1. Get wallet signer from existing Farcaster auth
//    (user already connected wallet for Farcaster signer)
const signer = await getWalletSigner(); // EIP-1193 provider

// 2. Create XMTP client — prompts wallet signature popup
const client = await Client.create(signer, {
  env: 'production', // or 'dev' for testing
});

// Client is now tied to the user's Farcaster custody address
console.log(client.inboxId); // XMTP inbox ID
```

### Wallet Signature UX

- **First time**: User sees a wallet signature popup ("Sign to enable messaging")
- **Subsequent visits**: OPFS has cached keys, no popup needed
- **No gas fees** — it's just a signature, not a transaction

### Airstack API — FID to XMTP Resolution

Use Airstack to check which Farcaster members have XMTP-enabled wallets:

```graphql
query GetXMTPStatus($fid: String!) {
  Socials(input: { filter: { dappName: { _eq: farcaster }, userId: { _eq: $fid } }, blockchain: ethereum }) {
    Social {
      userAddress
      xmtp {
        isXMTPEnabled
      }
    }
  }
}
```

```typescript
// Check XMTP status for all allowlisted members
async function checkXMTPStatus(fids: number[]) {
  const results = await Promise.all(
    fids.map(fid => airstack.query(GET_XMTP_STATUS, { fid: String(fid) }))
  );
  return results.map(r => ({
    fid: r.fid,
    address: r.Socials?.Social?.[0]?.userAddress,
    xmtpEnabled: r.Socials?.Social?.[0]?.xmtp?.isXMTPEnabled ?? false,
  }));
}
```

**Note:** Not all Farcaster users have activated XMTP. For ZAO OS, we'd prompt users to activate during onboarding.

---

## Client Initialization Pattern

```typescript
import { Client, type ClientOptions } from '@xmtp/browser-sdk';
import { toBytes } from 'viem';

// Custom signer wrapping an EIP-1193 provider
const signer = {
  type: 'EOA' as const,
  getAddress: async () => walletAddress,
  signMessage: async (message: string) => {
    const sig = await provider.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });
    return toBytes(sig);
  },
};

const options: ClientOptions = {
  env: 'production',
  dbEncryptionKey: generateDbEncryptionKey(), // 32 random bytes, store in localStorage
};

const client = await Client.create(signer, options);
```

### DB Encryption Key

XMTP stores encrypted messages locally in OPFS. The `dbEncryptionKey` encrypts this local DB. Generate once, store in `localStorage`:

```typescript
function getOrCreateDbKey(): Uint8Array {
  const stored = localStorage.getItem('xmtp-db-key');
  if (stored) return new Uint8Array(JSON.parse(stored));

  const key = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem('xmtp-db-key', JSON.stringify(Array.from(key)));
  return key;
}
```

---

## Messaging Patterns

### 1:1 DMs

```typescript
// Create or resume a DM conversation
const dm = await client.conversations.newDm(recipientAddress);

// Send a message
await dm.send('Hey! Love that track you shared in #zao');

// Stream incoming messages
const stream = dm.stream();
for await (const message of stream) {
  console.log(`${message.senderAddress}: ${message.content}`);
}
```

### Group Chat

```typescript
// Create a group
const group = await client.conversations.newGroup(
  [member1Address, member2Address, ...],
  {
    name: 'ZAO Mods',
    description: 'Private mod channel',
    imageUrl: 'https://zaoos.com/logo.png',
  }
);

// Admin controls
await group.addMembers([newMemberAddress]);
await group.removeMembers([removedAddress]);
await group.updateName('ZAO Core Team');

// Permissions
await group.addAdmin(memberAddress);      // Can add/remove members
await group.addSuperAdmin(memberAddress); // Can add/remove admins

// Stream all group messages
const stream = client.conversations.streamAllMessages();
for await (const message of stream) {
  console.log(`[${message.conversationId}] ${message.senderAddress}: ${message.content}`);
}
```

### Group Limits & Permissions

| Role | Add Members | Remove Members | Add Admin | Update Group |
|------|------------|----------------|-----------|-------------|
| Member | No | No | No | No |
| Admin | Yes | Yes (non-admin) | No | Yes |
| Super Admin | Yes | Yes (anyone) | Yes | Yes |
| Creator | All powers, cannot be removed | | | |

- Max **250 members** per group
- Max **10 installations** (devices) per inbox

---

## Content Types

XMTP supports structured content types beyond plain text:

| Type | Package | Use Case |
|------|---------|----------|
| Text | Built-in | Plain messages |
| Attachment | `@xmtp/content-type-remote-attachment` | Images, files (encrypted upload) |
| Reply | `@xmtp/content-type-reply` | Thread replies |
| Reaction | `@xmtp/content-type-reaction` | Emoji reactions |
| Read Receipt | `@xmtp/content-type-read-receipt` | Read status |

```typescript
import { ContentTypeRemoteAttachment } from '@xmtp/content-type-remote-attachment';

// Register content types
const client = await Client.create(signer, {
  codecs: [new RemoteAttachmentCodec()],
});

// Send image
const attachment = {
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  data: imageBytes,
};
const encrypted = await RemoteAttachmentCodec.encryptAttachment(attachment);
const url = await uploadToStorage(encrypted); // Upload to your storage
await dm.send({ remoteAttachment: { url, ...encrypted.metadata } }, ContentTypeRemoteAttachment);
```

---

## Consent & Spam Prevention

XMTP has a network-level consent protocol:

```typescript
// Check consent before showing conversation
const consent = await client.contacts.consentState(address);
// consent: 'allowed' | 'blocked' | 'unknown'

// Allow/block addresses
await client.contacts.allow([address]);
await client.contacts.block([spammerAddress]);
```

For ZAO OS: since we have an allowlist, auto-allow all allowlisted members on XMTP client init.

```typescript
// On XMTP init, auto-allow all ZAO members
const allowlistedAddresses = await fetchAllowlistAddresses();
await client.contacts.allow(allowlistedAddresses);
```

---

## Agent/Bot Integration (`@xmtp/agent-sdk`)

For the future ElizaOS agent integration:

```typescript
import { Agent } from '@xmtp/agent-sdk';

const agent = new Agent({
  walletKey: process.env.AGENT_WALLET_KEY, // Dedicated bot wallet
  onMessage: async (message, context) => {
    if (message.content.includes('/help')) {
      await context.reply('Welcome to ZAO! Here\'s how to get started...');
    }
  },
});

await agent.start();
```

**Important**: Agent SDK runs on a **persistent server** (not serverless/Vercel). Needs a dedicated Node.js process — Railway, Fly.io, or similar.

---

## Cost Model

| Item | Cost |
|------|------|
| Current | **Free** — XMTP Labs absorbs all costs |
| Future projection | ~$5 per 100,000 messages |
| ZAO OS (40 members) | Negligible — maybe $1/month at peak |
| No API keys | Peer-to-peer via SDK |
| No server costs | Client-side encryption (basic messaging) |
| Agent server | ~$5-7/month (Railway/Fly.io for bot) |

---

## Reference Projects

| Project | Relevance | Link |
|---------|-----------|------|
| **Converse** | Primary XMTP messaging app, open source | `ephemeraHQ/converse-app` |
| **Papa Base** | Token-gated group chat — closest analog to ZAO | Community project |
| **dabit3/xmtp-chat-app-nextjs** | Next.js reference implementation | GitHub |
| **ephemeraHQ/xmtp-mini-app-examples** | Mini app debugging toolkit | GitHub |
| **gregfromstl/farcaster-support-agent** | AI agent via XMTP + Farcaster | GitHub |
| **xmtp/xmtp-quickstart-nextjs** | Official Next.js quickstart | GitHub |

---

## ZAO OS Implementation Plan

### Phase 1 — DMs (Start Here)

**Goal**: Encrypted 1:1 messaging between ZAO members

1. Install `@xmtp/browser-sdk`
2. Add route-scoped COEP/COOP headers for `/messages` routes
3. Configure webpack for WASM
4. Create `useXMTP` hook:
   - Initialize client from Farcaster custody wallet
   - Cache dbEncryptionKey in localStorage
   - Handle OPFS tab-lock with BroadcastChannel
5. Create `XMTPProvider` context (client instance, conversations, messages)
6. Build DM UI:
   - Conversation list sidebar
   - Message thread view
   - Compose bar (text + attachments)
   - Online/XMTP-enabled indicators per member
7. Use Airstack to resolve FID → wallet → XMTP inbox
8. Auto-allow all allowlisted members on consent list

**Files to create:**
```
src/hooks/useXMTP.ts          — Client init, tab detection
src/contexts/XMTPContext.tsx   — Provider with conversations/messages
src/app/messages/layout.tsx    — Layout with COEP headers applied
src/app/messages/page.tsx      — DM inbox
src/components/dm/ConversationList.tsx
src/components/dm/MessageThread.tsx
src/components/dm/DMComposeBar.tsx
src/lib/xmtp/client.ts        — Client factory, signer adapter
src/lib/xmtp/airstack.ts      — FID → XMTP resolution
```

### Phase 2 — Groups

**Goal**: Private encrypted group chats

1. Group creation UI (name, description, member selection from allowlist)
2. Admin controls (add/remove members, promote admins)
3. Pre-create "ZAO Mods" group for admin channel
4. Group settings panel
5. Content types: reactions, replies, read receipts

### Phase 3 — Bot/Agent

**Goal**: ElizaOS agent with XMTP messaging

1. Separate `zao-agent` repo with `@xmtp/agent-sdk`
2. Deploy to Railway/Fly.io (persistent process)
3. Agent wallet registered on XMTP
4. Onboarding flows, help commands, moderation
5. Can message users privately via DM or in groups

---

## Architecture Diagram

```
ZAO OS Client (zaoos.com)
├── /chat (public feed)
│   └── Farcaster via Neynar API
│       ├── Channel casts (#zao, #zabal, #cocconcertz)
│       ├── Reactions, replies, quotes
│       └── Music embeds (Spotify, YouTube, SoundCloud)
│
├── /messages (private messaging) ← NEW
│   ├── COEP/COOP headers (scoped to this route)
│   └── XMTP Browser SDK (WASM)
│       ├── 1:1 encrypted DMs
│       ├── Private group chats (up to 250)
│       ├── Content types (text, images, reactions)
│       └── Consent-based spam prevention
│
└── Services
    ├── Airstack API → FID ↔ wallet ↔ XMTP resolution
    ├── Supabase → allowlist, settings, cached data
    └── (future) zao-agent → ElizaOS bot on XMTP
```

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser SDK still alpha | Breaking changes on update | Pin version, test upgrades in staging |
| OPFS single-tab lock | UX confusion | BroadcastChannel detection + warning |
| COEP breaks music embeds | Spotify/YouTube iframes fail | Route-scoped headers (only `/messages`) |
| Not all members XMTP-enabled | Can't DM everyone | Onboarding prompt to activate XMTP |
| SharedArrayBuffer not in all browsers | Safari/Firefox gaps | Fallback message: "Use Chrome for DMs" |
| 250 member group limit | Scaling constraint | Fine for ZAO (40 members), revisit later |

---

## Timeline

- **Now**: Research complete, ready to implement Phase 1
- **Phase 1 (DMs)**: ~2-3 working sessions to build core DM functionality
- **Phase 2 (Groups)**: After DMs are stable
- **Phase 3 (Agent)**: After ElizaOS agent repo is set up

---

*Last updated: 2026-03-13*

---
---

# XMTP Deep Dive — March 2026 Web Research Update

Updated findings from comprehensive web research on 2026-03-14. This section contains verified code patterns, SDK updates, and architectural recommendations based on current XMTP documentation.

## 1. Current SDK State (March 2026)

### Monorepo: `xmtp/xmtp-js`

The canonical source is the **xmtp-js monorepo** on GitHub. It contains:

| Directory | Purpose |
|-----------|---------|
| `sdks/browser-sdk` | `@xmtp/browser-sdk` — THE web SDK (WASM + Web Workers) |
| `sdks/node-sdk` | `@xmtp/node-sdk` — server-side, CLI |
| `sdks/agent-sdk` | `@xmtp/agent-sdk` — bots with event-driven middleware |
| `content-types/` | Reactions, replies, attachments, read receipts, etc. |
| `apps/xmtp.chat` | Reference chat app at xmtp.chat |

- **526 releases** as of March 2026
- Latest release: `@xmtp/agent-sdk@2.3.0` (March 14, 2026)
- **39+ contributors**, TypeScript 98.1%

### `@xmtp/react-sdk` is CONFIRMED DEAD

The npm page now says: "This package is no longer supported." The `xmtp-web` repo is archived. All active development moved to `xmtp-js`. You MUST build custom React hooks wrapping `@xmtp/browser-sdk`.

### XMTP Mainnet Transition

XMTP mainnet Phase 1 is expected to complete **March 2026**. This means:
- Live network with curated node operators
- Messaging fees flowing to cover infrastructure
- Production-ready for real apps

---

## 2. Verified Browser SDK Code Patterns

### Signer Creation (V3 API — Current)

```typescript
import type { Signer, Identifier } from '@xmtp/browser-sdk';
import { IdentifierKind } from '@xmtp/browser-sdk';

const signer: Signer = {
  type: 'EOA',
  getIdentifier: () => ({
    identifier: '0x1234...abcd',          // wallet address
    identifierKind: IdentifierKind.Ethereum,
  }),
  signMessage: async (message: string): Promise<Uint8Array> => {
    // Use your wallet provider to sign, return raw bytes
    const hexSig = await provider.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });
    return hexToBytes(hexSig); // convert hex string to Uint8Array
  },
};
```

### Client Creation

```typescript
import { Client } from '@xmtp/browser-sdk';

const client = await Client.create(signer, {
  // dbEncryptionKey is NOT used for encryption in browser environments
  // due to technical limitations — OPFS handles storage
});
```

**Key change from earlier research:** The docs now indicate `dbEncryptionKey` is not used in browser environments. The OPFS storage handles encryption natively.

### Next.js Configuration (Verified)

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/messages/:path*",  // Scope to messaging routes only!
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

These headers are required because the Browser SDK uses `SharedArrayBuffer` which requires cross-origin isolation.

---

## 3. Conversation & Message API (V3 — Verified)

### Check Identity Reachability (canMessage)

```typescript
import { Client, IdentifierKind, type Identifier } from "@xmtp/browser-sdk";

const identifiers: Identifier[] = [
  { identifier: "0xAddress1", identifierKind: IdentifierKind.Ethereum },
  { identifier: "0xAddress2", identifierKind: IdentifierKind.Ethereum },
];

// Returns Map<string, boolean> — which addresses can receive XMTP messages
const canMessageMap = await Client.canMessage(identifiers);
```

**Performance note:** `canMessage` is a static method on `Client` — you don't need a logged-in client to check. Batch multiple addresses in one call.

### Create DM

```typescript
const dm = await client.conversations.createDm(recipientInboxId);
await dm.sendText('gm');
```

### Create Group

```typescript
const group = await client.conversations.createGroup(
  [member1InboxId, member2InboxId],
  {
    name: 'ZAO Mods',
    description: 'Private mod channel',
    imageUrl: 'https://zaoos.com/logo.png',
  }
);
await group.sendText('Welcome to the mod channel');
```

### Optimistic Group Creation (NEW — Good UX Pattern)

```typescript
// Create group instantly, even offline
const group = await client.conversations.createGroupOptimistic();
await group.sendText('First message!', true); // true = optimistic send
await group.addMembers([memberInboxId]);
await group.publishMessages(); // Sync to network when ready
```

This enables instant group creation and message preparation before adding members, even when offline.

### Fetch Conversations by Various Keys

```typescript
import { IdentifierKind } from "@xmtp/browser-sdk";

// By conversation ID
const convo = await client.conversations.getConversationById(conversationId);

// By message ID
const msg = await client.conversations.getMessageById(messageId);

// DM by inbox ID
const dm = await client.conversations.getDmByInboxId(peerInboxId);

// DM by Ethereum address
const dm2 = await client.conversations.fetchDmByIdentifier({
  identifier: '0xPeerAddress',
  identifierKind: IdentifierKind.Ethereum,
});
```

---

## 4. Listing Conversations — Performance Patterns

### Basic Listing with Consent Filtering

```typescript
import { ConsentState } from "@xmtp/browser-sdk";

// Recommended: Only show allowed conversations
const conversations = await client.conversations.list({
  consentStates: [ConsentState.Allowed],
});

const groups = await client.conversations.listGroups({
  consentStates: [ConsentState.Allowed],
});

const dms = await client.conversations.listDms({
  consentStates: [ConsentState.Allowed],
});
```

**Default behavior:** `list()` returns conversations with consent state `Allowed` or `Unknown`. Best practice is to filter to `Allowed` only to prevent spam.

### Pagination by Creation Time (Stable Sorting)

```typescript
const firstPage = await client.conversations.list({
  limit: 10,
  orderBy: 'createdAt',
});

const secondPage = await client.conversations.list({
  limit: 10,
  createdBeforeNs: firstPage[firstPage.length - 1].createdAtNs,
});
```

### Pagination by Last Activity (Use Carefully)

```typescript
// WARNING: Only use for non-streaming apps!
// With streaming enabled, conversations can "jump" between pages
const firstPage = await client.conversations.list({
  limit: 10,
});

const secondPage = await client.conversations.list({
  limit: 10,
  lastActivityBeforeNs: firstPage[firstPage.length - 1].lastActivityNs,
});
```

### Active Membership Check

```typescript
// Check if user is still a member of a group
const isActive = await conversation.isActive();
```

---

## 5. Streaming — Real-Time Message Patterns

### Stream All Messages

```typescript
import { ConsentState } from "@xmtp/browser-sdk";

const stream = await client.conversations.streamAllMessages({
  consentStates: [ConsentState.Allowed],
  onValue: (message) => {
    console.log('New message:', message);
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
  onFail: () => {
    console.log('Stream permanently failed');
  },
});

// Alternative: for-await loop
for await (const message of stream) {
  console.log('New message:', message);
}
```

### Stream New Conversations

```typescript
const stream = await client.conversations.stream({
  onValue: (conversation) => {
    console.log('New conversation:', conversation);
  },
  onError: (error) => {
    console.error(error);
  },
  onFail: () => {
    console.log('Stream failed');
  },
});
```

### Stream with Retry Configuration

```typescript
const stream = await client.conversations.streamAllMessages({
  consentStates: [ConsentState.Allowed],
  retryAttempts: 10,        // default: 10
  retryDelay: 20000,        // 20 seconds (default: 60000)
  retryOnFail: true,        // default: true
  onValue: (message) => {
    console.log('New message:', message);
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
  onFail: () => {
    console.log('Stream failed after all retries');
  },
  onRestart: () => {
    console.log('Stream restarted');
  },
  onRetry: (attempt, maxAttempts) => {
    console.log(`Retry ${attempt}/${maxAttempts}`);
  },
});
```

### Critical Streaming Behavior: Catch-Up Messages

Streaming includes **all messages sent after your last sync**, including messages missed when offline. When coming back online, the client automatically receives missed messages followed by new real-time messages.

**To stream ONLY new real-time messages** (no catch-up): sync with the network before starting the stream.

```typescript
// Sync first to mark current point, then stream only new messages
await client.conversations.syncAll(['allowed']);

// Now stream will only deliver messages from this point forward
const stream = await client.conversations.streamAllMessages({
  consentStates: [ConsentState.Allowed],
  onValue: (message) => { /* only new real-time messages */ },
});
```

---

## 6. Sync Patterns

### Sync All (Recommended)

```typescript
// Sync only allowed conversations (performance optimization)
await client.conversations.syncAll(['allowed']);
```

Syncing does NOT refetch existing messages. It only fetches new messages and group updates since last sync. It also skips groups you're no longer a member of.

### Sync Single Conversation

```typescript
await conversation.sync();
```

### Sync Preferences Only

```typescript
await client.preferences.sync();
```

### Database Connection Management

```typescript
// Release DB connection (e.g., when navigating away from /messages)
await client.dropLocalDatabaseConnection();

// Reconnect when returning
await client.reconnectLocalDatabase();
```

---

## 7. Inbox & Identity Management

### Inbox State

```typescript
// Get current inbox state from local cache
const inboxState = await client.preferences.inboxState();

// Fetch fresh inbox states from network
const states = await client.preferences.fetchInboxStates([inboxId1, inboxId2]);

// Get from local cache (faster, may be stale)
const cachedStates = await client.preferences.getInboxStates([inboxId1, inboxId2]);
```

### Installation Management

An inbox ID can have up to **10 app installations**. When the limit is reached:

```typescript
// Revoke specific installations
await client.revokeInstallations([installationId1, installationId2]);

// Revoke all OTHER installations (keep current)
await client.revokeAllOtherInstallations();
```

### Static Installation Revocation (Without Logging In)

```typescript
const inboxStates = await Client.fetchInboxStates(
  [inboxId],
  "production"
);

const toRevoke = inboxStates[0].installations.map((i) => i.bytes);

await Client.revokeInstallations(
  signer,
  inboxId,
  toRevoke,
  "production"
);
```

### Add/Remove Identities

```typescript
// Add another wallet to your XMTP inbox
await client.unsafe_addAccount(newSigner, true);

// Remove an identity
await client.removeAccount(identifier);
```

**Constraints:**
- 10 active installations per inbox
- 256 cumulative inbox updates maximum
- Recovery identity cannot be removed or reassigned

---

## 8. Farcaster + XMTP Identity Resolution

### XMTP Native Support

XMTP natively supports Farcaster as a social ID identity system, alongside ENS, Base, Lens, Nostr, and Bluesky. Over **2 million verified identities** have enabled XMTP messaging.

### Airstack API for FID Resolution

Airstack provides the bridge between Farcaster FID and XMTP inbox:

```graphql
query GetXMTPStatus($fid: String!) {
  Socials(
    input: {
      filter: {
        dappName: { _eq: farcaster }
        userId: { _eq: $fid }
      }
      blockchain: ethereum
    }
  ) {
    Social {
      userAddress
      profileName
      xmtp {
        isXMTPEnabled
      }
    }
  }
}
```

```typescript
import { init, useLazyQueryWithPagination } from "@airstack/airstack-react";

// Initialize Airstack
init(process.env.NEXT_PUBLIC_AIRSTACK_KEY!);

// Universal resolver: FID -> wallet -> XMTP status
async function resolveXMTPIdentity(fid: number) {
  const result = await airstackClient.query(GET_XMTP_STATUS, {
    fid: String(fid),
  });

  const social = result.data?.Socials?.Social?.[0];
  return {
    fid,
    address: social?.userAddress,
    username: social?.profileName,
    xmtpEnabled: social?.xmtp?.isXMTPEnabled ?? false,
  };
}
```

### Workflow for ZAO OS

1. User authenticates via Farcaster (already done)
2. Get their custody address from Neynar
3. Use Airstack to check if custody address has XMTP enabled
4. If not enabled: show "Enable encrypted messaging" prompt (wallet signature)
5. If enabled: create XMTP client from custody address signer
6. For member lookup: batch-check all allowlisted FIDs via Airstack

---

## 9. Frames in XMTP

XMTP supports Farcaster Frames inside messages via the **Open Frames** standard:

- **frames.js** provides cross-protocol support — write frames that work in both Farcaster feeds and XMTP chats
- Frames can identify whether the user interacted from Farcaster or XMTP
- Converse messenger was the first to ship frames support

```typescript
// frames.js unified handler
import { createFrames, Button } from "frames.js/next";

const frames = createFrames({
  // Works in both Farcaster and XMTP contexts
});

const handleRequest = frames(async (ctx) => {
  const isXmtp = ctx.message?.requesterFid === undefined; // XMTP has no FID
  return {
    image: <div>Hello from {isXmtp ? 'XMTP' : 'Farcaster'}!</div>,
    buttons: [<Button action="post">Click me</Button>],
  };
});
```

---

## 10. Open Source Reference Apps (Updated)

| Project | Status | Architecture | URL |
|---------|--------|-------------|-----|
| **Convos** (formerly Converse) | **ACTIVE** | React Native, Expo, EAS | `github.com/ephemeraHQ/convos-app` |
| **Converse** (original) | **ARCHIVED** | React Native | `github.com/xmtplabs/converse-app` |
| **xmtp.chat** | **ACTIVE** | In xmtp-js monorepo | `apps/xmtp.chat` in `xmtp/xmtp-js` |
| **XMTP Inbox Web** | Archived | React web app | `github.com/ephemeraHQ/xmtp-inbox-web` |
| **dabit3/xmtp-chat-app-nextjs** | Reference | Next.js + React | `github.com/dabit3/xmtp-chat-app-nextjs` |
| **Demo Chat React** | Demo | Ephemeral inboxes | `github.com/ephemeraHQ/demo-chat-react` |
| **XMTP Mini App Examples** | Active | Mini app debugging | `github.com/ephemeraHQ/xmtp-mini-app-examples` |
| **XMTP Agent Examples** | Active | Bot patterns | `github.com/ephemeraHQ/xmtp-agent-examples` |
| **awesome-xmtp** | Curated list | Links to all XMTP projects | `github.com/xmtp/awesome-xmtp` |

**Best reference for web:** The `xmtp.chat` app inside the xmtp-js monorepo is the most current web implementation.

**Best reference for architecture:** Convos app (`ephemeraHQ/convos-app`) shows production-grade patterns but is React Native, not web.

---

## 11. Revised Custom React Hooks Design

Since `@xmtp/react-sdk` is dead, here are the hooks we need to build:

### `useXMTPClient` — Client Lifecycle

```typescript
import { Client, type Signer } from '@xmtp/browser-sdk';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useXMTPClient(signer: Signer | null) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<Client | null>(null);

  const initialize = useCallback(async () => {
    if (!signer || clientRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const xmtpClient = await Client.create(signer, {});
      clientRef.current = xmtpClient;
      setClient(xmtpClient);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create XMTP client'));
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.dropLocalDatabaseConnection();
      clientRef.current = null;
      setClient(null);
    }
  }, []);

  return { client, isLoading, error, initialize, disconnect };
}
```

### `useConversations` — List & Stream

```typescript
import { ConsentState } from '@xmtp/browser-sdk';
import { useState, useEffect } from 'react';

export function useConversations(client: Client | null) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client) return;

    let stream: any;
    const load = async () => {
      setIsLoading(true);
      await client.conversations.syncAll(['allowed']);
      const convos = await client.conversations.list({
        consentStates: [ConsentState.Allowed],
      });
      setConversations(convos);
      setIsLoading(false);

      // Stream new conversations
      stream = await client.conversations.stream({
        onValue: (conversation) => {
          setConversations(prev => [conversation, ...prev]);
        },
      });
    };

    load();
    return () => { stream?.return?.(); };
  }, [client]);

  return { conversations, isLoading };
}
```

### `useMessages` — Messages for a Conversation

```typescript
export function useMessages(conversation: any | null) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!conversation) return;

    let stream: any;
    const load = async () => {
      setIsLoading(true);
      await conversation.sync();
      const msgs = await conversation.messages();
      setMessages(msgs);
      setIsLoading(false);

      // Stream new messages for this conversation
      stream = await conversation.stream({
        onValue: (message) => {
          setMessages(prev => [...prev, message]);
        },
      });
    };

    load();
    return () => { stream?.return?.(); };
  }, [conversation]);

  const sendMessage = async (text: string) => {
    if (!conversation) return;
    await conversation.sendText(text);
  };

  return { messages, isLoading, sendMessage };
}
```

---

## 12. Architectural Recommendations for ZAO OS

### Do

1. **Use `@xmtp/browser-sdk` directly** — build thin React hooks around it
2. **Scope COEP/COOP headers to `/messages` only** — protects music embeds
3. **Use `ConsentState.Allowed` everywhere** — filter list, sync, and streams
4. **Sync before streaming** if you want only real-time messages (no catch-up)
5. **Use `createGroupOptimistic()`** for instant-feeling group creation UX
6. **Batch `canMessage` checks** — it's a static method, no client needed
7. **Use Airstack** for Farcaster FID to XMTP inbox resolution
8. **Release DB connection** (`dropLocalDatabaseConnection`) when navigating away from `/messages`
9. **Use pagination with `createdAt` ordering** for stable conversation lists
10. **Cache inbox states locally** via `getInboxStates()` for faster lookups

### Don't

1. **Don't use `@xmtp/react-sdk`** — dead, V2 only
2. **Don't use `@xmtp/xmtp-js`** — legacy V2, replaced
3. **Don't paginate by `lastActivityNs` with streaming** — items jump between pages
4. **Don't apply COEP/COOP headers globally** — breaks all iframes
5. **Don't sync `unknown` or `denied` conversations** — wastes bandwidth, stores spam
6. **Don't run agent SDK on Vercel** — needs persistent process (Railway/Fly.io)
7. **Don't forget the 10-installation limit** — handle revocation gracefully
8. **Don't assume all Farcaster users have XMTP** — check with `canMessage` first

---

*Updated: 2026-03-14*
