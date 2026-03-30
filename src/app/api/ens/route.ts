import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveENSNames, getENSTextRecords, getENSAvatar } from '@/lib/ens/resolve';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  addresses: z.string().max(500).optional(),
  name: z.string().max(100).optional(),
});

/**
 * GET /api/ens?addresses=0x123,0x456 — resolve ENS names for addresses
 * GET /api/ens?name=vitalik.eth — get text records + avatar for an ENS name
 *
 * Public endpoint (no auth) — ENS data is public on-chain.
 * Server-side only — protects Alchemy API key from browser exposure.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { addresses, name } = parsed.data;

  try {
    // Resolve addresses → names
    if (addresses) {
      const addrList = addresses.split(',').map(a => a.trim()).filter(Boolean);
      const names = await resolveENSNames(addrList);
      return NextResponse.json({ names }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
      });
    }

    // Get text records for a name
    if (name) {
      const [records, avatar] = await Promise.all([
        getENSTextRecords(name),
        getENSAvatar(name),
      ]);
      return NextResponse.json({ name, records, avatar }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
      });
    }

    return NextResponse.json({ error: 'Provide addresses or name param' }, { status: 400 });
  } catch (err) {
    logger.error('[ens] resolution error:', err);
    return NextResponse.json({ error: 'ENS resolution failed' }, { status: 500 });
  }
}
