# 319 - Lightweight 3D Portal Hub for ZAO OS

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Design an ultra-lightweight 3D portal hub that works on the worst Android phones, routes users to different ZAO domains via spatial navigation, and uses an AI concierge for guided onboarding

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **3D Engine** | DO NOT USE React Three Fiber, Three.js, or Babylon.js. USE CSS 3D transforms (0 KB) + Google model-viewer (180 KB lazy-loaded) for worst-Android compatibility |
| **Architecture** | Build a public 3D link-in-bio / portal hub - NOT a metaverse. Click-to-navigate, not first-person walking |
| **Portal targets** | 18+ existing ZAO domains from `community.config.ts` become clickable portal doors |
| **Token gating** | Reuse existing `src/lib/gates/allowlist.ts` + `src/lib/spaces/tokenGate.ts` - no new gating code needed |
| **AI concierge** | Extend existing `/assistant` page (`src/app/(auth)/assistant/page.tsx`) as a floating chat widget that recommends portals |
| **Fallback** | 2D card grid for the oldest 3% of phones (no WebGL). Progressive enhancement, not graceful degradation |
| **Supersedes** | Doc 313's R3F + Rapier + Colyseus stack (~500 KB+) is WRONG for this use case. This doc replaces it |

## Why Doc 313's Stack Is Wrong

Doc 313 recommended React Three Fiber + Drei + Rapier physics + Colyseus multiplayer. That's a gaming engine stack:

| Component | Bundle Size | Why It's Wrong |
|-----------|-------------|----------------|
| React Three Fiber | 80-155 KB gzipped | Requires WebGL, too heavy for worst Androids |
| Rapier (physics) | 200 KB WASM | Portal hub has no physics - you click doors, not walk into them |
| Colyseus (multiplayer) | 50 KB + server | No multiplayer needed - this is a storefront, not a hangout |
| VRM avatars | 500 KB+ per model | No avatars needed in a click-to-navigate hub |
| **Total** | **800 KB+ before assets** | **Unusable on $50 Android phones** |

The new stack:

| Component | Bundle Size | Purpose |
|-----------|-------------|---------|
| CSS 3D transforms | 0 KB (native) | Room perspective, portal doors, parallax depth |
| Google model-viewer | 180 KB (lazy) | Optional 3D objects inside portals, loaded on demand |
| Existing Next.js | 0 KB additional | Already in the app |
| **Total** | **0-180 KB** | **Works on every phone** |

## Comparison of Approaches

| Approach | Bundle | WebGL Required? | Worst Android | Load on 3G | Spatial Feel | Build Time |
|----------|--------|-----------------|---------------|------------|--------------|------------|
| **CSS 3D + model-viewer (CHOSEN)** | 0-180 KB | No (CSS) / Yes with fallback (model-viewer) | Works | 1-3s | 8/10 - perspective rooms, parallax, rotating panels | 1-2 weeks |
| React Three Fiber minimal | 80-100 KB | Yes | Crashes on <2GB RAM | 4-8s | 10/10 - full 3D | 3-4 weeks |
| Spline embed | 200-500 KB | Yes | Laggy | 5-10s | 9/10 - designed scenes | 2 weeks + Spline subscription |
| Pure 2D with animations | 0 KB | No | Works | <1s | 4/10 - flat cards | 1 week |
| Babylon.js | 300+ KB | Yes (WebGL 2.0) | Broken | 8-15s | 10/10 - game engine | 4-6 weeks |
| iframe-based rooms | 0 KB | No | Works | Variable | 3/10 - feels hacky | 1 week |

## The Product: 3D Link-in-Bio Portal Hub

### What It Is

A public landing page at `zaoos.com/portal` (or a custom domain like `portal.zaoos.com`) that looks like a spatial room with doors. Each door is a portal to a different ZAO property. An AI concierge (ZOE) floats in the corner and asks "What are you into?" then highlights the right portal.

**Nobody has shipped a 3D spatial link-in-bio yet.** The link-in-bio space (Linktree, Beacons, Bio Link) is all 2D cards. This would be genuinely novel.

### What It Is NOT

- NOT a metaverse (no multiplayer, no avatars, no physics)
- NOT a game (no walking, no WASD controls)
- NOT a social space (no chat, no presence)
- NOT heavy (no WebGL requirement for base experience)

### Visual Concept

