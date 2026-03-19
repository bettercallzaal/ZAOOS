# 74 — XMTP V3 Browser SDK & MLS Encryption

> **Status:** Research complete
> **Date:** 2026-03-19
> **Goal:** Document what changed since doc 13, MLS group messaging details, and impact on ZAO OS's XMTP integration

---

## Key Decisions / Recommendations

| Priority | Action | Why |
|----------|--------|-----|
| **Critical** | Register a ZAO payer wallet on XMTP Funding Portal, fund with USDC on Base | Mainnet transition (March 2026) introduces ~$0.001/message fees — without a payer wallet, message sending will fail |
| **High** | Implement history sync using `sendSyncRequest()` / `sendSyncArchive(pin)` | v7.0.0 removed automatic history sync — new device/browser = no message history |
| **Medium** | Update doc 13 to reference `@xmtp/browser-sdk` instead of `@xmtp/xmtp-js` + `@xmtp/mls-client` | Doc 13 references obsolete packages |
| **Medium** | Add user warning about localStorage key loss | ZAO burner key lives in localStorage — clearing it = losing XMTP identity |
| **Low** | Track XMTP passkey identity (XIP-55) for portable XMTP identity | Eliminates browser-bound burner key dependency |

---

## Terminology Clarification

XMTP does **not** call their current release "v4." The current stable platform is **XMTP V3** with the unified `@xmtp/browser-sdk` package (replacing the old split between `@xmtp/xmtp-js` for 1:1 DMs and `@xmtp/mls-client` for groups). ZAO OS is already on this SDK (`@xmtp/browser-sdk@^7.0.0`).

---

## What ZAO OS Has Built (Current State)

ZAO OS has a **fully functional** XMTP integration. Both DMs and MLS group chat are working.

### Architecture

| Layer | File | What It Does |
|-------|------|-------------|
| Client | `src/lib/xmtp/client.ts` | Singleton with `createLocalSigner()` (ZAO burner key per FID), `createWalletSigner()` (real wallet), `createXMTPClient()` with encrypted OPFS database |
| Context | `src/contexts/XMTPContext.tsx` | Full React provider: multi-wallet, auto-connect, global streams, tab-lock, group creation, DMs, optimistic send |
| Hook | `src/hooks/useWalletXMTP.ts` | Wagmi bridge connecting real wallet to XMTP context |
| Types | `src/types/xmtp.ts` | `XMTPMessage`, `XMTPConversation`, `XMTPMember` interfaces |

### Working Features

- Both DMs (`createDmWithIdentifier`) and MLS groups (`createGroupWithIdentifiers`)
- Both ZAO burner key auth and real wallet auth
- Group creation, member add/remove, leave group
- Real-time streaming with reconnect (exponential backoff, max 5 attempts)
- Member discovery via `canMessage()` across all ZAO member wallets (batched in groups of 100)
- Optimistic send (`conv.sendText(text, true)` + `conv.publishMessages()`)
- Per-conversation message history (50 messages)
- Multi-tab OPFS lock via `BroadcastChannel`
- Encrypted local DB (`dbEncryptionKey` in localStorage)
- XMTP address persistence to Supabase (`/api/users/xmtp-address`)

---

## What Changed Since Doc 13

Doc 13 was written during the V2/early V3 era and references **obsolete packages**. Here's what moved:

### Identity Model Overhaul

| V2 (doc 13 era) | V3/Current |
|------------------|-----------|
| Ethereum address as primary identifier | **Inbox ID** — wallet-agnostic, stable |
| Raw `0x...` address strings | `IdentifierKind.Ethereum` + `identifier` objects |
| One wallet = one identity | Up to 256 linked identities per inbox (wallets, future: passkeys) |
| N/A | 10-installation limit per inbox |
| N/A | 256 cumulative inbox updates limit (permanent) |

### SDK Unification

| Before | After |
|--------|-------|
| `@xmtp/xmtp-js` (1:1 DMs) | `@xmtp/browser-sdk` (everything) |
| `@xmtp/mls-client` (groups) | `@xmtp/browser-sdk` (everything) |
| Two separate client APIs | Single `client.conversations` namespace |

### MLS Protocol Details

- **Ciphersuite:** `MLS_128_HPKEX25519_CHACHA20POLY1305_SHA256_Ed25519`
- **Forward secrecy:** Key ratcheting — old keys deleted after use
- **Post-compromise security:** MLS commit mechanism rotates group secrets
- **Post-quantum:** XWING KEM combines conventional + ML-KEM for quantum resistance
- **Audit:** NCC Group audited
- **Group scale:** 1,000+ members supported

### Browser Architecture

- **Runtime:** WASM (WebAssembly) + Web Workers
- **Storage:** OPFS (Origin Private File System) with SQLite — not IndexedDB
- **Constraint:** One-tab-at-a-time (OPFS SyncAccessHandle Pool VFS). ZAO OS already handles this with `BroadcastChannel` tab-lock
- **Encryption:** `dbEncryptionKey` (32-byte) encrypts local SQLite at rest. ZAO OS implements this

