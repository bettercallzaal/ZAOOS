# 124 — Sopha: Deep Social on Farcaster (Curation Client)

> **Status:** Research complete
> **Date:** March 24, 2026
> **Goal:** Understand Sopha's curation model and what ZAO OS can learn from it

## Key Findings

| Aspect | Detail |
|--------|--------|
| **What it is** | A long-form Farcaster client focused on philosophy, art, and meaningful conversations |
| **URL** | https://www.sopha.social |
| **FID** | 5701 |
| **Positioning** | "Deep Social" — anti-algorithmic, anti-engagement-farming |
| **Tech stack** | Next.js, Neynar (webhooks + frames), PWA, Farcaster Mini App |
| **Twitter** | @sopha_social |
| **Wallet** | 0x307f9cC8650862E0815Adf833B9125F4e0ed4055 |

## What Makes Sopha Different

Sopha is a **niche Farcaster client** that deliberately filters for depth over volume. While Warpcast is Twitter-like (short casts, algorithmic feed), Sopha positions as the **"Substack of Farcaster"** — long-form, philosophical, art-focused.

### Design Philosophy
- **Long-form first** — not 320-char casts, but deeper posts
- **Philosophy, art, and meaningful conversations** — curated by topic, not by algorithm
- **"Deep Social"** — a reaction against engagement-maximizing feeds
- **Warm, earthy aesthetic** — #B8966F palette (vs Warpcast's blue/purple)
- **Portrait-first PWA** — mobile-native, installable

### Technical Details
- **Mini App**: `https://sopha.social/miniapp` — runs inside Farcaster as a frame
- **Cast sharing**: `https://sopha.social/share` — custom share URLs
- **Neynar integration**: Uses Neynar webhooks for frame events (same as ZAO OS)
- **PWA**: Standalone installable app with service workers
- **Next.js**: Same framework as ZAO OS

## What ZAO OS Can Learn

### 1. Curation as a Feature, Not a Default
Sopha proves there's demand for **filtered, curated feeds** within Farcaster. ZAO OS already has:
- `src/components/chat/FeedFilters.tsx` — content type filters (All/Music/Images/Video/Links/Text)
- `src/app/api/music/submissions/route.ts` — music approval queue
- Respect-weighted voting on proposals

**Opportunity:** Add a **"Curated" feed tab** that surfaces high-quality posts based on Respect-weighted curation — not algorithmic, but community-vetted.

### 2. Long-Form Support
Farcaster casts are limited to 1024 chars. Sopha works around this for "long-form" content. ZAO OS could:
- Support **threaded long posts** (auto-split into cast threads)
- Add a **"Notes" or "Articles" feature** where members write longer content
- Use the proposals system for long-form community publications

### 3. Topic-Based Channels as Curation
Sopha curates by topic (philosophy, art). ZAO OS already has channels (#zao, #zabal, #cocconcertz, #wavewarz).

**Opportunity:** Add **community-created channels** with curator roles (Hats-based), where curators can pin/feature content.

### 4. "Deep Social" for Music
Sopha = philosophy + art. ZAO = music + artists. The "deep social" approach applied to music would mean:
- Highlighting **artist stories** over casual chat
- **Track context** — why an artist made this song, the inspiration
- **Listening sessions** with discussion threads (we already have `useListeningRoom`)

### 5. Mini App Pattern
Sopha runs as both a standalone site AND a Farcaster Mini App. ZAO OS already has Mini App support (`src/components/miniapp/MiniAppGate.tsx`). We could expose specific features (Track of the Day, Proposals) as standalone mini apps.

## Comparison: Sopha vs ZAO OS

| Feature | Sopha | ZAO OS |
|---------|-------|--------|
| **Focus** | Philosophy, art, conversations | Music, governance, community |
| **Feed type** | Long-form, curated | Real-time channel feed |
| **Curation** | Topic-based (implicit) | Respect-weighted voting (explicit) |
| **Gating** | Open (anyone on Farcaster) | Allowlist-gated (100 members) |
| **Cross-posting** | Farcaster only | Farcaster + Bluesky + X |
| **Governance** | None visible | Fractal consensus, 90+ weeks |
| **Music** | None | 8-platform player, radio, submissions |
| **Messaging** | Farcaster casts only | Farcaster + XMTP encrypted DMs |
| **Mini App** | Yes | Yes |
| **Tech** | Next.js + Neynar | Next.js + Neynar + Supabase + XMTP |

## Actionable Ideas for ZAO OS

| Idea | Effort | Impact |
|------|--------|--------|
| **Curated feed tab** (Respect-weighted "Best of") | 4-8 hrs | High — surfaces quality content |
| **Long-form posts** (thread auto-split + article mode) | 1-2 days | Medium — differentiates from Warpcast |
| **"Deep Listening" mode** (focused music + discussion) | 1 day | High — unique to music community |
| **Community curator roles** (Hats-based channel curation) | Sprint 5 | High — aligns with governance |
| **Expose Track of Day as Mini App** | 2-4 hrs | Medium — viral distribution on Farcaster |

## Limitations of This Research

Sopha is **very new and has minimal web presence** — no blog posts, no Medium articles, no documentation beyond the app itself. The curation model specifics (how they filter/rank content) are not documented publicly. The app's inner workings are only visible by using it directly on Farcaster.

**Recommendation:** Use Sopha directly from Warpcast (search for the mini app) to understand the UX firsthand, then decide which curation patterns to adopt for ZAO OS's music context.

## Sources

- [Sopha.social](https://www.sopha.social) — main app
- Sopha Farcaster manifest (`/.well-known/farcaster.json`) — FID 5701, Neynar webhooks
- Sopha PWA manifest (`/manifest.json`) — standalone PWA, portrait-first
- [@sopha_social on X](https://x.com/sopha_social) — official account
- [awesome-farcaster](https://github.com/a16z/awesome-farcaster) — not yet listed (too new)
- [Farcaster docs](https://docs.farcaster.xyz) — protocol context
