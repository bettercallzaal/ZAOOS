// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: mockSpawn }));

const mockMkdir = vi.hoisted(() => vi.fn());
const mockRm = vi.hoisted(() => vi.fn());
const mockAccess = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({
  promises: { mkdir: mockMkdir, rm: mockRm, access: mockAccess, writeFile: mockWriteFile },
}));

import {
  cleanupWorkdir,
  commitAndPush,
  assertRemoteBranchPresent,
  diffAgainstMain,
  getRepoProfile,
  listChangedFiles,
  makeWorkdir,
} from '../git';

afterEach(() => vi.clearAllMocks());

// ── spawn helper ──────────────────────────────────────────────────────────────

function makeSpawnResult(stdout: string, stderr: string, exitCode: number) {
  return {
    stdout: {
      on: vi.fn((ev: string, cb: (d: Buffer) => void) => {
        if (ev === 'data') process.nextTick(() => cb(Buffer.from(stdout)));
      }),
    },
    stderr: {
      on: vi.fn((ev: string, cb: (d: Buffer) => void) => {
        if (ev === 'data' && stderr) process.nextTick(() => cb(Buffer.from(stderr)));
      }),
    },
    on: vi.fn((ev: string, cb: (code: number) => void) => {
      if (ev === 'close') setTimeout(() => cb(exitCode), 10);
      // 'error' handler registered but never fired
    }),
  };
}

const OK_SPAWN = () => makeSpawnResult('', '', 0);
const FAIL_SPAWN = (stderr = 'error') => makeSpawnResult('', stderr, 1);

// ── getRepoProfile ────────────────────────────────────────────────────────────

describe('getRepoProfile', () => {
  it('returns zaoos profile with correct default branch', () => {
    const p = getRepoProfile('zaoos');
    expect(p.target).toBe('zaoos');
    expect(p.defaultBranch).toBe('main');
    expect(p.url).toContain('ZAOOS');
    expect(p.installSubdirs).toContain('bot');
  });

  it('returns zaostock profile with no installSubdirs', () => {
    const p = getRepoProfile('zaostock');
    expect(p.target).toBe('zaostock');
    expect(p.url).toContain('zaostock');
    expect(p.installSubdirs).toHaveLength(0);
  });
});

// ── makeWorkdir ───────────────────────────────────────────────────────────────

describe('makeWorkdir', () => {
  it('creates a directory containing the runId and returns its path', async () => {
    mockMkdir.mockResolvedValue(undefined);
    const path = await makeWorkdir('run-123-abc');
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('run-123-abc'), { recursive: true });
    expect(path).toContain('run-123-abc');
  });
});

// ── cleanupWorkdir ────────────────────────────────────────────────────────────

describe('cleanupWorkdir', () => {
  it('removes the directory with recursive+force', async () => {
    mockRm.mockResolvedValue(undefined);
    await cleanupWorkdir('/tmp/hermes-run-123');
    expect(mockRm).toHaveBeenCalledWith('/tmp/hermes-run-123', { recursive: true, force: true });
  });

  it('swallows errors without throwing', async () => {
    mockRm.mockRejectedValue(new Error('permission denied'));
    await expect(cleanupWorkdir('/tmp/hermes-run-123')).resolves.toBeUndefined();
  });
});

// ── listChangedFiles ──────────────────────────────────────────────────────────

describe('listChangedFiles', () => {
  it('parses changed filenames from git diff output', async () => {
    mockSpawn.mockReturnValue(makeSpawnResult('src/foo.ts\nbot/src/bar.ts\n', '', 0));
    const files = await listChangedFiles('/tmp/wt');
    expect(files).toEqual(['src/foo.ts', 'bot/src/bar.ts']);
  });

  it('returns [] when git diff exits non-zero', async () => {
    mockSpawn.mockReturnValue(makeSpawnResult('', 'not a git repo', 1));
    const files = await listChangedFiles('/tmp/wt');
    expect(files).toEqual([]);
  });

  it('filters empty lines from diff output', async () => {
    mockSpawn.mockReturnValue(makeSpawnResult('src/a.ts\n\n  \nsrc/b.ts\n', '', 0));
    const files = await listChangedFiles('/tmp/wt');
    expect(files).toEqual(['src/a.ts', 'src/b.ts']);
  });
});

// ── diffAgainstMain ───────────────────────────────────────────────────────────

describe('diffAgainstMain', () => {
  it('returns git diff stat output', async () => {
    const statOutput = 'src/foo.ts | 5 ++---\n1 file changed';
    mockSpawn.mockReturnValue(makeSpawnResult(statOutput, '', 0));
    const result = await diffAgainstMain('/tmp/wt');
    expect(result).toBe(statOutput);
  });
});

