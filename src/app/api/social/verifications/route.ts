import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccountVerifications } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

const schema = z.object({ fid: z.coerce.number().int().positive() });

/**
 * GET /api/social/verifications?fid=123
 *
 * Intentionally PUBLIC (no session guard): returns a FID's on-chain account
 * verifications, which are already public Farcaster protocol data. Consumed by
 * the public member-profile page (src/app/members/[username]/page.tsx), whose
 * data endpoints (friends, popular, verifications) are all public by design.
 * Abuse is bounded by the `/api/social` rate limit in middleware.ts — so this
 * is deliberately unguarded and should NOT be given a session guard.
 */
export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({ fid: req.nextUrl.searchParams.get('fid') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
  }
  try {
    const data = await getAccountVerifications(parsed.data.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[verifications] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }
}
