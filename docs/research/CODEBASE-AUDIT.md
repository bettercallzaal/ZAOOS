# ZAO OS — Comprehensive Codebase Audit

> **Audited:** 2026-03-29
> **Repo:** bettercallzaal/ZAOOS (main)
> **Base path:** `/home/node/.openclaw/workspace/zaoos`

---

## Summary Table

| Category | Status | Notes |
|----------|--------|-------|
| **Architecture** | ⚠️ Complex | Next.js 16 + React 19, massive scope (227 components, 205 API routes) |
| **API Routes** | ⚠️ Needs Work | 205 routes, inconsistent auth patterns, CRITICAL unauthenticated token endpoints |
| **Database Schema** | ⚠️ Thin migrations | Only 3 migration files for ~20+ tables; migrations may not reflect production state |
| **Authentication** | ⚠️ Partial | iron-session + SIWF, but 2 critical token-gen endpoints have ZERO auth |
| **Authorization** | ⚠️ Inconsistent | Admin routes have only 5 req/min rate limit; no role-based checks in many routes |
| **Third-Party Integrations** | ✅ Extensive | Neynar, Supabase, XMTP, Stream.io, 100ms, Bluesky, Lens, Discord, Solana, Wagmi |
| **Security Posture** | 🔴 Critical | 2 unauthenticated token generation endpoints; exposed secrets in env |
| **Component Inventory** | ✅ Rich | 227 TSX components across 20 feature areas |
| **Tech Debt** | ⚠️ Moderate | Large files, TODO comments, limited tests (35 test files) |
| **Auth Flow Completeness** | ⚠️ Partial | SIWF + signer registration mostly complete; XMTP key mgmt works; wallet auth solid |
| **Secrets Management** | ⚠️ Concerning | ENV object in middleware.ts validates at startup; but env vars accessed directly in lib files |
| **Known Issues** | ⚠️ Present | 3 console.logs in webhooks, 1 TODO in music/generate, large-file concerns |
| **Missing Features** | ⚠️ Several | AI agent (Q4 2026), Hats Protocol roles (Q3 2026), PWA/mobile, EAS attestations |
| **Testing** | ⚠️ Minimal | 35 test files for 227 components + 205 API routes = ~17% coverage |
| **Documentation** | ✅ Excellent | 155+ research docs, ZAO-OS-PROJECT-STATUS.md is comprehensive |

---

## 1. Architecture Overview

### Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | **16.2.0** |
| UI | React | **19.2.3** |
| Styling | Tailwind CSS | v4 |
| Database | Supabase (PostgreSQL + RLS) | 2.99.1 |
| Auth | iron-session | 8.0.4 |
| Validation | Zod | 4.3.6 |
| State | @tanstack/react-query | 5.90.21 |
| Blockchain | Wagmi + Viem | 2.19.5 / 2.47.2 |
| Wallet UI | RainbowKit | 2.2.10 |
| Analytics | PostHog + Vercel Analytics | — |
| Error tracking | Sentry | 10.45.0 |

### Structure
```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Protected routes (chat, messages, governance, social, admin)
│   ├── api/                # 205 route handlers across 42 directories
│   ├── members/
│   ├── spaces/
│   ├── music/
│   └── page.tsx            # Landing/login
├── components/            # 227 TSX components across 20 feature areas
│   ├── chat/ (14)
│   ├── music/ (41)
│   ├── spaces/ (20)
│   ├── governance/ (6)
│   ├── admin/ (12)
│   └── ...
├── hooks/                  # 18 custom hooks
├── contexts/               # XMTPContext (1366 lines!), QueueContext
├── providers/              # Audio providers (8 platform providers)
├── lib/                    # 30+ domain utilities
└── mcp/                    # MCP server (zao-api)
```

### Routing Structure
- **Public:** `/` (landing), `/members/[username]` (public profiles), `/api/*` (various)
- **Auth-gated:** `(auth)/chat`, `(auth)/messages`, `(auth)/governance`, `(auth)/music`, `(auth)/settings`, `(auth)/admin/*`, `(auth)/home`
- **Middleware:** Rate limiting on all `/api/*` routes, CSP nonces on page routes, COEP/COOP headers on `/messages`

