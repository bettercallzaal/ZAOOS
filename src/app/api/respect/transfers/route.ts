import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const OG_CONTRACT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957';
const ZOR_CONTRACT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c';

const querySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  sync: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

/**
 * GET /api/respect/transfers — Historical on-chain respect transfers
 *
 * ?address=0x... — filter by recipient wallet
 * ?sync=true — trigger a fresh sync from Alchemy (admin only)
 *
 * Returns transfers from both OG (ERC-20) and ZOR (ERC-1155) contracts.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { address, sync, limit } = parsed.data;

  // Sync from Alchemy if requested (admin only)
  if (sync === 'true' && session.isAdmin) {
    await syncTransfersFromAlchemy(address);
  }

  try {
    let query = supabaseAdmin
      .from('respect_transfers')
      .select('*')
      .order('block_timestamp', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (address) {
      query = query.ilike('to_address', address.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      transfers: (data || []).map(t => ({
        txHash: t.tx_hash,
        from: t.from_address,
        to: t.to_address,
        tokenType: t.token_type,
        amount: t.amount,
        blockNumber: t.block_number,
        timestamp: t.block_timestamp,
        isMint: t.from_address === '0x0000000000000000000000000000000000000000',
        explorerUrl: `https://optimistic.etherscan.io/tx/${t.tx_hash}`,
      })),
      total: data?.length || 0,
    });
  } catch (err) {
    logger.error('[respect/transfers] error:', err);
    return NextResponse.json({ error: 'Failed to load transfers' }, { status: 500 });
  }
}

/**
 * Sync historical transfers from Alchemy getAssetTransfers.
 * Backfills the respect_transfers table.
 */
async function syncTransfersFromAlchemy(filterAddress?: string) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    logger.warn('[respect/transfers] No ALCHEMY_API_KEY — skipping sync');
    return;
  }

  const url = `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`;

  for (const contract of [
    { address: OG_CONTRACT, type: 'og_erc20', category: 'erc20' },
    { address: ZOR_CONTRACT, type: 'zor_erc1155', category: 'erc1155' },
  ]) {
    let pageKey: string | undefined;
    let pages = 0;

    do {
      try {
        const body: Record<string, unknown> = {
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x0',
            toBlock: 'latest',
            contractAddresses: [contract.address],
            category: [contract.category],
            withMetadata: true,
            maxCount: '0x3E8', // 1000
            order: 'desc',
            ...(filterAddress ? { toAddress: filterAddress.toLowerCase() } : {}),
            ...(pageKey ? { pageKey } : {}),
          }],
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          logger.error(`[transfers-sync] Alchemy returned ${res.status}`);
          break;
        }

        const data = await res.json();
        const transfers = data?.result?.transfers || [];
        pageKey = data?.result?.pageKey;

        // Store in DB
        for (const t of transfers) {
          const fromAddr = (t.from || '').toLowerCase();
          const toAddr = (t.to || '').toLowerCase();
          const txHash = t.hash || '';
          if (!toAddr || !txHash) continue;

          // Determine amount
          let amount = '0';
          if (contract.category === 'erc1155') {
            amount = t.erc1155Metadata?.[0]?.value || t.value?.toString() || '0';
          } else {
            amount = t.value?.toString() || t.rawContract?.value || '0';
          }

          await supabaseAdmin.from('respect_transfers').upsert({
            tx_hash: txHash,
            from_address: fromAddr,
            to_address: toAddr,
            token_type: contract.type,
            amount,
            block_number: t.blockNum ? parseInt(t.blockNum, 16) : null,
            block_timestamp: t.metadata?.blockTimestamp || null,
          }, { onConflict: 'tx_hash,to_address,token_type' });
        }

        console.info(`[transfers-sync] ${contract.type}: stored ${transfers.length} transfers (page ${pages + 1})`);
        pages++;
      } catch (err) {
        logger.error(`[transfers-sync] ${contract.type} page ${pages} failed:`, err);
        break;
      }
    } while (pageKey && pages < 20); // Max 20 pages = 20K transfers
  }
}
