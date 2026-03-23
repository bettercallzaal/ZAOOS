import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SearchType = z.enum(['all', 'casts', 'proposals', 'music', 'members']);

const searchParamsSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(200),
  type: SearchType.default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

interface SearchResult {
  type: 'cast' | 'proposal' | 'music' | 'member';
  id: string;
  title: string;
  snippet: string;
  href: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// In-memory response cache (30 s TTL)
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 30_000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  // Evict old entries periodically
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expires) cache.delete(k);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snippet(text: string | null, maxLen = 160): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trimEnd() + '...';
}

// ---------------------------------------------------------------------------
// GET /api/search?q=...&type=all&limit=20
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Auth check
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate params
  const raw = {
    q: req.nextUrl.searchParams.get('q'),
    type: req.nextUrl.searchParams.get('type') ?? 'all',
    limit: req.nextUrl.searchParams.get('limit') ?? '20',
  };

  const parsed = searchParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { q: query, type, limit } = parsed.data;

  // Check cache
  const cacheKey = `search:${type}:${limit}:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const results: SearchResult[] = [];

    // Build search promises based on requested type
    const searches: Promise<void>[] = [];

    // ── Casts ────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'casts') {
      searches.push(
        (async () => {
          const { data } = await supabaseAdmin
            .from('channel_casts')
            .select('hash, text, channel_id, author_display, author_username, author_pfp, timestamp')
            .textSearch('search_vector', query, { type: 'websearch' })
            .order('timestamp', { ascending: false })
            .limit(limit);

          if (data) {
            for (const row of data) {
              results.push({
                type: 'cast',
                id: row.hash,
                title: row.author_display || row.author_username || 'Cast',
                snippet: snippet(row.text),
                href: `/chat/${row.channel_id}`,
                timestamp: row.timestamp || '',
                metadata: {
                  channel: row.channel_id,
                  author: row.author_display || row.author_username,
                  pfp: row.author_pfp,
                },
              });
            }
          }
        })(),
      );
    }

    // ── Proposals ────────────────────────────────────────────────────────
    if (type === 'all' || type === 'proposals') {
      searches.push(
        (async () => {
          const { data } = await supabaseAdmin
            .from('proposals')
            .select('id, title, description, status, created_at, author_fid')
            .textSearch('search_vector', query, { type: 'websearch' })
            .order('created_at', { ascending: false })
            .limit(limit);

          if (data) {
            for (const row of data) {
              results.push({
                type: 'proposal',
                id: String(row.id),
                title: row.title || 'Untitled Proposal',
                snippet: snippet(row.description),
                href: `/governance/proposals/${row.id}`,
                timestamp: row.created_at || '',
                metadata: {
                  status: row.status,
                  authorFid: row.author_fid,
                },
              });
            }
          }
        })(),
      );
    }

    // ── Music (song submissions) ─────────────────────────────────────────
    if (type === 'all' || type === 'music') {
      searches.push(
        (async () => {
          const { data } = await supabaseAdmin
            .from('song_submissions')
            .select('id, title, artist, note, url, submitted_at, status')
            .textSearch('search_vector', query, { type: 'websearch' })
            .order('submitted_at', { ascending: false })
            .limit(limit);

          if (data) {
            for (const row of data) {
              results.push({
                type: 'music',
                id: String(row.id),
                title: row.title || 'Untitled Track',
                snippet: snippet(
                  [row.artist, row.note].filter(Boolean).join(' - '),
                ),
                href: '/music',
                timestamp: row.submitted_at || '',
                metadata: {
                  artist: row.artist,
                  url: row.url,
                  status: row.status,
                },
              });
            }
          }
        })(),
      );
    }

    // ── Members (community profiles) ─────────────────────────────────────
    if (type === 'all' || type === 'members') {
      searches.push(
        (async () => {
          const { data } = await supabaseAdmin
            .from('community_profiles')
            .select('id, name, biography, category, pfp_url, username, created_at')
            .textSearch('search_vector', query, { type: 'websearch' })
            .order('created_at', { ascending: false })
            .limit(limit);

          if (data) {
            for (const row of data) {
              results.push({
                type: 'member',
                id: String(row.id),
                title: row.name || row.username || 'Member',
                snippet: snippet(
                  [row.category, row.biography].filter(Boolean).join(' - '),
                ),
                href: `/social/profile/${row.username || row.id}`,
                timestamp: row.created_at || '',
                metadata: {
                  category: row.category,
                  pfp: row.pfp_url,
                  username: row.username,
                },
              });
            }
          }
        })(),
      );
    }

    // Run all searches in parallel (fault-tolerant)
    const settled = await Promise.allSettled(searches);

    // Log any failures server-side
    for (const result of settled) {
      if (result.status === 'rejected') {
        console.error('[search] partial failure:', result.reason);
      }
    }

    // Sort by timestamp descending
    results.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Trim to limit
    const trimmed = results.slice(0, limit);

    const body = {
      results: trimmed,
      total: trimmed.length,
      query,
    };

    setCache(cacheKey, body);
    return NextResponse.json(body);
  } catch (error) {
    console.error('[search] error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
