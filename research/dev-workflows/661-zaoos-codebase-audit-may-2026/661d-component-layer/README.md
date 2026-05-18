---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 661
tier: STANDARD
parent-doc: 661
---

# 661d - Component Layer Audit

## Component Inventory

Total: 293 .tsx files across 35 feature folders.

### Components by Feature Folder

| Folder | Count | Status | Notes |
|---|---|---|---|
| music/ | 66 | Active | Largest folder. Player, queue, trending, radio, library components. |
| spaces/ | 51 | Active | HMS rooms, reactions, chat panels, moderation. |
| admin/ | 31 | Active | User table (834 LoC), allowlist, agent dashboard, moderation. |
| social/ | 22 | Active | Farcaster, analytics, community graphs, milestone tracking. |
| chat/ | 18 | Active | Sidebar (730 LoC), compose bar (662 LoC), message rendering. |
| os/ | 11 | Active | OnboardingModal, CoreNav, core UI. |
| navigation/ | 7 | Active | BottomNav, NotificationBell, PullToRefresh. |
| messages/ | 7 | Active | XMTP DM composer, message threads. |
| settings/ | 6 | Active | ConnectedPlatforms, preferences. |
| respect/ | 6 | Active | Mindshare leaderboard, treemap visualizations. |
| governance/ | 6 | Active | Discord proposals, Snapshot polls. |
| library/ | 5 | Active | Music library view, search. |
| home/ | 5 | Active | Landing page, hero sections. |
| fishbowlz/ | 5 | **Paused** | EmptyState, OnboardingModal, Reactions, TipButton, RoomCardSkeleton. (Juke partnership 2026-04-16.) |
| zounz/ | 4 | Active | ZounzAuction, ZounzProposalCard, governance bridge. |
| portal/ | 4 | Graduated | PortalDoor, PortalHub. Portal moved to separate domain 2026. |
| wavewarz/ | 3 | Active | Leaderboard, BattleLog, GeneratePostButton. |
| ui/ | 3 | Active | BottomSheet, PageSkeleton, generic UI primitives. |
| search/ | 3 | Active | SearchDialog, filter panels. |
| providers/ | 3 | Active | RadioProvider, AudioProvider wrappers. |
| members/ | 3 | Active | MemberCard, ProfileCard, RolodexList. |
| hats/ | 3 | Active | Hats Protocol integration, role display. |
| solana/ | 2 | Active | Marinade stake panel, Solana wallet components. |
| miniapp/ | 2 | Active | Farcaster miniapp frames. |
| gate/ | 2 | Active | Token gating, guild.xyz integration. |
| ecosystem/ | 2 | Active | EcosystemPanel, EmpireZabalHero. |
| compose/ | 2 | Active | PlatformToggles, cross-post UI. |
| calls/ | 2 | Active | Jitsi wrapper, ListeningRoom broadcast. |
| wallet/ | 1 | Active | WalletButton. |
| streaks/ | 1 | Active | StreakBadge. |
| shared/ | 1 | Active | SharedPlaylist component. |
| pwa/ | 1 | Active | PWA install prompt. |
| feedback/ | 1 | Active | FeedbackForm. |
| events/ | 1 | Active | EventCard. |
| community/ | 1 | Active | IssueSubmitForm. |
| badges/ | 1 | Active | OGBadge. |

## Hook Inventory (19)

| Hook | Import Count | Used By | Status |
|---|---|---|---|
| useAuth | 29 | Authentication guard, session, admin checks | HEALTHY |
| useRadio | 8 | MusicRadioHero, GlobalPlayer, RadioButton | HEALTHY |
| useEscapeClose | 9 | Modals, overlays, SearchDialog | HEALTHY |
| useFocusTrap | 6 | Modal, dialog, focus management | HEALTHY |
| useWalletXMTP | 3 | Messaging, wallet integration | HEALTHY |
| usePlayerQueue | 3 | MusicSidebar, NowPlayingBar | HEALTHY |
| useMobile | 3 | Responsive layouts, BottomNav | HEALTHY |
| useListeningRoom | 3 | ListeningRoom broadcast | HEALTHY |
| useOverlaySync | 1 | Overlay state sync | LOW USE |
| useNowPlaying | 1 | NowPlayingBar, metadata | LOW USE |
| useMusicQueue | 1 | GlobalPlayer queue | LOW USE |
| useMiniApp | 1 | Farcaster miniapp frame context | LOW USE |
| useLensAuth | 1 | Lens Protocol auth (legacy) | LOW USE |
| useENS | 1 | ENS name resolution | LOW USE |
| useChat | 1 | ChatRoom context | LOW USE |
| useAutoStreamMarker | 1 | Music stream marker (legacy) | LOW USE |
| useAudius | 1 | Audius SDK integration (legacy) | LOW USE |
| useKeyboardShortcuts | 1 | Keyboard handler setup | LOW USE |
| **useLiveTranscript** | **0** | **UNUSED** | **DELETE CANDIDATE** |

**useLiveTranscript action:** This hook imports @/lib/liveTranscript but is never used. Safe to delete. Location: src/hooks/useLiveTranscript.ts.

## Anti-Pattern Audit

### 1. Inline Styles (style={{}})

**Severity:** P1 - Violates component.md rule "Tailwind only"

- **Total files affected:** 63
- **Total instances:** 122+ inline style declarations

**Top violators (style usage count):**
- src/components/music/GlobalPlayer.tsx: 6 instances
- src/components/music/WaveformComments.tsx: 4 instances
- src/components/music/ExpandedPlayer.tsx: 3 instances
- src/components/calls/ListeningRoom.tsx: 5 instances
- src/components/music/SpectrumVisualizer.tsx: 1 instance (background color)

