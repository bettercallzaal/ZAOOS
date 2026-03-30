import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getHindsightClient } from '@/lib/hindsight';
import { logger } from '@/lib/logger';

const RetainBodySchema = z.object({
  content: z.string().min(1).max(10000),
  eventType: z.enum([
    'cast',
    'track_share',
    'respect',
    'room_participation',
    'profile_update',
    'reaction',
    'governance_vote',
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
    const parsed = RetainBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, eventType, metadata } = parsed.data;

    const hindsight = await getHindsightClient();
    if (!hindsight) {
      return NextResponse.json({ error: 'Hindsight client not available' }, { status: 503 });
    }

    const result = await (hindsight as unknown as { retain: (userId: string, content: string, opts: unknown) => Promise<Record<string, unknown>> }).retain(userId, content, {
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
    logger.error('Failed to retain memory:', error);
    return NextResponse.json(
      { error: 'Failed to retain memory' },
      { status: 500 }
    );
  }
}
