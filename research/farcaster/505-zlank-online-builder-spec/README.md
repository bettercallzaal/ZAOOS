---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-20
related-docs: 260, 295, 498, 500, 527
original-query: What is zlank.online, how should it be architected, and what's the phased rollout plan? (reconstructed)
tier: DISPATCH
---

# 505 - Zlank.online Builder Spec (Snap No-Code Platform)

> **Goal:** Lock the architecture, tech stack, hard limits, auth strategy, spam mitigation, and phased rollout for zlank.online - the no-code Farcaster Snap builder + hosted runtime with 7-day free Snap expiry.

## Summary

**Zlank.online** = no-code Snap builder + hosted runtime for any Farcaster user to create interactive apps directly in casts.

**Key Specs:**
- Single Next.js 16 + Hono app on Vercel
- Block-based drag-drop builder (Linktree-style, not code-first)
- Hosted Snaps live at `/s/[uuid]` with 7-day free expiry
- Also shipped as Farcaster Mini App (same codebase, dual context)
- Open access (no whitelist); Sign In With Farcaster (SIWF) + Quick Auth dual fork
- 6-layer spam defense + optional hCaptcha
- Stack: Next.js 16 + Hono + @farcaster/snap v2.0.3 + @dnd-kit + cmdk + zustand + Supabase + shadcn/ui on Tailwind v4
- Cost: Free tier sustainable 6-12 months; ~$170/mo at 1500 active Snaps + 75k daily renders
- Repo: `bettercallzaal/zlank` (public, MIT) -> transfer to `zlank-labs` org once created

## Key Decisions

| # | Decision | Why | Status |
|---|---|---|---|
| 1 | Architecture = Path A (single Next.js + Hono, `/s/[id]` dynamic routing) | Zero per-Snap infra cost. Scales to thousands on one Vercel deployment. Free 7-day expires via timestamp check. | LOCKED |
| 2 | Builder UX = block-based picker (Linktree-style, 14 blocks, NOT code-first) | Lower barrier for non-technical creators. Drag-reorder familiar UX. Can link to Mini App for code-forward users v2. | LOCKED |
| 3 | Drag-drop lib = @dnd-kit v6.4 + sortable | React 19 ready. Touch-first (mobile critical). No vendor lock. Actively maintained. | LOCKED |
| 4 | Block picker = cmdk v1.1+ (shadcn Command) | Slash menu on desktop, floating button on mobile. Keyboard a11y. Familiar from popular apps. | LOCKED |
| 5 | State + undo = zustand v5 + zundo | Minimal boilerplate. Transparent undo/redo via middleware. No Redux bloat. | LOCKED |
| 6 | UI framework = shadcn/ui on Tailwind v4 | Matches ZAO OS stack. Consistent design language. Atomic component system. | LOCKED |
| 7 | URL metadata extraction = ogie (server-side) | Preview URLs (for Link block + Music block) without client-side parsing. | LOCKED |
| 8 | Database = Supabase (dedicated zlank project, NOT shared with ZAOOS) | RLS enabled. Separate from ZAO OS to allow independent scaling + backups. Same provider = simpler ops. | LOCKED |
| 9 | Snap SDK pinning = @farcaster/snap v2.0.3 (NOT v1.15.1) | Apr 8 2026 release includes structural validation. v1.15.1 is older. Use latest stable. | UPDATED FROM ORIGINAL |
| 10 | Snap Hono = @farcaster/snap-hono v1.4.8 | Stable JFS verification. Matches farcasterxyz/snap reference impls. | LOCKED |
| 11 | Mini App SDK = @farcaster/miniapp-sdk v0.3.0 | Quick Auth + dual context detection. Account association via EIP-712. | LOCKED |
| 12 | Auth = dual fork (SIWF browser + Quick Auth Mini App). Open to any FID. | SIWF = browser sign-in (portable). Quick Auth = Mini App context. Whitelist removed 2026-04-24. | LOCKED |
| 13 | Token block = OPTIONAL v1 (paste URL or 0x contract, DexScreener price live) | v1 ships without token LAUNCH UI. Users can embed existing Clanker links. Token LAUNCH (Clanker creation) moves to v2. | LOCKED |
| 14 | Distribution = both standalone web + Mini App (same Next.js app) | Dual surfaces = discovery + conversion. One codebase avoids drift. | LOCKED |
| 15 | Repo = bettercallzaal/zlank (PUBLIC, MIT) -> transfer to zlank-labs org | BCZ owns v1-2. Transfer when org created. Ensures community stewardship at scale. | LOCKED |

