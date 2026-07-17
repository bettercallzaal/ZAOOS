// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd }));

const mockCallClaudeCli = vi.hoisted(() => vi.fn());
vi.mock('../claude-cli', () => ({
  callClaudeCli: mockCallClaudeCli,
  HERMES_ROUTING_ENABLED: false,
  HERMES_CRITIC_MODEL: 'sonnet',
  HERMES_CRITIC_FAST_MODEL: 'haiku',
}));

import { runCritic } from '../critic';

type CmdResult = { stdout: string; stderr: string; exitCode: number };
const cmdOk = (stdout: string): CmdResult => ({ stdout, stderr: '', exitCode: 0 });

const MOCK_INPUT = {
  workTreePath: '/tmp/wt',
  issueText: 'Fix the typo in greeting',
  filesChanged: ['src/greet.ts'],
};

afterEach(() => vi.clearAllMocks());

// ── git diff failures ─────────────────────────────────────────────────────────

describe('git diff', () => {
  it('throws when git diff fails', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'not a git repo', exitCode: 1 });
    await expect(runCritic(MOCK_INPUT)).rejects.toThrow('git diff failed in critic');
  });

  it('returns score 0 with a descriptive message when diff is empty', async () => {
    mockRunCmd.mockResolvedValue(cmdOk(''));
    const r = await runCritic(MOCK_INPUT);
    expect(r.score).toBe(0);
    expect(r.feedback).toContain('no diff produced');
    expect(mockCallClaudeCli).not.toHaveBeenCalled();
  });
});

// ── CLI result handling ───────────────────────────────────────────────────────

describe('callClaudeCli result handling', () => {
  beforeEach(() => {
    mockRunCmd.mockResolvedValue(cmdOk('+ const x = 1;'));
  });

  it('returns score 0 with CLI error message when isError=true', async () => {
    mockCallClaudeCli.mockResolvedValue({
      isError: true,
      text: 'rate limit exceeded',
      inputTokens: 10,
      outputTokens: 0,
    });
    const r = await runCritic(MOCK_INPUT);
    expect(r.score).toBe(0);
    expect(r.feedback).toContain('Critic CLI error');
    expect(r.feedback).toContain('rate limit exceeded');
  });

  it('returns parsed score and feedback on a valid JSON response', async () => {
    mockCallClaudeCli.mockResolvedValue({
      isError: false,
      text: '{ "score": 85, "feedback": "Looks good, minor spacing." }',
      inputTokens: 100,
      outputTokens: 20,
    });
    const r = await runCritic(MOCK_INPUT);
    expect(r.score).toBe(85);
    expect(r.feedback).toBe('Looks good, minor spacing.');
    expect(r.inputTokens).toBe(100);
    expect(r.outputTokens).toBe(20);
  });

  it('strips markdown code fences before parsing JSON', async () => {
    mockCallClaudeCli.mockResolvedValue({
      isError: false,
      text: '```json\n{ "score": 72, "feedback": "Needs a null check." }\n```',
      inputTokens: 50,
      outputTokens: 10,
    });
    const r = await runCritic(MOCK_INPUT);
    expect(r.score).toBe(72);
    expect(r.feedback).toBe('Needs a null check.');
  });

  it('throws when the CLI returns non-JSON text', async () => {
    mockCallClaudeCli.mockResolvedValue({
      isError: false,
      text: 'Sorry, I cannot review this diff.',
      inputTokens: 20,
      outputTokens: 5,
    });
    await expect(runCritic(MOCK_INPUT)).rejects.toThrow('non-JSON output');
  });
});
