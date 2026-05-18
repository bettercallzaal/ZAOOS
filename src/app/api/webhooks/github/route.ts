// GitHub webhook -> Hermes activity feed.
//
// One endpoint, two repos: GitHub repos (bettercallzaal/zaostock and
// bettercallzaal/ZAOOS) point their webhooks here. We discriminate by
// repository.full_name in the payload.
//
// Events handled:
//   - pull_request (opened, closed): includes merged-status detection
//   - push (only branch == default branch, dedupe via PR-merge case)
//
// Side effects on a verified event:
//   1) Insert a row in stock_activity_log so /digest + /mycontributions surface it.
//   2) Send a one-line Telegram notification to TELEGRAM_CHAT_ID (or
//      GITHUB_WEBHOOK_TG_CHAT_ID override) so Hermes notifies live.
//
// Setup once per repo:
//   - Repo Settings -> Webhooks -> Add webhook
//   - URL: https://zaoos.com/api/webhooks/github
//   - Content type: application/json
//   - Secret: GITHUB_WEBHOOK_SECRET (matching env var)
//   - Events: pull_requests + pushes (or "send me everything" - we filter)
//
// Security:
//   - HMAC-SHA256 signature verified against GITHUB_WEBHOOK_SECRET; reject
//     with 401 if missing or mismatched (timing-safe equal).
//   - We never echo the secret. We never log raw payload bodies in errors.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { publishToTelegram, escapeMarkdownV2 } from '@/lib/publish/telegram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PRPayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'synchronize' | string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    merged: boolean;
    user: { login: string };
    base: { ref: string };
  };
  repository: {
    full_name: string;
    name: string;
  };
  sender: { login: string };
}

interface PushPayload {
  ref: string; // refs/heads/main
  commits: Array<{ id: string; message: string; author: { name: string } }>;
  pusher: { name: string };
  repository: {
    full_name: string;
    name: string;
    default_branch: string;
  };
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  // GitHub sends "sha256=<hex>"
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sig = Buffer.from(signatureHeader);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length) return false;
  return crypto.timingSafeEqual(sig, exp);
}

async function logActivity(args: {
  repoFullName: string;
  action: string;
  summary: string;
  url?: string;
  actor?: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('stock_activity_log').insert({
      // No actor_id - this is a system-originated event from GitHub. Using a
      // null actor_id is the agreed convention for non-team-member writes.
      actor_id: null,
      entity_type: 'github',
      entity_id: args.repoFullName, // repo as the entity scope
      action: args.action,
      new_value: JSON.stringify({
        repo: args.repoFullName,
        summary: args.summary,
        url: args.url ?? null,
        actor: args.actor ?? null,
      }),
    });
  } catch (err) {
    console.error('[webhook/github] activity log write failed', err);
  }
}

async function notifyTelegram(text: string): Promise<void> {
  const overrideChatId = process.env.GITHUB_WEBHOOK_TG_CHAT_ID;
  // escape for MarkdownV2 in our message body
  const result = await publishToTelegram({
    text,
    parseMode: 'MarkdownV2',
    chatId: overrideChatId,
    disablePreview: false,
  });
  if (!result.success) {
    console.error('[webhook/github] telegram publish failed', result.error);
  }
}

function fmtPRMessage(opts: {
  verb: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  author: string;
}): string {
  // Short MarkdownV2-escaped notification line.
  const safeTitle = escapeMarkdownV2(opts.title);
  const safeRepo = escapeMarkdownV2(opts.repo);
  const safeAuthor = escapeMarkdownV2(opts.author);
  return `*${escapeMarkdownV2(opts.verb)}* on \`${safeRepo}\`: PR \\#${opts.number} _${safeTitle}_ by @${safeAuthor}\n[${escapeMarkdownV2(opts.url)}](${opts.url})`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (!event) {
    return NextResponse.json({ error: 'Missing X-GitHub-Event header' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  // GitHub fires "ping" once when a webhook is first installed. Acknowledge so
  // the user sees a green check in the Webhooks UI.
  if (event === 'ping') {
    return NextResponse.json({ ok: true, pong: true });
  }

  if (event === 'pull_request') {
    const pr = payload as PRPayload;
    const repo = pr.repository?.full_name ?? 'unknown';
    const num = pr.pull_request?.number ?? 0;
    const title = pr.pull_request?.title ?? '(no title)';
    const url = pr.pull_request?.html_url ?? '';
    const author = pr.pull_request?.user?.login ?? pr.sender?.login ?? 'someone';

    if (pr.action === 'opened' || pr.action === 'reopened') {
      const verb = pr.action === 'opened' ? 'PR opened' : 'PR reopened';
      await Promise.all([
        logActivity({
          repoFullName: repo,
          action: 'pr_opened',
          summary: `${verb} ${repo}#${num}: ${title}`,
          url,
          actor: author,
        }),
        notifyTelegram(fmtPRMessage({ verb, repo, number: num, title, url, author })),
      ]);
      return NextResponse.json({ ok: true, handled: 'pull_request.opened' });
    }

    if (pr.action === 'closed') {
      const merged = pr.pull_request?.merged === true;
      const verb = merged ? 'PR merged' : 'PR closed (not merged)';
      const action = merged ? 'pr_merged' : 'pr_closed';
      await Promise.all([
        logActivity({
          repoFullName: repo,
          action,
          summary: `${verb} ${repo}#${num}: ${title}`,
          url,
          actor: author,
        }),
        notifyTelegram(fmtPRMessage({ verb, repo, number: num, title, url, author })),
      ]);
      return NextResponse.json({ ok: true, handled: `pull_request.closed.${merged ? 'merged' : 'closed'}` });
    }

    // Other PR actions (edited / synchronize / labeled / etc) - log silently
    // without spamming Telegram. Useful for activity feed completeness.
    await logActivity({
      repoFullName: repo,
      action: `pr_${pr.action}`,
      summary: `pr.${pr.action} ${repo}#${num}: ${title}`,
      url,
      actor: author,
    });
    return NextResponse.json({ ok: true, handled: `pull_request.${pr.action}.silent` });
  }

  if (event === 'push') {
    const push = payload as PushPayload;
    const repo = push.repository?.full_name ?? 'unknown';
    const branch = (push.ref ?? '').replace('refs/heads/', '');
    const defaultBranch = push.repository?.default_branch ?? 'main';
    if (branch !== defaultBranch) {
      // Non-default-branch pushes are noisy and usually duplicate PR events.
      return NextResponse.json({ ok: true, skipped: 'non-default-branch' });
    }
    const commits = push.commits ?? [];
    if (commits.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'no-commits' });
    }
    const pusher = push.pusher?.name ?? 'someone';
    const summary = commits.length === 1
      ? `1 commit: ${commits[0].message.split('\n')[0]}`
      : `${commits.length} commits`;

    await logActivity({
      repoFullName: repo,
      action: 'push_default',
      summary: `push to ${repo}@${branch} by ${pusher} - ${summary}`,
      actor: pusher,
    });
    // Don't telegram-notify on push - PR-merged events already cover the
    // user-visible "code shipped" notification. Push events still hit the
    // activity log for /digest visibility.
    return NextResponse.json({ ok: true, handled: 'push.default' });
  }

  // Unknown / unhandled event - acknowledge so GitHub doesn't retry forever.
  return NextResponse.json({ ok: true, ignored: event });
}
