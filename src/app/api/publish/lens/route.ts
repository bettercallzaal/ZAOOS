import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForLens } from '@/lib/publish/normalize';
import { publishToLens } from '@/lib/publish/lens';
import { logger } from '@/lib/logger';

const publishSchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1),
  embedUrls: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  channel: z.string().optional(),
});

/**
 * POST /api/publish/lens
 * Cross-post content to Lens Protocol.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

  try {
    // Get user's Lens credentials
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('lens_profile_id, lens_access_token, lens_refresh_token')
      .eq('fid', session.fid)
      .single();

    if (!user?.lens_profile_id) {
      return NextResponse.json({ error: 'Lens not connected — connect in Settings' }, { status: 400 });
    }

    if (!user?.lens_access_token) {
      return NextResponse.json({ error: 'Lens auth tokens missing — reconnect with wallet in Settings' }, { status: 400 });
    }

    // Normalize content for Lens
    const content = normalizeForLens({
      text,
      castHash,
      embedUrls,
      imageUrls,
      channel,
    });

    // Publish
    const result = await publishToLens(
      user.lens_access_token,
      user.lens_refresh_token || '',
      content,
    );

    // Log success
    await supabaseAdmin.from('publish_log').insert({
      cast_hash: castHash,
      fid: session.fid,
      platform: 'lens',
      status: 'success',
      platform_post_id: result.postId,
      platform_url: result.postUrl,
    });

    return NextResponse.json({ success: true, postId: result.postId, postUrl: result.postUrl });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Lens publish failed';
    logger.error('[publish/lens] Error:', errorMsg);

    // Log failure
    await supabaseAdmin.from('publish_log').insert({
      cast_hash: castHash,
      fid: session.fid,
      platform: 'lens',
      status: 'failed',
      error_message: errorMsg,
    });

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
