# 295 - Farcaster Snaps

**Date:** 2026-04-07
**Status:** Complete
**Category:** Technical / Integration

## Key Decisions

1. **Snaps are the successor to Frames v1** - server-driven JSON apps embedded in casts, no client-side code execution. They are NOT a replacement for Mini Apps - they complement them (lightweight in-feed vs full-screen app).
2. **Very new (beta, March 27 2026)** - the `farcasterxyz/snap` repo was created March 27, 2026. Already at 300 commits and 56 releases as of April 7. Moving fast, spec may change.
3. **ZAO OS should build Snaps** - they are perfect for in-feed music interactions (vote on songs, view now playing, quick Respect tips, governance polls). Snaps can also bridge to ZAO OS Mini App via the `open_mini_app` action.
4. **Built by the Farcaster team (now Neynar)** - official protocol feature at `farcasterxyz/snap`, docs at `docs.farcaster.xyz/snap`.
5. **Hono + TypeScript stack** - uses the Hono framework with `@farcaster/snap-hono` package. Deploys to any HTTP host (Vercel works).

## Summary

Farcaster Snaps are lightweight, interactive apps embedded directly in Farcaster casts. They render in the feed as cards and respond to user input (buttons, sliders, text inputs, toggles) without executing any code on the client. A snap server returns JSON; the Farcaster client displays it.

Think of them as "Frames v1 done right" - server-driven like Frames v1, but with 16 rich UI components, multi-page flows, persistent state, theming, and native wallet/token actions.

## What Are Snaps?

### Core Architecture

```
User sees cast with snap embed
       |
       v
Client GETs snap URL (Accept: application/vnd.farcaster.snap+json)
       |
       v
Server returns SnapResponse JSON
       |
       v
Client renders UI tree (16 component types)
       |
       v
User interacts with fields (input, slider, switch, toggle_group)
       |
       v
User taps button -> Client POSTs signed JFS payload to target URL
       |
       v
Server returns new SnapResponse -> Client renders next page
```

### Key Properties

- **No client-side code** - server returns JSON, client renders it. No JS execution in the embed.
- **Multi-page flows** - each `submit` action returns a new page. Navigation is server-driven (no client back button).
- **Authenticated** - POST requests use JSON Farcaster Signatures (JFS) containing the user's FID.
- **Content negotiation** - same URL can serve snap JSON or HTML based on `Accept` header. Websites can add snap support alongside existing pages.
- **Persistent state** - key-value store available on every handler invocation.
- **Theming** - accent colors from a named palette (not hex values).
- **Graceful degradation** - if snap fails, cast displays normally with URL as plain text.

## Snaps vs Mini Apps vs Frames v1

| Feature | Frames v1 (deprecated) | Snaps (NEW, beta) | Mini Apps (Frames v2) |
|---------|----------------------|-------------------|----------------------|
| **Rendering** | Image + buttons | JSON UI tree (16 components) | Full web app (HTML/CSS/JS) |
| **Where** | In-feed embed | In-feed embed | Full-screen modal |
| **Code execution** | None (server-driven) | None (server-driven) | Full browser runtime |
| **Interaction** | Up to 4 buttons | Buttons, sliders, inputs, toggles, switches | Any web interaction |
| **Authentication** | Frame signatures | JFS (JSON Farcaster Signatures) | Quick Auth (JWT) |
| **State** | Stateless | Persistent KV store | Full web state |
| **Wallet** | Limited (tx action) | `view_token`, `send_token`, `swap_token` | Full EIP-1193 provider |
| **Notifications** | No | No | Yes (webhooks) |
| **SDK** | `@farcaster/frames` | `@farcaster/snap-hono` | `@farcaster/miniapp-sdk` |
| **Use case** | Simple polls, mints | Rich in-feed interactions | Full applications |

**Key insight:** Snaps and Mini Apps are complementary. Snaps live in the feed for quick interactions. Mini Apps open full-screen for complex workflows. Snaps can launch Mini Apps via the `open_mini_app` action.

