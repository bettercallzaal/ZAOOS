import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { Client } from '@gradio/client';

// ACE-Step v1.5 via HuggingFace Gradio Space
const ACESTEP_SPACE = 'ACE-Step/Ace-Step-v1.5';

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(500),
  lyrics: z.string().max(2000).default(''),
  duration: z.number().min(10).max(120).default(30),
});

// TODO: This is an expensive operation — add per-user rate limiting
// (e.g. 3 generations per hour) via middleware or a Supabase counter.

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { prompt, lyrics, duration } = parsed.data;

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return NextResponse.json({
        audioUrl: null,
        message: 'Set HF_TOKEN env var to enable AI music generation',
        mock: true,
      });
    }

    const client = await Client.connect(ACESTEP_SPACE, {
      token: hfToken as `hf_${string}`,
    });

    // Call the ACE-Step v1.5 generation endpoint
    // Parameters: prompt (tags/description), lyrics, duration, and generation settings
    const result = await client.predict('/generate', {
      prompt,
      lyrics: lyrics || '',
      audio_duration: duration,
      // Use turbo model for faster generation (8 inference steps)
      infer_step: 8,
      guidance_scale: 3.0,
      scheduler_type: 'euler',
      cfg_type: 'apg',
      omega_scale: 10.0,
    });

    // Gradio returns data with audio file info
    const data = result.data as unknown[];
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No audio returned from generator' },
        { status: 502 },
      );
    }

    // The result contains audio file(s) — extract the first one
    const audioResult = data[0];

    // Gradio file results can be a URL string or an object with a url property
    let audioUrl: string | null = null;
    if (typeof audioResult === 'string') {
      audioUrl = audioResult;
    } else if (
      audioResult &&
      typeof audioResult === 'object' &&
      'url' in audioResult
    ) {
      audioUrl = (audioResult as { url: string }).url;
    }

    if (!audioUrl) {
      logger.error(
        '[music/generate] Unexpected result format:',
        JSON.stringify(data),
      );
      return NextResponse.json(
        { error: 'Unexpected response from generator' },
        { status: 502 },
      );
    }

    return NextResponse.json({ audioUrl });
  } catch (error) {
    logger.error('[music/generate] error:', error);

    // Provide a clearer message for Gradio Space queue/timeout issues
    const message =
      error instanceof Error && error.message.includes('queue')
        ? 'AI music service is busy — try again in a minute'
        : 'Failed to generate audio';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
