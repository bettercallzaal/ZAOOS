// fractal-promo.ts - dedicated weekly post slot for the ZAO Fractal.
//
// The Fractal runs Mondays 6pm EST (project_fractal_process: 90+ weeks,
// Discord bot, OG vs ZOR Respect, frapps). This module fires every Sunday
// at 3pm ET via a cron in scheduler.ts - a guaranteed weekly drumbeat that
// bypasses the random-slot pool.
//
// doc 722 3-month synthesis, task #220 2026-05-23: day-1 activation for new
// ZAO members = Fractal participation. With ~3-5 new humans joining every
// 73 days, the Sunday lead-time post is a cheap, recurring activation hook.
//
// Goes through the same POST/REGEN/SKIP review flow as every other ZOE post
// so Zaal still gates the actual publish - never auto-fires to socials.
//
// The join link is read from FRACTAL_JOIN_URL env (set on Zaal's mac /
// wherever the bot runs). Falls back to the public ZAO Discord invite if
// unset, so the slot never breaks silently.

import type { Bot } from 'grammy';
import { sendDraftWithKeyboard } from './buttons';

const DEFAULT_JOIN_URL = 'https://discord.gg/thezao';

function buildFractalDraft(): string {
  const url = process.env.FRACTAL_JOIN_URL || DEFAULT_JOIN_URL;
  // Spartan, lowercase-ish, no emojis, no em-dashes (matches the ZOE voice
  // contract from bot/src/zoe/human.md).
  return [
    'fractal tomorrow 6pm EST.',
    '',
    'where ZAO members do the actual work + earn Respect tokens. week 90+ and counting - the longest-running ritual in the ecosystem.',
    '',
    `join: ${url}`,
  ].join('\n');
}

/**
 * Send the Sunday Fractal-promo draft to Zaal via the standard
 * sendDraftWithKeyboard flow (POST/REGEN/SKIP). Called by the Sunday-3pm-ET
 * cron in scheduler.ts. Best-effort: errors are logged by the underlying
 * sendDraftWithKeyboard via appendLog.
 */
export async function sendFractalPromo(bot: Bot, zaalTgId: number): Promise<void> {
  await sendDraftWithKeyboard({
    bot: bot.api,
    zaalTgId,
    category: 'event',
    text: buildFractalDraft(),
    isResend: false,
  });
}
