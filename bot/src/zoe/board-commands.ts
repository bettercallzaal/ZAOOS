/**
 * board-commands.ts - let an @zoe board comment DO something, not just get a reply.
 *
 * WHAT ALREADY EXISTS (read first, per code-restraint)
 * ---------------------------------------------------
 * task-comment-replies.ts already watches the cowork board for comments tagging
 * @zoe and answers them in-thread. That half works. What it cannot do is ACT.
 *
 * On 2026-08-08 Zaal commented on task #9246:
 *
 *   "@iman done. @zoe this is done i pushed it and gave iman feedback for the
 *    next todo lets make a new todo and call it zartizen ui cleanup and task it
 *    to iman and close this one"
 *
 * Three instructions - create a task, assign it, close this one - and ZOE could
 * only ever have written a sentence back. The comment sat unactioned and the
 * task stayed open. This module is the missing executor.
 *
 * WHY THE PARSE IS NOT A REGEX
 * ---------------------------
 * "lets make a new todo and call it zartizen ui cleanup and task it to iman and
 * close this one" is how Zaal actually writes. Pinning that to a regex would
 * work for this sentence and fail on the next one. So extraction is done by the
 * model (task-comment-replies already has a Claude CLI to hand) and this module
 * owns the part that must be deterministic: validating what came back, deciding
 * who is allowed to command, and refusing anything outside a small allowlist.
 *
 * The split matters. A model deciding what Zaal meant is fine. A model deciding
 * whether it is ALLOWED is not - so authorization, action limits and the
 * blast-radius cap all live here, in pure testable code, and are never
 * delegated to the extraction step.
 *
 * SAFETY SHAPE
 * -----------
 * - Only an authorized commander's comment is ever executed. Anyone can tag
 *   @zoe with a question; only Zaal can tell it to change the board.
 * - Only three verbs exist: create a task, assign a task, close a task. There is
 *   deliberately no delete, no archive, no bulk operation, no schema change.
 * - Closing sets status, never removes a row, and always records why.
 * - A cap per comment, so a malformed extraction costs a reviewable handful.
 */

import { z } from 'zod';

/** Someone whose @zoe comment may CHANGE the board, not just query it. */
const AUTHORIZED_COMMANDERS = new Set(['zaal']);

/**
 * Is this commenter allowed to issue commands?
 *
 * Matched on the board's displayName, lowercased. Deliberately strict: an
 * unknown name is not a commander. A teammate tagging @zoe still gets an
 * ANSWER (that path is unchanged) - they just cannot mutate the board through
 * it, which stops a comment box from becoming an unauthenticated write API.
 */
export function isAuthorizedCommander(displayName?: string | null): boolean {
  return AUTHORIZED_COMMANDERS.has((displayName || '').trim().toLowerCase());
}

/** Does this comment address ZOE at all? */
export function tagsZoe(content: string): boolean {
  return /(^|\s)@zoe\b/i.test(content || '');
}

/**
 * The three things ZOE may do to the board.
 *
 * Kept deliberately small. Every verb here is reversible: a created task can be
 * closed, a closed task reopened, an assignment reassigned. Nothing destroys
 * anything, which is what makes it safe to run without a human in the loop.
 */
export const CommandSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_task'),
    /** Short imperative title. Long context belongs in `why`, not the title. */
    title: z.string().min(3).max(120),
    /** team_members.legacy_owner slug, lowercase. */
    assignee: z.string().min(1).max(40).optional(),
    why: z.string().max(600).optional(),
  }),
  z.object({
    action: z.literal('close_task'),
    /** Omitted means "this one" - the task the comment is on. */
    taskRef: z.enum(['this']).default('this'),
    reason: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('assign_task'),
    assignee: z.string().min(1).max(40),
    taskRef: z.enum(['this']).default('this'),
  }),
]);

export type BoardCommand = z.infer<typeof CommandSchema>;

/**
 * Cap per comment.
 *
 * Not a performance limit - a blast-radius one. If extraction ever goes wrong,
 * a bad comment costs a reviewable handful of changes rather than a rewritten
 * board, and the overflow is reported rather than silently dropped.
 */
export const MAX_COMMANDS_PER_COMMENT = 5;

export interface ParseResult {
  commands: BoardCommand[];
  /** Entries the model returned that did not validate. Reported, never run. */
  rejected: string[];
  /** How many were dropped by the cap. Surfaced so truncation is never silent. */
  dropped: number;
}

