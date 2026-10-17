import { NextResponse } from 'next/server';
import { listMembers } from '@/lib/directory';
import { requireMember } from '@/lib/membership';

/**
 * GET - members who have signed in, in the shape the ported
 * `src/contexts/xmtp/members.ts` reads (same as ZAOOS /api/members).
 * `addresses` holds the member's XMTP address, the one `canMessage` checks.
 */
export async function GET() {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await listMembers();
    const members = rows.map((m) => ({
      fid: m.fid,
      username: m.username,
      displayName: m.display_name || m.username || `FID ${m.fid}`,
      pfpUrl: m.pfp_url,
      addresses: m.xmtp_address ? [m.xmtp_address] : [],
      storedXmtpAddress: m.xmtp_address,
      lastLoginAt: m.last_login_at,
    }));
    return NextResponse.json({ members, currentFid: session.fid });
  } catch (error: unknown) {
    console.error('[members]', error);
    return NextResponse.json({ error: 'Could not load members' }, { status: 500 });
  }
}
