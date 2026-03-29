import { NextRequest, NextResponse } from 'next/server';
import { hindsight } from '@/lib/hindsight';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'q (query) parameter is required' },
        { status: 400 }
      );
    }

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
