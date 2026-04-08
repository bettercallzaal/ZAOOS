import { NextRequest, NextResponse } from 'next/server';
import { getAccountVerifications } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ fid: z.coerce.number().int().positive() });

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
