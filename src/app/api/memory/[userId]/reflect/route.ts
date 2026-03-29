import { NextRequest, NextResponse } from 'next/server';
import { hindsight } from '@/lib/hindsight';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    const reflection = await hindsight.reflect(userId, prompt);

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('Failed to reflect on memories:', error);
    return NextResponse.json(
      { error: 'Failed to reflect on memories' },
      { status: 500 }
    );
  }
}
