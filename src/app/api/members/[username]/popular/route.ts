import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getPopularCasts } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';
import { hasPublicField } from '@/lib/members/public-profile';

const usernameParamSchema = z.string().min(1).max(100);

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const usernameCheck = usernameParamSchema.safeParse(username);
  if (!usernameCheck.success) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }
  try {
    // Without a member session this needs the member's farcaster and username toggles.
    const session = await getSessionData();
    const lookup = decodeURIComponent(username).toLowerCase();
    const { data: row } = await supabaseAdmin
      .from('users')
      .select(session ? 'fid' : 'fid, username, public_name, public_fields')
      .ilike('username', lookup)
      .eq('is_active', true)
      .maybeSingle();

    const user = row as unknown as {
      fid?: number;
      username?: string | null;
      public_name?: string | null;
      public_fields?: string[] | null;
    } | null;
    const allowed =
      !!session ||
      (hasPublicField(user, 'farcaster') &&
        hasPublicField(user, 'username') &&
        user?.username?.toLowerCase() === lookup);

    if (!user?.fid || !allowed) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await getPopularCasts(user.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[members/popular] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch popular casts' }, { status: 500 });
  }
}