## Architecture (Path A)

```
zlank.online (Next.js 16 + Hono on Vercel)
├── /                                Marketing landing
├── /builder                         The block builder (sign in required)
├── /builder/[id]                    Edit existing Snap
├── /dashboard                       My Snaps (list, edit, share, delete)
├── /gallery                         Public gallery
├── /s/[id]                          Hosted Snap viewer (web preview)
├── /api/
│   ├── snaps (POST = create, GET = list mine)
│   ├── snaps/[id] (GET/PUT/DELETE)
│   ├── snap/[id] (Hono SnapHandler returns Snap JSON)
│   ├── extract-metadata (URL paste preview)
│   ├── auth/miniapp (Quick Auth verify)
│   └── auth/siwf (SIWF verify)
└── /.well-known/farcaster.json      Mini App manifest (NOT Snap manifest)
```

Why Path A: zero per-Snap infra cost. Scales to thousands of Snaps on one Vercel deployment. Free 7-day = `expires_at < now()` check on every request. Path B (per-Snap Vercel projects) would burn quota first week ZAO members try it. Path C (subdomain wildcard) needs Vercel Pro - defer to v2.

## Tech Stack

| Layer | Package | Version | Why |
|---|---|---|---|
| **App** | Next.js + React + Tailwind | 16 + 19 + v4 | App Router, Turbopack, matches ZAO OS |
| **API** | Hono | 4.x | Lightweight, no boilerplate for `/api/snap/[id]` |
| **Snap server** | @farcaster/snap-hono | v1.4.8 | SnapHandler middleware, JFS verification |
| **Snap types** | @farcaster/snap | v2.0.3 | Schemas, validation (MAX_ELEMENTS=64, etc), JFS verify |
| **Mini App SDK** | @farcaster/miniapp-sdk | v0.3.0 | Context detection, Quick Auth, composeCast |
| **Browser auth** | @farcaster/auth-client + auth-kit | latest | SIWF message verify + widget |
| **Drag-drop** | @dnd-kit/core + sortable | v6.4 | React 19 ready, touch-first, no vendor lock |
| **Block picker** | cmdk | v1.1+ | Slash menu + floating mobile button |
| **State** | zustand + zundo | v5 + latest | Minimal boilerplate, transparent undo/redo |
| **UI** | shadcn/ui (Radix) | latest | Dialog, Drawer, Command, Popover primitives |
| **Metadata** | ogie | latest | Server-side URL OG extraction (Link, Music blocks) |
| **Preview** | @dhaiwat10/react-link-preview | latest | Client-side URL preview rendering |
| **Database** | @supabase/supabase-js | latest | Auth + Postgres with RLS |
| **On-chain reads** | viem | v2.x | Token metadata, wallet trust signals (spam defense) |
| **Optional (v1.5)** | Upstash Redis | latest | Rate-limit state if Supabase RPC saturates |

## 14 Block Catalog

**v1 ships 7 core blocks** (v1.5 adds 7 more, v2 unlocks token launch + Mini App upgrade):

### v1.0 (Ship day 1)
| # | Block | User input | Snap output | Status |
|---|---|---|---|---|
| 1 | Header | Title + subtitle | `item` with optional `badge` | v1 |
| 2 | Text | Plain text (max 320 chars) | `text` element | v1 |
| 3 | Image | HTTPS URL (or upload CDN) | `image` (aspect ratio picker: 1:1 / 16:9 / 4:3 / 9:16) | v1 |
| 4 | Link button | URL + label (max 30 chars) | `open_url` button | v1 |
| 5 | Share to feed | Text (max 1024 chars) + 0-2 embeds | `compose_cast` button | v1 |
| 6 | Poll | Question + 2-4 options | `toggle_group` + `submit` to `/api/snap/[id]/vote` | v1 |
| 7 | Divider | (no fields) | `separator` | v1 |