### Providers/Contexts
- **XMTPContext** (1366 lines) — XMTP messaging state, conversations, MLS encryption
- **QueueContext** — Player queue state
- **PlayerProvider** (479 lines) — Global player state, MediaSession, Wake Lock
- **HTMLAudioProvider** (251 lines) — Dual audio element engine with crossfade
- **Providers component** — Wagmi, RainbowKit, ReactQuery, Theme providers

### Data Flow
1. User signs in via SIWF (Farcaster) → session stored in iron-session cookie
2. API routes read session via `getSessionData()` → get `fid`, `username`, `signerUuid`
3. React Query caches server state; optimistic updates for casts/reactions
4. Neynar used for all Farcaster read/write operations
5. Supabase stores all structured data (members, proposals, respect, music)
6. Cross-platform publishing to Bluesky/X via stored credentials

---

## 2. API Routes Audit

### Summary
- **205 route handlers** across 42 API directories
- Total ~22,700 lines across all route files
- Most use `getSessionData()` for auth
- Most use Zod `safeParse` for input validation
- Most use `supabaseAdmin` for database access

### Authenticated Routes (have `getSessionData()`)
✅ Chat, Messages, Proposals, Library, Moderation, Neynar, Respect, Members, Notifications, Activity, Admin

### Unauthenticated Routes (Intentional Public Access)
| Route | Purpose | Risk |
|-------|---------|------|
| `/api/members/directory` | Member directory listing | Low — read-only |
| `/api/members/[username]` | Public profile pages | Low — read-only |
| `/api/respect/leaderboard/embed` | Embeddable leaderboard | Low — read-only |
| `/api/spaces/leaderboard` | Spaces leaderboard | Low — read-only |
| `/api/ens` | ENS resolution | Low — read-only |
| `/api/miniapp/auth` | Quick Auth flow | Medium — initiates auth |
| `/api/miniapp/webhook` | MiniApp webhooks | Medium — webhook receiver |

### CRITICAL: Unauthenticated Token Generation Endpoints 🔴

#### `/api/stream/token/route.ts`
```typescript
// NO AUTH CHECK — anyone can generate a Stream.io token
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = TokenSchema.safeParse(body); // only checks userId is a string
  const token = client.generateUserToken({ user_id: parsed.data.userId });
  return NextResponse.json({ token });
}
```
**Issue:** Generates Stream.io user tokens for ANY user ID. An attacker can generate tokens for any user and join audio rooms as that user. Stream.io API keys are leaked server-side but the token generation has no session verification.

#### `/api/100ms/token/route.ts`
```typescript
// NO AUTH CHECK — anyone can generate 100ms tokens
export async function POST(req: NextRequest) {
  const { userId, role, roomId } = parsed.data;
  // Generates JWT with management token + app token
  return NextResponse.json({ token: appToken, roomId: hmsRoomId });
}
```
**Issue:** Same as Stream.io — generates 100ms tokens for arbitrary user IDs. Can join/create audio rooms as any user.

### Other Security Observations

#### Admin Routes (`/api/admin/*`)
- Protected only by 5 req/min rate limit in middleware
- No session role check (admin FIDs checked in some but not all routes)
- Multiple routes perform bulk database writes (member-fix, users import)
- **Risk:** Brute-force rate limit at 5/min is low but not trivially bypassed

#### Webhook Routes
- `/api/fractals/webhook` — validates `FRACTAL_BOT_WEBHOOK_SECRET` Bearer token ✅
- `/api/webhooks/neynar` — validates Neynar signature ✅
- `/api/miniapp/webhook` — NO auth (Farcaster miniapp SDK handles internally)

#### API Key Exposure Pattern
Several server-only lib files access secrets directly via `process.env`:
- `lib/publish/bluesky.ts` — `BLUESKY_APP_PASSWORD` ⚠️
- `lib/discord/client.ts` — `DISCORD_BOT_TOKEN` ⚠️
- `lib/ordao/client.ts` — `ALCHEMY_API_KEY` (optional)
- `lib/rate-limit.ts` — `UPSTASH_REDIS_REST_URL/TOKEN`
- `lib/ens/subnames.ts` — `ENS_OPERATOR_PRIVATE_KEY` ⚠️

All are in server-only files (`src/lib/*`), but the pattern of accessing secrets directly (rather than via the centralized `ENV` object in `middleware.ts`) is inconsistent.

