import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
}));

vi.mock('../../../hermes/claude-cli', () => ({
  callClaudeCli: mocks.callClaudeCli,
}));

import { pickBestDraft, freshDrafts, heuristicBest, FRESH_WINDOW_MS } from '../select-best';
import type { QueuedDraft } from '../drafts-queue';

const NOW = new Date('2026-06-17T12:00:00.000Z').getTime();

function draft(id: string, text: string, ageMs = 0, category: QueuedDraft['category'] = 'build'): QueuedDraft {
  return { id, category, text, createdAt: new Date(NOW - ageMs).toISOString() };
}

describe('freshDrafts', () => {
  it('keeps drafts within the fresh window and drops older ones', () => {
    const fresh = draft('a', 'fresh', 60_000);
    const stale = draft('b', 'stale', FRESH_WINDOW_MS + 60_000);
    const out = freshDrafts([fresh, stale], NOW);
    expect(out.map((d) => d.id)).toEqual(['a']);
  });
});

describe('heuristicBest', () => {
  it('prefers a draft that names a number', () => {
    const withNum = draft('a', 'shipped the fix PR 533', 1000);
    const noNum = draft('b', 'shipped a thing today', 0);
    expect(heuristicBest([noNum, withNum]).id).toBe('a');
  });

  it('falls back to most recent when neither has a number', () => {
    const older = draft('a', 'shipped a thing', 5000);
    const newer = draft('b', 'shipped another thing', 0);
    expect(heuristicBest([older, newer]).id).toBe('b');
  });
});

describe('pickBestDraft', () => {
  beforeEach(() => {
    mocks.callClaudeCli.mockReset();
  });

  it('returns null on empty backlog', async () => {
    expect(await pickBestDraft([], { cwd: '/tmp', nowMs: NOW })).toBeNull();
  });

  it('short-circuits with only-candidate when one draft remains', async () => {
    const only = draft('a', 'only one', 1000);
    const pick = await pickBestDraft([only], { cwd: '/tmp', nowMs: NOW });
    expect(pick?.via).toBe('only-candidate');
    expect(pick?.best.id).toBe('a');
    expect(pick?.dropped).toEqual([]);
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
  });

  it('uses the LLM judge choice and marks the rest as dropped', async () => {
    mocks.callClaudeCli.mockResolvedValue({ text: '2' });
    const drafts = [draft('a', 'one', 1000), draft('b', 'two', 2000), draft('c', 'three', 3000)];
    const pick = await pickBestDraft(drafts, { cwd: '/tmp', nowMs: NOW });
    expect(pick?.via).toBe('llm');
    expect(pick?.best.id).toBe('b');
    expect(pick?.considered).toBe(3);
    expect(pick?.dropped.map((d) => d.id).sort()).toEqual(['a', 'c']);
  });

  it('falls back to heuristic when the judge returns garbage', async () => {
    mocks.callClaudeCli.mockResolvedValue({ text: 'the best one obviously' });
    const drafts = [draft('a', 'no number here', 1000), draft('b', 'has PR 12', 2000)];
    const pick = await pickBestDraft(drafts, { cwd: '/tmp', nowMs: NOW });
    expect(pick?.via).toBe('heuristic');
    expect(pick?.best.id).toBe('b');
  });

  it('falls back to heuristic when the judge throws', async () => {
    mocks.callClaudeCli.mockRejectedValue(new Error('cli down'));
    const drafts = [draft('a', 'plain', 1000), draft('b', 'has 7 things', 2000)];
    const pick = await pickBestDraft(drafts, { cwd: '/tmp', nowMs: NOW });
    expect(pick?.via).toBe('heuristic');
    expect(pick?.best.id).toBe('b');
  });

  it('judges only fresh drafts when some are stale', async () => {
    mocks.callClaudeCli.mockResolvedValue({ text: '1' });
    const freshA = draft('a', 'fresh one', 60_000);
    const stale = draft('b', 'stale one', FRESH_WINDOW_MS + 60_000);
    const pick = await pickBestDraft([freshA, stale], { cwd: '/tmp', nowMs: NOW });
    // only 1 fresh -> only-candidate, stale is dropped
    expect(pick?.best.id).toBe('a');
    expect(pick?.dropped.map((d) => d.id)).toEqual(['b']);
  });
});
