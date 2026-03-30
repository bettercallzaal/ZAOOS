import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionData } from '@/lib/auth/session';
import { getSignerStatus } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const saveSignerSchema = z.object({
  signerUuid: z.string().min(1),
  fid: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const sessionData = await getSessionData();
  if (!sessionData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = saveSignerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Verify the SIWN fid matches the logged-in user
    if (parsed.data.fid !== sessionData.fid) {
      return NextResponse.json({ error: 'FID mismatch' }, { status: 403 });
    }

    // Verify with Neynar that the signer actually belongs to this user's FID
    const signerStatus = await getSignerStatus(parsed.data.signerUuid);
    if (!signerStatus.fid || signerStatus.fid !== sessionData.fid) {
      return NextResponse.json(
        { error: 'Signer does not belong to this user' },
        { status: 403 }
      );
    }

    // Save signer_uuid to session
    const session = await getSession();
    session.signerUuid = parsed.data.signerUuid;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Save signer error:', error);
    return NextResponse.json({ error: 'Failed to save signer' }, { status: 500 });
  }
}
