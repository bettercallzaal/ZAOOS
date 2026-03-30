# Fork ZAO OS

> **Turn this into your community's hub in under an hour.**
> Works with any AI coding agent (Claude Code, Cursor, Copilot, Windsurf) or just a human with a terminal.

ZAO OS is a gated, music-first social client built on Farcaster. Everything community-specific lives in **one file** — [`community.config.ts`](./community.config.ts). Change that file, set your env vars, run the database scripts, and deploy. You have your own community hub.

---

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | 22+ | Runtime |
| **npm** | 10+ | Package manager |
| **Supabase** | Free tier | PostgreSQL database with RLS + Realtime |
| **Neynar** | Free tier (1000 casts/day) | Farcaster API — reading/writing casts, user data |
| **Vercel** | Free tier | Deployment (or any Node.js host) |

Optional services (enable as needed):
- **Alchemy** — ENS resolution, NFT discovery (free: 30M compute units/month)
- **Bluesky** — cross-posting to AT Protocol
- **X/Twitter** — cross-posting approved governance proposals
- **PostHog** — analytics
- **Perspective API** — AI content moderation
- **Snapshot** — gasless governance polls
- **Arweave** — permanent music storage + NFTs

---

## Step 1: Clone & Install

```bash
git clone https://github.com/bettercallzaal/zaoos.git my-community
cd my-community
npm install
```

The `postinstall` script automatically patches dependencies and copies XMTP WASM files.

---

## Step 2: Edit `community.config.ts`

This is the **only file you must change** to rebrand the entire app. Open it and update each section:

### Branding

```typescript
name: 'YOUR COMMUNITY',           // Appears in nav, titles, meta tags
tagline: 'Your tagline here',     // Shown on landing page
colors: {
  primary: '#f5a623',              // Accent color (buttons, links, highlights)
  primaryHover: '#ffd700',         // Hover state for primary
  background: '#0a1628',           // Page background (dark theme)
  surface: '#0d1b2a',             // Card/panel backgrounds
  surfaceLight: '#1a2a3a',        // Elevated surfaces (modals, dropdowns)
},
```

### Farcaster

```typescript
farcaster: {
  appFid: 12345,                   // Your app's Farcaster ID (from Neynar dashboard)
  channels: ['your-channel'],      // Farcaster channels to display as chat rooms
  defaultChannel: 'your-channel',  // Which channel loads first
},
```

### Admin Access

```typescript
adminFids: [12345],                // Farcaster IDs with admin privileges
adminWallets: [],                  // Ethereum addresses with admin privileges (optional)
```

### Voice Channels

```typescript
voiceChannels: [
  { id: 'general', name: 'General', emoji: '💬', description: 'Main hangout' },
  // Add/remove/rename as needed — these appear in Spaces
],
```

### Contracts (Optional)

If your community has on-chain tokens or governance, update these. Otherwise leave them — features gracefully degrade when contracts aren't configured.

```typescript
respect: {
  ogContract: '0x...',    // Your ERC-20 reputation token (Optimism)
  zorContract: '0x...',   // Your ERC-1155 reputation token (Optimism)
  // ...
},
zounz: {
  tokenContract: '0x...', // Your Nouns Builder DAO token (Base)
  // ...
},
snapshot: {
  space: 'your.eth',      // Your Snapshot space for gasless polls
  // ...
},
```

### Partners & Navigation

Update `partners` array with your ecosystem links, and `pillars` to rename navigation tabs.

### Arweave (Optional)

If you want permanent music storage and NFTs:

```typescript
arweave: {
  appName: 'YOUR-APP',            // Tag on Arweave transactions
  // ...other settings have sensible defaults
},
```

---

## Step 3: Set Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in values. The env file is organized by priority:

### Required (app won't work without these)

