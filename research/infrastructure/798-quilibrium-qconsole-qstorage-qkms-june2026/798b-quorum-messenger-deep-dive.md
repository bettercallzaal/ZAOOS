---
topic: infrastructure
type: research
status: research-complete
last-validated: 2026-06-06
related-docs: [798-quilibrium-qconsole-qstorage-qkms-june2026, 314-quilibrium-network-comprehensive-deep-dive, 074-xmtp-v4-mls-encryption]
original-query: "Learn more about Quorum (the messenger)"
tier: STANDARD
---

# 798b - Quorum Messenger: Technical Deep Dive

> Companion to doc 798. Focused on Quorum the app — architecture, the Triple-Ratchet protocol, the now-public repos, and the standing ZAO question: is it a real XMTP replacement?

## What Quorum Is

"The world's first fully private and decentralized group messenger. Powered by Quilibrium and the libp2p stack." Seven years of R&D. No phone number, no payment, no data collection, censorship-resistant.

- **Live beta (web):** `app.quorummessenger.com`
- **Mobile:** on Google Play (`com.quorummobile`), iOS via sideload
- **License:** AGPL-3.0
- **Repos (public, active):** `quorum-desktop` (1,617 commits), `quorum-mobile`, `quorum-shared`

## The Core Innovation: Triple-Ratchet

This is the reason Quorum exists and the single most important technical fact about it.

