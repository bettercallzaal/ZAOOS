import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryCommentSchema } from '@/lib/validation/library-schemas';
import { moderateContent } from '@/lib/moderation/moderate';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entry_id');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!entryId || !uuidRegex.test(entryId)) {
      return NextResponse.json({ error: 'Valid entry_id required' }, { status: 400 });
    }

    const { data: comments, error } = await supabaseAdmin
      .from('research_entry_comments')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    logger.error('[library/comments] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.fid) {
    return NextResponse.json({ error: 'Farcaster account required to comment' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = libraryCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { entry_id, body: commentBody } = parsed.data;
    const fid = session.fid;

    const modResult = await moderateContent(commentBody);
    if (modResult.action === 'hide') {
      return NextResponse.json(
        { error: 'Comment flagged by moderation' },
        { status: 400 },
      );
    }

    const { data: comment, error: insertError } = await supabaseAdmin
      .from('research_entry_comments')
      .insert({ entry_id, fid, body: commentBody })
      .select()
      .single();

    if (insertError) throw insertError;

    const { count } = await supabaseAdmin
      .from('research_entry_comments')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id);

    await supabaseAdmin
      .from('research_entries')
      .update({ comment_count: count ?? 0 })
      .eq('id', entry_id);

    return NextResponse.json({ comment });
  } catch (error) {
    logger.error('[library/comments] POST error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
