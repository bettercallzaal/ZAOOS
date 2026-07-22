import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getBattleProfile } from '@/lib/grids/battle';

/**
 * Battle Grid query seam.
 *
 * GET /api/grids/battle?artist=<name>
 *
 * Returns the assembled Battle Grid profile for an artist (the third of
 * ZAO's domain grids). Session-gated - it is an internal knowledge surface for
 * ZOE + admins, not a public endpoint.
 */
const querySchema = z.object({
  artist: z.string().trim().min(1).max(200),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    artist: request.nextUrl.searchParams.get('artist') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const profile = await getBattleProfile(parsed.data.artist);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    logger.error('[grids/battle] failed', error);
    return NextResponse.json({ error: 'Failed to assemble battle profile' }, { status: 500 });
  }
}
