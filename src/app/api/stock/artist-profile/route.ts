import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyClaimToken } from '@/lib/stock/artists';

const httpsOnly = (label: string) =>
  z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || /^https:\/\//i.test(v), {
      message: `${label} must start with https://`,
    });

const patchSchema = z.object({
  slug: z.string().min(1).max(200),
  token: z.string().min(4).max(64),
  bio: z.string().max(2000).optional(),
  photo_url: httpsOnly('Photo URL'),
  logo_url: httpsOnly('Logo URL'),
  social_post_url: httpsOnly('Post URL'),
  socials: z.string().max(500).optional(),
  genre: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

const REWARD_BIO = 1;
const REWARD_LOGO = 1;
const REWARD_POST = 1;
const ELIGIBLE_THRESHOLD = 3;

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const artistId = await verifyClaimToken(parsed.data.slug, parsed.data.token);
    if (!artistId) {
      return NextResponse.json({ error: 'Invalid or expired claim link' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: current } = await supabase
      .from('stock_artists')
      .select('id, bio, logo_url, social_post_url, points_earned, volunteer_eligible')
      .eq('id', artistId)
      .single();

    const updates: Record<string, unknown> = {};
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
    if (parsed.data.photo_url !== undefined) updates.photo_url = parsed.data.photo_url;
    if (parsed.data.logo_url !== undefined) updates.logo_url = parsed.data.logo_url;
    if (parsed.data.social_post_url !== undefined) updates.social_post_url = parsed.data.social_post_url;
    if (parsed.data.socials !== undefined) updates.socials = parsed.data.socials;
    if (parsed.data.genre !== undefined) updates.genre = parsed.data.genre;
    if (parsed.data.city !== undefined) updates.city = parsed.data.city;

    let earnedThisCall = 0;

    const bioWasEmpty = !current?.bio || current.bio.trim().length === 0;
    const bioNowHas = (parsed.data.bio || '').trim().length > 0;
    if (bioWasEmpty && bioNowHas) earnedThisCall += REWARD_BIO;

    const logoWasEmpty = !current?.logo_url || current.logo_url.trim().length === 0;
    const logoNowHas = (parsed.data.logo_url || '').trim().length > 0;
    if (logoWasEmpty && logoNowHas) earnedThisCall += REWARD_LOGO;

    type CurrentRow = { social_post_url?: string | null };
    const currentRow = current as CurrentRow | null;
    const postWasEmpty = !currentRow?.social_post_url || (currentRow.social_post_url || '').trim().length === 0;
    const postNowHas = (parsed.data.social_post_url || '').trim().length > 0;
    if (postWasEmpty && postNowHas) earnedThisCall += REWARD_POST;

    let newPoints = current?.points_earned || 0;
    if (earnedThisCall > 0) {
      newPoints = newPoints + earnedThisCall;
      updates.points_earned = newPoints;
    }

    let becameEligible = false;
    if (!current?.volunteer_eligible && newPoints >= ELIGIBLE_THRESHOLD) {
      updates.volunteer_eligible = true;
      becameEligible = true;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('stock_artists')
      .update(updates)
      .eq('id', artistId);

    if (updateError) {
      return NextResponse.json({ error: 'Save failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      earnedThisCall,
      totalPoints: newPoints,
      becameEligible,
    });
  } catch {
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
