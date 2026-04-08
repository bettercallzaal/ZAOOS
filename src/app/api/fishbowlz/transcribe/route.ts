import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';

const TranscriptSegmentSchema = z.object({
  roomId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  speakerFid: z.number().int().positive().optional(),
  speakerName: z.string().min(1),
  speakerRole: z.enum(['host', 'speaker', 'listener_rotated', 'agent']),
  text: z.string().min(1).max(5000),
  startedAt: z.string().datetime().optional(),
  durationMs: z.number().int().positive().optional(),
  source: z.enum(['audio_capture', 'manual', 'whisper', 'agent_summary']).default('whisper'),
  platform: z.enum(['farcaster', 'twitter_x', 'native']).optional(),
});

// POST — receive transcript from Whisper proxy or agent
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = TranscriptSegmentSchema.parse(body);

    const startedAt = data.startedAt ?? new Date().toISOString();

    const { data: transcript, error } = await supabaseAdmin
      .from('fishbowl_transcripts')
      .insert({
        room_id: data.roomId,
        session_id: data.sessionId,
        speaker_fid: data.speakerFid,
        speaker_name: data.speakerName,
        speaker_role: data.speakerRole,
        text: data.text,
        started_at: startedAt,
        duration_ms: data.durationMs,
        source: data.source,
        platform: data.platform,
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

// GET — Whisper proxy: accept audio, transcribe via Whisper, return text
// This proxies to OpenAI Whisper API or a self-hosted instance
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioUrl = searchParams.get('url');
  const model = searchParams.get('model') ?? 'whisper-1';

  if (!audioUrl) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  try {
    // Download audio from URL
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 502 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Transcription service unavailable' }, { status: 500 });
    }

    // Transcribe via OpenAI Whisper
    const formData = new FormData();
    formData.append('file', await audioRes.blob(), 'audio.m4a');
    formData.append('model', model);

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      return NextResponse.json({ error: `Whisper error: ${err}` }, { status: 502 });
    }

    const result = await whisperRes.json();
    return NextResponse.json({ text: result.text, model });
  } catch (err) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
