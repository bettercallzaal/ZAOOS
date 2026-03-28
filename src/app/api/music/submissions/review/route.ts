import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { broadcastToChannels } from '@/lib/publish/broadcast';
import { z } from 'zod';

const reviewSchema = z.object({
  submission_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

// POST - approve or reject a song submission (admin only)
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { submission_id, action } = parsed.data;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Fetch the submission to verify it exists and get submitter info
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('song_submissions')
      .select('id, status, submitted_by_fid, submitted_by_display, title, artist')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Submission already ${submission.status}` },
        { status: 409 }
      );
    }

    // Update the submission
    const { error: updateError } = await supabaseAdmin
      .from('song_submissions')
      .update({
        status: newStatus,
        reviewed_by_fid: session.fid,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission_id);

    if (updateError) throw updateError;

    // Notify the submitter if approved
    if (action === 'approve' && submission.submitted_by_fid) {
      const trackLabel = submission.title
        ? `${submission.title}${submission.artist ? ` by ${submission.artist}` : ''}`
        : 'Your song submission';

      await createInAppNotification({
        recipientFids: [submission.submitted_by_fid],
        type: 'system',
        title: 'Song Approved',
        body: `${trackLabel} has been approved and is now visible in the music feed.`,
        href: '/music',
        actorFid: session.fid,
        actorDisplayName: session.displayName,
        actorPfpUrl: session.pfpUrl,
      });

      // Fire-and-forget broadcast to Telegram + Discord
      broadcastToChannels({
        text: `🎵 New track approved: ${trackLabel}\n\nListen on ZAO OS`,
        title: 'New Track Approved',
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Failed to review submission' }, { status: 500 });
  }
}
