import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getEventGrid, type EventType } from '@/lib/grids/events';

/**
 * Event Grid query seam.
 *
 * GET /api/grids/events?type=<concert|battle|submission>&window=<upcoming|past>&limit=50
 *
 * Returns the assembled Event Grid profiles for recent/upcoming events (the
 * second of ZAO's domain grids). Session-gated - it is an internal knowledge
 * surface for ZOE + admins, not a public endpoint.
 */
const querySchema = z.object({
  type: z
    .enum(['concert', 'battle', 'stream', 'submission', 'other'])
    .optional(),
  window: z.enum(['upcoming', 'past']).optional(),
  limit: z
    .string()
    .optional()
    .pipe(z.coerce.number().int().positive().max(500).catch(50)),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    type: request.nextUrl.searchParams.get('type') ?? undefined,
    window: request.nextUrl.searchParams.get('window') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const profiles = await getEventGrid({
      type: parsed.data.type as EventType | undefined,
      timeWindow: parsed.data.window as 'upcoming' | 'past' | undefined,
      limit: parsed.data.limit,
    });

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: unknown) {
    logger.error('[grids/events] failed', error);
    return NextResponse.json({ error: 'Failed to assemble event grid' }, { status: 500 });
  }
}
