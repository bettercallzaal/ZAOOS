import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventBySlug } from '@/lib/unlock/events';
import { findKeyHolder } from '@/lib/unlock/lock';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

/**
 * Verify whether a person holds the Unlock ticket (key) for an event.
 *
 * Input: eventSlug + at least one of { fid, wallet }.
 * - fid  -> resolves to Farcaster custody + verified ETH addresses via Neynar
 * - wallet -> checked directly
 * All candidate addresses are checked against the event's lock on Base.
 *
 * Used for gating recordings / perks for ticket holders. Research doc 863.
 */
const verifySchema = z
  .object({
    eventSlug: z.string().min(1).max(100),
    fid: z.number().int().positive().optional(),
    wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  })
  .refine((d) => d.fid !== undefined || d.wallet !== undefined, {
    message: 'Provide a fid or a wallet',
  });

async function addressesForFid(fid: number): Promise<string[]> {
  try {
    const user = await getUserByFid(fid);
    if (!user) return [];
    const verified: string[] = user.verified_addresses?.eth_addresses ?? [];
    const custody: string | undefined = user.custody_address;
    return [...verified, ...(custody ? [custody] : [])];
  } catch (err) {
    logger.error('[events/verify-ticket] Neynar lookup failed:', err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { eventSlug, fid, wallet } = parsed.data;

    const event = await getEventBySlug(eventSlug);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (!event.lock_address) {
      return NextResponse.json(
        { error: 'Event has no ticket lock yet', holdsTicket: false },
        { status: 409 }
      );
    }

    // Gather candidate wallets: directly passed + all addresses for the FID.
    const candidates: string[] = [];
    if (wallet) candidates.push(wallet);
    if (fid !== undefined) candidates.push(...(await addressesForFid(fid)));

    const matchedAddress = await findKeyHolder(event.lock_address, candidates);

    return NextResponse.json({
      holdsTicket: matchedAddress !== null,
      matchedAddress,
      eventSlug,
      lockAddress: event.lock_address,
      chainId: event.chain_id,
    });
  } catch (err) {
    logger.error('[events/verify-ticket] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
