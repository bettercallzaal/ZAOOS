// @vitest-environment node
//
// The write-set contract of dispatchHermesRun (write-set.ts, doc 2652).
// A coder change outside the declared write-set must never be pushed, a new
// untracked file counts, and with no write-set the run behaves as before.
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

/** The work tree git reports: tracked diff and untracked files. */
function tree(tracked: string[], untracked: string[] = []) {
  mockRunCmd.mockImplementation(async (_cmd: string, args: string[]) => {
    if (args[0] === 'diff') return { stdout: tracked.join('\n'), stderr: '', exitCode: 0 };
    if (args[0] === 'ls-files') return { stdout: untracked.join('\n'), stderr: '', exitCode: 0 };
    return { stdout: '', stderr: '', exitCode: 0 };
  });
}

describe('dispatchHermesRun write-set', () => {
  it('opens the PR when every change is inside the write-set, and tells the coder the bounds', async () => {
    tree(['src/foo.ts']);
    const res = await dispatchHermesRun({ ...INPUT, writeSet: ['src/foo.ts'] });
    expect(res.kind).toBe('ready');
    expect(mockCommitAndPush).toHaveBeenCalledTimes(1);
    expect(mockRunFixer.mock.calls[0][0].issueText).toContain('WRITE-SET (enforced)');
    expect(mockRunFixer.mock.calls[0][0].issueText).toContain('- src/foo.ts');
  });

  it('never pushes a tracked change outside the write-set', async () => {
    tree(['src/foo.ts', 'bot/src/hermes/runner.ts']);
    const onRetry = vi.fn().mockResolvedValue(undefined);
    const res = await dispatchHermesRun({ ...INPUT, writeSet: ['src/foo.ts'] }, { onRetry });
    expect(mockCommitAndPush).not.toHaveBeenCalled();
    expect(mockOpenPullRequest).not.toHaveBeenCalled();
    expect(mockRunCritic).not.toHaveBeenCalled();
    expect(res.kind).toBe('escalated');
    expect(onRetry.mock.calls[0][2]).toContain('bot/src/hermes/runner.ts');
  });

  it('counts an untracked new file outside the write-set', async () => {
    tree(['src/foo.ts'], ['scripts/new-tool.sh']);
    const res = await dispatchHermesRun({ ...INPUT, writeSet: ['src/foo.ts'] });
    expect(mockCommitAndPush).not.toHaveBeenCalled();
    expect(res.kind).toBe('escalated');
  });

  it('blocks the push when an out-of-set file appears after the coder check', async () => {
    let calls = 0;
    mockRunCmd.mockImplementation(async (_cmd: string, args: string[]) => {
      if (args[0] === 'diff') {
        calls += 1;
        return { stdout: calls === 1 ? 'src/foo.ts' : 'src/foo.ts\npackage.json', stderr: '', exitCode: 0 };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    });
    await dispatchHermesRun({ ...INPUT, writeSet: ['src/foo.ts'] });
    expect(mockCommitAndPush).not.toHaveBeenCalled();
  });

  it('fails the run before cloning on an invalid write-set', async () => {
    const res = await dispatchHermesRun({ ...INPUT, writeSet: [] });
    expect(res.kind).toBe('failed');
    expect((res as { reason: string }).reason).toContain('write-set is empty');
    expect(mockRunFixer).not.toHaveBeenCalled();
  });

  it('fails closed when git cannot list the tree', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'boom', exitCode: 1 });
    const res = await dispatchHermesRun({ ...INPUT, writeSet: ['src/foo.ts'] });
    expect(res.kind).toBe('failed');
    expect(mockCommitAndPush).not.toHaveBeenCalled();
  });

  it('with no write-set, opens the PR exactly as before and adds nothing to the coder brief', async () => {
    tree(['anything/at/all.ts']);
    const res = await dispatchHermesRun(INPUT);
    expect(res.kind).toBe('ready');
    expect(mockRunFixer.mock.calls[0][0].issueText).toBe('add a /health route');
  });
});
