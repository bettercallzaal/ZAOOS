import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getHindsightClient } from '@/lib/hindsight';

const ReflectBodySchema = z.object({
  prompt: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    if (String(session.fid) !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ReflectBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt } = parsed.data;

    const hindsight = await getHindsightClient();
    if (!hindsight) return NextResponse.json({ error: 'Hindsight not available' }, { status: 503 });

    const reflection = await (hindsight as any).reflect(userId, prompt);

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('Failed to reflect on memories:', error);
    return NextResponse.json(
      { error: 'Failed to reflect on memories' },
      { status: 500 }
    );
  }
}
