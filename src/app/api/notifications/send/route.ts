import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

/**
 * POST /api/notifications/send
 *
 * Send push notifications to Farcaster Mini App users via their notification tokens.
 * Admin-only or system-triggered. Respects per-user rate limits:
 *   - 1 notification per 30 seconds per user
 *   - 100 notifications per day per user
 */

const sendSchema = z.object({
  recipientFids: z.array(z.number().int().positive()).min(1).max(500),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  targetUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth check — admin only
    const session = await getSessionData();
    if (!session?.fid || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const raw = await req.json();
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { recipientFids, title, body, targetUrl } = parsed.data;

    // Fetch enabled notification tokens for the requested FIDs
    const { data: tokens, error: fetchError } = await supabaseAdmin
      .from('notification_tokens')
      .select('fid, token, url')
      .in('fid', recipientFids)
      .eq('enabled', true);

    if (fetchError) {
      console.error('[notifications/send] DB fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0, skipped: recipientFids.length, errors: [] });
    }

    // Rate limiting: check recent notification history
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30_000).toISOString();
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const tokenFids = tokens.map((t) => t.fid);

    // Get recent sends for rate limit checks
    const { data: recentSends } = await supabaseAdmin
      .from('notification_log')
      .select('fid, sent_at')
      .in('fid', tokenFids)
      .gte('sent_at', dayStart);

    // Build rate limit maps
    const lastSendMap = new Map<number, string>(); // fid -> most recent sent_at
    const dailyCountMap = new Map<number, number>(); // fid -> count today

    if (recentSends) {
      for (const row of recentSends) {
        const count = dailyCountMap.get(row.fid) || 0;
        dailyCountMap.set(row.fid, count + 1);

        const prev = lastSendMap.get(row.fid);
        if (!prev || row.sent_at > prev) {
          lastSendMap.set(row.fid, row.sent_at);
        }
      }
    }

    // Filter tokens by rate limits
    const eligibleTokens = tokens.filter((t) => {
      const dailyCount = dailyCountMap.get(t.fid) || 0;
      if (dailyCount >= 100) return false;

      const lastSend = lastSendMap.get(t.fid);
      if (lastSend && lastSend >= thirtySecondsAgo) return false;

      return true;
    });

    const skippedCount = tokens.length - eligibleTokens.length;

    // Send notifications — group by notification URL (Farcaster endpoint)
    const urlGroups = new Map<string, typeof eligibleTokens>();
    for (const t of eligibleTokens) {
      const group = urlGroups.get(t.url) || [];
      group.push(t);
      urlGroups.set(t.url, group);
    }

    let sentCount = 0;
    const errors: { fid: number; error: string }[] = [];

    const sendPromises = Array.from(urlGroups.entries()).map(
      async ([notificationUrl, groupTokens]) => {
        try {
          const response = await fetch(notificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title,
              body,
              targetUrl,
              tokens: groupTokens.map((t) => t.token),
            }),
          });

          if (response.ok) {
            const result = await response.json();

            // Handle individual token results if the API returns them
            const successTokens = new Set<string>();
            const invalidTokens = new Set<string>();

            if (result.result?.successfulTokens) {
              for (const token of result.result.successfulTokens) {
                successTokens.add(token);
              }
            }
            if (result.result?.invalidTokens) {
              for (const token of result.result.invalidTokens) {
                invalidTokens.add(token);
              }
            }

            // Separate invalid from successful tokens
            const invalidFids: number[] = [];
            for (const t of groupTokens) {
              if (invalidTokens.has(t.token)) {
                invalidFids.push(t.fid);
                errors.push({ fid: t.fid, error: 'Invalid token — disabled' });
              } else {
                sentCount++;
              }
            }
            // Bulk-disable invalid tokens in one query
            if (invalidFids.length > 0) {
              await supabaseAdmin
                .from('notification_tokens')
                .update({ enabled: false, updated_at: now.toISOString() })
                .in('fid', invalidFids);
            }
          } else {
            const errText = await response.text().catch(() => 'Unknown error');
            for (const t of groupTokens) {
              errors.push({ fid: t.fid, error: `HTTP ${response.status}: ${errText.slice(0, 100)}` });
            }
          }
        } catch (err) {
          for (const t of groupTokens) {
            errors.push({
              fid: t.fid,
              error: err instanceof Error ? err.message : 'Network error',
            });
          }
        }
      }
    );

    await Promise.allSettled(sendPromises);

    // Log successful sends for rate limiting
    if (sentCount > 0) {
      const logEntries = eligibleTokens
        .filter((t) => !errors.some((e) => e.fid === t.fid))
        .map((t) => ({
          fid: t.fid,
          title,
          body,
          target_url: targetUrl,
          sent_at: now.toISOString(),
        }));

      if (logEntries.length > 0) {
        await supabaseAdmin
          .from('notification_log')
          .insert(logEntries)
          .then(({ error }) => {
            if (error) console.error('[notifications/send] Log insert error:', error);
          });
      }
    }

    return NextResponse.json({
      sent: sentCount,
      skipped: skippedCount + (recipientFids.length - tokens.length),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[notifications/send] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