| Variable | How to Get It |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same location |
| `SUPABASE_SERVICE_ROLE_KEY` | Same location (keep secret!) |
| `NEYNAR_API_KEY` | [neynar.com](https://neynar.com) → Create app → API key |
| `NEXT_PUBLIC_SIWF_DOMAIN` | Your domain (e.g., `myapp.com`) |
| `SESSION_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `APP_FID` | Your app's Farcaster ID (same as `farcaster.appFid` in config) |
| `APP_SIGNER_PRIVATE_KEY` | Generate: `npx tsx scripts/generate-wallet.ts` |

### Optional (enable features incrementally)

Everything else in `.env.example` is optional. Each variable has a comment explaining what feature it enables. Add them as you need the features.

---

## Step 4: Set Up the Database

Create a new Supabase project, then run these SQL scripts **in order** in the SQL Editor:

### Core tables (run these first)

```
scripts/setup-database.sql          -- base schema + RLS policies
scripts/create-users-table.sql      -- user accounts
scripts/add-channel-casts-table.sql -- cached Farcaster casts
scripts/create-proposals.sql        -- governance proposals
scripts/create-notifications.sql    -- notification system
scripts/create-respect-tables.sql   -- reputation tracking
scripts/create-streaks-tables.sql   -- engagement streaks
scripts/create-track-of-day.sql     -- daily track nominations
```

### Feature tables (run as needed)

```
scripts/migrations/applied/create-music-library.sql       -- music library + playlists
scripts/migrations/applied/add-song-likes.sql             -- song likes
scripts/migrations/applied/add-song-reactions.sql         -- track reactions
scripts/migrations/applied/add-song-comments.sql          -- waveform comments
scripts/migrations/applied/add-collaborative-playlists.sql -- collaborative playlists
scripts/migrations/applied/add-poll-config.sql            -- admin poll configuration
scripts/migrations/applied/create-respect-transfers.sql   -- on-chain transfer history
scripts/migrations/applied/add-fulltext-search.sql        -- full-text search indexes
scripts/migrations/applied/create-moderation-log.sql      -- moderation audit log
scripts/migrations/applied/add-publishing-columns.sql     -- cross-platform publishing
scripts/migrations/applied/add-member-crm-columns.sql     -- member CRM fields
scripts/migrations/applied/add-submission-status.sql      -- music submission workflow
scripts/migrations/applied/add-proposal-x-columns.sql     -- X/Twitter cross-post tracking
scripts/migrations/applied/fix-proposal-categories-v2.sql -- proposal category fixes
```

### Additional setup scripts

```
scripts/setup-connected-platforms.sql  -- platform connection storage
scripts/setup-broadcast-targets.sql    -- cross-posting targets
scripts/setup-push-subscriptions.sql   -- push notification subscriptions
scripts/setup-rooms-tables.sql         -- voice/listening rooms
```

---

## Step 5: Generate App Wallet

ZAO OS uses a dedicated signing wallet for Farcaster actions (posting casts, reactions). **Never use a personal wallet.**

```bash
npx tsx scripts/generate-wallet.ts
```

This outputs a private key. Add it to `.env.local` as `APP_SIGNER_PRIVATE_KEY`.

Then register the signer with Neynar — this happens automatically when the first user signs in via the app.

---

## Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see your community name and branding.

### Verify your setup

- [ ] Landing page shows your community name and colors
- [ ] "Sign In With Farcaster" button appears
- [ ] After signing in, the chat feed loads with your configured channels
- [ ] Admin panel accessible at `/admin` for configured admin FIDs

---

## Step 7: Deploy

### Vercel (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bettercallzaal/zaoos&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEYNAR_API_KEY,SESSION_SECRET,APP_FID,APP_SIGNER_PRIVATE_KEY,NEXT_PUBLIC_SIWF_DOMAIN)

Or manually:

```bash
npm run build        # verify build succeeds
vercel               # deploy (follow prompts)
```

Set all env vars in Vercel dashboard → Settings → Environment Variables.

### Other platforms

ZAO OS is a standard Next.js 16 app. Deploy anywhere that supports Node.js 22+:
- Railway, Render, Fly.io, AWS Amplify, Cloudflare Pages, self-hosted

---

## Step 8: Post-Deploy Setup

1. **Register Neynar webhook** — receives cast events for your channels:
   ```bash
   npx tsx scripts/register-neynar-webhook.ts
   ```

2. **Seed voice channels** (optional):
   ```bash
   npx tsx scripts/seed-voice-channels.ts
   ```

3. **Import existing members** (optional) — from CSV:
   ```bash
   npx tsx scripts/import-community-csv.ts --file members.csv
   ```

4. **Set up Alchemy webhooks** (optional) — for auto-syncing respect token transfers:
   - Create webhooks in Alchemy dashboard pointing to `https://yourdomain.com/api/webhooks/alchemy`

---

## What You Get

Once deployed, your community has:

| Feature | Description |
|---------|-------------|
| **Gated social feed** | Discord-style chat on Farcaster channels with reactions, threads, search |
| **Encrypted DMs** | E2E encrypted messaging via XMTP (1-on-1 + groups) |
| **9-platform music player** | Spotify, SoundCloud, YouTube, Audius, Sound.xyz, Apple Music, Tidal, Bandcamp, generic |
| **Community radio** | Audius-powered stations with continuous playback |
| **Governance** | Three-tier: on-chain proposals + Snapshot polls + community proposals |
| **Reputation system** | On-chain respect tokens with weighted voting |
| **Member profiles** | Public directory with ENS resolution, badges, activity stats |
| **Cross-posting** | Auto-publish to Farcaster + Bluesky + X |
| **Admin panel** | User management, moderation, config, data import |
| **AI moderation** | Content safety scoring via Perspective API |
| **Mobile-first** | Full MediaSession, haptics, Wake Lock, swipe gestures |

---

## Customization Beyond Config

### Adding Farcaster channels

Add channel names to `farcaster.channels` in `community.config.ts`. They appear as chat rooms automatically.

### Changing the theme

Update `colors` in `community.config.ts`. The app uses Tailwind CSS v4 — for deeper theme changes, edit `src/app/globals.css`.

### Adding/removing features

Features are modular. Each has its own API routes in `src/app/api/[feature]/` and components in `src/components/[feature]/`. Remove a feature by:
1. Removing its nav entry from `pillars` in config
2. Removing the route group from `src/app/(auth)/[feature]/`

### Adding ecosystem partners

Update the `partners` array in config. Partners appear on the `/ecosystem` page.

### Governance configuration

- **Snapshot polls:** Change `snapshot.space` and `weeklyPollChoices` in config
- **On-chain proposals:** Deploy your own Nouns Builder DAO and update `zounz` in config
- **Community proposals:** Work out of the box — respect-weighted voting using your configured contracts

---

## Architecture Overview

```
community.config.ts        <-- YOUR BRANDING + CHANNELS + CONTRACTS
.env.local                 <-- YOUR API KEYS + SECRETS
│
├── src/app/               Next.js App Router
│   ├── (auth)/            Protected routes (chat, governance, admin, etc.)
│   ├── api/               121 route handlers
│   └── page.tsx           Landing page
├── src/components/        React components by feature
├── src/hooks/             16+ custom hooks
├── src/lib/               Utilities by domain
├── src/providers/         Audio providers, PostHog
└── scripts/               Database setup, wallet generation, imports
```

### Key architectural decisions

- **Auth:** iron-session (encrypted httpOnly cookies, 7-day TTL)
- **Database:** Supabase PostgreSQL with Row Level Security on all tables
- **Social:** Farcaster (public casts) + XMTP (encrypted DMs)
- **State:** React Query — no Redux/Zustand
- **Styling:** Tailwind CSS v4, dark theme, mobile-first
- **Validation:** Zod on every API route
- **Music:** 9 platform providers, crossfade engine, binaural beats via Web Audio API

---

## Troubleshooting

### "Sign in failed" on first attempt
The app needs to register a signer with Neynar on first use. If it fails, check that `APP_FID`, `APP_SIGNER_PRIVATE_KEY`, and `NEYNAR_API_KEY` are set correctly.

### Database errors
Make sure you ran the core SQL scripts in order. The `setup-database.sql` script creates base tables that others depend on.

### Build fails with missing env vars
The build requires at minimum: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SIWF_DOMAIN`. Other vars can be empty strings during build.

### XMTP not connecting
XMTP requires a wallet connection. Users need to connect their wallet on the Settings page before DMs work. The WASM files are copied during `npm install` via postinstall.

### Music embeds not loading
Each platform has its own embed strategy. Spotify/YouTube/SoundCloud use oEmbed. Audius uses their API directly. If a specific platform isn't working, check browser console for CORS or CSP errors.

---

## AI Agent Instructions

If you're an AI coding agent setting up a fork:

1. Read this file first (you're doing it)
2. Read `community.config.ts` for the full config schema
3. Read `AGENTS.md` for codebase conventions and patterns
4. Ask the user for: community name, Farcaster channel(s), admin FID(s), color scheme
5. Update `community.config.ts` with their values
6. Guide them through env var setup (Step 3)
7. Run database scripts (Step 4)
8. Test locally (Step 6)
9. Deploy (Step 7)

The entire fork process should take 30-60 minutes for a human, or a single conversation with an AI agent.

---

## License

MIT — fork it, ship it, make it yours.