### Missing CRUD Endpoints
Based on features described in research docs and not found in API routes:
- **No** `/api/respect/transfer` — Respect tokens can't be transferred between members
- **No** `/api/proposals/execute` — Proposals pass but don't trigger on-chain treasury actions
- **No** `/api/zounz/vote` — ZOUNZ on-chain voting handled elsewhere
- **No** `/api/music/playlist` CRUD — playlists exist in client state but no server endpoints

---

## 3. Database Schema

### Migrations (Only 3 Files!)
```
supabase/migrations/
├── 20260313_scheduled_casts.sql       — scheduled_casts table
├── 20260313_song_submissions.sql      — song_submissions table  
└── 20260329000000_create_memory_tables.sql — taste_profiles + memory_events
```

### Known Tables (from codebase + project status doc)
| Table | Purpose |
|-------|---------|
| `users` | Core member profiles |
| `allowlist` | Token-gated access |
| `respect_members` | Respect token balances |
| `fractal_sessions` | Fractal governance sessions |
| `fractal_scores` | Per-member fractal scores |
| `fractal_events` | Fractal webhook audit log |
| `respect_events` | Respect transaction history |
| `proposals` | Community governance proposals |
| `proposal_votes` | Vote records |
| `proposal_comments` | Proposal comments |
| `notifications` | In-app notifications |
| `notification_tokens` | Push notification tokens |
| `hidden_messages` | User-hidden message IDs |
| `music_submissions` | Community song submissions |
| `music_link_cache` | Cached track metadata |
| `song_votes` | Song vote records |
| `scheduled_casts` | Delayed cast posting |
| `security_audit_log` | Admin action audit trail |
| `bluesky_members` | Bluesky account links |
| `bluesky_feed_posts` | Cross-posted feed items |
| `wavewarz_artists` | WaveWarZ artist registry |
| `wavewarz_battles` | WaveWarZ battle records |
| `engagement_streaks` | Daily engagement tracking |
| `track_of_day_nominations` | Track of Day nominations |
| `track_of_day_votes` | Track of Day votes |
| `taste_profiles` | AI-synthesized music preferences |
| `memory_events` | Memory event log (Hindsight mirror) |

### Schema Issues

1. **Only 3 migrations for ~27 tables** — Most tables were likely created via Supabase UI or the project was migrated. The migrations don't reflect the full production schema.

2. **Missing indexes** — No explicit index declarations in migrations (beyond a few on scheduled_casts and taste_profiles). Queries on `respect_members`, `proposals`, `notifications` likely need indexes.

3. **No migration for `respect_members`** — The Respect token table exists but has no migration file. Unclear how it's created/synced.

4. **No migration for `proposals`, `proposal_votes`** — Key governance tables have no migration.

5. **Schema CHECK constraints** — `scheduled_casts.status` uses a CHECK constraint but migrations don't always reflect this.

6. **RLS on memory_events/taste_profiles** — Migration notes that Supabase service role bypasses RLS (comments explicitly call this out). This is a documented tradeoff.

---

## 4. Component Inventory

### Overview: 227 TSX components across 20 directories

| Directory | Count | Key Components |
|-----------|-------|----------------|
| `music/` | ~41 | GlobalPlayer, PersistentPlayer, ExpandedPlayer, WaveformPlayer, QueuePanel, SpectrumVisualizer, BinauralBeats, AmbientMixer, LyricsPanel, SleepTimer, EqualizerPanel, SubmitForm, TrackOfTheDay, SubmissionReviewQueue |
| `chat/` | ~14 | ChatRoom, MessageList, Message, ComposeBar, Sidebar, ThreadDrawer, SearchDialog, ProfileDrawer, MentionAutocomplete |
| `spaces/` | ~20 | RoomView, RoomList, RoomCard, HMSRoom, ControlsPanel, ParticipantsPanel, CameraButton, MicButton, ScreenShareButton |
| `admin/` | ~12 | UsersTable, AllowlistTable, HiddenMessages, ModerationQueue, ImportRespectButton, SyncRespectButton, SubnameManager |
| `governance/` | ~6 | SnapshotPolls, DiscordProposals, ProposalComments, LiveFractalDashboard, CreateWeeklyPoll, EventsCalendar |
| `social/` | ~10 | SocialPage, CommunityGraph, FollowerCard, DiscoverPanel, SocialAnalytics, ShareToFarcaster |
| `messages/` | ~7 | ConversationList, MessageThread, MessageCompose, NewConversationDialog, ConnectXMTP |
| `settings/` | ~6 | ConnectedPlatforms, FacebookConnect, TwitchConnect, LensConnect, KickConnect |
| `zounz/` | ~4 | ZounzProposals, ZounzProposalCard, ZounzAuction, ZounzCreateProposal |
| `wavewarz/` | ~4 | BattleLog, GeneratePostButton, Leaderboard |
| Other | ~20 | home/, library/, respect/, navigation/, ui/, badges/, etc. |

