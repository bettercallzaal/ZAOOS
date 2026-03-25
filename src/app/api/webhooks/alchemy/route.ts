import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';

const SIGNING_KEY = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || '';
const ZOR_CONTRACT = '0x9885cceef7e8371bf8d6f2413723d25917e7445c';
const OG_CONTRACT = '0x34ce89baa7e4a4b00e17f7e4c0cb97105c216957';

/**
 * POST /api/webhooks/alchemy — Receive on-chain events from Alchemy
 * Handles: NFT Activity (ZOR ERC-1155 mints) and Address Activity (OG ERC-20 transfers)
 * Auto-updates respect_members on-chain balances in real-time.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Validate HMAC signature
    if (SIGNING_KEY) {
      const signature = req.headers.get('x-alchemy-signature') || '';
      const hmac = crypto.createHmac('sha256', SIGNING_KEY);
      hmac.update(rawBody, 'utf8');
      const expectedSig = hmac.digest('hex');

      try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          console.warn('[alchemy-webhook] Invalid signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } catch {
        console.warn('[alchemy-webhook] Signature validation failed (length mismatch)');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Handle different webhook types
    const activities = payload?.event?.activity || [];

    for (const activity of activities) {
      const contractAddr = (activity.contractAddress || '').toLowerCase();
      const toAddress = (activity.toAddress || '').toLowerCase();
      const fromAddress = (activity.fromAddress || '').toLowerCase();
      const txHash = activity.log?.transactionHash || activity.hash || '';

      if (!toAddress || !txHash) continue;

      // Determine token type
      let tokenType: 'og_erc20' | 'zor_erc1155' | null = null;
      let amount = '0';

      if (contractAddr === ZOR_CONTRACT) {
        tokenType = 'zor_erc1155';
        // ERC-1155: amount is in erc1155Metadata
        const meta = activity.erc1155Metadata?.[0];
        amount = meta?.value || activity.value?.toString() || '0';
      } else if (contractAddr === OG_CONTRACT) {
        tokenType = 'og_erc20';
        amount = activity.rawContract?.value || activity.value?.toString() || '0';
      }

      if (!tokenType) continue;

      // Store transfer in respect_transfers table
      const blockNumber = activity.log?.blockNumber
        ? parseInt(activity.log.blockNumber, 16)
        : activity.blockNum
          ? parseInt(activity.blockNum, 16)
          : null;

      await supabaseAdmin.from('respect_transfers').upsert({
        tx_hash: txHash,
        from_address: fromAddress,
        to_address: toAddress,
        token_type: tokenType,
        amount,
        block_number: blockNumber,
        block_timestamp: payload?.createdAt || new Date().toISOString(),
      }, { onConflict: 'tx_hash,to_address,token_type' });

      // Update respect_members on-chain balance for the recipient
      const { data: member } = await supabaseAdmin
        .from('respect_members')
        .select('id, onchain_og, onchain_zor')
        .ilike('wallet_address', toAddress)
        .maybeSingle();

      if (member) {
        const isMint = fromAddress === '0x0000000000000000000000000000000000000000';
        if (isMint) {
          const mintAmount = Number(amount) || 0;
          if (tokenType === 'zor_erc1155') {
            await supabaseAdmin.from('respect_members')
              .update({ onchain_zor: (Number(member.onchain_zor) || 0) + mintAmount })
              .eq('id', member.id);
          } else {
            await supabaseAdmin.from('respect_members')
              .update({ onchain_og: (Number(member.onchain_og) || 0) + mintAmount })
              .eq('id', member.id);
          }
          console.info(`[alchemy-webhook] ${tokenType} mint: +${mintAmount} to ${toAddress.slice(0, 10)}...`);
        }
      }

      // Also update users table member_tier if needed
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, member_tier')
        .ilike('primary_wallet', toAddress)
        .maybeSingle();

      if (user && user.member_tier !== 'respect_holder') {
        await supabaseAdmin
          .from('users')
          .update({ member_tier: 'respect_holder' })
          .eq('id', user.id);
        console.info(`[alchemy-webhook] Upgraded ${toAddress.slice(0, 10)}... to respect_holder`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[alchemy-webhook] Error:', err);
    // Return 200 even on error to prevent Alchemy from retrying forever
    // Log the error for debugging
    return NextResponse.json({ ok: true, error: 'Processed with errors' });
  }
}
