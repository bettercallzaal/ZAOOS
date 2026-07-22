// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCallClaudeCli = vi.hoisted(() => vi.fn());
const mockCallCapFallback = vi.hoisted(() => vi.fn());
const mockHasProvider = vi.hoisted(() => vi.fn());

// Keep CliError REAL (the wrapper uses `err instanceof CliError`); mock only the call.
vi.mock('../../../hermes/claude-cli', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../hermes/claude-cli')>();
  return { ...actual, callClaudeCli: mockCallClaudeCli };
});
vi.mock('../router', () => ({
  callCapFallback: mockCallCapFallback,
  hasCapFallbackProvider: mockHasProvider,
}));

import { callClaudeCliCapAware } from '../cli-cap-aware';
import { CliError } from '../../../hermes/claude-cli';

afterEach(() => vi.clearAllMocks());

const RESULT = { text: 'ok', raw: '', exitCode: 0 } as never;
const opts = { cwd: '/tmp', prompt: 'u', appendSystemPrompt: 's' } as never;

describe('callClaudeCliCapAware', () => {
  it('returns the Claude result when the call succeeds (no fallback)', async () => {
    mockCallClaudeCli.mockResolvedValue(RESULT);
    const r = await callClaudeCliCapAware(opts);
    expect(r).toBe(RESULT);
    expect(mockCallCapFallback).not.toHaveBeenCalled();
  });

  it('falls back to a non-Claude provider on a usage_limit (weekly cap)', async () => {
    mockCallClaudeCli.mockRejectedValue(new CliError('weekly limit', 'usage_limit'));
    mockHasProvider.mockReturnValue(true);
    mockCallCapFallback.mockResolvedValue({ provider: 'openrouter', result: RESULT });
    const r = await callClaudeCliCapAware(opts);
    expect(r).toBe(RESULT);
    expect(mockCallCapFallback).toHaveBeenCalledWith('s', 'u');
  });

  it('falls back on a rate_limit (429) cap too', async () => {
    mockCallClaudeCli.mockRejectedValue(new CliError('429', 'rate_limit'));
    mockHasProvider.mockReturnValue(true);
    mockCallCapFallback.mockResolvedValue({ provider: 'grok', result: RESULT });
    await callClaudeCliCapAware(opts);
    expect(mockCallCapFallback).toHaveBeenCalledTimes(1);
  });

  it('re-throws the cap error when no fallback provider is configured', async () => {
    mockCallClaudeCli.mockRejectedValue(new CliError('weekly limit', 'usage_limit'));
    mockHasProvider.mockReturnValue(false);
    await expect(callClaudeCliCapAware(opts)).rejects.toThrow('weekly limit');
    expect(mockCallCapFallback).not.toHaveBeenCalled();
  });

  it('re-throws a non-cap error without falling back', async () => {
    mockCallClaudeCli.mockRejectedValue(new CliError('boom', 'unknown'));
    mockHasProvider.mockReturnValue(true);
    await expect(callClaudeCliCapAware(opts)).rejects.toThrow('boom');
    expect(mockCallCapFallback).not.toHaveBeenCalled();
  });
});
