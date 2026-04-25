---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-24
related-docs: 487, 491, 492, 497, 498, 500
tier: DISPATCH
---

# 505 - Zlank.online Builder Spec (synthesized from 4-agent research)

> **Goal:** Lock the architecture, tech stack, hard limits, dual-context auth, free-tier ceilings, spam mitigation, and phasing for `zlank.online` - the no-code Farcaster Snap builder + hosted runtime.

## TL;DR

Zlank.online = single Next.js + Hono app on Vercel. Block-based builder (Linktree-style) at `/builder`, hosted Snap runtime at `/s/[id]`, free 7-day expiry per Snap. Same app ships as a Farcaster Mini App. Open access (no whitelist), Sign In With Farcaster + Quick Auth dual fork, 6-tactic spam defense. Stack locked: Next.js 16 + Hono + @farcaster/snap + @dnd-kit + cmdk + zustand + Supabase + shadcn/ui. Free tier holds 6-12 months at projected scale; ~$170/mo at 1500 active Snaps + 75k daily renders. Repo: `bettercallzaal/zlank` (transfer to `zlank-labs` once org exists).

## Locked Decisions

| # | Decision | Pick |
|---|---|---|
| 1 | Architecture | **Path A** - single Next.js + Hono, dynamic `/s/[id]` routing, all Snaps share one server |
| 2 | Builder UX | **Block-based picker** (Linktree + Notion + Tally hybrid). 14 block types. NOT raw forms. |
| 3 | Drag-drop lib | `@dnd-kit` v6.4 + `@dnd-kit/sortable` (React 19 ready, touch-first) |
| 4 | Block picker | `cmdk` v1.1+ via shadcn Command (slash menu + floating button on mobile) |
| 5 | State + undo | `zustand` v5 + `zundo` middleware |
| 6 | UI lib | `shadcn/ui` on Tailwind v4 (matches ZAO OS) |
| 7 | URL metadata | `ogie` server-side at `/api/extract-metadata` |
| 8 | DB | Supabase (dedicated zlank project, NOT shared with ZAO OS) |
| 9 | Snap SDK | `@farcaster/snap` v1.15.1 + `@farcaster/snap-hono` v1.4.8 (matches duodo + nouns reference impls) |
| 10 | Mini App SDK | `@farcaster/miniapp-sdk` v0.3.0 |
| 11 | Auth | Dual fork - Quick Auth in Mini App context, SIWF in browser. ZAO whitelist REMOVED 2026-04-24 = open to any FID. |
| 12 | Token block | OPTIONAL in v1 - paste existing Clanker URL or contract, auto-shows price + buy button. NO token launch UI v1. |
| 13 | Distribution surfaces | BOTH - standalone web at zlank.online + Farcaster Mini App from same Next.js codebase |
| 14 | Repo | `bettercallzaal/zlank` (PUBLIC). Transfer to `zlank-labs` org once it exists. |

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

## Tech Stack (locked)

```
Next.js 16 + React 19           App Router, Tailwind v4, Turbopack
Hono 4.x                         API routes for /api/snap/[id]
@farcaster/snap-hono 1.4.8       SnapHandler middleware
@farcaster/snap 1.15.1           Snap UI types, JFS verify
@farcaster/miniapp-sdk 0.3.0     Mini App context detection, Quick Auth, composeCast
@farcaster/auth-client            SIWF verification
@farcaster/auth-kit               SIWF widget for browser
@dnd-kit/core 6.4 + sortable     Drag-reorder block stack
cmdk 1.1+                         Slash menu block picker
zustand 5 + zundo                 Block tree state + undo/redo
shadcn/ui (Radix)                 UI primitives (Dialog, Drawer, Command, Popover)
ogie                              URL OG metadata extract (server-side)
@dhaiwat10/react-link-preview    URL preview display (client)
@supabase/supabase-js            Auth + DB (Supabase Postgres)
viem 2.x                          On-chain reads (token metadata, wallet trust signal)
```

Optional later: Redis (Upstash) for rate-limit state if Supabase RPC gets slow.

## 14 Block Catalog (v1)

