import { describe, it, expect, vi } from 'vitest';
import { buildVetoKeyboard, parseVetoCallback, applyVeto, type VetoTask } from '../brief-veto';

describe('brief-veto', () => {
  describe('buildVetoKeyboard', () => {
    it('builds one button per task, capped at max', () => {
      const tasks: VetoTask[] = [
        { id: 'task-1', title: 'First task' },
        { id: 'task-2', title: 'Second task' },
        { id: 'task-3', title: 'Third task' },
      ];

      const kb = buildVetoKeyboard(tasks, 2);

      expect(kb.inline_keyboard).toHaveLength(2);
      expect(kb.inline_keyboard[0]).toHaveLength(1);
      expect(kb.inline_keyboard[0][0].text).toContain('First task');
      expect(kb.inline_keyboard[0][0].callback_data).toBe('veto:task-1');
      expect(kb.inline_keyboard[1][0].text).toContain('Second task');
      expect(kb.inline_keyboard[1][0].callback_data).toBe('veto:task-2');
    });

    it('truncates long titles to fit on mobile', () => {
      const tasks: VetoTask[] = [{ id: 'task-1', title: 'This is a very long task title that should be truncated' }];

      const kb = buildVetoKeyboard(tasks, 5);

      expect(kb.inline_keyboard[0][0].text).toContain('...');
      expect(kb.inline_keyboard[0][0].text.length).toBeLessThan(50); // rough mobile-fit heuristic
    });

    it('returns empty keyboard for empty task list', () => {
      const kb = buildVetoKeyboard([], 5);
      expect(kb.inline_keyboard).toHaveLength(0);
    });

    it('returns empty keyboard for max <= 0', () => {
      const tasks: VetoTask[] = [{ id: 'task-1', title: 'Task' }];
      const kb = buildVetoKeyboard(tasks, 0);
      expect(kb.inline_keyboard).toHaveLength(0);
    });

    it('uses default max=5 when not specified', () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      const kb = buildVetoKeyboard(tasks);

      expect(kb.inline_keyboard).toHaveLength(5);
    });

    it('includes emoji in button labels', () => {
      const tasks: VetoTask[] = [{ id: 'task-1', title: 'Something' }];

      const kb = buildVetoKeyboard(tasks);

      expect(kb.inline_keyboard[0][0].text).toContain('🚫');
    });
  });

  describe('parseVetoCallback', () => {
    it('parses veto:<id> callback data', () => {
      const taskId = parseVetoCallback('veto:abc-123');
      expect(taskId).toBe('abc-123');
    });

    it('returns null for non-veto callback data', () => {
      const taskId = parseVetoCallback('q:what:abcd');
      expect(taskId).toBeNull();
    });

    it('returns null for malformed veto data', () => {
      const taskId = parseVetoCallback('veto:');
      expect(taskId).toBeNull();
    });

    it('returns null for empty string', () => {
      const taskId = parseVetoCallback('');
      expect(taskId).toBeNull();
    });

    it('handles IDs with special characters', () => {
      const taskId = parseVetoCallback('veto:task-123_abc');
      expect(taskId).toBe('task-123_abc');
    });
  });

  describe('applyVeto', () => {
    it('calls patchImpl with taskId and morning_veto metadata', async () => {
      const mockPatch = vi.fn(async (_taskId: string, _metadata: Record<string, unknown>) => {});
      const now = '2026-07-15T12:00:00Z';

      const result = await applyVeto('task-123', mockPatch, now);

      expect(result).toBe(true);
      expect(mockPatch).toHaveBeenCalledOnce();
      const call = mockPatch.mock.calls[0];
      expect(call).toBeDefined();
      expect(call?.[0]).toBe('task-123');
      expect(call?.[1]).toEqual({ morning_veto: now });
    });

    it('returns false when patchImpl throws', async () => {
      const mockPatch = vi.fn(async () => {
        throw new Error('Network error');
      });

      const result = await applyVeto('task-123', mockPatch, '2026-07-15T12:00:00Z');

      expect(result).toBe(false);
    });

    it('logs error on failure but does not throw', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockPatch = vi.fn(async () => {
        throw new Error('Patch failed');
      });

      const result = await applyVeto('task-123', mockPatch, '2026-07-15T12:00:00Z');

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[zoe/brief-veto] applyVeto failed'),
        expect.stringContaining('Patch failed'),
      );
      consoleError.mockRestore();
    });

    it('passes correct ISO timestamp to patchImpl', async () => {
      const mockPatch = vi.fn(async (_taskId: string, _metadata: Record<string, unknown>) => {});
      const isoTime = new Date('2026-07-15T14:30:45Z').toISOString();

      await applyVeto('task-456', mockPatch, isoTime);

      const call = mockPatch.mock.calls[0];
      const metadata = call?.[1] as Record<string, unknown> | undefined;
      expect(metadata?.morning_veto).toBe(isoTime);
    });
  });
});
