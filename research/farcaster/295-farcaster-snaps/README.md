---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 250, 260, 500, 505
original-query: What are Farcaster Snaps, how do they work, and how can ZAO OS integrate them? (reconstructed)
tier: STANDARD
---

# 295 - Farcaster Snaps (v2.0, April 2026)

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Snaps launched March 27, 2026 as successor to Frames v1 | Server-driven JSON UI in feed. No client-side code execution. Complements (not replaces) Mini Apps. |
| 2 | Spec now v2.0 (April 8 2026); structural validation + height limits enforced | v1 = legacy (no validation); v2 = 64 max elements, 500px default height, version-aware validation. |
| 3 | 117+ npm releases by May 2026; @farcaster/snap@2.0.3 stable | Spec moving fast but npm packages are stable. Template defaults to v1.0 for compatibility. |
| 4 | Dual SDK support: @farcaster/snap (v2.0.3) + @farcaster/snap-hono (v1.4.8) both stable | Hono middleware handles JFS verification. Can deploy anywhere (Vercel, self-hosted, Node). |
| 5 | ZAO OS should prioritize Snaps for in-feed music + governance interactions | Music voting, Respect tips, polls, artist spotlights fit Snap lightweight model. |

## Overview

Farcaster Snaps are lightweight, interactive apps embedded directly in Farcaster casts. They render in-feed as cards and respond to user input without executing client-side code. A Snap server returns JSON; the Farcaster client renders it.

Think "Frames v1 done right": server-driven like Frames v1, but with 16+ rich UI components (v2.0), multi-page flows, persistent KV state, theming, and native wallet/token actions (view_token, send_token, swap_token as of Apr 23 2026).

