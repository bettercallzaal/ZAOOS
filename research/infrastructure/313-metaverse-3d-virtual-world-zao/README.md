# 313 - Metaverse & 3D Virtual World for ZAO OS

> **Status:** Research complete
> **Date:** 2026-04-10
> **Goal:** Evaluate frameworks, platforms, and architecture for building a 3D metaverse/virtual store experience for The ZAO music community, inspired by Lacoste's Emperia-powered virtual store

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Rendering framework** | USE React Three Fiber (R3F) + Drei - declarative, React-native, 79KB initial bundle, Lighthouse 100, works with Next.js App Router via `react-three-next` starter |
| **Next.js integration** | USE `pmndrs/react-three-next` starter - persistent WebGL canvas across routes, tunnel-rat portaling, scissored viewports, Tailwind CSS, ~100ms TTL |
| **Physics** | USE Rapier via `@react-three/rapier` - WASM-based, 200KB, works in browser, MIT licensed. PhysX is heavier and GPL-bound via Hyperfy |
| **Multiplayer/networking** | USE Colyseus (MIT, Node.js, WebSocket, binary delta sync) for state. USE LiveKit for spatial audio/voice (already in ZAO's stack for Spaces) |
| **3D asset format** | USE glTF/GLB exclusively - web standard, compressed with Draco/KTX2, supported by all tools |
| **Avatar system** | USE VRM format (Ready Player Me compatible) - standardized humanoid avatars, open spec, supported by R3F ecosystem |
| **Hosting approach** | SELF-HOST on existing Vercel + Supabase infra. No Emperia/SaaS dependency. Full control, zero recurring platform fees |
| **Build vs buy** | BUILD custom with R3F stack. Emperia is closed-source enterprise SaaS (custom pricing, $$$). Hyperfy is GPL-3.0 alpha. Custom R3F gives MIT flexibility and fits ZAO's Next.js stack perfectly |
| **Token gating** | REUSE existing gate system in `src/lib/gates/` - already checks NFT ownership, Respect scores, and channel membership. Extend to gate 3D rooms |
| **Metaverse scope** | START with a single 3D virtual HQ (not a full metaverse platform). A navigable space with music playback, NFT gallery, member presence, and token-gated rooms. Scale later |

---

## Comparison of Approaches

### Option A: SaaS Platform (Emperia, Obsess, etc.)

| Aspect | Details |
|--------|---------|
| **How it works** | Emperia converts Unreal Engine models to web-playable experiences. Powered by proprietary WebGL engine. Clients include Lacoste, Ralph Lauren, Dior |
| **Pros** | Production-proven, 8K textures, unlimited polycount, Unreal Engine pipeline, analytics dashboard, e-commerce integrations |
| **Cons** | Closed source, custom enterprise pricing (estimated $50K-200K+/year), no self-hosting, no web3 native support, no music features, no community/social layer |
| **Fit for ZAO** | SKIP - way too expensive for a 188-member community, no web3 integration, vendor lock-in, no music player or social features |

### Option B: Open-Source Metaverse Engine (Hyperfy, Webaverse, etc.)

| Platform | Stars | License | Status | Key Tech | Music/Audio | Self-Host |
|----------|-------|---------|--------|----------|-------------|-----------|
| **Hyperfy** | 281 | GPL-3.0 | Alpha (last commit Dec 2024) | Three.js + PhysX | Spatial audio (basic) | Yes (Node 22+) |
| **Webaverse** | ~500 | MIT | Inactive | Custom engine | None | Yes (Node 17+) |
| **Ethereal/iR Engine** | 709 | CPAL | Archived Aug 2024, moved to ir-engine | Three.js + Rapier | WebRTC voice | Yes (complex: MariaDB + Redis + Docker) |
| **Third Room** | ~200 | Apache-2.0 | Experimental | Three.js + Matrix protocol | Spatial audio via Matrix | Yes (Matrix homeserver) |
| **Mozilla Hubs** | 2.5K | MPL-2.0 | Sunset May 2024, donated to Hubs Foundation | Three.js + A-Frame | Spatial audio (mature) | Yes (via Hubs Foundation) |

**Verdict:** SKIP full metaverse engines - all are either dead/dying (Hubs, Webaverse, Ethereal), GPL-viral (Hyperfy), or too heavy for ZAO's needs. They solve for "build an entire metaverse" when ZAO needs "add a 3D experience to an existing Next.js app."

### Option C: Custom Build with React Three Fiber (RECOMMENDED)

| Aspect | Details |
|--------|---------|
| **How it works** | R3F renders Three.js scenes as React components inside Next.js pages. Drei provides 100+ helper components. Rapier handles physics. Colyseus syncs multiplayer state |
| **Pros** | MIT licensed, fits ZAO's React/Next.js stack perfectly, 79KB bundle, Lighthouse 100, huge ecosystem (Drei, Rapier, postprocessing), full control, no vendor lock-in |
| **Cons** | Requires 3D modeling skills (Blender), more dev work than SaaS, need to build multiplayer from scratch |
| **Fit for ZAO** | BEST FIT - integrates directly into existing App Router, reuses auth/gates/player, ships incrementally |

---

## Comparison of 3D Web Frameworks

| Framework | Bundle Size | React Integration | Learning Curve | WebGPU | Ecosystem | Best For |
|-----------|-------------|-------------------|----------------|--------|-----------|----------|
| **Three.js (raw)** | ~150KB | Manual | Steep (3D math required) | Yes (r168+) | Massive | Maximum control, custom engines |
| **React Three Fiber** | ~79KB (with Three.js) | Native (React renderer) | Moderate (React devs ramp fast) | Via Three.js | Drei (100+ helpers), Rapier, Leva, Zustand | React/Next.js apps, declarative 3D |
| **A-Frame** | ~200KB | Limited (HTML-based) | Easy (HTML tags) | No | Small | Quick prototypes, VR demos |
| **Babylon.js** | ~300KB | Wrapper libs only | Moderate | Yes | Medium | Game-like experiences, heavy scenes |
| **PlayCanvas** | ~200KB | None | Moderate | Yes | Small | Games, real-time 3D |

**Winner: React Three Fiber** - ZAO OS is already React 19 + Next.js 16. R3F is the only framework that integrates as a native React renderer. No wrapper, no bridge, no separate build system.

---

## ZAO OS Integration

### Architecture

```
src/
├── app/(auth)/metaverse/             # New: 3D virtual world routes
│   ├── page.tsx                       # Lobby / entry point
│   ├── hq/page.tsx                    # ZAO HQ virtual space
│   ├── gallery/page.tsx               # NFT gallery
│   └── stage/page.tsx                 # Virtual concert venue
├── components/metaverse/              # New: 3D components
│   ├── World.tsx                      # Main R3F canvas + scene
│   ├── Avatar.tsx                     # VRM avatar renderer
│   ├── Room.tsx                       # Room/environment loader
│   ├── MusicPlayer3D.tsx              # Spatial music playback
│   ├── NFTFrame.tsx                   # 3D NFT display frame
│   ├── Portal.tsx                     # Room-to-room transitions
│   ├── Presence.tsx                   # Other members' avatars
│   └── controls/
│       ├── FirstPerson.tsx            # WASD + mouse look
│       └── MobileTouch.tsx            # Touch joystick controls
├── lib/metaverse/                     # New: 3D utilities
│   ├── assetLoader.ts                 # GLB/KTX2 loading + caching
│   ├── spatialAudio.ts                # Web Audio API positional audio
│   └── multiplayerClient.ts           # Colyseus room management
└── app/api/metaverse/                 # New: API routes
    ├── rooms/route.ts                 # Room state CRUD
    └── presence/route.ts              # Who's online + positions
```

### Connecting to Existing Systems

| Existing System | File | How It Connects to Metaverse |
|-----------------|------|------------------------------|
| **Auth/Session** | `src/lib/auth/session.ts` | Same iron-session auth - enter metaverse only if authenticated |
| **Token gates** | `src/lib/gates/` | Gate VIP rooms by NFT ownership, Respect score, or channel membership |
| **Music player** | `src/providers/audio/PlayerProvider.tsx` | Extend to spatial audio - music gets louder near virtual speakers/stage |
| **NFT data** | `src/app/api/music/wallet/route.ts` | Display member's NFTs on walls in their personal gallery room |
| **Respect scores** | `src/lib/respect/leaderboard.ts` | Visual indicators on avatars (glow, crown, effects) based on Respect |
| **Spaces (live audio)** | `src/app/api/stream/` | Bridge Stream.io audio into 3D venue for virtual concerts |
| **Member profiles** | Supabase `profiles` table | Avatar customization, display name, bio in 3D space |
| **Community config** | `community.config.ts` | Branding colors (navy #0a1628, gold #f5a623), nav integration |

### Key Dependencies to Add

```json
{
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0",
  "@react-three/rapier": "^2.0.0",
  "@react-three/postprocessing": "^3.0.0",
  "three": "^0.172.0",
  "colyseus.js": "^0.16.0",
  "tunnel-rat": "^0.1.2",
  "@pixiv/three-vrm": "^3.0.0"
}
```

Estimated additional bundle: ~250KB gzipped (loaded only on `/metaverse` routes via `next/dynamic`).

---

## The ZAO Virtual HQ - Vision

### What Lacoste Did (and What ZAO Should Learn)

Lacoste's Emperia store (launched Dec 2022, updated summer 2023):
- Enter through a branded portal (crocodile mouth) - instant brand immersion
- 5 seasonal products in 360-degree shoppable displays
- Token-gated VIP room for UNDW3 NFT holders (via Arianee)
- Monthly loot box drops for engaged visitors
- AR digital twins of physical garments

**What ZAO should steal:**
1. **Branded entry portal** - enter through a gold ZAO arch with the 4 pillars visible
2. **Token-gated rooms** - VIP lounge for NFT holders, Respect-gated backstage
3. **Seasonal refresh** - rotate featured artists, playlists, drops monthly
4. **Loot mechanics** - daily check-in rewards, exploration achievements

**What ZAO should NOT copy:**
1. Product-focused commerce (ZAO is community + music, not retail)
2. Static single-user experience (ZAO needs multiplayer presence)
3. Passive browsing (ZAO needs interactive music, governance, social)

### Room Layout Concept

```
                    ┌─────────────┐
                    │  THE STAGE   │ ← Virtual concert venue
                    │ (Live Audio) │   Bridges to Spaces/Stream.io
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │  GALLERY   │ │  HQ   │ │  STUDIO   │
        │ NFT Art +  │ │ Lobby │ │ Listening  │
        │ Music Viz  │ │ Entry │ │ Room +     │
        └────────────┘ └───┬───┘ │ Jukebox    │
                           │     └────────────┘
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │  ARCHIVE   │ │  VIP  │ │ GOVERNANCE │
        │ ZAO History│ │Lounge │ │ Proposal   │
        │ Timeline   │ │(Gated)│ │ Hall       │
        └────────────┘ └───────┘ └────────────┘
```

### Room Descriptions

| Room | Gate | Features |
|------|------|----------|
| **HQ Lobby** | Authenticated ZAO member | Member presence, welcome board, portal to all rooms, leaderboard display |
| **The Stage** | Open to all members | Virtual concert venue, spatial audio, Stream.io bridge, audience reactions, hand raise |
| **Gallery** | Open to all members | NFT art on walls, music visualizations, artist spotlights, interactive displays |
| **Studio** | Open to all members | Shared jukebox, spatial audio (louder near speakers), playlist curation, binaural beats zone |
| **VIP Lounge** | NFT holder OR 500+ Respect | Exclusive drops, artist meetups, governance proposals preview, loot box access |
| **Governance Hall** | 100+ Respect | 3D visualization of active proposals, vote from within the space, Respect leaderboard |
| **Archive** | Open to all members | Interactive ZAO timeline (90+ fractal weeks), historical moments, founding story |

---

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- Set up R3F + Drei + Rapier in Next.js App Router
- Build a single navigable room (HQ Lobby) with first-person controls
- Load GLB environment model (design in Blender)
- Add member presence indicators (colored orbs showing who's online)
- Gate entry behind existing auth

### Phase 2: Music Integration (2 weeks)
- Spatial audio via Web Audio API PannerNode
- Connect to existing PlayerProvider for synchronized playback
- 3D jukebox component in the Studio room
- Music visualizer (audio frequency to 3D geometry via AnalyserNode)

### Phase 3: Social Layer (2 weeks)
- Colyseus multiplayer server (position sync, chat bubbles)
- VRM avatars with basic animations (idle, walk, wave)
- LiveKit spatial voice chat (reuse Spaces infrastructure)
- Emoji reactions in 3D space

### Phase 4: Content Rooms (2-3 weeks)
- NFT Gallery room (fetch from wallet, display in 3D frames)
- Governance Hall (3D proposal visualization)
- The Stage (Stream.io bridge for live virtual concerts)
- Token-gated VIP room using existing gate system

### Phase 5: Polish (1-2 weeks)
- Mobile touch controls
- Loading screen with progressive asset loading
- Performance optimization (LOD, instancing, baked lighting)
- Portal transitions between rooms (fade/warp effects)

---

## Performance Budget

| Metric | Target | How |
|--------|--------|-----|
| Initial JS | <300KB gzipped | Code-split metaverse routes, `next/dynamic` with `ssr: false` |
| First paint | <2s on 4G | Baked lightmaps, Draco-compressed GLB, KTX2 textures |
| 60fps on mobile | Yes | LOD system, instanced meshes, max 100K triangles per room |
| Memory | <200MB | Dispose textures/geometries on room exit, object pooling |
| Concurrent users | 50 per room | Colyseus room capacity, avatar LOD at distance |

---

## Reference Implementations

| Project | Stars | License | Key Pattern | URL |
|---------|-------|---------|-------------|-----|
| **react-three-next** | 2.3K | MIT | Next.js + R3F integration, persistent canvas, tunnel-rat portaling | [github.com/pmndrs/react-three-next](https://github.com/pmndrs/react-three-next) |
| **R3F.Multiplayer** | 200+ | MIT | R3F + WebSocket multiplayer template | [github.com/juniorxsound/R3F.Multiplayer](https://github.com/juniorxsound/R3F.Multiplayer) |
| **next-threejs-web-store** | 50+ | MIT | Next.js + Three.js multiuser store with seller/buyer roles | [github.com/erenokur/next-threejs-web-store](https://github.com/erenokur/next-threejs-web-store) |
| **home-3d** | 100+ | MIT | R3F virtual showroom | [github.com/jonybekov/home-3d](https://github.com/jonybekov/home-3d) |
| **livekit spatial-audio** | 100+ | Apache-2.0 | LiveKit + spatial audio in 3D space | [github.com/livekit-examples/spatial-audio](https://github.com/livekit-examples/spatial-audio) |
| **vibe-coding-starter-pack-3d-multiplayer** | New | MIT | Three.js + React + SpacetimeDB multiplayer starter | [github.com/majidmanzarpour/vibe-coding-starter-pack-3d-multiplayer](https://github.com/majidmanzarpour/vibe-coding-starter-pack-3d-multiplayer) |
| **Colyseus** | 5.5K | MIT | Node.js multiplayer framework, WebSocket, binary delta sync | [colyseus.io](https://colyseus.io/) |

### Code Pattern: R3F + Next.js App Router

From `react-three-next` - the key pattern is persistent canvas with tunnel-rat:

```tsx
// components/metaverse/World.tsx
"use client"
import { Canvas } from '@react-three/fiber'
import { View, Preload } from '@react-three/drei'

export function World({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <View.Port />
      <Preload all />
      {children}
    </Canvas>
  )
}
```

### Code Pattern: Token-Gated Room

Extending ZAO's existing gate system for 3D rooms:

```tsx
// components/metaverse/GatedRoom.tsx
"use client"
import { useAuth } from '@/hooks/useAuth'
import { checkGate } from '@/lib/gates'

export function GatedRoom({ gate, children, fallback }: {
  gate: 'nft' | 'respect-500' | 'respect-100'
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const { user } = useAuth()
  const hasAccess = checkGate(user, gate)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
```

### Code Pattern: Spatial Audio

```tsx
// lib/metaverse/spatialAudio.ts
export function createSpatialSource(
  audioContext: AudioContext,
  position: [number, number, number]
) {
  const panner = audioContext.createPanner()
  panner.panningModel = 'HRTF'
  panner.distanceModel = 'inverse'
  panner.refDistance = 1
  panner.maxDistance = 50
  panner.rolloffFactor = 1
  panner.setPosition(...position)
  return panner
}
```

---

## Oncyber & Existing 3D Gallery Platforms

| Platform | Type | Free Tier | Web3 Native | Music | Customizable | Self-Host |
|----------|------|-----------|-------------|-------|--------------|-----------|
| **Oncyber** | NFT gallery builder | Yes | Yes (ETH/SOL/MATIC) | No | Limited templates | No |
| **Spatial** | 3D social platform | Yes (25 users) | Partial | Background only | Moderate | No |
| **Mona** | Virtual world builder | Yes | Yes (ETH) | No | High (custom shaders) | No |
| **Decentraland** | Full metaverse | Yes | Yes (ETH/MANA) | Events only | High (SDK) | No (decentralized) |

**Verdict:** These are useful for inspiration but SKIP for ZAO - all are separate platforms requiring users to leave ZAO OS. The whole point is an integrated experience within the existing app.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 3D asset creation bottleneck | High | High | Use AI-assisted modeling (Meshy, Tripo3D), simple low-poly aesthetic |
| Mobile performance issues | Medium | High | Aggressive LOD, max 100K triangles, test on iPhone 12 as baseline |
| Multiplayer complexity | Medium | Medium | Start with presence only (positions), add voice/chat in Phase 3 |
| Low adoption | Medium | Medium | Make the metaverse a bonus layer, not a required path. Core features stay 2D |
| Bundle size bloat | Low | Medium | Dynamic import entire metaverse route, never load 3D libs on non-metaverse pages |

---

## AI-Assisted 3D Asset Pipeline

For a small team, 3D modeling is the biggest bottleneck. These tools accelerate asset creation:

| Tool | What It Does | Price | Quality |
|------|-------------|-------|---------|
| **Meshy** | Text/image to 3D model | Free tier (200 credits/mo) | Good for props, furniture |
| **Tripo3D** | Image to 3D mesh | Free tier (150 models/mo) | Good for objects |
| **Luma AI Genie** | Text to 3D | Free | Good for organic shapes |
| **Blender + AI addons** | Professional 3D modeling | Free (MIT) | Production quality |
| **Polycam** | Phone scan to 3D mesh | $8/mo | Great for real objects |

**Recommendation:** USE Meshy for quick props + Blender for hero assets (rooms, stages). A low-poly aesthetic (like Minecraft/Maplestory) is both performant and forgiving of AI model imperfections.

---

## Sources

- [Emperia - Lacoste Virtual Store](https://emperiavr.com/project/lacoste/)
- [Emperia Creator Tools](https://emperiavr.com/emperia-creator-tools/)
- [React Three Fiber vs Three.js 2026](https://graffersid.com/react-three-fiber-vs-three-js/)
- [Browser-Based Metaverse with Three.js + R3F + Next.js](https://www.aaronjcunningham.com/browser-based-metaverse-threejs)
- [react-three-next starter](https://github.com/pmndrs/react-three-next)
- [Hyperfy - Open Source Metaverse](https://github.com/hyperfy-xyz/hyperfy)
- [Awesome Metaverse - M3-org](https://github.com/M3-org/awesome-metaverse)
- [Colyseus Multiplayer Framework](https://colyseus.io/)
- [LiveKit Spatial Audio Tutorial](https://blog.livekit.io/tutorial-using-webrtc-react-webaudio-to-create-spatial-audio/)
- [R3F.Multiplayer Template](https://github.com/juniorxsound/R3F.Multiplayer)
- [Oncyber - 3D NFT Gallery](https://oncyber.io/)
- [Hyperfy Docs](https://docs.hyperfy.xyz/welcome/what-is-hyperfy/)
- [LiveKit Metaverse Blog](https://blog.livekit.io/real-time-audio-and-video-in-the-metaverse/)
- [Lacoste NFT Virtual Store - Ledger Insights](https://www.ledgerinsights.com/lacoste-virtual-store-nft-gated-room/)
