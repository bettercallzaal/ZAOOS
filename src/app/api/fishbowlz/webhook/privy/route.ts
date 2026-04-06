import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import crypto from 'crypto';

const PRIVY_WEBHOOK_SECRET = process.env.PRIVY_WEBHOOK_SECRET || '';

function verifySignature(payload: string, signature: string): boolean {
  if (!PRIVY_WEBHOOK_SECRET) return true; // Skip verification if no secret set (dev mode)
  const hmac = crypto.createHmac('sha256', PRIVY_WEBHOOK_SECRET);
  hmac.update(payload);
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-privy-signature') || '';

    // Verify webhook signature
    if (PRIVY_WEBHOOK_SECRET && !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    if (type === 'user.created' || type === 'user.updated') {
      const user = data;
      const privyId = user.id;

      // Extract identity info
      const fc = user.linked_accounts?.find((a: { type: string }) => a.type === 'farcaster');
      const wallet = user.linked_accounts?.find((a: { type: string }) => a.type === 'wallet');
      const email = user.linked_accounts?.find((a: { type: string }) => a.type === 'email');

      const userData = {
        privy_id: privyId,
        fid: fc?.fid || null,
        username: fc?.username || email?.address?.split('@')[0] || wallet?.address?.slice(0, 8) || 'anon',
        display_name: fc?.display_name || fc?.username || null,
        pfp_url: fc?.profile_picture_url || null,
        wallet_address: wallet?.address || null,
        email: email?.address || null,
        login_method: fc ? 'farcaster' : wallet ? 'wallet' : email ? 'email' : 'unknown',
        last_seen_at: new Date().toISOString(),
      };

      // Upsert user
      await supabaseAdmin
        .from('fishbowl_users')
        .upsert(userData, { onConflict: 'privy_id' });

      return NextResponse.json({ success: true, event: type });
    }

    // Acknowledge other event types
    return NextResponse.json({ success: true, event: type, action: 'ignored' });
  } catch (err) {
    console.error('Privy webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
