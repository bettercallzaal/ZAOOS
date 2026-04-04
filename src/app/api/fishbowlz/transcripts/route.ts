import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import crypto from 'crypto';

const TranscriptSchema = z.object({
  roomId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  speakerFid: z.number().int().positive().optional(),
  speakerName: z.string().min(1),
  speakerRole: z.enum(['host', 'speaker', 'listener_rotated', 'agent']),
  text: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationMs: z.number().int().positive().optional(),
  source: z.enum(['audio_capture', 'manual', 'agent_summary']).default('audio_capture'),
  platform: z.enum(['farcaster', 'twitter_x', 'native']).optional(),
});

function contentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = TranscriptSchema.parse(body);

    const { data: transcript, error } = await supabaseAdmin
      .from('fishbowl_transcripts')
      .insert({
        room_id: data.roomId,
        session_id: data.sessionId,
        speaker_fid: data.speakerFid,
        speaker_name: data.speakerName,
        speaker_role: data.speakerRole,
        text: data.text,
        started_at: data.startedAt,
        ended_at: data.endedAt,
        duration_ms: data.durationMs,
        source: data.source,
        platform: data.platform,
        content_hash: contentHash(data.text),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update room last_active_at
    await supabaseAdmin
      .from('fishbowl_rooms')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', data.roomId);

    return NextResponse.json(transcript, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const sessionId = searchParams.get('sessionId');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('fishbowl_transcripts')
    .select('*')
    .eq('room_id', roomId)
    .order('started_at', { ascending: true })
    .limit(limit);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: transcripts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transcripts });
}
