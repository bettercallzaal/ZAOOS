# 315 - 3D Metaverse Codebase Integration & Onboarding Map

> **Status:** Research complete
> **Date:** 2026-04-10
> **Goal:** Map exactly how the 3D metaverse (Doc 313) connects to every existing ZAO OS system, and design a 3D-powered onboarding experience that replaces the current text-only tutorial

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Onboarding approach** | USE a 3D guided tour as the primary onboarding path - replace the current 7-step `TutorialPanel.tsx` text modal with an interactive 3D walkthrough of the ZAO virtual HQ |
| **Quest system** | BUILD a Layer3-inspired quest system using Supabase - XP, levels, and achievements tracked in `user_quests` table, displayed as 3D badges on avatars |
| **Existing code reuse** | REUSE 90% of existing infrastructure - auth (iron-session), gates (allowlist.ts), streaks (StreakBadge), respect (leaderboard.ts), profiles (useAuth), and the onboarding funnel API all connect directly |
| **Onboarding funnel integration** | EXTEND the existing 6-stage funnel (`/api/admin/onboarding-funnel`) with 3D-specific stages: "Entered Virtual HQ", "Completed Tour", "Customized Avatar", "Joined First Room" |
| **Progressive enhancement** | USE 3D as an enhancement layer, not a replacement - every feature accessible in 3D must also work in the existing 2D UI. The metaverse is an alternate entry point, not a gate |
| **2D onboarding library** | USE Driver.js (~5KB gzipped) for 2D fallback onboarding highlights - lightest option, no React dependency, clean animations |
| **Navigation entry point** | ADD "Virtual HQ" card to `HomePage.tsx` in the "Create & Contribute" section alongside Spaces, Calls, Contribute, Library |
| **Community config** | ADD `metaverse` section to `community.config.ts` - room definitions, default spawn point, quest config, asset URLs |

---

## Comparison of Onboarding Approaches

| Approach | Current (TutorialPanel) | 3D Guided Tour | Quest Chain + 3D | Hybrid (Recommended) |
|----------|------------------------|----------------|------------------|----------------------|
| **Format** | 7-step text modal with icons | Walk through virtual HQ with tooltips | Layer3-style quest list with 3D rewards | 3D tour + quest progression + 2D fallback |
| **Engagement** | Low - users skip it | High - spatial memory, exploration | Very high - XP, rewards, competition | Highest - combines all motivators |
| **Learning** | Passive reading | Active exploration | Task-based doing | Explore + do + earn |
| **Retention signal** | None (no tracking) | Room visit tracking | Quest completion rate | Full funnel visibility |
| **Mobile support** | Full | Needs touch controls | Full (quests work in 2D too) | Full |
| **Build effort** | Already built | 3-4 weeks | 2 weeks (DB + UI) | 5-6 weeks total |
| **Accessibility** | Good (text) | Needs 2D fallback | Good (list-based) | Best (multiple paths) |

---

## Existing Codebase: What's Built and How It Connects

### Current Onboarding Flow (6 stages tracked)

The onboarding funnel at `src/app/api/admin/onboarding-funnel/route.ts` already tracks:

```
Allowlisted -> Wallet Connected -> FID Linked -> In Respect DB -> Attended Fractal -> Earned Respect
```

**Gap:** There's a massive drop between "FID Linked" and "Attended Fractal" - new members don't know what to DO after signing in. The 3D metaverse fills this gap by giving them a spatial introduction to every feature.

### File-by-File Integration Map

