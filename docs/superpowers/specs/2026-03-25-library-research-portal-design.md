# Library — Community Research Portal

> A page where any ZAO member can submit a link, topic, or resource and get an AI-generated summary of what it is and how it could fit into ZAO's mission.

## Overview

The Library page has three sections:
1. **Submit** — form to add a link or topic with optional note and tags
2. **Community Submissions** — feed of all submissions with AI summaries, upvotes, and comments
3. **Deep Research** — browsable index of the 130+ research docs in `research/`

**Route:** `/library` (under `(auth)/` — authenticated members only)
**Nav:** "Library" added as a route under the Tools pillar in community.config.ts
**AI:** Minimax M2.7 called directly from the submit handler (not via HTTP loopback to `/api/chat/minimax`)
**Access:** Any authenticated member can submit, view, upvote, and comment. Results visible immediately.
**Moderation:** Submissions run through Perspective API (`src/lib/moderation/moderate.ts`) before saving.

---

## Submit Flow

### Form Fields
- **URL or Topic** (required) — single text input, auto-detects URL vs freeform text
- **Note** (optional) — brief context on why it's interesting
- **Tags** (optional) — multi-select from: `Music`, `Governance`, `Tech`, `Community`, `AI`, `Business`, `Culture`, `Other`

### On Submit
1. Backend receives single `input` field, detects if URL via regex
2. If URL → fetch page with 5-second timeout, extract OG metadata (title, description, image). Populate `topic` from OG title. Graceful fallback if extraction fails (use URL as topic).
3. Run input + note through Perspective API moderation check
4. Insert entry into `research_entries` with `ai_status: 'pending'`
5. Entry immediately appears in feed with "generating summary..." spinner
6. Minimax called directly (import fetch logic, not HTTP round-trip) with system prompt + content
7. Update entry with `ai_summary` and `ai_status: 'complete'` (or `'failed'` on error)
8. Client polls or re-fetches to pick up the summary

### Minimax System Prompt
```
You are a research assistant for The ZAO — an artist-first decentralized community focused on bringing profit margins, data ownership, and IP rights back to independent artists. ZAO operates on Farcaster and includes governance, music curation, and cross-platform publishing. Summarize this item and explain how it could be relevant to ZAO's mission.
```

### Minimax Integration
Call the Minimax API directly from the submit handler using the same logic as `src/app/api/chat/minimax/route.ts` — Bearer token auth to `MINIMAX_API_URL` with `MINIMAX_MODEL`. No HTTP loopback. Extract the shared Minimax call logic into `src/lib/library/minimax.ts` if needed.

---

## Community Submissions Feed

### Card Layout (each entry)
- Submitter avatar + name + timestamp
- Title (from OG metadata or topic text)
- URL with favicon (if link)
- OG image thumbnail (if available)
- User's note (if provided)
- Tags as colored pills
- **AI Summary** block — visually distinct with subtle border/background. Shows spinner if `ai_status === 'pending'`, error message if `'failed'`
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
| `topic` | text | Freeform text or OG title extracted from URL |
| `note` | text | Nullable — user context |
| `tags` | text[] | Array of tag strings |
| `og_title` | text | Nullable |
| `og_description` | text | Nullable |
| `og_image` | text | Nullable |
| `ai_summary` | text | Nullable — Minimax output |
| `ai_status` | text | `'pending'` / `'complete'` / `'failed'`, default `'pending'` |
| `upvote_count` | int | Default 0, updated via atomic increment/decrement |
| `comment_count` | int | Default 0, updated via atomic increment |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Default now(), updated on ai_summary write |

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

RLS: All tables readable by authenticated users. Writes restricted to own FID. Admin FIDs can delete any entry.

---

## API Routes

### `POST /api/library/submit`
- Zod validate single `input` field + optional note/tags
- Detect URL vs freeform topic
- If URL: fetch page (5s timeout), extract OG meta tags, fallback gracefully
- Run through Perspective API moderation
- Insert entry with `ai_status: 'pending'`
- Call Minimax directly (not HTTP loopback), update entry with summary
- Return created entry
- **Rate limit: 3/min**

### `GET /api/library/entries`
- Query params: `search`, `tag`, `sort` (newest|upvoted), `offset`, `limit` (default 50)
- Returns entries with submitter profile info (join or lookup via Neynar cache)
- **Rate limit: 30/min**

### `POST /api/library/vote`
- Zod: `{ entry_id: uuid }`
- Toggle: insert if not exists, delete if exists
- Atomic increment/decrement `upvote_count` on `research_entries`
- **Rate limit: 15/min**

### `GET /api/library/comments`
- Query param: `entry_id`
- Returns comments with commenter profile info
- **Rate limit: 30/min**

### `POST /api/library/comments`
- Zod: `{ entry_id: uuid, body: string (1-500 chars) }`
- Run body through Perspective API moderation
- Insert comment, atomic increment `comment_count`
- **Rate limit: 10/min**

### `GET /api/library/docs`
- Query params: `search`, `category`
- Returns research doc index entries
- **Rate limit: 30/min**

### `DELETE /api/library/entries`
- Zod: `{ entry_id: uuid }`
- Admin only (check session `isAdmin`)
- Deletes entry and cascading votes/comments
- **Rate limit: 10/min**

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

### Utilities
- `src/lib/library/og-extract.ts` — fetch URL (5s timeout) and parse OG meta tags from HTML
- `src/lib/library/minimax.ts` — direct Minimax API call (shared logic extracted from chat route)

### Reused Patterns
- Tag picker → `SongSubmit.tsx` genre tags
- Comments → proposal comments
- Upvote → song submission votes
- Search → cast search
- Moderation → `src/lib/moderation/moderate.ts`

### No New Dependencies
Everything uses existing stack: React hooks, Tailwind v4, fetch, Zod.

---

## Config Changes

### `community.config.ts`
Add Library as a route under the Tools pillar (not a new top-level pillar):
```typescript
// In tools or navigation config, add:
{ label: 'Library', href: '/library', icon: 'book' }
```

### Middleware Rate Limits (`src/middleware.ts`)
```typescript
if (pathname.startsWith('/api/library/submit')) return { limit: 3, windowMs: MINUTE };
if (pathname.startsWith('/api/library')) return { limit: 30, windowMs: MINUTE };
```

### Zod Schemas (`src/lib/validation/schemas.ts`)
```typescript
const LIBRARY_TAGS = ['Music', 'Governance', 'Tech', 'Community', 'AI', 'Business', 'Culture', 'Other'] as const;

export const librarySubmitSchema = z.object({
  input: z.string().trim().min(1).max(2000),
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

export const libraryDeleteSchema = z.object({
  entry_id: z.string().uuid(),
});
```
