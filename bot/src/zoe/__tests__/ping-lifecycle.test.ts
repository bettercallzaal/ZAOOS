import { describe, it, expect, vi } from 'vitest';
import {
  getPendingRepliesToResolve,
  computeClosedTaskIds,
  resolveClosedTaskPings,
  runPingLifecycleTick,
} from '../ping-lifecycle';
import type { PendingReply } from '../task-teammate-ack';
import type { TaskStatusRow } from '../team-tracker';

describe('getPendingRepliesToResolve', () => {
  it('returns only replies whose taskId is in the closed set', () => {
    const pending: PendingReply[] = [
      {
        messageId: 100,
        taskId: 'task-1',
        commentId: 'comment-1',
        taskTitle: 'Fix bug',
        createdAt: '2026-07-16T10:00:00Z',
      },
      {
        messageId: 101,
        taskId: 'task-2',
        commentId: 'comment-2',
        taskTitle: 'Add feature',
        createdAt: '2026-07-16T11:00:00Z',
      },
    ];
    const closedTaskIds = new Set(['task-1']);

    const result = getPendingRepliesToResolve(pending, closedTaskIds);

    expect(result).toHaveLength(1);
    expect(result[0].messageId).toBe(100);
  });

  it('returns empty list when no tasks are closed', () => {
    const pending: PendingReply[] = [
      {
        messageId: 100,
        taskId: 'task-1',
        commentId: 'comment-1',
        taskTitle: 'Fix bug',
        createdAt: '2026-07-16T10:00:00Z',
      },
    ];
    const closedTaskIds = new Set<string>();

    const result = getPendingRepliesToResolve(pending, closedTaskIds);

    expect(result).toHaveLength(0);
  });

  it('returns empty list when pending is empty', () => {
    const pending: PendingReply[] = [];
    const closedTaskIds = new Set(['task-1']);

    const result = getPendingRepliesToResolve(pending, closedTaskIds);

    expect(result).toHaveLength(0);
  });
});

describe('computeClosedTaskIds', () => {
  it('includes tasks with status=done', () => {
    const rows: TaskStatusRow[] = [
      { id: 'task-1', status: 'done', archived_at: null },
      { id: 'task-2', status: 'todo', archived_at: null },
    ];

    const result = computeClosedTaskIds(rows);

    expect(result).toEqual(new Set(['task-1']));
  });

  it('includes tasks with archived_at != null', () => {
    const rows: TaskStatusRow[] = [
      { id: 'task-1', status: 'todo', archived_at: '2026-07-15T10:00:00Z' },
      { id: 'task-2', status: 'todo', archived_at: null },
    ];

    const result = computeClosedTaskIds(rows);

    expect(result).toEqual(new Set(['task-1']));
  });

  it('includes tasks with both status=done and archived_at', () => {
    const rows: TaskStatusRow[] = [
      { id: 'task-1', status: 'done', archived_at: '2026-07-15T10:00:00Z' },
    ];

    const result = computeClosedTaskIds(rows);

    expect(result).toEqual(new Set(['task-1']));
  });

  it('excludes open tasks (status != done, archived_at = null)', () => {
    const rows: TaskStatusRow[] = [
      { id: 'task-1', status: 'todo', archived_at: null },
      { id: 'task-2', status: 'in_progress', archived_at: null },
    ];

    const result = computeClosedTaskIds(rows);

    expect(result.size).toBe(0);
  });

  it('handles empty rows', () => {
    const rows: TaskStatusRow[] = [];

    const result = computeClosedTaskIds(rows);

    expect(result.size).toBe(0);
  });
});

