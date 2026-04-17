// src/app/api/staking/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getConvictionBatch } from '@/lib/staking/conviction';
import { logger } from '@/lib/logger';

/**
 * GET /api/staking/leaderboard
 * Returns conviction data for all known stakers.
 * Pulls wallet addresses from users table + agent_config.
 */
export async function GET() {
  try {
    // Get all wallet addresses we know about
    const [usersResult, agentsResult] = await Promise.allSettled([
      supabaseAdmin
        .from('users')
        .select('wallet_address, display_name')
        .not('wallet_address', 'is', null),
      supabaseAdmin
        .from('agent_config')
        .select('wallet_address, name'),
    ]);

    const addresses: { address: string; name: string }[] = [];

    if (usersResult.status === 'fulfilled' && usersResult.value.data) {
      for (const u of usersResult.value.data) {
        if (u.wallet_address) {
          addresses.push({ address: u.wallet_address, name: u.display_name || '' });
        }
      }
    }

    if (agentsResult.status === 'fulfilled' && agentsResult.value.data) {
      for (const a of agentsResult.value.data) {
        if (a.wallet_address) {
          addresses.push({ address: a.wallet_address, name: a.name });
        }
      }
    }

    if (addresses.length === 0) {
      return NextResponse.json([]);
    }

    const convictions = await getConvictionBatch(addresses.map((a) => a.address));

    // Merge names
    const nameMap = new Map(addresses.map((a) => [a.address.toLowerCase(), a.name]));
    const result = convictions.map((c) => ({
      ...c,
      name: nameMap.get(c.address.toLowerCase()) || null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    logger.error('Staking leaderboard error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