| Block | Fields user fills | Renders to Snap |
|---|---|---|
| **Header** | Title + subtitle | `item` with optional `badge` |
| **Text** | Plain text (max 320 chars) | `text` element |
| **Image** | Paste HTTPS URL or upload | `image` (1:1 / 16:9 / 4:3 / 9:16 aspect) |
| **Music** | Paste Tortoise / Spotify / SoundCloud / YouTube | Cover image + `open_url` button |
| **Artist** | Type FC handle (Neynar autocomplete) | `view_profile` button + name + ZABAL badge if ZAO |
| **Link button** | URL + label | `open_url` button (max 30 char label) |
| **Mini App** | Paste FC mini app URL | `open_mini_app` button |
| **Share to feed** | Share text (max 1024 chars) + 0-2 embeds | `compose_cast` button |
| **Poll** | Question + 2-4 options | `input` + `submit` to /api/snap/[id]/vote |
| **Fundraiser bar** | Goal $ + current $ + label | `progress` + `badge` |
| **Token** (optional) | Paste Clanker URL or 0x contract | Live price (DexScreener) + `swap_token` action |
| **Event** | Date + venue + RSVP URL | `item` + `open_url` button + `badge` |
| **Bounty** | Task + reward + apply URL | `item` + `open_url` button |
| **Divider** | (no fields) | `separator` |

User stacks blocks vertically, drags to reorder, hits Deploy. Snap goes live at `zlank.online/s/[id]`, 7-day clock starts.

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

## Free-Tier Ceilings + Cost Trajectory

Scale assumption: 1000 builders, 5000 Snaps created, 1500 active any time, ~75k daily Snap renders = 2.3M/month.

| Provider | Free Tier | Our Projected Use | Wall Hits | Real Cost at Scale |
|---|---|---|---|---|
| **Vercel Hobby** | 100GB bw, 1M invocations | 10-15GB / 2.3M | Month 6-8 | $20/mo Pro |
| **Supabase Free** | 500MB DB, 5GB egress | 20-50MB / 2-3GB | Month 8-10 | $0 (free works year 1) |
| **Neynar Starter** | 300 RPM global | 3.4M calls/mo | **Month 3-4** | $150/mo Growth |
| **DexScreener Free** | 300 RPM | 450k calls/mo | Never (within reason) | $0 |
| **TOTAL** | | | | **~$170/mo** at scale |

Mitigations to push the wall further:
- Edge cache Snap JSON responses (cache TTL = Snap age, dies at expiry)
- Cache DexScreener token prices 5-10 min at edge
- Cache Neynar artist autocomplete 1 hour
- Batch Neynar user lookups (10 per call) - cuts 3.4M to ~500k/mo
- gzip all JSON responses (60-70% bandwidth saved)

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

**v1 (Months 0-2) - Block builder ships**
- Auth (SIWF + Quick Auth)
- 7 core blocks: Header, Text, Image, Link button, Share to feed, Poll, Divider
- Drag-reorder + slash menu picker + live preview
- 7-day free hosting
- Mini App + standalone web from same codebase
- MVP spam mitigation (6 tactics)

**v1.5 (Months 2-4) - Music + Artist + Token + Event + Bounty + Mini App + Fundraiser blocks**
- Neynar autocomplete for Artist block
- DexScreener integration for Token block
- Cron + event-driven Snap triggers (a Snap that posts itself, a Snap that reacts to onchain events)

**v2 (Months 4+) - Doc 498 vision folds in**
- Token LAUNCH (Clanker integration)
- Mini App upgrade path (Snaps that outgrow lightweight UI)
- Multi-chain (Solana + Arbitrum)
- XMTP DMs + Snapshot governance proposals
- Snap-to-coin pipeline (creator launches coin via a Snap)
- Managed-service tier (zlank.online keeps your Snap alive past 7 days)

## Repo Plan

| Repo | Purpose | Status |
|---|---|---|
| `bettercallzaal/zlank-snap-template` | Code-first starter for devs who want to fork+host their own Snap | LIVE PUBLIC, github.com/bettercallzaal/zlank-snap-template |
| `bettercallzaal/zlank` | The website + builder + hosted runtime + Mini App | TO SCAFFOLD - new Next.js 16 repo, MIT, public from day 1 |

Once `zlank-labs` GitHub org exists, transfer both via `gh repo transfer`.

## Open Questions for Zaal

