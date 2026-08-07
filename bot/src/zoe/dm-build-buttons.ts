/**
 * dm-build-buttons.ts - the inline keyboards for the DM build flow.
 *
 * Zaal, 2026-08-07: "i want more buttons alwys its eaiser so i can just quickly
 * pick." He is usually on a phone and usually moving. A message that raises a
 * decision but offers no button quietly turns a two-second tap into a
 * thirty-second typing job.
 *
 * Keyboards ONLY. Every decision lives in dm-build-pending.ts so it can be
 * unit-tested without grammy (see that file's header).
 */
import { InlineKeyboard } from 'grammy';

/** Buttons shown WHILE a build runs. Stop must always be one tap away - a run
 *  you cannot interrupt is a fire-and-forget button, not a tool. */
export function runningKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('Stop', 'dmb:stop').text('Status', 'dmb:status');
}

/** Buttons on a finished build. "Open PR" is a LINK, not an action - merging
 *  stays a deliberate act in GitHub (agent-loops rule 8). */
export function doneKeyboard(prUrl?: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (prUrl) kb.url('Open PR', prUrl);
  return kb.text('Build something else', 'dmb:again');
}

/** The near-miss prompt: the classifier declined, but it still smells like
 *  work. Ask rather than swallow. */
export function maybeKeyboard(key: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('Build it', `dmb:yes:${key}`)
    .text('Just chat', `dmb:no:${key}`);
}
