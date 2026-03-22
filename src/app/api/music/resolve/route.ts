import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  resolveMusicLinks,
  buildUniversalCard,
  RateLimitError,
  type UniversalMusicCard,
} from '@/lib/music/songlink';

const QuerySchema = z.object({
  url: z.string().url('Must be a valid URL').max(2048).refine(
    (u) => u.startsWith('http://') || u.startsWith('https://'),
    'Only http/https URLs allowed'
  ),
});

/** Cache TTL: 7 days in seconds. */
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function GET(request: NextRequest) {
  // Auth check
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate input
  const parsed = QuerySchema.safeParse({
    url: request.nextUrl.searchParams.get('url'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { url } = parsed.data;

  try {
    // --- Check cache first ---
    const cached = await getCached(url);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // --- Cache miss: resolve via Songlink API ---
    const response = await resolveMusicLinks(url);
    const card = buildUniversalCard(response);

    // Store in cache (fire-and-forget, don't block response)
    storeInCache(url, card).catch((err) => {
      console.error('[music/resolve] cache write failed:', err);
    });

    return NextResponse.json(card, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.warn('[music/resolve] rate limited by Songlink');
      return NextResponse.json(
        { error: 'Music link service is temporarily busy. Try again shortly.' },
        { status: 429 },
      );
    }

    console.error('[music/resolve] error:', err);
    return NextResponse.json(
      { error: 'Failed to resolve music links' },
      { status: 500 },
    );
  }
}

// ---------- Cache helpers ----------

/**
 * Read from `music_link_cache` table. Returns null on miss or if
 * the table doesn't exist yet (graceful degradation).
 */
async function getCached(url: string): Promise<UniversalMusicCard | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('music_link_cache')
      .select('card_data, expires_at')
      .eq('url', url)
      .maybeSingle();

    if (error) {
      // Table may not exist — skip caching silently
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return null;
      }
      console.warn('[music/resolve] cache read error:', error.message);
      return null;
    }

    if (!data) return null;

    // Check expiry
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) return null;

    return data.card_data as UniversalMusicCard;
  } catch {
    // Any unexpected error — just skip cache
    return null;
  }
}

/**
 * Write to `music_link_cache` table. Upserts by URL.
 * Silently fails if the table doesn't exist.
 */
async function storeInCache(url: string, card: UniversalMusicCard): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();

    const { error } = await supabase
      .from('music_link_cache')
      .upsert(
        {
          url,
          card_data: card,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'url' },
      );

    if (error && error.code !== '42P01' && !error.message?.includes('does not exist')) {
      console.warn('[music/resolve] cache write error:', error.message);
    }
  } catch {
    // Silently skip — caching is best-effort
  }
}
