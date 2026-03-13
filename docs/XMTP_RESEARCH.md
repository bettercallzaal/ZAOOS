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