```
┌─────────────────────────────────────────────────────────────┐
│                    ZAO PORTAL HUB                            │
│                                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │  MUSIC  │  │  SOCIAL │  │  BUILD  │  │  EARN   │       │
│   │         │  │         │  │         │  │         │       │
│   │ ♫ ♫ ♫  │  │ 💬 🗣️  │  │ 🛠️ 🔧  │  │ 💰 🏆  │       │
│   │         │  │         │  │         │  │         │       │
│   │fishbowlz│  │zaoos.com│  │  zoe.   │  │incented │       │
│   │ audius  │  │discord  │  │zaoos.com│  │clanker  │       │
│   │wavewarz │  │telegram │  │pixels.  │  │empbldr  │       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
│   ┌─────────┐  ┌─────────┐                                   │
│   │GOVERN   │  │  VIP 🔒 │  ← token-gated                   │
│   │         │  │         │                                   │
│   │ zounz   │  │ members │                                   │
│   │snapshot │  │  only   │                                   │
│   └─────────┘  └─────────┘       [🤖 ZOE: "What are you     │
│                                        into? Music, social,  │
│                                        or building?"]        │
└─────────────────────────────────────────────────────────────┘
```

In CSS 3D, these panels have `perspective`, `rotateY`, parallax depth on scroll/mouse, and smooth hover animations. They FEEL spatial without requiring WebGL.

## Portal Categories (from community.config.ts)

18+ existing domains grouped into portal categories:

### 1. MUSIC Portal (public)
| Destination | URL | What It Is |
|-------------|-----|------------|
| FISHBOWLZ | fishbowlz.com | Music battles, NFT jukebox |
| Audius | audius.co (3 playlists) | Music streaming |
| WaveWarz | wavewarz.com | Music competition |
| SongJam | songjam.space/zabal | Live audio spaces |

### 2. SOCIAL Portal (public)
| Destination | URL | What It Is |
|-------------|-----|------------|
| ZAO OS | zaoos.com | Main community app |
| Discord | discord.thezao.com | Chat server |
| Telegram | t.me/thezao | Group chat |
| Sopha | sopha.social | Curated feed |

### 3. BUILD Portal (public)
| Destination | URL | What It Is |
|-------------|-----|------------|
| ZOE Dashboard | zoe.zaoos.com | Agent dashboard |
| Pixel Agents | pixels.zaoos.com | Pixel agent office |
| Paperclip | paperclip.zaoos.com | Paperclip agent |

### 4. EARN Portal (public)
| Destination | URL | What It Is |
|-------------|-----|------------|
| Incented | incented.co/organizations/zabal | Bounties |
| Clanker | clanker.world | $ZABAL token |
| EmpireBuilder | empirebuilder.world | Token staking |

### 5. GOVERN Portal (public)
| Destination | URL | What It Is |
|-------------|-----|------------|
| ZOUNZ DAO | nouns.build/dao/base/0xCB80... | On-chain proposals |
| Snapshot | hub.snapshot.org | Governance polls |

### 6. VIP Portal (TOKEN-GATED)
| Destination | URL | Gate |
|-------------|-----|------|
| Members Area | zaoos.com/home | Allowlist check via `src/lib/gates/allowlist.ts` |
| Proof of Meet | app.magnetiq.xyz | Allowlist |

## CSS 3D Technical Implementation

### How CSS 3D Creates Spatial Rooms

CSS 3D transforms create perspective depth without any JavaScript library:

```css
.portal-hub {
  perspective: 1200px;
  perspective-origin: 50% 40%;
}

.portal-door {
  transform: rotateY(-15deg) translateZ(50px);
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.portal-door:hover {
  transform: rotateY(0deg) translateZ(100px) scale(1.05);
  box-shadow: 0 0 40px rgba(245, 166, 35, 0.4); /* gold glow */
}

.portal-door.locked {
  filter: brightness(0.6);
  /* lock icon overlay */
}

.portal-door.locked:hover {
  /* show "Connect Wallet" tooltip instead of opening */
}
```

### Parallax Depth on Scroll/Touch

```css
/* Layered depth effect - no JS needed */
.hub-background { transform: translateZ(-200px) scale(2); }
.hub-midground  { transform: translateZ(-100px) scale(1.5); }
.hub-foreground { transform: translateZ(0); }

/* Or with minimal JS for gyroscope on mobile */
```

### Portal Door Component (React)

```tsx
'use client';

import { useRouter } from 'next/navigation';

interface PortalDoorProps {
  title: string;
  destinations: { name: string; url: string }[];
  icon: string;
  locked?: boolean;
  gateCheck?: () => Promise<boolean>;
}

export function PortalDoor({ title, destinations, icon, locked, gateCheck }: PortalDoorProps) {
  const router = useRouter();

  const handleEnter = async () => {
    if (locked && gateCheck) {
      const allowed = await gateCheck();
      if (!allowed) {
        // Show wallet connect or allowlist message
        return;
      }
    }
    // If single destination, go directly. If multiple, expand to show list
    if (destinations.length === 1) {
      window.open(destinations[0].url, '_blank');
    } else {
      // Expand door to show sub-portals
    }
  };

  return (
    <button
      onClick={handleEnter}
      className="portal-door group relative"
      style={{ transform: 'rotateY(-8deg) translateZ(20px)' }}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="text-gold font-bold">{title}</h3>
      {locked && <span className="absolute top-2 right-2">🔒</span>}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {destinations.map(d => (
          <span key={d.name} className="text-xs text-gray-400 block">{d.name}</span>
        ))}
      </div>
    </button>
  );
}
```

