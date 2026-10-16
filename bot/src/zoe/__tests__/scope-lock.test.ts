// @vitest-environment node
/**
 * scope-lock: only Zaal's private turn may use tools or act.
 *
 * Three layers, each tested on its own:
 *   1. the argv a talk-only CLI call actually spawns (claude-cli.ts),
 *   2. which tool policy and working dir a concierge turn gets, by scope,
 *   3. that index.ts and discord.ts wire both, read as source text (index.ts
 *      starts a live poller and is never imported: agent-loops rule 21).
 */
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', async (orig) => ({ ...(await orig<typeof import('node:child_process')>()), spawn: mockSpawn }));
vi.mock('../cost-ledger', () => ({ recordCall: vi.fn() }));

import { TALK_ONLY_ARGS, callClaudeCli } from '../../hermes/claude-cli';
import { NO_TOOLS_DENY, runConciergeTurn, toolsFor } from '../concierge';
import type { MemoryBlocks } from '../memory';
import { stripOpsOutsidePrivate, toolPolicyForScope } from '../scope-lock';
import type { ConciergeResult } from '../types';

afterEach(() => vi.clearAllMocks());

function fakeChild(stdout: string) {
  return {
    stdout: { on: vi.fn((ev: string, cb: (b: Buffer) => void) => ev === 'data' && process.nextTick(() => cb(Buffer.from(stdout)))) },
    stderr: { on: vi.fn() },
    on: vi.fn((ev: string, cb: (code: number | null) => void) => ev === 'close' && setTimeout(() => cb(0), 5)),
    kill: vi.fn(),
  };
}
const OK = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: 'Hello from ZOE.',
  usage: { input_tokens: 1, output_tokens: 1 },
  total_cost_usd: 0,
  duration_ms: 1,
  num_turns: 1,
  session_id: 's',
});
const spawned = (): { args: string[]; cwd: string } => {
  const call = mockSpawn.mock.calls[0];
  return { args: call[1] as string[], cwd: (call[2] as { cwd: string }).cwd };
};

describe('toolPolicyForScope', () => {
  it.each([
    ['private', 'default'],
    ['-1003813973176', 'none'],
    ['discord-dm:42', 'none'],
    ['discord:123', 'none'],
    ['member-dm-7', 'none'],
    ['', 'none'],
  ])('%s -> %s', (scope, policy) => {
    expect(toolPolicyForScope(scope)).toBe(policy);
  });
});

describe('stripOpsOutsidePrivate', () => {
  const withOps = (): ConciergeResult =>
    ({
      reply: 'the answer',
      task_ops: [{ op: 'add' }],
      quest_ops: [{ op: 'add' }],
      captures: [{ text: 'x' }],
      bot_relay_ops: [{ bot: 'b' }],
      crm_ops: [{ op: 'log' }],
      thread_ops: [{ op: 'track' }],
      decision_ops: [{ op: 'log' }],
      build_state_ops: [{ op: 'log' }],
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      model: 'm',
      durationMs: 0,
    }) as unknown as ConciergeResult;

  it('a group turn keeps its answer and loses every op', () => {
    const r = withOps();
    expect(stripOpsOutsidePrivate(r, '-100123')).toBe(8);
    expect(r.reply).toBe('the answer');
    for (const k of ['task_ops', 'quest_ops', 'captures', 'bot_relay_ops', 'crm_ops', 'thread_ops', 'decision_ops', 'build_state_ops'] as const) {
      expect(r[k], k).toEqual([]);
    }
  });

  it("Zaal's private turn keeps every op", () => {
    const r = withOps();
    expect(stripOpsOutsidePrivate(r, 'private')).toBe(0);
    expect(r.task_ops).toHaveLength(1);
    expect(r.crm_ops).toHaveLength(1);
    expect(r.bot_relay_ops).toHaveLength(1);
  });
});