**Repository:** [farcasterxyz/snap](https://github.com/farcasterxyz/snap) (12 stars, 117+ releases, TypeScript 70%, actively maintained by Farcaster/Neynar team)

**Spec Status:** Beta, but stable. v1.0 (legacy) and v2.0 (current) both supported with version-aware validation.

## Findings

### Architecture

```
User sees cast with snap embed -> Client GETs snap URL (Accept: application/vnd.farcaster.snap+json)
  |
  v
Server returns SnapResponse JSON (JFS-signed POST requests)
  |
  v
Client renders UI tree (16 component types in v2.0, max 64 elements, 500px default height)
  |
  v
User interacts (buttons, sliders, toggles, inputs)
  |
  v
Client POSTs signed JFS payload to server with FID + field values
  |
  v
Server returns next SnapResponse -> Client re-renders
```

### Key Properties (v2.0 validated)

| Property | Details |
|----------|---------|
| **No client code** | Server returns JSON, client renders. No JS execution in embed. |
| **Multi-page flows** | Each submit action returns a new page; server controls navigation. |
| **Authentication** | POST requests use JSON Farcaster Signatures (JFS) with user FID + timestamp. |
| **Content negotiation** | Same URL serves snap JSON or HTML based on Accept header. |
| **Persistent state** | Key-value store available per Snap on every handler invocation. |
| **Theming** | 9 named accent colors (gray, blue, red, amber, green, teal, purple, pink, special). No custom hex. |
| **Validation (v2.0)** | MAX_ELEMENTS=64, MAX_ROOT_CHILDREN=7, MAX_CHILDREN=6, MAX_DEPTH=4, MAX_HEIGHT=500px. |
| **Graceful degradation** | If Snap fails, cast displays normally with URL as plain text. |

### Components (16 total in v2.0)

| Display (7) | Container (2) | Data (3) | Field (4) |
|---|---|---|---|
| badge, button, icon, image, item, progress, separator, text | item_group, stack | bar_chart, cell_grid | input, slider, switch, toggle_group |

### Actions (9 available)

| Primary | Navigation | Composer | Wallet |
|---|---|---|---|
| submit | open_url, open_mini_app, view_cast, view_profile | compose_cast | view_token, send_token, swap_token |

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

## Implementation

### v1.0 vs v2.0

| Aspect | v1.0 (legacy) | v2.0 (current, Apr 8 2026) |
|--------|---|---|
| **Spec** | Original March 27 2026 launch | Structural validation + versioning support |
| **Validation** | None | MAX_ELEMENTS=64, MAX_DEPTH=4, height limits |
| **Height limit** | Unlimited | 500px default, 700px with `showOverflowWarning` |
| **Template default** | Now points to v1.0 for compat | v2.0 available with explicit opt-in |
| **Breaking changes** | None | Spec versioning allows opt-in validation |

**Decision:** Use v2.0 for new ZAO Snaps (safer, validated). Template is v1.0 by default for compatibility with existing Snap builders.

### Quick Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript |
| **Framework** | Hono (lightweight web framework) |
| **Core packages** | @farcaster/snap v2.0.3, @farcaster/snap-hono v1.4.8 |
| **Validation** | JFS (JSON Farcaster Signatures) built-in |
| **Testing** | Emulator at farcaster.xyz (emulates JFS signing) |
| **Deployment** | Any HTTP host (Vercel, self-hosted, Node) |

### Example: Governance Poll Snap (v2.0)

```json
{
  "version": "2.0",
  "theme": { "accent": "purple" },
  "ui": {
    "root": "page",
    "elements": {
      "page": {
        "type": "stack",
        "props": { "gap": 16 },
        "children": ["title", "chart", "vote", "submit"]
      },
      "title": {
        "type": "item",
        "props": { "title": "Propose governance reform", "description": "Vote opens 48h" }
      },
      "chart": {
        "type": "bar_chart",
        "props": {
          "data": [
            { "label": "Yes", "value": 342, "color": "green" },
            { "label": "No", "value": 156, "color": "red" }
          ]
        }
      },
      "vote": {
        "type": "toggle_group",
        "props": { "name": "choice", "options": ["Yes", "No", "Abstain"] }
      },
      "submit": {
        "type": "button",
        "props": { "label": "Submit", "variant": "primary" },
        "on": {
          "press": {
            "action": "submit",
            "params": { "target": "https://zao.os/api/snap/poll/123/vote" }
          }
        }
      }
    }
  }
}
```

### POST Payload (signed with JFS)

```json
{
  "fid": 12345,
  "inputs": { "choice": "Yes" },
  "button_index": 0,
  "timestamp": 1714003200
}
```

Server verifies JFS signature (contains fid + message hash), then processes vote.

### Content Negotiation

Same URL can serve Snap or HTML:

- Farcaster client sends `Accept: application/vnd.farcaster.snap+json` -> server returns snap JSON
- Browser sends normal request -> server returns HTML

ZAO OS pages can serve both (e.g., `/api/snap/poll/[id]/route.ts` detects Accept header).

## ZAO OS Opportunities

| Priority | Snap | Why | Components | Next |
|---|---|---|---|---|
| **HIGH** | Now Playing | Display current radio track in feed; bridge to mini app | image, item, badge, button (open_mini_app) | Connect to `/api/now-playing` |
| **HIGH** | Governance Poll | Community vote directly in feed; results live via bar_chart | item, bar_chart, toggle_group, button (submit) | Connect to `/api/governance/polls/[id]` |
| **MEDIUM** | Respect Tip | Quick tip widget; slider for amount | item, slider, button (submit) | Integrate with Supabase respect ledger |
| **MEDIUM** | Artist Spotlight | Highlight member; link to profile | item, badge, button (view_profile) | Pull from community roster |
| **FUTURE** | WaveWarZ Battle | Music voting in feed | item, bar_chart, toggle_group | Integrate when WaveWarZ is live |

## Building a Snap (Quick Path)

### Setup
```bash
# Clone template from farcasterxyz/snap/template/
git clone https://github.com/farcasterxyz/snap.git
cd snap/template && pnpm install && pnpm dev
# Opens at localhost:3003
```

### Testing
- Paste your localhost URL into emulator at farcaster.xyz
- Emulator auto-signs payloads (no real private key needed)
- Full JFS signing available in-app

### Deployment
- Any HTTP host (Vercel, self-hosted, Node)
- Same codebase works everywhere
- Content negotiation (Accept header) allows dual HTML + JSON serving

### AI-Assisted Build
See [docs.farcaster.xyz/snap/SKILL.md](https://docs.farcaster.xyz/snap/SKILL.md) for Claude Code agent build prompts.

## ZAO Integration Checklist

| Phase | Task | Status |
|---|---|---|
| **Phase 1** | Add @farcaster/snap + @farcaster/snap-hono to ZAO OS | TO DO |
| **Phase 1** | Create `/api/snap/` route structure with JFS verification | TO DO |
| **Phase 2** | Build Now Playing Snap | TO DO |
| **Phase 2** | Connect Snap to existing radio state | TO DO |
| **Phase 2** | Test with emulator | TO DO |
| **Phase 3** | Build Governance Poll Snap | TO DO |
| **Phase 3** | Add content negotiation to existing ZAO OS pages | TO DO |
| **Phase 4** | Ship first Snap to production | TO DO |

## Sources

- [Farcaster Snaps GitHub (farcasterxyz/snap)](https://github.com/farcasterxyz/snap) [FULL - 117+ releases, stable]
- [Farcaster Snaps Documentation](https://docs.farcaster.xyz/snap) [FULL - v2.0 spec]
- [Snaps v2.0 structural constraints (PR #95, Apr 8 2026)](https://github.com/farcasterxyz/snap/pull/95) [FULL - validation details]
- [Snap v2.1.1 (released Apr 23 2026)](https://registry.npmjs.org/@farcaster/snap) [FULL - latest npm release]
- [Snap Hono middleware (v1.4.8)](https://www.npmjs.com/package/@farcaster/snap-hono) [FULL - JFS handler]
- [Neynar acquires Farcaster (Jan 21 2026)](https://neynar.com/blog/neynar-is-acquiring-farcaster) [FULL - context]
- [Farcaster Mini Apps SDK](https://miniapps.farcaster.xyz/docs/specification) [FULL - for open_mini_app action]

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add @farcaster/snap v2.0.3 to ZAO OS dependencies | Claude | Code | 2026-05-25 |
| Build Now Playing Snap prototype at /api/snap/now-playing | Claude | Code | 2026-05-27 |
| Test Snap with Farcaster emulator | Claude | QA | 2026-05-27 |
| Review Snaps documentation for v2.0 changes (height limits, validation) | Zaal | Review | 2026-05-25 |
