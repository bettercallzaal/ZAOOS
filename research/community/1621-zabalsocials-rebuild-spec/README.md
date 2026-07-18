---
topic: community, technology
type: rebuild-spec
status: SPEC READY — board task #16. Implementation gated on Hurricane dev bandwidth (after ZAOstock Oct 3 or parallel if bandwidth allows). Route: rebuild inside ZAOOS at /links, then consider spinning to standalone repo.
last-validated: 2026-07-18
related-docs: 051-zao-whitepaper-2026, 1614-zao-north-star-narrative-spec, 1542-zao-geo-entity-brief, 1438-llms-txt-zaoos, 200-community-os-ai-agents-platform-vision
board-tasks: "ZabalSocials site rebuild (#16 in agentic coordination plan)"
action-owner: Hurricane (implementation); Zaal (content decisions + brand additions)
---

# 1621 — ZabalSocials Site Rebuild Spec

> **What this is:** Rebuild spec for ZabalSocials (https://zabalsocials.vercel.app) — the ZAO ecosystem's social links directory. Current site: Vite + React, static JSON, last updated January 2026. The rebuild modernizes the stack, adds 6 missing brands, connects to live data, and integrates the site into the ZAO OS monorepo-as-lab pattern.
>
> **Current state:** https://github.com/bettercallzaal/zabalsocials — public repo, 5 brands, frozen since Jan 25, 2026. Missing: ZABAL, ZAOstock (standalone), COC Concertz, ZOL, Sparkz, ZAO Music.

---

## Why Rebuild

The current ZabalSocials was built in January 2026 — a good foundation, but frozen. Since then:

- **6 new brands launched or broke out:** ZABAL, ZAOstock (its own event brand), COC Concertz (own repo), ZOL (@zolbot), Sparkz (own repo), ZAO Music
- **The data went stale fast:** Static JSON can't track Farcaster handles, Discord invite rotations, or handle changes
- **No analytics:** Every link exits with no click tracking
- **No ZAO OS integration:** The site is a standalone Vercel project, disconnected from the ZAO OS member database and Bonfire knowledge graph
- **No GEO / llms.txt footprint:** ZabalSocials is not in the `llms.txt` or `community.config.ts` canonical link sets

The rebuild addresses all five.

---

## Current State Audit

### What Exists (as of July 2026)

| Item | Value |
|------|-------|
| Live URL | `https://zabalsocials.vercel.app/` |
| Repo | `github.com/bettercallzaal/zabalsocials` |
| Stack | Vite + React + Tailwind |
| Data source | `data/socials.json` (static) |
| Last commit | January 25, 2026 |
| Brands | BetterCallZaal, The ZAO DAO, ZAO Festivals, ZAO Calendar, WaveWarZ |
| Missing brands | ZABAL, ZAOstock, COC Concertz, ZOL, Sparkz, ZAO Music |

### What Worked

- Clean brand separation (one section per entity)
- `isPrimary` flag for recommended entry points per brand
- Search/filter across all links
- Mobile-responsive layout
- SEO basics (robots.txt, sitemap.xml, OG image)

### What Broke

- Stale handles (Farcaster, X, Discord invite links rotate)
- Missing brands (ZABAL, ZAOstock, ZOL, Sparkz, COC, ZAO Music)
- No analytics (zero insight into which links get used)
- Disconnected from ZAO OS (can't pull from `community.config.ts`)
- No contribution path for community members to update their own entries

---

## Rebuild Scope

### Option A: ZAOOS Integration (Recommended)

Move ZabalSocials into ZAO OS as `/links`. Benefits:
- Shares auth, `community.config.ts` data source, and analytics infrastructure
- Consistent with monorepo-as-lab pattern
- Auto-pull brand handles from existing config
- Click tracking via existing `src/app/api/activity/`
- Hurricane already knows the ZAO OS codebase

**Path:** New `src/app/links/` route in ZAOOS → deploy at `zaoos.com/links` → redirect `zabalsocials.vercel.app` → graduate to `links.thezao.com` subdomain if traffic warrants it

### Option B: Standalone Rebuild (simpler but isolated)

Rebuild the existing repo with Next.js 15, keep it separate from ZAO OS.

**Verdict:** Option A. ZAO OS already has the data, analytics, and auth. Duplicating them in a standalone repo creates maintenance overhead.

---

## Implementation Plan (Option A)

### Phase 1: Data Migration (1-2h)

1. Convert `data/socials.json` to a TypeScript config file: `src/config/social-links.ts`
2. Add missing brands (ZABAL, ZAOstock, COC Concertz, ZOL, Sparkz, ZAO Music)
3. Pull canonical handles from `community.config.ts` where they already exist

**New brand list:**

| Brand ID | Name | Primary Platform |
|----------|------|-----------------|
| `bettercallzaal` | BetterCallZaal | X @BetterCallZaal |
| `thezaodao` | The ZAO | Farcaster /zao |
| `zabal` | ZABAL | Farcaster /zabal |
| `wavewarz` | WaveWarZ | X @WaveWarZ |
| `zaostock` | ZAOstock | Eventbrite (Oct 3 2026) |
| `coc-concertz` | COC Concertz | YouTube @BetterCallZaal |
| `zol` | ZOL | Farcaster @zolbot (FID 3338501) |
| `sparkz` | Sparkz | TBD (not public yet) |
| `zao-music` | ZAO Music | DistroKid / BMI |
| `zaofestivals` | ZAO Festivals | TBD |

### Phase 2: Route Build (2-3h)

New route: `src/app/links/page.tsx`

```typescript
// Core layout: brand cards with expandable link groups
// Brand card: logo + primary platform CTA + expand arrow
// Expanded: full platform list with purpose annotations
// Search: filter by brand name, platform name, or handle
// Click tracking: POST /api/activity { type: 'social_link_click', brand, platform, url }
```

**Design tokens:** Match existing ZAO OS brand colors (navy `#0a1628`, gold `#f5a623`, Tailwind v4). No custom CSS needed — use existing `globals.css`.

**No auth required.** Public page. Anonymous click tracking only.

### Phase 3: Analytics Hook (30min)

ZAO OS already has `src/app/api/activity/` for event tracking. Add one new event type:

```typescript
// New event type in activity table:
// { type: 'social_link_click', metadata: { brand_id, platform, url } }
```

ZOE weekly report: include "top 3 clicked ZAO links this week" in Sunday 7PM EOD summary.

### Phase 4: GEO Integration (30min)

1. Add `/links` to `llms.txt` (doc 1438): `https://zaoos.com/links — ZAO ecosystem social links directory`
2. Update `community.config.ts` navigation to include `/links`
3. Add one sentence to `research/identity/1542-zao-geo-entity-brief/`: "Full social directory: zaoos.com/links"

---

## Brand Data Spec

Each brand entry follows this shape in `social-links.ts`:

```typescript
interface SocialLink {
  platform: string;     // "Farcaster", "X", "YouTube", etc.
  handle: string;       // "@bettercallzaal", "/zao", etc.
  url: string;          // canonical URL
  purpose: string;      // one sentence — what this channel is for
  isPrimary?: boolean;  // true = show in collapsed card view
}

interface SocialBrand {
  id: string;           // kebab-case, stable across rebuilds
  name: string;         // display name
  description: string;  // 1-2 sentences — what this brand/entity is
  color: string;        // hex — consistent with community.config.ts
  platforms: SocialLink[];
}
```

**Migration from current JSON:** Direct 1:1 mapping. Existing `bettercallzaal`, `thezaodao`, `zaofestivals`, `zaocalendar`, `wavewarz` entries port unchanged. New brands added per the table above.

---

## Content for New Brands

### ZABAL
- **Description:** ZAO's community currency on Base. Earn by participating, spend in the ZABAL marketplace, win in ZABAL Games.
- **Platforms:**
  - Farcaster: /zabal (primary) — channel for ZABAL Games + battle updates
  - X: @bettercallzaal (ZABAL updates tagged #ZABAL)
  - Contract: `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (Base)
  - DEX: ETH→SANG→ZABAL swap on Uniswap

### ZAOstock 2026
- **Description:** ZAO's first IRL music festival. October 3, 2026. Ellsworth, Maine. WaveWarZ live battle + on-stage DAO governance vote.
- **Platforms:**
  - Eventbrite: ticket URL (primary) — free RSVP + paid supporter tiers
  - X: @wavewarz (event announcements)
  - Farcaster: /wavewarz (event casts)
  - Telegram: ZAO main (updates)

### COC Concertz
- **Description:** Monthly showcase where WaveWarZ artists perform for ZOR holders. Each show features one live MAIN battle.
- **Platforms:**
  - YouTube: @BetterCallZaal (primary) — episode recordings
  - WaveWarZ: wavewarz.info (battle history for show episodes)
  - Farcaster: /wavewarz (show announcements)

### ZOL
- **Description:** ZAO's Farcaster agent. Monitors /wavewarz, /zabal, and /zao. Posts battle results, artist spotlights, and weekly channel recaps.
- **Platforms:**
  - Farcaster: @zolbot (primary, FID 3338501)
  - GitHub: `github.com/bettercallzaal/zol` (codebase)

### ZAO Music
- **Description:** Music rights and distribution entity under BCZ Strategies LLC. BMI + DistroKid + 0xSplits rails for ZAO artists.
- **Platforms:**
  - BMI: registered (not public URL)
  - DistroKid: label account (DSP distribution)
  - 0xSplits: onchain royalty splits (Ethereum)
  - First release: Cipher (planned — update when live)

### Sparkz
- **Description:** Creator coin launchpad for independent artists. Access coins, not meme coins.
- **Platforms:**
  - Website: TBD (not public yet — add after launch)
  - Farcaster: TBD
  - GitHub: `github.com/bettercallzaal/sparkz` (private)

---

## What Doesn't Change

The existing `zabalsocials` repo stays live at `zabalsocials.vercel.app` until the ZAOOS `/links` route is live and redirected. No migration breaking change — existing links still work.

The current `data/socials.json` JSON format stays readable as a reference. The TypeScript config in ZAO OS is the new source of truth, but the JSON file documents the v1 schema.

---

## PR Scope (Hurricane Handoff)

**1 PR: `feat/social-links-page` in ZAOOS (3-4h)**

Deliverables:
- `src/config/social-links.ts` — all brand + platform data
- `src/app/links/page.tsx` — public links directory page
- `src/app/links/components/BrandCard.tsx` — collapsible brand card
- `src/app/links/components/SearchBar.tsx` — cross-brand search
- `src/app/api/activity/social-link/route.ts` — click tracking endpoint
- Update `llms.txt` (doc 1438 pattern)
- Update `community.config.ts` navigation

**Out of scope:**
- User-editable entries (no auth needed yet)
- Per-person "personal nexus" pages (use doc 2026-05-03-nexus-rebuild-spec.md for that)
- ZabalSocials repo spindown (keep it live; redirect after ZAOOS `/links` is stable)

**Testing:**
- Visit `/links` unauthed → all brands + platforms visible
- Search "ZABAL" → ZABAL brand + ZABAL handles in other brands appear
- Click any link → activity event logged (check Supabase `activity` table)
- Mobile: all brand cards collapse cleanly to single CTA button

---

## Graduation Decision

The monorepo-as-lab pattern says: graduate when it needs its own domain + team. ZabalSocials should graduate if:
- The site gets >500 unique visits/week (then it deserves `links.thezao.com`)
- Or it adds user-editable profiles (then it needs its own auth flow)

Until then, it lives at `zaoos.com/links`. The `zabalsocials.vercel.app` URL redirects there via `vercel.json` in the old repo.

---

## Sources

- `github.com/bettercallzaal/zabalsocials` — current site (last commit Jan 25, 2026)
- `community.config.ts` — canonical brand handles + colors
- `docs/specs/2026-05-03-nexus-rebuild-spec.md` — companion rebuild (personal links hub, separate scope)
- Research doc 600 (`agentic-stack-coordination-v1`) — task #16 origin
- `research/identity/1542-zao-geo-entity-brief/README.md` — entity facts for brand descriptions
- `research/identity/1438-llms-txt-zaoos/` — llms.txt update pattern
- Board task: "ZabalSocials site rebuild (#16)"