### Quality Assessment

**Well-built components:**
- `music/GlobalPlayer.tsx` — Full-featured, handles all 8 MediaSession actions
- `music/WaveformPlayer.tsx` — Wavesurfer.js integration with seek/preview
- `chat/Message.tsx` — Handles all cast types, embeds, reactions
- `spaces/HMSRoom.tsx` — 100ms SDK integration
- `home/ActivityFeed.tsx` — Aggregated feed with multiple sources
- `badges/OGBadge.tsx` — Founding member badge

**Thin/Sketchy components:**
- `music/PermawebLibrary.tsx` — Arweave integration (likely experimental)
- `music/BinauralBeats.tsx` — Interesting feature but Web Audio API oscillator management in a component is complex
- `zounz/ZounzAuction.tsx` — Nouns Builder integration (likely partial)

**Components that should exist but may not:**
- No dedicated `ProposalDetail` page component (proposals shown inline in ProposalsTab)
- No `NotificationSettings` component (notifications handled in settings/page.tsx)
- No `MobilePlayer` component (mobile music UX may be incomplete)

### Large File Concerns
| File | Lines | Concern |
|------|-------|---------|
| `contexts/XMTPContext.tsx` | **1,366** | Monolithic — should be split into useConversation, useMessage, useXMTPClient hooks |
| `app/api/proposals/vote/route.ts` | **474** | Complex voting logic, ballot counting, threshold checks |
| `app/api/fractals/webhook/route.ts` | **436** | 5 event types with nested schemas — could use strategy pattern |
| `app/api/admin/member-fix/route.ts` | **411** | Bulk member data fixes |
| `app/api/admin/users/route.ts` | **381** | Bulk user import/management |
| `app/api/members/[username]/route.ts` | **365** | Large profile resolver |
| `providers/audio/PlayerProvider.tsx` | **479** | Complex state machine for player |
| `app/api/members/directory/route.ts` | **295** | Large member directory with many filters |

---

## 5. Authentication & Authorization

### Auth Flow
1. **SIWF (Sign In With Farcaster)** — User signs a message with their wallet → FID verified via Neynar
2. **Signer Registration** — App generates Ed25519 keypair → user approves via Warpcast deep link → key registered on Optimism
3. **Session** — iron-session encrypted httpOnly cookie, 7-day TTL, contains `fid`, `username`, `signerUuid`
4. **XMTP Keys** — App-specific burner keys in localStorage (not personal wallet keys)

### Auth Implementation
```typescript
// lib/auth/session.ts — iron-session configuration
// lib/farcaster/neynar.ts — createSigner(), registerSignedKey()
// app/api/auth/signer/route.ts — signer registration flow
// app/api/auth/siwe/route.ts — SIWF verification
```

### Gated Pages
| Page | Gate |
|------|------|
| `(auth)/chat` | Allowlist + session |
| `(auth)/messages` | Allowlist + session + XMTP key |
| `(auth)/governance` | Allowlist + session |
| `(auth)/music` | Allowlist + session |
| `(auth)/admin/*` | Admin FID check |
| `(auth)/home` | Allowlist + session |
| Public: `/` | None |
| Public: `/members/[username]` | None |

### Auth Flow Completeness
- ✅ SIWF + Neynar signer registration
- ✅ Session management with iron-session
- ✅ Signer status checking
- ✅ Logout flow
- ⚠️ XMTP key rotation not implemented (keys are "burner" but no rotation)
- ⚠️ Session extension not implemented (7-day hard TTL)
- ⚠️ Allowlist check on every protected route — but some API routes bypass

