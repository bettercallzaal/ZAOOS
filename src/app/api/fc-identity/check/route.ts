import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkGatingEligibility, getFcQualityScoreByFid } from '@/lib/fc-identity';
import { logger } from '@/lib/logger';

const checkQuerySchema = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'invalid address')
      .optional(),
    fid: z.coerce.number().int().positive().optional(),
    minScore: z.coerce.number().int().min(0).default(0),
  })
  .refine((d) => d.address !== undefined || d.fid !== undefined, {
    message: 'address or fid required',
  });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = checkQuerySchema.safeParse({
    address: searchParams.get('address') ?? undefined,
    fid: searchParams.get('fid') ?? undefined,
    minScore: searchParams.get('minScore') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'invalid query parameters' },
      { status: 400 },
    );
  }
  const { address, fid, minScore } = parsed.data;

  try {
    // Check by ETH address
    if (address) {
      const result = await checkGatingEligibility(address as `0x${string}`, minScore);
      return NextResponse.json({
        type: 'address',
        address,
        ...result,
        // result.score is a bigint; override the spread with a serializable value
        score: result.score !== null ? result.score.toString() : null,
      });
    }

    // Check by FID
    if (fid !== undefined) {
      const score = await getFcQualityScoreByFid(fid);
      return NextResponse.json({
        type: 'fid',
        fid,
        // score is a bigint; JSON.stringify cannot serialize BigInt, so stringify it
        score: score !== null ? score.toString() : null,
        eligible: score !== null ? score >= BigInt(minScore) : true,
      });
    }
  } catch (err) {
    logger.error('[fc-identity] chain read failed:', err);
    return NextResponse.json({ error: 'Chain read failed' }, { status: 502 });
  }
}
