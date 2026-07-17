// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadTasks = vi.hoisted(() => vi.fn());
const mockWriteTasks = vi.hoisted(() => vi.fn());

vi.mock('../memory', () => ({
  readTasks: mockReadTasks,
  writeTasks: mockWriteTasks,
}));

import { applyTaskOps, listByStatus, listOpenTasks, seedInitialTasks } from '../tasks';
import type { ZoeTask } from '../types';

afterEach(() => vi.clearAllMocks());

function makeTask(overrides?: Partial<ZoeTask>): ZoeTask {
  return {
    id: 'task-001',
    title: 'Test task',
    description: 'Desc',
    status: 'pending',
    priority: 'med',
    source: 'test',
    notes: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── listOpenTasks ─────────────────────────────────────────────────────────────

describe('listOpenTasks', () => {
  it('returns pending and in_progress tasks', async () => {
    mockReadTasks.mockResolvedValue([
      makeTask({ id: 'a', status: 'pending' }),
      makeTask({ id: 'b', status: 'in_progress' }),
      makeTask({ id: 'c', status: 'completed' }),
      makeTask({ id: 'd', status: 'deferred' }),
      makeTask({ id: 'e', status: 'blocked' }),
    ]);
    const result = await listOpenTasks();
    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('returns [] when all tasks are closed', async () => {
    mockReadTasks.mockResolvedValue([makeTask({ status: 'completed' })]);
    expect(await listOpenTasks()).toEqual([]);
  });
});

// ── listByStatus ──────────────────────────────────────────────────────────────

describe('listByStatus', () => {
  it('returns only tasks matching the given status', async () => {
    mockReadTasks.mockResolvedValue([
      makeTask({ id: 'a', status: 'blocked' }),
      makeTask({ id: 'b', status: 'pending' }),
      makeTask({ id: 'c', status: 'blocked' }),
    ]);
    const result = await listByStatus('blocked');
    expect(result.map((t) => t.id)).toEqual(['a', 'c']);
  });
});

// ── applyTaskOps ──────────────────────────────────────────────────────────────

describe('applyTaskOps', () => {
  it('add op creates a new task and returns it in added[]', async () => {
    mockReadTasks.mockResolvedValue([]);
    mockWriteTasks.mockResolvedValue(undefined);
    const { added } = await applyTaskOps([{
      op: 'add',
      task: { title: 'New task', description: '', status: 'pending', priority: 'high', source: 'test', notes: [] },
    }]);
    expect(added).toHaveLength(1);
    expect(added[0].title).toBe('New task');
    expect(added[0].id).toBeDefined();
  });

  it('update op merges patch and appends new notes', async () => {
    const existing = makeTask({ id: 'task-001', status: 'pending', notes: ['original note'] });
    mockReadTasks.mockResolvedValue([existing]);
    mockWriteTasks.mockResolvedValue(undefined);
    const { updated } = await applyTaskOps([{
      op: 'update',
      id: 'task-001',
      patch: { title: 'Updated title', notes: ['new note'] },
    }]);
    expect(updated[0].title).toBe('Updated title');
    expect(updated[0].notes).toEqual(['original note', 'new note']);
  });

  it('update op skips silently when id is not found', async () => {
    mockReadTasks.mockResolvedValue([]);
    mockWriteTasks.mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { updated } = await applyTaskOps([{ op: 'update', id: 'missing', patch: { title: 'x' } }]);
    expect(updated).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('complete op sets status=completed and appends outcome note', async () => {
    const existing = makeTask({ id: 'task-001', notes: [] });
    mockReadTasks.mockResolvedValue([existing]);
    mockWriteTasks.mockResolvedValue(undefined);
    const { completed } = await applyTaskOps([{ op: 'complete', id: 'task-001', outcome: 'shipped PR #99' }]);
    expect(completed).toContain('task-001');
    const written = mockWriteTasks.mock.calls[0][0] as ZoeTask[];
    const t = written.find((x) => x.id === 'task-001')!;
    expect(t.status).toBe('completed');
    expect(t.notes[0]).toContain('shipped PR #99');
  });

  it('defer op sets status=deferred and appends reason note', async () => {
    const existing = makeTask({ id: 'task-001', notes: [] });
    mockReadTasks.mockResolvedValue([existing]);
    mockWriteTasks.mockResolvedValue(undefined);
    const { deferred } = await applyTaskOps([{ op: 'defer', id: 'task-001', reason: 'blocked on API' }]);
    expect(deferred).toContain('task-001');
    const written = mockWriteTasks.mock.calls[0][0] as ZoeTask[];
    const t = written.find((x) => x.id === 'task-001')!;
    expect(t.status).toBe('deferred');
    expect(t.notes[0]).toContain('blocked on API');
  });

  it('processes multiple ops in sequence within one call', async () => {
    const existing = makeTask({ id: 'task-002', status: 'pending', notes: [] });
    mockReadTasks.mockResolvedValue([existing]);
    mockWriteTasks.mockResolvedValue(undefined);
    const result = await applyTaskOps([
      { op: 'add', task: { title: 'Added', description: '', status: 'pending', priority: 'low', source: 'test', notes: [] } },
      { op: 'complete', id: 'task-002' },
    ]);
    expect(result.added).toHaveLength(1);
    expect(result.completed).toContain('task-002');
    expect(mockWriteTasks).toHaveBeenCalledOnce();
  });

  it('calls writeTasks with the full updated task list', async () => {
    const existing = makeTask({ id: 'task-x', status: 'pending' });
    mockReadTasks.mockResolvedValue([existing]);
    mockWriteTasks.mockResolvedValue(undefined);
    await applyTaskOps([]);
    expect(mockWriteTasks).toHaveBeenCalledWith([existing]);
  });
});

// ── seedInitialTasks ──────────────────────────────────────────────────────────

describe('seedInitialTasks', () => {
  it('returns { seeded: 0 } when tasks already exist', async () => {
    mockReadTasks.mockResolvedValue([makeTask()]);
    const result = await seedInitialTasks();
    expect(result.seeded).toBe(0);
    expect(mockWriteTasks).not.toHaveBeenCalled();
  });

  it('seeds initial tasks when the queue is empty', async () => {
    mockReadTasks.mockResolvedValue([]);
    mockWriteTasks.mockResolvedValue(undefined);
    const result = await seedInitialTasks();
    expect(result.seeded).toBeGreaterThan(0);
    const written = mockWriteTasks.mock.calls[0][0] as ZoeTask[];
    expect(written.length).toBe(result.seeded);
    expect(written[0].id).toBeDefined();
  });
});
