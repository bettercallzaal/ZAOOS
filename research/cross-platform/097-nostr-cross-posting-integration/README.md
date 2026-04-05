# 97 — Nostr Cross-Posting Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Add Nostr as a cross-posting target — post ZAO content to the Nostr network, enable music status broadcasting, and connect with the Wavlake music ecosystem
> **Builds on:** Doc 28 (Cross-Platform Publishing), Doc 77 (Bluesky Integration), Doc 96 (Cross-Post API Deep Dive)

---

## Executive Summary

Nostr is a natural fit for ZAO OS. It is the only decentralized social protocol with a thriving music economy (Wavlake), micropayments (Lightning), and open relay infrastructure — all at zero cost. The existing Bluesky cross-posting pattern in ZAO OS (`src/lib/bluesky/`, `/api/bluesky/route.ts`, Settings UI) provides a proven template. Nostr integration follows the same shape: a `src/lib/nostr/` module, an `/api/nostr/` route, and a "Connect Nostr" section in Settings.

**Effort estimate:** 3-5 days total across 3 phases.

---

## 1. SDK: nostr-tools

| Detail | Value |
|--------|-------|
| **Package** | `nostr-tools` v2.23.3 (npm, published Feb 2026) |
| **Alternative (higher-level)** | `@nostr-dev-kit/ndk` v2.14.33 |
| **JSR registry** | `@nostr/tools` (for Deno/JSR imports) |
| **Cost** | **$0** — protocol is permissionless, no API keys |
| **Rate limits** | None at protocol level; individual relays may throttle |
| **TypeScript** | Requires TS >= 5.0 |
| **Peer deps** | None (self-contained, uses `@noble/hashes` internally) |
| **Weekly npm downloads** | ~30K+ |
| **Bundle size** | Tree-shakeable — only import what you use via submodule paths |

**Recommendation:** Use `nostr-tools` (low-level) rather than NDK. It is lighter, has no extra dependencies, and ZAO OS only needs key generation + event signing + relay publishing — not subscriptions or caching. This matches the project's pattern of using direct SDKs (`@atproto/api` for Bluesky, `@supabase/supabase-js` for DB) rather than heavyweight abstractions.

### Key Submodule Imports

```typescript
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'
import { Relay } from 'nostr-tools/relay'
import { nip19 } from 'nostr-tools'  // bech32 encoding (nsec/npub)
```

---

## 2. Code Pattern for Posting

### Creating and Signing a Kind 1 Text Note

```typescript
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

// Key generation (one-time, store securely)
const sk = generateSecretKey()  // Uint8Array (32 bytes)
const pk = getPublicKey(sk)     // hex string

// Create and sign event
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['t', 'music'],
    ['t', 'zao'],
    ['r', 'https://wavlake.com/track/abc123'],
  ],
  content: 'New track drop from ZAO! Check it out on Wavlake\n\nhttps://wavlake.com/track/abc123',
}, sk)

// Publish to multiple relays
const pool = new SimplePool()
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
]
await Promise.any(pool.publish(relays, event))
pool.close()
```

### Publishing a NIP-38 Music Status (Kind 30315)

```typescript
const musicStatus = finalizeEvent({
  kind: 30315,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['d', 'music'],
    ['r', 'https://wavlake.com/track/abc123'],
    ['expiration', String(Math.floor(Date.now() / 1000) + 240)], // 4 min track
  ],
  content: 'Ambition by Stilo World',
}, sk)
```

### Proposed ZAO OS Module: `src/lib/nostr/client.ts`

```typescript
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'
import { nip19 } from 'nostr-tools'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
  'wss://purplepag.es',
]

// Community account — loaded from env
function getCommunityKey(): Uint8Array {
  const hex = process.env.NOSTR_PRIVATE_KEY
  if (!hex) throw new Error('NOSTR_PRIVATE_KEY not configured')
  return hexToBytes(hex)
}

export async function postToNostr(content: string, tags: string[][] = []): Promise<string> {
  const sk = getCommunityKey()
  const event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', 'zao'], ['t', 'music'], ...tags],
    content,
  }, sk)

  const pool = new SimplePool()
  try {
    await Promise.any(pool.publish(DEFAULT_RELAYS, event))
    return event.id
  } finally {
    pool.close(DEFAULT_RELAYS)
  }
}

export function generateNostrKeypair() {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)
  return {
    privateKeyHex: bytesToHex(sk),
    publicKeyHex: pk,
    nsec: nip19.nsecEncode(sk),
    npub: nip19.npubEncode(pk),
  }
}
```

