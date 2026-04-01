import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

/**
 * Verify Stream.io webhook signature
 */
async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature || !STREAM_API_SECRET) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(STREAM_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return computed === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');

    // Verify webhook authenticity
    const valid = await verifySignature(rawBody, signature);
    if (!valid) {
      logger.error('[stream-webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type = event.type as string;

    switch (type) {
      // ── Participant tracking ──────────────────────────────
      case 'call.session_participant_joined': {
        const callCid = event.call_cid as string; // e.g. "audio_room:uuid"
        const callId = callCid.split(':')[1];
        if (callId) {
          const { error: rpcErr } = await supabaseAdmin.rpc('increment_participant_count', { room_id: callId });
          if (rpcErr) logger.error('[stream-webhook] increment failed:', rpcErr);
        }
        break;
      }

      case 'call.session_participant_left': {
        const callCid = event.call_cid as string;
        const callId = callCid.split(':')[1];
        if (callId) {
          const { error: rpcErr } = await supabaseAdmin.rpc('decrement_participant_count', { room_id: callId });
          if (rpcErr) logger.error('[stream-webhook] decrement failed:', rpcErr);
        }
        break;
      }

      // ── Call ended ────────────────────────────────────────
      case 'call.ended': {
        const callCid = event.call_cid as string;
        const callId = callCid.split(':')[1];
        if (callId) {
          // Find room by stream_call_id and mark as ended
          await supabaseAdmin
            .from('rooms')
            .update({ state: 'ended', ended_at: new Date().toISOString() })
            .eq('stream_call_id', callId);
        }
        break;
      }

      // ── Recording ready ───────────────────────────────────
      case 'call.recording_ready': {
        const callCid = event.call_cid as string;
        const callId = callCid.split(':')[1];
        const recordingUrl = event.call_recording?.url;
        if (callId && recordingUrl) {
          await supabaseAdmin
            .from('rooms')
            .update({ recording_url: recordingUrl })
            .eq('stream_call_id', callId);
        }
        break;
      }

      // ── Live started (could auto-cast) ────────────────────
      case 'call.live_started': {
        logger.info('[stream-webhook] Call went live:', event.call_cid);
        break;
      }

      default:
        // Log unhandled events for debugging
        logger.info(`[stream-webhook] Unhandled event: ${type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[stream-webhook] Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
