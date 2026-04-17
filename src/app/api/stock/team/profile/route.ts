import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const patchSchema = z.object({
  bio: z.string().max(2000).optional(),
  links: z.string().max(500).optional(),
  photo_url: z
    .string()
    .max(500)
    .optional()
    .refine(
      (v) => !v || v === '' || /^https:\/\//i.test(v),
      { message: 'Photo URL must start with https://' },
    ),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getStockTeamMember();
    if (!session) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
    if (parsed.data.links !== undefined) updates.links = parsed.data.links;
    if (parsed.data.photo_url !== undefined) updates.photo_url = parsed.data.photo_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('stock_team_members')
      .update(updates)
      .eq('id', session.memberId)
      .select('id, name, bio, links, photo_url')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch {
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