- **Double-Ratchet** (Signal's protocol): one encrypted message for a DM, but for a group it requires a **unique encrypted message per member**. Bandwidth/processing overhead caps practical group size at ~1,000 users.
- **Triple-Ratchet** (Quilibrium): extends Double-Ratchet with an **asynchronous DKG (distributed key generation) ratchet** that produces a **group key**, plugged in as the counterparty receiver key in the Double-Ratchet's Diffie-Hellman step. Result: **one message for the entire group, regardless of size.**

**Why it matters:** group conversations scale to arbitrary size, and it works in **bandwidth-restricted / off-grid** environments. Reference implementation: `CassOnMars/TripleRatchet` (and the `channel` Rust repo in the Quilibrium org).

## How It Works (from `quorum-shared` internals)

The shared package is the most revealing artifact — it's what both desktop and mobile clients build on:

| Layer | Implementation |
|-------|----------------|
| **Encryption** | E2E, **Wasm-based** crypto core |
| **Signing** | **Ed448** message signing with key derivation + verification |
| **Sync** | **Hash-based delta synchronization protocol** for efficient P2P sync (messages, bookmarks, settings across devices) |
| **Presence** | Typing indicators (5s throttle, 8s TTL); delivery receipts (10s buffer) + read receipts (5s debounce) |
| **Transport clients** | HTTP + WebSocket abstractions (browser + React Native) |
| **Storage** | Platform-agnostic adapter — IndexedDB (web), AsyncStorage (native) |
| **API** | **REST API client for spaces, channels, messages, user settings** |
| **Data models** | `Message`, `Space`, `Channel`, `UserConfig`, `SpaceMember`, `Bookmark`, thread + notification types |

Key structural takeaway: Quorum is organized around **Spaces → Channels → Messages** (Discord-like), and there is a **REST surface** (not only raw libp2p) — which is the realistic integration seam for any third party.

## Network Transport

Runs over **TCP, QUIC, WebSockets, or LoRa** — traditional internet, local networks, or off-grid radio. Anonymity/propagation handled by Quilibrium primitives:
- **SLRP** (Shuffled Lattice Routing Protocol) — anonymous message routing (mixnet)
- **RPM** (Routing Protocol for Mixnets) — additional routing anonymity
- **BlossomSub** — gossip propagation across nodes

## Accounts & Onboarding

Passkey generation + display name + optional photo (shared only with contacts). Seconds to onboard. No phone, no email required, no seed phrase. Onboarding data is confidential between you and your contacts only.

## Economics: Apex + QNS

| Feature | Detail |
|---------|--------|
| **Quorum Apex** | Monthly subscription paid in crypto (QUIL first; wQUIL + others to follow) |
| **Sponsor feature** | Community creators get sponsored by Apex subscribers and earn monthly; each subscriber gets up to 4 sponsorships/month |
| **QNS** | Premium username marketplace — `.q` names, short URLs, buy/sell, priced in QUIL/wQUIL/USDC. Live for mobile users |

This is the monetization model: subscriptions fund creators directly (sponsor mechanic), and names are a token-denominated marketplace.

## Tech Stack

React + TypeScript (~92%), Electron (desktop), React Native + Expo (mobile), Vite + Vitest, Tailwind/SCSS, Lingui (i18n). Dual-platform builds: `dist/index.mjs` (web) + `dist/index.native.js` (native), with `.web.tsx` / `.native.tsx` component conventions.

## Quorum vs XMTP — The ZAO Question

ZAO currently uses XMTP (MLS) in `src/contexts/XMTPContext.tsx`.

| Dimension | Quorum (Triple-Ratchet) | XMTP (MLS) |
|-----------|-------------------------|------------|
| Group encryption | One message for whole group via DKG group key | MLS tree-based group keys (also efficient) |
| Group scale ceiling | Effectively unbounded (claimed) | Large but MLS has its own scaling profile |
| Off-grid transport | Yes — LoRa / local networks | No |
| Auth | Passkeys | Wallet signatures (fits ZAO's wallet-native model) |
| Web SDK maturity | **None yet** — REST client exists inside `quorum-shared` but no published standalone SDK | **Mature** published JS/React SDK |
| Decentralization | Fully P2P over Quilibrium | XMTP network nodes |
| Maturity | Beta | Production (already integrated in ZAO) |
| License | AGPL-3.0 (copyleft — matters if embedding) | Permissive |

### Verdict (unchanged, now better-evidenced): STUDY, do not migrate
- **For:** triple-ratchet group scaling + off-grid transport are genuinely differentiated; the Spaces/Channels model maps cleanly onto ZAO community structure.
- **Against:** no published web SDK (you'd have to lift the REST client out of `quorum-shared` or reimplement against an undocumented wire protocol), AGPL-3.0 is a copyleft hazard for embedding, passkey auth doesn't match ZAO's wallet-native identity, and it's still beta.
- **Trigger to revisit:** Quilibrium publishes a standalone, documented Quorum/messaging JS SDK (watch the `quilibrium-js-sdk-channels` repo — still 1 star / immature as of Apr 2026), OR ZAO has a concrete need for off-grid / censorship-resistant comms that XMTP can't serve.

## Open Questions (need a browser — docs site Cloudflare-blocks fetch)

1. Is the `quorum-shared` REST API public/documented, or internal-only to the first-party clients?
2. What is the exact Triple-Ratchet wire format (the `channel` Rust repo + `CassOnMars/TripleRatchet` are the sources to read)?
3. Apex pricing (monthly QUIL amount) and QNS name price floors.

## Sources

- [Quorum Messenger](https://www.quorummessenger.com/)
- [Quorum web app (beta)](https://app.quorummessenger.com/)
- [quorum-desktop (GitHub)](https://github.com/QuilibriumNetwork/quorum-desktop)
- [quorum-shared (GitHub)](https://github.com/QuilibriumNetwork/quorum-shared)
- [quorum-mobile (Google Play)](https://play.google.com/store/apps/details?id=com.quorummobile)
- [CassOnMars/TripleRatchet (reference impl)](https://github.com/CassOnMars/TripleRatchet)
- [Quilibrium whitepaper (P2P MPC PaaS)](https://quilibrium.com/quilibrium.pdf)
- [Quorum launch thread (X)](https://x.com/QuilibriumInc/status/1871466347617456260)
- Internal: doc 798 (June update), doc 314 (deep dive), doc 074 (XMTP v4 MLS)
</content>
</invoke>
