import { describe, it, expect, vi } from 'vitest';
import {
  buildCandidateKeyboard,
  parseBuildCandidateCallback,
  applyBuildCandidate,
} from '../build-candidate';

describe('build-candidate', () => {
  describe('buildCandidateKeyboard', () => {
    it('builds an Approve + Skip row with bc: callbacks', () => {
      const kb = buildCandidateKeyboard('1234');
      expect(kb.inline_keyboard).toHaveLength(1);
      const [approve, skip] = kb.inline_keyboard[0];
      expect(approve.callback_data).toBe('bc:approve:1234');
      expect(skip.callback_data).toBe('bc:skip:1234');
    });
  });

  describe('parseBuildCandidateCallback', () => {
    it('parses approve and skip', () => {
      expect(parseBuildCandidateCallback('bc:approve:99')).toEqual({ action: 'approve', id: '99' });
      expect(parseBuildCandidateCallback('bc:skip:abc-1')).toEqual({ action: 'skip', id: 'abc-1' });
    });
    it('returns null for non-bc callbacks (falls through the router)', () => {
      expect(parseBuildCandidateCallback('veto:5')).toBeNull();
      expect(parseBuildCandidateCallback('bc:bogus:5')).toBeNull();
      expect(parseBuildCandidateCallback('bc:approve:')).toBeNull();
      expect(parseBuildCandidateCallback('')).toBeNull();
    });
  });

  describe('applyBuildCandidate', () => {
    it('approve merges build_approved into existing metadata (preserves why/tier)', async () => {
      const read = vi.fn().mockResolvedValue({ why: 'worth it', tier: 'premium-build-candidate' });
      const patch = vi.fn().mockResolvedValue(undefined);
      const res = await applyBuildCandidate('approve', '7', read, patch, '2026-08-04T00:00:00Z');
      expect(res.ok).toBe(true);
      expect(res.already).toBeUndefined();
      expect(patch).toHaveBeenCalledWith('7', {
        why: 'worth it',
        tier: 'premium-build-candidate',
        build_approved: '2026-08-04T00:00:00Z',
      });
    });

    it('skip sets build_skipped and clears any prior build_approved', async () => {
      const read = vi.fn().mockResolvedValue({ why: 'x', build_approved: '2026-08-01T00:00:00Z' });
      const patch = vi.fn().mockResolvedValue(undefined);
      const res = await applyBuildCandidate('skip', '7', read, patch, '2026-08-04T00:00:00Z');
      expect(res.ok).toBe(true);
      expect(patch).toHaveBeenCalledWith('7', { why: 'x', build_skipped: '2026-08-04T00:00:00Z' });
    });

    it('is idempotent: re-approving an approved candidate is a no-op', async () => {
      const read = vi.fn().mockResolvedValue({ build_approved: '2026-08-01T00:00:00Z' });
      const patch = vi.fn().mockResolvedValue(undefined);
      const res = await applyBuildCandidate('approve', '7', read, patch, '2026-08-04T00:00:00Z');
      expect(res).toEqual({ ok: true, already: true });
      expect(patch).not.toHaveBeenCalled();
    });

    it('returns not-found when the row is gone (never a false success)', async () => {
      const read = vi.fn().mockResolvedValue(null);
      const patch = vi.fn();
      const res = await applyBuildCandidate('approve', 'gone', read, patch, '2026-08-04T00:00:00Z');
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/not found/);
      expect(patch).not.toHaveBeenCalled();
    });

    it('surfaces a patch failure loudly (no silent success)', async () => {
      const read = vi.fn().mockResolvedValue({});
      const patch = vi.fn().mockRejectedValue(new Error('Tracker PATCH failed (400)'));
      const res = await applyBuildCandidate('approve', '7', read, patch, '2026-08-04T00:00:00Z');
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/400/);
    });
  });
});