### Secrets Exposure
- ✅ Server-only secrets in `middleware.ts` `ENV` object validated at startup
- ⚠️ `BLUESKY_APP_PASSWORD`, `DISCORD_BOT_TOKEN`, `ENS_OPERATOR_PRIVATE_KEY` accessed directly in lib files (not via `ENV`)
- ✅ `.env.example` documents all required vars
- ✅ No hardcoded secrets in source code

---

## 6. Third-Party Integrations

### Active Integrations
| Service | Usage | Key Risk |
|---------|-------|----------|
| **Neynar** | All Far caster reads/writes, signer management | API key in server env |
| **Supabase** | All structured data storage | Service role key in server env |
| **XMTP** | Private E2E messaging | Keys in localStorage |
| **Stream.io** | Audio/video rooms | ⚠️ Token gen endpoint unauthenticated |
| **100ms** | Live audio rooms | ⚠️ Token gen endpoint unauthenticated |
| **Bluesky** | Cross-posting | App password pattern (not stored) |
| **X/Twitter** | Cross-posting | OAuth tokens in env |
| **Discord** | Bot integration, fractal sessions | Bot token in env |
| **Wagmi/Viem** | Wallet connection, blockchain calls | — |
| **RainbowKit** | Wallet connection UI | — |
| **Lens Protocol** | Cross-posting (deferred) | Scaffolded but blocked |
| **Solana** | Wallet connection | — |
| **Livepeer** | Video streaming | — |
| **Jitsi** | Video calls | — |
| **Sound.xyz** | Music NFTs | — |
| **Audius** | Music streaming | — |
| **Spotify** | Music metadata | OAuth |
| **SoundCloud** | Music embedding | — |
| **Tidal** | Music metadata | — |
| **HuggingFace** | AI music generation (ACE-Step) | Optional |
| **Perspective API** | Content moderation | Optional |
| **Arweave** | Permanent music storage | Optional |
| **Snapshot** | Gasless voting | — |
| **Hats Protocol** | Role management (deferred) | — |
| **EAS** | Attestations (deferred) | — |
| **OpenRank** | Engagement scoring | — |
| **PostHog** | Analytics | — |
| **Sentry** | Error tracking | — |

### Missing Integrations (From Research Docs)
- **ElizaOS AI Agent** — Researched (Docs 24, 26), planned for Sprint 6 (Q4 2026)
- **Hive/InLeo** — Deferred, scaffolded but blocked
- **Nouns Builder / ZABAL** — Researched, Sprint 8
- **LiveKit** — Researched (Doc 43) but not in sprint plan

### API Key Management Issues
1. Keys accessed directly in lib files instead of centralized `ENV` object
2. `ALCHEMY_API_KEY` accessed in 4 different files
3. `BLUESKY_APP_PASSWORD` pattern: users enter app password → NOT stored → re-entry required (usability issue)

---

## 7. Known Issues & Tech Debt

### Console.log Issues
| File | Line | Issue |
|------|------|-------|
| `app/api/webhooks/neynar/route.ts` | ~line 50 | `console.log` for auto-hid/flagged casts |
| `app/api/fractals/webhook/route.ts` | ~line 10 | `console.log` for webhook events |
| `app/api/fractals/proposals/route.ts` | ~2 places | `console.log` for proposal counts |
| `app/api/stream/token/route.ts` | — | `console.error` on missing keys |
| `app/api/100ms/token/route.ts` | — | `console.error` on missing keys |

### TODO Comments
| File | TODO |
|------|------|
| `app/api/music/generate/route.ts:14` | "This is an expensive operation — add per-user rate limiting" |
| `lib/ordao/client.ts:14` | "Replace with full ABI from @ordao/contracts when available" |
| `components/chat/SchedulePanel.tsx:21` | "channel reserved for future per-channel filtering" |
| `app/api/music/search/route.ts:96` | "genre variable lint warning — reserved for future filtering" |

### Deprecated/Legacy Patterns
- `community.config.ts` uses `BigInt` literals directly (not wrapped in `bigint()`) — may cause issues with strict TypeScript
- Several components use `React.FC` instead of `React.Component` typing (less idiomatic React 19)
- Some components may still use `next/image` with `unoptimized` prop for user-controlled PFPs

### Unused Imports
No systematic audit done, but based on component review:
- `components/governance/ProposalComments.tsx:64` — `currentFid` explicitly suppressed
- `components/chat/SchedulePanel.tsx` — `channel` parameter reserved

