import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const MAX_ACTIVE_CODES_PER_USER = 3;
const CODE_LENGTH = 6;

/** Generate a short, readable referral code (6 chars, uppercase alphanumeric) */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * GET — List current user's referral codes with usage stats
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: codes, error } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('creator_fid', session.fid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch referral codes error:', error);
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 });
    }

    // Fetch referral records for these codes
    const codeCodes = (codes || []).map((c) => c.code);
    let referrals: Array<{ referral_code: string; status: string }> = [];

    if (codeCodes.length > 0) {
      const { data: refs, error: refsError } = await supabaseAdmin
        .from('referrals')
        .select('referral_code, status')
        .in('referral_code', codeCodes);

      if (refsError) {
        console.error('Fetch referrals error:', refsError);
      } else {
        referrals = refs || [];
      }
    }

    // Build response with usage stats per code
    const codesWithStats = (codes || []).map((code) => {
      const codeReferrals = referrals.filter((r) => r.referral_code === code.code);
      return {
        id: code.id,
        code: code.code,
        max_uses: code.max_uses,
        times_used: code.times_used,
        is_active: code.is_active,
        expires_at: code.expires_at,
        created_at: code.created_at,
        referrals: {
          pending: codeReferrals.filter((r) => r.status === 'pending').length,
          joined: codeReferrals.filter((r) => r.status === 'joined').length,
          active_d30: codeReferrals.filter((r) => r.status === 'active_d30').length,
          expired: codeReferrals.filter((r) => r.status === 'expired').length,
        },
      };
    });

    const activeCount = (codes || []).filter((c) => c.is_active).length;

    return NextResponse.json({
      codes: codesWithStats,
      activeCount,
      maxAllowed: MAX_ACTIVE_CODES_PER_USER,
      canGenerate: activeCount < MAX_ACTIVE_CODES_PER_USER,
    });
  } catch (err) {
    console.error('Referral codes GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCodeSchema = z.object({
  max_uses: z.number().int().min(1).max(10).optional().default(1),
  expires_in_days: z.number().int().min(1).max(90).optional(),
});

/**
 * POST — Generate a new referral code (limit 3 active codes per user)
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { max_uses, expires_in_days } = parsed.data;

    // Check active code count
    const { count, error: countError } = await supabaseAdmin
      .from('referral_codes')
      .select('id', { count: 'exact', head: true })
      .eq('creator_fid', session.fid)
      .eq('is_active', true);

    if (countError) {
      console.error('Count referral codes error:', countError);
      return NextResponse.json({ error: 'Failed to check code limit' }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_ACTIVE_CODES_PER_USER) {
      return NextResponse.json(
        { error: `You already have ${MAX_ACTIVE_CODES_PER_USER} active referral codes. Deactivate one to generate a new code.` },
        { status: 400 }
      );
    }

    // Generate a unique code with retry
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: newCode, error: insertError } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        code,
        creator_fid: session.fid,
        max_uses,
        expires_at,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert referral code error:', insertError);
      return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
    }

    return NextResponse.json({ code: newCode });
  } catch (err) {
    console.error('Referral code POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
