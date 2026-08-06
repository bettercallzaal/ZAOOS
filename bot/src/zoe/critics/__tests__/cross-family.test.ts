import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
  hasCodexCli: vi.fn(),
  callCodexCli: vi.fn(),
  hasCapFallbackProvider: vi.fn(),
  callCapFallback: vi.fn(),
}));

vi.mock('../../../hermes/claude-cli', () => ({ callClaudeCli: mocks.callClaudeCli }));
vi.mock('../../../hermes/codex-cli', () => ({
  hasCodexCli: mocks.hasCodexCli,
  callCodexCli: mocks.callCodexCli,
  CodexUnavailableError: class extends Error {},
}));
vi.mock('../../models/router', () => ({
  hasCapFallbackProvider: mocks.hasCapFallbackProvider,
  callCapFallback: mocks.callCapFallback,
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

const openrouterResult = {
  text: '{"score":55,"summary":"cross via openrouter","issues":[]}',
  model: 'openrouter/deepseek-chat',
  inputTokens: 5,
  outputTokens: 10,
  totalCostUsd: 0,
  durationMs: 150,
  numTurns: 1,
  isError: false,
  sessionId: 'or',
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
    // Default: no cap-fallback provider, so the existing codex-only tests keep
    // their old behavior (codex fail -> same-family).
    mocks.hasCapFallbackProvider.mockReset().mockReturnValue(false);
    mocks.callCapFallback.mockReset().mockResolvedValue({ result: openrouterResult, provider: 'openrouter' });
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

describe('runCritiqueModel cross-family routing via OpenRouter (second reviewer)', () => {
  beforeEach(() => {
    mocks.callClaudeCli.mockReset().mockResolvedValue(claudeResult);
    mocks.hasCodexCli.mockReset();
    mocks.callCodexCli.mockReset().mockResolvedValue(codexResult);
    mocks.hasCapFallbackProvider.mockReset().mockReturnValue(true);
    mocks.callCapFallback.mockReset().mockResolvedValue({ result: openrouterResult, provider: 'openrouter' });
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });
  afterEach(() => {
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });

  it('THE KEY CASE: Codex capped -> OpenRouter still gives a cross-family review', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    mocks.callCodexCli.mockRejectedValue(new Error('codex unavailable (usage limit)'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('cross'); // NOT same - OpenRouter covered it
    expect(r.model).toBe('openrouter/deepseek-chat');
    expect(mocks.callCapFallback).toHaveBeenCalledTimes(1);
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('uses OpenRouter cross-family when Codex is absent entirely', async () => {
    mocks.hasCodexCli.mockReturnValue(false);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('cross');
    expect(r.model).toBe('openrouter/deepseek-chat');
    expect(mocks.callCodexCli).not.toHaveBeenCalled();
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
  });

  it('prefers Codex over OpenRouter when both are available', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('cross');
    expect(r.model).toBe('codex');
    expect(mocks.callCapFallback).not.toHaveBeenCalled();
  });

  it('falls to same-family only when BOTH cross reviewers are unavailable', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    mocks.callCodexCli.mockRejectedValue(new Error('codex capped'));
    mocks.callCapFallback.mockRejectedValue(new Error('all cap-fallback providers failed'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('falls to same-family when the OpenRouter response fails validation', async () => {
    mocks.hasCodexCli.mockReturnValue(false);
    mocks.callCapFallback.mockResolvedValue({ result: { ...openrouterResult, text: 'not json' }, provider: 'openrouter' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel({ ...opts, validate: (t) => t.trim().startsWith('{') });
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('ZOE_CROSS_FAMILY_VERIFY=0 skips BOTH cross reviewers', async () => {
    mocks.hasCodexCli.mockReturnValue(true);
    process.env.ZOE_CROSS_FAMILY_VERIFY = '0';
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callCodexCli).not.toHaveBeenCalled();
    expect(mocks.callCapFallback).not.toHaveBeenCalled();
  });
});
