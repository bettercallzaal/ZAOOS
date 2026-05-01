import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  discoverLeaderboards,
  getLeaderboardForAddress,
} from '@/lib/empire-builder/client';
import { DEFAULT_TTL_MS, withCache } from '@/lib/empire-builder/cache';
import { ZABAL_TOKEN_ADDRESS } from '@/lib/empire-builder/config';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  wallet: z.string().optional(),
  slot: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session.fid) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'invalid_query' }, { status: 400 });
    }

    const wallet = (parsed.data.wallet ?? session.walletAddress ?? '').trim();
    if (!wallet) {
      return NextResponse.json({ success: true, data: { wallet: null, entry: null, boosters: [] } });
    }

    const slots = await withCache(
      `eb:slots:${ZABAL_TOKEN_ADDRESS}`,
      DEFAULT_TTL_MS * 5,
      () => discoverLeaderboards(ZABAL_TOKEN_ADDRESS),
    );
    if (slots.length === 0) {
      return NextResponse.json({ success: true, data: { wallet, entry: null, boosters: [] } });
    }

    const slotIndex = parsed.data.slot ? Number(parsed.data.slot) : 0;
    const slot = Number.isFinite(slotIndex) && slotIndex >= 0 && slotIndex < slots.length
      ? slots[slotIndex]
      : slots[0];

    const stats = await withCache(
      `eb:me:${slot.id}:${wallet.toLowerCase()}`,
      DEFAULT_TTL_MS,
      () => getLeaderboardForAddress(slot.id, wallet),
    );

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: { wallet, entry: null, boosters: [], slot: { id: slot.id, name: slot.name } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        wallet,
        slot: { id: slot.id, name: slot.name },
        entry: stats.entry,
        boosters: stats.boosters ?? [],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Empire Builder fetch failed';
    console.error('[empire-builder] me error', message);
    return NextResponse.json({ success: false, error: 'me_unavailable' }, { status: 502 });
  }
}
