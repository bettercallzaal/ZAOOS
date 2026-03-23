# Music Library & Playlisting System — Design Spec

> **Date:** March 23, 2026
> **Status:** Approved
> **Goal:** Persistent song library that accumulates all music shared in ZAO, with playlists, TOTD integration, and sidebar browsing

---

## 1. Problem

Music in ZAO OS is ephemeral. Songs exist in chat messages (extracted at runtime), song submissions (per-channel), TOTD nominations, and radio playlists (Audius API). There's no persistent library — tracks vanish when messages scroll out, there's no way to browse all music ever shared, and playlists don't exist.

## 2. Solution

One `songs` table as the single source of truth for all music. Every music link that enters ZAO OS — from any source — gets upserted into this table. Playlists (personal + community + auto-generated) reference songs by ID. The MusicSidebar gains Library/Queue/Playlists tabs and a TOTD section.

## 3. Database Schema

### 3.1 Songs table

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN (
    'spotify', 'soundcloud', 'youtube', 'audius', 'soundxyz',
    'applemusic', 'tidal', 'bandcamp', 'audio'
  )),
  title TEXT NOT NULL DEFAULT 'Untitled',
  artist TEXT,
  artwork_url TEXT,
  stream_url TEXT,
  duration INTEGER DEFAULT 0, -- seconds
  submitted_by_fid INTEGER,
  source TEXT NOT NULL DEFAULT 'chat' CHECK (source IN (
    'chat', 'submission', 'radio', 'manual', 'totd'
  )),
  tags TEXT[] DEFAULT '{}',
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_songs_platform ON songs (platform);
CREATE INDEX idx_songs_play_count ON songs (play_count DESC);
CREATE INDEX idx_songs_created_at ON songs (created_at DESC);
CREATE INDEX idx_songs_submitted_by ON songs (submitted_by_fid);
CREATE INDEX idx_songs_url ON songs (url);

-- Full-text search on title + artist
ALTER TABLE songs ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(artist, ''))) STORED;
CREATE INDEX idx_songs_search ON songs USING GIN (search_vector);

-- RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read songs" ON songs FOR SELECT USING (true);
-- Insert/update via service_role only (server-side upsert)
```

### 3.2 Playlists tables

```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_fid INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN (
    'personal', 'community', 'totd_archive', 'auto'
  )),
  artwork_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_type ON playlists (type);
CREATE INDEX idx_playlists_created_by ON playlists (created_by_fid);

CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_by_fid INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (playlist_id, song_id)
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks (playlist_id, position);

-- RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read public playlists and own playlists" ON playlists
  FOR SELECT USING (is_public = true OR type IN ('community', 'totd_archive', 'auto'));

ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read playlist tracks" ON playlist_tracks FOR SELECT USING (true);
```

### 3.3 Auto-generated playlists (seeded on first deploy)

```sql
-- TOTD Archive — auto-populated when a Track of the Day is selected
INSERT INTO playlists (id, name, description, created_by_fid, type, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Track of the Day Archive',
  'Every Track of the Day winner',
  0, 'totd_archive', true
) ON CONFLICT (id) DO NOTHING;
```

## 4. Core Library Function

```typescript
// src/lib/music/library.ts