// ── commitAndPush ─────────────────────────────────────────────────────────────

describe('commitAndPush', () => {
  beforeEach(() => {
    // commitAndPush makes 9 sequential git calls: config name, config email,
    // add -A, commit, fetch origin/main, rebase, push, then the post-push
    // assertion (rev-parse HEAD + ls-remote to confirm the ref landed on origin).
    mockSpawn
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git config user.name
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git config user.email
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git add -A
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git commit
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git fetch origin main
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git rebase origin/main
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // git push
      .mockReturnValueOnce(makeSpawnResult('deadbeefsha\n', '', 0)) // git rev-parse HEAD
      .mockReturnValueOnce(makeSpawnResult('deadbeefsha\trefs/heads/fix/branch-name\n', '', 0)); // git ls-remote (post-push verify)
  });

  it('resolves successfully when all git commands succeed', async () => {
    await expect(
      commitAndPush('/tmp/wt', 'fix/branch-name', 'fix: update foo'),
    ).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledTimes(9);
  });

  it('throws when the pushed branch is NOT on origin (silent push failure)', async () => {
    // Push reports success (exit 0) but ls-remote shows the ref never landed -
    // the exact silent failure the post-push assertion exists to catch.
    mockSpawn.mockReset();
    mockSpawn
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config name
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config email
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // add
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // commit
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // fetch
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // rebase
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // push (lies - exit 0)
      .mockReturnValueOnce(makeSpawnResult('deadbeefsha\n', '', 0)) // rev-parse HEAD
      .mockReturnValueOnce(makeSpawnResult('', '', 0)); // ls-remote returns EMPTY
    await expect(commitAndPush('/tmp/wt', 'fix/branch-name', 'msg')).rejects.toThrow(
      'is not on origin',
    );
  });

  it('throws when git config user.name fails', async () => {
    mockSpawn.mockReset();
    mockSpawn.mockReturnValue(makeSpawnResult('', 'permission denied', 1));
    await expect(commitAndPush('/tmp/wt', 'fix/branch', 'msg')).rejects.toThrow('git config user.name failed');
  });

  it('throws when git commit fails', async () => {
    mockSpawn.mockReset();
    mockSpawn
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config name ok
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config email ok
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // add ok
      .mockReturnValueOnce(makeSpawnResult('', 'nothing to commit', 1)); // commit fail
    await expect(commitAndPush('/tmp/wt', 'fix/branch', 'msg')).rejects.toThrow('git commit failed');
  });

  it('aborts rebase and throws on rebase conflict', async () => {
    mockSpawn.mockReset();
    mockSpawn
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config name
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // config email
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // add
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // commit
      .mockReturnValueOnce(makeSpawnResult('', '', 0)) // fetch
      .mockReturnValueOnce(makeSpawnResult('', 'CONFLICT', 1)) // rebase fail
      .mockReturnValueOnce(makeSpawnResult('', '', 0)); // rebase --abort
    await expect(commitAndPush('/tmp/wt', 'fix/branch', 'msg')).rejects.toThrow('git rebase origin/main failed');
  });
});

// ── assertRemoteBranchPresent (post-push verify, pure) ─────────────────────────

describe('assertRemoteBranchPresent', () => {
  const SHA = '9f0a4616deadbeef';
  const lsOut = `${SHA}\trefs/heads/fix/my-branch`;

  it('returns the remote sha when the branch is present', () => {
    expect(assertRemoteBranchPresent(lsOut, 'fix/my-branch')).toBe(SHA);
  });

  it('passes when the remote sha matches the expected sha', () => {
    expect(assertRemoteBranchPresent(lsOut, 'fix/my-branch', SHA)).toBe(SHA);
  });

  it('throws when the branch is absent (empty ls-remote)', () => {
    expect(() => assertRemoteBranchPresent('', 'fix/my-branch')).toThrow('is not on origin');
  });

  it('throws when a DIFFERENT branch is present but not ours', () => {
    const other = `${SHA}\trefs/heads/fix/other-branch`;
    expect(() => assertRemoteBranchPresent(other, 'fix/my-branch')).toThrow('is not on origin');
  });

  it('does not false-match on a branch that is a suffix substring of another', () => {
    // "feat/a" must NOT match the line for "hotfix/feat/a" - endsWith on the full
    // refs/heads/<branch> guards against the substring false-positive.
    const tricky = `${SHA}\trefs/heads/hotfix/feat/a`;
    expect(() => assertRemoteBranchPresent(tricky, 'feat/a')).toThrow('is not on origin');
  });

  it('throws when the remote tip diverged from the commit we pushed', () => {
    expect(() => assertRemoteBranchPresent(lsOut, 'fix/my-branch', 'differentsha00')).toThrow(
      'does not match local HEAD',
    );
  });
});