### v1.5 (Add when testing complete, months 2-4)
| 8 | Music | Paste Spotify / SoundCloud / YouTube URL | Cover image + `open_url` button | v1.5 |
| 9 | Artist | Type FC handle (Neynar autocomplete) | `view_profile` button + name + ZABAL badge if ZAO member | v1.5 |
| 10 | Mini App | Paste FC mini app URL | `open_mini_app` button (bridge to full-screen app) | v1.5 |
| 11 | Token | Paste Clanker URL or 0x contract | Live price (DexScreener) + `swap_token` action | v1.5 |
| 12 | Event | Date + venue + RSVP URL | `item` + `open_url` button + time `badge` | v1.5 |
| 13 | Fundraiser bar | Goal $ + current $ + label | `progress` bar + `badge` | v1.5 |
| 14 | Bounty | Task + reward $ + apply URL | `item` + `open_url` button | v1.5 |

**User flow:** Drag blocks vertically, reorder, set props in drawer, hit Deploy. Snap goes live at `zlank.online/s/[uuid]`, 7-day expiry timer starts.

## Snap UI Hard Limits (must enforce on builder side)

| Element | Cap | Notes |
|---|---|---|
| Button label | 30 chars | Truncate or warn user |
| Text content | 320 chars | Truncate |
| Item title | 100 chars | |
| Item description | 160 chars | |
| Badge label | 30 chars | |
| Input label / placeholder | 60 chars | |
| Input maxLength | 1-280 chars configurable | |
| Image URL | HTTPS only | No data: or http: schemes |
| compose_cast text | 1024 chars (cast limit) | |
| compose_cast embeds | 2 max | |
| Bar Chart bars | 6 max | |
| Toggle Group options | 6 max | |
| Cell Grid | 2-32 cols / 2-16 rows | |
| Stack depth | recommend max 8 | spec doesn't enforce |
| POST timestamp skew | 5 min max | client errors otherwise |

Theme accent colors: gray, blue, red, amber, green, teal, purple, pink + special "accent". No custom hex.

Action types available: `submit`, `open_url`, `open_mini_app`, `view_cast`, `view_profile`, `compose_cast`, `view_token`, `send_token`, `swap_token`. Note v2.x of `@farcaster/snap` (released Apr 23 2026) added native `view_token` / `send_token` / `swap_token` - consider bumping reference impls + template once tested.

NOT in spec (workarounds needed): audio/video elements (link out only), markdown in text (links require separate button), animations beyond page-level confetti, image upload (URL only), search/autocomplete (multi-page flow), conditional rendering (pre-build branches as separate pages).

## Dual-Context (Mini App + Standalone Web)

Detect:
```typescript
import { sdk } from '@farcaster/miniapp-sdk'
const isMiniApp = await sdk.isInMiniApp()
```

Auth fork:
- **Mini App context**: Quick Auth (`sdk.quickAuth.getToken()`) → JWT with FID in `sub` claim, verify via `@farcaster/quick-auth` `verifyJwt`
- **Browser context**: SIWF (`sdk.signIn()` returns message + signature), verify via `@farcaster/auth-client` `verifySignInMessage`

Both yield FID + session token. Same downstream session handling.

Share fork:
- **Mini App**: `sdk.actions.composeCast({ text, embeds })` - native composer
- **Browser**: copy URL to clipboard + open `https://warpcast.com/~/compose?embeds=<url>`

Mini App manifest at `/.well-known/farcaster.json` (different schema from Snap manifest - uses `miniapp` block not `frame` block). Need account association EIP-712 sign with app wallet.

## Cost Trajectory

**Scale assumption:** 1000 builders, 5000 Snaps created, 1500 active at any time, 75k daily renders = 2.3M/month.

| Provider | Free Tier | Our Use | Wall Hits | Mitigation | Real Cost |
|---|---|---|---|---|---|
| **Vercel Hobby** | 100GB bw, 1M invocations | 10-15GB, 2.3M invocations | Month 6-8 | Edge cache Snap JSON (TTL = age), gzip 60% | $20/mo Pro |
| **Supabase Free** | 500MB DB, 5GB egress | 20-50MB DB, 2-3GB egress | Month 8-10 | Batch queries, optimize RLS | $0 (year 1) |
| **Neynar Starter** | 300 RPM | 3.4M/mo calls (artist autocomplete + lookups) | **Month 3-4** | Batch user lookups 10x (cuts 3.4M to 500k/mo); cache 1h | $150/mo Growth |
| **DexScreener Free** | 300 RPM | 450k/mo (token prices) | Never | Cache 5-10min at edge | $0 |
| **TOTAL** | | | | | **~$170/mo at scale** |

