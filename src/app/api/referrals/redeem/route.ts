import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const redeemSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 characters')
    .max(6, 'Code must be 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric')
    .transform((v) => v.toUpperCase()),
});

/**
 * POST — Redeem a referral code
 * Body: { code: "ABC123" }
 * Links the code to the current user's FID.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // Look up the referral code
    const { data: referralCode, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Validate the code
    if (!referralCode.is_active) {
      return NextResponse.json({ error: 'This referral code is no longer active' }, { status: 400 });
    }

    if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This referral code has expired' }, { status: 400 });
    }

    if (referralCode.times_used >= referralCode.max_uses) {
      return NextResponse.json({ error: 'This referral code has reached its usage limit' }, { status: 400 });
    }

    // Cannot redeem own code
    if (referralCode.creator_fid === session.fid) {
      return NextResponse.json({ error: 'You cannot redeem your own referral code' }, { status: 400 });
    }

    // Check if this user already redeemed any code
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_fid', session.fid)
      .limit(1)
      .single();

    if (existingReferral) {
      return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 });
    }

    // Create referral record and increment usage atomically
    const { error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_fid: referralCode.creator_fid,
        referred_fid: session.fid,
        referred_wallet: session.walletAddress || null,
        referral_code: code,
        status: 'joined',
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert referral error:', insertError);
      return NextResponse.json({ error: 'Failed to redeem referral code' }, { status: 500 });
    }

    // Increment times_used
    const { error: updateError } = await supabaseAdmin
      .from('referral_codes')
      .update({ times_used: referralCode.times_used + 1 })
      .eq('id', referralCode.id);

    if (updateError) {
      console.error('Update referral code usage error:', updateError);
      // Non-fatal: the referral was still created
    }

    // Auto-deactivate if fully used
    if (referralCode.times_used + 1 >= referralCode.max_uses) {
      await supabaseAdmin
        .from('referral_codes')
        .update({ is_active: false })
        .eq('id', referralCode.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Referral code redeemed successfully',
      referrer_fid: referralCode.creator_fid,
    });
  } catch (err) {
    console.error('Redeem referral code error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
