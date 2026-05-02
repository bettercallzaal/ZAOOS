import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  discoverLeaderboards,
  getLeaderboard,
} from '@/lib/empire-builder/client';
import { DEFAULT_TTL_MS, withCache } from '@/lib/empire-builder/cache';
import { ZABAL_TOKEN_ADDRESS } from '@/lib/empire-builder/config';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  slot: z.string().optional(),
  tokenAddress: z.string().optional(),
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

    const tokenAddress = parsed.data.tokenAddress ?? ZABAL_TOKEN_ADDRESS;
    const slots = await withCache(
      `eb:slots:${tokenAddress}`,
      DEFAULT_TTL_MS * 5,
      () => discoverLeaderboards(tokenAddress),
    );
    if (slots.length === 0) {
      return NextResponse.json({ success: true, data: { slots: [], leaderboard: null } });
    }

    const slotIndex = parsed.data.slot ? Number(parsed.data.slot) : 0;
    const slot = Number.isFinite(slotIndex) && slotIndex >= 0 && slotIndex < slots.length
      ? slots[slotIndex]
      : slots[0];

    const leaderboard = await withCache(
      `eb:leaderboard:${slot.id}`,
      DEFAULT_TTL_MS,
      () => getLeaderboard(slot.id),
    );

    return NextResponse.json({
      success: true,
      data: {
        slots: slots.map((s, i) => ({ index: i, id: s.id, name: s.name, type: s.leaderboard_type })),
        active: { index: slots.findIndex((s) => s.id === slot.id), id: slot.id },
        leaderboard,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Empire Builder fetch failed';
    console.error('[empire-builder] leaderboard error', message);
    return NextResponse.json({ success: false, error: 'leaderboard_unavailable' }, { status: 502 });
  }
}
