import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForLens } from '@/lib/publish/normalize';
import { publishToLens, refreshLensToken } from '@/lib/publish/lens';

const publishSchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
});

/**
 * POST — Cross-publish a Farcaster cast to Lens Protocol.
 *
 * Requires the user to have connected their Lens profile first
 * (via /api/platforms/lens POST).
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

  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

  try {
    // Fetch user's Lens credentials
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('lens_profile_id, lens_access_token, lens_refresh_token')
      .eq('fid', session.fid)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.lens_profile_id || !user.lens_access_token) {
      return NextResponse.json(
        { error: 'Lens not connected. Connect your Lens profile first.' },
        { status: 400 },
      );
    }

    let accessToken: string = user.lens_access_token;

    // Normalize content for Lens
    const content = normalizeForLens({ text, castHash, embedUrls, imageUrls, channel });

    // Attempt to publish — if token expired, refresh and retry once
    let result;
    try {
      result = await publishToLens(accessToken, content);
    } catch (firstErr) {
      // Try refreshing the token if we have a refresh token
      if (user.lens_refresh_token) {
        try {
          const refreshed = await refreshLensToken(user.lens_refresh_token);
          accessToken = refreshed.accessToken;

          // Persist the new tokens
          await supabaseAdmin
            .from('users')
            .update({
              lens_access_token: refreshed.accessToken,
              lens_refresh_token: refreshed.refreshToken,
            })
            .eq('fid', session.fid);

          // Retry with fresh token
          result = await publishToLens(accessToken, content);
        } catch (refreshErr) {
          console.error('[publish/lens] Token refresh failed:', refreshErr);
          // Log failure
          await logPublish(session.fid, castHash, 'lens', 'failed', null, String(firstErr));
          return NextResponse.json(
            {
              error: 'Lens token expired and refresh failed. Please reconnect your Lens profile.',
            },
            { status: 401 },
          );
        }
      } else {
        // No refresh token available
        await logPublish(session.fid, castHash, 'lens', 'failed', null, String(firstErr));
        throw firstErr;
      }
    }

    // Log success
    await logPublish(session.fid, castHash, 'lens', 'success', result.postUrl, null);

    return NextResponse.json({
      success: true,
      platformUrl: result.postUrl,
      postId: result.postId,
    });
  } catch (err) {
    console.error('[publish/lens] Error:', err);
    // Best-effort failure log
    await logPublish(session.fid, castHash, 'lens', 'failed', null, String(err)).catch(() => {});
    return NextResponse.json(
      { error: 'Failed to publish to Lens' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function logPublish(
  fid: number,
  castHash: string,
  platform: string,
  status: 'success' | 'failed',
  platformUrl: string | null,
  errorMessage: string | null,
) {
  try {
    await supabaseAdmin.from('publish_log').insert({
      fid,
      cast_hash: castHash,
      platform,
      status,
      platform_url: platformUrl,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error('[publish/lens] Failed to write publish_log:', logErr);
  }
}