### Progressive Enhancement Tiers

```
Tier 1 (ALL devices, 0 KB):
  CSS 3D perspective room, parallax, hover transforms
  Works without WebGL, without JavaScript even (CSS-only base)

Tier 2 (97% of devices, +180 KB lazy):
  model-viewer for optional 3D decorations inside portal frames
  Poster image fallback if WebGL unavailable
  Loaded ONLY when user taps a portal, not on page load

Tier 3 (3% oldest phones):
  Falls back to 2D card grid layout
  Detect with: if (!('CSS' in window && CSS.supports('perspective', '1px')))
  Still fully functional, just flat
```

## AI Concierge (ZOE Integration)

### Existing Infrastructure

ZAO already has an AI assistant:
- **Page:** `src/app/(auth)/assistant/page.tsx`
- **API:** `src/app/api/chat/assistant/route.ts`
- **Minimax LLM:** `src/app/api/chat/minimax/route.ts`
- **Memory:** `src/lib/memory-recall.ts`

### Portal Concierge Design

A floating chat bubble (not a 3D NPC - too heavy) that:

1. **Appears after 3 seconds** on the portal page
2. **Asks one question:** "What are you into? Music, social, or building?"
3. **Highlights the right portal** by adding a CSS glow class to the recommended door
4. **Remembers returning visitors** via localStorage preference

```tsx
// Concierge flow
const ROUTING_MAP = {
  music: ['MUSIC'],
  social: ['SOCIAL'],
  building: ['BUILD'],
  earning: ['EARN'],
  governance: ['GOVERN'],
  'all of it': ['VIP'], // token-gated - members get everything
};
```

The concierge does NOT need the full LLM assistant. It's a simple keyword-matching router with a chat UI skin. Save the Opus/Minimax calls for inside the app.

### Smart Routing (Agent-Powered)

For returning visitors or users who engage deeper with ZOE:

1. ZOE checks if user has a Farcaster FID (via Neynar)
2. If yes, checks their casts for music/governance/social signals
3. Recommends specific portals based on their activity
4. If they're on the allowlist, highlights VIP portal with "You have access!"

## Token-Gated Portal UX

Based on Lacoste's Emperia pattern (the gold standard):

1. **All portals visible** - locked ones show a subtle lock icon + dimmed
2. **Clicking a locked portal** triggers wallet connect (Wagmi, already in ZAO)
3. **On-chain check** via existing `src/lib/spaces/tokenGate.ts` (ERC-20/721/1155)
4. **If passes:** CSS unlock animation (door glows gold, swings open), then redirect
5. **If fails:** "You need [X token] to enter. Get it at [link]."

No new gating code needed. The existing 3-layer system (allowlist + Spaces token gate + FISHBOWLZ token gate) covers every scenario.

## ZAO OS Integration - File Map

### New Files (~10 files, not 30)

```
src/app/portal/
  page.tsx                 # Main portal hub page (public, no auth required)
  layout.tsx               # Minimal layout (no sidebar, no auth check)

src/components/portal/
  PortalHub.tsx            # Main 3D perspective room container
  PortalDoor.tsx           # Individual portal door component
  PortalConcierge.tsx      # ZOE chat bubble for routing
  PortalGate.tsx           # Token-gate check wrapper
  portal.css               # CSS 3D transforms, parallax, animations

src/lib/portal/
  destinations.ts          # Portal config (pulled from community.config.ts)
  routing.ts               # Concierge routing logic
```

### Existing Files That Connect (Zero Changes Needed)

| File | How It Connects |
|------|-----------------|
| `community.config.ts` | Source of all portal URLs - read-only |
| `src/lib/gates/allowlist.ts` | VIP portal gate check |
| `src/lib/spaces/tokenGate.ts` | Token-gated portal checks |
| `src/app/page.tsx` | Add "Enter Portal" link alongside current login |
| `src/middleware.ts` | Portal route excluded from auth (public page) |

### Minimal Changes to Existing Files

1. **`src/app/page.tsx`** - Add one link: "Explore the Portal" alongside "Login"
2. **`src/middleware.ts`** - Add `/portal` to public routes list
3. **`community.config.ts`** - Add `portals` config section (optional, can hardcode first)

## Performance Budget