## Technical Spec

### Response Structure

```json
{
  "version": "1.0",
  "theme": { "accent": "purple" },
  "effects": ["confetti"],
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": {},
        "children": ["header", "guess", "submit"]
      },
      "header": {
        "type": "item",
        "props": { "title": "Daily Wordle", "description": "Attempt 3 of 6" }
      },
      "guess": {
        "type": "input",
        "props": { "name": "word", "label": "Your guess", "maxLength": 5 }
      },
      "submit": {
        "type": "button",
        "props": { "label": "Submit", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://wordle.example.com/guess" }
          }
        }
      }
    }
  }
}
```

### 16 UI Components

| # | Component | Category | Description |
|---|-----------|----------|-------------|
| 1 | `badge` | Display | Inline label with color and icon |
| 2 | `button` | Display | Action button with variants and icon |
| 3 | `icon` | Display | Standalone icon from curated set |
| 4 | `image` | Display | HTTPS image with aspect ratio |
| 5 | `item` | Display | Content row with actions slot |
| 6 | `item_group` | Container | Groups items into a styled list |
| 7 | `progress` | Display | Horizontal progress bar |
| 8 | `separator` | Display | Visual divider |
| 9 | `stack` | Container | Vertical or horizontal layout |
| 10 | `text` | Display | Text block with size and weight |
| 11 | `bar_chart` | Data | Horizontal bar chart with labeled bars |
| 12 | `cell_grid` | Data | Colored cell grid, optionally interactive |
| 13 | `input` | Field | Text or number input |
| 14 | `slider` | Field | Numeric range slider |
| 15 | `switch` | Field | Boolean toggle |
| 16 | `toggle_group` | Field | Single or multi-select choice group |

### 9 Action Types

| # | Action | Description |
|---|--------|-------------|
| 1 | `submit` | POST to server, get next page (primary interaction) |
| 2 | `open_url` | Open URL in browser |
| 3 | `open_mini_app` | Launch a Mini App (bridge to full app!) |
| 4 | `view_cast` | Navigate to a cast by hash |
| 5 | `view_profile` | Navigate to a profile by FID |
| 6 | `compose_cast` | Open cast composer with pre-filled content |
| 7 | `view_token` | View token in wallet (CAIP-19) |
| 8 | `send_token` | Open send token flow |
| 9 | `swap_token` | Open swap token flow |

### POST Payload (on submit)

JFS-signed envelope containing:

| Field | Type | Description |
|-------|------|-------------|
| `fid` | number | Farcaster user ID |
| `inputs` | Record<string, value> | Field values keyed by component `name` |
| `button_index` | number | Button index (0-based) |
| `timestamp` | number | Unix timestamp in seconds |

### Content Negotiation

The snap media type is `application/vnd.farcaster.snap+json`. A single URL can serve both snap JSON and HTML:

- Client sends `Accept: application/vnd.farcaster.snap+json` -> server returns snap JSON
- Browser sends normal request -> server returns HTML

This means ZAO OS pages could serve snap versions alongside existing web pages.

## How to Build a Snap

### Stack

- **Language:** TypeScript
- **Framework:** Hono (via `@farcaster/snap-hono`)
- **Core package:** `@farcaster/snap` (schemas, validation, JFS verification)
- **Testing:** Emulator at `farcaster.xyz` (enter snap URL, auto-signs messages)
- **Deployment:** Any HTTP host (Vercel recommended)

### Quick Start

```bash
# Copy the template from farcasterxyz/snap/template/
pnpm install
# Edit src/index.ts
pnpm dev          # localhost:3003
# Test at farcaster.xyz emulator
```

### AI-Assisted Generation

The docs include a SKILL.md file at `docs.farcaster.xyz/snap/SKILL.md` that Claude Code can use:

```
use https://docs.farcaster.xyz/snap/SKILL.md to build me an app that [description]
```

## ZAO OS Integration Opportunities

### 1. Now Playing Snap (HIGH PRIORITY)

A snap that shows what's currently playing on ZAO Radio in the feed:

- Display: artist name, track title, album art, listener count
- Actions: `open_mini_app` to launch ZAO OS player, `compose_cast` to share
- Components: `image`, `item`, `badge` (live indicator), `button`

### 2. Quick Respect Tip Snap

Let members tip Respect to artists directly in the feed:

- Display: artist info, current Respect score
- Input: `slider` for tip amount
- Actions: `submit` to process tip, `view_profile` to see artist

### 3. Governance Poll Snap

Embed community proposals as interactive snaps:

- Display: proposal text, current vote counts (`bar_chart`)
- Input: `toggle_group` for vote options
- Actions: `submit` to cast vote
- Effects: `confetti` on successful vote

### 4. Song of the Day Snap

Daily featured track with voting:

- Display: track info, `progress` bar for votes
- Input: `toggle_group` (thumbs up/down)
- Actions: `submit` vote, `open_mini_app` to listen

### 5. Member Spotlight Snap

Highlight community members:

- Display: member info, `badge` for role, Respect score
- Actions: `view_profile`, `compose_cast` to welcome

### 6. WaveWarZ Battle Snap

Music battles in the feed:

- Display: two tracks side by side, `bar_chart` for votes
- Input: `toggle_group` to pick winner
- Actions: `submit` vote, `open_mini_app` for full battle

## Implementation Plan

### Phase 1: Infrastructure (1 day)

1. Add `@farcaster/snap` and `@farcaster/snap-hono` to ZAO OS
2. Create `/api/snap/` route structure
3. Set up JFS verification using existing Farcaster auth

### Phase 2: First Snap - Now Playing (1-2 days)

1. Build `/api/snap/now-playing/route.ts`
2. Serve snap JSON via content negotiation
3. Connect to existing radio/player state
4. Test with emulator

### Phase 3: Governance Poll Snap (1-2 days)

1. Build `/api/snap/poll/[id]/route.ts`
2. Connect to existing proposal system
3. Handle vote submission with JFS auth

### Phase 4: Content Negotiation on Existing Pages (1 day)

1. Add snap responses to existing ZAO OS pages
2. When a ZAO OS link is shared in a cast, it renders as an interactive snap
3. Snap buttons bridge to the full Mini App

## ZAO OS File Paths

| What | Path |
|------|------|
| Existing Mini App research | `research/farcaster/173-farcaster-miniapps-integration/` |
| Existing Mini App docs research | `research/farcaster/250-farcaster-miniapps-llms-txt-2026/` |
| Neynar acquisition context | `research/farcaster/260-neynar-acquires-farcaster/` |
| Farcaster ecosystem overview | `research/farcaster/073-farcaster-ecosystem-2026-update/` |
| Music player provider | `src/providers/audio/PlayerProvider.tsx` |
| Now playing hook | `src/hooks/useNowPlaying.ts` |
| Governance proposals | `src/components/governance/` |
| Community config | `community.config.ts` |
| Existing API routes | `src/app/api/` |
| Farcaster auth/neynar | `src/lib/farcaster/neynar.ts` |
| Respect/curation | `src/lib/music/curationWeight.ts` |

## Sources

- [Farcaster Snaps Documentation](https://docs.farcaster.xyz/snap)
- [farcasterxyz/snap GitHub Repository](https://github.com/farcasterxyz/snap) (created March 27, 2026; 300 commits, 56 releases as of April 7, 2026)
- [Farcaster Snap Spec Overview](https://docs.farcaster.xyz/snap/spec-overview)
- [Farcaster Snap Elements Reference](https://docs.farcaster.xyz/snap/elements)
- [Farcaster Snap Actions Reference](https://docs.farcaster.xyz/snap/actions)
- [Farcaster Snap Building Guide](https://docs.farcaster.xyz/snap/building)
- [Neynar Acquires Farcaster (Jan 2026)](https://neynar.com/blog/neynar-is-acquiring-farcaster)
- [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification)
- Original cast: `https://farcaster.xyz/farcaster/0x94ede65c`
