import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
  hasCodexCli: vi.fn(),
  callCodexCli: vi.fn(),
}));

vi.mock('../../../hermes/claude-cli', () => ({ callClaudeCli: mocks.callClaudeCli }));
vi.mock('../../../hermes/codex-cli', () => ({
  hasCodexCli: mocks.hasCodexCli,
  callCodexCli: mocks.callCodexCli,
  CodexUnavailableError: class extends Error {},
}));

import { runCritiqueModel } from '../types';

const claudeResult = {
  text: '{"score":80,"summary":"ok","issues":[]}',
  model: 'sonnet',
  inputTokens: 10,
  outputTokens: 20,
  totalCostUsd: 0.01,
  durationMs: 100,
  numTurns: 1,
  isError: false,
  sessionId: 'x',
};

const codexResult = {
  text: '{"score":60,"summary":"cross via codex","issues":[]}',
  model: 'codex',
  inputTokens: 0,
  outputTokens: 0,
  totalCostUsd: 0,
  durationMs: 200,
};

const opts = {
  system: 'sys',
  user: 'usr',
  cwd: '/tmp',
  claudeModel: 'sonnet',
  disallowedTools: ['Bash'],
};

describe('runCritiqueModel cross-family routing via Codex', () => {
  beforeEach(() => {
    mocks.callClaudeCli.mockReset().mockResolvedValue(claudeResult);
    mocks.hasCodexCli.mockReset();
    mocks.callCodexCli.mockReset().mockResolvedValue(codexResult);
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });
  afterEach(() => {
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });

  it('routes to Codex (different family) when the codex CLI is present', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('cross');
    expect(r.model).toBe('codex');
    expect(mocks.callCodexCli).toHaveBeenCalledTimes(1);
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
  });

  it('falls back to same-family Claude when the codex CLI is absent', async () => {
    mocks.hasCodexCli.mockReturnValue(false);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    expect(mocks.callCodexCli).not.toHaveBeenCalled();
  });

  it('forces same-family when ZOE_CROSS_FAMILY_VERIFY=0 even if codex is present', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    process.env.ZOE_CROSS_FAMILY_VERIFY = '0';
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callCodexCli).not.toHaveBeenCalled();
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
  });

  it('falls back to same-family (loud) when Codex is usage-capped / throws', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    mocks.callCodexCli.mockRejectedValue(new Error('codex unavailable (usage limit)'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('retries same-family when the Codex response fails validation (garbage)', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    mocks.callCodexCli.mockResolvedValue({ ...codexResult, text: 'not json at all' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel({ ...opts, validate: (t) => t.trim().startsWith('{') });
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callCodexCli).toHaveBeenCalledTimes(1);
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps the Codex result when it passes validation', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    const r = await runCritiqueModel({ ...opts, validate: (t) => t.trim().startsWith('{') });
    expect(r.reviewerFamily).toBe('cross');
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
  });
});
