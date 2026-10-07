// Post slate v2 - inline keyboard + callback handler.
// Buttons under each draft message: POST | REGEN | SKIP.
// Callback data shape: `post-<action>:<id>` where action is one of approve|regen|skip.

import { InlineKeyboard, type Context } from 'grammy';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { featureRan } from '../feature-ran';
import { ZOE_PATHS } from '../memory';
import { assertSendDelivered } from '../send-budget';
import { draftPost } from './drafters';
import {
  clearPending,
  loadPending,
  newPendingId,
  savePending,
  type PendingDraft,
} from './pending';
import { isPostPublishEnabled, publishApprovedDraft } from './publish';
import {
  gatherBuildSignals,
  gatherEcosystemSignals,
  gatherEventSignals,
  gatherPersonalSignals,
} from './sources';
import type { PostCategory, PostSourceSnapshot } from './types';

const POSTS_STATE_DIR = join(ZOE_PATHS.home, 'posts');
const LOG_FILE = join(POSTS_STATE_DIR, 'log.jsonl');

async function appendLog(line: Record<string, unknown>): Promise<void> {
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${JSON.stringify({ ts: new Date().toISOString(), ...line })}\n`, 'utf8');
}

export function buildKeyboard(id: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('POST', `post-approve:${id}`)
    .text('REGEN', `post-regen:${id}`)
    .text('SKIP', `post-skip:${id}`);
}

async function gatherAll(repoDir: string): Promise<PostSourceSnapshot> {
  const [build, ecosystem, event, personal] = await Promise.all([
    gatherBuildSignals(repoDir),
    gatherEcosystemSignals(repoDir),
    gatherEventSignals(),
    gatherPersonalSignals(),
  ]);
  return { build, ecosystem, event, personal };
}

export interface SendDraftOptions {
  bot: Context['api'] | { sendMessage: (chatId: number, text: string, options?: { reply_markup?: InlineKeyboard }) => Promise<{ message_id: number }> };
  zaalTgId: number;
  category: PostCategory;
  text: string;
  isResend?: boolean;
}

/**
 * Send a draft as 2 bubbles (label + bare text with keyboard) and persist pending.
 *
 * `zoeSendClass: 'gated'` is not decoration. This is an approval card - it is
 * exactly what send-budget.ts calls `gated` ("a needs-you / approval / decision
 * card"), so it always passes the daily cap and still counts. Without the tag
 * the cron call sites (posts/scheduler.ts, fractal-promo.ts) send from outside
 * any `runWithSendClass` context, the class defaults to `status`, and a card
 * arriving after the 20th send of the day is DROPPED.
 *
 * `assertSendDelivered` closes the same hole from the other side. A blocked send
 * resolves rather than throwing, so `savePending` below would record a draft as
 * delivered-and-awaiting-Zaal for a message he never received - and with
 * MAX_RESENDS = 0 it then expires on the 4h TTL unseen. Throwing puts it in the
 * catch branch this function already has, which logs `send-error` and returns
 * null, so the caller sees a failure instead of a phantom success.
 */
export async function sendDraftWithKeyboard(opts: SendDraftOptions): Promise<PendingDraft | null> {
  const existing = await loadPending();
  const id = existing?.id ?? newPendingId(opts.category);
  try {
    const headerSuffix = opts.isResend
      ? ` (resend ${(existing?.resendCount ?? 0) + 1}/3 - tap a button)`
      : ' - tap POST/REGEN/SKIP';
    assertSendDelivered(
      await opts.bot.sendMessage(
        opts.zaalTgId,
        `ZOE post draft (${opts.category})${headerSuffix}`,
        { zoeSendClass: 'gated' } as never,
      ),
    );
    const sent = assertSendDelivered(
      await opts.bot.sendMessage(opts.zaalTgId, opts.text, {
        reply_markup: buildKeyboard(id),
        zoeSendClass: 'gated',
      } as never),
    );
    const now = new Date().toISOString();
    const pending: PendingDraft = {
      id,
      category: opts.category,
      text: opts.text,
      createdAt: existing?.createdAt ?? now,
      lastSentAt: now,
      messageId: sent?.message_id ?? null,
      resendCount: existing ? existing.resendCount + (opts.isResend ? 1 : 0) : 0,
      state: 'pending',
    };
    await savePending(pending);
    await appendLog({
      event: opts.isResend ? 'resent' : 'sent',
      category: opts.category,
      id,
      resendCount: pending.resendCount,
      charCount: opts.text.length,
    });
    return pending;
  } catch (err) {
    await appendLog({ event: 'send-error', category: opts.category, error: (err as Error).message });
    return null;
  }
}

export interface CallbackHandlerOptions {
  ctx: Context;
  repoDir: string;
  zaalTgId: number;
  /** injected for tests; the publish call uses global fetch otherwise */
  fetchImpl?: typeof fetch;
}

/**
 * Drafts claimed by a tap in THIS process. The pending file is only cleared
 * after an awaited Telegram call (the keyboard strip), so two fast taps on
 * POST could both read the draft as pending. Before the publish wiring that
 * meant a duplicate echo; with it, a duplicate public post. The claim is
 * synchronous, before any await, so the second tap sees it.
 */
const claimedDraftIds = new Set<string>();

export async function handlePostCallback(opts: CallbackHandlerOptions): Promise<void> {
  const data = opts.ctx.callbackQuery?.data ?? '';
  const match = data.match(/^post-(approve|regen|skip):(.+)$/);
  if (!match) {
    await opts.ctx.answerCallbackQuery('unknown action');
    return;
  }
  const [, action, id] = match;
  if (claimedDraftIds.has(id)) {
    await opts.ctx.answerCallbackQuery('already handled');
    return;
  }
  claimedDraftIds.add(id);
  try {
    await handleClaimedPostCallback(opts, action, id);
  } finally {
    // The claim covers only the await window; once the handler has run the
    // pending file is cleared, so a later tap fails as "no longer pending".
    claimedDraftIds.delete(id);
  }
}

async function handleClaimedPostCallback(
  opts: CallbackHandlerOptions,
  action: string,
  id: string,
): Promise<void> {
  const pending = await loadPending();
  if (!pending || pending.id !== id) {
    await opts.ctx.answerCallbackQuery('this draft is no longer pending');
    return;
  }

  // Strip the keyboard from the old draft message so the buttons can't be tapped
  // again. Best-effort - if it fails (message too old, etc) just continue.
  try {
    await opts.ctx.editMessageReplyMarkup({ reply_markup: undefined });
  } catch {
    /* ignore */
  }

  if (action === 'skip') {
    pending.state = 'skipped';
    await savePending(pending);
    await clearPending();
    await appendLog({ event: 'skipped', category: pending.category, id });
    await opts.ctx.answerCallbackQuery('skipped');
    return;
  }

  if (action === 'approve') {
    pending.state = 'approved';
    await savePending(pending);
    await clearPending();
    await appendLog({ event: 'approved', category: pending.category, id });

    // Flag-gated (ZOE_POST_PUBLISH=1, default OFF): POST publishes through
    // /api/publish/compose instead of echoing the text (doc 2244's root cause,
    // doc 2239 section 5 fix 1). OFF keeps the exact copy-target behaviour below.
    if (isPostPublishEnabled()) {
      await opts.ctx.answerCallbackQuery('publishing...');
      const result = await publishApprovedDraft({ text: pending.text, fetchImpl: opts.fetchImpl });
      if (result.ok) {
        featureRan('post-publish', `${pending.category} ${id}`);
        await appendLog({ event: 'published', category: pending.category, id, outcomes: result.outcomes });
        try {
          await opts.ctx.api.sendMessage(opts.zaalTgId, `Published:\n${result.summary}`);
        } catch {
          // best effort
        }
        return;
      }
      if (result.state === 'partial') {
        // Something IS live (e.g. the cast went out, X failed). Do not resend the
        // text as a paste target - that invites a duplicate of the part that worked.
        await appendLog({ event: 'publish-error', category: pending.category, id, error: result.error ?? result.summary, outcomes: result.outcomes });
        try {
          await opts.ctx.api.sendMessage(opts.zaalTgId, `Partly published:\n${result.summary}\nNot resending the text - the part that worked is live.`);
        } catch {
          // best effort
        }
        return;
      }
      if (result.state === 'unknown') {
        // The request went out and no trustworthy answer came back. The route
        // casts to Farcaster FIRST, so this is exactly what a live cast plus a
        // slow X call looks like. Resending the text here is how a duplicate
        // public post happens (zaoos-35 review of #3782).
        await appendLog({ event: 'publish-unknown', category: pending.category, id, error: result.error ?? result.summary });
        try {
          await opts.ctx.api.sendMessage(
            opts.zaalTgId,
            `Publish result UNKNOWN - ${result.summary}\n` +
              'Check before reposting: the /zao channel on Farcaster for the cast, @bettercallzaal on X for the tweet. ' +
              'Text not resent on purpose.',
          );
        } catch {
          // best effort
        }
        return;
      }
      // state 'failed': nothing can be live. Fall through to the copy-target
      // resend, with the reason on top so the next move is obvious.
      await appendLog({ event: 'publish-error', category: pending.category, id, error: result.error ?? result.summary, outcomes: result.outcomes });
      try {
        await opts.ctx.api.sendMessage(opts.zaalTgId, `Not published - ${result.summary}\nText below to paste by hand.`);
      } catch {
        // best effort
      }
    } else {
      await opts.ctx.answerCallbackQuery('approved - paste it');
    }
    // Resend the bare text one more time as a clean copy-target without buttons.
    try {
      await opts.ctx.api.sendMessage(opts.zaalTgId, pending.text);
    } catch {
      // best effort
    }
    return;
  }

  // action === 'regen'
  await opts.ctx.answerCallbackQuery('regenerating...');
  await clearPending();
  await appendLog({ event: 'regen-requested', category: pending.category, id });
  try {
    const snapshot = await gatherAll(opts.repoDir);
    const draft = await draftPost(pending.category, snapshot, { cwd: opts.repoDir });
    if (!draft.text || /^\(skip\)/i.test(draft.text)) {
      await opts.ctx.api.sendMessage(
        opts.zaalTgId,
        `(regen returned skip for ${pending.category} - source data too thin right now)`,
      );
      await appendLog({ event: 'regen-skip', category: pending.category });
      return;
    }
    await sendDraftWithKeyboard({
      bot: opts.ctx.api,
      zaalTgId: opts.zaalTgId,
      category: pending.category,
      text: draft.text,
    });
  } catch (err) {
    await appendLog({ event: 'regen-error', category: pending.category, error: (err as Error).message });
    await opts.ctx.api.sendMessage(opts.zaalTgId, `regen failed: ${(err as Error).message}`);
  }
}