### Large Files That Should Be Split
1. **XMTPContext.tsx (1,366 lines)** — Should split into:
   - `hooks/useXMTPClient.ts`
   - `hooks/useConversations.ts`
   - `hooks/useMessages.ts`
   - `hooks/useMLSEncryption.ts`
   
2. **PlayerProvider.tsx (479 lines)** — Should split into:
   - `hooks/usePlayerState.ts`
   - `hooks/useMediaSession.ts`
   - `hooks/useWakeLock.ts`

3. **proposals/vote/route.ts (474 lines)** — Should split into:
   - `lib/governance/voting.ts`
   - `lib/governance/ballots.ts`
   - `lib/governance/thresholds.ts`

4. **members/directory/route.ts (295 lines)** — Should split into:
   - `lib/members/queries.ts`
   - `lib/members/filters.ts`
   - `lib/members/sorting.ts`

### Test Coverage
- **35 test files** across the codebase
- **227 components + 205 API routes** = 432 major modules
- **~17% file-level coverage** (if each file has at most 1 test)
- No test coverage stats visible (no coverage report in CI artifacts)
- Vitest configured but coverage only on explicit `vitest coverage` run

---

## 8. Missing Features (Based on Research Docs)

### Features Described But Not Built

| Feature | Research Doc | Planned | Notes |
|---------|-------------|---------|-------|
| **AI Agent** (ElizaOS + pgvector) | Docs 24, 26, 08 | Sprint 6 Q4 2026 | Not started |
| **Hats Protocol roles** | Docs 23, 31 | Sprint 5 Q3 2026 | Deferred evaluation |
| **Community treasury** (Safe multisig) | Doc 31 | Sprint 5 Q3 2026 | Deferred |
| **Lens Protocol** | Doc 121 | Deferred | Blocked by wallet mismatch |
| **Hive / InLeo** | Docs 28, 36 | Deferred | Scaffolded |
| **EAS attestations** | — | Deferred | Low priority |
| **Nouns Builder / ZABAL** | — | Sprint 8 | Low priority |
| **Taste profiles** (AI music pref) | — | Future | Low priority |
| **PWA / native mobile** | Doc 33 | Future | Capacitor/React Native path |
| **ZAO OS as fractal host** | — | Future | Currently Discord-only |
| **On-chain proposal execution** | — | Future | Treasury actions not triggered |
| **Multi-community federation** | — | Future | Fork model only |

### Features Marked Done (From Project Status)
- ✅ Engagement streaks
- ✅ Track of the Day
- ✅ AI moderation
- ✅ Full-text search
- ✅ Music approval queue
- ✅ Cross-platform publishing (Farcaster + Bluesky + X)
- ✅ OG badges
- ✅ Weekly priority polls via Snapshot

### Discrepancy: Music Generate Route
`/api/music/generate/route.ts` exists and uses HuggingFace ACE-Step model, but there's no corresponding UI component for "Generate AI Music" in the music folder. The feature is API-only with a TODO for rate limiting.

---

## Top 10 Findings

### 🔴 CRITICAL (Fix Immediately)

**1. Unauthenticated Stream.io Token Generation (`/api/stream/token`)**
- **Severity:** CRITICAL — Token forgery / identity impersonation
- **Description:** `POST /api/stream/token` generates Stream.io user tokens for any arbitrary `userId` without checking session. An attacker can generate a token for any user ID and join their audio rooms.
- **Fix:** Add `getSessionData()` check + validate that `userId` matches `session.fid`

**2. Unauthenticated 100ms Token Generation (`/api/100ms/token`)**
- **Severity:** CRITICAL — Same as above for 100ms
- **Description:** `POST /api/100ms/token` generates 100ms JWT tokens for any `userId` + `role` without session verification.
- **Fix:** Add `getSessionData()` check + validate role against session

**3. Inconsistent Secret Access Pattern**
- **Severity:** HIGH — Secret management hygiene
- **Description:** `BLUESKY_APP_PASSWORD`, `DISCORD_BOT_TOKEN`, `ENS_OPERATOR_PRIVATE_KEY` are accessed directly via `process.env` in lib files rather than through the centralized `ENV` object in `middleware.ts`. This bypasses startup validation and creates inconsistent security posture.
- **Fix:** Route all secrets through `ENV`; make lib files import from `@/lib/env`

### 🟡 HIGH (Fix Soon)

