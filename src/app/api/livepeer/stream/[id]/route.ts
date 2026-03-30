import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { Livepeer } from 'livepeer';
import { logger } from '@/lib/logger';

function getLivepeerClient() {
  const apiKey = process.env.LIVEPEER_API_KEY;
  if (!apiKey) throw new Error('LIVEPEER_API_KEY not configured');
  return new Livepeer({ apiKey });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const livepeer = getLivepeerClient();
    const result = await livepeer.stream.get(id);

    return NextResponse.json({
      stream: {
        id: result.stream?.id,
        isActive: result.stream?.isActive,
        playbackId: result.stream?.playbackId,
        record: result.stream?.record,
      },
    });
  } catch (error) {
    logger.error('Get Livepeer stream error:', error);
    return NextResponse.json({ error: 'Failed to get stream' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const livepeer = getLivepeerClient();
    await livepeer.stream.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete Livepeer stream error:', error);
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
  }
}
