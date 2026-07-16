/**
 * ping-lifecycle.ts — tie teammate-ack pings to board task lifecycles.
 *
 * When a teammate comment triggers a Telegram ping to Zaal (via task-teammate-ack),
 * a PendingReply record maps messageId -> taskId. When that task closes (status=done
 * or archived), this module detects it and resolves the ping (unpins it, removes
 * the PendingReply so ZOE stops waiting).
 *
 * Core logic is pure (getPendingRepliesToResolve, computeClosedTaskIds) so it's
 * unit-testable. The resolution routine is injected with tracker-query and unpin
 * fns for testability without network/Telegram.
 */

import type { PendingReply } from './task-teammate-ack';
import type { TaskStatusRow } from './team-tracker';

/**
 * Pure: given a set of closed task IDs, return only PendingReply entries
 * whose taskId is in that set. These are the pings to resolve.
 */
export function getPendingRepliesToResolve(pending: PendingReply[], closedTaskIds: Set<string>): PendingReply[] {
  return pending.filter((p) => closedTaskIds.has(p.taskId));
}

/**
 * Pure: given task status rows from the tracker, return the set of task IDs
 * that are closed (status='done' OR archived_at != null).
 */
export function computeClosedTaskIds(statusRows: TaskStatusRow[]): Set<string> {
  const closed = new Set<string>();
  for (const row of statusRows) {
    if (row.status === 'done' || row.archived_at !== null) {
      closed.add(row.id);
    }
  }
  return closed;
}

export type GetTaskStatusesFn = (taskIds: string[]) => Promise<TaskStatusRow[]>;
export type RemovePendingFn = (messageId: number) => Promise<void>;
export type UnpinFn = (chatId: number, messageId: number) => Promise<void>;

export interface ResolutionRoutineResult {
  resolved: number;
}

/**
 * Core resolution routine: read pending replies, find distinct taskIds,
 * query the tracker for their status, identify closed ones, unpin messages,
 * and remove the PendingReply entries. Injected fns for testability.
 *
 * Params:
 *   readPending: fetch all PendingReply records
 *   removePending: delete a PendingReply by messageId
 *   getTaskStatuses: fetch task rows by ID (returns status + archived_at)
 *   unpin: unpin a Telegram message (chatId, messageId, best-effort)
 *   chatId: Zaal's Telegram chat ID (where pings were sent)
 *
 * Returns: { resolved: count }. Never throws; best-effort for unpin.
 */
export async function resolveClosedTaskPings(deps: {
  readPending: () => Promise<Map<number, PendingReply>>;
  removePending: RemovePendingFn;
  getTaskStatuses: GetTaskStatusesFn;
  unpin: UnpinFn;
  chatId: number;
}): Promise<ResolutionRoutineResult> {
  const result: ResolutionRoutineResult = { resolved: 0 };

  // Read all pending replies.
  let pendingMap: Map<number, PendingReply>;
  try {
    pendingMap = await deps.readPending();
  } catch {
    return result; // no-op on read failure (best-effort)
  }

  if (pendingMap.size === 0) return result; // nothing to do

  // Collect distinct task IDs.
  const taskIds = new Set(Array.from(pendingMap.values()).map((p) => p.taskId));

  // Query tracker for current status.
  let rows: TaskStatusRow[] = [];
  try {
    rows = await deps.getTaskStatuses(Array.from(taskIds));
  } catch {
    return result; // no-op on tracker failure (best-effort)
  }

  // Identify closed tasks.
  const closedTaskIds = computeClosedTaskIds(rows);
  if (closedTaskIds.size === 0) return result; // nothing closed

  // Find pending replies tied to closed tasks.
  const pending = Array.from(pendingMap.values());
  const toResolve = getPendingRepliesToResolve(pending, closedTaskIds);

  // Unpin + remove each one (best-effort, one failure doesn't block the batch).
  for (const reply of toResolve) {
    try {
      await deps.unpin(deps.chatId, reply.messageId);
    } catch {
      // swallow unpin errors (best-effort)
    }
    try {
      await deps.removePending(reply.messageId);
    } catch {
      // swallow remove errors (best-effort)
    }
    result.resolved += 1;
  }

  return result;
}

/**
 * Scheduler-friendly wrapper. Calls resolveClosedTaskPings with injected
 * readPending, removePending, getTaskStatuses, and unpin functions.
 * Never throws; returns the resolution result.
 */
export async function runPingLifecycleTick(deps: {
  readPending: () => Promise<Map<number, PendingReply>>;
  removePending: RemovePendingFn;
  getTaskStatuses: GetTaskStatusesFn;
  unpin: UnpinFn;
  chatId: number;
}): Promise<ResolutionRoutineResult> {
  try {
    return await resolveClosedTaskPings(deps);
  } catch {
    return { resolved: 0 }; // best-effort fallback
  }
}