describe('resolveClosedTaskPings', () => {
  it('unpins and removes replies for closed tasks', async () => {
    const pendingMap = new Map<number, PendingReply>([
      [
        100,
        {
          messageId: 100,
          taskId: 'task-1',
          commentId: 'comment-1',
          taskTitle: 'Fix bug',
          createdAt: '2026-07-16T10:00:00Z',
        },
      ],
      [
        101,
        {
          messageId: 101,
          taskId: 'task-2',
          commentId: 'comment-2',
          taskTitle: 'Add feature',
          createdAt: '2026-07-16T11:00:00Z',
        },
      ],
    ]);

    const readPending = vi.fn(async () => pendingMap);
    const removePending = vi.fn(async () => undefined);
    const getTaskStatuses = vi.fn(async (): Promise<TaskStatusRow[]> => [
      { id: 'task-1', status: 'done', archived_at: null },
      { id: 'task-2', status: 'todo', archived_at: null },
    ]);
    const unpin = vi.fn(async () => undefined);

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(1);
    expect(unpin).toHaveBeenCalledWith(123456, 100);
    expect(removePending).toHaveBeenCalledWith(100);
    expect(unpin).not.toHaveBeenCalledWith(123456, 101);
  });

  it('swallows unpin errors and continues', async () => {
    const pendingMap = new Map<number, PendingReply>([
      [
        100,
        {
          messageId: 100,
          taskId: 'task-1',
          commentId: 'comment-1',
          taskTitle: 'Fix bug',
          createdAt: '2026-07-16T10:00:00Z',
        },
      ],
      [
        101,
        {
          messageId: 101,
          taskId: 'task-2',
          commentId: 'comment-2',
          taskTitle: 'Add feature',
          createdAt: '2026-07-16T11:00:00Z',
        },
      ],
    ]);

    const readPending = vi.fn(async () => pendingMap);
    const removePending = vi.fn(async () => undefined);
    const getTaskStatuses = vi.fn(async (): Promise<TaskStatusRow[]> => [
      { id: 'task-1', status: 'done', archived_at: null },
      { id: 'task-2', status: 'done', archived_at: null },
    ]);
    const unpin = vi
      .fn()
      .mockRejectedValueOnce(new Error('unpin failed'))
      .mockResolvedValueOnce(undefined); // second unpin succeeds

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    // Both should be removed despite first unpin failure.
    expect(result.resolved).toBe(2);
    expect(removePending).toHaveBeenCalledTimes(2);
  });

  it('noops when no pending replies', async () => {
    const readPending = vi.fn(async () => new Map());
    const removePending = vi.fn();
    const getTaskStatuses = vi.fn();
    const unpin = vi.fn();

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(0);
    expect(getTaskStatuses).not.toHaveBeenCalled();
  });

  it('noops when all tasks are still open', async () => {
    const pendingMap = new Map<number, PendingReply>([
      [
        100,
        {
          messageId: 100,
          taskId: 'task-1',
          commentId: 'comment-1',
          taskTitle: 'Fix bug',
          createdAt: '2026-07-16T10:00:00Z',
        },
      ],
    ]);

    const readPending = vi.fn(async () => pendingMap);
    const removePending = vi.fn();
    const getTaskStatuses = vi.fn(async (): Promise<TaskStatusRow[]> => [
      { id: 'task-1', status: 'todo', archived_at: null },
    ]);
    const unpin = vi.fn();

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(0);
    expect(unpin).not.toHaveBeenCalled();
  });

  it('handles readPending failures gracefully', async () => {
    const readPending = vi.fn(async () => {
      throw new Error('read failed');
    });
    const removePending = vi.fn();
    const getTaskStatuses = vi.fn();
    const unpin = vi.fn();

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(0);
    expect(getTaskStatuses).not.toHaveBeenCalled();
  });

  it('handles getTaskStatuses failures gracefully', async () => {
    const pendingMap = new Map<number, PendingReply>([
      [
        100,
        {
          messageId: 100,
          taskId: 'task-1',
          commentId: 'comment-1',
          taskTitle: 'Fix bug',
          createdAt: '2026-07-16T10:00:00Z',
        },
      ],
    ]);

    const readPending = vi.fn(async () => pendingMap);
    const removePending = vi.fn();
    const getTaskStatuses = vi.fn(async () => {
      throw new Error('tracker offline');
    });
    const unpin = vi.fn();

    const result = await resolveClosedTaskPings({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(0);
    expect(unpin).not.toHaveBeenCalled();
  });
});

describe('runPingLifecycleTick', () => {
  it('calls resolveClosedTaskPings with injected dependencies', async () => {
    const pendingMap = new Map<number, PendingReply>([
      [
        100,
        {
          messageId: 100,
          taskId: 'task-1',
          commentId: 'comment-1',
          taskTitle: 'Fix bug',
          createdAt: '2026-07-16T10:00:00Z',
        },
      ],
    ]);

    const readPending = vi.fn(async () => pendingMap);
    const removePending = vi.fn(async () => undefined);
    const getTaskStatuses = vi.fn(async (): Promise<TaskStatusRow[]> => [
      { id: 'task-1', status: 'done', archived_at: null },
    ]);
    const unpin = vi.fn(async () => undefined);

    const result = await runPingLifecycleTick({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(1);
    expect(readPending).toHaveBeenCalled();
    expect(getTaskStatuses).toHaveBeenCalled();
  });

  it('handles exceptions from inner function', async () => {
    const readPending = vi.fn(async () => {
      throw new Error('catastrophic failure');
    });
    const removePending = vi.fn();
    const getTaskStatuses = vi.fn();
    const unpin = vi.fn();

    const result = await runPingLifecycleTick({
      readPending,
      removePending,
      getTaskStatuses,
      unpin,
      chatId: 123456,
    });

    expect(result.resolved).toBe(0);
  });
});
