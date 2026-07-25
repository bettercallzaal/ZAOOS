/**
 * button-bar - a persistent Telegram reply keyboard (the tap-first cockpit bar)
 * + the `/` command menu registration.
 *
 * ZOE used inline buttons + reactions but had NO persistent reply keyboard, so
 * every quick action meant typing or scrolling back to an old message. This
 * pins a always-visible bar at the bottom of the DM: one thumb, no typing. The
 * labels are plain words (no emoji, per house style); index.ts intercepts them
 * at the top of the message:text handler and routes each to the existing action
 * (Agenda -> sendAgenda, Budget -> formatSpendStatus, Focus -> focus toggle,
 * Note -> capture prompt, Board -> the board link).
 *
 * Boundary: this module only DEFINES the keyboard + command list. The routing
 * lives in index.ts where the action functions are in scope.
 */

import { Keyboard } from 'grammy';

/** The five bar labels. index.ts checks membership before treating text as chat. */
export const BAR_LABELS = ['Agenda', 'Focus', 'Budget', 'Note', 'Board'] as const;
export type BarLabel = (typeof BAR_LABELS)[number];

export function isBarLabel(text: string): text is BarLabel {
  return (BAR_LABELS as readonly string[]).includes(text);
}

/** The persistent, auto-resized reply keyboard. Two rows. */
export const BUTTON_BAR = new Keyboard()
  .text('Agenda')
  .text('Focus')
  .text('Budget')
  .row()
  .text('Note')
  .text('Board')
  .resized()
  .persistent();

/**
 * The `/` command menu (setMyCommands). Only the commands Zaal actually uses -
 * the ones the usage audit flagged as high-leverage-but-invisible.
 */
export const ZOE_COMMANDS = [
  { command: 'menu', description: 'Show the tap-first cockpit bar' },
  { command: 'focus', description: 'Toggle hyperfocus (queue non-urgent pings)' },
  { command: 'agenda', description: 'Show the board - all open items' },
  { command: 'budget', description: "Today's spend + headroom" },
  { command: 'checkpoint', description: 'Save a breadcrumb note' },
  { command: 'audit', description: 'Scan for fallen tasks / captures' },
];