### History Sync (v7.0.0 Breaking Change)

v7.0.0 (March 13, 2025) **removed automatic history sync** on new installations. New manual methods:

```typescript
// Export archive from device A
await client.sendSyncArchive(pin);

// On device B
const archives = await client.listAvailableArchives(30); // last 30 days
await client.processSyncArchive(pin);

// Or request sync from other installations
await client.sendSyncRequest();
```

ZAO OS does **not** implement history sync — this is a gap but not breaking since it was opt-in.

### Mainnet Transition (Critical)

XMTP mainnet expected complete by March 2026 (now):

- **Phase 1:** 7 permissioned node operators, quantum-resistant storage, 60-day message retention
- **Network fees:** ~$0.001/message, paid in USDC on Base
- **Payer wallet required:** Developers must create a payer wallet, fund with USDC, route messages through XMTP Gateway Service
- **L3 appchain:** Settles to Base/Ethereum for metadata ordering
- **V2 deprecated:** V2 network deprecated June 23, 2025 — V2 messages read-only

---

## Impact on ZAO OS

### Green (Already Correct)

- Using `@xmtp/browser-sdk@^7.0.0` (correct unified package)
- Using Inbox ID-based APIs (`IdentifierKind`, `createDmWithIdentifier`, `createGroupWithIdentifiers`)
- OPFS tab-lock handling via `BroadcastChannel`
- `dbEncryptionKey` for local encryption
- `ConsentState.Allowed` filter on `syncAll()`
- Optimistic send pattern

### Gaps to Address

| Gap | Severity | Action |
|-----|----------|--------|
| No payer wallet for mainnet fees | **Critical** | Register on XMTP Funding Portal, fund with USDC on Base |
| No history sync | **High** | Add "Restore message history" button in Settings using `sendSyncRequest()` |
| Installation limit risk | **Medium** | ZAO generates new local key per FID (correct), but 10-device limit per inbox could affect power users |
| `as any` cast on `dbEncryptionKey` | **Low** | Check against v7 type definitions — option type may be renamed |
| No passkey support | **Future** | When XIP-55 ships, evaluate migration from localStorage burner key to passkey-based identity |

### Code Note

The `as any` cast on line 126 of `client.ts` (`} as any`) suggests the `dbEncryptionKey` option type may be missing or renamed in the current SDK typings. Verify against `@xmtp/browser-sdk@7.x` type definitions.

---

## Cross-References

- **Doc 13** — Chat & Messaging (covers V2-era XMTP, needs update to V3/browser-sdk patterns)
- **Doc 33** — Infrastructure (OPFS storage mentioned)
- **Doc 57** — Security Audit (XMTP key handling reviewed)
- **Doc 15** — MVP Spec (XMTP as Phase 2-3 feature — now shipped)

---

## Sources

- [XMTP Browser SDK — npm](https://www.npmjs.com/package/@xmtp/browser-sdk)
- [Get started with XMTP Browser SDK — docs.xmtp.org](https://docs.xmtp.org/chat-apps/sdks/browser)
- [xmtp/xmtp-js GitHub releases](https://github.com/xmtp/xmtp-js/releases)
- [Messaging security properties with XMTP — docs.xmtp.org](https://docs.xmtp.org/protocol/security)
- [Build group chat with MLS and XMTP — docs.xmtp.org](https://docs.xmtp.org/groups/build-group-chat)
- [Manage XMTP inboxes, identities, and installations — docs.xmtp.org](https://docs.xmtp.org/protocol/v3/identity)
- [Enable history sync — docs.xmtp.org](https://docs.xmtp.org/inboxes/history-sync)
- [Support archive-based backups — docs.xmtp.org](https://docs.xmtp.org/chat-apps/list-stream-sync/archive-backups)
- [Fund an app to send messages — docs.xmtp.org](https://docs.xmtp.org/fund-agents-apps/fund-your-app)
- [Decentralizing XMTP — xmtp.org](https://xmtp.org/decentralization)
- [XMTP Protocol Roadmap 2025 — XMTP Forum](https://improve.xmtp.org/t/xmtp-protocol-roadmap-2025-development-timeline/887)
- [XMTP July 2025 Community Update — blog.xmtp.org](https://blog.xmtp.org/xmtp-july-2025-community-update/)
- [XMTP Review 2026 — cryptoadventure.com](https://cryptoadventure.com/xmtp-review-2026-decentralized-messaging-mls-group-chats-and-the-mainnet-transition/)
- [Upgrade from legacy V2 to V3 — docs.xmtp.org](https://docs.xmtp.org/upgrade-from-legacy-V2)
- [XIP-46: Multi-wallet identity — GitHub](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-46-multi-wallet-identity.md)
