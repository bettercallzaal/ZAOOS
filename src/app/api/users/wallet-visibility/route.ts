import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ALLOWED_WALLET_KEYS = [
  'custody_address',
  'verified_addresses',
  'solana_address',
  'primary_wallet',
] as const;

const patchSchema = z.object({
  hidden_wallets: z.array(z.enum(ALLOWED_WALLET_KEYS)).max(10).default([]),
});

/**
 * GET — return the list of hidden wallet keys (default: none hidden).
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('hidden_wallets')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      hidden_wallets: data?.hidden_wallets ?? [],
    });
  } catch (err) {
    logger.error('[wallet-visibility] GET error:', err);
    return NextResponse.json({ error: 'Failed to load wallet visibility' }, { status: 500 });
  }
}

/**
 * PATCH — update hidden wallet keys.
 */
export async function PATCH(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid wallet visibility data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ hidden_wallets: parsed.data.hidden_wallets })
      .eq('fid', session.fid)
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ hidden_wallets: parsed.data.hidden_wallets });
  } catch (err) {
    logger.error('[wallet-visibility] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update wallet visibility' }, { status: 500 });
  }
}
