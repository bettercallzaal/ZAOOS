import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { getReputationProfile } from '@/lib/grids/reputation';

/**
 * Reputation Grid query seam.
 *
 * GET /api/grids/reputation?id=<name|username|wallet|fid|zid>
 *
 * Returns the assembled Reputation Grid profile for a member (the first of
 * ZAO's domain grids). Session-gated - it is an internal knowledge surface for
 * ZOE + admins, not a public endpoint.
 */
const querySchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    id: request.nextUrl.searchParams.get('id') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const profile = await getReputationProfile(parsed.data.id);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    logger.error('[grids/reputation] failed', error);
    return NextResponse.json({ error: 'Failed to assemble reputation profile' }, { status: 500 });
  }
}
