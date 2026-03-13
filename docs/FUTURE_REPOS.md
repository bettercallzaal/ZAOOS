# Future ZAO Repos

Standalone services that ZAO OS (the client) will consume via API calls. Each repo is self-contained with its own database, deployment, and endpoints.

---

## 1. ZID Service — `zid-api`

**What:** ZAO Identity layer — wraps Farcaster FIDs with music profiles, Respect scores, and community roles.

**Why separate:** ZIDs are reusable across future ZAO apps (not just the chat client). Other clients, bots, or integrations can query the same identity system.

**Core features:**
- Create/update ZID profiles (display name, bio, avatar, music role)
- Audio intros per ZID (short audio clips members record as their identity)
- Music taste profile (genres, top platforms, listening history)
- Respect balance + tier (read from Respect service)
- Linked wallets (multiple chains)
- Hats Protocol roles (curator, artist, OG, mod)

**Endpoints ZAO OS would call:**
```
GET    /api/zid/:fid          → Full ZID profile
POST   /api/zid/create        → Create ZID for a Farcaster FID
PATCH  /api/zid/:fid          → Update profile fields
GET    /api/zid/:fid/intro    → Get audio intro URL
POST   /api/zid/:fid/intro    → Upload audio intro
GET    /api/zid/search?q=     → Search ZIDs by name/username
GET    /api/zid/:fid/taste    → Music taste profile
```

**Stack:** Next.js API routes, Supabase, Neynar (FID lookup), file storage for audio intros

**Database tables:** `zids`, `zid_wallets`, `zid_intros`, `zid_taste_profiles`, `zid_hats`

**Domain:** `zid.zaoos.com`

---

## 2. Respect Service — `respect-api`

**What:** Soulbound reputation token system — tracks how members earn and hold Respect in the community.

**Why separate:** Respect is the community's social currency. It feeds into ZIDs, governance, and future on-chain attestations. Keeping it isolated makes the earning rules auditable and the ledger clean.

**Core features:**
- Respect ledger (earn/spend/transfer log)
- Earning mechanics: curation mining (share good music), peer recognition, consistency streaks
- Balance snapshots for on-chain attestation (EAS)
- Tier system (based on cumulative Respect)
- Leaderboard with time filters (weekly, monthly, all-time)

**Endpoints ZAO OS would call:**
```
GET    /api/respect/:fid            → Balance + tier
GET    /api/respect/leaderboard     → Top members by Respect
POST   /api/respect/award           → Award Respect (internal/admin)
GET    /api/respect/:fid/history    → Earning history
GET    /api/respect/snapshot        → Latest Merkle root for EAS
```

**Stack:** Next.js API routes, Supabase, viem (on-chain reads), EAS SDK (attestations)

**Database tables:** `respect_ledger`, `respect_balances`, `respect_snapshots`

**Domain:** `respect.zaoos.com`

---

## 3. AI Taste Engine — `taste-api`

**What:** Personalization layer — builds taste profiles from listening behavior and recommends music.

**Why separate:** ML/AI workloads have different scaling needs. Keeps the client fast and the intelligence layer independently deployable.

**Core features:**
- Build taste profiles from: songs shared, songs played, songs liked, submissions
- Genre/mood/era classification
- Personalized recommendations ("you might like")
- Community taste overlap ("members with similar taste")
- Weekly digest generation

**Endpoints ZAO OS would call:**
```
GET    /api/taste/:fid              → Taste profile summary
GET    /api/taste/:fid/recommend    → Recommended tracks
GET    /api/taste/similar/:fid      → Members with similar taste
POST   /api/taste/event             → Log a listen/share/like event
GET    /api/taste/digest/:fid       → Weekly music digest
```

**Stack:** Next.js or Python FastAPI, vector DB (Pinecone or pgvector), Claude API for classification

**Domain:** `taste.zaoos.com`

---

## 4. Quilibrium Bridge — `quil-bridge` (long-term)

**What:** Middleware to bridge ZAO data to Quilibrium's decentralized network for privacy-preserving storage.

**Why separate:** Quilibrium has no JS SDK — needs a Go middleware layer. Experimental and long-term.

**Core features:**
- Store ZID attestations on Quilibrium
- Privacy-preserving Respect proofs
- Decentralized backup of community data
- Oblivious transfer protocol integration

**Stack:** Go, Quilibrium SDK, gRPC

**Domain:** Internal service (not public-facing)

---

## 5. XMTP Messaging — `zao-dm`

**What:** Encrypted DM and private group chat layer using XMTP protocol, running alongside the public Farcaster channel feed.

**Why separate:** XMTP requires special CORS headers (`Cross-Origin-Embedder-Policy: require-corp`) that can break iframe embeds (Spotify, YouTube). Isolating the DM UI from the music-heavy chat keeps both working cleanly.

**Core features:**
- Encrypted 1:1 DMs between ZAO members
- Private group chats (mod channel, working groups, up to 250 members)
- Token-gated group creation (require allowlist membership)
- Consent-based spam prevention (XMTP network-level opt-in)
- Bot/agent messaging (ElizaOS agent can DM members)

**Endpoints / Integration:**
```
Client-side SDK — no API needed for basic messaging
@xmtp/browser-sdk handles encryption + routing

Optional server endpoints:
GET    /api/xmtp/contacts        → Members with XMTP-enabled wallets
POST   /api/xmtp/group/create    → Create private group from allowlist
GET    /api/xmtp/group/:id       → Group metadata
```

**Stack:** `@xmtp/browser-sdk` (WASM), Airstack API (check XMTP activation), wallet signer from existing auth

**Timeline:** Prototype after ElizaOS agent. Browser SDK should stabilize by mainnet (March 2026).

**Domain:** DM tab within `zaoos.com/dm` (with scoped CORS headers)

---

## Integration Pattern

ZAO OS (this repo) remains the **client**. It makes simple `fetch()` calls to these services:

```
ZAO OS Client (zaoos.com)
  ├── GET zid.zaoos.com/api/zid/:fid        → Profile data
  ├── GET respect.zaoos.com/api/respect/:fid → Respect balance
  ├── GET taste.zaoos.com/api/taste/:fid     → Recommendations
  └── (future) quil-bridge internal gRPC     → Decentralized storage
```

Each service authenticates requests via shared API keys or JWT tokens from the ZAO OS session.

---

## Build Order

1. **ZID Service** — foundation for everything else (profiles, intros, roles)
2. **Respect Service** — community incentive layer, feeds into ZIDs
3. **ElizaOS Agent** — onboarding, support, context help
4. **XMTP Messaging** — encrypted DMs + private groups
5. **AI Taste Engine** — personalization once we have enough listening data
6. **Quilibrium Bridge** — long-term decentralization play

---

*Last updated: 2026-03-13*
