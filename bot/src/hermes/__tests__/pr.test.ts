// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
// verifyRemoteBranch is the post-push assertion; default it to a no-op success.
// It is NOT a runCmd, so the mockRunCmd call ordering below (push=#1, gh=#2) is
// unchanged by its presence.
const mockVerify = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd, verifyRemoteBranch: mockVerify }));

import { openPullRequest } from '../pr';

afterEach(() => vi.clearAllMocks());

type CmdResult = { stdout: string; stderr: string; exitCode: number };
const ok = (stdout = ''): CmdResult => ({ stdout, stderr: '', exitCode: 0 });
const fail = (stderr = 'error'): CmdResult => ({ stdout: '', stderr, exitCode: 1 });

// openPullRequest: push (runCmd #1) then gh pr create (runCmd #2)

describe('openPullRequest', () => {
  it('returns PR number and URL on success', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())                                                           // git push
      .mockResolvedValueOnce(ok('https://github.com/org/repo/pull/42\n'));                    // gh pr create
    const r = await openPullRequest({ workdir: '/tmp/wt', branchName: 'fix/foo', title: 'T', body: 'B' });
    expect(r.number).toBe(42);
    expect(r.url).toBe('https://github.com/org/repo/pull/42');
  });

  it('uses main as the default base branch', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok('https://github.com/org/repo/pull/10\n'));
    await openPullRequest({ workdir: '/tmp/wt', branchName: 'fix/foo', title: 'T', body: 'B' });
    const ghArgs: string[] = mockRunCmd.mock.calls[1][1];
    const baseIdx = ghArgs.indexOf('--base');
    expect(ghArgs[baseIdx + 1]).toBe('main');
  });

  it('passes a custom base branch through to gh', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok('https://github.com/org/repo/pull/11\n'));
    await openPullRequest({ workdir: '/tmp/wt', branchName: 'fix/foo', title: 'T', body: 'B', base: 'develop' });
    const ghArgs: string[] = mockRunCmd.mock.calls[1][1];
    const baseIdx = ghArgs.indexOf('--base');
    expect(ghArgs[baseIdx + 1]).toBe('develop');
  });

  it('throws with stderr excerpt when gh pr create exits non-zero', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(fail('a pull request for branch "fix/foo" already exists'));
    await expect(
      openPullRequest({ workdir: '/tmp/wt', branchName: 'fix/foo', title: 'T', body: 'B' }),
    ).rejects.toThrow('gh pr create failed');
  });

  it('throws when gh output has no parseable PR number', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok('Pull request created successfully.\n')); // no /pull/N in URL
    await expect(
      openPullRequest({ workdir: '/tmp/wt', branchName: 'fix/foo', title: 'T', body: 'B' }),
    ).rejects.toThrow('no PR number parsed');
  });

  it('passes --head <branchName> to gh so auto-detection is bypassed', async () => {
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok('https://github.com/org/repo/pull/77\n'));
    await openPullRequest({ workdir: '/tmp/wt', branchName: 'my-branch', title: 'T', body: 'B' });
    const ghArgs: string[] = mockRunCmd.mock.calls[1][1];
    const headIdx = ghArgs.indexOf('--head');
    expect(ghArgs[headIdx + 1]).toBe('my-branch');
  });
});
