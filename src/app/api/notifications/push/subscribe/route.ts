import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid subscription', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subscription } = parsed.data;
    const fid = session.fid;
    const supabase = getSupabaseAdmin();

    // Upsert subscription (replace if same endpoint exists)
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert(
        {
          fid,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('[push/subscribe] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[push/subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const endpoint = z.string().url().safeParse(body.endpoint);
    if (!endpoint.success) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await supabase
      .from('user_push_subscriptions')
      .delete()
      .eq('fid', session.fid)
      .eq('endpoint', endpoint.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[push/subscribe] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
