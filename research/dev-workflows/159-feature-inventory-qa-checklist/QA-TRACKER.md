# ZAO OS QA Tracker — March 27, 2026

Test each feature on the live site. Paste Vercel logs here for any failures.
Mark: PASS / FAIL / SKIP

---

## GROUP 1: Public Pages (No Auth)

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 1 | Landing page | `/` | | |
| 2 | Members directory | `/members` | | |
| 3 | Member profile | `/members/zaal` | | |
| 4 | Filter: "Musicians 100+ Respect" | `/members` → click preset | | |
| 5 | Filter: "Active this week" | `/members` → click preset | | |
| 6 | Filter: "On Audius" | `/members` → click preset | | |
| 7 | Filter panel open/close | `/members` → Filters button | | |
| 8 | Filter chips dismiss | Close panel, click X on chip | | |
| 9 | Sort by Name A-Z | `/members` → Filters → Sort | | |
| 10 | Artist directory | `/directory` | | |
| 11 | Artist detail page | `/directory/{any-slug}` | | |
| 12 | ENS resolution | `/api/ens?address=0x...` | | |
| 13 | Snapshot polls | `/api/snapshot/polls` | | |
| 14 | Leaderboard embed | `/api/respect/leaderboard/embed` | | |

## GROUP 2: Auth Flow

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 15 | SIWF login | Click "Sign in with Farcaster" | | |
| 16 | Session check | `/api/auth/session` | | |
| 17 | Signer status | `/api/auth/signer/status` | | |
| 18 | Onboarding | `/onboard` | | |

## GROUP 3: Chat & Messaging

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 19 | Chat page loads | `/chat` | | |
| 20 | Send a cast | Type + send in chat | | |
| 21 | Open thread | Click any cast | | |
| 22 | Like a cast | Click like button | | |
| 23 | Chat search | Search bar in chat | | |
| 24 | XMTP DMs | `/messages` | | |

## GROUP 4: Music

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 25 | Music page | `/music` | | |
| 26 | Persistent player | Play song, navigate to /chat | | |
| 27 | Radio mode | Tap idle player bar | | |
| 28 | Music sidebar | Open sidebar | | |
| 29 | Song library browse | Scroll library | | |
| 30 | Like a song | Heart icon | | |
| 31 | Track of the Day | TOTD section | | |
| 32 | Playlists | Playlists tab | | |
| 33 | Lyrics | Open lyrics panel | | |
| 34 | Song comments | Comment on a track | | |

## GROUP 5: Governance & Fractals

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 35 | Fractals page | `/fractals` | | |
| 36 | Sessions tab | Fractal sessions list | | |
| 37 | Analytics tab | Fractal stats | | |
| 38 | Proposals tab | Community proposals | | |
| 39 | Create proposal | New proposal form | | |
| 40 | Vote on proposal | Cast a vote | | |
| 41 | ZOUNZ proposals | On-chain section | | |
| 42 | Snapshot polls | Weekly polls section | | |

## GROUP 6: Respect

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 43 | Respect page | `/respect` | | |
| 44 | Leaderboard loads | Rankings visible | | |
| 45 | Transfer history | `/api/respect/transfers` | | |

## GROUP 7: Social

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 46 | Social page | `/social` | | |
| 47 | Community graph | Graph visualization | | |
| 48 | Follow suggestions | Suggestion cards | | |
| 49 | Home feed | `/home` | | |
| 50 | Activity feed | Feed items render | | |

## GROUP 8: Profile Self-Edit (NEW)

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 51 | Edit button on own profile | `/members/zaal` (logged in) | | |
| 52 | Edit panel opens | Click "Edit Profile" | | |
| 53 | Save bio change | Edit bio, click Save | | |
| 54 | Save platform handles | Edit handles, click Save | | |
| 55 | Profile refreshes after save | Data updates visible | | |
| 56 | No edit button on others | `/members/{other-user}` | | |

## GROUP 9: Admin

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 57 | Admin dashboard | `/admin` | | |
| 58 | Members CRM | `/admin/members` | | |
| 59 | Data health tab | Health report loads | | |
| 60 | Auto-fix: enrich profiles | Run enrich action | | |
| 61 | Allowlist management | Add/remove member | | |

## GROUP 10: Misc

| # | Feature | URL | Status | Notes |
|---|---------|-----|--------|-------|
| 62 | Settings | `/settings` | | |
| 63 | Notifications | `/notifications` | | |
| 64 | Library (research) | `/library` | | |
| 65 | WaveWarZ | `/wavewarz` | | |
| 66 | Ecosystem | `/ecosystem` | | |
| 67 | Contribute | `/contribute` | | |
| 68 | Tools | `/tools` | | |
| 69 | Spaces | `/spaces` | | |
| 70 | Search | Global search | | |

---

## Bug Log

Paste Vercel errors below as we find them:

### Bug 1:
- **Feature #:**
- **Error:**
- **Vercel Log:**
- **Fix:**

### Bug 2:
- **Feature #:**
- **Error:**
- **Vercel Log:**
- **Fix:**

### Bug 3:
- **Feature #:**
- **Error:**
- **Vercel Log:**
- **Fix:**

---

## Score

- Total features: 70
- PASS: 0
- FAIL: 0
- SKIP: 0
- Health: —%
