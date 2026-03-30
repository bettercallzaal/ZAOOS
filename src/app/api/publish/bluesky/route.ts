import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForBluesky } from '@/lib/publish/normalize';
import { publishToBluesky, isBlueskyConfigured } from '@/lib/publish/bluesky';
import { logger } from '@/lib/logger';

const publishBlueskySchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1).max(1024),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!isBlueskyConfigured()) {
      return NextResponse.json({ error: 'Bluesky not configured' }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = publishBlueskySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

    const normalized = normalizeForBluesky({ text, castHash, embedUrls, imageUrls, channel });

    const result = await publishToBluesky(normalized);

    await supabaseAdmin
      .from('publish_log')
      .insert({
        platform: 'bluesky',
        cast_hash: castHash,
        platform_post_id: result.uri,
        platform_url: result.postUrl,
        published_by_fid: session.fid,
        text: normalized.text,
        status: 'published',
      });

    return NextResponse.json({ success: true, platformUrl: result.postUrl });
  } catch (err) {
    logger.error('[publish/bluesky] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to publish to Bluesky';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
