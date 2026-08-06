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
vi.mock('../../zoe/cost-ledger', () => ({ recordCall: vi.fn() }));

import { runCritic } from '../critic';

const cli = (text: string) => ({ text, isError: false, inputTokens: 10, outputTokens: 5, model: 'sonnet' });
const SIMPLE_DIFF = 'diff --git a/README.md b/README.md\n+a docs line';
const COMPLEX_DIFF = 'diff --git a/a.ts b/a.ts\n+  const r = eval(userInput);';

function setDiff(diff: string) {
  m.runCmd.mockResolvedValue({ exitCode: 0, stdout: diff, stderr: '' });
}

beforeEach(() => {
  process.env.ZOE_CRITIC_PANEL = '1';
  delete process.env.ZOE_CRITIC_PANEL_ALL_DIFFS;
  m.runCmd.mockReset();
  m.hasCodexCli.mockReset().mockReturnValue(false);
  m.hasCapFallbackProvider.mockReset().mockReturnValue(true);
  m.callCodexCli.mockReset();
  m.callCapFallback.mockReset().mockResolvedValue({ result: cli('{"score":80,"feedback":"panel"}'), provider: 'openrouter' });
  m.callClaudeCliCapAware.mockReset().mockResolvedValue(cli('{"score":85,"feedback":"single or claude"}'));
});
afterEach(() => {
  delete process.env.ZOE_CRITIC_PANEL;
  delete process.env.ZOE_CRITIC_PANEL_ALL_DIFFS;
});

describe('complexity gate', () => {
  it('SKIPS the panel on a simple (docs-only) diff even with the flag on', async () => {
    setDiff(SIMPLE_DIFF);
    input: void 0;
    await runCritic({ workTreePath: '/tmp', branchName: 'b', filesChanged: ['README.md'], issueText: 'doc' });
    expect(m.callCapFallback).not.toHaveBeenCalled(); // panel did NOT run
    expect(m.callClaudeCliCapAware).toHaveBeenCalledTimes(1); // single critic only
  });

  it('RUNS the panel on a complex (risky code) diff', async () => {
    setDiff(COMPLEX_DIFF);
    await runCritic({ workTreePath: '/tmp', branchName: 'b', filesChanged: ['a.ts'], issueText: 'code' });
    expect(m.callCapFallback).toHaveBeenCalled(); // panel ran (DeepSeek voter)
  });

  it('ZOE_CRITIC_PANEL_ALL_DIFFS=1 forces the panel even on a simple diff', async () => {
    process.env.ZOE_CRITIC_PANEL_ALL_DIFFS = '1';
    setDiff(SIMPLE_DIFF);
    await runCritic({ workTreePath: '/tmp', branchName: 'b', filesChanged: ['README.md'], issueText: 'doc' });
    expect(m.callCapFallback).toHaveBeenCalled();
  });
});
