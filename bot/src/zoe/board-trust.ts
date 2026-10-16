/**
 * board-trust.ts - which cowork board commands may run with Zaal's private scope.
 *
 * The board's control plane (ZAODEVZ/ZAOcowork) queues `ask` and `run_task`
 * commands for ZOE, and ZOE used to run both in Zaal's private scope with the
 * concierge's tools. Measured 2026-10-16 on ZAOcowork main b891d2d:
 *
 * - `bot_commands` has RLS on and no policies (migration 028 notes it), so
 *   only server code with the service role writes it. The one insert is
 *   `POST /api/v1/bots/commands`, which sets `created_by` from the signed
 *   session cookie, not from the request body.
 * - `ask` is open to ANY logged-in team session (`SESSION_COMMANDS = ["ask"]`);
 *   `run_task` and the lifecycle commands need `isAdmin` (Zaal, Iman, or a DB
 *   role of admin).
 * - The claim the poller receives (`GET /api/v1/bots/commands`) selects
 *   `id, bot, command, args, status, created_at`: no `created_by`, so until
 *   the board sends it ZOE cannot tell who wrote a command.
 *
 * So the rule here: a command is TRUSTED only when its author is named and on
 * ZOE_BOARD_TRUSTED_AUTHORS (default `zaal`). Anything else, including every
 * command that arrives without an author, is untrusted:
 *
 * - an untrusted `ask` is answered talk-only (no tools, none of Zaal's memory,
 *   no ops), in its own scope;
 * - an untrusted `run_task` does not run. Zaal gets a Run / Decline card and it
 *   runs with tools only on his tap.
 */

export function trustedBoardAuthors(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = (env.ZOE_BOARD_TRUSTED_AUTHORS ?? 'zaal').trim();
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : ['zaal'];
}

export function isTrustedBoardCommand(createdBy: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const who = (createdBy ?? '').trim().toLowerCase();
  return who.length > 0 && trustedBoardAuthors(env).includes(who);
}

/** Memory scope for an untrusted board ask. Never 'private'. */
export const BOARD_UNTRUSTED_SCOPE = 'board-untrusted';

export const BOARD_APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

export interface HeldRunTask {
  commandId: number;
  instructions: string;
  todoId: string;
  createdBy: string | null;
  heldAt: number;
}

export interface RunTaskApprovals {
  hold: (task: Omit<HeldRunTask, 'heldAt'>, nowMs: number) => string;
  /** Returns the held task once, or null if unknown, already taken, or expired. */
  take: (key: string, nowMs: number) => HeldRunTask | null;
}

export function newRunTaskApprovals(): RunTaskApprovals {
  const held = new Map<string, HeldRunTask>();
  const prune = (nowMs: number) => {
    for (const [k, t] of held) if (nowMs - t.heldAt >= BOARD_APPROVAL_TTL_MS) held.delete(k);
  };
  return {
    hold: (task, nowMs) => {
      prune(nowMs);
      const key = `${task.commandId}-${nowMs.toString(36)}`;
      held.set(key, { ...task, heldAt: nowMs });
      return key;
    },
    take: (key, nowMs) => {
      prune(nowMs);
      const t = held.get(key) ?? null;
      held.delete(key);
      return t;
    },
  };
}

export const BOARD_RUN_CALLBACK = /^bct:(run|no):([0-9]+-[0-9a-z]+)$/;

export function runTaskApprovalCard(task: Omit<HeldRunTask, 'heldAt'>, key: string): {
  text: string;
  keyboard: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
} {
  const who = task.createdBy ? task.createdBy : 'an unnamed board user';
  const todo = task.todoId ? ` (cowork todo #${task.todoId})` : '';
  return {
    text:
      `Board task${todo} from ${who}, held until you tap. Running it uses ZOE's tools.\n\n` +
      `${task.instructions.slice(0, 1500) || '(no instructions)'}`,
    keyboard: {
      inline_keyboard: [
        [
          { text: 'Run it', callback_data: `bct:run:${key}` },
          { text: 'Decline', callback_data: `bct:no:${key}` },
        ],
      ],
    },
  };
}
