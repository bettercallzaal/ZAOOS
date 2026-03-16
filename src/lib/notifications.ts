import { supabaseAdmin } from '@/lib/db/supabase';

interface NotificationToken {
  fid: number;
  token: string;
  url: string;
  enabled: boolean;
}

type NotificationType = 'message' | 'proposal' | 'vote' | 'comment' | 'member' | 'system';

/**
 * Create in-app notifications for one or more recipients.
 * These show up in the notification bell feed inside ZAO OS.
 */
export async function createInAppNotification(opts: {
  recipientFids: number[];
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  actorFid?: number;
  actorDisplayName?: string;
  actorPfpUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  if (opts.recipientFids.length === 0) return;

  const rows = opts.recipientFids.map((fid) => ({
    recipient_fid: fid,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    href: opts.href,
    actor_fid: opts.actorFid || null,
    actor_display_name: opts.actorDisplayName || null,
    actor_pfp_url: opts.actorPfpUrl || null,
    metadata: opts.metadata || {},
    read: false,
  }));

  const { error } = await supabaseAdmin.from('notifications').insert(rows);
  if (error) console.error('In-app notification error:', error);
}

/**
 * Send push notification via Farcaster Mini App protocol.
 */
export async function sendNotification(
  title: string,
  body: string,
  targetUrl: string,
  notificationId: string,
  excludeFid?: number
) {
  try {
    // Get all enabled notification tokens
    let query = supabaseAdmin
      .from('notification_tokens')
      .select('fid, token, url, enabled')
      .eq('enabled', true);

    if (excludeFid) {
      query = query.neq('fid', excludeFid);
    }

    const { data: tokens } = await query;
    if (!tokens || tokens.length === 0) return;

    // Group tokens by notification URL (different Farcaster clients may have different URLs)
    const grouped = new Map<string, string[]>();
    for (const t of tokens as NotificationToken[]) {
      const existing = grouped.get(t.url) || [];
      existing.push(t.token);
      grouped.set(t.url, existing);
    }

    // Send to each notification endpoint
    for (const [url, tokenList] of grouped) {
      // Batch in groups of 100 (Farcaster limit)
      for (let i = 0; i < tokenList.length; i += 100) {
        const batch = tokenList.slice(i, i + 100);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId,
            title: title.slice(0, 32),
            body: body.slice(0, 128),
            targetUrl,
            tokens: batch,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          // Invalidate any tokens the server says are bad
          if (result.invalidTokens?.length > 0) {
            await supabaseAdmin
              .from('notification_tokens')
              .update({ enabled: false })
              .in('token', result.invalidTokens);
          }
        }
      }
    }
  } catch (error) {
    console.error('Send notification error:', error);
  }
}