---

## 3. Key Management

### Security Model

Nostr identity = a secp256k1 keypair. The private key (nsec) is the **sole** credential — there is no recovery, no password reset. This demands careful handling.

| Approach | Description | Recommended For |
|----------|-------------|-----------------|
| **Community keypair (env var)** | Generate once with a script, store as `NOSTR_PRIVATE_KEY` in `.env`. Server-side only. | Phase 1 — community account cross-posting |
| **User imports nsec** | User pastes their existing nsec into Settings. Encrypted + stored in Supabase (like `bluesky_app_password`). | Phase 2 — existing Nostr users |
| **App generates keypair** | ZAO OS generates a fresh keypair for the user, displays nsec once for backup, stores encrypted. | Phase 2 — users new to Nostr |
| **NIP-07 browser extension** | Delegate signing to Alby or nos2x extension. App never sees the private key. | Phase 3 — power users |
| **NIP-46 Nostr Connect** | Remote signing via relay. App sends signing requests to a separate signer app. | Phase 3 — best security |

### Phase 1: Community Account Key (matches Bluesky pattern)

Generate with a script (like `scripts/generate-wallet.ts`):

```typescript
// scripts/generate-nostr-keypair.ts
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { nip19 } from 'nostr-tools'
import { bytesToHex } from '@noble/hashes/utils'

const sk = generateSecretKey()
const pk = getPublicKey(sk)

console.log('=== ZAO Nostr Community Account ===')
console.log(`NOSTR_PRIVATE_KEY=${bytesToHex(sk)}`)
console.log(`NOSTR_PUBLIC_KEY=${pk}`)
console.log(`nsec: ${nip19.nsecEncode(sk)}`)
console.log(`npub: ${nip19.npubEncode(pk)}`)
console.log('\nAdd NOSTR_PRIVATE_KEY to .env (server-only, never expose to browser)')
```

**New env vars:**
```
NOSTR_PRIVATE_KEY=<64-char hex>   # server-only, never in NEXT_PUBLIC_
NOSTR_PUBLIC_KEY=<64-char hex>    # can be public
```

### Phase 2: Per-User Keys

Store in Supabase `users` table (new columns):
- `nostr_npub` — public key (bech32), safe to display
- `nostr_nsec_encrypted` — private key, encrypted at rest with `SESSION_SECRET` before storing
- `nostr_relay_list` — optional JSON array of user's preferred relays

**Security rules (non-negotiable, per SECURITY.md):**
- Never log nsec values
- Never return nsec in API responses
- Encrypt before database storage
- Display nsec exactly once on generation, then never again
- All Nostr signing happens server-side in API routes

---

## 4. Relay List

### Recommended Default Relays (5 relays for redundancy)

| Relay | Why |
|-------|-----|
| `wss://relay.damus.io` | Largest general-purpose relay, high uptime, run by Damus team |
| `wss://nos.lol` | Fast, reliable, popular with music community |
| `wss://relay.nostr.band` | Search-indexed relay — posts here are discoverable via nostr.band |
| `wss://relay.primal.net` | Primal app's relay — large user base, good for reach |
| `wss://purplepag.es` | Profile/contact-list relay — ensures the ZAO npub is discoverable |

### Music-Specific Relays (Phase 2)

| Relay | Why |
|-------|-----|
| `wss://relay.wavlake.com` | Wavlake's relay — if they run one (to be confirmed) |
| `wss://relay.fountain.fm` | Podcasting 2.0 / music adjacent |
| `wss://nostr.wine` | Paid relay ($7/mo) — spam-free, high signal |

### Relay Strategy

