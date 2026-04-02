import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { parseWebhookEvent, verifyAppKeyWithNeynar } from '@farcaster/miniapp-node';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Verify webhook signature using Farcaster's official verification
    const { fid, event: parsedEvent } = await parseWebhookEvent(raw, verifyAppKeyWithNeynar);

    const event = parsedEvent.event;
    const notificationDetails = 'notificationDetails' in parsedEvent
      ? parsedEvent.notificationDetails
      : undefined;

    // Verify the FID exists in our allowlist before processing
    const { data: member } = await supabaseAdmin
      .from('allowlist')
      .select('id')
      .eq('fid', fid)
      .eq('is_active', true)
      .maybeSingle();

    if (!member) {
      // Silently accept but don't process — FID not in our community
      return NextResponse.json({ success: true });
    }

    switch (event) {
      case 'miniapp_added':
      case 'notifications_enabled': {
        if (notificationDetails) {
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
        await supabaseAdmin
          .from('notification_tokens')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('fid', fid);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
