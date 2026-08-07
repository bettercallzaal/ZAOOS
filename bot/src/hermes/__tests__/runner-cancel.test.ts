// @vitest-environment node
//
// The cancel contract of dispatchHermesRun.
//
// ZOE's DM stop reply promises "No PR will open". The runner polled
// shouldCancel() only at the TOP of the attempt loop, so a stop that arrived
// while the winning attempt was running was read too late: the attempt finished,
// the critic passed, and the run pushed a branch and opened a PR anyway - then
// narrated "Built it: PR #N" one message after telling the user it was stopping.
//
// These tests pin both directions: a cancel must not produce a PR, and no cancel
// must still produce one.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateRun = vi.hoisted(() => vi.fn());
const mockUpdateRun = vi.hoisted(() => vi.fn());
const mockGetRun = vi.hoisted(() => vi.fn());
const mockRunFixer = vi.hoisted(() => vi.fn());
const mockRunCritic = vi.hoisted(() => vi.fn());
const mockPreFlight = vi.hoisted(() => vi.fn());
const mockCommitAndPush = vi.hoisted(() => vi.fn());
const mockOpenPullRequest = vi.hoisted(() => vi.fn());
const mockRunCmd = vi.hoisted(() => vi.fn());

vi.mock('../db', () => ({
  createRun: mockCreateRun,
  updateRun: mockUpdateRun,
  getRun: mockGetRun,
}));
vi.mock('../coder', () => ({ runFixer: mockRunFixer }));
vi.mock('../critic', () => ({ runCritic: mockRunCritic }));
vi.mock('../preflight', () => ({ runPreFlightGate: mockPreFlight }));
vi.mock('../pr', () => ({ openPullRequest: mockOpenPullRequest }));
vi.mock('../pr-watcher', () => ({ watchPullRequest: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../zoe/receipts', () => ({ emitReceipt: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../git', () => ({
  makeWorkdir: vi.fn().mockResolvedValue('/tmp/hermes-test'),
  cleanupWorkdir: vi.fn().mockResolvedValue(undefined),
  cloneAndBranch: vi.fn().mockResolvedValue(undefined),
  commitAndPush: mockCommitAndPush,
  runCmd: mockRunCmd,
}));

import { dispatchHermesRun } from '../runner';

const RUN = { id: 'run-0001', status: 'pending' };

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateRun.mockResolvedValue(RUN);
  mockUpdateRun.mockResolvedValue(undefined);
  mockGetRun.mockResolvedValue(RUN);
  mockRunFixer.mockResolvedValue({
    filesChanged: ['src/foo.ts'],
    commitMessage: 'fix: foo',
    prTitle: 'fix: foo',
    prBody: 'body',
    inputTokens: 10,
    outputTokens: 20,
  });
  mockPreFlight.mockResolvedValue({ ok: true });
  // 85 clears HERMES_PASS_THRESHOLD (70), so without a cancel this run opens a PR.
  mockRunCritic.mockResolvedValue({ score: 85, feedback: 'good', inputTokens: 5, outputTokens: 5 });
  mockCommitAndPush.mockResolvedValue(undefined);
  mockOpenPullRequest.mockResolvedValue({ number: 42, url: 'https://github.com/x/y/pull/42' });
  mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
});

const INPUT = { triggered_by_telegram_id: 1, triggered_in_chat_id: 2, issue_text: 'add a /health route' };

describe('dispatchHermesRun cancellation', () => {
  it('opens the PR when nothing asked it to stop', async () => {
    const res = await dispatchHermesRun(INPUT);
    expect(res.kind).toBe('ready');
    expect(mockOpenPullRequest).toHaveBeenCalledTimes(1);
  });

  it('does not spend an attempt when the cancel is already set', async () => {
    const res = await dispatchHermesRun({ ...INPUT, shouldCancel: () => true });
    expect(res.kind).toBe('failed');
    expect(mockRunFixer).not.toHaveBeenCalled();
    expect(mockOpenPullRequest).not.toHaveBeenCalled();
  });

  // The regression this file exists for: the stop lands mid-attempt, the attempt
  // still passes the critic, and the run must NOT push or open a PR.
  it('does not open a PR when the cancel arrives while the passing attempt runs', async () => {
    let cancelled = false;
    mockRunCritic.mockImplementation(async () => {
      cancelled = true; // "stop" arrives after the coder, before the PR
      return { score: 85, feedback: 'good', inputTokens: 5, outputTokens: 5 };
    });
    const onFailed = vi.fn().mockResolvedValue(undefined);
    const onPrOpened = vi.fn().mockResolvedValue(undefined);

    const res = await dispatchHermesRun({ ...INPUT, shouldCancel: () => cancelled }, { onFailed, onPrOpened });

    expect(mockCommitAndPush).not.toHaveBeenCalled();
    expect(mockOpenPullRequest).not.toHaveBeenCalled();
    expect(onPrOpened).not.toHaveBeenCalled();
    expect(res.kind).toBe('failed');
    expect((res as { reason: string }).reason).toBe('cancelled by request');
    expect(onFailed).toHaveBeenCalledWith('run-0001', 'cancelled by request');
  });

  // The tokens were already spent on the attempt that got cancelled - the run
  // row has to say so, or the spend disappears from the ledger.
  it('records the tokens spent by the cancelled attempt', async () => {
    let cancelled = false;
    mockRunCritic.mockImplementation(async () => {
      cancelled = true;
      return { score: 85, feedback: 'good', inputTokens: 5, outputTokens: 5 };
    });

    await dispatchHermesRun({ ...INPUT, shouldCancel: () => cancelled });

    expect(mockUpdateRun).toHaveBeenCalledWith(
      'run-0001',
      expect.objectContaining({
        status: 'failed',
        error_message: 'cancelled by request',
        total_input_tokens: 15,
        total_output_tokens: 25,
      }),
    );
  });
});