1. **Theme palette** - default to ZAO navy + gold? Or per-Snap theme picker (Linktree-style)?
2. **Snap URL slug** - `zlank.online/s/[uuid]` (clean) or `zlank.online/s/[username]/[name]` (memorable)?
3. **Expired Snap behavior** - return "expired - upgrade?" page, or just 404? Or owner-readonly view?
4. **Gallery default** - public-by-default or opt-in-to-list?
5. **Edit URL** - should `/builder/[id]` be link-shareable so collaborators can co-edit, or owner-only?
6. **Anonymous build trial** - allow building without sign-in (sign in only to deploy)? Faster funnel.
7. **First scaffolded blocks** - which 7 ship in v1? My pick: Header, Text, Image, Link button, Share to feed, Poll, Divider. Music + Artist + Token slip to v1.5 (need external API integration).

## Also See

- [Doc 487 - QuadWork four-agent dev team](../../agents/487-quadwork-four-agent-dev-team/)
- [Doc 497 - Quad workflow deep dive](../../agents/497-quad-workflow-deep-dive/)
- [Doc 498 - Zlank unified SDK concept (parent vision)](../../business/498-zlank-unified-sdk-concept/)
- [Doc 500 - Snaps as Zlank v1 pivot](../500-snaps-zlank-build-platform/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm 7 v1 block list + theme + slug + expired-behavior decisions (open Qs above) | Zaal | Decision | Before scaffold |
| Scaffold `bettercallzaal/zlank` repo (Next.js 16 + Hono + Tailwind v4 + shadcn + zustand + dnd-kit + cmdk + Supabase) | Claude / Quad | New repo | After Zaal greenlights |
| Set up Supabase project for Zlank, schema: `snaps` (id, owner_fid, name, theme, expires_at) + `snap_blocks` (snap_id, position, type, config_json) + `snap_events` (snap_id, fid, action, ts) | Claude | DB schema | First scaffold |
| Write 7 block builder components (one per v1 block) | Quad batch | Overnight run | Week 1-2 |
| Write Snap renderer (Hono handler that reads snap_blocks ordered by position, dispatches per type, returns Snap JSON) | Claude | Implementation | Week 1 |
| SIWF + Quick Auth dual-fork session manager | Claude | Implementation | Week 1 |
| Mini App manifest + account association sign | Zaal + Claude | Manual + impl | Week 2 |
| Reserve `zlank-labs` GitHub org, transfer both repos | Zaal | Manual + gh | Within 7 days |
| Reserve `zlank.online` domain (if not done) + point to Vercel | Zaal | DNS | Before deploy |
| Decide whether to bump @farcaster/snap to v2.1.1 (new view_token / send_token / swap_token actions) for template + new repo | Zaal | Decision | Before scaffold |

## Sources

**Snap UI primitives:**
- https://github.com/farcasterxyz/snap (read packages/snap/src/ui)
- https://docs.farcaster.xyz/snap
- https://www.npmjs.com/package/@farcaster/snap
- https://www.npmjs.com/package/@farcaster/snap-hono
- duodo-snap + nouns-snap source (already in ZAO OS repo)

**Mini App + dual context:**
- https://miniapps.farcaster.xyz/docs/getting-started
- https://miniapps.farcaster.xyz/docs/specification
- https://miniapps.farcaster.xyz/docs/sdk/quick-auth
- https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
- https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast
- https://github.com/farcasterxyz/miniapps
- https://docs.base.org/mini-apps/quickstart/new-apps/create-manifest

**Free tier + spam mitigation:**
- https://vercel.com/docs/limits
- https://supabase.com/pricing
- https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis
- https://docs.dexscreener.com/api/reference
- https://linktr.ee/s/about/community-standards
- https://softup.io/insight/api-rate-limiting-&-abuse-protection-in-2026

**Builder UX libs:**
- https://www.pkgpulse.com/blog/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026
- https://www.pkgpulse.com/blog/cmdk-vs-kbar-vs-mantine-spotlight-2026
- https://github.com/pacocoursey/cmdk
- https://github.com/clauderic/dnd-kit
- https://github.com/pmndrs/zustand
- https://github.com/charkour/zundo
- https://ui.shadcn.com/
- https://github.com/DobroslavRadosavljevic/ogie
- https://tally.so/help/keyboard-shortcuts
