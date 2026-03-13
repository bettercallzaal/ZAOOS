import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// Webhook events from Farcaster clients for mini app lifecycle
// These are sent to the webhookUrl defined in .well-known/farcaster.json

interface WebhookEvent {
  event: 'miniapp_added' | 'miniapp_removed' | 'notifications_disabled' | 'notifications_enabled';
  fid: number;
  notificationDetails?: {
    token: string;
    url: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: WebhookEvent = await req.json();
    const { event, fid, notificationDetails } = body;

    switch (event) {
      case 'miniapp_added':
      case 'notifications_enabled': {
        if (notificationDetails) {
          // Upsert notification token
          await supabaseAdmin
            .from('notification_tokens')
            .upsert(
              {
                fid,
                token: notificationDetails.token,
                url: notificationDetails.url,
                enabled: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'fid' }
            );
        }
        break;
      }

      case 'miniapp_removed':
      case 'notifications_disabled': {
        // Disable notifications for this user
        await supabaseAdmin
          .from('notification_tokens')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('fid', fid);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
