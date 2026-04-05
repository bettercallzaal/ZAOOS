# MVP Spec — Gated Chat Client

> The simplest thing that delivers value for ZAO community members.

---

> [!NOTE]
> **ZAO OS launched March 12, 2026 with 40 beta testers.** This MVP spec is retained as the original design document. For current state, see [Doc 50](../../community/050-the-zao-complete-guide/).

## What It Is

A mobile-first, Discord-style chat interface at **zaoos.com** where ZAO community members sign in with Farcaster, pass an allowlist gate, and chat in a room that posts to the `/zao` Farcaster channel. **Bidirectional** — messages posted from ZAO OS appear on Farcaster, and messages posted from Farcaster appear in ZAO OS.

## What It Is NOT

- No music player (Layer 2)
- No ZIDs / custom profiles (Layer 3)
- No Respect tokens (Layer 4)
- No invite codes (just direct allowlist)
- No private DMs (Layer 9)

## Key Principles

- **Mobile-first** — designed for phones, enhanced for desktop
- **Bidirectional** — ZAO OS ↔ Farcaster `/zao` channel (same messages)
- **Onboards non-Farcaster users** — Neynar FID registration for wallet-only users
- **Build in public** — every step documented in BUILDLOG.md and build-log/ folder

---

## User Flows

### Flow A: Existing Farcaster User
```
1. User visits zaoos.com
2. Sees landing page with ZAO branding + "Sign In With Farcaster" button
3. Clicks sign in → Farcaster QR code / deep link
4. Signs message with custody address
5. Backend verifies signature → gets FID
6. Backend checks FID against allowlist
   → If allowed: create session, redirect to /chat
   → If not: "You're not on the list yet" page
7. Chat room loads — shows recent messages from /zao channel
8. First post: user approves Neynar managed signer (one-time Farcaster deep link)
9. User types message → cast posted to /zao channel
10. New messages appear in real-time (including casts from Farcaster app)
```

### Flow B: New User (Has Wallet, No Farcaster Account)
```
1. User visits zaoos.com
2. Clicks "Create Account" / "New to Farcaster?"
3. Connects wallet (or enters wallet address)
4. Backend checks wallet against allowlist
   → If allowed: proceed to FID registration
   → If not: "You're not on the list yet"
5. Neynar registers a new FID for their wallet (pays for storage)
6. User is now a Farcaster user with a ZAO-created account
7. Signer auto-created → user enters chat
```

---

## Confirmed Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Framework | Next.js 14+ (App Router) | Standard, fast, Vercel-native |
| Styling | Tailwind CSS | Fast iteration, dark theme |
| Auth | `@farcaster/auth-kit` | Official SIWF components |
| Farcaster API | Neynar SDK / REST API | Best DX, managed signers |
| Database | Supabase (PostgreSQL) | Free tier, hosted, real-time capable |
| Deployment | Vercel (auto-deploy from GitHub) | Already connected |
| Repo | github.com/bettercallzaal/ZAOOS | Already exists |
| Domain | zaoos.com | Already owned |

---

## Brand

| Element | Value |
|---------|-------|
| Primary Color | Navy `#0a1628` (dark background) |
| Accent Color | Gold `#f5a623` (buttons, highlights, logo) |
| Secondary | Warm gold gradient `#f5a623` → `#ffd700` |
| Font | System / Inter (clean, modern) |
| Logo | "THE ZAO" — urban/music drip style |
| Vibe | Dark, premium, music community |

---

## Pages

### Landing (`/`)
- Dark navy background
- ZAO logo centered
- "Sign In With Farcaster" button (gold accent)
- "New to Farcaster?" link for wallet-only onboarding
- Brief tagline: "The ZAO Community on Farcaster"

### Not Allowed (`/not-allowed`)
- "You're not on the list yet"
- Brief explanation
- Link to ZAO socials / how to get access