| Metric | Target | How |
|--------|--------|-----|
| First paint | <1.5s on 3G | CSS-only initial render, no JS blocking |
| Interactive | <2.5s on 3G | Minimal JS for click handlers |
| Bundle | <50 KB JS | No 3D libraries in critical path |
| model-viewer | 180 KB lazy | Only loads if user interacts with enhanced portal |
| Total page weight | <300 KB | Including CSS, JS, images (use WebP thumbnails) |
| Works without JS | Yes | CSS 3D transforms are CSS-only, links work as `<a>` tags |

### Device Compatibility

| Device Class | Experience | How |
|-------------|-----------|-----|
| iPhone 12+ / Pixel 5+ | Full CSS 3D + model-viewer + smooth animations | GPU compositing |
| Samsung Galaxy A series / budget 2020+ | Full CSS 3D, no model-viewer | CSS transforms hardware-accelerated |
| $50 Android (2GB RAM, 2018) | CSS 3D with reduced animations | `prefers-reduced-motion` respected |
| Oldest phones (no CSS 3D) | 2D card grid fallback | Feature detection |

## Build Plan: Ship in 1 Week

### Day 1-2: Core Portal Page
- Create `src/app/portal/page.tsx` (public, no auth)
- Build `PortalHub.tsx` with CSS 3D perspective room
- Build `PortalDoor.tsx` with hover animations
- Add all 18+ destinations grouped into 6 categories
- Wire up click handlers to open external URLs
- Add `/portal` to public routes in middleware

### Day 3: Token Gating + Polish
- Add `PortalGate.tsx` wrapping existing gate checks
- Lock icon + wallet connect flow for VIP portal
- CSS unlock animation (gold glow, door swing)
- Mobile responsive (stack portals vertically on small screens)
- Touch interactions (tap = hover state, second tap = enter)

### Day 4: AI Concierge
- Build `PortalConcierge.tsx` as floating chat bubble
- Simple keyword routing (not LLM - too heavy for a landing page)
- "What are you into?" -> highlight recommended portal
- localStorage for returning visitor preferences

### Day 5: Progressive Enhancement + Testing
- model-viewer lazy loading for portal previews (optional)
- 2D fallback for oldest devices
- Test on low-end Android (BrowserStack or real device)
- Test all 18+ portal links
- Performance audit (Lighthouse, target 90+)

### Day 6-7: Ship
- Connect to landing page (add "Explore Portal" to `src/app/page.tsx`)
- Deploy to Vercel
- Optional: custom domain (portal.zaoos.com)

## Reference Implementations

| Project | What To Steal | URL |
|---------|--------------|-----|
| Lacoste x Emperia | Token-gated room pattern, room categories, unlock animation | emperiavr.com/project/lacoste/ |
| Obsess | Multi-room hub layout, clickable hotspots, gamification | obsessar.com |
| CSS 3D Room Tutorial | CSS-only perspective room with clickable walls | dev.to/csslive/elevate-your-web-ui-high-performance-css-3d-transforms |
| r3f-page-transition | Scene transition patterns (adapt for CSS) | github.com/sokhuong-uon/r3f-page-transition |
| model-viewer | Lightweight 3D model display, poster fallback | modelviewer.dev |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| CSS 3D doesn't feel "3D enough" | Medium | Use strong perspective (800-1200px), parallax layers, gold glow effects. If not spatial enough, add model-viewer for key portals |
| Too many portals overwhelm users | High | Group into 6 categories, show 6 doors not 18. Sub-portals expand on click |
| Concierge feels gimmicky | Low | Keep it dead simple - one question, highlight a door. No chatbot theater |
| Mobile touch UX awkward | Medium | First tap = preview, second tap = enter. No hover-dependent interactions |
| Scope creep into metaverse | High | Hard rule: NO multiplayer, NO avatars, NO physics, NO walking. Click-to-navigate only |

## Sources

- [CSS 3D Transforms - No WebGL Required](https://dev.to/csslive/elevate-your-web-ui-high-performance-css-3d-transforms-no-webgl-required-4e93)
- [Google model-viewer](https://modelviewer.dev/) - 180 KB, MIT license, 6.8K GitHub stars
- [Lacoste x Emperia Virtual Store](https://emperiavr.com/project/lacoste/) - token-gated rooms pattern
- [Lacoste NFT-Gated Room](https://www.ledgerinsights.com/lacoste-virtual-store-nft-gated-room/)
- [Three.js Performance on Low-End Devices](https://medium.com/@coders.stop/optimizing-performance-in-three-js-rendering-smoothly-on-low-end-devices-e48d2cc516cc)
- [Web Animation Performance Tier List](https://motion.dev/magazine/web-animation-performance-tier-list)
- [Obsess Virtual Store Platform](https://beta.obsessar.com/virtual-store/)
- [Progressive Enhancement in 2025](https://dev.to/dct_technology/progressive-enhancement-in-2025-is-it-still-relevant-5mo)
