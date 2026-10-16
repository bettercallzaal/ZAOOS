/**
 * scope-lock.ts - what a concierge turn may DO, by scope.
 *
 * Only Zaal's private turn may use tools or act. A turn in any other scope (a
 * group, a topic, a non-private chat) can only talk:
 *
 * - tools: toolPolicy 'none' (concierge.ts toolsFor): every built-in tool off,
 *   no MCP server loaded, an explicit deny list behind both, and an empty
 *   working directory outside every repo.
 * - ops: every op the model returns (tasks, quests, decisions, build state,
 *   bot relays, CRM, threads, captures) is cleared before anything reads it,
 *   so nothing downstream can apply, mirror or summarise one.
 *
 * Measured 2026-10-16 (ZAOOS PR body): the default tool set ran in the repo
 * directory under a host whose Claude settings allow far more than the
 * concierge's own list, with a GitHub token that can write. A group member's
 * message reached all of it. The private scope is unchanged.
 */

import type { ConciergeResult } from './types';

export type ToolPolicy = 'default' | 'none';

export function toolPolicyForScope(scope: string): ToolPolicy {
  return scope === 'private' ? 'default' : 'none';
}

/** Clear every op outside the private scope. Returns how many were dropped. */
export function stripOpsOutsidePrivate(result: ConciergeResult, scope: string): number {
  if (scope === 'private') return 0;
  const dropped =
    result.task_ops.length +
    result.quest_ops.length +
    result.captures.length +
    (result.bot_relay_ops?.length ?? 0) +
    (result.crm_ops?.length ?? 0) +
    (result.thread_ops?.length ?? 0) +
    (result.decision_ops?.length ?? 0) +
    (result.build_state_ops?.length ?? 0);
  result.task_ops = [];
  result.quest_ops = [];
  result.captures = [];
  result.bot_relay_ops = [];
  result.crm_ops = [];
  result.thread_ops = [];
  result.decision_ops = [];
  result.build_state_ops = [];
  return dropped;
}
