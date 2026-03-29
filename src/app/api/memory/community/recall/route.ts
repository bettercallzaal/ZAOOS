import { NextRequest, NextResponse } from 'next/server';
import { hindsight } from '@/lib/hindsight';

// Community bank ID - uses a shared bank for community-wide memories
const COMMUNITY_BANK_ID = 'zao-community';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Note: In a real implementation, you might query across multiple user banks
    // or use a dedicated community bank. For now, we use a shared bank ID.
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'q (query) parameter is required' },
        { status: 400 }
      );
    }

    // Recall from community bank
    const results = await hindsight.recall(COMMUNITY_BANK_ID, query, { limit });

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
