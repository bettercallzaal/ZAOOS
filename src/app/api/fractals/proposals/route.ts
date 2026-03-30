// src/app/api/fractals/proposals/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { fetchProposalsOnChain } from '@/lib/ordao/client';
import { logger } from '@/lib/logger';

const ORNODE_URL = 'https://ornode2.frapps.xyz';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Primary: try ornode ──────────────────────────────────────────
  try {
    const res = await fetch(`${ORNODE_URL}/proposals?limit=20`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`ornode returned ${res.status}`);
    }

    const data = await res.json();
    const proposals = Array.isArray(data) ? data : (data.proposals ?? []);

    if (proposals.length === 0) {
      throw new Error('ornode returned empty proposals');
    }

    logger.info(`[proposals] Served ${proposals.length} proposals from ornode`);
    return NextResponse.json({ proposals, total: proposals.length, source: 'ornode' });
  } catch (ornodeErr) {
    logger.warn('[proposals] ornode unavailable, falling back to on-chain read:', ornodeErr instanceof Error ? ornodeErr.message : ornodeErr);
  }

  // ── Fallback: read directly from OREC contract on Optimism ─────
  try {
    const onChainProposals = await fetchProposalsOnChain(20);

    logger.info(`[proposals] Served ${onChainProposals.length} proposals from on-chain fallback`);
    return NextResponse.json({
      proposals: onChainProposals,
      total: onChainProposals.length,
      source: 'onchain',
    });
  } catch (onChainErr) {
    logger.error('[proposals] On-chain fallback also failed:', onChainErr instanceof Error ? onChainErr.message : onChainErr);
    return NextResponse.json({ proposals: [], total: 0, source: 'unavailable' });
  }
}