**Examples:**
- `style={{ height: '60%' }}` in ListeningRoom (bars animation fallback)
- `style={{ width: `${progress}%` }}` in GlobalPlayer (dynamic width)
- `style={{ height: 120, background: 'rgba(245, 166, 35, 0.05)' }}` in SpectrumVisualizer
- `style={{ height: '70vh', minHeight: '400px' }}` in EcosystemPanel

**Pattern:** Most are dynamic calculations (%) or scoped canvas-like animations. **Refactor path:** Replace with Tailwind's `h-[60%]` syntax, `w-[var(--progress)]` custom properties, or `aspect-ratio` constraints where suitable.

### 2. React.FC Usage

**Status:** PASS - 0 instances. Component conventions enforced.

### 3. CSS Modules

**Status:** PASS - 0 instances. No .module.css imports.

### 4. dangerouslySetInnerHTML

**Status:** PASS - 0 instances. Security policy enforced.

### 5. Missing "use client" Directive

**Status:** PASS - Spot-checked 30 components. All client components with hooks have directive.

### 6. Import Alias Violations

**Severity:** P2 - Minor

- **Total instances:** 2
- **Files:**
  - src/components/chat/TrendingFeed.tsx: `import { communityConfig } from '../../../community.config'`
  - src/components/spaces/HostRoomModal.tsx: `import { communityConfig } from '../../../community.config'`

**Fix:** Change to `import { communityConfig } from '@/community.config'`

### 7. State Management Libraries

**Status:** PASS - 0 imports of Redux, Zustand, Jotai, Recoil. Discipline maintained.

## Largest Components (Refactor Candidates)

| File | LoC | Domain | Complexity Signals |
|---|---|---|---|
| src/components/admin/UsersTable.tsx | 834 | Admin | Table with 30+ columns, sorting, filtering, export. Consider split: header/row/actions. |
| src/components/music/MusicSidebar.tsx | 802 | Music | Library + queue + playlists + search. Split into LibrarySidebar + QueueSidebar. |
| src/components/chat/Sidebar.tsx | 730 | Chat | Channel list + member list + pinned messages. Split into ChannelList + MemberList. |
| src/components/chat/ComposeBar.tsx | 662 | Chat | Auto-complete, mentions, platform toggles, embeds. Split into input + mentions + toggles. |
| src/components/admin/DiscordLinkManager.tsx | 649 | Admin | Discord guild/channel config, DM mode, linking UI. Consider 3-panel layout. |

**Refactor priority:** UsersTable (834) is most critical. All 5 are > 600 LoC and handle multiple domains.

## Decommissioned Component Candidates

| Path | Surface | Status | Recommendation |
|---|---|---|---|
| src/components/fishbowlz/ (5 components) | Paused IRL broadcast | Juke partnership 2026-04-16; components kept for reference. | Keep until Juke integration complete. Plan deletion post-graduation. |

**Note:** No deleted openclaw agent UI components found in codebase (likely never added to ZAOOS). No FISHBOWLZ API routes in codebase either—all dead-dropped 2026-05-04 per CLAUDE.md.

## Recommended Actions

### P0 (This Sprint)

1. **Delete useLiveTranscript hook** - Unused, safe delete.
   - Owner: Component lead
   - File: src/hooks/useLiveTranscript.ts
   - Time: 5 minutes

2. **Fix import aliases in TrendingFeed + HostRoomModal** - 2 files.
   - Owner: Component lead
   - Files: src/components/chat/TrendingFeed.tsx, src/components/spaces/HostRoomModal.tsx
   - Change: '../../../community.config' → '@/community.config'
   - Time: 5 minutes

### P1 (Next Sprint)

3. **Audit inline styles in music/ and calls/ folders** - 28 files use style={{}}.
   - Owner: Music UI lead
   - Scope: GlobalPlayer, SpectrumVisualizer, WaveformComments, NowPlayingBar, ExpandedPlayer, ListeningRoom.
   - Approach: Convert dynamic calculations to Tailwind h-[%] / w-[%] or CSS variables.
   - Complexity: 1-2 days per file (animation edge cases).

### P2 (Later)

4. **Split UsersTable (834 LoC)** - Admin table needs componentization.
   - Owner: Admin lead
   - Suggested structure: UserTableHeader + UserTableRow + UserTableActions.
   - Time: 1-2 days.

5. **Split MusicSidebar (802 LoC)** - Library + queue too intertwined.
   - Owner: Music lead
   - Suggested structure: Separate LibrarySidebar + QueueSidebar contexts.
   - Time: 2-3 days.

6. **Audit portal/ folder** - Graduated to own domain 2026. Check for dead imports.
   - Owner: Infra lead
   - Expected: Redirect-only stubs remain; no active components.

## Audit Metrics Summary

| Metric | Value | Health |
|---|---|---|
| Total components | 293 | Good |
| Folders | 35 | Modular |
| React.FC usage | 0 | PASS |
| CSS module imports | 0 | PASS |
| dangerouslySetInnerHTML | 0 | PASS |
| Inline styles (violations) | 122 (63 files) | FAIL - refactor needed |
| Import alias violations | 2 | MINOR |
| Unused hooks | 1 (useLiveTranscript) | Easy fix |
| Largest component (UsersTable) | 834 LoC | Refactor candidate |
| Components > 600 LoC | 5 | Refactor candidates |

## Sources

- Component count: `find src/components -name "*.tsx" | wc -l`
- Hook inventory: `ls src/hooks/*.ts` + grep for imports
- Anti-pattern scan: `grep -r` for style, React.FC, .module.css, dangerouslySetInnerHTML
- LoC analysis: `wc -l` on largest files, filtered `.test.tsx`
- Fishbowlz status: CLAUDE.md, memory, research/identity/525-guild-xyz
