import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AtpAgent } from '@atproto/api';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const addMemberSchema = z.object({
  handle: z.string().min(1).max(200),
});

/**
 * GET — List all Bluesky members tracked for the feed (admin only)
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('bluesky_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}

/**
 * POST — Add a Bluesky member to the feed (admin only)
 * Body: { handle: "username.bsky.social" }
 * Resolves the handle to a DID via the public API.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
    }

    const { handle } = parsed.data;

    // Resolve handle to DID
    const agent = new AtpAgent({ service: 'https://public.api.bsky.app' });
    let did: string;
    try {
      const { data } = await agent.resolveHandle({ handle });
      did = data.did;
    } catch {
      return NextResponse.json(
        { error: `Could not find Bluesky account: ${handle}` },
        { status: 404 },
      );
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('bluesky_members')
      .select('id')
      .eq('did', did)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Member already tracked' }, { status: 409 });
    }

    const { data: member, error } = await supabaseAdmin
      .from('bluesky_members')
      .insert({ did, handle, added_by: String(session.fid) })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ member });
  } catch (err) {
    logger.error('[bluesky/members] Add error:', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a Bluesky member from the feed (admin only)
 * Body: { id: uuid } or { did: string }
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, did } = body;

    if (!id && !did) {
      return NextResponse.json({ error: 'id or did required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('bluesky_members').delete();
    if (id) query = query.eq('id', id);
    else query = query.eq('did', did);

    const { error } = await query;
    if (error) throw error;

    // Also clean up their posts from the feed
    if (did) {
      await supabaseAdmin.from('bluesky_feed_posts').delete().eq('did', did);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[bluesky/members] Delete error:', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