### Chat (`/chat`) — Gated
**Mobile (default):**
- Full-screen message list
- Hamburger menu → slides out sidebar (ZAO logo, #zao, user info)
- Fixed bottom: message input bar
- Pull down to load older messages

**Desktop (md+ breakpoint):**
- Left sidebar visible: ZAO logo, #zao channel, user avatar
- Main area: scrollable message list
- Fixed bottom: message input bar

**Both:**
- Each message: avatar, username, timestamp, text
- Messages = casts from `/zao` Farcaster channel (bidirectional)
- Post = cast to `/zao`
- Reply = reply cast (threaded view)
- Long-press/right-click message → admin: "Hide message"

### Admin (`/admin`) — Admin-only
- View/manage allowlist (add, remove, edit members)
- CSV upload for bulk allowlist import
- View hidden messages log
- Hide/unhide messages (removes from ZAO OS display, stays on Farcaster)
- Simple table UI, search by name/FID/wallet

---

## Database Schema (Supabase)

```sql
-- Allowlisted users who can access ZAO OS
-- Seeded from CSV: real_name, ign (in-game/superhero name), fid, wallet
CREATE TABLE allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT UNIQUE,
  wallet_address TEXT,
  real_name TEXT,                    -- optional
  ign TEXT,                          -- in-game name / superhero name, optional
  -- at least one of real_name or ign is required
  is_active BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- User sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL,
  username TEXT,
  display_name TEXT,
  pfp_url TEXT,
  custody_address TEXT,
  signer_uuid TEXT,                  -- Neynar managed signer UUID
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Soft-deleted messages (admin can hide messages from ZAO OS view)
-- Note: cannot delete from Farcaster, only from ZAO OS display
CREATE TABLE hidden_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT UNIQUE NOT NULL,
  hidden_by_fid BIGINT NOT NULL,     -- admin who hid it
  reason TEXT,
  hidden_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Routes

```
# Auth
POST /api/auth/verify       — Verify SIWF signature, check allowlist, create session
GET  /api/auth/session       — Get current session
POST /api/auth/logout        — Clear session
POST /api/auth/register      — Register new FID via Neynar (wallet-only users)

# Chat
GET  /api/chat/messages      — Fetch recent casts from /zao channel
POST /api/chat/send          — Post a cast to /zao channel (Neynar managed signer)
GET  /api/chat/thread/:hash  — Fetch replies to a specific cast
POST /api/chat/hide          — Hide a message from ZAO OS (admin only)

# Admin
GET  /api/admin/allowlist    — List allowlisted users
POST /api/admin/allowlist    — Add user(s) to allowlist
DELETE /api/admin/allowlist  — Remove user from allowlist
POST /api/admin/upload       — Upload CSV to bulk import allowlist
```

---

## Neynar API Calls Needed

```
# Fetch channel feed (chat messages)
GET https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=zao&limit=50

# Post a cast (send message)
POST https://api.neynar.com/v2/farcaster/cast
Body: { signer_uuid, text, channel_id: "zao" }

# Get user profile
GET https://api.neynar.com/v2/farcaster/user/bulk?fids={fid}

# Get cast replies (thread)
GET https://api.neynar.com/v2/farcaster/cast/conversation?identifier={hash}&type=hash
```

---

## Environment Variables

```env
# Farcaster Auth
NEXT_PUBLIC_SIWF_DOMAIN=zaoos.com

# Neynar
NEYNAR_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Session
SESSION_SECRET=random_secret_here
```

---

## File Structure (MVP only)

```
src/
├── app/
│   ├── page.tsx                    # Landing + SIWF login
│   ├── not-allowed/page.tsx        # Gate rejection page
│   ├── onboard/page.tsx            # Wallet-only FID registration
│   ├── layout.tsx                  # Root layout (providers)
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth-required wrapper
│   │   ├── chat/page.tsx           # Chat room
│   │   └── admin/page.tsx          # Admin panel (allowlist + moderation)
│   └── api/
│       ├── auth/
│       │   ├── verify/route.ts     # SIWF verify + gate + session
│       │   ├── session/route.ts    # Get current session
│       │   ├── logout/route.ts     # Clear session
│       │   └── register/route.ts   # Neynar FID registration
│       ├── chat/
│       │   ├── messages/route.ts   # GET channel feed
│       │   ├── send/route.ts       # POST cast to channel
│       │   ├── thread/[hash]/route.ts # GET thread
│       │   └── hide/route.ts       # POST hide message (admin)
│       └── admin/
│           ├── allowlist/route.ts  # CRUD allowlist
│           └── upload/route.ts     # CSV upload for bulk import
├── components/
│   ├── ui/                         # Button, Input, Avatar, Drawer, etc.
│   ├── chat/
│   │   ├── ChatRoom.tsx            # Main chat container
│   │   ├── MessageList.tsx         # Scrollable message list
│   │   ├── Message.tsx             # Single message bubble
│   │   ├── MessageInput.tsx        # Text input + send button
│   │   └── Sidebar.tsx             # Channel sidebar (drawer on mobile)
│   ├── admin/
│   │   ├── AllowlistTable.tsx      # Allowlist management table
│   │   ├── CsvUpload.tsx           # CSV import component
│   │   └── HiddenMessages.tsx      # Hidden messages log
│   └── gate/
│       └── LoginButton.tsx         # SIWF button wrapper
├── lib/
│   ├── farcaster/
│   │   └── neynar.ts              # Neynar API client (feed, cast, signer, register)
│   ├── gates/
│   │   └── allowlist.ts           # Allowlist check (FID + wallet)
│   ├── auth/
│   │   └── session.ts             # Session management (cookies)
│   └── db/
│       └── supabase.ts            # Supabase client
├── hooks/
│   ├── useAuth.ts                 # Auth state hook
│   ├── useChat.ts                 # Chat messages + polling hook
│   └── useMobile.ts              # Mobile detection + sidebar state
└── types/
    └── index.ts                   # Shared types
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gate type | Allowlist (FID + wallet) | Simplest. No on-chain deps. List ready (~50-100 users). |
| Allowlist format | CSV with real_name, ign, fid, wallet | Easy to manage. At least one name required. |
| Chat backend | Farcaster `/zao` channel via Neynar | Bidirectional. Messages live on Farcaster. |
| Real-time | Polling (5-10 sec) | Simplest for MVP. Upgrade to Hub gRPC later. |
| Signer | Neynar managed signer | Easiest. No Ed25519 key management. |
| New user onboarding | Neynar FID registration | Wallet-only users get a Farcaster account in-app. |
| Auth | Cookie-based sessions | Simple. Works with Next.js middleware. |
| Design | Mobile-first, Discord-style dark | Phone-first, desktop as enhancement. |
| Moderation | Admin can hide messages from ZAO OS | Can't delete from Farcaster, but can hide from our UI. |
| Admin panel | Yes, in MVP | Manage allowlist, CSV upload, hide messages. |
| Build-in-public | Git commits + narrative build log | Every step documented for content. |
