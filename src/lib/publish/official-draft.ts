/**
 * Official-account drafts for Zaal's tap (Zaal ruling, vault 2e556756,
 * decisions/grill-2026-11-20-griller.md item 2).
 *
 * Event-driven code paths (member welcome, daily digest, Respect milestones,
 * track of the day, playlists, go-live, Juke recaps, agent narration, approved
 * proposals) used to post straight to /zao from @thezao with no human step.
 * They now hand their text to this module, which sends it to Zaal as a DRAFT
 * in his ZOE Telegram chat. Nothing is posted here. Zaal reads the draft and
 * posts it himself if he wants it.
 *
 * Delivery uses the Telegram Bot API with the ZOE bot:
 *   ZOE_DRAFTS_BOT_TOKEN  bot token of ZOE (@zaoclaw_bot)
 *   ZOE_DRAFTS_CHAT_ID    Zaal's private chat id with ZOE
 *
 * FAILS CLOSED. If either variable is unset, or Telegram is down, the draft is
 * logged and dropped. It is never posted as a fallback.
 */

import { logger } from '@/lib/logger';

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_MESSAGE_LENGTH = 4096;

export interface OfficialDraft {
  /** The text that would have been posted. */
  text: string;
  /** Optional URL that would have been embedded. */
  embedUrl?: string;
  /** Where it would have gone, e.g. "Farcaster /zao as @thezao". */
  target?: string;
  /** Short label for the code path that produced it, e.g. "proposal-approved". */
  source?: string;
}

export interface OfficialDraftResult {
  delivered: boolean;
  reason?: string;
}

/** Build the Telegram message body. Plain text, no parse mode, so nothing is mangled. */
export function formatOfficialDraft(draft: OfficialDraft): string {
  const target = draft.target ?? 'Farcaster /zao as @thezao';
  const header = `Draft for ${target}${draft.source ? ` (from ${draft.source})` : ''}. Not posted.`;
  const parts = [header, '', draft.text];
  if (draft.embedUrl) parts.push('', `Embed: ${draft.embedUrl}`);
  parts.push('', 'Copy and post it yourself if you want it.');
  const body = parts.join('\n');
  return body.length > MAX_MESSAGE_LENGTH ? body.slice(0, MAX_MESSAGE_LENGTH - 1) + '\u2026' : body;
}

/**
 * Send one draft to Zaal's ZOE chat. Never throws, never posts publicly.
 */
export async function draftOfficialCast(draft: OfficialDraft): Promise<OfficialDraftResult> {
  const token = process.env.ZOE_DRAFTS_BOT_TOKEN;
  const chatId = process.env.ZOE_DRAFTS_CHAT_ID;
  const label = draft.source ?? 'auto-post';

  if (!token || !chatId) {
    logger.warn(
      `[official-draft] ${label}: ZOE_DRAFTS_BOT_TOKEN or ZOE_DRAFTS_CHAT_ID unset, draft not delivered and not posted: ${draft.text.slice(0, 80)}`,
    );
    return { delivered: false, reason: 'not configured' };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatOfficialDraft(draft),
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      logger.error(`[official-draft] ${label}: Telegram returned ${res.status}, draft not delivered`);
      return { delivered: false, reason: `telegram ${res.status}` };
    }
    logger.info(`[official-draft] ${label}: draft sent to ZOE chat`);
    return { delivered: true };
  } catch (err) {
    // Message only: never log the error object, its cause can carry the request URL (bot token).
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[official-draft] ${label}: Telegram send failed, draft not delivered: ${message}`);
    return { delivered: false, reason: 'telegram error' };
  }
}
