import { type NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { z } from 'zod';
import { MemberNotInDirectoryError, setXmtpAddress, XmtpAddressTakenError } from '@/lib/directory';
import { requireMember } from '@/lib/membership';
import { clientIp, limits } from '@/lib/rate-limit';
import { addressClaimMessage } from '@/lib/xmtp/address-claim';

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const postSchema = z.object({
  xmtpAddress: addressSchema,
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
});

/** GET ?address= - the exact message to sign to prove control of that address. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = addressSchema.safeParse(req.nextUrl.searchParams.get('address') ?? '');
    if (!parsed.success) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

    return NextResponse.json({ message: addressClaimMessage(parsed.data, session.fid) });
  } catch (error: unknown) {
    console.error('[xmtp-address GET]', error);
    return NextResponse.json({ error: 'Could not build the message' }, { status: 500 });
  }
}

/**
 * POST - save the member's XMTP address so other members can find them.
 * Requires a signature over the GET message from that address (401 otherwise),
 * and the address must not belong to another member (409).
 */
export async function POST(req: NextRequest) {
  try {
    const limited = limits.addressWrite(`addr:${clientIp(req.headers)}`);
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
      );
    }

    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const address = parsed.data.xmtpAddress.toLowerCase() as `0x${string}`;
    const valid = await verifyMessage({
      address,
      message: addressClaimMessage(address, session.fid),
      signature: parsed.data.signature as `0x${string}`,
    }).catch(() => false);
    if (!valid) {
      return NextResponse.json({ error: 'Signature does not match this address' }, { status: 401 });
    }

    try {
      await setXmtpAddress(session.fid, address);
    } catch (error: unknown) {
      if (error instanceof XmtpAddressTakenError) {
        return NextResponse.json({ error: 'This address belongs to another member' }, { status: 409 });
      }
      if (error instanceof MemberNotInDirectoryError) {
        console.error(`[xmtp-address POST] fid ${session.fid} has no directory row`);
        return NextResponse.json(
          { error: 'You are not in the member directory yet. Sign out and sign in again.' },
          { status: 404 },
        );
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[xmtp-address POST]', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
