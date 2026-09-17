/**
 * button-bar - a persistent Telegram reply keyboard (the tap-first cockpit bar)
 * + the \`/\` command menu registration with scoped commands.
 *
 * ZOE used inline buttons + reactions but had NO persistent reply keyboard, so
 * every quick action meant typing or scrolling back to an old message. This
 * pins a always-visible bar at the bottom of the DM: one thumb, no typing. The
 * labels are plain words (no emoji, per house style); index.ts intercepts them
 * at the top of the message:text handler and routes each to the existing action
 * (Agenda -> sendAgenda, Budget -> formatSpendStatus, Focus -> focus toggle,
 * Note -> capture prompt, Board -> the board link).
 *
 * Boundary: this module only DEFINES the keyboard + command lists. The routing
 * lives in index.ts where the action functions are in scope.
 */

import { Keyboard, InlineKeyboard } from "grammy";

/** The six bar labels. index.ts checks membership before treating text as chat. */
export const BAR_LABELS = ["Needs Me", "Agenda", "Focus", "Board", "Budget", "Note"] as const;
export type BarLabel = (typeof BAR_LABELS)[number];

export function isBarLabel(text: string): text is BarLabel {
  return (BAR_LABELS as readonly string[]).includes(text);
}

/** The persistent, auto-resized reply keyboard. Two rows of three. */
export const BUTTON_BAR = new Keyboard()
  .text("Needs Me")
  .text("Agenda")
  .text("Focus")
  .row()
  .text("Board")
  .text("Budget")
  .text("Note")
  .resized()
  .persistent();

/**
 * The \`/\` command menu (setMyCommands) for private DMs with Zaal.
 */
export const PRIVATE_COMMANDS = [
  { command: "cockpit", description: "Daily operator brief and priorities" },
  { command: "needsme", description: "Surface what needs your decision right now" },
  { command: "grill", description: "Answer pending decision cards" },
  { command: "board", description: "Show the board - all open items" },
  { command: "working", description: "Tasks currently in progress" },
  { command: "pulse", description: "Today's spend, health and models" },
  { command: "companion", description: "Live companion pulse and countdown" },
  { command: "focus", description: "Toggle hyperfocus (queue non-urgent pings)" },
  { command: "agenda", description: "Scheduled tasks and priorities" },
  { command: "menu", description: "Show the tap-first cockpit bar" },
  { command: "help", description: "Show overview of all commands" },
];

/**
 * The \`/\` command menu for groups (e.g. COC, ZAO Civilization).
 */
export const GROUP_COMMANDS = [
  { command: "ask", description: "Ask ZOE a question (or tag @zaoclaw_bot)" },
  { command: "help", description: "How to use ZOE in this group" },
  { command: "zg", description: "Group admin status and mode (Zaal only)" },
];

/** Backward compatibility alias for any caller expecting ZOE_COMMANDS */
export const ZOE_COMMANDS = PRIVATE_COMMANDS;

/**
 * Interactive inline keyboard for the /cockpit brief.
 * Enables one-tap refresh, drill-down into pending decisions, agenda, board, pulse, and focus.
 */
export function buildCockpitKeyboard(focusActive = false): InlineKeyboard {
  return new InlineKeyboard()
    .text("Refresh", "cp:refresh")
    .text("Needs Me", "cp:needsme")
    .row()
    .text("Agenda", "cp:agenda")
    .text("Board", "cp:board")
    .row()
    .text("Pulse", "cp:pulse")
    .text(focusActive ? "Unfocus" : "Focus", "cp:focus");
}
