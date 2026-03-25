# Library Research Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/library` page where ZAO members can submit links/topics, get Minimax AI summaries of relevance to ZAO, upvote/comment, and browse the deep research library.

**Architecture:** Three-section page (submit form, community feed, deep research index) backed by 4 Supabase tables, 7 API routes, and 6 components. Minimax called directly from submit handler. OG metadata auto-extracted from URLs.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase PostgreSQL + RLS, Minimax M2.7 API, Perspective API moderation, Tailwind v4, Zod validation.

**Spec:** `docs/superpowers/specs/2026-03-25-library-research-portal-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/validation/library-schemas.ts` | Zod schemas for library submit, vote, comment, delete |
| `src/lib/library/og-extract.ts` | Fetch URL with 5s timeout, parse OG meta tags |
| `src/lib/library/minimax.ts` | Direct Minimax API call for AI summaries |
| `src/app/api/library/submit/route.ts` | POST — submit entry, extract OG, call Minimax |
| `src/app/api/library/entries/route.ts` | GET — list entries with search/filter/sort |
| `src/app/api/library/vote/route.ts` | POST — toggle upvote |
| `src/app/api/library/comments/route.ts` | GET + POST — list/add comments |
| `src/app/api/library/docs/route.ts` | GET — deep research index |
| `src/app/api/library/delete/route.ts` | DELETE — admin delete entry |
| `src/components/library/SubmitForm.tsx` | Submit form with URL/topic, note, tags |
| `src/components/library/EntryCard.tsx` | Single submission card |
| `src/components/library/EntryFeed.tsx` | Feed with search, filter, sort |
| `src/components/library/EntryComments.tsx` | Inline comments |
| `src/components/library/DeepResearch.tsx` | Category accordion + search |
| `src/app/(auth)/library/page.tsx` | Page shell combining all sections |
| `scripts/migrations/library-tables.sql` | SQL migration for all 4 tables + RLS |
| `scripts/seed-research-docs.ts` | Script to seed research_docs from research/README.md |

### Modified Files
| File | Change |
|------|--------|
| `src/middleware.ts` | Add rate limits for `/api/library/*` routes |
| `community.config.ts` | Add Library route under Tools |

---

## Task 1: Database Migration

**Files:**
- Create: `scripts/migrations/library-tables.sql`

- [ ] **Step 1: Write the SQL migration**

```sql
-- Library Research Portal tables
-- Run in Supabase SQL editor

-- 1. Community submissions
CREATE TABLE IF NOT EXISTS research_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid int NOT NULL,
  url text,
  topic text NOT NULL,
  note text,
  tags text[] DEFAULT '{}',
  og_title text,
  og_description text,
  og_image text,
  ai_summary text,
  ai_status text NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'complete', 'failed')),
  upvote_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Upvotes (one per member per entry)
CREATE TABLE IF NOT EXISTS research_entry_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES research_entries(id) ON DELETE CASCADE,
  fid int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, fid)
);

-- 3. Comments
CREATE TABLE IF NOT EXISTS research_entry_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES research_entries(id) ON DELETE CASCADE,
  fid int NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Deep research index
CREATE TABLE IF NOT EXISTS research_docs (
  id int PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  path text NOT NULL,
  github_url text NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_entries_created_at ON research_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_entries_upvote_count ON research_entries(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_entry_votes_entry_id ON research_entry_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_research_entry_comments_entry_id ON research_entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_research_docs_category ON research_docs(category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_entries_updated_at
  BEFORE UPDATE ON research_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE research_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_entry_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_entry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_docs ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user (service role bypasses RLS)
CREATE POLICY "read_research_entries" ON research_entries FOR SELECT USING (true);
CREATE POLICY "read_research_entry_votes" ON research_entry_votes FOR SELECT USING (true);
CREATE POLICY "read_research_entry_comments" ON research_entry_comments FOR SELECT USING (true);
CREATE POLICY "read_research_docs" ON research_docs FOR SELECT USING (true);

-- Write: service role only (all writes go through API routes with session checks)
-- No insert/update/delete policies for anon — service role bypasses RLS
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Copy the SQL into the Supabase dashboard SQL editor and execute. Verify all 4 tables created with `\dt` or the Table Editor.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrations/library-tables.sql
git commit -m "feat(library): add database migration for research portal tables"
```

---

## Task 2: Zod Validation Schemas