- **Publish to 5 relays** — `Promise.any()` ensures success if at least one accepts
- **Read from 3 relays** — for fetching replies/reactions to ZAO posts
- **Store relay list in `community.config.ts`** alongside other community settings
- **Let users override** with their own relay list in Phase 2

### Addition to community.config.ts

```typescript
nostr: {
  defaultRelays: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://relay.primal.net',
    'wss://purplepag.es',
  ],
  communityNpub: 'npub1...', // set after key generation
  hashtags: ['zao', 'music', 'zabal'],
},
```

---

## 5. Music-Specific NIPs

### NIP-38: User Statuses (Kind 30315)

The most relevant NIP for ZAO's music features.

- **Event kind:** 30315 (addressable, optionally expiring)
- **`d` tag:** `"music"` for listening status, `"general"` for activity
- **Content:** Track name / description
- **`r` tag:** URL to the track (Wavlake link, Audius link, etc.)
- **`expiration` tag:** Unix timestamp when track ends (auto-clears status)
- **Use case for ZAO:** When a member listens to ZAO Radio, broadcast a NIP-38 music status to Nostr. Other Nostr users see "Listening to Ambition by Stilo World" on the ZAO member's profile across all Nostr clients (Damus, Primal, Amethyst, etc.).

### NIP-94: File Metadata

Used for attaching audio file metadata to events. Relevant for publishing track info.

### NIP-33: Parameterized Replaceable Events

The container format used by Wavlake's NOM spec for music metadata. Each track = one replaceable event with full metadata (title, artist, duration, MIME type, stream URL).

### NIP-23: Long-Form Content (Kind 30023)

For album descriptions, artist bios, music reviews. Markdown-formatted.

### NIP-32: Labeling

For categorizing content — genre tags, podcast episode links, curation.

### Proposed: M3U Playlists NIP