| Existing File | What It Does | How Metaverse Connects |
|---------------|-------------|----------------------|
| `src/app/onboard/page.tsx` | Wallet check against allowlist | ADD a "or Enter Virtual HQ" button that routes to `/metaverse` after auth |
| `src/components/chat/TutorialPanel.tsx` | 7-step text tutorial (Welcome, Signer, Channels, Music, Reactions, DMs, Shortcuts) | REPLACE with 3D tour that visits each feature's room. Keep as 2D fallback via "Skip 3D tour" |
| `src/lib/gates/allowlist.ts` | Checks FID/wallet against allowlist + users table | REUSE directly - gate metaverse entry behind same allowlist check |
| `src/app/(auth)/layout.tsx` | Auth layout with BottomNav, PersistentPlayer, GlobalSearch | ADD `<MetaverseButton />` to BottomNav for quick access. Player continues in 3D via spatial audio |
| `src/components/home/HomePage.tsx` | Hub page with Core/Create/Ecosystem nav cards | ADD "Virtual HQ" card in Create & Contribute section (between Spaces and Contribute) |
| `src/hooks/useAuth.ts` | Client-side session state (user, loading, logout) | REUSE in all 3D components - avatar name, profile pic, admin status come from here |
| `src/components/streaks/StreakBadge.tsx` | Daily login streak with flame icon | EXTEND - visiting metaverse counts as daily activity. 3D flame effect on avatar for active streaks |
| `src/lib/respect/leaderboard.ts` | On-chain Respect scores from Optimism | REUSE - Respect score determines avatar glow intensity, crown visibility, VIP room access |
| `src/app/api/admin/onboarding-funnel/route.ts` | 6-stage funnel (allowlisted -> earned respect) | EXTEND with 4 new stages: "Entered VHQ", "Completed Tour", "Customized Avatar", "Joined Room" |
| `src/components/admin/OnboardingFunnel.tsx` | Visual funnel with drop-off percentages | Auto-updates when new stages are added to the API |
| `src/providers/audio/PlayerProvider.tsx` | Music playback state, MediaSession, Wake Lock | BRIDGE to spatial audio - `PlayerProvider` feeds audio to Web Audio API PannerNode in 3D |
| `src/providers/audio/HTMLAudioProvider.tsx` | Dual audio elements with crossfade | REUSE as audio source - crossfade continues working, spatial positioning is a post-processing layer |
| `community.config.ts` | All branding, channels, contracts, nav, colors | ADD `metaverse` config section (room definitions, spawn point, quest thresholds) |
| `src/app/api/stream/` | Stream.io token generation, room CRUD | REUSE for virtual concert stage - same token auth, same room management |
| `src/lib/auth/session.ts` | iron-session config (7-day TTL, httpOnly) | REUSE - same session for 3D routes, no new auth needed |
| `src/middleware.ts` | Rate limiting, CORS | ADD `/metaverse` and `/api/metaverse/` to rate limit rules |

### Nav Integration Detail

Current `HomePage.tsx` has 3 nav sections with cards:
- **Core** (4 cards): Chat, Music, Governance, Social
- **Create & Contribute** (4 cards): Spaces, Calls, Contribute, Library
- **Ecosystem** (4 cards): Ecosystem, WaveWarZ, Respect, Members

**Add to Create & Contribute:**
```tsx
{
  label: 'Virtual HQ',
  href: '/metaverse',
  description: 'Explore the 3D world',
  icon: <GlobeIcon />, // 3D globe or building icon
}
```

This puts it alongside Spaces (live audio) and Calls (video) - all immersive experiences grouped together.

---

## The 3D Onboarding Journey

### Phase 1: Entry Portal (Replaces `/onboard/page.tsx`)

```
Current flow:
  Landing -> Wallet check -> "You're in!" -> Redirects to /home

New flow:
  Landing -> Wallet check -> "You're in!" -> Choice:
    [Enter Virtual HQ] -> /metaverse (3D tour starts)
    [Go to Dashboard]  -> /home (classic 2D experience)
```

The 3D option is presented first with an animated preview, but the 2D path is always available. First-time users see the 3D option prominently; returning users go straight to their preferred path (stored in `localStorage`).

### Phase 2: The Guided Tour (Replaces `TutorialPanel.tsx`)

The current tutorial has 7 steps as a text modal. The 3D tour maps each step to a physical room:

| Tutorial Step (Current) | 3D Room | What Happens |
|------------------------|---------|-------------|
| 1. Welcome to THE ZAO | HQ Lobby spawn point | NPC guide (ZOE avatar) greets you, explains the 4 pillars. Gold particles, ZAO arch visible |
| 2. Connect Your Signer | Signer Station (kiosk in lobby) | Interactive terminal - tap to connect signer. Visual confirmation (green glow) |
| 3. Browse Channels | Channel Board (lobby wall) | 3D panels showing #zao, #zabal, #cocconcertz, #wavewarz. Tap to preview live feed |
| 4. Share Music | Studio room | Walk to jukebox, paste a link, hear it play spatially. Music visualizer activates |
| 5. Reactions & Replies | Gallery room | See sample casts on walls, tap to react. 3D heart/recast animations |
| 6. Private Messages | DM Corner (alcove in lobby) | Glowing locked door - explains XMTP E2E encryption visually |
| 7. Keyboard Shortcuts | Info Terminal | Interactive keyboard display showing shortcuts. Tap keys to see actions |

