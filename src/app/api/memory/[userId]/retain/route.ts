import { NextRequest, NextResponse } from 'next/server';
import { hindsight } from '@/lib/hindsight';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    const { content, eventType, metadata } = body;

    if (!content || !eventType) {
      return NextResponse.json(
        { error: 'content and eventType are required' },
        { status: 400 }
      );
    }

    const result = await hindsight.retain(userId, content, {
      metadata: {
        eventType,
        ...metadata,
      },
    });

    return NextResponse.json(
      { success: true, memoryId: result.id || result.memoryId || result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to retain memory:', error);
    return NextResponse.json(
      { error: 'Failed to retain memory' },
      { status: 500 }
    );
  }
}
