// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  existsSync: vi.fn(() => true),
  readFile: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawn: mocks.spawn }));
vi.mock('node:fs', () => ({ existsSync: mocks.existsSync }));
vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn(async () => '/tmp/zoe-codex-test'),
  readFile: mocks.readFile,
  rm: vi.fn(async () => undefined),
}));

import { CodexUnavailableError, callCodexCli, detectCodexUnavailable } from '../codex-cli';

afterEach(() => vi.clearAllMocks());

/** Minimal ChildProcess double: streams the given stdout/stderr then closes. */
function makeSpawn(stdout: string, stderr: string, exitCode: number | null) {
  return {
    stdout: {
      on: vi.fn((ev: string, cb: (b: Buffer) => void) => {
        if (ev === 'data' && stdout) process.nextTick(() => cb(Buffer.from(stdout)));
      }),
    },
    stderr: {
      on: vi.fn((ev: string, cb: (b: Buffer) => void) => {
        if (ev === 'data' && stderr) process.nextTick(() => cb(Buffer.from(stderr)));
      }),
    },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn((ev: string, cb: (code: number | null) => void) => {
      if (ev === 'close') setTimeout(() => cb(exitCode), 10);
    }),
    kill: vi.fn(),
  };
}

const OPTS = { system: 'sys', user: 'usr', cwd: '/tmp/repo' };

describe('detectCodexUnavailable', () => {
  it('treats a clean run as success even when the critique text matches a cap marker', () => {
    // A research-critic answer legitimately contains "insufficient" / "429".
    const critique = '{"score":40,"summary":"insufficient sources; quota of 429 words","issues":[]}';
    expect(
      detectCodexUnavailable({ code: 0, finalMessage: critique, combined: critique }),
    ).toBeNull();
  });

  it('flags a genuine cap: non-zero exit, no final message', () => {
    expect(
      detectCodexUnavailable({
        code: 1,
        finalMessage: '',
        combined: 'You have hit your usage limit. Try again later.',
      }),
    ).toMatch(/usage limit/i);
  });

  it('flags a cap that exits 0 but writes no final message', () => {
    expect(
      detectCodexUnavailable({ code: 0, finalMessage: '   ', combined: 'not logged in' }),
    ).toMatch(/not logged in/i);
  });

  it('returns null for a failed run with no cap marker (caller handles empty output)', () => {
    expect(detectCodexUnavailable({ code: 2, finalMessage: '', combined: 'boom' })).toBeNull();
  });
});

describe('callCodexCli', () => {
  it('returns the critique when the transcript happens to contain cap words', async () => {
    // Regression: the cap scan used to run over stdout (which carries the
    // agent's own answer), so a valid critique saying "insufficient" was
    // rejected as a usage cap and the review silently degraded to same-family.
    const critique = '{"score":45,"summary":"insufficient sources","issues":[]}';
    mocks.readFile.mockResolvedValue(critique);
    mocks.spawn.mockReturnValue(makeSpawn(critique, '', 0));

    const result = await callCodexCli(OPTS);
    expect(result.text).toBe(critique);
    expect(result.model).toBe('codex');
    expect(result.totalCostUsd).toBe(0);
  });

  it('throws CodexUnavailableError when codex is actually usage-capped', async () => {
    mocks.readFile.mockRejectedValue(new Error('ENOENT'));
    mocks.spawn.mockReturnValue(makeSpawn('', 'error: you have hit your usage limit', 1));

    await expect(callCodexCli(OPTS)).rejects.toBeInstanceOf(CodexUnavailableError);
  });

  it('throws CodexUnavailableError when the binary is missing', async () => {
    mocks.existsSync.mockReturnValueOnce(false);
    await expect(callCodexCli(OPTS)).rejects.toBeInstanceOf(CodexUnavailableError);
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
});
