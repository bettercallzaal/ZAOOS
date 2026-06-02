import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionData } from '@/lib/auth/session';
import { getSignerStatus } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const sessionData = await getSessionData();
  if (!sessionData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signerUuid = req.nextUrl.searchParams.get('signer_uuid');
  if (!signerUuid) {
    return NextResponse.json({ error: 'Missing signer_uuid' }, { status: 400 });
  }

  try {
    const status = await getSignerStatus(signerUuid);

    // Never reveal/bind a signer that belongs to a different FID.
    if (status.fid && status.fid !== sessionData.fid) {
      return NextResponse.json(
        { error: 'Signer does not belong to this user' },
        { status: 403 }
      );
    }

    // Save signer UUID to session once approved — but ONLY when Neynar confirms
    // the signer's FID matches this user. Fail CLOSED on a missing FID (mirrors
    // signer/save/route.ts:32) so an approved-but-unassociated signer can never
    // be bound to the session.
    if (status.status === 'approved') {
      if (!status.fid || status.fid !== sessionData.fid) {
        return NextResponse.json(
          { error: 'Signer does not belong to this user' },
          { status: 403 }
        );
      }
      const session = await getSession();
      session.signerUuid = signerUuid;
      await session.save();
    }

    return NextResponse.json({
      status: status.status,
      signerUuid: status.signer_uuid,
    });
  } catch (error) {
    logger.error('Signer status error:', error);
    return NextResponse.json({ error: 'Failed to check signer status' }, { status: 500 });
  }
}