**Sustainability:** Free tier holds 6-12 months before hitting Neynar wall. Upgrade to paid growth tier when creators hit rate limits (signals product-market fit).

## Spam Mitigation (open-access playbook)

MVP stack (free, ship day 1):

1. **Per-FID rate limits** - 5 Snaps/day signup tier, 50/day after 10 published, unlimited at managed-service tier
2. **Email verification** for non-Mini-App signups, blocklist disposable email domains (500ms middleware check)
3. **Duplicate detection** - Snap title+desc hash, cosine sim > 0.9 = auto-reject
4. **Keyword filter** - reject titles/descriptions with banned terms (scam, rugpull, hack), maintainable JSON list
5. **Honeypot field** - hidden `_username` form field, if filled silently drop
6. **Wallet trust signal** (ZAO-specific) - check on-chain reputation (holds >$1 of any ERC-20), blocks 99% of bot signups, free via viem + Alchemy

Tier 2 (add when abuse appears, $50/mo):
- AbuseIPDB free tier (50 lookups/day) for IP reputation
- hCaptcha free tier (1M challenges/mo) for low-rep FIDs
- User-report flow: 5 reports from distinct emails = auto-delete

Tier 3 (add at scale):
- Perspective API for profanity (paid)
- PhishTank API for URL phishing check
- CLIP image NSFW scoring (Replicate)

## Phasing

### v1.0 (Months 0-2) - Block Builder Ships
- Auth: SIWF (browser) + Quick Auth (Mini App)
- 7 core blocks: Header, Text, Image, Link button, Share to feed, Poll, Divider
- Builder UX: drag-reorder + `/` slash menu + live JSON preview
- Snap hosting: `/s/[uuid]` with 7-day expiry (timestamp check on render)
- Dual surfaces: standalone zlank.online + Farcaster Mini App from same codebase
- Spam defense: 6 MVP tactics (rate limit, email verify, duplicate hash, keyword filter, honeypot, wallet trust)

### v1.5 (Months 2-4) - Creator Blocks + External APIs
- Add 7 more blocks: Music, Artist, Mini App, Token, Event, Fundraiser, Bounty
- Neynar Artist autocomplete (FID lookup, ZABAL badge detection)
- DexScreener Token price fetch + swap_token action
- Event-driven Snap triggers: scheduled posts, onchain event reactions

### v2 (Months 4+) - Monetization + Platform
- Token LAUNCH (Clanker integration for creator coin drops)
- Mini App upgrade path (Snaps that outgrow lightweight UI can prompt full-screen app)
- Multi-chain support (Solana, Arbitrum)
- XMTP DMs from within Snaps
- Snapshot governance proposal embedding
- Managed-service tier: pay to keep Snap alive past 7 days
- See doc 498 (Zlank unified SDK concept) for long-term vision

## Repo Plan

| Repo | Purpose | Status |
|---|---|---|
| `bettercallzaal/zlank-snap-template` | Code-first starter for devs who want to fork+host their own Snap | LIVE PUBLIC, github.com/bettercallzaal/zlank-snap-template |
| `bettercallzaal/zlank` | The website + builder + hosted runtime + Mini App | TO SCAFFOLD - new Next.js 16 repo, MIT, public from day 1 |

Once `zlank-labs` GitHub org exists, transfer both via `gh repo transfer`.

## Design Questions (Lock Before Scaffold)

