// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
const mockVerify = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd, verifyRemoteBranch: mockVerify }));

import { openPullRequest } from '../pr';

const ok = (stdout = '') => ({ stdout, stderr: '', exitCode: 0 });
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.ZOE_FIX_PR_LABEL;
});

// Zaal, 2026-10-07: ZOE's overnight fixes go through the same review and merge
// path as every other PR. The label is how the estate's reviewer finds them.
describe('ZOE_FIX_PR_LABEL - label the fix PR for review', () => {
  it('flag set: adds the label after the PR is created', async () => {
    process.env.ZOE_FIX_PR_LABEL = 'zoe-fix';
    mockRunCmd.mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok('https://github.com/o/r/pull/42\n')).mockResolvedValueOnce(ok());
    const r = await openPullRequest({ workdir: '/w', branchName: 'fix/x', title: 'T', body: 'B' });
    expect(r).toMatchObject({ number: 42, labelled: true });
    expect(mockRunCmd.mock.calls[2]).toEqual(['gh', ['pr', 'edit', '42', '--add-label', 'zoe-fix'], '/w']);
  });

  it('a label that fails to apply does not lose the PR', async () => {
    process.env.ZOE_FIX_PR_LABEL = 'zoe-fix';
    mockRunCmd
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok('https://github.com/o/r/pull/7\n'))
      .mockResolvedValueOnce({ stdout: '', stderr: "could not add label: 'zoe-fix' not found", exitCode: 1 });
    const r = await openPullRequest({ workdir: '/w', branchName: 'fix/x', title: 'T', body: 'B' });
    expect(r).toMatchObject({ number: 7, labelled: false });
  });

  it('a label with shell or flag characters is refused, not passed to gh', async () => {
    process.env.ZOE_FIX_PR_LABEL = '--repo evil/x';
    mockRunCmd.mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok('https://github.com/o/r/pull/9\n'));
    const r = await openPullRequest({ workdir: '/w', branchName: 'fix/x', title: 'T', body: 'B' });
    expect(mockRunCmd).toHaveBeenCalledTimes(2);
    expect(r.labelled).toBe(false);
  });

  it('flag unset: exactly two commands, push and create, as before', async () => {
    mockRunCmd.mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok('https://github.com/o/r/pull/5\n'));
    const r = await openPullRequest({ workdir: '/w', branchName: 'fix/x', title: 'T', body: 'B' });
    expect(mockRunCmd).toHaveBeenCalledTimes(2);
    expect(r.labelled).toBe(false);
  });
});

// The overnight loop may open PRs. It may never merge one, deploy, restart the
// bot, or set a flag. This reads the pipeline's own source for those calls, so
// a future edit that adds one fails here rather than in production.
const FORBIDDEN: Array<[string, RegExp]> = [
  ['gh pr merge', /['"]pr['"]\s*,\s*['"]merge['"]|gh pr merge/],
  ['auto-merge', /--auto\b|enablePullRequestAutoMerge/],
  ['restart or deploy', /systemctl|zoe-autodeploy|--restart\b/],
  ['writes an env file', /writeFile[^)]*\.env\b|appendFile[^)]*\.env\b/],
];
export function forbiddenCalls(src: string): string[] {
  return FORBIDDEN.filter(([, re]) => re.test(src)).map(([name]) => name);
}

describe('the fix pipeline never merges, deploys or flips a flag', () => {
  it('the guard catches each forbidden shape (red control)', () => {
    expect(forbiddenCalls("await runCmd('gh', ['pr', 'merge', '42', '--squash'])")).toEqual(['gh pr merge']);
    expect(forbiddenCalls("runCmd('gh', ['pr', 'merge', n, '--auto'])")).toContain('auto-merge');
    expect(forbiddenCalls("runCmd('systemctl', ['--user', 'restart', 'zoe-bot'])")).toEqual(['restart or deploy']);
    expect(forbiddenCalls("await fs.appendFile(home + '/bot/.env', 'ZOE_X=1')")).toEqual(['writes an env file']);
    expect(forbiddenCalls("runCmd('gh', ['pr', 'create', '--base', 'main'])")).toEqual([]);
  });

  it('none of hermes/*.ts, repo-improver.ts or error-remediation.ts contains one', () => {
    const hermes = join(__dirname, '..');
    const files = readdirSync(hermes).filter((f) => f.endsWith('.ts')).map((f) => join(hermes, f));
    files.push(join(hermes, '..', 'zoe', 'repo-improver.ts'), join(hermes, '..', 'zoe', 'error-remediation.ts'));
    expect(files.length).toBeGreaterThan(5);
    const hits = files.map((f) => [f, forbiddenCalls(readFileSync(f, 'utf8'))] as const).filter(([, h]) => h.length);
    expect(hits).toEqual([]);
  });
});
