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

/**
 * True if a DM is a recognized ZOE command. Such messages must bypass the
 * await-reflection pending capture (doc 770 H1): the evening reflection arms
 * a long-TTL pending, and a `plan:` sent in that window would otherwise be
 * swallowed as the reflection answer and never dispatched.
 */
export function isZoeCommand(text: string): boolean {
  const trimmed = text.trim();
  return (
    NUDGE_TOGGLE_RE.test(trimmed) ||
    NOTE_PREFIX.test(trimmed) ||
    PLAN_PREFIX.test(trimmed) ||
    QUEUE_PREFIX.test(trimmed) ||
    FOCUS_ON_RE.test(trimmed) ||
    FOCUS_OFF_RE.test(trimmed) ||
    CHECKPOINT_PREFIX.test(trimmed) ||
    AUDIT_COMMAND_RE.test(trimmed) ||
    BUDGET_COMMAND_RE.test(trimmed)
  );
}
