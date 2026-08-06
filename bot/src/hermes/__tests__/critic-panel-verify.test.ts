import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  callClaudeCliCapAware: vi.fn(),
  hasCodexCli: vi.fn(),
  callCodexCli: vi.fn(),
  hasCapFallbackProvider: vi.fn(),
  callCapFallback: vi.fn(),
  runCmd: vi.fn(),
}));

vi.mock('../../zoe/models/cli-cap-aware', () => ({ callClaudeCliCapAware: m.callClaudeCliCapAware }));
vi.mock('../codex-cli', () => ({ hasCodexCli: m.hasCodexCli, callCodexCli: m.callCodexCli }));
vi.mock('../../zoe/models/router', () => ({ hasCapFallbackProvider: m.hasCapFallbackProvider, callCapFallback: m.callCapFallback }));
vi.mock('../git', () => ({ runCmd: m.runCmd }));

import { runCritic } from '../critic';

const cli = (text: string) => ({ text, isError: false, inputTokens: 10, outputTokens: 5, model: 'sonnet' });
const input = { workTreePath: '/tmp/wt', branchName: 'b', filesChanged: ['a.ts'], issueText: 'fix a' };

beforeEach(() => {
  process.env.ZOE_CRITIC_PANEL = '1';
  process.env.ZOE_CRITIC_PANEL_ALL_DIFFS = '1'; // these tests exercise panel logic, not the complexity gate
  delete process.env.ZOE_CRITIC_PANEL_VERIFY;
  m.runCmd.mockReset().mockResolvedValue({ exitCode: 0, stdout: 'diff --git a/a.ts b/a.ts\n+x', stderr: '' });
  m.hasCodexCli.mockReset().mockReturnValue(true);
  m.hasCapFallbackProvider.mockReset().mockReturnValue(false);
  m.callCodexCli.mockReset();
  m.callCapFallback.mockReset();
  m.callClaudeCliCapAware.mockReset();
});
afterEach(() => {
  delete process.env.ZOE_CRITIC_PANEL_ALL_DIFFS;
  delete process.env.ZOE_CRITIC_PANEL;
  delete process.env.ZOE_CRITIC_PANEL_VERIFY;
});

describe('critic panel - verify on straddling disagreement', () => {
  it('OVERTURNS a false-positive block when reviewers straddle the pass line', async () => {
    // claude passes (85), codex fails (60) -> straddle. verify says false positive (82).
    m.callClaudeCliCapAware
      .mockResolvedValueOnce(cli('{"score":85,"feedback":"looks fine"}')) // claude review
      .mockResolvedValueOnce(cli('{"upheld":false,"score":82,"reason":"type is non-nullable at a.ts:4"}')); // verify
    m.callCodexCli.mockResolvedValue({ text: '{"score":60,"feedback":"possible null deref"}', model: 'codex', inputTokens: 8, outputTokens: 4 });

    const out = await runCritic(input);
    expect(out.score).toBe(82); // rescued (min(82, optimist 85))
    expect(out.feedback).toContain('OVERTURNED');
    expect(out.modelUsed).toContain('verify(overturned)');
    expect(m.callClaudeCliCapAware).toHaveBeenCalledTimes(2); // review + verify
  });

  it('LETS THE BLOCK STAND when verify upholds the pessimist', async () => {
    m.callClaudeCliCapAware
      .mockResolvedValueOnce(cli('{"score":88,"feedback":"ok"}'))
      .mockResolvedValueOnce(cli('{"upheld":true,"score":55,"reason":"real leak at a.ts:9"}'));
    m.callCodexCli.mockResolvedValue({ text: '{"score":50,"feedback":"leaked secret"}', model: 'codex', inputTokens: 8, outputTokens: 4 });

    const out = await runCritic(input);
    expect(out.score).toBe(50); // pessimist gate stands (min 88,50)
    expect(out.feedback).toContain('UPHELD');
  });

  it('fails CLOSED: verify unavailable -> block stands', async () => {
    m.callClaudeCliCapAware
      .mockResolvedValueOnce(cli('{"score":85,"feedback":"ok"}'))
      .mockResolvedValueOnce({ text: 'garbage not json', isError: false, inputTokens: 1, outputTokens: 1, model: 'sonnet' });
    m.callCodexCli.mockResolvedValue({ text: '{"score":40,"feedback":"wrong approach"}', model: 'codex', inputTokens: 8, outputTokens: 4 });

    const out = await runCritic(input);
    expect(out.score).toBe(40); // block stands
    expect(out.feedback).toContain('verify unavailable');
  });

  it('does NOT verify when reviewers AGREE (no straddle)', async () => {
    m.callClaudeCliCapAware.mockResolvedValueOnce(cli('{"score":85,"feedback":"ok"}'));
    m.callCodexCli.mockResolvedValue({ text: '{"score":88,"feedback":"ok"}', model: 'codex', inputTokens: 8, outputTokens: 4 });

    const out = await runCritic(input);
    expect(out.score).toBe(85); // min, no verify
    expect(m.callClaudeCliCapAware).toHaveBeenCalledTimes(1); // review only, NO verify call
  });

  it('does NOT verify when ZOE_CRITIC_PANEL_VERIFY=0', async () => {
    process.env.ZOE_CRITIC_PANEL_VERIFY = '0';
    m.callClaudeCliCapAware.mockResolvedValueOnce(cli('{"score":85,"feedback":"ok"}'));
    m.callCodexCli.mockResolvedValue({ text: '{"score":60,"feedback":"concern"}', model: 'codex', inputTokens: 8, outputTokens: 4 });

    const out = await runCritic(input);
    expect(out.score).toBe(60); // straddle but verify off -> pessimist gate
    expect(m.callClaudeCliCapAware).toHaveBeenCalledTimes(1); // no verify
  });
});
