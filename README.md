# ZAO OS

> A music-first, gated Farcaster client for the ZAO community — v1.1

ZAO OS is a Discord-style chat client built on [Farcaster](https://farcaster.xyz) where music is the primary content. Members sign in with their Farcaster account, pass an allowlist gate, and chat in gated channels with inline music players, quote casts, reactions, and a music queue sidebar.

---

## Quick Start (Fork & Deploy)

### What You Need (accounts + services)

| Service | What For | Free? |
|---|---|---|
| [Vercel](https://vercel.com) | Hosting | Free tier works |
| [Supabase](https://supabase.com) | Database | Free tier works |
| [Neynar](https://dev.neynar.com) | Farcaster API (read feed, post casts) | Paid — see credit notes below |

---

### Step 1 — Clone & install

```bash
git clone https://github.com/bettercallzaal/ZAOOS.git
cd ZAOOS
npm install
```

---

### Step 2 — Environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Neynar (Farcaster API)
NEYNAR_API_KEY=your_neynar_api_key
# Webhook secret — fill in AFTER Step 5
NEYNAR_WEBHOOK_SECRET=

# Sign In With Farcaster domain (your production domain, no https://)
NEXT_PUBLIC_SIWF_DOMAIN=yourdomain.com

# Session encryption (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your_session_secret_here

# App Farcaster ID — the FID of the app account that posts casts
APP_FID=19640

# App signer private key — generate with: npx tsx scripts/generate-wallet.ts
APP_SIGNER_PRIVATE_KEY=your_app_signer_private_key
```

**Getting each value:**

- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: Supabase dashboard → Project Settings → API
- `NEYNAR_API_KEY`: dev.neynar.com → your app → API Keys
- `APP_FID`: The FID of the Farcaster account that will author casts on behalf of ZAO OS
- `APP_SIGNER_PRIVATE_KEY`: Run `npx tsx scripts/generate-wallet.ts` — this generates a wallet and registers it as a signer for your app FID

---

### Step 3 — Supabase database setup

Run these two SQL files **in order** in Supabase SQL Editor (supabase.com → your project → SQL Editor):

**File 1 — Core tables** (allowlist, sessions, hidden messages):
```
scripts/setup-database.sql
```

**File 2 — Channel casts cache** (stores Farcaster casts so you don't poll Neynar constantly):
```
scripts/add-channel-casts-table.sql
```

That's all the SQL you need.

---

### Step 4 — Seed the allowlist

The allowlist controls who can access the app. Add members in Supabase:

```sql
-- Add by FID (Farcaster user ID)
INSERT INTO allowlist (fid, real_name, ign, is_active)
VALUES (12345, 'Real Name', 'username', true);

-- Add by wallet address (for users without Farcaster yet)
INSERT INTO allowlist (wallet_address, real_name, is_active)
VALUES ('0xabc...', 'Real Name', true);
```

Or use the CSV import — format your CSV as `real_name,wallet_address,fid` and insert via Supabase's table editor.

---

### Step 5 — Register the Neynar webhook

This is the key step that eliminates Neynar polling costs. Once set up, Neynar **pushes** new casts to your server instead of you pulling constantly.

```bash
npx tsx scripts/register-neynar-webhook.ts
```

The script will print a **webhook secret**. Copy it.

Then add it to your environment:
```env
NEYNAR_WEBHOOK_SECRET=the_secret_from_above
```

Add the same variable to Vercel (Step 6).

> **Manual alternative:** dev.neynar.com → your app → Webhooks → Create webhook
> - URL: `https://yourdomain.com/api/webhooks/neynar`
> - Event: `cast.created`
> - Filter: root_parent_urls = `https://warpcast.com/~/channel/YOUR_CHANNEL`

---

### Step 6 — Deploy to Vercel

1. Push your fork to GitHub
2. Import the repo at vercel.com/new
3. Add all environment variables from `.env.local`
4. Deploy

Vercel auto-deploys on every push to `main`.

---

### Step 7 — Configure your channels

The app watches these channels by default: `zao`, `zabal`, `coc`.

To change them, update three places:

```
src/app/api/chat/messages/route.ts   → ALLOWED_CHANNELS array
src/app/api/webhooks/neynar/route.ts → WATCHED_CHANNELS array
scripts/register-neynar-webhook.ts   → CHANNEL_ROOT_URLS array
```

---

## Switching Neynar Accounts

If you're moving to a new Neynar account:

1. Get the new `NEYNAR_API_KEY` from dev.neynar.com
2. Update `NEYNAR_API_KEY` in `.env.local` and Vercel
3. Re-run the webhook registration: `npx tsx scripts/register-neynar-webhook.ts`
   - This creates a new webhook under the new account
   - Delete the old webhook in the old Neynar account's dashboard
4. Update `NEYNAR_WEBHOOK_SECRET` with the new secret from step 3
5. Redeploy on Vercel

The `APP_FID` and `APP_SIGNER_PRIVATE_KEY` are tied to the Farcaster account (not Neynar), so those stay the same unless you're also changing which Farcaster account posts casts.

---

## Neynar Credit Usage

Neynar charges credits per API call. The architecture is designed to minimize costs:

| Action | Credits | Notes |
|---|---|---|
| `GET /v2/farcaster/feed/channels` | 4 per cast returned | We avoid this with webhook caching |
| `GET /v2/farcaster/cast/conversation` | 10 per cast returned | Thread drawer polling |
| Data webhook delivery | **100 per event** | HTTP push to your endpoint |
| `POST /v2/farcaster/cast` | 150 | Charged per cast posted |
| `POST/DELETE /v2/farcaster/reaction` | 10 | Per like/recast action |
| Monthly active signer | 20,000/month | Per user who posts casts |

**With webhooks enabled:** A 200-cast/day channel costs ~20,000 credits/day via webhook vs ~230,000 credits/day polling (one user) — and polling cost multiplies per concurrent user while webhook cost stays flat.

**If you hit credit limits:** The app falls back to direct Neynar polling automatically when the Supabase cache is empty (e.g., fresh deploy before the first webhook fires).

See `docs/neynar-credit-optimization.md` for full research and cost breakdown.

---

## Tech Stack

```
Framework:    Next.js 15 (App Router) + React
Styling:      Tailwind CSS v4
Auth:         Sign In With Farcaster (@farcaster/auth-kit)
Farcaster:    Neynar API (read feed, post casts, webhooks)
Database:     Supabase (PostgreSQL)
Music:        Audius API, Sound.xyz GraphQL, Spotify oEmbed,
              SoundCloud Widget API, YouTube IFrame API
Audio:        Native Web Audio (no extra dependencies)
Deployment:   Vercel
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # SIWF + session endpoints
│   │   ├── chat/           # messages, send, hide, thread, react
│   │   ├── music/          # metadata fetching (artwork, title, artist)
│   │   └── webhooks/
│   │       └── neynar/     # Receives cast.created from Neynar
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/               # ChatRoom, Message, MessageList, ComposeBar,
│   │                       # ThreadDrawer, Sidebar, SignerConnect
│   └── music/              # GlobalPlayer, MusicEmbed, MusicSidebar,
│                           # MusicQueueTrackCard, Scrubber, PlayerButtons
├── hooks/
│   ├── useChat.ts          # Polling + send (30s interval, visibility-aware)
│   ├── useMusicQueue.ts    # Extracts music URLs from channel messages
│   ├── useAuth.ts
│   └── useMobile.ts
├── lib/
│   ├── auth/               # Session (iron-session)
│   ├── db/                 # Supabase client
│   ├── farcaster/          # Neynar API wrapper
│   ├── gates/              # Allowlist check
│   ├── music/              # isMusicUrl, findMusicEmbed, formatDuration
│   └── validation/         # Zod schemas
├── providers/
│   └── audio/              # AudioProviders stack (PlayerProvider,
│                           # HTMLAudio, SoundCloud, YouTube, Spotify)
└── types/
    ├── index.ts            # Cast, CastEmbed, QuotedCastData, etc.
    └── music.ts            # TrackType, TrackMetadata, AudioController

scripts/
├── setup-database.sql          # Run first in Supabase SQL Editor
├── add-channel-casts-table.sql # Run second — webhook cache table
├── register-neynar-webhook.ts  # Run once to create Neynar webhook
└── generate-wallet.ts          # Generate APP_SIGNER_PRIVATE_KEY

docs/
└── neynar-credit-optimization.md  # Full Neynar cost research
```

---

## Music Platforms Supported

| Platform | Detection | Metadata | Playback |
|---|---|---|---|
| SoundCloud | URL pattern (2+ path segments) | oEmbed (no key) | Widget API |
| Audius | URL pattern (2+ path segments) | Audius API (no key) | HTML5 Audio (stream URL) |
| Spotify | URL pattern | oEmbed (no key) | IFrame API |
| YouTube | URL pattern | oEmbed (no key) | IFrame API |
| Sound.xyz / Zora | URL pattern | GraphQL | HTML5 Audio |
| Direct audio | .mp3 .wav .ogg etc | Filename | HTML5 Audio |

---

## Research

All research is in the `docs/` folder and `research/` folder.

| Doc | Topic |
|---|---|
| `docs/neynar-credit-optimization.md` | Neynar API costs, webhooks vs polling, credit breakdown |
| `research/03-music-integration/` | Music APIs, audio players, track schema |
| `research/15-mvp-spec/` | Locked MVP spec, user flow, file structure |

---

## Reference Repos (Architecture Inspiration)

| Repo | License | What We Borrowed |
|---|---|---|
| [Coop-Records/sonata](https://github.com/Coop-Records/sonata) | MIT | Audio provider architecture, PlayerProvider reducer |
| [stephancill/nook](https://github.com/stephancill/nook) | MIT | Content-type detection for embeds |
| [farcasterxyz/protocol](https://github.com/farcasterxyz/protocol) | MIT | Protocol spec |

---

## Vision

ZAO OS will evolve from a gated chat client into a full music-social network:

1. **MVP** — Gated chat, music playback, quote casts ← *current*
2. **Layer 2** — Reputation (Respect tokens), ZIDs
3. **Layer 3** — Music feed, collections, artist profiles
4. **Layer 4** — On-chain identity, EAS attestations
5. **Layer 5** — AI personalization, taste profiles
6. **Layer 6** — Decentralized infrastructure (Quilibrium)
