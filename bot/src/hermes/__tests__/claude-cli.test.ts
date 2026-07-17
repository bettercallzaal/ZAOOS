// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: mockSpawn }));

import { CliAuthError, CliError, callClaudeCli } from '../claude-cli';

afterEach(() => vi.clearAllMocks());

const BASE_OPTS = {
  model: 'haiku' as const,
  prompt: 'Test prompt',
  cwd: '/tmp/test-repo',
  bare: true,
};

function makeSpawn(stdout: string, stderr: string, exitCode: number) {
  return {
    stdout: {
      on: vi.fn((ev: string, cb: (b: Buffer) => void) => {
        if (ev === 'data') process.nextTick(() => cb(Buffer.from(stdout)));
      }),
    },
    stderr: {
      on: vi.fn((ev: string, cb: (b: Buffer) => void) => {
        if (ev === 'data' && stderr) process.nextTick(() => cb(Buffer.from(stderr)));
      }),
    },
    on: vi.fn((ev: string, cb: (code: number | null) => void) => {
      if (ev === 'close') setTimeout(() => cb(exitCode), 10);
    }),
    kill: vi.fn(),
  };
}

const VALID_JSON_RESULT = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: 'The fix is applied.',
  usage: { input_tokens: 100, output_tokens: 50 },
  total_cost_usd: 0.005,
  duration_ms: 1200,
  num_turns: 2,
  session_id: 'sess-abc',
});

// ── happy paths ───────────────────────────────────────────────────────────────

describe('callClaudeCli — happy paths', () => {
  it('resolves with parsed ClaudeCliResult for a valid JSON response', async () => {
    mockSpawn.mockReturnValue(makeSpawn(VALID_JSON_RESULT, '', 0));
    const result = await callClaudeCli(BASE_OPTS);
    expect(result.text).toBe('The fix is applied.');
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(50);
    expect(result.model).toBe('haiku');
    expect(result.sessionId).toBe('sess-abc');
  });

  it('resolves with plain text for outputFormat=text', async () => {
    mockSpawn.mockReturnValue(makeSpawn('  Hello from Claude  ', '', 0));
    const result = await callClaudeCli({ ...BASE_OPTS, outputFormat: 'text' });
    expect(result.text).toBe('Hello from Claude');
    expect(result.inputTokens).toBe(0);
  });
});

// ── error paths ───────────────────────────────────────────────────────────────

describe('callClaudeCli — error paths', () => {
  it('rejects with CliError when spawn exits non-zero', async () => {
    mockSpawn.mockReturnValue(makeSpawn('some error', '', 1));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });

  it('rejects with CliAuthError on auth failure exit', async () => {
    mockSpawn.mockReturnValue(makeSpawn('API Error: 401 Invalid authentication credentials', '', 1));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliAuthError);
  });

  it('rejects when stdout is empty on exit 0', async () => {
    mockSpawn.mockReturnValue(makeSpawn('', '', 0));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });

  it('rejects when JSON payload has is_error=true', async () => {
    const errJson = JSON.stringify({ type: 'result', subtype: 'error', is_error: true, result: 'Error from model' });
    mockSpawn.mockReturnValue(makeSpawn(errJson, '', 0));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });

  it('rejects when JSON subtype is not success (truncated run)', async () => {
    const truncated = JSON.stringify({
      type: 'result', subtype: 'max_turns', is_error: false,
      result: 'Partial output', num_turns: 5,
    });
    mockSpawn.mockReturnValue(makeSpawn(truncated, '', 0));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toThrow('subtype=max_turns');
  });

  it('rejects with CliError when stdout is not valid JSON in json mode', async () => {
    mockSpawn.mockReturnValue(makeSpawn('not-json', '', 0));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });

  it('rejects when the result field is empty in the JSON payload', async () => {
    const emptyResult = JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: '' });
    mockSpawn.mockReturnValue(makeSpawn(emptyResult, '', 0));
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });

  it('rejects and calls kill on spawn error event', async () => {
    const child = makeSpawn('', '', 0);
    child.on = vi.fn((ev: string, cb: (...args: unknown[]) => void) => {
      if (ev === 'error') process.nextTick(() => cb(new Error('ENOENT')));
    });
    mockSpawn.mockReturnValue(child);
    await expect(callClaudeCli(BASE_OPTS)).rejects.toBeInstanceOf(CliError);
  });
});
