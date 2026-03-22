# 107 — Social Connections & X Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Add X/Twitter + other social platform connections to ZAO OS settings, pull X handles directly from Farcaster profiles via Neynar API, clean up the multi-social settings UI

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **X handle source** | Pull from Neynar `verified_accounts` field — already available in `/user/bulk` response. No X API needed just to display handles. |
| **X cross-posting** | Use X API free tier (500 posts/mo, $0) or pay-per-use ($0.01/post). FC2X (open source) is reference implementation. |
| **Settings redesign** | Restructure into 4 sections: Identity, Wallets, Socials, Preferences. Currently all in one "Connections" blob. |
| **Social platforms** | X (auto from Farcaster), Bluesky (already built), Instagram, SoundCloud, Spotify, Audius (manual input for now) |
| **DB columns** | Add `x_handle`, `instagram_handle`, `soundcloud_url`, `spotify_url`, `audius_handle` to users table |
| **Auto-import** | On login/sync, pull `verified_accounts` from Neynar and auto-populate X handle — no manual entry needed |
| **Music links priority** | SoundCloud + Spotify + Audius are the three that matter most for a music community |

---

## Part 1: Getting X Handle from Farcaster (Free, Already Available)

### How It Works

Neynar's `/v2/farcaster/user/bulk` endpoint (which ZAO already calls via `getUserByFid()` in `src/lib/farcaster/neynar.ts:98`) returns a `verified_accounts` array in each user object:

```json
{
  "users": [{
    "fid": 3,
    "username": "dwr",
    "verified_accounts": [
      { "platform": "x", "username": "dwr" }
    ],
    "verified_addresses": {
      "eth_addresses": ["0x..."],
      "sol_addresses": ["..."]
    }
  }]
}
```

**Key insight:** Many Farcaster users already have their X handle linked via the Farcaster protocol's identity verification. ZAO can read this for free — no X API key needed.

### Implementation Plan

1. When a user logs in or visits settings, call `getUserByFid(session.fid)`
2. Extract `verified_accounts.find(a => a.platform === 'x')?.username`
3. Save to `users.x_handle` column
4. Display in settings under Socials section
5. No manual entry needed — it's auto-imported from Farcaster

### What's Already Built

- `src/lib/farcaster/neynar.ts:98` — `getUserByFid()` already calls `/user/bulk`
- `src/app/(auth)/settings/page.tsx` — already fetches user profile from DB
- The response from Neynar includes `verified_accounts` but ZAO doesn't currently extract it
- `verified_addresses` (wallets) IS already extracted and stored

---

## Part 2: X/Twitter Cross-Posting (Optional, Separate Feature)

If ZAO wants to cross-post governance-approved content to X (like it does to Farcaster + Bluesky):

### X API Pricing (2026)

| Tier | Cost | Post Writes | Post Reads | Best For |
|------|------|------------|------------|----------|
| **Free** | $0 | 500/month | ~50/month | ZAO's current volume |
| **Pay-per-use** | $0.01/post | Unlimited | $0.005/read | Scale when needed |
| **Basic** | $200/month | ~50,000/month | ~15,000/month | Overkill for ZAO |

**Recommendation:** Start with Free tier (500 posts/month is plenty for governance-approved content). Upgrade to pay-per-use if volume grows.

### OAuth 2.0 Flow

X requires OAuth 2.0 with PKCE for user-level posting. For posting as @thezao or @wavewarz X account:
- Register app at developer.twitter.com
- Use OAuth 2.0 App Password flow (similar to Bluesky)
- Store tokens in env vars like Bluesky (`ZAO_X_BEARER_TOKEN`)

### Reference: FC2X (Open Source)

