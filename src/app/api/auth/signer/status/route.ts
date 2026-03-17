import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionData } from '@/lib/auth/session';
import { getSignerStatus } from '@/lib/farcaster/neynar';

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

    // If approved, verify the signer belongs to the current user before saving
    if (status.status === 'approved') {
      if (status.fid && status.fid !== sessionData.fid) {
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
    console.error('Signer status error:', error);
    return NextResponse.json({ error: 'Failed to check signer status' }, { status: 500 });
  }
}
