import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Farcaster Mini App webhook events
// Note: The Mini App spec does not support HMAC signature verification
// (unlike Neynar webhooks). We mitigate by validating input shape and
// verifying the FID exists in our allowlist before processing.

const webhookEventSchema = z.object({
  event: z.enum(['miniapp_added', 'miniapp_removed', 'notifications_disabled', 'notifications_enabled']),
  fid: z.number().int().positive(),
  notificationDetails: z.object({
    token: z.string().min(1),
    url: z.string().url(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = webhookEventSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { event, fid, notificationDetails } = parsed.data;

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
