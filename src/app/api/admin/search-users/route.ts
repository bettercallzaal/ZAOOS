import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { searchUsers, getUserByFid, getUsersByFids } from '@/lib/farcaster/neynar';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

// Resolve address → ENS name (returns null if none)
async function resolveEns(address: string): Promise<string | null> {
  try {
    const name = await ensClient.getEnsName({ address: address as `0x${string}` });
    return name;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get('q')?.trim();
  const fidParam = req.nextUrl.searchParams.get('fid');

  try {
    // If FID is provided, look up directly
    if (fidParam) {
      const fid = parseInt(fidParam);
      if (isNaN(fid)) {
        return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
      }

      const user = await getUserByFid(fid);
      if (!user) {
        return NextResponse.json({ users: [] });
      }

      const custodyAddress = user.custody_address || '';
      const verifiedAddresses: string[] = user.verified_addresses?.eth_addresses || [];
      const allAddresses = [custodyAddress, ...verifiedAddresses].filter(Boolean);

      // Resolve ENS for all addresses in parallel
      const ensResults = await Promise.all(allAddresses.map(resolveEns));
      const ensMap: Record<string, string> = {};
      allAddresses.forEach((addr, i) => {
        if (ensResults[i]) ensMap[addr.toLowerCase()] = ensResults[i]!;
      });

      return NextResponse.json({
        users: [{
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          pfp_url: user.pfp_url,
          custody_address: custodyAddress,
          verified_addresses: verifiedAddresses,
          ens: ensMap,
        }],
      });
    }

    // Otherwise search by username
    if (!query || query.length < 1) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const data = await searchUsers(query, 8);
    const users = data.result?.users || [];

    // Batch-fetch full profiles to get wallet addresses (single API call)
    const sliced = users.slice(0, 8);
    const fids = sliced.map((u: Record<string, unknown>) => u.fid as number);
    const fullUsers = await getUsersByFids(fids);
    const fullUserMap = new Map(fullUsers.map((u: Record<string, unknown>) => [u.fid as number, u]));

    const enriched = await Promise.all(
      sliced.map(async (u: Record<string, unknown>) => {
        const fid = u.fid as number;
        const full = fullUserMap.get(fid) as Record<string, unknown> | undefined;
        if (!full) {
          return {
            fid: u.fid,
            username: u.username,
            display_name: u.display_name,
            pfp_url: u.pfp_url,
            custody_address: '',
            verified_addresses: [],
            ens: {},
          };
        }

        const custodyAddress = (full.custody_address as string) || '';
        const verifiedAddresses: string[] = (full.verified_addresses as Record<string, unknown>)?.eth_addresses as string[] || [];
        const allAddresses = [custodyAddress, ...verifiedAddresses].filter(Boolean);

        // Resolve ENS (do first address only to keep fast)
        const ensMap: Record<string, string> = {};
        if (allAddresses.length > 0) {
          const primaryEns = await resolveEns(allAddresses[0]);
          if (primaryEns) ensMap[allAddresses[0].toLowerCase()] = primaryEns;
        }

        return {
          fid: full.fid,
          username: full.username,
          display_name: full.display_name,
          pfp_url: full.pfp_url,
          custody_address: custodyAddress,
          verified_addresses: verifiedAddresses,
          ens: ensMap,
        };
      })
    );

    return NextResponse.json({ users: enriched.filter(Boolean) });
  } catch (error) {
    console.error('Admin search users error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
