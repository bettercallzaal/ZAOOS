import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hindsight } from '@/lib/hindsight';

const RecallQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export async function GET(
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

    const searchParams = request.nextUrl.searchParams;
    const parsed = RecallQuerySchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q: query, limit } = parsed.data;
    const results = await hindsight.recall(userId, query, { limit });

    return NextResponse.json({
      memories: results.map((r: { content: string; score: number; metadata?: Record<string, unknown> }) => ({
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    console.error('Failed to recall memories:', error);
    return NextResponse.json(
      { error: 'Failed to recall memories' },
      { status: 500 }
    );
  }
}
