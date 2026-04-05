# 159 — ZAO OS Feature Inventory & QA Checklist

> **Status:** Active reference
> **Date:** March 27, 2026
> **Goal:** Complete feature inventory for systematic QA testing with Vercel logs

## QA Testing Order (by priority)

Test each feature on the live Vercel deployment. For each one:
1. Open the page/hit the API
2. Check Vercel function logs for errors
3. Report pass/fail + any errors found

---

### GROUP 1: Public Pages (No Auth Required)

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 1 | Landing page | `/` | Loads, login buttons work |
| 2 | Members directory | `/members` | Grid loads, search works, filter presets work |
| 3 | Member profile | `/members/zaal` | Cover image, respect breakdown, reputation signals, ENS |
| 4 | Directory (artist) | `/directory` | Artist profiles load with categories |
| 5 | Artist detail | `/directory/{slug}` | Full profile with WaveWarZ enrichment |
| 6 | Respect leaderboard embed | `/api/respect/leaderboard/embed` | Returns embeddable HTML |
| 7 | ENS resolution | `/api/ens?address=0x...` | Resolves names correctly |
| 8 | Snapshot polls | `/api/snapshot/polls` | Returns active polls |

### GROUP 2: Auth Flow

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 9 | SIWF login | Login via Farcaster | Nonce generated, verification works |
| 10 | SIWE login | Login via wallet | Signature verification, allowlist check |
| 11 | Session check | `/api/auth/session` | Returns user data or 401 |
| 12 | Signer creation | `/api/auth/signer` | Creates Neynar managed signer |
| 13 | Logout | POST `/api/auth/logout` | Clears session |
| 14 | Onboarding | `/onboard` | New user flow |
| 15 | Not-allowed page | `/not-allowed` | Shows for non-allowlisted users |

### GROUP 3: Chat & Messaging

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 16 | Chat page | `/chat` | Channel feed loads, messages render |
| 17 | Send cast | Post a message in chat | Cast appears on Farcaster |
| 18 | Cast thread | Click a cast | Thread loads with replies |
| 19 | React to cast | Like/recast | Neynar signer reaction works |
| 20 | Chat search | Search in chat | Results return |
| 21 | Trending casts | `/api/chat/trending` | Returns trending data |
| 22 | XMTP DMs | `/messages` | XMTP client initializes, DMs load |
| 23 | Scheduled casts | `/api/chat/schedule` | List/create scheduled posts |
| 24 | Hide cast (admin) | `/api/chat/hide` | Admin moderation works |

### GROUP 4: Music Player & Library

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 25 | Music page | `/music` | Music UI loads |
| 26 | Persistent player | Navigate between pages | Audio keeps playing |
| 27 | Radio mode | Tap idle player bar | Radio stations load and play |
| 28 | Song library | `/api/music/library` | Browse/search songs |
| 29 | Like a song | `/api/music/library/like` | Toggle like works |
| 30 | Play count | Play a song | Increment tracked |
| 31 | Track of the Day | `/api/music/track-of-day` | Today's nomination loads |
| 32 | TOTD voting | `/api/music/track-of-day/vote` | Vote toggles |
| 33 | Playlists | `/api/music/playlists` | List/create playlists |
| 34 | Song comments | `/api/music/comments` | Timestamped comments |
| 35 | Music resolve | `/api/music/resolve?url=...` | Songlink card |
| 36 | Lyrics | `/api/music/lyrics?artist=X&title=Y` | Lyrics fetch |
| 37 | Music NFT wallet | `/api/music/wallet?address=0x...` | Alchemy NFT scan |
| 38 | Song reactions | `/api/music/library/react` | Emoji reactions |
| 39 | Curators | `/api/music/curators` | Top curator ranking |
| 40 | Trending weighted | `/api/music/trending-weighted` | Respect-weighted trending |
| 41 | Song submissions | `/api/music/submissions` | Submit/review flow |
| 42 | AI music gen | `/api/music/generate` | HuggingFace generation |
| 43 | Music sidebar | Open sidebar in any page | Library/Queue/Playlists tabs |
| 44 | Music metadata | `/api/music/metadata?url=...` | Spotify/YT oEmbed |

### GROUP 5: Governance & Proposals

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 45 | Fractals page | `/fractals` | Sessions, proposals, analytics tabs |
| 46 | Fractal sessions | `/api/fractals/sessions` | Session list with pagination |
| 47 | Fractal analytics | `/api/fractals/analytics` | Stats (members, scores) |
| 48 | ORDAO proposals | `/api/fractals/proposals` | On-chain proposals |
| 49 | Community proposals | `/api/proposals` | List with vote tallies |
| 50 | Create proposal | POST `/api/proposals` | New proposal |
| 51 | Vote on proposal | `/api/proposals/vote` | Respect-weighted vote |
| 52 | Proposal comments | `/api/proposals/comment` | Comment thread |
| 53 | ZOUNZ proposals | `/api/zounz/proposals` | On-chain Governor data |
| 54 | Snapshot polls | `/api/snapshot/polls` | Gasless weekly polls |
| 55 | Governance redirect | `/governance` | Redirects to /fractals?tab=proposals |

### GROUP 6: Respect & Leaderboard

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 56 | Respect page | `/respect` | Leaderboard loads |
| 57 | Leaderboard API | `/api/respect/leaderboard` | Ranked by total respect |
| 58 | Member respect | `/api/respect/member?fid=19640` | Respect breakdown |
| 59 | Record fractal | POST `/api/respect/fractal` | Admin: score recording |
| 60 | Record event | POST `/api/respect/event` | Hosting/bonus/intro |
| 61 | On-chain sync | POST `/api/respect/sync` | Sync OG/ZOR balances |
| 62 | Transfer history | `/api/respect/transfers` | Historical transfers |

