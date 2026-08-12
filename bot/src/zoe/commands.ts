/**
 * commands.ts — pure command-prefix detection for ZOE DMs.
 *
 * Extracted from index.ts so the routing predicates are unit-testable without
 * importing index.ts (which calls main()/bot.start() on module load). Used by
 * handlePrivateMessage to detect plan:/note: commands and — critically — to
 * ensure a command sent during the evening-reflection window bypasses the
 * await-reflection pending capture (doc 770 H1).
 */

/** `note:` / `cc:` / `claude:` capture prefix. Group 2 is the note body. */
export const NOTE_PREFIX = /^(note|cc|claude):\s*(.+)/is;

/**
 * Opt-in goal decomposition + dispatch (doc 759 Gaps 1+2). Zaal sends
 * `plan: <goal>` / `decompose: <goal>` to get a routed plan; on "y" ZOE
 * dispatches the workers. Group 2 is the goal. Default chat stays concierge.
 */
export const PLAN_PREFIX = /^(plan|decompose):\s*(.+)/is;

/** `queue:` - add a research topic to ZOE's autonomous work-loop. Group 1 is the topic. */
export const QUEUE_PREFIX = /^queue:\s*(.+)/is;

/** Hourly-nudge on/off toggle (both phrasings handled in index.ts). */
export const NUDGE_TOGGLE_RE = /^(stop|pause|disable|start|resume|enable)\s+(nudges?|tips?)$/i;

/** `/focus` or `/focus on` - enable hyperfocus mode (suppress non-urgent pings). */
export const FOCUS_ON_RE = /^\/focus(?:\s+on)?$/i;

/** `/focus off` - disable hyperfocus mode, surface queued pings as digest. */
export const FOCUS_OFF_RE = /^\/focus\s+off$/i;

/** `/checkpoint <note>` - save a checkpoint for this thread. Group 1 is the note. */
export const CHECKPOINT_PREFIX = /^\/checkpoint\s+(.+)/is;

/** `/audit` - run trust audit (scan for fallen tasks/captures). */
export const AUDIT_COMMAND_RE = /^\/audit$/i;

/** `/budget` - check ZOE daily spend and remaining budget. */
export const BUDGET_COMMAND_RE = /^\/budget(?:\s+detailed)?$/i;

/** Every command index.ts dispatches by one of the patterns above. */
export type CommandKind =
  | 'nudge-toggle'
  | 'note'
  | 'queue'
  | 'focus-on'
  | 'focus-off'
  | 'checkpoint'
  | 'audit'
  | 'budget'
  | 'plan';

export interface CommandRoute {
  kind: CommandKind;
  pattern: RegExp;
  /**
   * The identifier index.ts uses at the dispatch site. Null when the command is
   * not dispatched through a named export there, which excludes it from the
   * order check below rather than pretending it has a position.
   */
  indexToken: string | null;
}

/**
 * THE ORDER IS THE CONTRACT.
 *
 * index.ts routes positionally across ~153 early-return branches with no
 * routing table, so whichever branch matches first wins and returns. On
 * 2026-08-08 that made ZOE's entire DM build vocabulary unreachable through
 * its own documented syntax, and every test stayed green
 * (.claude/rules/first-handler-wins.md).
 *
 * This table is that order, written down once and testable without importing
 * index.ts - which agent-loops.md rule 21 forbids, because its top level boots
 * a live poller. A companion test asserts this sequence still matches the
 * sequence in index.ts source, so the two cannot drift apart silently.
 *
 * Sequence measured from index.ts dispatch sites, NOT copied from the previous
 * body of isZoeCommand - which listed `plan` third while index.ts dispatches it
 * last, after `budget`. That mismatch was invisible while the only consumer
 * returned a boolean, and would have become a real routing bug the moment
 * anything asked WHICH command a message is.
 */
export const COMMAND_TABLE: ReadonlyArray<CommandRoute> = [
  // Disjoint from every other pattern, so its position carries no risk. Kept
  // first to preserve exactly what isZoeCommand tested before this table.
  { kind: 'nudge-toggle', pattern: NUDGE_TOGGLE_RE, indexToken: null },
  { kind: 'note', pattern: NOTE_PREFIX, indexToken: 'NOTE_PREFIX' },
  { kind: 'queue', pattern: QUEUE_PREFIX, indexToken: 'QUEUE_PREFIX' },
  { kind: 'focus-on', pattern: FOCUS_ON_RE, indexToken: 'FOCUS_ON_RE' },
  { kind: 'focus-off', pattern: FOCUS_OFF_RE, indexToken: 'FOCUS_OFF_RE' },
  { kind: 'checkpoint', pattern: CHECKPOINT_PREFIX, indexToken: 'CHECKPOINT_PREFIX' },
  { kind: 'audit', pattern: AUDIT_COMMAND_RE, indexToken: 'AUDIT_COMMAND_RE' },
  { kind: 'budget', pattern: BUDGET_COMMAND_RE, indexToken: 'BUDGET_COMMAND_RE' },
  { kind: 'plan', pattern: PLAN_PREFIX, indexToken: 'PLAN_PREFIX' },
];

/**
 * Which command a DM is, or null if it is not one.
 *
 * First match wins, exactly as index.ts does it. Returning the KIND rather than
 * a boolean is what makes routing order assertable: a test can state that
 * `/focus off` reaches focus-off and not focus-on, in one line, with no bot.
 */
export function classifyCommand(text: string): CommandKind | null {
  const trimmed = text.trim();
  for (const route of COMMAND_TABLE) {
    if (route.pattern.test(trimmed)) return route.kind;
  }
  return null;
}

/**
 * True if a DM is a recognized ZOE command. Such messages must bypass the
 * await-reflection pending capture (doc 770 H1): the evening reflection arms
 * a long-TTL pending, and a `plan:` sent in that window would otherwise be
 * swallowed as the reflection answer and never dispatched.
 *
 * Delegates to the table so there is ONE list of commands rather than two that
 * can disagree - the duplication that hid the plan-ordering mismatch above.
 */
export function isZoeCommand(text: string): boolean {
  return classifyCommand(text) !== null;
}
