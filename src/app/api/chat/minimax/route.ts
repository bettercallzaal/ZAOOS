import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { z } from 'zod';

const minimaxSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

export async function POST(req: NextRequest) {
  if (!ENV.MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'Minimax not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const parsed = minimaxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { messages, model, temperature, max_tokens } = parsed.data;
    const endpoint = ENV.MINIMAX_API_URL || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
    const selectedModel = model || ENV.MINIMAX_MODEL || 'MiniMax-M2.7';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        ...(typeof temperature === 'number' && Number.isFinite(temperature) ? { temperature } : {}),
        ...(typeof max_tokens === 'number' && Number.isFinite(max_tokens) ? { max_tokens: max_tokens } : {}),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[minimax] API error:', res.status, text);
      return NextResponse.json({ error: 'Minimax request failed', details: text }, { status: res.status });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[minimax] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
