import { describe, it, expect, vi, beforeEach } from 'vitest';

// artifact store -> tmp so tests never touch ~/.zao
vi.hoisted(() => {
  process.env.COCKPIT_HOME = '/tmp/cockpit-test-artifacts';
});

// mock only the network reads (tracker + gh PR search); keep the pure adapter logic real
vi.mock('../adapters', async (importActual) => {
  const actual = await importActual<typeof import('../adapters')>();
  return { ...actual, fetchCockpitTasks: vi.fn(), fetchReviewPRs: vi.fn() };
});
vi.mock('../../hermes/claude-cli', () => ({
  callClaudeCli: vi.fn(),
  CliAuthError: class CliAuthError extends Error {},
  CliError: class CliError extends Error {},
}));

import { runCockpit } from '../cockpit';
import { fetchCockpitTasks, fetchReviewPRs } from '../adapters';
import { callClaudeCli, CliError } from '../../hermes/claude-cli';
import type { CockpitTask } from '../types';

const NOW = Date.parse('2026-07-09T12:00:00Z');
const fetchMock = fetchCockpitTasks as unknown as ReturnType<typeof vi.fn>;
const reviewMock = fetchReviewPRs as unknown as ReturnType<typeof vi.fn>;
const cliMock = callClaudeCli as unknown as ReturnType<typeof vi.fn>;

function task(o: Partial<CockpitTask> & { id: string; title: string }): CockpitTask {
  return {
    status: 'todo', priority: null, due: null, project: null, legacy_id: null,
    next_owner: null, updated_at: new Date(NOW).toISOString(), created_at: new Date(NOW).toISOString(), ...o,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  reviewMock.mockReset();
  reviewMock.mockResolvedValue([]); // no PR network in unit tests by default
  cliMock.mockReset();
});

describe('runCockpit', () => {
  it('attaches the operator read on the happy path', async () => {
    fetchMock.mockResolvedValue([task({ id: '1', title: 'ship it', due: '2026-07-09', priority: 'P0' })]);
    cliMock.mockResolvedValue({ text: 'Do ship it first.', isError: false, totalCostUsd: 0.02, inputTokens: 1, outputTokens: 1, model: 'sonnet', durationMs: 1, numTurns: 1, sessionId: 's' });
    const r = await runCockpit('brief', NOW);
    expect(r.operatorRead).toBe('Do ship it first.');
    expect(r.message.startsWith('Do ship it first.')).toBe(true);
    expect(r.message).toContain('Cockpit - 2026-07-09');
    expect(r.costUsd).toBe(0.02);
  });

  it('falls back to the deterministic brief when the CLI throws', async () => {
    fetchMock.mockResolvedValue([task({ id: '1', title: 'a task', priority: 'P1' })]);
    cliMock.mockRejectedValue(new CliError('rate limit'));
    const r = await runCockpit('brief', NOW);
    expect(r.operatorRead).toBeNull();
    expect(r.message).toContain('Cockpit - 2026-07-09'); // brief still emitted
    expect(r.costUsd).toBe(0);
  });

  it('skips the LLM entirely on an empty board', async () => {
    fetchMock.mockResolvedValue([]);
    const r = await runCockpit('brief', NOW);
    expect(cliMock).not.toHaveBeenCalled();
    expect(r.operatorRead).toBeNull();
    expect(r.brief.counts.open).toBe(0);
  });

  it('triage mode attaches gated proposals but still grants no tools', async () => {
    fetchMock.mockResolvedValue([task({ id: '1', title: 'untagged wavewarz' })]);
    cliMock.mockResolvedValue({ text: 'read', isError: false, totalCostUsd: 0.01, inputTokens: 1, outputTokens: 1, model: 'sonnet', durationMs: 1, numTurns: 1, sessionId: 's' });
    const r = await runCockpit('triage', NOW);
    expect(r.brief.proposedWrites.length).toBeGreaterThan(0);
    // read-only by construction: allowedTools passed to the CLI is empty
    expect(cliMock).toHaveBeenCalledWith(expect.objectContaining({ allowedTools: [] }));
  });
});