**Files:**
- Create: `src/lib/validation/library-schemas.ts`

- [ ] **Step 1: Write the schemas**

```typescript
import { z } from 'zod';

export const LIBRARY_TAGS = [
  'Music',
  'Governance',
  'Tech',
  'Community',
  'AI',
  'Business',
  'Culture',
  'Other',
] as const;

export type LibraryTag = (typeof LIBRARY_TAGS)[number];

export const librarySubmitSchema = z.object({
  input: z.string().trim().min(1, 'Please enter a URL or topic').max(2000),
  note: z.string().trim().max(1000).optional(),
  tags: z.array(z.enum(LIBRARY_TAGS)).max(3).optional(),
});

export const libraryVoteSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
});

export const libraryCommentSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
  body: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be 500 characters or less'),
});

export const libraryDeleteSchema = z.object({
  entry_id: z.string().uuid('entry_id must be a valid UUID'),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation/library-schemas.ts
git commit -m "feat(library): add Zod validation schemas"
```

---

## Task 3: OG Metadata Extraction Utility

**Files:**
- Create: `src/lib/library/og-extract.ts`

- [ ] **Step 1: Write the OG extraction utility**

```typescript
export interface OGMetadata {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

const URL_REGEX = /^https?:\/\//i;

export function isUrl(input: string): boolean {
  return URL_REGEX.test(input.trim());
}

/**
 * Fetch a URL and extract Open Graph meta tags.
 * Returns nulls on timeout, error, or missing tags.
 */
export async function extractOGMetadata(url: string): Promise<OGMetadata> {
  const empty: OGMetadata = { ogTitle: null, ogDescription: null, ogImage: null };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ZAO-OS-Library/1.0',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return empty;

    const html = await res.text();
    // Only parse the first 50KB to avoid memory issues on large pages
    const head = html.slice(0, 50_000);

    const ogTitle = extractMetaContent(head, 'og:title')
      ?? extractMetaContent(head, 'twitter:title')
      ?? extractTitle(head);
    const ogDescription = extractMetaContent(head, 'og:description')
      ?? extractMetaContent(head, 'twitter:description')
      ?? extractMetaContent(head, 'description');
    const ogImage = extractMetaContent(head, 'og:image')
      ?? extractMetaContent(head, 'twitter:image');

    return { ogTitle, ogDescription, ogImage };
  } catch {
    return empty;
  }
}

function extractMetaContent(html: string, property: string): string | null {
  // Match both property="..." and name="..." attributes
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']` +
    `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
    'i'
  );
  const match = html.match(regex);
  const value = match?.[1] ?? match?.[2] ?? null;
  return value ? decodeHTMLEntities(value).trim() : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? decodeHTMLEntities(match[1]).trim() : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/library/og-extract.ts
git commit -m "feat(library): add OG metadata extraction utility"
```

---

## Task 4: Minimax Direct Call Utility

**Files:**
- Create: `src/lib/library/minimax.ts`

- [ ] **Step 1: Write the Minimax utility**

This extracts the Minimax call logic from `src/app/api/chat/minimax/route.ts` into a reusable function.

```typescript
import { ENV } from '@/lib/env';

const LIBRARY_SYSTEM_PROMPT = `You are a research assistant for The ZAO — an artist-first decentralized community focused on bringing profit margins, data ownership, and IP rights back to independent artists. ZAO operates on Farcaster and includes governance, music curation, and cross-platform publishing. Summarize this item and explain how it could be relevant to ZAO's mission.`;

interface MinimaxResult {
  summary: string | null;
  error: string | null;
}

/**
 * Call Minimax API directly to generate a research summary.
 * Returns null summary + error string on failure.
 */
