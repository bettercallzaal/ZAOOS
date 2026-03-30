import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { isWearerOfHat, getWornHats } from '@/lib/hats/client';
import { HAT_IDS, PROJECT_HAT_IDS, HAT_LABELS } from '@/lib/hats/constants';
import { logger } from '@/lib/logger';

const CheckSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  hatId: z.string().optional(),
});

/** All known hat IDs for checking all roles at once */
const ALL_HAT_IDS = [
  ...Object.values(HAT_IDS),
  ...Object.values(PROJECT_HAT_IDS),
];

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const parsed = CheckSchema.safeParse({
      wallet: url.searchParams.get('wallet'),
      hatId: url.searchParams.get('hatId') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const wallet = parsed.data.wallet as `0x${string}`;

    // If a specific hatId is provided, check just that one
    if (parsed.data.hatId) {
      const hatId = BigInt(parsed.data.hatId);
      const isWearer = await isWearerOfHat(wallet, hatId);
      return NextResponse.json({
        wallet,
        hatId: parsed.data.hatId,
        label: HAT_LABELS[hatId.toString()] || null,
        isWearer,
      });
    }

    // Otherwise, check all known hats and return the ones the wallet wears
    const wornHats = await getWornHats(wallet, ALL_HAT_IDS);
    const roles = wornHats.map((id) => ({
      hatId: id.toString(),
      label: HAT_LABELS[id.toString()] || null,
    }));

    return NextResponse.json({ wallet, roles });
  } catch (err) {
    logger.error('[hats/check] Error:', err);
    return NextResponse.json({ error: 'Failed to check hat status' }, { status: 500 });
  }
}
