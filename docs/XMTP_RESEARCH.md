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

## SDK Availability

| SDK | Package | Status |
|-----|---------|--------|
| Browser | `@xmtp/browser-sdk` | Alpha |
| React | `@xmtp/react-sdk` | Available |
| Node.js | `@xmtp/node-sdk` | Available |
| React Native | `@xmtp/react-native-sdk` | Available |

**Next.js requirements:**
- Headers: `Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Opener-Policy: same-origin`
- Config: `serverExternalPackages: ['@xmtp/user-preferences-bindings-wasm']`

## Farcaster Integration

- XMTP supports Farcaster IDs as a social identity type
- Connection via wallet addresses (Farcaster users have custody/verification addresses)
- Airstack API can check which Farcaster users have XMTP-enabled wallets
- Complementary, not competing — Farcaster = public feed, XMTP = private messaging

## Use Cases for ZAO OS

| Feature | Current (Farcaster) | With XMTP |
|---------|-------------------|-----------|
| Public channel chat | Neynar casts to #zao, #zabal, #cocconcertz | Keep as-is |
| Direct messages | Not supported | Encrypted 1:1 DMs |
| Private group chat | Not possible | Encrypted groups (up to 250) |
| Mod channel | Not available | Private encrypted mod group |
| Bot/agent messaging | N/A | XMTP agent SDK |
| Payment requests | N/A | In-chat payment flows |

## Cost Model

- **Currently free** — XMTP Labs absorbs all costs
- **Future**: ~$5 per 100,000 messages (pennies for 40-member community)
- **No API key costs** — peer-to-peer via SDK, unlike Neynar per-request billing
- **No server infrastructure** needed for basic messaging

## Limitations

- Browser SDK still in **alpha** (breaking changes possible)
- Message size limit: **~1MB** (remote attachments for larger files)
- Group size limit: **250 members**
- 10 installations per inbox
- WASM/CORS headers can conflict with iframe embeds (Spotify, YouTube)
- Wallet activation required (not every Farcaster user has XMTP enabled)
- No public feed equivalent — messaging only, not social feed
- Mainnet not fully live yet (expected March 2026)

## Reference Projects

- **Papa Base** — token-gated group chat (closest analog to ZAO OS)
- **Converse** — primary decentralized XMTP messaging app
- **Coinbase Wallet** — integrated XMTP DMs
- **Hey (Lenster)** — Lens Protocol social app with XMTP DMs
- `gregfromstl/farcaster-support-agent` — AI agent via XMTP + Farcaster
- `dabit3/xmtp-chat-app-nextjs` — Next.js reference implementation
- `ephemeraHQ/xmtp-mini-app-examples` — mini-app debugging toolkit

## Architecture Recommendation

**Hybrid approach — keep Farcaster for public feed, add XMTP for private messaging.**

### Keep (Farcaster via Neynar)
- Public channel feed / community timeline
- Cast-based discussions visible to all members
- Social graph and discovery

### Add (XMTP)
- Encrypted DMs between members
- Private group chats (subgroups, working groups, mod channels)
- Sensitive conversations that shouldn't be public
- Bot/agent messaging for ElizaOS integration

### Integration Path
1. Add `@xmtp/browser-sdk` to Next.js app
2. Configure CORS headers for WASM (careful with iframe embeds)
3. Use existing wallet connection to create XMTP client
4. Create ZAO OS private group with all allowlisted members
5. Add DM tab alongside existing channel feed
6. Use Airstack API to check XMTP activation status per member

### Timeline
- **Now**: Prototype with alpha SDK (small user base = low migration risk)
- **March 2026**: Mainnet launch, SDK stabilization
- **Post-mainnet**: Production rollout of DMs + private groups

## CORS Header Consideration

The required XMTP headers (`Cross-Origin-Embedder-Policy: require-corp`) can break iframe embeds (Spotify, YouTube, SoundCloud players). Solutions:
1. Only apply headers on `/dm` or `/messages` routes, not globally
2. Use `credentialless` instead of `require-corp` where supported
3. Keep music player pages separate from XMTP-enabled pages