**Tour guide: ZOE** - the AI agent already exists on the VPS. Her avatar guides new members through each room with speech bubbles. Tour is self-paced, rooms unlock sequentially, progress saves to Supabase.

### Phase 3: Quest System (New - Extends Streaks)

After the tour, ongoing quests encourage exploration:

| Quest | XP | Trigger | Tracks Via |
|-------|-----|---------|-----------|
| **Enter the HQ** | 50 | First visit to `/metaverse` | `user_quests` table |
| **Complete the Tour** | 100 | Visit all 7 tour stops | `user_quests` table |
| **Customize Your Avatar** | 75 | Upload VRM or choose preset | `user_quests` table |
| **Play a Track** | 50 | Play any song in the Studio | Existing `streaks` activity API |
| **React to a Cast** | 25 | Like/recast from 3D Gallery | Existing Neynar API |
| **Join a Space** | 100 | Enter any Spaces audio room | Existing Stream.io webhook |
| **Attend a Fractal** | 200 | Show up to Monday 6pm fractal | Existing `respect_members.fractal_count` |
| **Earn Respect** | 500 | Receive any Respect from community | Existing `respect_members.total_respect` |
| **Visit VIP Lounge** | 150 | Gate check passes (NFT or 500+ R) | Existing gate system |
| **7-Day Streak** | 300 | 7 consecutive daily logins | Existing `streaks` table |

**XP Levels:**
- Level 1: Newcomer (0 XP) - basic avatar, lobby access
- Level 2: Member (250 XP) - avatar accessories, all rooms
- Level 3: Contributor (750 XP) - avatar glow, room creation
- Level 4: OG (2000 XP) - custom avatar effects, VIP permanent access
- Level 5: Legend (5000 XP) - unique crown, leaderboard feature

**Database schema:**
```sql
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  quest_id TEXT NOT NULL,
  status TEXT DEFAULT 'locked', -- locked, available, in_progress, completed
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE TABLE user_levels (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  avatar_preset TEXT DEFAULT 'default',
  avatar_vrm_url TEXT,
  tour_completed BOOLEAN DEFAULT FALSE,
  preferred_entry TEXT DEFAULT '3d', -- '3d' or '2d'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Architecture: New Files Needed

```
src/
├── app/(auth)/metaverse/
│   ├── page.tsx                    # Entry point - loads 3D world or redirect
│   ├── layout.tsx                  # Metaverse-specific layout (no BottomNav, fullscreen canvas)
│   └── loading.tsx                 # 3D-specific loading screen with asset progress
├── components/metaverse/
│   ├── World.tsx                   # R3F Canvas + scene setup + lighting
│   ├── HQRoom.tsx                  # Lobby environment (GLB model + interactables)
│   ├── StudioRoom.tsx              # Music room with jukebox + visualizer
│   ├── GalleryRoom.tsx             # NFT gallery + cast displays
│   ├── StageRoom.tsx               # Concert venue (Stream.io bridge)
│   ├── VIPRoom.tsx                 # Token-gated lounge
│   ├── GovernanceRoom.tsx          # Proposal visualization
│   ├── ArchiveRoom.tsx             # ZAO history timeline
│   ├── Avatar.tsx                  # VRM avatar renderer + customization
│   ├── ZOEGuide.tsx                # AI guide NPC with speech bubbles
│   ├── Portal.tsx                  # Room-to-room transitions
│   ├── QuestHUD.tsx                # Heads-up display: XP, level, active quest
│   ├── QuestPanel.tsx              # Full quest list overlay
│   ├── TourOverlay.tsx             # Tour progress UI (step dots, skip button)
│   ├── Nameplate.tsx               # Floating name + Respect badge above avatars
│   ├── MusicPlayer3D.tsx           # Spatial jukebox connected to PlayerProvider
│   ├── CastFrame.tsx               # Farcaster cast rendered as 3D frame
│   ├── InteractableKiosk.tsx       # Generic interactive terminal (signer, settings)
│   └── controls/
│       ├── FirstPerson.tsx         # WASD + mouse look (desktop)
│       ├── MobileJoystick.tsx      # Virtual joystick (mobile)
│       └── Minimap.tsx             # Top-corner room overview
├── lib/metaverse/
│   ├── assetLoader.ts              # GLB/KTX2 asset loading + caching
│   ├── spatialAudio.ts             # Web Audio API positional audio bridge
│   ├── questEngine.ts              # Quest state machine + XP calculation
│   ├── tourState.ts                # Tour progress tracking
│   └── roomRegistry.ts             # Room definitions + gate requirements
├── app/api/metaverse/
│   ├── quests/route.ts             # GET quests, POST complete quest
│   ├── profile/route.ts            # GET/PUT avatar, level, preferences
│   ├── presence/route.ts           # GET who's in which room
│   └── tour/route.ts               # GET/PUT tour progress
└── hooks/
    ├── useQuests.ts                # React Query hook for quest state
    ├── useMetaversePresence.ts     # Who's online in 3D
    └── useSpatialAudio.ts          # Bridge PlayerProvider to Web Audio panner