### GROUP 7: Social & Directory

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 63 | Social page | `/social` | Community graph, suggestions |
| 64 | Community graph | `/api/social/community-graph` | Follow graph data |
| 65 | Follow suggestions | `/api/social/suggestions` | Neynar suggestions |
| 66 | Follow user | POST `/api/users/follow` | Neynar follow |
| 67 | Activity feed | `/api/activity/feed` | Unified feed |
| 68 | Home feed | `/home` | Personalized feed |

### GROUP 8: Profile & Self-Edit (NEW)

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 69 | Own profile detection | `/members/{your-username}` | "Edit Profile" button appears |
| 70 | Edit profile panel | Click "Edit Profile" | Inline form loads with current data |
| 71 | Save profile | Edit bio/location/handles, save | API updates, profile refreshes |
| 72 | GET editable fields | `/api/members/me` | Returns current user fields |
| 73 | Profile completeness | View any profile | Completeness bar + missing items |

### GROUP 9: Discovery Filters (NEW)

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 74 | Quick presets | Click "Musicians with 100+ Respect" | Filters apply, results change |
| 75 | Filter panel | Click "Filters" button | Panel opens with all controls |
| 76 | Category filter | Select "musician" | Only musicians shown |
| 77 | Platform filter | Select "Audius" | Only Audius members shown |
| 78 | Active since | Select "Last 7 days" | Recently active only |
| 79 | Min respect | Select "100+" | Filters low-respect members |
| 80 | Has ENS toggle | Check "Has ENS" | Only ENS holders |
| 81 | Filter chips | Close panel | Dismissible chips visible |
| 82 | Clear all | Click "Clear all" | Resets to default |
| 83 | Sort options | Change to "Name A-Z" | Re-sorts results |

### GROUP 10: Admin Tools

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 84 | Admin dashboard | `/admin` | Admin-only access |
| 85 | Admin members CRM | `/admin/members` | Directory + data health tabs |
| 86 | Member health | `/api/admin/member-health` | Data quality report |
| 87 | Auto-fix actions | POST `/api/admin/member-fix` | 7 fix actions |
| 88 | User management | `/api/admin/users` | CRUD operations |
| 89 | Allowlist management | `/api/admin/allowlist` | Add/remove members |
| 90 | Moderation queue | `/api/moderation/queue` | Flagged content |
| 91 | Hidden casts | `/api/admin/hidden` | Moderated content list |

### GROUP 11: Research Library

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 92 | Library page | `/library` | Entries load with search |
| 93 | Submit research | POST `/api/library/submit` | OG metadata + AI summary |
| 94 | Vote on entries | POST `/api/library/vote` | Up/downvote |
| 95 | Comments | `/api/library/comments` | Thread loads |
| 96 | Reference docs | `/api/library/docs` | Categories list |

### GROUP 12: External Integrations

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 97 | Bluesky status | `/api/bluesky` | Connection status |
| 98 | Bluesky feed | `/api/bluesky/feed` | Public feed generator |
| 99 | Cross-publish Farcaster | POST `/api/publish/farcaster` | Publishes to @thezao |
| 100 | Cross-publish X | POST `/api/publish/x` | Posts to X |
| 101 | Hats tree | `/api/hats/tree` | Hats Protocol roles |
| 102 | WaveWarZ | `/wavewarz` | Artist leaderboard |

### GROUP 13: Notifications & Streaks

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 103 | Notifications page | `/notifications` | List loads |
| 104 | Push status | `/api/notifications/status` | Enabled/disabled |
| 105 | Streaks | `/api/streaks` | Current streak data |
| 106 | Record activity | POST `/api/streaks/record` | Streak updates |

### GROUP 14: Webhooks (Test with real events)

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 107 | Neynar webhook | POST `/api/webhooks/neynar` | HMAC validates, cast stored |
| 108 | Alchemy webhook | POST `/api/webhooks/alchemy` | HMAC validates, respect synced |
| 109 | Fractals webhook | POST `/api/fractals/webhook` | Discord bot events processed |

### GROUP 15: Settings & Tools

| # | Feature | URL/Test | What to Check |
|---|---------|----------|---------------|
| 110 | Settings page | `/settings` | Preferences load |
| 111 | Wallet visibility | `/api/users/wallet-visibility` | Hidden wallets |
| 112 | Messaging prefs | `/api/users/messaging-prefs` | Auto-join, DM settings |
| 113 | Tools page | `/tools` | Community tools |
| 114 | Search | `/api/search?q=test` | Multi-type search |
| 115 | Upload | POST `/api/upload` | Image upload (5MB max) |

---

## Stats

- **128 API routes** across 31 feature areas
- **25 user-facing pages** (5 public, 20 auth-protected)
- **127 component files** across 25 modules
- **16 hooks**, 21 lib modules, 10 audio providers
- **115 testable features** in this checklist

## Sources

- Codebase scan: `src/app/api/` (128 route.ts files)
- Pages scan: `src/app/` (25 page.tsx files)
- Components: `src/components/` (25 folders, 127 files)
- Hooks: `src/hooks/` (16 files)
- Libraries: `src/lib/` (21 subfolders, ~50 files)
