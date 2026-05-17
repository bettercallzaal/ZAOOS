// Post slate v2 - inline keyboard + callback handler.
// Buttons under each draft message: POST | REGEN | SKIP.
// Callback data shape: `post-<action>:<id>` where action is one of approve|regen|skip.

import { InlineKeyboard, type Context } from 'grammy';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';
import { draftPost } from './drafters';
import {
  clearPending,
  loadPending,
  newPendingId,
  savePending,
  type PendingDraft,
} from './pending';
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

/** Send a draft as 2 bubbles (label + bare text with keyboard) and persist pending. */
export async function sendDraftWithKeyboard(opts: SendDraftOptions): Promise<PendingDraft | null> {
  const existing = await loadPending();
  const id = existing?.id ?? newPendingId(opts.category);
  try {
    const headerSuffix = opts.isResend
      ? ` (resend ${(existing?.resendCount ?? 0) + 1}/3 - tap a button)`
      : ' - tap POST/REGEN/SKIP';
    await opts.bot.sendMessage(opts.zaalTgId, `ZOE post draft (${opts.category})${headerSuffix}`);
    const sent = await opts.bot.sendMessage(opts.zaalTgId, opts.text, {
      reply_markup: buildKeyboard(id),
    });
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
}

export async function handlePostCallback(opts: CallbackHandlerOptions): Promise<void> {
  const data = opts.ctx.callbackQuery?.data ?? '';
  const match = data.match(/^post-(approve|regen|skip):(.+)$/);
  if (!match) {
    await opts.ctx.answerCallbackQuery('unknown action');
    return;
  }
  const [, action, id] = match;
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
    await opts.ctx.answerCallbackQuery('approved - paste it');
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
