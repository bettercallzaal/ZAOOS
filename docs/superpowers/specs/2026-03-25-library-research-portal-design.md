# Library — Community Research Portal

> A page where any ZAO member can submit a link, topic, or resource and get an AI-generated summary of what it is and how it could fit into ZAO's mission.

## Overview

The Library page has three sections:
1. **Submit** — form to add a link or topic with optional note and tags
2. **Community Submissions** — feed of all submissions with AI summaries, upvotes, and comments
3. **Deep Research** — browsable index of the 130+ research docs in `research/`

**Route:** `/library` (under `(auth)/` — authenticated members only)
**Nav:** "Library" added to community.config.ts with `book` icon
**AI:** Minimax M2.7 via existing `/api/chat/minimax` endpoint
**Access:** Any authenticated member can submit, view, upvote, and comment. Results visible immediately.

---

## Submit Flow

### Form Fields
- **URL or Topic** (required) — single text input, auto-detects URL vs freeform text
- **Note** (optional) — brief context on why it's interesting
- **Tags** (optional) — multi-select from: `Music`, `Governance`, `Tech`, `Community`, `AI`, `Business`, `Culture`, `Other`

### On Submit
1. If URL detected → backend fetches OG metadata (title, description, image) via HTML `<meta>` tag parsing
2. Minimax called with system prompt + extracted content + user note
3. Entry saved to `research_entries` table
4. Immediately appears in feed with "generating summary..." spinner until Minimax completes

### Minimax System Prompt
```
You are a research assistant for The ZAO — an artist-first decentralized community focused on bringing profit margins, data ownership, and IP rights back to independent artists. ZAO operates on Farcaster and includes governance, music curation, and cross-platform publishing. Summarize this item and explain how it could be relevant to ZAO's mission.
```

---

## Community Submissions Feed

### Card Layout (each entry)
- Submitter avatar + name + timestamp
- Title (from OG metadata or topic text)
- URL with favicon (if link)
- OG image thumbnail (if available)
- User's note (if provided)
- Tags as colored pills
- **AI Summary** block — visually distinct with subtle border/background
- Upvote count + toggle button
- Comment count + expand to view/add comments

### Interactions
- **Upvote** — one per member per entry, toggle on/off
- **Comments** — inline comments, same pattern as proposal comments
- **Search** — text search across titles, summaries, notes
- **Filter** — by tag, by "most upvoted", by "newest"
- **Pagination** — load last 50, "Load more" button

---

## Deep Research Section

### Data Source
A `research_docs` Supabase table seeded from `research/README.md` — doc number, title, category, path. Index only, not full content.

### Layout
- Category accordion matching existing groupings (Farcaster, Music, Governance, Identity, AI, Cross-Platform, Infrastructure, etc.)
- Each entry: doc number, title, category
- Search bar to filter across doc titles
- Click → links to GitHub raw file

---

## Database Schema

### `research_entries` — community submissions
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default gen_random_uuid() |
| `fid` | int | Submitter FID |
| `url` | text | Nullable — null if freeform topic |
| `topic` | text | Freeform text or extracted title |
| `note` | text | Nullable — user context |
| `tags` | text[] | Array of tag strings |
| `og_title` | text | Nullable |
| `og_description` | text | Nullable |
| `og_image` | text | Nullable |
| `ai_summary` | text | Nullable — Minimax output |
| `upvote_count` | int | Default 0 |
| `comment_count` | int | Default 0 |
| `created_at` | timestamptz | Default now() |

### `research_entry_votes` — upvotes
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `entry_id` | uuid | FK → research_entries |
| `fid` | int | Voter FID |
| `created_at` | timestamptz | Default now() |

Unique constraint: `(entry_id, fid)`

### `research_entry_comments` — comments
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `entry_id` | uuid | FK → research_entries |
| `fid` | int | Commenter FID |
| `body` | text | Comment content |
| `created_at` | timestamptz | Default now() |

### `research_docs` — deep research index
| Column | Type | Notes |
|--------|------|-------|
| `id` | int | PK — doc number |
| `title` | text | Doc title |
| `category` | text | Topic category |
| `path` | text | e.g. `research/03-music-integration` |
| `github_url` | text | Link to GitHub file |

RLS: All tables readable by authenticated users. Writes restricted to own FID.

---

## API Routes

### `POST /api/library/submit`
- Zod validate input (url/topic required, note optional, tags optional)
- If URL: fetch page, extract OG meta tags
- Call `/api/chat/minimax` internally with system prompt + content
- Insert into `research_entries`
- Return created entry

### `GET /api/library/entries`
- Query params: `search`, `tag`, `sort` (newest|upvoted), `offset`, `limit` (default 50)
- Returns entries with submitter profile info (join or lookup via Neynar cache)

### `POST /api/library/vote`
- Zod: `{ entry_id: uuid }`
- Toggle: insert if not exists, delete if exists
- Update `upvote_count` on `research_entries`

### `GET /api/library/comments`
- Query param: `entry_id`
- Returns comments with commenter profile info

### `POST /api/library/comments`
- Zod: `{ entry_id: uuid, body: string (1-500 chars) }`
- Insert comment, increment `comment_count`

### `GET /api/library/docs`
- Query params: `search`, `category`
- Returns research doc index entries

All routes: session check → Zod validation → try/catch → NextResponse.json

---

## Components

### New Files
- `src/app/(auth)/library/page.tsx` — page shell with three sections
- `src/components/library/SubmitForm.tsx` — URL/topic input, note, tag picker, submit
- `src/components/library/EntryCard.tsx` — single submission card
- `src/components/library/EntryFeed.tsx` — feed with search, filter, sort
- `src/components/library/EntryComments.tsx` — inline comment list + add form
- `src/components/library/DeepResearch.tsx` — category accordion with search

### Utility
- `src/lib/library/og-extract.ts` — fetch URL and parse OG meta tags from HTML

### Reused Patterns
- Tag picker → `SongSubmit.tsx` genre tags
- Comments → proposal comments
- Upvote → song submission votes
- Search → cast search

### No New Dependencies
Everything uses existing stack: React hooks, Tailwind v4, fetch, Zod.

---

## Config Changes

### `community.config.ts`
Add to navigation/pillars:
```typescript
library: { label: 'Library', icon: 'book' },
```

### Zod Schemas (`src/lib/validation/schemas.ts`)
```typescript
const LIBRARY_TAGS = ['Music', 'Governance', 'Tech', 'Community', 'AI', 'Business', 'Culture', 'Other'] as const;

export const librarySubmitSchema = z.object({
  url: z.string().url().optional(),
  topic: z.string().trim().min(1).max(500),
  note: z.string().trim().max(1000).optional(),
  tags: z.array(z.enum(LIBRARY_TAGS)).max(3).optional(),
});

export const libraryCommentSchema = z.object({
  entry_id: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
});

export const libraryVoteSchema = z.object({
  entry_id: z.string().uuid(),
});
```
