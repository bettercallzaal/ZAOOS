import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { searchUsers, getUserByFid, getUsersByFids } from '@/lib/farcaster/neynar';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { logger } from '@/lib/logger';

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

/** Build a basic user object from search results (no wallet/ENS) */
function basicUser(u: Record<string, unknown>) {
  return {
    fid: u.fid,
    username: u.username,
    display_name: u.display_name,
    pfp_url: u.pfp_url,
    custody_address: '',
    verified_addresses: [] as string[],
    ens: {} as Record<string, string>,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get('q')?.trim();
  const fidParam = req.nextUrl.searchParams.get('fid');

  // ── FID lookup ──────────────────────────────────────────────────────────────
  if (fidParam) {
    const fid = parseInt(fidParam);
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    try {
      const user = await getUserByFid(fid);
      if (!user) {
        return NextResponse.json({ users: [] });
      }

      const custodyAddress = user.custody_address || '';
      const verifiedAddresses: string[] = user.verified_addresses?.eth_addresses || [];
      const allAddresses = [custodyAddress, ...verifiedAddresses].filter(Boolean);

      // ENS is nice-to-have, don't fail the request if it errors
      const ensMap: Record<string, string> = {};
      try {
        const ensResults = await Promise.all(allAddresses.map(resolveEns));
        allAddresses.forEach((addr, i) => {
          if (ensResults[i]) ensMap[addr.toLowerCase()] = ensResults[i]!;
        });
      } catch (e) {
        logger.warn('[search-users] ENS resolution failed for FID', fid, e);
      }

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
    } catch (error) {
      logger.error('[search-users] FID lookup failed:', fid, error);
      return NextResponse.json(
        { error: `Failed to look up FID ${fid} - Farcaster API may be down` },
        { status: 502 }
      );
    }
  }

  // ── Username search ─────────────────────────────────────────────────────────
  if (!query || query.length < 1) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Step 1: Search Neynar for matching usernames
  let searchData;
  try {
    searchData = await searchUsers(query, 8);
  } catch (error) {
    logger.error('[search-users] Neynar search failed for query:', query, error);
    return NextResponse.json(
      { error: `Farcaster search failed for "${query}" - API may be rate-limited or down` },
      { status: 502 }
    );
  }

  const users = searchData.result?.users || [];
  if (users.length === 0) {
    logger.info('[search-users] No results from Neynar for query:', query);
    return NextResponse.json({ users: [] });
  }

  const sliced = users.slice(0, 8);

  // Step 2: Batch-fetch full profiles for wallet addresses (graceful degradation)
  let fullUserMap = new Map<number, Record<string, unknown>>();
  try {
    const fids = sliced.map((u: Record<string, unknown>) => u.fid as number);
    const fullUsers = await getUsersByFids(fids);
    fullUserMap = new Map(fullUsers.map((u: Record<string, unknown>) => [u.fid as number, u]));
  } catch (error) {
    // Profile enrichment failed - return basic results without wallets
    logger.warn('[search-users] Bulk profile fetch failed, returning basic results:', error);
    return NextResponse.json({ users: sliced.map(basicUser) });
  }

  // Step 3: Enrich with ENS (best-effort, never blocks results)
  const enriched = await Promise.all(
    sliced.map(async (u: Record<string, unknown>) => {
      const fid = u.fid as number;
      const full = fullUserMap.get(fid) as Record<string, unknown> | undefined;
      if (!full) return basicUser(u);

      const custodyAddress = (full.custody_address as string) || '';
      const verifiedAddresses: string[] = (full.verified_addresses as Record<string, unknown>)?.eth_addresses as string[] || [];
      const allAddresses = [custodyAddress, ...verifiedAddresses].filter(Boolean);

      // ENS is nice-to-have
      const ensMap: Record<string, string> = {};
      if (allAddresses.length > 0) {
        try {
          const primaryEns = await resolveEns(allAddresses[0]);
          if (primaryEns) ensMap[allAddresses[0].toLowerCase()] = primaryEns;
        } catch {
          // ENS failed for this user, no big deal
        }
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
}
