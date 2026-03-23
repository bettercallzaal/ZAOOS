import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

const WEBHOOK_SECRET = process.env.DISCORD_BOT_WEBHOOK_SECRET;

const VALID_EVENTS = [
  'fractal_started', 'vote_cast', 'round_complete',
  'fractal_complete', 'fractal_paused', 'fractal_resumed',
] as const;

const webhookSchema = z.object({
  event: z.enum(VALID_EVENTS),
  fractalId: z.string().min(1).max(200),
  data: z.record(z.string(), z.unknown()),
});

function timingSafeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * POST /api/fractals/webhook
 * Receives real-time events from the ZAO fractal Discord bot.
 */
export async function POST(req: NextRequest) {
  try {
    // Fail closed — reject if webhook secret is not configured
    if (!WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const body = await req.text();

    // Verify webhook authenticity (timing-safe)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const hmacHeader = req.headers.get('x-webhook-signature');

    if (hmacHeader) {
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      if (!timingSafeCompare(hmacHeader, expected)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (!timingSafeCompare(token, WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate payload with Zod
    const parsed = webhookSchema.safeParse(JSON.parse(body));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event, fractalId } = parsed.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = parsed.data.data as any;

    // Store event in a fractal_events table (or use Supabase Realtime)
    // For now, store in a simple events log + update live state
    switch (event) {
      case 'fractal_started': {
        await supabaseAdmin.from('fractal_live_sessions').upsert({
          thread_id: fractalId,
          status: 'active',
          facilitator_discord_id: data.facilitatorDiscordId,
          participant_discord_ids: data.participantDiscordIds,
          current_level: data.currentLevel,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'thread_id' });
        break;
      }

      case 'vote_cast': {
        await supabaseAdmin.from('fractal_live_sessions')
          .update({
            current_level: data.level,
            last_vote: {
              voterId: data.voterId,
              candidateId: data.candidateId,
              totalVotes: data.totalVotes,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('thread_id', fractalId);
        break;
      }

      case 'round_complete': {
        await supabaseAdmin.from('fractal_live_sessions')
          .update({
            current_level: data.level - 1,
            last_winner: {
              level: data.level,
              winnerId: data.winnerId,
              distribution: data.voteDistribution,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('thread_id', fractalId);
        break;
      }

      case 'fractal_complete': {
        await supabaseAdmin.from('fractal_live_sessions')
          .update({
            status: 'completed',
            results: data.results,
            total_rounds: data.totalRounds,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('thread_id', fractalId);
        break;
      }

      case 'fractal_paused': {
        await supabaseAdmin.from('fractal_live_sessions')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString(),
          })
          .eq('thread_id', fractalId);
        break;
      }

      case 'fractal_resumed': {
        await supabaseAdmin.from('fractal_live_sessions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('thread_id', fractalId);
        break;
      }
    }

    // Also log the raw event for audit
    await supabaseAdmin.from('fractal_webhook_log').insert({
      event_type: event,
      thread_id: fractalId,
      payload: data,
      received_at: new Date().toISOString(),
    }).then(() => {}, () => {}); // fire and forget

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Fractal webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
