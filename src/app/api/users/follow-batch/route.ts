import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { followUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({
  targetFids: z.array(z.number().int().positive()).min(1).max(500),
});

/**
 * Batch follow multiple users at once.
 * Neynar supports up to 100 FIDs per request, so we chunk.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const { targetFids } = parsed.data;

  // Remove self from list
  const fidsToFollow = targetFids.filter((fid) => fid !== session.fid);
  if (fidsToFollow.length === 0) {
    return NextResponse.json({ success: true, followed: 0, failed: 0 });
  }

  // Chunk into batches of 100 (Neynar limit)
  const batches: number[][] = [];
  for (let i = 0; i < fidsToFollow.length; i += 100) {
    batches.push(fidsToFollow.slice(i, i + 100));
  }

  let followed = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    batches.map(async (batch) => {
      try {
        await followUser(session.signerUuid!, batch);
        return batch.length;
      } catch (err) {
        logger.error('[follow-batch] batch failed:', err);
        throw err;
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      followed += result.value;
    } else {
      failed += 100; // approximate
    }
  }

  return NextResponse.json({ success: true, followed, failed });
}
