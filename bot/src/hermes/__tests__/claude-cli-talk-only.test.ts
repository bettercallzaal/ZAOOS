// @vitest-environment node
/**
 * Talk-only is the default unless a call names its tools (finding A, 2026-10-16).
 *
 * An empty `allowedTools` was never put on the argv, and a missing one never
 * was either, so both meant "whatever the host's settings allow". These tests pin what a talk-only
 * spawn actually gets: the argv, the working directory, the environment and
 * the system line. And the other direction: a call that names its tools is
 * untouched.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', async (orig) => ({ ...(await orig<typeof import('node:child_process')>()), spawn: mockSpawn }));
vi.mock('../claude-health', () => ({ recordClaudeOk: vi.fn(), recordClaudeFailure: vi.fn() }));

import { TALK_ONLY_ARGS, TALK_ONLY_SYSTEM_LINE, callClaudeCli, isTalkOnly, talkOnlyEnv } from '../claude-cli';
import { answerMention } from '../../zoe/task-comment-replies';

const OK = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: 'fine',
  usage: { input_tokens: 1, output_tokens: 1 },
  total_cost_usd: 0,
  duration_ms: 1,
  num_turns: 1,
  session_id: 's',
});
function fakeChild(stdout: string) {
  return {
    stdout: { on: vi.fn((ev: string, cb: (b: Buffer) => void) => ev === 'data' && process.nextTick(() => cb(Buffer.from(stdout)))) },
    stderr: { on: vi.fn() },
    on: vi.fn((ev: string, cb: (code: number | null) => void) => ev === 'close' && setTimeout(() => cb(0), 5)),
    kill: vi.fn(),
  };
}
const spawned = () => {
  const [, args, o] = mockSpawn.mock.calls[0] as [string, string[], { cwd: string; env: NodeJS.ProcessEnv }];
  return { args, cwd: o.cwd, env: o.env };
};
const saved = { ...process.env };
afterEach(() => {
  vi.clearAllMocks();
  process.env = { ...saved };
});

describe('isTalkOnly', () => {
  it.each([
    [{ allowedTools: [] }, true],
    [{}, true],
    [{ allowedTools: undefined }, true],
    [{ allowedTools: ['Read'] }, false],
    [{ allowedTools: [], talkOnly: false }, false],
    [{ allowedTools: ['Read'], talkOnly: true }, true],
  ])('%j -> %s', (opts, expected) => {
    expect(isTalkOnly(opts)).toBe(expected);
  });
});

describe('talkOnlyEnv', () => {
  it('keeps only what the CLI needs, drops keys and tokens, disables CLAUDE.md', () => {
    const env = talkOnlyEnv({ HOME: '/h', PATH: '/p', SUPABASE_SERVICE_ROLE_KEY: 'k', GH_TOKEN: 't', ANTHROPIC_API_KEY: 'a' }, false);
    expect(env).toEqual({ HOME: '/h', PATH: '/p', CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' });
  });
  it('keeps the API key only when the call needs it for --bare', () => {
    expect(talkOnlyEnv({ HOME: '/h', ANTHROPIC_API_KEY: 'a' }, true).ANTHROPIC_API_KEY).toBe('a');
  });
});

describe('an empty allow list spawns talk-only', () => {
  it('argv, a fresh empty dir removed after, a minimal env, and the system line', async () => {
    process.env.ZOE_TEST_SECRET = 'must-not-reach-the-child';
    mockSpawn.mockReturnValue(fakeChild(OK));
    await callClaudeCli({ model: 'haiku', prompt: 'hi', cwd: '/home/zaal/zao-os', allowedTools: [], appendSystemPrompt: 'be brief' });
    const { args, cwd, env } = spawned();
    for (let i = 0; i < TALK_ONLY_ARGS.length; i++) {
      const flag = TALK_ONLY_ARGS[i];
      if (flag.startsWith('--')) expect(args, flag).toContain(flag);
    }
    expect(args[args.indexOf('--tools') + 1]).toBe('');
    expect(args).not.toContain('--add-dir');
    expect(args).not.toContain('/home/zaal/zao-os');
    const sys = args[args.indexOf('--append-system-prompt') + 1];
    expect(sys).toContain('be brief');
    expect(sys).toContain(TALK_ONLY_SYSTEM_LINE);
    expect(cwd.startsWith(tmpdir())).toBe(true);
    expect(cwd).toContain('zoe-talk-only-');
    expect(existsSync(cwd)).toBe(false);
    expect(env.ZOE_TEST_SECRET).toBeUndefined();
    expect(env.CLAUDE_CODE_DISABLE_CLAUDE_MDS).toBe('1');
  });

  it('the dir is removed when the spawn fails', async () => {
    mockSpawn.mockImplementation(() => {
      throw new Error('spawn failed');
    });
    await expect(callClaudeCli({ model: 'haiku', prompt: 'hi', cwd: '/x', allowedTools: [] })).rejects.toThrow();
    const cwd = (mockSpawn.mock.calls[0][2] as { cwd: string }).cwd;
    expect(cwd).toContain('zoe-talk-only-');
    expect(existsSync(cwd)).toBe(false);
  });
});

describe('a call with NO allowedTools spawns talk-only too', () => {
  it('the X desk shape: no list, a repo cwd, fetched text - still talk-only', async () => {
    process.env.ZOE_TEST_SECRET = 'must-not-reach-the-child';
    mockSpawn.mockReturnValue(fakeChild(OK));
    await callClaudeCli({ model: 'sonnet', prompt: 'fetched post text', cwd: '/home/zaal/zao-os', appendSystemPrompt: 'draft', permissionMode: 'default', bare: false });
    const { args, cwd, env } = spawned();
    expect(args[args.indexOf('--tools') + 1]).toBe('');
    expect(args).toContain('--strict-mcp-config');
    expect(args).not.toContain('--add-dir');
    expect(cwd).toContain('zoe-talk-only-');
    expect(env.ZOE_TEST_SECRET).toBeUndefined();
  });

  it("the concierge's private default still names its tools, so it keeps them", async () => {
    const { toolsFor } = await import('../../zoe/concierge');
    const def = toolsFor('default');
    expect(def.allowedTools.length).toBeGreaterThan(0);
    expect(isTalkOnly(def)).toBe(false);
    expect(isTalkOnly(toolsFor('none'))).toBe(true);
  });
});

describe('a call that names its tools is unchanged', () => {
  it('no talk-only flags, its own dir with --add-dir, the full env, no extra system line', async () => {
    process.env.ZOE_TEST_SECRET = 'still-here';
    mockSpawn.mockReturnValue(fakeChild(OK));
    await callClaudeCli({ model: 'haiku', prompt: 'hi', cwd: '/repo', allowedTools: ['Read'], appendSystemPrompt: 'x' });
    const { args, cwd, env } = spawned();
    for (const flag of ['--tools', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources']) {
      expect(args, flag).not.toContain(flag);
    }
    expect(args).toContain('--add-dir');
    expect(cwd).toBe('/repo');
    expect(env.ZOE_TEST_SECRET).toBe('still-here');
    expect(args[args.indexOf('--append-system-prompt') + 1]).toBe('x');
  });
});

describe('the board comment reply runs talk-only', () => {
  it('answerMention asks for no tools', async () => {
    const call = vi.fn().mockResolvedValue({ text: 'answer', isError: false });
    await answerMention({ id: '1', title: 'T' } as never, { id: 'c', content: '@zoe what next?' } as never, call as never);
    const opts = call.mock.calls[0][0];
    expect(opts.allowedTools).toEqual([]);
    expect(isTalkOnly(opts)).toBe(true);
  });
});

describe('which files may grant tools (a new grant has to be noticed)', () => {
  // Every non-test file that passes a NON-empty allowedTools literal. These run
  // on input Zaal (or the repo) controls. Adding one here is a decision, and
  // this list is where it gets made, not silently in a new module.
  const GRANTS = new Set([
    'hermes/coder.ts',
    'hermes/critic.ts',
    'zoe/agents/newsletter.ts',
    'zoe/workers.ts',
  ]);
  const GRANT_RE = /(?<![A-Za-z])allowedTools:\s*\[\s*['"]/;
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' || e.name === 'node_modules' ? [] : walk(p);
      return e.name.endsWith('.ts') ? [p] : [];
    });

  it('matches the known list exactly', () => {
    const found = walk(root)
      .filter((f) => GRANT_RE.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(root.length));
    expect(found.length).toBeGreaterThan(0);
    expect(new Set(found)).toEqual(GRANTS);
  });

  it('control: the scan does see a grant when one is there', () => {
    expect(GRANT_RE.test("allowedTools: ['Read']")).toBe(true);
    expect(GRANT_RE.test('allowedTools: []')).toBe(false);
    // disallowedTools contains the word allowedTools; a deny list is not a grant.
    expect(GRANT_RE.test("disallowedTools: ['Bash']")).toBe(false);
  });
});
