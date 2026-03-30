import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { logger } from '@/lib/logger';

const postSchema = z.object({
  wallet: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
  signature: z.string().min(1),
  message: z.string().min(1),
});

/**
 * GET — return the saved Solana wallet for the current user.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('solana_wallet')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ solana_wallet: data?.solana_wallet || null });
  } catch (err) {
    logger.error('[users/solana-wallet] GET error:', err);
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 });
  }
}

/**
 * POST — verify signature and save a Solana wallet address.
 */
export async function POST(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { wallet, signature, message } = parsed.data;

  // Verify the signature matches the claimed wallet
  try {
    const publicKeyBytes = bs58.decode(wallet);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // Verify the message contains the correct wallet address
  if (!message.includes(wallet)) {
    return NextResponse.json({ error: 'Message does not match wallet' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ solana_wallet: wallet, updated_at: new Date().toISOString() })
      .eq('fid', session.fid)
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ solana_wallet: wallet });
  } catch (err) {
    logger.error('[users/solana-wallet] POST error:', err);
    return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 });
  }
}

/**
 * DELETE — remove the saved Solana wallet.
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ solana_wallet: null, updated_at: new Date().toISOString() })
      .eq('fid', session.fid)
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ solana_wallet: null });
  } catch (err) {
    logger.error('[users/solana-wallet] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove wallet' }, { status: 500 });
  }
}
