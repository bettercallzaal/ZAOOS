import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
  hasCapFallbackProvider: vi.fn(),
  callCapFallback: vi.fn(),
}));

vi.mock('../../../hermes/claude-cli', () => ({ callClaudeCli: mocks.callClaudeCli }));
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

const crossResult = {
  result: {
    text: '{"score":60,"summary":"cross","issues":[]}',
    model: 'openrouter/deepseek/deepseek-chat',
    inputTokens: 5,
    outputTokens: 15,
    totalCostUsd: 0,
    durationMs: 200,
    numTurns: 1,
    isError: false,
    sessionId: 'or',
  },
  provider: 'openrouter',
};

const opts = {
  system: 'sys',
  user: 'usr',
  cwd: '/tmp',
  claudeModel: 'sonnet',
  disallowedTools: ['Bash'],
};

describe('runCritiqueModel cross-family routing', () => {
  beforeEach(() => {
    mocks.callClaudeCli.mockReset().mockResolvedValue(claudeResult);
    mocks.hasCapFallbackProvider.mockReset();
    mocks.callCapFallback.mockReset().mockResolvedValue(crossResult);
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });
  afterEach(() => {
    delete process.env.ZOE_CROSS_FAMILY_VERIFY;
  });

  it("routes to a different family when a non-Claude provider is available", async () => {
    mocks.hasCapFallbackProvider.mockReturnValue(true);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('cross');
    expect(mocks.callCapFallback).toHaveBeenCalledWith('sys', 'usr');
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
    expect(r.text).toContain('cross');
  });

  it('falls back to same-family Claude when no non-Claude provider exists', async () => {
    mocks.hasCapFallbackProvider.mockReturnValue(false);
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    expect(mocks.callCapFallback).not.toHaveBeenCalled();
  });

  it('forces same-family when ZOE_CROSS_FAMILY_VERIFY=0 even if a provider exists', async () => {
    mocks.hasCapFallbackProvider.mockReturnValue(true);
    process.env.ZOE_CROSS_FAMILY_VERIFY = '0';
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callCapFallback).not.toHaveBeenCalled();
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
  });

  it('falls back to same-family (loud, not a failure) when the cross-family call throws', async () => {
    mocks.hasCapFallbackProvider.mockReturnValue(true);
    mocks.callCapFallback.mockRejectedValue(new Error('provider down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await runCritiqueModel(opts);
    expect(r.reviewerFamily).toBe('same');
    expect(mocks.callClaudeCli).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