describe('the spawned argv', () => {
  const base = { model: 'haiku', prompt: 'hi', cwd: '/tmp/x' };

  it('talkOnly puts every lock on the command line, each with its value', async () => {
    mockSpawn.mockReturnValue(fakeChild(OK));
    await callClaudeCli({ ...base, ...toolsFor('none') });
    const { args } = spawned();
    const at = (flag: string) => args.indexOf(flag);
    expect(at('--tools')).toBeGreaterThan(0);
    expect(args[at('--tools') + 1]).toBe('');
    expect(at('--strict-mcp-config')).toBeGreaterThan(0);
    expect(at('--disable-slash-commands')).toBeGreaterThan(0);
    expect(at('--setting-sources')).toBeGreaterThan(0);
    expect(args[at('--setting-sources') + 1]).toBe('');
    expect(args).not.toContain('--allowedTools');
    expect(args).not.toContain('--mcp-config');
    // The deny list is still there as a second layer.
    expect(args[at('--disallowedTools') + 1]).toBe(NO_TOOLS_DENY[0]);
  });

  it('TALK_ONLY_ARGS is the exact list the 2026-10-16 probe used', () => {
    expect([...TALK_ONLY_ARGS]).toEqual(['--tools', '', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources', '']);
  });

  it('the default policy carries none of them', async () => {
    mockSpawn.mockReturnValue(fakeChild(OK));
    await callClaudeCli({ ...base, ...toolsFor('default') });
    const { args } = spawned();
    for (const flag of ['--tools', '--strict-mcp-config', '--disable-slash-commands', '--setting-sources']) {
      expect(args, flag).not.toContain(flag);
    }
    expect(args).toContain('--allowedTools');
  });
});

describe('runConciergeTurn by scope', () => {
  const blocks = (scope: string): MemoryBlocks =>
    ({ persona: 'ZOE', human: '', working: '', tasks: '', quests: '', chat_scope: scope, chat_title: 'ZAO' }) as MemoryBlocks;
  const context = { zaal_tg_id: 1, workspace_dir: '/home/zaal/zao-os', current_date: 'Fri Oct 16 2026' };
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('a group turn: talk-only argv, a fresh empty dir outside the repo, removed after, answer intact', async () => {
    delete process.env.MODEL_ROUTING_ENABLED;
    mockSpawn.mockReturnValue(fakeChild(OK));
    const r = await runConciergeTurn({ message: 'what is ZAOstock?', blocks: blocks('-100123'), context, toolPolicy: toolPolicyForScope('-100123') });
    expect(r.reply).toContain('Hello from ZOE.');
    const { args, cwd } = spawned();
    expect(args).toContain('--strict-mcp-config');
    expect(args[args.indexOf('--tools') + 1]).toBe('');
    expect(cwd.startsWith(tmpdir())).toBe(true);
    expect(cwd).toContain('zoe-talk-only-');
    expect(cwd).not.toContain('zao-os');
    expect(existsSync(cwd)).toBe(false);
  });

  it('the dir is removed when the turn fails too', async () => {
    delete process.env.MODEL_ROUTING_ENABLED;
    mockSpawn.mockImplementation(() => {
      throw new Error('spawn failed');
    });
    await expect(
      runConciergeTurn({ message: 'hi', blocks: blocks('-100123'), context, toolPolicy: 'none' }),
    ).rejects.toThrow();
    const cwd = (mockSpawn.mock.calls[0][2] as { cwd: string }).cwd;
    expect(cwd).toContain('zoe-talk-only-');
    expect(existsSync(cwd)).toBe(false);
  });

  it("Zaal's private turn: the usual tools, in the repo dir, no talk-only flags", async () => {
    delete process.env.MODEL_ROUTING_ENABLED;
    mockSpawn.mockReturnValue(fakeChild(OK));
    await runConciergeTurn({ message: 'hi', blocks: blocks('private'), context, toolPolicy: toolPolicyForScope('private') });
    const { args, cwd } = spawned();
    expect(cwd).toBe('/home/zaal/zao-os');
    expect(args).toContain('--allowedTools');
    expect(args).toContain('Read');
    expect(args).not.toContain('--strict-mcp-config');
  });
});

describe('wiring, read as source', () => {
  const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
  const INDEX = read('../index.ts');
  const DISCORD = read('../discord.ts');

  it('dispatchConcierge asks for the scope policy and clears ops before any op is read', () => {
    const start = INDEX.indexOf('async function dispatchConcierge(');
    const fn = INDEX.slice(start, INDEX.indexOf('\n}', start));
    expect(fn).toContain('toolPolicy: toolPolicyForScope(scope)');
    const strip = fn.indexOf('stripOpsOutsidePrivate(result, scope)');
    const turn = fn.indexOf('await runConciergeTurn(');
    expect(strip).toBeGreaterThan(turn);
    for (const read of ['result.task_ops', 'result.quest_ops', 'result.decision_ops', 'result.build_state_ops', 'result.bot_relay_ops', 'result.crm_ops', 'result.thread_ops', 'result.captures']) {
      const at = fn.indexOf(read);
      expect(at, read).toBeGreaterThan(strip);
    }
  });

  it('every runConciergeTurn call in index.ts and discord.ts names a tool policy', () => {
    for (const [name, src] of [
      ['index.ts', INDEX],
      ['discord.ts', DISCORD],
    ] as const) {
      const calls = [...src.matchAll(/runConciergeTurn\(\{/g)].map((m) => m.index ?? 0);
      expect(calls.length, name).toBeGreaterThan(0);
      for (const at of calls) {
        const body = src.slice(at, src.indexOf('});', at));
        expect(body, `${name} at ${at}`).toMatch(/toolPolicy:/);
      }
    }
  });
});