```

### Files Modified (Not New)

| File | Change |
|------|--------|
| `community.config.ts` | Add `metaverse: { rooms: [...], defaultSpawn: 'hq', questsEnabled: true }` |
| `src/components/home/HomePage.tsx` | Add "Virtual HQ" card to createNav array |
| `src/components/chat/TutorialPanel.tsx` | Add "Try the 3D tour instead" link at top |
| `src/app/onboard/page.tsx` | Add "Enter Virtual HQ" button after successful wallet check |
| `src/app/api/admin/onboarding-funnel/route.ts` | Add 4 new stages from `user_quests` and `user_levels` tables |
| `src/middleware.ts` | Add `/api/metaverse/` rate limit rules |
| `src/app/(auth)/layout.tsx` | No change needed - metaverse gets its own layout (fullscreen, no BottomNav) |

---

## How Each Existing Feature Appears in 3D

### Music Player -> Studio Jukebox

```
Current: PersistentPlayerWithRadio at bottom of every page
3D version: Jukebox object in Studio room

Connection:
  PlayerProvider.tsx (state) -> useSpatialAudio hook -> Web Audio PannerNode
  - Song plays from jukebox position in 3D space
  - Volume increases as avatar walks closer
  - Visualizer: AnalyserNode -> frequency bars on jukebox screen
  - Queue visible as floating track cards near jukebox
  - All 9 providers (Spotify, SoundCloud, YouTube, etc.) work identically
```

### Chat -> Gallery Wall

```
Current: ChatRoom.tsx with cast feed, compose bar
3D version: Gallery room with casts as framed art on walls

Connection:
  Neynar API (same) -> CastFrame.tsx (3D renderer)
  - Recent casts from #zao channel displayed as frames
  - Tap frame to expand full cast with reactions
  - Compose via floating keyboard UI or link to /chat
  - Reactions trigger 3D particle effects (hearts float up)
```

### Spaces -> The Stage

```
Current: RoomView with participants, controls, chat
3D version: Concert venue with avatar audience

Connection:
  Stream.io SDK (same tokens) -> Stage room
  - Host appears on stage (elevated avatar position)
  - Audience avatars in seats with hand-raise queue
  - Spatial audio: voice gets louder near speaker
  - Screen share projected on virtual screen
  - Room chat as floating bubbles above avatars
```

### Governance -> Governance Hall

```
Current: FractalsClient.tsx, proposals, voting UI
3D version: Hall with proposal pillars and vote stations

Connection:
  Same APIs: /api/respect/fractal, /api/proposals/vote
  - Active proposals as glowing pillars (height = vote count)
  - Walk up to pillar, tap to read + vote
  - Respect leaderboard as trophy wall
  - Fractal schedule on calendar display
```

### Respect -> Avatar Effects

```
Current: RespectLeaderboard.tsx, numeric scores
3D version: Visual status on avatars

Connection:
  leaderboard.ts (same) -> Avatar.tsx effects
  - 0-99 Respect: default avatar
  - 100-499: subtle gold aura
  - 500-999: bright glow + small crown
  - 1000+: full crown + particle trail
  - Top 10: unique animated effects
```

### Streaks -> 3D Flame

```
Current: StreakBadge.tsx (flame icon + count in header)
3D version: Flame effect on avatar

Connection:
  /api/streaks (same) -> Avatar.tsx
  - Active streak: flame above avatar head (matches StreakBadge color)
  - 7+ day streak: larger flame
  - 30+ day streak: flame changes to gold
  - Streak at risk: flame pulses (matches current animate-pulse)
