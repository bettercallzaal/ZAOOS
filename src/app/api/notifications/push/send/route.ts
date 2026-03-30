import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { sendPushNotification } from '@/lib/push/vapid';

const sendSchema = z.object({
  fid: z.number().int().positive(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  tag: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send push notifications to other users
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fid, title, body: notifBody, url, tag } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('user_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('fid', fid);

    if (error) {
      console.error('[push/send] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    // Send to all subscriptions, clean up expired ones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          { title, body: notifBody, url, tag }
        );

        // Remove expired subscriptions
        if (!success) {
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }

        return success;
      })
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    ).length;

    return NextResponse.json({ success: true, sent, total: subscriptions.length });
  } catch (error) {
    console.error('[push/send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
