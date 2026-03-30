import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForHive } from '@/lib/publish/normalize';
import { decryptPostingKey, publishToHive } from '@/lib/publish/hive';
import { logger } from '@/lib/logger';

const publishHiveSchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
});

/**
 * POST — Cross-publish a cast to Hive/InLeo.
 *
 * Requires the user to have connected their Hive account first
 * (hive_username + hive_posting_key_encrypted stored in users table).
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = publishHiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

  try {
    // Fetch Hive credentials for current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('hive_username, hive_posting_key_encrypted')
      .eq('fid', session.fid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.hive_username || !user.hive_posting_key_encrypted) {
      return NextResponse.json(
        { error: 'Hive not connected. Please connect your Hive account first.' },
        { status: 400 },
      );
    }

    // Decrypt posting key server-side
    const postingKey = decryptPostingKey(user.hive_posting_key_encrypted);

    // Normalize content for Hive markdown format
    const content = normalizeForHive({
      text,
      castHash,
      embedUrls,
      imageUrls,
      channel,
    });

    // Publish to Hive blockchain
    const result = await publishToHive(
      user.hive_username,
      postingKey,
      content,
    );

    // Log to publish_log table
    await supabaseAdmin.from('publish_log').insert({
      fid: session.fid,
      platform: 'hive',
      cast_hash: castHash,
      platform_url: result.url,
      permlink: result.permlink,
      published_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      platformUrl: result.url,
    });
  } catch (err) {
    logger.error('[publish/hive] Error:', err);
    return NextResponse.json(
      { error: 'Failed to publish to Hive' },
      { status: 500 },
    );
  }
}
