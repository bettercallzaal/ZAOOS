import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ACE-Step via HuggingFace Inference API
const HF_API_URL =
  'https://api-inference.huggingface.co/models/ACE-Step/ACE-Step-v1-3.5B';

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().min(5).max(60).default(30),
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

    const { prompt, duration } = parsed.data;

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      // Return a mock response for development when HF_TOKEN is not configured
      return NextResponse.json({
        audioUrl: null,
        message: 'Set HF_TOKEN env var to enable AI music generation',
        mock: true,
      });
    }

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: duration * 50, // rough token-to-seconds approximation
        },
      }),
      signal: AbortSignal.timeout(120_000), // 2-minute timeout for generation
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[music/generate] HuggingFace API error:', errorText);
      return NextResponse.json(
        { error: 'AI generation service unavailable' },
        { status: 502 },
      );
    }

    // HuggingFace returns raw audio bytes
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    logger.error('[music/generate] error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 },
    );
  }
}
