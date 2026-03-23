import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getChannelMessages, getGuildMembers, isDiscordConfigured } from '@/lib/discord/client';

const INTROS_CHANNEL_ID = process.env.DISCORD_INTROS_CHANNEL_ID || '1145135336477950053';

/**
 * GET /api/discord/sync — Read Discord data (admin only)
 * ?type=members | intros | threads
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  if (!isDiscordConfigured()) {
    return NextResponse.json({ error: 'Discord integration not available' }, { status: 503 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'members';

  try {
    switch (type) {
      case 'members': {
        const members = await getGuildMembers(100);
        return NextResponse.json({
          members: members.map(m => ({
            id: m.user?.id,
            username: m.user?.username,
            displayName: m.nick || m.user?.global_name || m.user?.username,
            avatar: m.user?.avatar,
            joinedAt: m.joined_at,
            roles: m.roles,
          })),
          total: members.length,
        });
      }

      case 'intros': {
        const messages = await getChannelMessages(INTROS_CHANNEL_ID, 100);
        return NextResponse.json({
          intros: messages.map(m => ({
            id: m.id,
            authorId: m.author.id,
            authorName: m.author.username,
            content: m.content.slice(0, 500),
            timestamp: m.timestamp,
          })),
          total: messages.length,
          channelId: INTROS_CHANNEL_ID,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type. Use: members, intros' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Discord sync] Error:', err);
    return NextResponse.json({ error: 'Failed to read Discord data' }, { status: 500 });
  }
}

/**
 * POST /api/discord/sync — Bot pushes data to ZAO OS
 * Body: { type: 'wallets' | 'history', data: [...] }
 * Auth: Bearer token (DISCORD_BOT_WEBHOOK_SECRET)
 */
const syncSchema = z.object({
  type: z.enum(['wallets', 'history']),
  data: z.array(z.record(z.string(), z.unknown())),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.DISCORD_BOT_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Sync not configured' }, { status: 503 });
  }

  // Timing-safe token comparison
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { type, data } = parsed.data;

    switch (type) {
      case 'wallets': {
        // Bot sends wallet registry: [{ discord_id, discord_name, wallet_address }]
        let synced = 0;
        for (const entry of data) {
          const wallet = (entry.wallet_address as string || '').toLowerCase();
          const name = entry.discord_name as string || '';
          if (!wallet || !name) continue;

          // Update respect_members if wallet matches
          await supabaseAdmin
            .from('respect_members')
            .update({ wallet_address: wallet })
            .eq('name', name);
          synced++;
        }
        return NextResponse.json({ ok: true, synced });
      }

      case 'history': {
        // Bot sends fractal history entries from history.json
        let imported = 0;
        for (const entry of data) {
          const rankings = entry.rankings as { user_id: string; display_name: string; level: number; respect: number }[] || [];
          if (rankings.length === 0) continue;

          const sessionName = entry.group_name as string || `Fractal ${entry.fractal_number}`;
          const completedAt = entry.completed_at as string;
          const sessionDate = completedAt ? completedAt.split('T')[0] : new Date().toISOString().split('T')[0];

          const { data: session, error: sessionErr } = await supabaseAdmin
            .from('fractal_sessions')
            .insert({
              name: sessionName,
              session_date: sessionDate,
              scoring_era: '2x',
              participant_count: rankings.length,
              notes: `Synced from Discord bot. Facilitator: ${entry.facilitator_name || 'Unknown'}`,
            })
            .select('id')
            .single();

          if (sessionErr || !session) continue;

          const scoreRows = rankings.map((r, i) => ({
            session_id: session.id,
            member_name: r.display_name,
            wallet_address: null,
            rank: 7 - r.level,
            score: r.respect,
          }));

          await supabaseAdmin.from('fractal_scores').insert(scoreRows);
          imported++;
        }
        return NextResponse.json({ ok: true, imported });
      }
    }
  } catch (err) {
    console.error('[Discord sync] POST error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