export async function upsertSong(params: {
  url: string;
  platform: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  streamUrl?: string;
  duration?: number;
  submittedByFid?: number;
  source: 'chat' | 'submission' | 'radio' | 'manual' | 'totd';
  tags?: string[];
}): Promise<{ id: string; isNew: boolean }>
```

- Upserts on `url` (unique constraint)
- If song exists: bumps `play_count`, updates `last_played_at`
- If new: inserts with full metadata
- Returns song ID + whether it was new

Called from:
- `POST /api/chat/send` — when message contains music link (background, non-blocking)
- `POST /api/music/submissions` — on song submission
- `POST /api/music/library` — explicit add from sidebar paste
- Radio track first play — when Audius track starts
- TOTD nomination — when song is nominated

## 5. API Routes

### 5.1 Library

**`GET /api/music/library`**
- Query params: `?search=term&platform=spotify&sort=recent|popular|played&limit=50&offset=0`
- Returns: `{ songs: Song[], total: number }`

**`POST /api/music/library`**
- Body: `{ url: string }` — resolves metadata via existing `/api/music/metadata`, upserts to songs
- Returns: `{ song: Song, isNew: boolean }`

**`POST /api/music/library/play`**
- Body: `{ songId: string }` — increments play_count + updates last_played_at
- Fire-and-forget from client on each play

### 5.2 Playlists

**`GET /api/music/playlists`**
- Query params: `?type=personal|community|all`
- Returns: `{ playlists: Playlist[] }` — includes track count

**`POST /api/music/playlists`**
- Body: `{ name, description?, isPublic? }`
- Creates personal playlist

**`GET /api/music/playlists/[id]`**
- Returns: `{ playlist: Playlist, tracks: Song[] }`

**`POST /api/music/playlists/[id]/tracks`**
- Body: `{ songId: string }`
- Adds song to playlist at end

**`DELETE /api/music/playlists/[id]/tracks/[songId]`**
- Removes song from playlist

## 6. MusicSidebar Changes

### Layout (top to bottom)

1. **ZAO Radio** — existing start/stop (unchanged)
2. **Track of the Day** — new collapsible section:
   - If today has a winner: show artwork + title + artist + play button
   - If voting open: show "Vote for TOTD" link
   - Expand to show recent TOTD history (last 7 days)
3. **Quick Add** — existing paste input (now also upserts to songs table)
4. **Tab bar** — `Library | Queue | Playlists`
5. **Tab content:**
   - **Library:** Search bar + scrollable song list. Filter by platform. Sort by recent/popular. Each song: artwork, title, artist, play button, add-to-playlist button.
   - **Queue:** Current playback queue (existing behavior).
   - **Playlists:** List of playlists. Tap to expand track list. "New Playlist" button. Auto-playlists at top (TOTD Archive, Most Played, Recently Added).

### Song card in library

```
┌──────────────────────────────────┐
│ [art] Title                  [▶] │
│       Artist · Spotify    [+📋] │
└──────────────────────────────────┘
```

- [▶] plays the song immediately
- [+📋] opens "Add to playlist" dropdown

## 7. TOTD Changes

Track of the Day nomination now pulls from the song library:
- "Nominate" button searches the songs table (autocomplete by title/artist)
- Can still paste a new URL (which gets added to library first, then nominated)
- Winner auto-added to TOTD Archive playlist
- TOTD section in sidebar shows today's winner without navigating to /music

## 8. How Songs Enter the Library

| Source | Trigger | Automatic? |
|--------|---------|------------|
| Chat message with music link | `POST /api/chat/send` detects music URL | Yes — background upsert |
| Song submission form | `POST /api/music/submissions` | Yes |
| Quick-add in sidebar | `POST /api/music/library` | Yes |
| Radio track played | First play of Audius track | Yes |
| TOTD nomination | Song nominated | Yes |
| Existing song_submissions | One-time migration | Migration script |

## 9. Migration

Backfill the `songs` table from existing data:
- `song_submissions` → upsert all existing submissions
- `music_link_cache` → upsert cached metadata (already has url, title, artist, artwork)
- Radio playlists → upsert on first fetch after migration

Script: `scripts/migrate-songs-library.ts`

## 10. Files

### New
| File | Purpose |
|------|---------|
| `scripts/create-music-library.sql` | songs + playlists + playlist_tracks tables |
| `scripts/migrate-songs-library.ts` | Backfill from song_submissions + music_link_cache |
| `src/lib/music/library.ts` | `upsertSong()`, query helpers |
| `src/app/api/music/library/route.ts` | GET (search/browse) + POST (add song) |
| `src/app/api/music/library/play/route.ts` | POST (increment play count) |
| `src/app/api/music/playlists/route.ts` | GET (list) + POST (create) |
| `src/app/api/music/playlists/[id]/route.ts` | GET (playlist with tracks) |
| `src/app/api/music/playlists/[id]/tracks/route.ts` | POST (add track) + DELETE (remove) |

### Modified
| File | Change |
|------|--------|
| `src/components/music/MusicSidebar.tsx` | Add TOTD section, Library/Queue/Playlists tabs |
| `src/app/api/chat/send/route.ts` | Call `upsertSong()` when message has music link |
| `src/app/api/music/submissions/route.ts` | Call `upsertSong()` on submit |
| `src/components/music/TrackOfTheDay.tsx` | Nomination from library search |

## 11. Implementation Order

1. **Database** — create tables, run migration
2. **Library core** — `upsertSong()` + library API routes
3. **Wire sources** — chat send, submissions, quick-add all call upsertSong
4. **Sidebar UI** — TOTD section + Library/Queue/Playlists tabs
5. **Playlists** — API routes + UI for create/browse/manage
6. **TOTD integration** — nomination from library, auto-archive winner

## 12. Success Criteria

- [ ] Every music link shared in ZAO gets saved to songs table
- [ ] MusicSidebar shows TOTD section with today's winner
- [ ] Library tab shows all songs with search/filter/sort
- [ ] Can create personal playlists and add songs from library
- [ ] TOTD Archive playlist auto-populated with winners
- [ ] Play count tracked — "Most Played" list works
- [ ] Migration backfills existing song_submissions + cache data