/**
 * Validate what the extraction step returned.
 *
 * Takes the raw parsed JSON, not a string, so the caller owns transport. Every
 * entry must satisfy the schema; anything that does not is REJECTED and
 * reported rather than coerced. A command we half-understand is one we do not
 * run.
 */
export function parseCommands(raw: unknown): ParseResult {
  const out: ParseResult = { commands: [], rejected: [], dropped: 0 };
  if (!Array.isArray(raw)) {
    if (raw != null) out.rejected.push('extraction did not return a list');
    return out;
  }
  for (const entry of raw) {
    const r = CommandSchema.safeParse(entry);
    if (r.success) out.commands.push(r.data);
    else out.rejected.push(summarize(entry));
  }
  if (out.commands.length > MAX_COMMANDS_PER_COMMENT) {
    out.dropped = out.commands.length - MAX_COMMANDS_PER_COMMENT;
    out.commands = out.commands.slice(0, MAX_COMMANDS_PER_COMMENT);
  }
  return out;
}

function summarize(entry: unknown): string {
  try {
    const s = JSON.stringify(entry);
    return s.length > 120 ? `${s.slice(0, 117)}...` : s;
  } catch {
    return String(entry).slice(0, 120);
  }
}

/**
 * Decide whether a comment should be executed at all.
 *
 * Three gates, in order of cheapness. All must pass.
 */
export function shouldExecute(comment: { content?: string; displayName?: string | null }): {
  execute: boolean;
  reason: string;
} {
  const content = comment.content || '';
  if (!tagsZoe(content)) return { execute: false, reason: 'does not tag @zoe' };
  if (!isAuthorizedCommander(comment.displayName)) {
    // Still answerable by the existing reply path - just not executable.
    return { execute: false, reason: `${comment.displayName || 'unknown'} is not an authorized commander` };
  }
  return { execute: true, reason: 'authorized' };
}

/**
 * The extraction prompt.
 *
 * Two things it must get right, and both are stated as rules rather than hopes:
 * return [] when the comment is only conversational (most @zoe comments are
 * questions, and inventing a command from a question is the expensive failure),
 * and never guess an assignee.
 */
export const EXTRACTION_PROMPT = `You convert a board comment into zero or more structured commands.

Return ONLY a JSON array. No prose, no code fence.

Allowed actions, and nothing else:
  {"action":"create_task","title":"<short imperative>","assignee":"<slug or omit>","why":"<one line, optional>"}
  {"action":"close_task","taskRef":"this","reason":"<one line, optional>"}
  {"action":"assign_task","assignee":"<slug>","taskRef":"this"}

Rules:
- Return [] if the comment is a question, a status note, or conversation. Most
  comments are. Inventing a command from a question is the worst thing you can do.
- Only emit a command the comment ACTUALLY asks for. Never infer an extra step.
- "close this one" / "mark this done" -> close_task with taskRef "this".
- Titles are short and imperative. Context goes in "why", never in the title.
- assignee is a lowercase name slug exactly as written in the comment (e.g. "iman").
  If no assignee is named, OMIT the field. Never guess one.
- If the comment asks for something outside the three actions above, ignore that
  part and return only what fits.

Comment:
`;

/**
 * A human-readable receipt of what was done.
 *
 * Posted back as ZOE's in-thread reply so a board action is never silent - the
 * person who issued it, and anyone reading later, can see exactly what changed
 * without opening a log.
 */
export function renderReceipt(
  applied: Array<{ command: BoardCommand; ok: boolean; detail: string }>,
  rejected: string[],
  dropped: number,
): string {
  const lines: string[] = [];
  for (const a of applied) {
    lines.push(`${a.ok ? 'done' : 'FAILED'}: ${describe(a.command)}${a.detail ? ` - ${a.detail}` : ''}`);
  }
  for (const r of rejected) lines.push(`skipped (did not validate): ${r}`);
  if (dropped > 0) lines.push(`${dropped} more command(s) not run - over the ${MAX_COMMANDS_PER_COMMENT} per-comment cap`);
  return lines.length ? lines.join('\n') : 'nothing to do';
}

function describe(c: BoardCommand): string {
  if (c.action === 'create_task') {
    return `created "${c.title}"${c.assignee ? ` for ${c.assignee}` : ''}`;
  }
  if (c.action === 'close_task') return 'closed this task';
  return `assigned this task to ${c.assignee}`;
}
