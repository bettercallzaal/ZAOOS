// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd }));

import { runPreFlightGate } from '../preflight';

type CmdResult = { stdout: string; stderr: string; exitCode: number };
const OK: CmdResult = { stdout: '', stderr: '', exitCode: 0 };
const FAIL: CmdResult = { stdout: 'error details', stderr: '', exitCode: 1 };

afterEach(() => vi.clearAllMocks());

// ── forbidden paths ───────────────────────────────────────────────────────────

describe('forbidden paths', () => {
  it('rejects an exact forbidden path (.env)', async () => {
    const r = await runPreFlightGate({ workTreePath: '/tmp/wt', filesChanged: ['.env'] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('.env');
    expect(r.checks.forbiddenPaths).toBe('fail');
    expect(mockRunCmd).not.toHaveBeenCalled();
  });

  it('rejects a file inside a forbidden directory (bot/src/hermes/)', async () => {
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/hermes/runner.ts'],
    });
    expect(r.ok).toBe(false);
    expect(r.checks.forbiddenPaths).toBe('fail');
    expect(r.error).toContain('bot/src/hermes/runner.ts');
  });

  it('allows a non-forbidden bot file through', async () => {
    mockRunCmd.mockResolvedValue(OK);
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/memory.ts'],
    });
    expect(r.checks.forbiddenPaths).toBe('pass');
  });
});

// ── docs-only scope ───────────────────────────────────────────────────────────

describe('docs-only scope', () => {
  it('skips all checks and returns ok for research/*.md files', async () => {
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['research/doc.md', 'docs/notes.md'],
    });
    expect(r.ok).toBe(true);
    expect(r.scope).toBe('docs-only');
    expect(r.checks.typecheck).toBe('skipped');
    expect(r.checks.boot).toBe('skipped');
    expect(r.checks.tests).toBe('skipped');
    expect(mockRunCmd).not.toHaveBeenCalled();
  });
});

// ── bot-only scope ────────────────────────────────────────────────────────────

describe('bot-only scope', () => {
  it('fails when bot typecheck fails', async () => {
    mockRunCmd.mockResolvedValueOnce(FAIL);
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/memory.ts'],
    });
    expect(r.ok).toBe(false);
    expect(r.scope).toBe('bot-only');
    expect(r.checks.typecheck).toBe('fail');
    expect(r.error).toContain('Bot typecheck failed');
    expect(mockRunCmd).toHaveBeenCalledTimes(1);
  });

  it('fails when boot verification fails after typecheck passes', async () => {
    mockRunCmd
      .mockResolvedValueOnce(OK)   // typecheck
      .mockResolvedValueOnce(FAIL); // boot (esbuild)
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/memory.ts'],
    });
    expect(r.ok).toBe(false);
    expect(r.checks.typecheck).toBe('skipped'); // code sets typecheck='pass' only at end
    expect(r.checks.boot).toBe('fail');
    expect(r.error).toContain('boot-verify');
  });

  it('returns ok when typecheck and boot pass (no test files touched)', async () => {
    mockRunCmd
      .mockResolvedValueOnce(OK) // typecheck
      .mockResolvedValueOnce(OK); // boot
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/memory.ts'],
    });
    expect(r.ok).toBe(true);
    expect(r.checks.boot).toBe('pass');
    expect(r.checks.tests).toBe('skipped');
    expect(mockRunCmd).toHaveBeenCalledTimes(2);
  });

  it('runs vitest when a .test.ts file is touched and fails on test failure', async () => {
    mockRunCmd
      .mockResolvedValueOnce(OK)   // typecheck
      .mockResolvedValueOnce(OK)   // boot
      .mockResolvedValueOnce(FAIL); // tests
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/__tests__/foo.test.ts'],
    });
    expect(r.ok).toBe(false);
    expect(r.checks.tests).toBe('fail');
    expect(r.error).toContain('Tests failed');
  });

  it('returns ok when typecheck, boot, and tests all pass', async () => {
    mockRunCmd
      .mockResolvedValueOnce(OK)
      .mockResolvedValueOnce(OK)
      .mockResolvedValueOnce(OK);
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/zoe/__tests__/foo.test.ts'],
    });
    expect(r.ok).toBe(true);
    expect(r.checks.tests).toBe('pass');
  });
});

// ── scope detection ────────────────────────────────────────────────────────────

describe('scope detection', () => {
  it('detects app-only scope for src/ files', async () => {
    mockRunCmd.mockResolvedValue(OK);
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['src/lib/foo.ts'],
    });
    expect(r.scope).toBe('app-only');
    // app-only: only one typecheck call (no boot)
    expect(mockRunCmd).toHaveBeenCalledTimes(1);
  });

  it('detects mixed scope for bot + app files and runs all three checks', async () => {
    mockRunCmd.mockResolvedValue(OK);
    const r = await runPreFlightGate({
      workTreePath: '/tmp/wt',
      filesChanged: ['bot/src/foo.ts', 'src/lib/bar.ts'],
    });
    expect(r.scope).toBe('mixed');
    // mixed: bot-typecheck + bot-boot + app-typecheck = 3 calls
    expect(mockRunCmd).toHaveBeenCalledTimes(3);
    expect(r.ok).toBe(true);
  });
});