| # | Question | v1 pick | Rationale |
|---|---|---|---|
| 1 | Theme palette | Default ZAO navy (#0a1628) + gold (#f5a623); per-Snap picker in v1.5 | Brand consistency v1; Linktree-style customization later |
| 2 | Snap URL slug | `zlank.online/s/[uuid]` | Clean, no collisions, shares don't break if creator changes name |
| 3 | Expired Snap behavior | Show "Snap expired - upgrade to managed tier?" landing page with CTA | Conversion opportunity; not 404 (too harsh) |
| 4 | Gallery visibility | Opt-in-to-list (private by default) | Privacy first; creators choose to showcase. Gallery becomes portfolio site in v1.5 |
| 5 | Edit URL sharing | `/builder/[id]` owner-only (generate shareable invite links in v1.5) | Simpler auth v1; avoid accidental overwrites. Collaboration tooling later. |
| 6 | Anonymous build trial | Sign in only to deploy (build without auth) | Lower friction; sign-in happens at critical moment (deploy). A/B test post-v1. |
| 7 | v1 block lineup | Header, Text, Image, Link button, Share to feed, Poll, Divider | Core use cases covered. Music + Artist need Neynar (v1.5). Token complex (v1.5). |

## Related Documents

- [Doc 260 - Neynar Acquires Farcaster (context)](../260-neynar-acquires-farcaster/) - Infrastructure ownership, continuity
- [Doc 295 - Farcaster Snaps (technical spec)](../295-farcaster-snaps/) - v2.0 components, actions, validation
- [Doc 498 - Zlank unified SDK concept (long-term vision)](../../business/498-zlank-unified-sdk-concept/) - Monetization roadmap
- [Doc 500 - Snaps as Zlank v1 pivot](../500-snaps-zlank-build-platform/) - Why Snaps over other formats
- [Doc 527 - Zlank next 3 builds (sprint planning)](../527-zlank-next-3-builds/) - Implementation sequencing

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm design decisions (7 questions above) | Zaal | Decision | 2026-05-25 |
| Scaffold `bettercallzaal/zlank` repo (Next.js 16 + Hono + full stack) | Claude | Code | 2026-05-27 |
| Create Supabase schema: snaps, snap_blocks, snap_events, spam_metrics | Claude | DB | 2026-05-27 |
| Build 7 v1 block editor components | Quad/Claude | Code batch | 2026-05-30 |
| Implement Snap JSON renderer (Hono handler) | Claude | Code | 2026-05-30 |
| Build SIWF + Quick Auth dual-fork session | Claude | Code | 2026-06-01 |
| Create Mini App manifest + EIP-712 account association | Claude | Code | 2026-06-02 |
| Set up spam defense (rate limit, email verify, keyword filter, honeypot, wallet trust) | Claude | Code | 2026-06-05 |
| Deploy v1.0 to zlank.online on Vercel | Claude | Infra | 2026-06-07 |
| Public beta launch announcement | Zaal | Marketing | 2026-06-08 | |

## Sources

- [farcasterxyz/snap repository](https://github.com/farcasterxyz/snap) [FULL - 117+ releases, stable]
- [Farcaster Snaps documentation](https://docs.farcaster.xyz/snap) [FULL - v2.0 spec]
- [@farcaster/snap npm package (v2.0.3)](https://registry.npmjs.org/@farcaster/snap) [FULL - latest release]
- [@farcaster/snap-hono npm package (v1.4.8)](https://www.npmjs.com/package/@farcaster/snap-hono) [FULL - stable middleware]
- [Farcaster Mini Apps SDK (v0.3.0)](https://miniapps.farcaster.xyz/docs/specification) [FULL - dual context]
- [@farcaster/miniapp-sdk npm](https://www.npmjs.com/package/@farcaster/miniapp-sdk) [FULL - Quick Auth]
- [dnd-kit drag-drop (v6.4)](https://github.com/clauderic/dnd-kit) [FULL - React 19 ready]
- [cmdk command palette (v1.1+)](https://github.com/pacocoursey/cmdk) [FULL - slash menu UX]
- [zustand state (v5)](https://github.com/pmndrs/zustand) [FULL - minimal boilerplate]
- [zundo undo/redo middleware](https://github.com/charkour/zundo) [FULL - transparent history]
- [shadcn/ui component library](https://ui.shadcn.com/) [FULL - Radix + Tailwind]
- [ogie URL metadata extraction](https://github.com/DobroslavRadosavljevic/ogie) [FULL - server-side OG parser]
- [Supabase pricing + RLS](https://supabase.com/pricing) [FULL - free tier specs]
- [Vercel Hobby tier limits](https://vercel.com/docs/limits) [FULL - 100GB bw, 1M invocations]
- [Neynar API rate limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis) [FULL - 300 RPM starter]
- [DexScreener API reference](https://docs.dexscreener.com/api/reference) [FULL - token price feeds]
