import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const RecapSchema = z.object({
  roomId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid && !session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RecapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { roomId } = parsed.data;

    // Fetch room details
    const { data: room, error: roomError } = await supabaseAdmin
      .from('fishbowl_rooms')
      .select('title, description, host_name')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Fetch all transcripts for this room
    const { data: transcripts, error: txError } = await supabaseAdmin
      .from('fishbowl_transcripts')
      .select('speaker_name, text, started_at')
      .eq('room_id', roomId)
      .order('started_at', { ascending: true });

    if (txError) {
      logger.error('Recap transcript fetch error:', txError);
      return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({
        recap: 'No conversation recorded yet. The discussion hasn\'t started or no one has spoken.',
      });
    }

    // Format transcript for the AI
    const formattedTranscript = transcripts
      .map((t) => `${t.speaker_name}: ${t.text}`)
      .join('\n');

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const minimaxKey = process.env.MINIMAX_API_KEY;
    const minimaxUrl = process.env.MINIMAX_API_URL;
    const minimaxModel = process.env.MINIMAX_MODEL;

    let recap: string | null = null;

    const systemPrompt =
      'You are a helpful assistant that creates concise recaps of audio room conversations. ' +
      'The user just joined a fishbowl discussion and wants to know what they missed. ' +
      'Summarize the key points, topics discussed, and any decisions or highlights. ' +
      'Keep it under 200 words. Be conversational and friendly. ' +
      'Start with "Here\'s what you missed:" and use bullet points for key topics.';

    const userPrompt =
      `Room: "${room.title}"${room.description ? ` - ${room.description}` : ''}\n` +
      `Hosted by: ${room.host_name}\n\n` +
      `Transcript so far:\n${formattedTranscript.slice(0, 8000)}`;

    // Try Anthropic first
    if (anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          recap = data.content?.[0]?.text || null;
        }
      } catch {
        /* fall through to minimax */
      }
    }

    // Fall back to Minimax
    if (!recap && minimaxKey && minimaxUrl) {
      try {
        const res = await fetch(minimaxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${minimaxKey}`,
          },
          body: JSON.stringify({
            model: minimaxModel || 'MiniMax-Text-01',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 500,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          recap = data.choices?.[0]?.message?.content || null;
        }
      } catch {
        /* no recap available */
      }
    }

    // Fallback: simple extractive summary
    if (!recap) {
      const speakers = [...new Set(transcripts.map((t) => t.speaker_name))];
      const topicCount = transcripts.length;
      recap =
        `Here's what you missed:\n` +
        `- ${speakers.join(', ')} have been speaking\n` +
        `- ${topicCount} transcript segments recorded so far\n` +
        `- Join in to hear what's being discussed!`;
    }

    return NextResponse.json({ recap, transcriptCount: transcripts.length });
  } catch (err) {
    logger.error('Recap error:', err);
    return NextResponse.json({ error: 'Failed to generate recap' }, { status: 500 });
  }
}