**4. Admin Routes Under-Protected**
- **Severity:** HIGH
- **Description:** `/api/admin/*` routes have only 5 req/min rate limiting. No admin role check in the route handler itself. The `adminFids` array in `community.config.ts` is checked in some but not all admin routes.
- **Fix:** Add `requireAdmin(sessions)` middleware to all admin routes

**5. Database Schema Not Fully Migrated**
- **Severity:** HIGH — Operational risk
- **Description:** Only 3 SQL migrations exist for ~27 tables. The actual production schema likely exists in Supabase UI. Running migrations from scratch would lose data.
- **Fix:** Generate migration files from current Supabase schema (`supabase/migration.sql`)

**6. XMTPContext.tsx is a 1,366-line Monolith**
- **Severity:** HIGH — Maintainability
- **Description:** Single file handles XMTP client state, MLS encryption, conversations, messages, reactions, typing indicators. Any change risks breaking all messaging.
- **Fix:** Extract into `hooks/useXMTP.ts`, `hooks/useConversations.ts`, `hooks/useMessages.ts`, `lib/xmtp/crypto.ts`

**7. Music Generate Route Missing Rate Limiting**
- **Severity:** MEDIUM-HIGH
- **Description:** `TODO` comment explicitly flags "expensive operation — add per-user rate limiting"
- **Fix:** Add per-user rate limit in middleware or Supabase counter table

### 🟠 MEDIUM

**8. Console.log in Production Webhook Handlers**
- **Severity:** MEDIUM
- **Description:** `console.log` statements in Neynar and Fractals webhook handlers leak internal state to production logs
- **Fix:** Replace with structured logging or `console.info`

**9. PlayerProvider.tsx (479 lines) is a State Machine Monster**
- **Severity:** MEDIUM — Maintainability
- **Description:** Handles 8 platform providers, crossfade, MediaSession, Wake Lock, haptics — all in one file
- **Fix:** Extract platform-specific logic into provider files (already partially done)

**10. Test Coverage ~17% (35 test files for 432 modules)**
- **Severity:** MEDIUM — Regression risk
- **Description:** Most API routes and components have no test coverage. Given the complexity and AI-generation history (see Doc 38), this is risky.
- **Fix:** Prioritize tests for: auth flow, payment/token generation, webhook handlers, data mutations

---

## Top 10 Recommendations

### 1. Fix the Two Critical Token Generation Endpoints (IMMEDIATE)
Add `getSessionData()` checks to `/api/stream/token` and `/api/100ms/token`. Validate that the `userId` in the request matches the authenticated session's FID. Consider adding Stream.io/100ms user ID to the session.

### 2. Centralize All Secret Access Through `ENV`
Audit every `process.env.*` access in `src/lib/`. Route all secrets through the `ENV` object in `middleware.ts` which validates at startup. Create a server-only `lib/env-server.ts` that lib files import from.

### 3. Generate Complete Migration File from Production Schema
Use Supabase's `pg_dump` or migration history to generate a complete `supabase/migrations/001_initial_schema.sql`. Document the process in `README.md` so the schema is reproducible.

### 4. Split XMTPContext.tsx into Focused Hooks
Extract into: `hooks/useXMTPClient.ts`, `hooks/useConversations.ts`, `hooks/useMessages.ts`, `hooks/useReactions.ts`, `lib/xmtp/crypto.ts`. Keep context for dependency injection only.

### 5. Add Admin Role Middleware for All `/api/admin/*` Routes
Create `lib/auth/requireAdmin.ts` that checks `session.fid` against `communityConfig.adminFids`. Apply to all admin routes. The rate limit is not sufficient protection.

### 6. Complete Missing Database Indexes
Run `EXPLAIN ANALYZE` on the top-10 most-used queries:
- `respect_members(fid)` — likely unique index
- `proposals(status, deadline)` — for active proposal queries
- `notifications(user_fid, read, created_at)` — for notification feeds
- `casts(channel, created_at)` — for chat feeds
Add indexes found missing to a new migration.

### 7. Prioritize Tests for Critical Paths
Target: auth flow, token generation, webhooks, proposal voting, respect transfers. Set up CI to fail if coverage drops below 50% for these areas.

### 8. Fix Music Generate Rate Limiting
Implement per-user rate limiting (3 generations/hour suggested) via Supabase counter or Redis. Add to middleware with proper config.

