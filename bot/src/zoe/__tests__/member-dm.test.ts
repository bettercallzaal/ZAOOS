// @vitest-environment node
import { readFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// memory.ts reads ZOE_HOME at import time, so set it before anything imports it.
const HOME = vi.hoisted(() => {
  const dir = `/tmp/zoe-member-dm-test-${process.pid}`;
  process.env.ZOE_HOME = dir;
  return dir;
});

import { NO_TOOLS_DENY, toolsFor } from '../concierge';
import type { GroupConfig } from '../groups';
import {
  MEMBER_DM_DEFAULT_PER_HOUR,
  MEMBER_DM_EMPTY_LINE,
  MEMBER_DM_LIMIT_LINE,
  MEMBER_DM_WINDOW_MS,
  allowMemberTurn,
  isZaoMember,
  memberDmEnabled,
  memberDmPerHour,
  memberDmScope,
  newMemberDmLimiter,
  runMemberDmTurn,
} from '../member-dm';
import { buildMemoryBlocks, type MemoryBlocks } from '../memory';
import { privateScopeAllowed } from '../owner-only';

const INDEX_SOURCE = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');

const group = (ids: number[]): GroupConfig => ({ chat_id: -100, chat_title: 'ZAO', mode: 'mention', member_allowlist: ids }) as GroupConfig;

describe('flag and config', () => {
  it('is off by default and on only for the literal 1', () => {
    expect(memberDmEnabled({})).toBe(false);
    expect(memberDmEnabled({ ZOE_MEMBER_DM: 'true' })).toBe(false);
    expect(memberDmEnabled({ ZOE_MEMBER_DM: '1' })).toBe(true);
  });
  it('per-hour limit defaults, and ignores garbage', () => {
    expect(memberDmPerHour({})).toBe(MEMBER_DM_DEFAULT_PER_HOUR);
    expect(memberDmPerHour({ ZOE_MEMBER_DM_PER_HOUR: '0' })).toBe(MEMBER_DM_DEFAULT_PER_HOUR);
    expect(memberDmPerHour({ ZOE_MEMBER_DM_PER_HOUR: 'x' })).toBe(MEMBER_DM_DEFAULT_PER_HOUR);
    expect(memberDmPerHour({ ZOE_MEMBER_DM_PER_HOUR: '3' })).toBe(3);
  });
});

describe('isZaoMember', () => {
  it('a user on any group allowlist is a member; anyone else is not', () => {
    const groups = [group([1, 2]), group([3])];
    expect(isZaoMember(3, groups)).toBe(true);
    expect(isZaoMember(4, groups)).toBe(false);
    expect(isZaoMember(1, [])).toBe(false);
  });
});

describe('the member scope is never the private scope', () => {
  it.each([0, 1, 42, 123456789])('user %i', (id) => {
    const scope = memberDmScope(id);
    expect(scope).not.toBe('private');
    // The #3971 gate only refuses 'private'; the member path never asks for it.
    expect(privateScopeAllowed(scope, false)).toBe(true);
  });

  describe("buildMemoryBlocks for a member scope loads none of Zaal's memory", () => {
    beforeAll(async () => {
      await fs.mkdir(HOME, { recursive: true });
      await fs.writeFile(join(HOME, 'human.md'), 'ZAAL-PRIVATE-MARKER schedule and money');
    });
    afterAll(async () => {
      await fs.rm(HOME, { recursive: true, force: true });
    });

    it('human is empty and the marker appears nowhere in the blocks', async () => {
      const blocks = await buildMemoryBlocks(memberDmScope(7), 'DM with Tom');
      expect(blocks.human).toBe('');
      expect(JSON.stringify(blocks)).not.toContain('ZAAL-PRIVATE-MARKER');
      expect(blocks.chat_scope).toBe(memberDmScope(7));
    });

    it('control: the private scope DOES load it, so the test can tell the two apart', async () => {
      const blocks = await buildMemoryBlocks('private');
      expect(blocks.human).toContain('ZAAL-PRIVATE-MARKER');
    });
  });
});

describe('toolsFor', () => {
  it("'none' allows nothing and denies every built-in tool the default set uses", () => {
    const none = toolsFor('none');
    expect(none.allowedTools).toEqual([]);
    const def = toolsFor('default');
    for (const t of def.allowedTools) {
      const base = t.replace(/\(.*$/, '');
      expect(NO_TOOLS_DENY.some((d) => base === d || base.startsWith(`${d}__`)), t).toBe(true);
    }
  });
  it('default is unchanged by this change', () => {
    expect(toolsFor().allowedTools).toContain('Read');
    expect(toolsFor().disallowedTools).toContain('Edit');
  });
});

describe('allowMemberTurn', () => {
  it('allows the limit, refuses the next, and opens again after the window', () => {
    const s = newMemberDmLimiter();
    for (let i = 0; i < 3; i++) expect(allowMemberTurn(s, 9, 1000 + i, 3)).toBe(true);
    expect(allowMemberTurn(s, 9, 2000, 3)).toBe(false);
    expect(allowMemberTurn(s, 10, 2000, 3)).toBe(true); // per member
    expect(allowMemberTurn(s, 9, 1000 + MEMBER_DM_WINDOW_MS + 5, 3)).toBe(true);
  });
});

describe('runMemberDmTurn', () => {
  const blocks = (): MemoryBlocks => ({ persona: 'p', human: '', working: '', tasks: '', decisions: '', build_state: '', chat_scope: 'x' }) as MemoryBlocks;
  const deps = (reply = 'Hi Tom, here is what I know.') => {
    const d = {
      buildBlocks: vi.fn(async (_scope: string) => blocks()),
      runTurn: vi.fn(async (_b: MemoryBlocks, _m: string, _s: string) => ({ reply })),
      remember: vi.fn(async (_turn: unknown, _scope: string) => {}),
      reply: vi.fn(async (_t: string) => {}),
    };
    return d;
  };
  const input = (over: Partial<Parameters<typeof runMemberDmTurn>[1]> = {}) => ({
    userId: 7,
    name: 'Tom',
    text: 'what is ZAOstock?',
    nowMs: 1_000,
    limiter: newMemberDmLimiter(),
    perHour: 6,
    ...over,
  });

  it('answers in the member scope with the member context, and remembers both sides there', async () => {
    const d = deps();
    expect(await runMemberDmTurn(d, input())).toBe('answered');
    expect(d.buildBlocks).toHaveBeenCalledWith(memberDmScope(7));
    const sent = d.runTurn.mock.calls[0][0];
    expect(sent.group_context).toContain('not Zaal');
    expect(sent.group_context).toContain('cannot run tools');
    expect(d.reply).toHaveBeenCalledWith('Hi Tom, here is what I know.');
    for (const call of d.remember.mock.calls) expect(call[1]).toBe(memberDmScope(7));
  });

  it('over the limit: one plain line, no model call', async () => {
    const d = deps();
    const limiter = newMemberDmLimiter();
    await runMemberDmTurn(d, input({ limiter, perHour: 1 }));
    expect(await runMemberDmTurn(d, input({ limiter, perHour: 1, nowMs: 2_000 }))).toBe('limited');
    expect(d.runTurn).toHaveBeenCalledTimes(1);
    expect(d.reply).toHaveBeenLastCalledWith(MEMBER_DM_LIMIT_LINE);
  });

  it('an empty model reply gets a plain line, not silence', async () => {
    const d = deps('  ');
    expect(await runMemberDmTurn(d, input())).toBe('empty');
    expect(d.reply).toHaveBeenCalledWith(MEMBER_DM_EMPTY_LINE);
  });

  it('a model error propagates so the caller can answer and stop progress', async () => {
    const d = deps();
    d.runTurn.mockRejectedValueOnce(new Error('timeout'));
    await expect(runMemberDmTurn(d, input())).rejects.toThrow('timeout');
    expect(d.reply).not.toHaveBeenCalled();
  });
});

describe('index.ts wiring (read as text, never imported: agent-loops rule 21)', () => {
  const privateBranch = (() => {
    const start = INDEX_SOURCE.indexOf("  if (chatType === 'private') {\n    if (!isFromZaal(ctx)) {");
    return INDEX_SOURCE.slice(start, start + 1200);
  })();
  const handler = (() => {
    const start = INDEX_SOURCE.indexOf('async function handleMemberDm(');
    return INDEX_SOURCE.slice(start, INDEX_SOURCE.indexOf('\n}', start));
  })();

  it('a non-Zaal DM is gated by the flag AND membership before any member turn', () => {
    expect(privateBranch.length).toBeGreaterThan(100);
    const flag = privateBranch.indexOf('memberDmEnabled()');
    const member = privateBranch.indexOf('isZaoMember(');
    const turn = privateBranch.indexOf('handleMemberDm(');
    expect(flag).toBeGreaterThan(0);
    expect(member).toBeGreaterThan(flag);
    expect(turn).toBeGreaterThan(member);
  });

  it('flag off or not a member: the owner-only line, then return (behaviour of main)', () => {
    const after = privateBranch.slice(privateBranch.indexOf('handleMemberDm('));
    expect(after.indexOf('await ownerOnly(ctx);')).toBeGreaterThan(0);
    expect(after.indexOf('await ownerOnly(ctx);')).toBeLessThan(after.indexOf('return;\n    }'));
  });

  it('the member handler never reaches the private concierge, tools, or ops', () => {
    expect(handler.length).toBeGreaterThan(100);
    expect(handler).not.toContain('dispatchConcierge');
    expect(handler).not.toContain("'private'");
    expect(handler).not.toMatch(/apply\w*Ops|runBotRelayOps|runCrmOps|startDmBuild|sendBusReply/);
    expect(handler).toContain("toolPolicy: 'none'");
  });
});
