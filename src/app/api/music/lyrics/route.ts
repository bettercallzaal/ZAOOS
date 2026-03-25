import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

// ─── In-memory LRU-ish cache (max 500 entries) ─────────────────────────────
const cache = new Map<string, { lyrics: string | null; source: string }>();
const MAX_CACHE = 500;

function cacheKey(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
}

function cacheSet(key: string, value: { lyrics: string | null; source: string }) {
  if (cache.size >= MAX_CACHE) {
    // Delete oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

// ─── Validation ─────────────────────────────────────────────────────────────
const querySchema = z.object({
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
});

// ─── Lyrics fetchers ────────────────────────────────────────────────────────
async function fetchLyricsOvh(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.lyrics || null;
  } catch {
    return null;
  }
}

async function fetchLyrist(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.lyrics || null;
  } catch {
    return null;
  }
}

// ─── GET handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query params
    const parsed = querySchema.safeParse({
      artist: req.nextUrl.searchParams.get('artist'),
      title: req.nextUrl.searchParams.get('title'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { artist, title } = parsed.data;
    const key = cacheKey(artist, title);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Try lyrics.ovh first
    let lyrics = await fetchLyricsOvh(artist, title);
    let source = 'lyrics.ovh';

    // Fallback to lyrist
    if (!lyrics) {
      lyrics = await fetchLyrist(artist, title);
      source = 'lyrist';
    }

    const result = { lyrics: lyrics || null, source: lyrics ? source : '' };
    cacheSet(key, result);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[lyrics] Error fetching lyrics:', err);
    return NextResponse.json({ lyrics: null, source: '' }, { status: 500 });
  }
}
