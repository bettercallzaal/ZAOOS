import { NextRequest, NextResponse } from 'next/server';
import { checkGatingEligibility, getFcQualityScoreByFid } from '@/lib/fc-identity';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const fid = searchParams.get('fid');
  const minScore = parseInt(searchParams.get('minScore') ?? '0', 10);

  if (!address && !fid) {
    return NextResponse.json({ error: 'address or fid required' }, { status: 400 });
  }

  try {
    // Check by ETH address
    if (address) {
      const result = await checkGatingEligibility(address as `0x${string}`, minScore);
      return NextResponse.json({
        type: 'address',
        address,
        ...result,
      });
    }

    // Check by FID
    if (fid) {
      const fidNum = parseInt(fid, 10);
      const score = await getFcQualityScoreByFid(fidNum);
      return NextResponse.json({
        type: 'fid',
        fid: fidNum,
        score,
        eligible: score !== null ? score >= BigInt(minScore) : true,
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Chain read failed', details: String(err) }, { status: 502 });
  }
}
