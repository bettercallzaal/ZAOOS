import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getHindsightClient } from '@/lib/hindsight';

// Community bank ID - uses a shared bank for community-wide memories
const COMMUNITY_BANK_ID = 'zao-community';

const CommunityRecallQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsed = CommunityRecallQuerySchema.safeParse({
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

    // Recall from community bank
    const hindsight = await getHindsightClient();
    if (!hindsight) return NextResponse.json({ error: 'Hindsight not available' }, { status: 503 });

    const results = await (hindsight as any).recall(COMMUNITY_BANK_ID, query, { limit });

    return NextResponse.json({
      memories: results.map((r: { content: string; score: number; metadata?: Record<string, unknown> }) => ({
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    console.error('Failed to recall community memories:', error);
    return NextResponse.json(
      { error: 'Failed to recall community memories' },
      { status: 500 }
    );
  }
}