[FC2X](https://github.com/fraserbrownirl/xshare) by fraserbrownirl crossposting tool:
- Next.js app with Neynar webhooks + X OAuth 2.0
- Listens for new casts via webhook, auto-posts to X
- Uses `TWITTER_CLIENT_ID` + `TWITTER_CLIENT_SECRET`
- MIT-licensable patterns for ZAO

---

## Part 3: Settings UI Redesign

### Current State

`src/app/(auth)/settings/SettingsClient.tsx` has a single "Connections" section with 6 items:
1. Wallet (EVM)
2. Farcaster (SIWF)
3. Signer (managed)
4. XMTP (messaging)
5. Bluesky (handle + app password)
6. Solana Wallet

Counter shows "X of 6 connected".

### Proposed Restructure: 4 Sections

**1. Identity** (read-only, from Farcaster)
- Display name, username, PFP, bio
- FID, ZID, power badge

**2. Wallets** (connect/disconnect)
- EVM wallet (primary — used for auth)
- Respect wallet (if different)
- Solana wallet (already built)
- Custody address (read-only)
- Verified addresses (from Farcaster)

**3. Socials** (connect/display)
- X/Twitter (auto-imported from Farcaster `verified_accounts`)
- Bluesky (already built — handle + app password)
- Instagram (manual input)
- SoundCloud (manual URL input)
- Spotify (manual URL input)
- Audius (manual handle input)

**4. Messaging & Preferences**
- XMTP connection
- Farcaster signer
- Messaging preferences (auto-join, allow non-ZAO DMs)
- Notification settings

### Connection Counter Update

Current: "X of 6 connected"
New: Show per-section counts or a total across all sections.

---

## Part 4: Database Schema Changes

```sql
-- Add social columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS x_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS audius_handle TEXT;
```

These are all optional, nullable TEXT fields. No foreign keys needed.

### Auto-Import Logic

On login or settings page load:
```typescript
// In settings page.tsx or an auth hook
const neynarUser = await getUserByFid(session.fid);
const xAccount = neynarUser?.verified_accounts?.find(
  (a: { platform: string }) => a.platform === 'x'
);
if (xAccount?.username && !profile.x_handle) {
  // Auto-save X handle from Farcaster
  await supabaseAdmin.from('users')
    .update({ x_handle: xAccount.username })
    .eq('fid', session.fid);
}
```

---

## Part 5: Platform-by-Platform Integration Details

### X/Twitter
- **Source:** Auto from Farcaster `verified_accounts` (free, no API)
- **Display:** Show @handle with link to x.com/{handle}
- **Cross-post:** Optional future feature via X API free tier
- **Effort:** Trivial — just read from Neynar response

### Bluesky
- **Source:** Already built — manual handle + app password
- **Display:** Already shows @handle
- **Cross-post:** Already built (governance publishing)
- **Effort:** None — done

### Instagram
- **Source:** Manual input (no API for reading profiles without business account)
- **Display:** Show @handle with link to instagram.com/{handle}
- **Cross-post:** Not supported (no public API for posting)
- **Effort:** Simple text input + save to DB

### SoundCloud
- **Source:** Manual URL input
- **Display:** Show link with SoundCloud icon
- **Cross-post:** N/A
- **Effort:** URL input + validate format (soundcloud.com/*)
- **Music value:** HIGH — most WaveWarZ artists have SoundCloud

### Spotify
- **Source:** Manual URL input (artist page or profile)
- **Display:** Show link with Spotify icon
- **Cross-post:** N/A (but could embed player in future)
- **Effort:** URL input + validate format (open.spotify.com/*)
- **Music value:** HIGH — streaming metrics are social currency

### Audius
- **Source:** Manual handle input
- **Display:** Show @handle with link to audius.co/{handle}
- **Cross-post:** Audius SDK supports posting (future)
- **Effort:** Handle input + save to DB
- **Music value:** HIGH — decentralized, aligns with ZAO values

### TikTok
- **Source:** Manual handle input
- **Display:** Show @handle with link
- **Cross-post:** No public API
- **Effort:** Low priority — not a music-first platform for ZAO's audience
- **Recommendation:** Skip for now, add later if demand exists

### YouTube
- **Source:** Manual URL input
- **Display:** Show channel link
- **Cross-post:** YouTube API exists but complex
- **Effort:** Low priority for initial build
- **Recommendation:** Skip for now

---

## Part 6: Implementation Priority

### Phase 1: Auto-Import X Handle (1 hour)
1. Add `x_handle` column to users table
2. In settings page server component, call `getUserByFid()` and extract `verified_accounts`
3. Auto-save X handle if found
4. Display in settings UI with link to x.com/{handle}

### Phase 2: Manual Social Inputs (2-3 hours)
1. Add `instagram_handle`, `soundcloud_url`, `spotify_url`, `audius_handle` columns
2. Create `/api/users/socials` route for PATCH updates
3. Add input fields in settings under new "Socials" section
4. Validate formats (URLs for SoundCloud/Spotify, handles for Instagram/Audius)

### Phase 3: Settings UI Restructure (2-3 hours)
1. Split single "Connections" section into 4 sections: Identity, Wallets, Socials, Preferences
2. Move existing items into appropriate sections
3. Update connection counter

### Phase 4: X Cross-Posting (Future — separate spec)
1. Register X developer app
2. Implement OAuth 2.0 flow (reference FC2X)
3. Add X as a cross-post option alongside Bluesky in governance publishing
4. Use free tier (500 posts/month)

---

## Part 7: Profile Display

When viewing a ZAO member's profile (ProfileDrawer or member page), show connected socials:

```
Socials:
  X: @dwr
  Bluesky: @dwr.bsky.social
  SoundCloud: soundcloud.com/luijoseph
  Spotify: open.spotify.com/artist/...
  Audius: @luijoseph
```

This makes ZAO profiles richer and helps members discover each other's music across platforms.

---

## Sources

- [Neynar API — User Bulk Endpoint](https://docs.neynar.com/) — `verified_accounts` field in user objects
- [FC2X — Farcaster to X Crossposting](https://github.com/fraserbrownirl/xshare) — Open source reference for X OAuth 2.0 + Neynar webhooks
- [X API Pricing 2026](https://postproxy.dev/blog/x-api-pricing-2026/) — Free: 500 posts/mo, Pay-per-use: $0.01/post
- [X API Pricing Comparison](https://zernio.com/blog/twitter-api-pricing) — All tiers from $0 to $42K
- ZAO OS Codebase: `src/lib/farcaster/neynar.ts:98` (getUserByFid), `src/app/(auth)/settings/SettingsClient.tsx` (current settings UI)
- Doc 95 — Solana wallet settings (established the multi-wallet pattern)
- Doc 77 — Bluesky cross-posting (established the cross-post pattern)