export async function generateResearchSummary(content: string): Promise<MinimaxResult> {
  if (!ENV.MINIMAX_API_KEY) {
    return { summary: null, error: 'Minimax not configured' };
  }

  try {
    const endpoint = ENV.MINIMAX_API_URL || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
    const model = ENV.MINIMAX_MODEL || 'MiniMax-M2.7';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: LIBRARY_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        max_tokens: 1000,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[library/minimax] API error:', res.status, text);
      return { summary: null, error: `Minimax API error: ${res.status}` };
    }

    const data = JSON.parse(text);
    const summary =
      data?.choices?.[0]?.message?.content ??
      data?.reply ?? // fallback for different response formats
      null;

    if (!summary) {
      return { summary: null, error: 'No summary in Minimax response' };
    }

    return { summary, error: null };
  } catch (err) {
    console.error('[library/minimax] Unexpected error:', err);
    return { summary: null, error: 'Minimax request failed' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/library/minimax.ts
git commit -m "feat(library): add direct Minimax API utility for research summaries"
```

---

## Task 5: Submit API Route

**Files:**
- Create: `src/app/api/library/submit/route.ts`

- [ ] **Step 1: Write the submit route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { librarySubmitSchema } from '@/lib/validation/library-schemas';
import { isUrl, extractOGMetadata } from '@/lib/library/og-extract';
import { generateResearchSummary } from '@/lib/library/minimax';
import { moderateContent } from '@/lib/moderation/moderate';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = librarySubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { input, note, tags } = parsed.data;
    const fid = session.fid;

    // Detect URL vs freeform topic
    const urlDetected = isUrl(input);
    let url: string | null = null;
    let topic: string = input;
    let ogTitle: string | null = null;
    let ogDescription: string | null = null;
    let ogImage: string | null = null;

    // Extract OG metadata if URL
    if (urlDetected) {
      url = input.trim();
      const og = await extractOGMetadata(url);
      ogTitle = og.ogTitle;
      ogDescription = og.ogDescription;
      ogImage = og.ogImage;
      // Use OG title as topic, fallback to URL
      topic = ogTitle || url;
    }

    // Moderate content
    const textToModerate = [topic, note].filter(Boolean).join(' ');
    const modResult = await moderateContent(textToModerate);
    if (modResult.action === 'hide') {
      return NextResponse.json(
        { error: 'Content flagged by moderation' },
        { status: 400 },
      );
    }

    // Insert entry with pending AI status
    const { data: entry, error: insertError } = await supabaseAdmin
      .from('research_entries')
      .insert({
        fid,
        url,
        topic,
        note: note || null,
        tags: tags || [],
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        ai_status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Generate AI summary (fire-and-forget, don't block response)
    const summaryContent = [
      topic,
      ogDescription && `Description: ${ogDescription}`,
      note && `Submitter note: ${note}`,
      url && `URL: ${url}`,
    ].filter(Boolean).join('\n');

    generateResearchSummary(summaryContent).then(async (result) => {
      try {
        await supabaseAdmin
          .from('research_entries')
          .update({
            ai_summary: result.summary,
            ai_status: result.summary ? 'complete' : 'failed',
          })
          .eq('id', entry.id);
      } catch (err) {
        console.error('[library/submit] Failed to update AI summary:', err);
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[library/submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit entry' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/submit/route.ts
git commit -m "feat(library): add submit API route with OG extraction + Minimax"
```

---

## Task 6: Entries List API Route

**Files:**
- Create: `src/app/api/library/entries/route.ts`

- [ ] **Step 1: Write the entries route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'newest';
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    let query = supabaseAdmin
      .from('research_entries')
      .select('*');

    // Search across topic, ai_summary, note
    if (search) {
      query = query.or(
        `topic.ilike.%${search}%,ai_summary.ilike.%${search}%,note.ilike.%${search}%`
      );
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Sort
    if (sort === 'upvoted') {
      query = query.order('upvote_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: entries, error } = await query;
    if (error) throw error;

    // Check which entries the current user has voted on
    const entryIds = (entries || []).map((e: { id: string }) => e.id);
    let userVotes: string[] = [];
    if (entryIds.length > 0 && session.fid) {
      const { data: votes } = await supabaseAdmin
        .from('research_entry_votes')
        .select('entry_id')
        .eq('fid', session.fid)
        .in('entry_id', entryIds);
      userVotes = (votes || []).map((v: { entry_id: string }) => v.entry_id);
    }

    return NextResponse.json({
      entries: entries || [],
      userVotes,
    });
  } catch (error) {
    console.error('[library/entries] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/entries/route.ts
git commit -m "feat(library): add entries list API with search, filter, sort"
```

---

## Task 7: Vote Toggle API Route

**Files:**
- Create: `src/app/api/library/vote/route.ts`

- [ ] **Step 1: Write the vote route**

Pattern matches `src/app/api/music/submissions/vote/route.ts`.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryVoteSchema } from '@/lib/validation/library-schemas';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = libraryVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { entry_id } = parsed.data;
    const fid = session.fid;

    // Check if vote exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('research_entry_votes')
      .select('id')
      .eq('entry_id', entry_id)
      .eq('fid', fid)
      .maybeSingle();

    if (checkError) throw checkError;

    let voted: boolean;

    if (existing) {
      // Remove vote
      const { error: deleteError } = await supabaseAdmin
        .from('research_entry_votes')
        .delete()
        .eq('id', existing.id);
      if (deleteError) throw deleteError;

      // Atomic decrement
      await supabaseAdmin.rpc('decrement_count', {
        table_name: 'research_entries',
        column_name: 'upvote_count',
        row_id: entry_id,
      }).then(() => {}).catch(() => {
        // Fallback: manual update
        return supabaseAdmin
          .from('research_entries')
          .update({ upvote_count: 0 }) // Will be corrected by count query
          .eq('id', entry_id);
      });

      voted = false;
    } else {
      // Add vote
      const { error: insertError } = await supabaseAdmin
        .from('research_entry_votes')
        .insert({ entry_id, fid });
      if (insertError) throw insertError;

      voted = true;
    }

    // Get accurate count
    const { count, error: countError } = await supabaseAdmin
      .from('research_entry_votes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id);

    if (countError) throw countError;

    // Update denormalized count
    await supabaseAdmin
      .from('research_entries')
      .update({ upvote_count: count ?? 0 })
      .eq('id', entry_id);

    return NextResponse.json({ voted, voteCount: count ?? 0 });
  } catch (error) {
    console.error('[library/vote] Error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/vote/route.ts
git commit -m "feat(library): add vote toggle API route"
```

---

## Task 8: Comments API Route

**Files:**
- Create: `src/app/api/library/comments/route.ts`

- [ ] **Step 1: Write the comments route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryCommentSchema } from '@/lib/validation/library-schemas';
import { moderateContent } from '@/lib/moderation/moderate';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entry_id');

    if (!entryId) {
      return NextResponse.json({ error: 'entry_id required' }, { status: 400 });
    }

    const { data: comments, error } = await supabaseAdmin
      .from('research_entry_comments')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('[library/comments] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = libraryCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { entry_id, body: commentBody } = parsed.data;
    const fid = session.fid;

    // Moderate comment
    const modResult = await moderateContent(commentBody);
    if (modResult.action === 'hide') {
      return NextResponse.json(
        { error: 'Comment flagged by moderation' },
        { status: 400 },
      );
    }

    // Insert comment
    const { data: comment, error: insertError } = await supabaseAdmin
      .from('research_entry_comments')
      .insert({ entry_id, fid, body: commentBody })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update denormalized count (atomic via count query)
    const { count } = await supabaseAdmin
      .from('research_entry_comments')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id);

    await supabaseAdmin
      .from('research_entries')
      .update({ comment_count: count ?? 0 })
      .eq('id', entry_id);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('[library/comments] POST error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/comments/route.ts
git commit -m "feat(library): add comments API route with moderation"
```

---

## Task 9: Deep Research Docs API Route

**Files:**
- Create: `src/app/api/library/docs/route.ts`

- [ ] **Step 1: Write the docs route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query = supabaseAdmin
      .from('research_docs')
      .select('*')
      .order('id', { ascending: true });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: docs, error } = await query;
    if (error) throw error;

    return NextResponse.json({ docs: docs || [] });
  } catch (error) {
    console.error('[library/docs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch docs' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/docs/route.ts
git commit -m "feat(library): add deep research docs index API"
```

---

## Task 10: Admin Delete API Route

**Files:**
- Create: `src/app/api/library/delete/route.ts`

- [ ] **Step 1: Write the delete route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryDeleteSchema } from '@/lib/validation/library-schemas';

export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = libraryDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { entry_id } = parsed.data;

    // CASCADE handles votes and comments
    const { error } = await supabaseAdmin
      .from('research_entries')
      .delete()
      .eq('id', entry_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[library/delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/library/delete/route.ts
git commit -m "feat(library): add admin delete API route"
```

---

## Task 11: Rate Limits + Nav Config

**Files:**
- Modify: `src/middleware.ts`
- Modify: `community.config.ts`

- [ ] **Step 1: Add rate limits to middleware**

In `src/middleware.ts`, add these lines inside `getRateLimitConfig()` before the final `return null;` (around line 104):

```typescript
  if (pathname.startsWith('/api/library/submit')) {
    return { limit: 3, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/vote')) {
    return { limit: 15, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/comments')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library/delete')) {
    return { limit: 10, windowMs: MINUTE };
  }
  if (pathname.startsWith('/api/library')) {
    return { limit: 30, windowMs: MINUTE };
  }
```

Note: `/api/library/submit` must come before the catch-all `/api/library` entry.

- [ ] **Step 2: Add Library to nav config**

In `community.config.ts`, locate the `pillars` object and add a `library` entry. Or, if routes are managed elsewhere in the file, add Library under Tools. The exact edit depends on how the nav renders — check the sidebar component for how it reads `pillars`. Add:

```typescript
library: { label: 'Library', icon: 'book', href: '/library' },
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts community.config.ts
git commit -m "feat(library): add rate limits and nav config"
```

---

## Task 12: SubmitForm Component

**Files:**
- Create: `src/components/library/SubmitForm.tsx`

- [ ] **Step 1: Write the submit form**

```tsx
'use client';

import { useState } from 'react';
import { LIBRARY_TAGS, type LibraryTag } from '@/lib/validation/library-schemas';

interface SubmitFormProps {
  onSubmitted: () => void;
}

export default function SubmitForm({ onSubmitted }: SubmitFormProps) {
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<LibraryTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleTag = (tag: LibraryTag) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
          ? [...prev, tag]
          : prev,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/library/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setInput('');
      setNote('');
      setTags([]);
      setFeedback({ type: 'success', message: 'Submitted! AI summary generating...' });
      onSubmitted();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit',
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a URL or type a topic to research..."
          className="w-full rounded-lg bg-[#1a2a3a] px-4 py-3 text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
          maxLength={2000}
        />
      </div>

      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why is this interesting? (optional)"
          rows={2}
          className="w-full rounded-lg bg-[#1a2a3a] px-4 py-3 text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623] resize-none"
          maxLength={1000}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {LIBRARY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              tags.includes(tag)
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-[#1a2a3a] text-gray-300 hover:bg-[#243447]'
            }`}
          >
            {tag}
          </button>
        ))}
        {tags.length >= 3 && (
          <span className="text-xs text-gray-500 self-center">Max 3 tags</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          className="rounded-lg bg-[#f5a623] px-6 py-2 font-medium text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>

        {feedback && (
          <span
            className={`text-sm ${
              feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/SubmitForm.tsx
git commit -m "feat(library): add SubmitForm component"
```

---

## Task 13: EntryCard Component

**Files:**
- Create: `src/components/library/EntryCard.tsx`

- [ ] **Step 1: Write the entry card**

```tsx
'use client';

import { useState } from 'react';
import EntryComments from './EntryComments';

interface Entry {
  id: string;
  fid: number;
  url: string | null;
  topic: string;
  note: string | null;
  tags: string[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  ai_summary: string | null;
  ai_status: 'pending' | 'complete' | 'failed';
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

interface EntryCardProps {
  entry: Entry;
  voted: boolean;
  onVote: (entryId: string) => void;
  isAdmin?: boolean;
  onDelete?: (entryId: string) => void;
}

export default function EntryCard({ entry, voted, onVote, isAdmin, onDelete }: EntryCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [voteCount, setVoteCount] = useState(entry.upvote_count);
  const [hasVoted, setHasVoted] = useState(voted);
  const [commentCount, setCommentCount] = useState(entry.comment_count);

  const handleVote = async () => {
    // Optimistic update
    setHasVoted(!hasVoted);
    setVoteCount((c) => (hasVoted ? c - 1 : c + 1));
    onVote(entry.id);
  };

  const timeAgo = getTimeAgo(entry.created_at);

  return (
    <div className="rounded-xl bg-[#0d1b2a] p-4 ring-1 ring-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>FID {entry.fid}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        )}
      </div>

      {/* Title + URL */}
      <h3 className="text-lg font-semibold text-white mb-1">
        {entry.url ? (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#f5a623] transition-colors"
          >
            {entry.topic}
          </a>
        ) : (
          entry.topic
        )}
      </h3>

      {entry.url && (
        <p className="text-xs text-gray-500 mb-2 truncate">{entry.url}</p>
      )}

      {/* OG Image */}
      {entry.og_image && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={entry.og_image}
            alt=""
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Note */}
      {entry.note && (
        <p className="text-sm text-gray-300 mb-3 italic">
          &ldquo;{entry.note}&rdquo;
        </p>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#1a2a3a] px-2.5 py-0.5 text-xs text-[#f5a623]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary */}
      <div className="mb-3 rounded-lg bg-[#0a1628] p-3 ring-1 ring-gray-800">
        <p className="text-xs font-medium text-[#f5a623] mb-1">AI Analysis</p>
        {entry.ai_status === 'pending' && (
          <p className="text-sm text-gray-400 animate-pulse">Generating summary...</p>
        )}
        {entry.ai_status === 'failed' && (
          <p className="text-sm text-gray-500">Summary unavailable</p>
        )}
        {entry.ai_status === 'complete' && entry.ai_summary && (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.ai_summary}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleVote}
          className={`flex items-center gap-1 transition-colors ${
            hasVoted ? 'text-[#f5a623]' : 'text-gray-400 hover:text-[#f5a623]'
          }`}
        >
          <span>{hasVoted ? '▲' : '△'}</span>
          <span>{voteCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <EntryComments
            entryId={entry.id}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
          />
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/EntryCard.tsx
git commit -m "feat(library): add EntryCard component"
```

---

## Task 14: EntryComments Component

**Files:**
- Create: `src/components/library/EntryComments.tsx`

- [ ] **Step 1: Write the comments component**

```tsx
'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  fid: number;
  body: string;
  created_at: string;
}

interface EntryCommentsProps {
  entryId: string;
  onCommentAdded: () => void;
}

export default function EntryComments({ entryId, onCommentAdded }: EntryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [entryId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/library/comments?entry_id=${entryId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch('/api/library/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, body: body.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody('');
        onCommentAdded();
      }
    } catch {
      // silent fail
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading comments...</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="text-gray-400">FID {c.fid}</span>
          <span className="text-gray-600 mx-1">·</span>
          <span className="text-gray-300">{c.body}</span>
        </div>
      ))}

      <form onSubmit={handlePost} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 rounded-lg bg-[#1a2a3a] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
        />
        <button
          type="submit"
          disabled={!body.trim() || posting}
          className="rounded-lg bg-[#f5a623] px-3 py-2 text-sm font-medium text-[#0a1628] disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/EntryComments.tsx
git commit -m "feat(library): add EntryComments component"
```

---

## Task 15: EntryFeed Component

**Files:**
- Create: `src/components/library/EntryFeed.tsx`

- [ ] **Step 1: Write the feed component**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import EntryCard from './EntryCard';
import { LIBRARY_TAGS } from '@/lib/validation/library-schemas';

interface Entry {
  id: string;
  fid: number;
  url: string | null;
  topic: string;
  note: string | null;
  tags: string[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  ai_summary: string | null;
  ai_status: 'pending' | 'complete' | 'failed';
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

interface EntryFeedProps {
  refreshKey: number;
  isAdmin?: boolean;
}

export default function EntryFeed({ refreshKey, isAdmin }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort] = useState<'newest' | 'upvoted'>('newest');
  const [hasMore, setHasMore] = useState(true);

  const fetchEntries = useCallback(async (reset = false) => {
    const offset = reset ? 0 : entries.length;
    const params = new URLSearchParams({
      offset: String(offset),
      limit: '50',
      sort,
      ...(search && { search }),
      ...(activeTag && { tag: activeTag }),
    });

    try {
      const res = await fetch(`/api/library/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setEntries(data.entries);
        } else {
          setEntries((prev) => [...prev, ...data.entries]);
        }
        setUserVotes(data.userVotes);
        setHasMore(data.entries.length === 50);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, sort, entries.length]);

  // Fetch on mount, filter change, or refresh
  useEffect(() => {
    setLoading(true);
    fetchEntries(true);
  }, [search, activeTag, sort, refreshKey]);

  const handleVote = async (entryId: string) => {
    try {
      const res = await fetch('/api/library/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserVotes((prev) =>
          data.voted ? [...prev, entryId] : prev.filter((id) => id !== entryId),
        );
      }
    } catch {
      // silent fail — optimistic UI in EntryCard handles display
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch('/api/library/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch {
      // silent fail
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search submissions..."
          className="flex-1 rounded-lg bg-[#1a2a3a] px-4 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSort(sort === 'newest' ? 'upvoted' : 'newest')}
            className="rounded-lg bg-[#1a2a3a] px-3 py-2 text-sm text-gray-300 hover:bg-[#243447]"
          >
            {sort === 'newest' ? 'Newest' : 'Top'}
          </button>
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTag('')}
          className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
            !activeTag ? 'bg-[#f5a623] text-[#0a1628]' : 'bg-[#1a2a3a] text-gray-400 hover:bg-[#243447]'
          }`}
        >
          All
        </button>
        {LIBRARY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              activeTag === tag ? 'bg-[#f5a623] text-[#0a1628]' : 'bg-[#1a2a3a] text-gray-400 hover:bg-[#243447]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No submissions yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              voted={userVotes.includes(entry.id)}
              onVote={handleVote}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchEntries(false)}
              className="w-full rounded-lg bg-[#1a2a3a] py-3 text-sm text-gray-300 hover:bg-[#243447]"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/EntryFeed.tsx
git commit -m "feat(library): add EntryFeed component with search, filter, sort"
```

---

## Task 16: DeepResearch Component

**Files:**
- Create: `src/components/library/DeepResearch.tsx`

- [ ] **Step 1: Write the deep research component**

```tsx
'use client';

import { useState, useEffect } from 'react';

interface ResearchDoc {
  id: number;
  title: string;
  category: string;
  path: string;
  github_url: string;
}

const CATEGORIES = [
  'Farcaster Protocol & Ecosystem',
  'Music, Curation & Artist Revenue',
  'Community, Social & Growth',
  'Identity, Governance & Tokens',
  'AI Agent & Intelligence',
  'Cross-Platform Publishing',
  'Technical Infrastructure',
  'APIs & External Services',
  'Security & Code Quality',
  'Development Workflows',
];

export default function DeepResearch() {
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/library/docs');
      if (res.ok) {
        const data = await res.json();
        setDocs(data.docs);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs;

  const grouped = CATEGORIES.reduce<Record<string, ResearchDoc[]>>((acc, cat) => {
    const matching = filtered.filter((d) => d.category === cat);
    if (matching.length > 0) acc[cat] = matching;
    return acc;
  }, {});

  // Catch docs with categories not in the list
  const uncategorized = filtered.filter(
    (d) => !CATEGORIES.includes(d.category),
  );
  if (uncategorized.length > 0) grouped['Other'] = uncategorized;

  if (loading) {
    return <p className="text-gray-500">Loading research library...</p>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search research docs..."
        className="w-full rounded-lg bg-[#1a2a3a] px-4 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
      />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-center py-4">No docs found</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([category, categoryDocs]) => (
            <div key={category} className="rounded-lg ring-1 ring-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1b2a] text-left hover:bg-[#1a2a3a] transition-colors"
              >
                <span className="text-sm font-medium text-white">{category}</span>
                <span className="text-xs text-gray-400">
                  {categoryDocs.length} doc{categoryDocs.length !== 1 ? 's' : ''}
                  {' '}{openCategory === category ? '▼' : '▶'}
                </span>
              </button>
              {openCategory === category && (
                <div className="bg-[#0a1628] divide-y divide-gray-800">
                  {categoryDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a2a3a] transition-colors"
                    >
                      <span className="text-xs text-gray-500 w-8 text-right">#{doc.id}</span>
                      <span className="text-sm text-gray-300">{doc.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/DeepResearch.tsx
git commit -m "feat(library): add DeepResearch accordion component"
```

---

## Task 17: Library Page

**Files:**
- Create: `src/app/(auth)/library/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
'use client';

import { useState } from 'react';
import SubmitForm from '@/components/library/SubmitForm';
import EntryFeed from '@/components/library/EntryFeed';
import DeepResearch from '@/components/library/DeepResearch';
import { useAuth } from '@/hooks/useAuth';

export default function LibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { session } = useAuth();
  const [activeSection, setActiveSection] = useState<'submissions' | 'research'>('submissions');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <p className="text-sm text-gray-400 mt-1">
          Submit links, topics, and resources. AI analyzes how they fit into ZAO.
        </p>
      </div>

      {/* Submit Form */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Submit</h2>
        <SubmitForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </section>

      {/* Section Toggle */}
      <div className="flex gap-2 border-b border-gray-800 pb-1">
        <button
          onClick={() => setActiveSection('submissions')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'submissions'
              ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Community Submissions
        </button>
        <button
          onClick={() => setActiveSection('research')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'research'
              ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Deep Research ({'>'}130 docs)
        </button>
      </div>

      {/* Active Section */}
      {activeSection === 'submissions' ? (
        <EntryFeed refreshKey={refreshKey} isAdmin={session?.isAdmin} />
      ) : (
        <DeepResearch />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the page loads**

Run: `npm run dev`

Navigate to `http://localhost:3000/library` — verify the page renders with the submit form, section toggle, and empty feed.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/library/page.tsx
git commit -m "feat(library): add Library page with submit, feed, and deep research"
```

---

## Task 18: Seed Research Docs Script

**Files:**
- Create: `scripts/seed-research-docs.ts`

- [ ] **Step 1: Write the seed script**

This reads `research/README.md`, parses out the numbered docs with their categories, and inserts them into the `research_docs` table.

```typescript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_BASE = 'https://github.com/YOUR_ORG/ZAO-OS/tree/main';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface DocEntry {
  id: number;
  title: string;
  category: string;
  path: string;
  github_url: string;
}

async function main() {
  const readmePath = resolve(__dirname, '../research/README.md');
  const content = readFileSync(readmePath, 'utf-8');

  const entries: DocEntry[] = [];
  let currentCategory = 'Uncategorized';

  const lines = content.split('\n');

  for (const line of lines) {
    // Category headers like "### Farcaster Protocol & Ecosystem"
    const categoryMatch = line.match(/^###\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Doc entries like "- [01 — Protocol overview](01-protocol-overview/)"
    // or "- **01** — Protocol overview"
    const docMatch = line.match(/[-*]\s+\[?\*?\*?(\d+)\*?\*?\]?\s*[—–-]\s*(.+?)[\])]?\s*$/);
    if (!docMatch) {
      // Try link format: - [Title](NN-slug/)
      const linkMatch = line.match(/[-*]\s+\[(.+?)\]\((\d+)-([^)]+)\/?/);
      if (linkMatch) {
        const title = linkMatch[1].trim();
        const num = parseInt(linkMatch[2], 10);
        const slug = `${linkMatch[2]}-${linkMatch[3]}`;
        entries.push({
          id: num,
          title,
          category: currentCategory,
          path: `research/${slug}`,
          github_url: `${GITHUB_BASE}/research/${slug}/README.md`,
        });
      }
      continue;
    }

    const num = parseInt(docMatch[1], 10);
    const title = docMatch[2].replace(/\[|\]|\(.*\)/g, '').trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    entries.push({
      id: num,
      title,
      category: currentCategory,
      path: `research/${String(num).padStart(2, '0')}-${slug}`,
      github_url: `${GITHUB_BASE}/research/${String(num).padStart(2, '0')}-${slug}/README.md`,
    });
  }

  console.log(`Parsed ${entries.length} research docs`);

  // Upsert into research_docs
  const { error } = await supabase
    .from('research_docs')
    .upsert(entries, { onConflict: 'id' });

  if (error) {
    console.error('Failed to seed:', error);
    process.exit(1);
  }

  console.log(`Seeded ${entries.length} docs into research_docs table`);
}

main();
```

- [ ] **Step 2: Run the seed script**

Run: `npx tsx scripts/seed-research-docs.ts`

Verify output shows the expected count (~130 docs).

Note: Update `GITHUB_BASE` to match the actual repo URL before running. If the repo is private, the GitHub links won't be publicly accessible — but they'll work for members with repo access.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-research-docs.ts
git commit -m "feat(library): add seed script for research docs index"
```

---

## Task 19: Final Integration Test

- [ ] **Step 1: Run the dev server and test the full flow**

Run: `npm run dev`

Test checklist:
1. Navigate to `/library` — page loads with 3 sections
2. Submit a URL (e.g., `https://paragraph.xyz/@thezao`) — see OG preview, AI summary generates
3. Submit a freeform topic (e.g., "music NFT royalty splits") — AI summary generates
4. Upvote an entry — count changes, persists on refresh
5. Add a comment — appears inline
6. Search submissions — filters correctly
7. Filter by tag — shows matching entries
8. Toggle sort (newest/top) — order changes
9. Switch to Deep Research tab — categories load from seeded data
10. Search research docs — filters titles
11. Click a doc — opens GitHub link

- [ ] **Step 2: Run build check**

Run: `npm run build`

Fix any TypeScript errors. Common issues:
- Import path typos
- Missing `useAuth` hook return type — check what it actually returns
- `session?.isAdmin` might need optional chaining if session type doesn't include `isAdmin`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(library): complete Library research portal"
```
