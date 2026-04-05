# 110 — Community Directory & CRM for ZAO OS

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Replace the Webflow CRM at thezao.com/community with a powerful, on-chain enriched member directory built natively in ZAO OS

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Replace Webflow CRM** | Import 49 members from Webflow CSV into Supabase `community_profiles` table. ZAO OS becomes the source of truth. |
| **Directory page** | `/directory` — grid of member cards with cover photos, bios, social icons, categories, Respect scores |
| **Individual profiles** | `/directory/[slug]` — full profile page with cover image, bio, all social links, music embeds, on-chain stats |
| **Data sources** | 3 layers: Webflow CSV (imported once), Supabase users table (live), Neynar API (Farcaster enrichment) |
| **On-chain enrichment** | Show Respect tokens, WaveWarZ stats, Hats roles, Solana wallet on profiles |
| **CRM features** | Tags (admin-managed), member categories, engagement scoring (auto-calculated from activity), admin notes |
| **Engagement score** | Calculated from: casts posted + votes cast + proposals created + songs submitted + socials connected + Respect held |
| **Search & filter** | Filter by category (musician/developer/artist), by social platform, by engagement score, full-text search |
| **Shareable profiles** | Each member gets an OG image-ready `/directory/[slug]` page — shareable on Farcaster, X, anywhere |

---

## Part 1: Current State

### Webflow CRM (thezao.com/community)

- 49 members in CSV export
- Fields: Name, Slug, Cover Image, Thumbnail, Biography (HTML), Category, Website, Instagram, Twitter, TikTok, Spotify, YouTube, Apple Music, Amazon Music, YouTube Music, Twitch, Embed
- Individual profiles at `/community/[slug]` — shows name, category, "Go To Website" button, photo
- **Problems:** Manual data entry, images don't fit well, no on-chain data, no search, no engagement metrics, separate from ZAO OS

### ZAO OS Current Profile Infrastructure

- `ProfileDrawer` (`src/components/chat/ProfileDrawer.tsx`) — slide-out panel showing Farcaster data, activity stats (casts/likes/recasts/replies), music tracks, Bluesky handle, Hat badges
- `FollowerCard` (`src/components/social/FollowerCard.tsx`) — compact card with avatar, name, follow button, follower counts
- `/api/members/profile` — fetches member data from Supabase + Neynar
- `/api/users/[fid]` — returns user data by FID
- Social columns recently added: `x_handle`, `instagram_handle`, `soundcloud_url`, `spotify_url`, `audius_handle`
- Respect scores available via `/api/respect`
- WaveWarZ stats available via `/api/wavewarz/artists`

---

## Part 2: Database Schema

### `community_profiles` — Rich member profiles (imported from Webflow + editable)

```sql
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  fid INTEGER UNIQUE,                -- linked Farcaster FID (matched from users table)
  user_id UUID,                      -- linked to users table

  -- Display
  cover_image_url TEXT,              -- hero/banner image
  thumbnail_url TEXT,                -- avatar/profile pic
  biography TEXT,                    -- rich text bio (HTML stripped from Webflow import)
  category TEXT NOT NULL DEFAULT 'musician',  -- musician, developer, artist, producer, songwriter, dj, other

  -- Socials (mirrors users table but for non-ZAO-OS members too)
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  tiktok TEXT,
  spotify TEXT,
  youtube TEXT,
  apple_music TEXT,
  amazon_music TEXT,
  youtube_music TEXT,
  twitch TEXT,
  soundcloud TEXT,
  audius TEXT,
  farcaster_username TEXT,
  bluesky TEXT,

  -- CRM fields (admin-managed)
  tags TEXT[] DEFAULT '{}',          -- admin tags: 'og', 'active', 'featured', 'top-contributor', etc
  admin_notes TEXT,                  -- private admin notes (not shown to members)
  is_featured BOOLEAN DEFAULT false, -- show on homepage or featured section
  is_notable BOOLEAN DEFAULT false,  -- notable member flag (from Webflow "Notable Home Page")

  -- Engagement (auto-calculated by cron or on-demand)
  engagement_score INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON community_profiles(slug);
CREATE INDEX ON community_profiles(category);
CREATE INDEX ON community_profiles(fid) WHERE fid IS NOT NULL;
CREATE INDEX ON community_profiles(engagement_score DESC);
CREATE INDEX ON community_profiles USING gin(tags);
```

---

## Part 3: Engagement Score Formula

Auto-calculated from available data. Higher = more active/valuable community member.

| Signal | Points | Source |
|--------|--------|--------|
| Has Farcaster account | +10 | users.fid |
| Has Respect tokens | +1 per Respect point | /api/respect |
| Casts posted (in ZAO channels) | +1 per cast | Supabase cast cache |
| Proposals created | +5 per proposal | proposals table |
| Votes cast | +2 per vote | proposal_votes table |
| Songs submitted | +3 per submission | music_submissions table |
| Socials connected | +2 per platform | users social columns |
| Has WaveWarZ stats | +10 if linked | wavewarz_artists.zao_fid |
| Power badge on Farcaster | +15 | Neynar power_badge |
| Has Bluesky connected | +5 | users.bluesky_handle |
| Neynar user score | +score (0-1 * 10) | Neynar experimental score |

**Max theoretical:** ~200+ for a highly active member with all platforms connected.

---

## Part 4: CSV Import Script

Map Webflow CSV columns to `community_profiles`:

| CSV Column | DB Column |
|-----------|-----------|
| Name | name |
| Slug | slug |
| Cover Image | cover_image_url |
| Thumbnail Image | thumbnail_url |
| Biography | biography (strip HTML tags) |
| Category | category |
| Notable Home Page | is_notable |
| Website | website |
| Instagram | instagram |
| Twitter | twitter |
| Tik Tok | tiktok |
| Spotify Profile | spotify |
| Youtube Profile | youtube |
| Apple Music | apple_music |
| amazon music | amazon_music |
| youtube music | youtube_music |
| Twitch Link | twitch |

After import, match names to existing ZAO OS users by username/display_name to link `fid` and `user_id`.

---

## Part 5: /directory Page Design

### Grid View (default)

```
[Search bar] [Filter: All | Musicians | Developers | Artists | Producers]
[Sort: Engagement | Name | Recent | Respect]

[Card] [Card] [Card]
[Card] [Card] [Card]
...
```

Each card shows:
- Cover image as background (or gradient fallback)
- Thumbnail/avatar overlaid
- Name
- Category badge
- Social icons row (only filled platforms)
- Engagement score bar or Respect badge
- "Featured" star if is_featured

### /directory/[slug] Individual Page

```
[Cover image banner]
  [Avatar]
  [Name]                    [Category badge]
  [Bio paragraph]

  [Socials row — all platforms with icons + links]

  [On-chain stats row]
    Respect: 450 | WaveWarZ: 8W-3L | Role: Curator (Hat)

  [Music section — embedded Spotify/SoundCloud/YouTube players]

  [Activity — recent casts, proposals, votes]

  [Share button — cast this profile to Farcaster]
```

OG metadata for social sharing:
```html
<meta property="og:title" content="Stilo — ZAO Community" />
<meta property="og:description" content="Musician | 450 Respect | Member since 2024" />
<meta property="og:image" content="/api/og/directory/stilo" />
```

---

## Part 6: API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/directory` | GET | List profiles (paginated, filterable, searchable) |
| `/api/directory/[slug]` | GET | Single profile with enriched data |
| `/api/directory/import` | POST | Admin: import from CSV |
| `/api/directory/engagement` | POST | Admin/Cron: recalculate engagement scores |
| `/api/directory/tags` | PATCH | Admin: update tags on a profile |

---

## Part 7: Data Enrichment Pipeline

When rendering a profile, merge data from 3 sources:

```
community_profiles table (static: bio, images, Webflow data)
  + users table (live: social handles, wallet, settings)
  + Neynar API (live: follower count, power badge, verified_accounts)
  + Respect API (live: on-chain Respect score)
  + WaveWarZ API (live: battle stats if Solana wallet linked)
  + Hats API (live: current roles)
```

The enrichment happens server-side in the `/api/directory/[slug]` route. Cache for 5 minutes to avoid hammering APIs.

---

## Part 8: CRM Admin Features

### Tags (admin-only)

Admins can tag members with custom labels:
- `og` — original/founding member
- `active` — consistently active
- `featured` — show in featured section
- `top-contributor` — high engagement
- `newcomer` — joined recently
- `at-risk` — was active, now dormant
- Custom tags as needed

Tags stored as `TEXT[]` in Postgres — filterable via `@>` operator.

### Admin Notes

Private notes visible only to admins. Not shown on public profiles. Stored in `admin_notes` column.

### Engagement Dashboard (admin view)

Table view showing all members sorted by engagement score, with:
- Score trend (up/down arrow)
- Last active date
- Tags
- Quick actions: tag, feature, add note

---

## Part 9: Migration from Webflow

1. Run import script to load CSV into `community_profiles`
2. Match members to ZAO OS users by name/username
3. For matched members: link `fid` and `user_id`, sync social handles bidirectionally
4. For unmatched members: they exist as "legacy" profiles (visible in directory but not linked to ZAO OS accounts yet)
5. When a legacy member joins ZAO OS, auto-match by name and link
6. Eventually: redirect thezao.com/community to zaoos.com/directory

---

## Part 10: Comparison to Webflow CRM

| Feature | Webflow CRM | ZAO OS Directory |
|---------|-------------|------------------|
| Member count | 49 | 100+ (all ZAO OS users + legacy) |
| On-chain data | None | Respect, WaveWarZ, Hats, wallets |
| Search | None | Full-text + filters |
| Engagement scoring | None | Auto-calculated from 10+ signals |
| Social links | Manual entry | Auto-imported from Farcaster + manual |
| Music embeds | Basic iframe | Spotify/SoundCloud/YouTube players |
| Admin tools | Webflow CMS editor | Tags, notes, engagement dashboard |
| Shareable profiles | Basic | OG image + Farcaster cast button |
| Update frequency | Manual | Real-time (linked to ZAO OS) |
| Cost | Webflow plan | $0 (Supabase) |

---

## Sources

- [ZAO Webflow Community](https://www.thezao.com/community) — current 49-member CRM
- [Webflow CSV Export](local file) — 25 columns per member, HTML bios, social links
- [NextCRM](https://github.com/pdovhomilja/nextcrm-app) — Open source CRM on Next.js 16 + React 19 + PostgreSQL
- [Airstack Farcaster Enrichment](https://docs.airstack.xyz/airstack-docs-and-faqs/farcaster/) — On-chain data enrichment for Farcaster profiles
- [Water & Music](https://www.waterandmusic.com/the-state-of-music-web3-tools-for-artists/) — Music/web3 tools landscape
- ZAO OS Codebase: `src/components/chat/ProfileDrawer.tsx`, `src/components/social/FollowerCard.tsx`, `src/app/api/members/profile/`, `src/app/api/users/socials/`
- Doc 107 — Social connections (X auto-import, settings UI)
- Doc 20 — Followers/following feed (existing social patterns)