Community radio playlists, shared mixtapes, curated queues — still in proposal stage (GitHub issue #1945 on nostr-protocol/nips).

---

## 6. Wavlake Integration

### What Wavlake Is

Wavlake is a Bitcoin Lightning-powered music streaming platform deeply integrated with Nostr:
- Artists upload tracks, listeners pay micropayments ("boosts") in sats
- 10% platform fee (vs ~70% on Spotify)
- Artists report $13,000/year on Wavlake vs $750 in 5 years on traditional streaming
- Every track is published as a Nostr event
- Nostr Wallet Connect (NWC) for seamless wallet linking

### Wavlake API Status

Wavlake does **not** have a documented public REST API for track/artist lookup. Their architecture is:
- **Nostr-native:** Content is published as Nostr events, discoverable via relays
- **RSS/Podcasting 2.0:** Tracks available via RSS feeds (e.g., `https://player.wavlake.com/feed/<uuid>`)
- **Blossom:** Decentralized blob storage for media files
- **NOM Spec:** Nostr Open Media specification for music event metadata

### Nostr Open Media (NOM) Specification

Wavlake's open standard for music on Nostr (draft v0.1):

```json
{
  "title": "Track Name",
  "guid": "app-specific-unique-id",
  "creator": "Artist Name",
  "type": "audio/mpeg",
  "duration": 240,
  "published_at": "1679616000",
  "link": "https://wavlake.com/track/abc123",
  "enclosure": "https://cdn.wavlake.com/audio/abc123.mp3",
  "version": "0.1"
}
```

Published inside NIP-33 Parameterized Replaceable Events.

### How to Link ZAO Tracks to Wavlake

1. **Include Wavlake URLs in cross-posted notes** — When a ZAO member shares a track, include the Wavlake URL. Nostr clients (Damus, Primal) auto-embed Wavlake player widgets.
2. **Read NOM events from relays** — Query relays for NOM events by ZAO artists' npubs to build a "ZAO on Wavlake" section.
3. **NIP-38 music status with Wavlake links** — When playing ZAO Radio, the `r` tag points to the Wavlake track URL.
4. **Encourage ZAO artists to publish on Wavlake** — Direct monetization via Lightning, content auto-appears on Nostr.

### Wavlake Integration Effort

| Approach | Effort | Value |
|----------|--------|-------|
| Include Wavlake URLs in cross-posts | Trivial (text in content field) | Medium — clickable links in all Nostr clients |
| Read NOM events for ZAO artist catalog | 1-2 days | High — "ZAO on Wavlake" discovery page |
| NIP-38 music status with Wavlake links | 1 day | Medium — live listening status across Nostr |
| Deep NWC payment integration | 3-5 days | High — in-app Lightning payments (Phase 4) |

---

## 7. "Connect Nostr" in Settings

The existing Bluesky connect flow in `src/app/(auth)/settings/SettingsClient.tsx` is the exact template. The Nostr version follows the same pattern.

### UI Design (in Settings "Connections" section)

```
[Nostr]
  Status: Connected (npub1abc...xyz)  [Disconnect]
  — or —
  Status: Not connected              [Connect]

[Connect Nostr form, when expanded]
  ( ) Import existing key (paste nsec)
  ( ) Generate new keypair

  [nsec input field, if importing]
  [Connect Nostr button]

  [Generated keypair display, if generating]
  Your npub: npub1abc...xyz
  Your nsec: nsec1abc...xyz  (save this! shown only once)
  [I've saved my key — Continue]
```

### API Route: `src/app/api/nostr/route.ts`

```
GET  /api/nostr       → { connected: boolean, npub: string | null }
POST /api/nostr       → { npub: string, nsec?: string }  (connect/generate)
DELETE /api/nostr      → disconnect (clear npub from DB)
```

Mirrors the existing `/api/bluesky` route exactly.

### New DB Columns on `users` table

```sql
ALTER TABLE users ADD COLUMN nostr_npub TEXT;
ALTER TABLE users ADD COLUMN nostr_nsec_encrypted TEXT;
```

---

## 8. Step-by-Step Implementation Plan

### Phase 1: Community Account Cross-Post (1-2 days)

Post to a ZAO community Nostr account alongside Farcaster.

| Step | Task | Files |
|------|------|-------|
| 1 | `npm install nostr-tools` | `package.json` |
| 2 | Create `scripts/generate-nostr-keypair.ts` | `scripts/` |
| 3 | Run script, add `NOSTR_PRIVATE_KEY` + `NOSTR_PUBLIC_KEY` to `.env` | `.env`, `.env.example` |
| 4 | Create `src/lib/nostr/client.ts` — `postToNostr()`, key loading | `src/lib/nostr/` |
| 5 | Add `nostr` config to `community.config.ts` (relays, npub, hashtags) | `community.config.ts` |
| 6 | Add `crossPostNostr: z.boolean().optional()` to cast schema | `src/lib/validation/schemas.ts` |
| 7 | Call `postToNostr()` from `/api/chat/send/route.ts` when `crossPostNostr` is true | `src/app/api/chat/send/route.ts` |
| 8 | Add Nostr toggle to ComposeBar (next to existing Bluesky toggle) | `src/components/chat/ComposeBar.tsx` |

### Phase 2: Per-User Nostr Identity (2-3 days)

Let members connect their own Nostr identity.

| Step | Task | Files |
|------|------|-------|
| 9 | Add `nostr_npub`, `nostr_nsec_encrypted` columns to `users` table | `scripts/setup-db.sql` |
| 10 | Create `/api/nostr/route.ts` — GET, POST (import/generate), DELETE | `src/app/api/nostr/route.ts` |
| 11 | Add nsec encryption helper using `SESSION_SECRET` | `src/lib/nostr/crypto.ts` |
| 12 | Add "Connect Nostr" UI to SettingsClient (import nsec or generate) | `src/app/(auth)/settings/SettingsClient.tsx` |
| 13 | When user has own npub, cross-post from their identity instead of community | `src/lib/nostr/client.ts` |
| 14 | Add NIP-38 music status — broadcast when playing ZAO Radio | `src/lib/nostr/status.ts` |

### Phase 3: Wavlake + Deep Integration (3-5 days, future)

| Step | Task |
|------|------|
| 15 | Query relays for NOM events by ZAO artist npubs — build "ZAO on Wavlake" page |
| 16 | Auto-include Wavlake links when cross-posting music-related casts |
| 17 | NIP-07 browser extension support (Alby, nos2x) — best security |
| 18 | NIP-46 Nostr Connect — remote signing for mobile |
| 19 | Explore NWC (Nostr Wallet Connect) for in-app Lightning micropayments |

---

## 9. Effort Summary

| Phase | Scope | Effort | Dependency |
|-------|-------|--------|------------|
| **Phase 1** | Community cross-post | **1-2 days** | None — can start immediately |
| **Phase 2** | Per-user identity + music status | **2-3 days** | Phase 1, DB migration |
| **Phase 3** | Wavlake catalog + NWC payments | **3-5 days** | Phase 2, artist onboarding to Wavlake |

**Total: 6-10 days** for full Nostr integration across all phases.

---

## 10. Existing Patterns to Follow

ZAO OS already has a complete Bluesky cross-posting implementation that serves as the template:

| Component | Bluesky (existing) | Nostr (to build) |
|-----------|-------------------|-------------------|
| SDK | `@atproto/api` | `nostr-tools` |
| Client module | `src/lib/bluesky/client.ts` | `src/lib/nostr/client.ts` |
| API route | `src/app/api/bluesky/route.ts` | `src/app/api/nostr/route.ts` |
| Settings UI | Bluesky section in SettingsClient | Nostr section in SettingsClient |
| DB columns | `bluesky_did`, `bluesky_handle`, `bluesky_app_password` | `nostr_npub`, `nostr_nsec_encrypted` |
| Schema field | `crossPostBluesky` | `crossPostNostr` |
| Env vars | `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD` | `NOSTR_PRIVATE_KEY`, `NOSTR_PUBLIC_KEY` |
| Config | (not in community.config.ts) | `nostr: { defaultRelays, communityNpub, hashtags }` |

---

## 11. Why Nostr for ZAO (Strategic Value)

1. **Music economy:** Wavlake is the only decentralized music platform with real artist revenue (Lightning micropayments). Aligns perfectly with ZAO's artist-first mission.
2. **Zero cost:** No API keys, no paid tiers, no rate limit concerns for a 100-member community.
3. **Censorship resistance:** Content lives on multiple independent relays. No single point of failure.
4. **Interoperability:** Posts from ZAO appear in Damus, Primal, Amethyst, Nostrudel, Coracle — instant distribution to ~16M keypairs.
5. **NIP-38 music status:** Unique feature — ZAO members' listening activity visible across the entire Nostr ecosystem.
6. **Value 4 Value:** Direct micropayments from listeners to artists, no intermediary taking 70%.
7. **Community fit:** Nostr's ethos (decentralized, open, permissionless) aligns with ZAO's governance model.

---

## Sources

- [nostr-tools GitHub](https://github.com/nbd-wtf/nostr-tools) — SDK documentation and code examples
- [NIP-38 User Statuses](https://nips.nostr.com/38) — Music status specification
- [NIP-38 on GitHub](https://github.com/nostr-protocol/nips/blob/master/38.md) — Full spec text
- [Wavlake NOM Spec](https://github.com/wavlake/nom-spec) — Nostr Open Media specification for music events
- [Wavlake Documentation](https://docs.wavlake.com/) — Platform documentation
- [Wavlake Web (open source)](https://github.com/wavlake/web) — Reference implementation using Nostr + Blossom + Cashu
- [Nostr Relay Directory](https://nostr.co.uk/relays/) — Relay discovery and uptime monitoring
- [Nostr Key Management Guide](https://nostr.co.uk/learn/key-management/) — Security best practices
- [HelloNostr Guide](https://hellonostr.dev/en/step-by-step-guide/) — Step-by-step posting guide
- [nostr-tools on npm](https://www.npmjs.com/package/nostr-tools) — Package registry (v2.23.3)
- [M3U Playlists NIP Proposal](https://github.com/nostr-protocol/nips/issues/1945) — Proposed playlist standard