```

### Members Directory -> Presence Indicators

```
Current: MembersDirectoryClient.tsx (grid of profiles)
3D version: Avatars walking around rooms

Connection:
  useAuth + Colyseus -> Presence system
  - See who's in which room
  - Tap avatar to see profile card
  - Online members shown as lit avatars, offline as grey silhouettes on pedestals
```

---

## Onboarding Funnel: Before vs After

### Current Funnel (from `/api/admin/onboarding-funnel`)

```
Allowlisted (188) -> Wallet Connected (?) -> FID Linked (?) -> Respect DB (?) -> Attended Fractal (?) -> Earned Respect (?)
                                                    ^
                                                    |
                                             HUGE DROP-OFF HERE
                                     (members don't know what to do next)
```

### New Funnel (with 3D + Quests)

```
Allowlisted (188)
  -> Wallet Connected
    -> FID Linked
      -> Entered Virtual HQ         ← NEW: immediate next step after FID
        -> Completed 3D Tour         ← NEW: guided walkthrough
          -> Customized Avatar       ← NEW: personal investment
            -> Completed First Quest ← NEW: did something real
              -> Joined First Space  ← NEW: social connection
                -> Attended Fractal  ← EXISTING: now with 3D path
                  -> Earned Respect  ← EXISTING: rewarded
```

**Key insight:** The current funnel has a 4-stage gap between "FID Linked" and "Attended Fractal" with zero guidance. The 3D tour + quests fill that gap with 5 measured steps, each giving the member something concrete to do.

---

## Implementation Priority

### Sprint 1: Foundation + Tour (Weeks 1-3)
1. Set up R3F + Drei in Next.js App Router (Doc 313 Phase 1)
2. Build HQ Lobby room with ZOE guide NPC
3. Implement 7-stop guided tour mapping to current TutorialPanel steps
4. Add "Virtual HQ" card to HomePage + entry from onboard page
5. Track tour completion in Supabase

### Sprint 2: Quest System + Music (Weeks 4-5)
1. Create `user_quests` and `user_levels` tables
2. Build quest engine + API routes
3. Connect music player to spatial audio
4. Build Studio room with jukebox
5. XP/level display in QuestHUD

### Sprint 3: Social + Content Rooms (Weeks 6-7)
1. Colyseus multiplayer (avatar positions)
2. Gallery room (cast frames)
3. VRM avatar customization
4. Presence indicators (who's online)

### Sprint 4: Advanced Rooms + Polish (Weeks 8-9)
1. Stage room (Stream.io bridge)
2. Governance Hall
3. VIP Lounge (token gating)
4. Mobile touch controls
5. Performance optimization

---

## Risk: The "Empty Room" Problem

The biggest risk for a 188-member community: a member enters the 3D world and nobody else is there. Mitigation:

| Strategy | How |
|----------|-----|
| **NPC population** | ZOE + 3-4 AI NPCs always present, walking around, offering tips |
| **Async presence** | Show "ghost" avatars of recently active members (last 24h) on pedestals |
| **Activity feed** | Floating notification bubbles showing real-time activity from 2D app |
| **Scheduled events** | "Virtual HQ Open House" at set times (tie to fractal schedule) |
| **Low-fi first** | Start with presence indicators (colored orbs) before full avatars - even 2-3 orbs feel alive |

---

## Sources

- [Doc 313 - Metaverse & 3D Virtual World for ZAO OS](../313-metaverse-3d-virtual-world-zao/)
- [Layer3 Quest System](https://help.layer3.xyz/onboarding/for-users/rewards-on-layer3)
- [Layer3 Case Study - thirdweb](https://blog.thirdweb.com/case-studies/layer3-powers-web3-adoption-through-gamified-experiences-nft-rewards/)
- [Quest Chains - Web3 Community Quests](https://medium.com/quest-chains/quest-chains-the-tool-for-all-web3-communities-d67ba2220dbd)
- [Top Web3 Quest Platforms 2025](https://domino.run/blog/web-3-quest-platforms)
- [5 Best React Onboarding Libraries 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared)
- [Driver.js - Lightweight Onboarding](https://driverjs.com/)
- [Virtual Home Tour 3D - GitHub](https://github.com/mindfiredigital/Virtual-Home-Tour-3D-Web)
- [React Three Fiber Docs](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [Gamification in Web3 Communities - Quest Protocol](https://blog.questprotocol.com/2024/01/25/web3-engagement-through-gamification/)