### 9. Replace console.log in Webhooks with Structured Logging
Use `console.info` or create a `lib/logging.ts` with structured `logEvent()` that includes timestamps, event types, and severity levels.

### 10. Address TODO Comments Before Feature Freeze
Review all TODO/FIXME/HACK comments across the codebase. The music/generate TODO is explicitly flagged as a security concern. Others should be either fixed or converted to tracked GitHub issues.

---

## Detailed Findings Per Section

### A. Architecture

**What Works:**
- Clean separation: `app/`, `components/`, `lib/`, `hooks/`, `contexts/`, `providers/`
- `community.config.ts` as single source of truth for community-specific config — excellent fork-ability
- Centralized env validation in `middleware.ts`
- Tailwind CSS v4 with design tokens from community config
- Code splitting with `next/dynamic` for heavy components
- CSP nonces generated per-request in middleware

**What Doesn't:**
- No `src/pages/` or alternative — fully App Router (fine, but worth noting)
- MCP server at `src/mcp/zao-api/` is a separate mini-app within the repo
- `src/lib/` has 30+ files in root plus subdirectories — organization could be tighter

### B. API Routes

**What Works:**
- Consistent pattern: Zod schema → safeParse → supabaseAdmin → response
- Auth check on most write operations
- Rate limiting in middleware covers all API routes
- Public routes are intentionally unauthenticated (members directory, profile pages)
- Cron routes validate `CRON_SECRET` bearer token

**What Doesn't:**
- Inconsistent: 2 token routes have no auth at all
- Some routes (e.g., `/api/music/generate`) have TODO for rate limiting
- `/api/miniapp/webhook` has no auth (but is handled by Far caster SDK)
- Admin routes lack admin role enforcement at handler level

### C. Database

**What Works:**
- RLS enabled on all tables
- Service role used only server-side
- Recent migrations include RLS fixes (from project status changelog)
- Memory tables with proper indexes

**What Doesn't:**
- Only 3 migrations exist — production schema is likely in Supabase UI
- No `supabase/schema.sql` or equivalent for schema reproducibility
- Some tables referenced in code but no migration found (`respect_members`, `proposals`)

### D. Components

**What Works:**
- Excellent component organization by feature
- `music/` has 41 components covering player, queue, reactions, visualizations
- `spaces/` has 20 components covering all video/audio room needs
- Dark theme consistent across components
- Mobile-first approach (responsive classes)

**What Doesn't:**
- Some components are very thin wrappers (e.g., `RespectTrending.tsx` may just render data)
- `OGBadge` created recently (March 24) — some older components may be stale
- No component library / storybook for reuse

### E. Auth & Authorization

**What Works:**
- iron-session with encrypted cookies is solid
- SIWF + Neynar signer flow is complete
- Allowlist gating works
- XMTP keys are app-specific (not user wallet keys)

**What Doesn't:**
- Session extension not implemented
- XMTP key rotation not implemented
- Admin role checks are inconsistent
- Some API routes check allowlist, others check session only

### F. Third-Party Integrations

**What Works:**
- Impressive breadth — 25+ external services integrated
- Neynar SDK properly abstracted in `lib/farcaster/neynar.ts`
- Multi-platform music support (8 providers)
- Cross-platform publishing pipeline

**What Doesn't:**
- Some integrations are scaffolded but blocked (Lens, Hive)
- Music generation (HuggingFace) has no UI component
- AI agent integration deferred to Q4 2026

### G. Tech Debt

**What Works:**
- Project status document is excellent — tracks everything
- Security audit already done (Doc 57) and findings addressed
- TODO comments are explicit and actionable

**What Doesn't:**
- 1,366-line XMTP context
- 479-line PlayerProvider
- 474-line proposals vote route
- 35 test files insufficient for this scale
- Several components have suppressed lint warnings

### H. Missing Features

**What Works:**
- Research library is comprehensive (155+ docs)
- Project status doc is kept current
- Clear sprint roadmap exists

**What Doesn't:**
- AI agent (Sprint 6)
- Hats Protocol roles (Sprint 5)
- PWA/mobile (future)
- On-chain treasury execution (future)

---

*Report generated by codebase research audit. All findings based on static analysis of source code at `/home/node/.openclaw/workspace/zaoos`.*
