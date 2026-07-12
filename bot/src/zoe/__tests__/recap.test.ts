import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock('../../hermes/claude-cli', () => ({
  callClaudeCli: mocks.callClaudeCli,
}));

vi.mock('node:child_process', () => ({
  execSync: mocks.execSync,
}));

import { generateNightlyRecap } from '../recap';

const mockCallClaudeCli = mocks.callClaudeCli;
const mockExecSync = mocks.execSync;

describe('generateNightlyRecap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default state
    mockExecSync.mockReset();
    mockCallClaudeCli.mockReset();
    // Default mock: nothing shipped
    mockExecSync.mockReturnValue('');
  });

  it('returns null when nothing shipped (empty context)', async () => {
    // execSync returns empty for all commands (no PRs, commits, or docs)
    mockExecSync.mockReturnValue('');

    const result = await generateNightlyRecap({ repoDir: '/tmp/test' });
    expect(result).toBeNull();
    expect(mockCallClaudeCli).not.toHaveBeenCalled();
  });

  it('returns formatted recap when PRs merged', async () => {
    // Mock gh pr list to return PRs
    mockExecSync.mockImplementation((cmd: unknown) => {
      const cmdStr = String(cmd || '');
      if (cmdStr.includes('gh pr list')) {
        return JSON.stringify([
          { number: 123, title: 'feat(zoe): nightly recap' },
          { number: 124, title: 'fix: typo' },
        ]);
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n- #123 feat(zoe): nightly recap\n- #124 fix: typo\n\nCOMMITS\n(none)\n\nRESEARCH DOCS\n(none)',
      inputTokens: 100,
      outputTokens: 80,
      totalCostUsd: 0.02,
      model: 'sonnet',
      durationMs: 2000,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    const result = await generateNightlyRecap({ repoDir: '/tmp/test' });
    expect(result).not.toBeNull();
    expect(result).toContain('Shipped today');
    expect(result).toContain('MERGED');
    expect(result).toContain('#123');
  });

  it('returns formatted recap when commits exist', async () => {
    // Mock git log to return commits
    mockExecSync.mockImplementation((cmd: unknown) => {
      const cmdStr = String(cmd || '');
      if (cmdStr.includes('log') && cmdStr.includes('since=')) {
        return 'feat: add recap\nfix: update scheduler';
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n(none)\n\nCOMMITS\n- feat: add recap\n- fix: update scheduler\n\nRESEARCH DOCS\n(none)',
      inputTokens: 100,
      outputTokens: 70,
      totalCostUsd: 0.015,
      model: 'sonnet',
      durationMs: 1800,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    const result = await generateNightlyRecap({ repoDir: '/tmp/test' });
    expect(result).not.toBeNull();
    expect(result).toContain('COMMITS');
    expect(result).toContain('feat: add recap');
  });

  it('returns formatted recap when research docs added', async () => {
    // Mock find to return research docs
    mockExecSync.mockImplementation((cmd: unknown) => {
      const cmdStr = String(cmd || '');
      if (cmdStr.includes('find')) {
        return '1234-recap-feature\n1235-scheduler-update';
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n(none)\n\nCOMMITS\n(none)\n\nRESEARCH DOCS\n- 1234-recap-feature\n- 1235-scheduler-update',
      inputTokens: 100,
      outputTokens: 60,
      totalCostUsd: 0.012,
      model: 'sonnet',
      durationMs: 1500,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    const result = await generateNightlyRecap({ repoDir: '/tmp/test' });
    expect(result).not.toBeNull();
    expect(result).toContain('RESEARCH DOCS');
    expect(result).toContain('1234-recap-feature');
  });

  it('passes correct model to callClaudeCli', async () => {
    // Mock to have some PRs so callClaudeCli is called
    mockExecSync.mockImplementation((cmd: unknown) => {
      const cmdStr = String(cmd || '');
      if (cmdStr.includes('gh pr list')) {
        return JSON.stringify([{ number: 100, title: 'test' }]);
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n- #100 test\n\nCOMMITS\n(none)\n\nRESEARCH DOCS\n(none)',
      inputTokens: 100,
      outputTokens: 50,
      totalCostUsd: 0.01,
      model: 'opus',
      durationMs: 1000,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    await generateNightlyRecap({ repoDir: '/tmp/test', model: 'opus' });

    expect(mockCallClaudeCli).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'opus',
      }),
    );
  });

  it('uses sonnet as default model', async () => {
    // Mock to have some PRs so callClaudeCli is called
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('gh pr list')) {
        return JSON.stringify([{ number: 100, title: 'test' }]);
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n- #100 test\n\nCOMMITS\n(none)\n\nRESEARCH DOCS\n(none)',
      inputTokens: 100,
      outputTokens: 50,
      totalCostUsd: 0.01,
      model: 'sonnet',
      durationMs: 1000,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    await generateNightlyRecap({ repoDir: '/tmp/test' });

    expect(mockCallClaudeCli).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'sonnet',
      }),
    );
  });

  it('includes system prompt and cwd in CLI call', async () => {
    // Mock to have some PRs so callClaudeCli is called
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('gh pr list')) {
        return JSON.stringify([{ number: 100, title: 'test' }]);
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'Shipped today - Mon Jan 12\n\nMERGED\n- #100 test\n\nCOMMITS\n(none)\n\nRESEARCH DOCS\n(none)',
      inputTokens: 100,
      outputTokens: 50,
      totalCostUsd: 0.01,
      model: 'sonnet',
      durationMs: 1000,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    const repoDir = '/tmp/test-repo';
    await generateNightlyRecap({ repoDir });

    expect(mockCallClaudeCli).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: repoDir,
        appendSystemPrompt: expect.stringContaining('ZOE writing Zaal'),
        permissionMode: 'default',
        bare: false,
      }),
    );
  });

  it('returns null for output below minimum length threshold', async () => {
    // Mock to have some PRs so callClaudeCli is called
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('gh pr list')) {
        return JSON.stringify([{ number: 100, title: 'test' }]);
      }
      return '';
    });

    mockCallClaudeCli.mockResolvedValueOnce({
      text: 'too short',
      inputTokens: 10,
      outputTokens: 5,
      totalCostUsd: 0.001,
      model: 'sonnet',
      durationMs: 500,
      numTurns: 1,
      isError: false,
      sessionId: 'test-session',
    });

    const result = await generateNightlyRecap({ repoDir: '/tmp/test' });
    expect(result).toBeNull();
  });
});
