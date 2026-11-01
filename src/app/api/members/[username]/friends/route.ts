import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getBestFriends } from '@/lib/farcaster/neynar';
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

    // Clamp a non-numeric/negative limit to the default (never pass NaN downstream).
    const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
    const limit = Math.min(Number.isNaN(rawLimit) || rawLimit < 1 ? 10 : rawLimit, 25);
    const data = await getBestFriends(user.fid, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[members/friends] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch best friends' }, { status: 500 });
  }
}
