# ZAO OS Build Log

> Building in public. Every major step documented.

---

## Entry 001 — Research Phase Complete

**What happened:**
- Researched Farcaster protocol, Hub APIs, SDKs, and authentication (SIWF)
- Researched music integration (Audius, Sound.xyz, Spotify, Frames v2)
- Researched social capital systems (DEGEN, Moxie, Optimism Respect)
- Researched Hats Protocol for community role hierarchies
- Researched Quilibrium Network for future decentralized infrastructure
- Researched AI memory patterns for personalization
- Curated 60+ public APIs relevant to music social apps
- Researched gating mechanisms (NFT, allowlist, Hats, EAS attestations)
- Researched chat/messaging (Farcaster channels, XMTP)
- Organized everything into 14 research folders

**Key decisions:**
- MVP = gated chat client (not full music feed)
- Gate = FID/wallet allowlist (no invite codes initially)
- Chat = Farcaster `/zao` channel rendered as Discord-style chat UI
- Single Next.js app, not monorepo
- Neynar API as primary Farcaster data layer
- Supabase for PostgreSQL
- Deploy via Vercel + GitHub (github.com/bettercallzaal/ZAOOS)
- Domain: zaoos.com
- UI reference: CG/Commonwealth app (Discord-style layout)

**Research output:** 14 folders in `research/` covering protocol, APIs, identity, tokens, gating, chat, project structure, and more.

---

## Entry 002 — MVP Spec Locked

**MVP scope (confirmed):**
1. Sign In With Farcaster (SIWF) at zaoos.com
2. Allowlist gate — check FID/wallet against pre-loaded list
3. Single chat room — renders `/zao` Farcaster channel as chat
4. Post messages — casts to `/zao` channel via Neynar
5. Reply threads
6. Real-time updates
7. Discord-style UI (dark theme, navy/gold brand colors)

**What the MVP is NOT:**
- No music player (Layer 2)
- No ZIDs (Layer 3)
- No Respect tokens (Layer 4)
- No invite codes (just direct allowlist)
- No private DMs (Layer 9)

**Brand:**
- Colors: Navy (#1a1a4e / dark navy) + Gold (#f5a623 / warm gold)
- Logo: "THE ZAO" with urban/music drip aesthetic
- Tagline: "Empowering Web3 Musicians"

---

## Entry 003 — Final Pre-Build Decisions

**Infrastructure confirmed:**
- Supabase project created (PostgreSQL)
- Neynar API key available
- Vercel connected to github.com/bettercallzaal/ZAOOS
- App FID: 19640

**Allowlist:**
- 40 ZAO members in CSV (name + wallet address)
- No FIDs in CSV — will resolve via Neynar API

**Security decision: App signer wallet**
- Will NOT use personal wallet private keys (security risk)
- Auto-generate a dedicated app signing wallet at project init
- Private key in .env.local (gitignored) + encrypted backup
- Wallet only signs EIP-712 requests for Neynar managed signers

**Onboarding flow finalized:**
- Existing Farcaster users: SIWF → allowlist check → signer approval → chat
- Wallet-only users: connect wallet → allowlist check → Neynar FID registration → chat

**Admin panel in MVP:** allowlist CRUD, CSV upload, hide messages

---
