# Member Profiles Enhancement — Design Spec

> **Date:** March 25, 2026
> **Status:** Approved
> **Goal:** Surface all available data on member profiles, add social sharing, enable self-editing

---

## Current State

`/members` — public directory grid showing PFP, name, ZID, tier, respect, category
`/members/[username]` — public profile showing respect, fractals, platforms, completeness

Both public (no auth). API merges users + respect_members + community_profiles + Neynar.

## Batch 1: Display Existing Data (Quick — all data already in API)

### 1.1 Cover image hero banner
- `artistProfile.coverImageUrl` returned by API but not shown on profile page
- Display as full-width hero behind the PFP section (with gradient overlay)

### 1.2 Category badge + Featured badge
- `artistProfile.category` (musician, producer, developer, etc.) — show as colored badge
- `artistProfile.isFeatured` — gold "Featured" star badge

### 1.3 Respect breakdown
- API returns: fractal, event, hosting, bonus, onchainOG, onchainZOR
- Currently only shows total + fractal count + combined on-chain
- Add 6-item breakdown grid: Fractal | Events | Hosting | Bonus | OG On-chain | ZOR On-chain

### 1.4 Role badge
- API returns role (admin, moderator, member, beta)
- Show admin/moderator badges next to name

### 1.5 Real name + Discord + all ENS names
- `realName` returned but not shown — display under display name if set
- `platforms.discord` returned but not rendered — add to platforms section
- `ensNames` map returned with all resolved names — show all, not just primary

### 1.6 Last active indicator
- `lastActiveAt` returned — show "Active 2h ago" or "Last seen Mar 20" below bio

### Files to modify:
- `src/app/members/[username]/page.tsx` — all UI changes in one file

---

## Batch 2: WaveWarZ + Missing Platform Links

### 2.1 WaveWarZ stats card
- Look up `wavewarz_artists` by Solana wallet or FID in the member API
- Display: wins, losses, total volume (SOL), win streak
- Link to WaveWarZ profile

### 2.2 Additional platform links from community_profiles
- TikTok, YouTube, Apple Music, Amazon Music, YouTube Music, Twitch
- Merge community_profiles social fields into the API response
- Display in platforms section

### Files to modify:
- `src/app/api/members/[username]/route.ts` — add WaveWarZ lookup + community_profiles socials
- `src/app/members/[username]/page.tsx` — render new data

---

## Batch 3: OG Images + Self-Edit

### 3.1 OG image generation
- Add `generateMetadata` to profile page for dynamic title/description
- Create `/api/og/member/[username]` using `@vercel/og` for shareable card
- Card shows: PFP, name, ZID, respect score, category, "ZAO OS Member"

### 3.2 Self-edit profile
- New `/api/users/profile` PATCH fields: biography, category, website, tags
- Edit button on own profile page
- Inline edit form or link to settings

### 3.3 Cover image upload
- Supabase Storage bucket for profile images
- Upload UI on own profile
- Resize/crop before upload

### Files to create:
- `src/app/api/og/member/[username]/route.tsx` — OG image generation
- `src/app/members/[username]/edit/page.tsx` — self-edit form

---

## Batch 4: Platform-Inspired Features (Future)

- Song submissions grid on profile
- Collector/supporter relationships
- Activity timeline (recent casts, proposals, fractals)
- Contribution radar chart
- Profile verification badges

---

## Implementation Order

| Batch | What | Effort | Files |
|-------|------|--------|-------|
| **1** | Display existing data (cover, category, breakdown, role, real name, ENS, discord, last active) | 30 min | 1 file |
| **2** | WaveWarZ stats + missing platform links | 1 hr | 2 files |
| **3** | OG images + self-edit + cover upload | 3-4 hrs | 3-4 files |
| **4** | Platform-inspired features | Future | Multiple |
