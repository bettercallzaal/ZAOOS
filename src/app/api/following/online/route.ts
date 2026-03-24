import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getFollowing } from '@/lib/farcaster/neynar';

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address?: string;
  verified_addresses?: {
    eth_addresses?: string[];
    sol_addresses?: string[];
  };
}

/**
 * Returns ALL users the current user follows on Farcaster,
 * with their profile info and Ethereum addresses (for XMTP checks).
 * Paginates through the full list server-side.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allUsers: NeynarUser[] = [];
    let cursor: string | undefined;
    const MAX_PAGES = 2; // Cap at 200 follows to keep XMTP checks fast

    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await getFollowing(session.fid, session.fid, 'desc_chron', cursor, 100);
      const users = (data.users || []).map(
        (item: { user?: NeynarUser } & NeynarUser) => item.user || item
      );
      allUsers.push(...users);

      cursor = data.next?.cursor;
      if (!cursor) break;
    }

    // Map to the shape the client needs (same as /api/members)
    const members = allUsers
      .filter((u) => u.fid !== session.fid) // exclude self
      .map((u) => {
        const addresses: string[] = [];
        if (u.custody_address) addresses.push(u.custody_address);
        if (u.verified_addresses?.eth_addresses) {
          addresses.push(...u.verified_addresses.eth_addresses);
        }
        return {
          fid: u.fid,
          username: u.username || null,
          displayName: u.display_name || u.username || `FID ${u.fid}`,
          pfpUrl: u.pfp_url || null,
          addresses,
        };
      });

    return NextResponse.json({ members, currentFid: session.fid }, { headers: { 'Cache-Control': 'private, max-age=15' } });
  } catch (err) {
    console.error('Following online error:', err);
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }
}
