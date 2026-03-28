import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * POST /api/discord/link — Link a Discord identity to a Farcaster identity
 *
 * Body: { discord_id: string, fid: number }
 * Auth: Bearer token (DISCORD_BOT_WEBHOOK_SECRET)
 *
 * Logic:
 * 1. Look up both discord_id and fid in the users table
 * 2. If both exist on the same row, nothing to do
 * 3. If they exist on separate rows, merge them (copy discord_id to the fid row,
 *    or fid to the discord_id row, preferring the row with more data)
 * 4. If only one exists, update that row with the missing field
 */

const linkSchema = z.object({
  discord_id: z.string().min(1),
  fid: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  // Authenticate via bearer token
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.DISCORD_BOT_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Link endpoint not configured' }, { status: 503 });
  }

  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { discord_id, fid } = parsed.data;

    // Look up existing rows
    const { data: byDiscord } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, fid, primary_wallet, username')
      .eq('discord_id', discord_id)
      .maybeSingle();

    const { data: byFid } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, fid, primary_wallet, username')
      .eq('fid', fid)
      .maybeSingle();

    // Case 1: Both fields already on the same row
    if (byDiscord && byFid && byDiscord.id === byFid.id) {
      return NextResponse.json({
        ok: true,
        action: 'already_linked',
        user_id: byDiscord.id,
      });
    }

    // Case 2: Both rows exist but are separate — merge them
    if (byDiscord && byFid) {
      // Prefer the row that has a primary_wallet; if both do, prefer the fid row
      const keepRow = byFid.primary_wallet ? byFid : byDiscord;
      const mergeRow = keepRow.id === byFid.id ? byDiscord : byFid;

      // Copy missing fields from mergeRow to keepRow
      const updates: Record<string, unknown> = {};
      if (!keepRow.discord_id && mergeRow.discord_id) updates.discord_id = mergeRow.discord_id;
      if (!keepRow.fid && mergeRow.fid) updates.fid = mergeRow.fid;
      if (!keepRow.primary_wallet && mergeRow.primary_wallet) updates.primary_wallet = mergeRow.primary_wallet;

      // Ensure both fields are set
      if (!keepRow.discord_id) updates.discord_id = discord_id;
      if (!keepRow.fid) updates.fid = fid;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('users')
          .update(updates)
          .eq('id', keepRow.id);
      }

      // Clear discord_id and fid from the merge row to avoid conflicts,
      // but don't delete it — it may have other data
      await supabaseAdmin
        .from('users')
        .update({ discord_id: null, fid: null })
        .eq('id', mergeRow.id);

      return NextResponse.json({
        ok: true,
        action: 'merged',
        kept_id: keepRow.id,
        merged_id: mergeRow.id,
      });
    }

    // Case 3: Only discord row exists — add fid to it
    if (byDiscord) {
      await supabaseAdmin
        .from('users')
        .update({ fid })
        .eq('id', byDiscord.id);

      return NextResponse.json({
        ok: true,
        action: 'linked_fid_to_discord',
        user_id: byDiscord.id,
      });
    }

    // Case 4: Only fid row exists — add discord_id to it
    if (byFid) {
      await supabaseAdmin
        .from('users')
        .update({ discord_id })
        .eq('id', byFid.id);

      return NextResponse.json({
        ok: true,
        action: 'linked_discord_to_fid',
        user_id: byFid.id,
      });
    }

    // Case 5: Neither exists — this shouldn't normally happen but handle gracefully
    return NextResponse.json({
      error: 'Neither discord_id nor fid found in users table. Register on at least one platform first.',
    }, { status: 404 });

  } catch (err) {
    console.error('[Discord link] POST error:', err);
    return NextResponse.json({ error: 'Link failed' }, { status: 500 });
  }
}
