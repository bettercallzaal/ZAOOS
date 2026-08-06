import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  callClaudeCliCapAware: vi.fn(),
  hasCodexCli: vi.fn(),
  callCodexCli: vi.fn(),
  hasCapFallbackProvider: vi.fn(),
  callCapFallback: vi.fn(),
  runCmd: vi.fn(),
  appendFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('../../zoe/models/cli-cap-aware', () => ({ callClaudeCliCapAware: m.callClaudeCliCapAware }));
vi.mock('../codex-cli', () => ({ hasCodexCli: m.hasCodexCli, callCodexCli: m.callCodexCli }));
vi.mock('../../zoe/models/router', () => ({ hasCapFallbackProvider: m.hasCapFallbackProvider, callCapFallback: m.callCapFallback }));
vi.mock('../git', () => ({ runCmd: m.runCmd }));
vi.mock('../../zoe/cost-ledger', () => ({ recordCall: vi.fn() }));
vi.mock('node:fs', () => ({ appendFileSync: m.appendFileSync, mkdirSync: m.mkdirSync, readFileSync: m.readFileSync }));

import { runCritic, shadowSummary } from '../critic';

const cli = (text: string) => ({ text, isError: false, inputTokens: 10, outputTokens: 5, model: 'sonnet' });
const input = { workTreePath: '/tmp/wt', branchName: 'ws/x', filesChanged: ['a.ts'], issueText: 'fix a' };

beforeEach(() => {
  delete process.env.ZOE_CRITIC_PANEL;
  process.env.ZOE_CRITIC_PANEL_SHADOW = '1';
  process.env.ZOE_CRITIC_PANEL_ALL_DIFFS = '1'; // these tests exercise panel logic, not the complexity gate
  m.runCmd.mockReset().mockResolvedValue({ exitCode: 0, stdout: 'diff --git a/a.ts b/a.ts\n+x', stderr: '' });
  m.hasCodexCli.mockReset().mockReturnValue(false);
  m.hasCapFallbackProvider.mockReset().mockReturnValue(true);
  m.callCodexCli.mockReset();
  m.callCapFallback.mockReset();
  m.callClaudeCliCapAware.mockReset();
  m.appendFileSync.mockReset();
  m.mkdirSync.mockReset();
  m.readFileSync.mockReset();
});
afterEach(() => {
  delete process.env.ZOE_CRITIC_PANEL_ALL_DIFFS;
  delete process.env.ZOE_CRITIC_PANEL_SHADOW;
});

describe('shadow mode dispatch', () => {
  it('single critic GATES; panel runs alongside and the delta is logged', async () => {
    // single review + panel(claude) review both via callClaudeCliCapAware; deepseek via callCapFallback
    m.callClaudeCliCapAware
      .mockResolvedValueOnce(cli('{"score":88,"feedback":"single: ok"}')) // single gate
      .mockResolvedValueOnce(cli('{"score":55,"feedback":"panel-claude: concern"}')); // panel claude
    m.callCapFallback.mockResolvedValue({ result: cli('{"score":60,"feedback":"deepseek advisory"}'), provider: 'openrouter' });

    const out = await runCritic(input);
    expect(out.score).toBe(88); // the SINGLE critic gates, unaffected by the panel
    expect(out.feedback).toContain('single: ok');
    expect(m.appendFileSync).toHaveBeenCalledOnce(); // the comparison was logged
    const logged = JSON.parse((m.appendFileSync.mock.calls[0][1] as string).trim());
    expect(logged.single_score).toBe(88);
    expect(logged.single_pass).toBe(true);
    expect(typeof logged.panel_score).toBe('number');
  });

  it('records panel_failed_to_run without breaking the gate when the panel throws', async () => {
    m.callClaudeCliCapAware.mockResolvedValueOnce(cli('{"score":90,"feedback":"single ok"}'));
    // panel: claude review fails to parse AND deepseek throws -> panel returns score 0 (all failed) or null
    m.callCapFallback.mockRejectedValue(new Error('openrouter down'));
    // panel's claude reviewer: second call returns garbage -> dropped; no cross-family -> panel all-failed
    m.callClaudeCliCapAware.mockResolvedValueOnce({ text: 'garbage', isError: false, inputTokens: 1, outputTokens: 1, model: 'sonnet' });

    const out = await runCritic(input);
    expect(out.score).toBe(90); // single still gates
    expect(m.appendFileSync).toHaveBeenCalledOnce();
  });

  it('a logging failure never breaks the critic run', async () => {
    m.mkdirSync.mockImplementation(() => { throw new Error('disk full'); });
    m.callClaudeCliCapAware
      .mockResolvedValueOnce(cli('{"score":80,"feedback":"ok"}'))
      .mockResolvedValueOnce(cli('{"score":75,"feedback":"panel"}'));
    m.callCapFallback.mockResolvedValue({ result: cli('{"score":78,"feedback":"ds"}'), provider: 'openrouter' });

    const out = await runCritic(input);
    expect(out.score).toBe(80); // survived the logging failure
  });
});

describe('shadowSummary', () => {
  it('classifies agreements and disagreements at the pass threshold', () => {
    const rows = [
      { single_pass: true, panel_pass: true, agree: true },        // agree
      { single_pass: false, panel_pass: false, agree: true },       // agree
      { single_pass: true, panel_pass: false, agree: false },       // panel stricter (extra catch candidate)
      { single_pass: false, panel_pass: true, agree: false },       // single stricter (panel too lenient)
      { single_pass: true, panel_pass: null, agree: null },         // panel failed to run
    ].map((r) => JSON.stringify(r)).join('\n');
    m.readFileSync.mockReturnValue(rows);

    const s = shadowSummary('2026-08-06');
    expect(s.total).toBe(5);
    expect(s.bothRan).toBe(4);
    expect(s.agree).toBe(2);
    expect(s.disagree).toBe(2);
    expect(s.panelStricterFails).toBe(1);
    expect(s.singleStricterFails).toBe(1);
    expect(s.panelFailedToRun).toBe(1);
  });

  it('returns zeros when there is no log', () => {
    m.readFileSync.mockImplementation(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); });
    expect(shadowSummary('2026-08-06').total).toBe(0);
  });
});
