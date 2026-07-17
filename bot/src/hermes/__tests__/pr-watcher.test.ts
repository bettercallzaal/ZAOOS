// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd }));

import { watchPullRequest } from '../pr-watcher';

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

// ── helpers ───────────────────────────────────────────────────────────────────

function ghOutput(mergeable: string, checks: Array<{ name: string; conclusion: string; detailsUrl: string }> = []) {
  return {
    stdout: JSON.stringify({ mergeable, mergeStateStatus: 'CLEAN', statusCheckRollup: checks }),
    stderr: '',
    exitCode: 0,
  };
}

// pollIntervalMs=100, maxPollMinutes=0.002 → maxIterations = ceil(0.002*60000/100) = ceil(1.2) = 2
const TWO_ITER = { pollIntervalMs: 100, maxPollMinutes: 0.002 };
// maxPollMinutes=0.001 → ceil(0.001*60000/100) = ceil(0.6) = 1
const ONE_ITER = { pollIntervalMs: 100, maxPollMinutes: 0.001 };

// ── basic polling ─────────────────────────────────────────────────────────────

describe('watchPullRequest polling', () => {
  it('exits early when PR is MERGEABLE with no failing checks after i>=1', async () => {
    vi.useFakeTimers();
    // Need MERGEABLE + i >= 1 → requires 2 poll iterations (i=0 skipped, i=1 exits)
    mockRunCmd.mockResolvedValue(ghOutput('MERGEABLE'));
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...TWO_ITER });
    await vi.advanceTimersByTimeAsync(200); // two 100ms sleeps
    await p;
    expect(mockRunCmd).toHaveBeenCalledTimes(2);
  });

  it('runs through all iterations when PR stays in UNKNOWN state', async () => {
    vi.useFakeTimers();
    mockRunCmd.mockResolvedValue(ghOutput('UNKNOWN'));
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...TWO_ITER });
    await vi.advanceTimersByTimeAsync(200);
    await p;
    // 2 iterations → 2 gh pr view calls
    expect(mockRunCmd).toHaveBeenCalledTimes(2);
  });

  it('skips the status and continues when gh pr view fails', async () => {
    vi.useFakeTimers();
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'not found', exitCode: 1 });
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...ONE_ITER });
    await vi.advanceTimersByTimeAsync(100);
    await p;
    // Should not throw — returns null, loop continues to end
  });

  it('returns null and continues when gh output is not valid JSON', async () => {
    vi.useFakeTimers();
    mockRunCmd.mockResolvedValue({ stdout: 'not-json', stderr: '', exitCode: 0 });
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...ONE_ITER });
    await vi.advanceTimersByTimeAsync(100);
    await p; // should resolve without throwing
  });
});

// ── conflict alerts ───────────────────────────────────────────────────────────

describe('conflict detection', () => {
  it('calls narrator.onCriticDone when merge conflict detected', async () => {
    vi.useFakeTimers();
    mockRunCmd.mockResolvedValue(ghOutput('CONFLICTING'));
    const narrator = { onCriticDone: vi.fn().mockResolvedValue(undefined) };
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...ONE_ITER, narrator: narrator as any });
    await vi.advanceTimersByTimeAsync(100);
    await p;
    expect(narrator.onCriticDone).toHaveBeenCalledWith('r1', 0, expect.stringContaining('merge conflicts'));
  });

  it('deduplicates conflict alerts across multiple poll cycles', async () => {
    vi.useFakeTimers();
    mockRunCmd.mockResolvedValue(ghOutput('CONFLICTING'));
    const narrator = { onCriticDone: vi.fn().mockResolvedValue(undefined) };
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...TWO_ITER, narrator: narrator as any });
    await vi.advanceTimersByTimeAsync(200);
    await p;
    // 2 polls, same conflict → narrator called only once
    expect(narrator.onCriticDone).toHaveBeenCalledTimes(1);
  });
});

// ── CI failure alerts ─────────────────────────────────────────────────────────

describe('CI failure detection', () => {
  it('reports failing checks via narrator', async () => {
    vi.useFakeTimers();
    const checks = [{ name: 'lint', conclusion: 'FAILURE', detailsUrl: 'https://ci.example.com/1' }];
    mockRunCmd.mockResolvedValue(ghOutput('MERGEABLE', checks));
    const narrator = { onCriticDone: vi.fn().mockResolvedValue(undefined) };
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...ONE_ITER, narrator: narrator as any });
    await vi.advanceTimersByTimeAsync(100);
    await p;
    expect(narrator.onCriticDone).toHaveBeenCalledWith('r1', 0, expect.stringContaining('lint'));
  });

  it('deduplicates CI failure alerts across polls', async () => {
    vi.useFakeTimers();
    const checks = [{ name: 'tests', conclusion: 'FAILURE', detailsUrl: 'https://ci.example.com/2' }];
    mockRunCmd.mockResolvedValue(ghOutput('UNKNOWN', checks));
    const narrator = { onCriticDone: vi.fn().mockResolvedValue(undefined) };
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...TWO_ITER, narrator: narrator as any });
    await vi.advanceTimersByTimeAsync(200);
    await p;
    expect(narrator.onCriticDone).toHaveBeenCalledTimes(1); // deduped across 2 polls
  });

  it('works without a narrator (no-op)', async () => {
    vi.useFakeTimers();
    const checks = [{ name: 'lint', conclusion: 'TIMED_OUT', detailsUrl: '' }];
    mockRunCmd.mockResolvedValue(ghOutput('MERGEABLE', checks));
    // No narrator passed — should not throw
    const p = watchPullRequest({ prNumber: 42, runId: 'r1', branchName: 'fix/foo', ...ONE_ITER });
    await vi.advanceTimersByTimeAsync(100);
    await p;
  });
});
