import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from 'grammy';
import { describe, expect, it } from 'vitest';
import {
  DECISION_FLAGS,
  flagState,
  flagsCommandEnabled,
  flagsCommandHandler,
  renderFlags,
} from '../flags-command';
import { newOwnerOnlyState, OWNER_ONLY_LINE } from '../owner-only';

const flag = (name: string) => {
  const f = DECISION_FLAGS.find((x) => x.name === name);
  if (!f) throw new Error(`no flag ${name}`);
  return f;
};

describe('flagsCommandEnabled', () => {
  it('is off unless ZOE_FLAGS_COMMAND=1', () => {
    expect(flagsCommandEnabled({})).toBe(false);
    expect(flagsCommandEnabled({ ZOE_FLAGS_COMMAND: 'true' })).toBe(false);
    expect(flagsCommandEnabled({ ZOE_FLAGS_COMMAND: '1' })).toBe(true);
  });
});

describe('flagState', () => {
  it('reads each flag by the value its own code treats as on', () => {
    expect(flagState(flag('ZOE_FAILURE_MEMORY'), '1')).toBe('ON');
    expect(flagState(flag('HERMES_ROUTING'), 'on')).toBe('ON');
    // HERMES_ROUTING is checked with === 'on', so 1 does not turn it on.
    expect(flagState(flag('HERMES_ROUTING'), '1')).toBe('off (=1)');
  });

  it('names a known mode word', () => {
    expect(flagState(flag('ZOE_MODEL_CLASSIFIER'), 'shadow')).toBe('shadow');
  });

  it('unset or empty is off', () => {
    expect(flagState(flag('ZOE_QUIET'), undefined)).toBe('off');
    expect(flagState(flag('ZOE_QUIET'), '')).toBe('off');
  });

  it('never repeats a value that is not a switch word', () => {
    const s = flagState(flag('ZOE_QUIET'), 'sk-ant-something-secret');
    expect(s).toBe('off (set, not an on value)');
    expect(s).not.toContain('sk-ant');
  });
});

describe('renderFlags', () => {
  it('lists every decision flag, the ones that are on first', () => {
    const text = renderFlags({ ZOE_QUIET: '1', HERMES_ROUTING: 'on' });
    const lines = text.split('\n');
    for (const f of DECISION_FLAGS) expect(text).toContain(f.name);
    expect(lines[2].startsWith('ON - ')).toBe(true);
    expect(lines[3].startsWith('ON - ')).toBe(true);
    expect(lines[4].startsWith('off - ')).toBe(true);
  });

  it('names other switches that are on, and never shows any other value', () => {
    const text = renderFlags({
      ZOE_STATUS_COMMAND: '1',
      ZOE_X_DESK: 'true',
      ZOE_BOT_TOKEN: '123456:abcdefSECRETVALUE',
      ZOE_GROUP_SUGGEST_CHATS: '-1001234,-1005678',
      HERMES_OFF_THING: '0',
      OTHER_FLAG: '1',
    });
    expect(text).toContain('Also on: ZOE_STATUS_COMMAND, ZOE_X_DESK');
    expect(text).not.toContain('SECRETVALUE');
    expect(text).not.toContain('-1001234');
    expect(text).not.toContain('ZOE_BOT_TOKEN');
    expect(text).not.toContain('HERMES_OFF_THING');
    expect(text).not.toContain('OTHER_FLAG');
  });

  it('says so when nothing else is on', () => {
    expect(renderFlags({})).toContain('No other ZOE or HERMES switch is on.');
  });
});

describe('every decision flag is still read by the code', () => {
  // A renamed flag would otherwise read "off" forever while the feature is on.
  const root = join(__dirname, '..', '..');
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (name !== '__tests__' && name !== 'node_modules') walk(p);
      } else if (p.endsWith('.ts') && !p.endsWith('flags-command.ts')) {
        files.push(p);
      }
    }
  };
  walk(root);
  const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  it.each(
    DECISION_FLAGS.map((f) => [f.name, f.on[0]]),
  )('%s is compared to %s somewhere in bot/src', (name, on) => {
    expect(source).toMatch(new RegExp(`${name}\\s*!?===?\\s*'${on}'`));
  });
});

describe('/flags handler', () => {
  const ZAAL = 111;
  const STRANGER = 222;

  function fakeCtx(fromId: number | undefined) {
    const replies: unknown[][] = [];
    const ctx = {
      from: fromId === undefined ? undefined : { id: fromId },
      reply: async (...a: unknown[]) => {
        replies.push(a);
      },
    };
    return { ctx: ctx as unknown as Context, replies };
  }

  const deps = (enabled = true) => ({
    zaalId: ZAAL,
    ownerOnlyState: newOwnerOnlyState(),
    enabled: () => enabled,
    env: () => ({ ZOE_QUIET: '1' }),
    now: () => 0,
  });

  it('switched off, falls through and replies nothing', async () => {
    const { ctx, replies } = fakeCtx(ZAAL);
    let passed = false;
    await flagsCommandHandler(deps(false))(ctx, async () => {
      passed = true;
    });
    expect(passed).toBe(true);
    expect(replies).toEqual([]);
  });

  it('the owner gets the flags', async () => {
    const { ctx, replies } = fakeCtx(ZAAL);
    await flagsCommandHandler(deps())(ctx, async () => undefined);
    expect(replies).toHaveLength(1);
    expect(String(replies[0][0])).toContain('ON - ZOE_QUIET');
  });

  it('a non-owner gets only the owner-only line, once an hour', async () => {
    const d = deps();
    const first = fakeCtx(STRANGER);
    await flagsCommandHandler(d)(first.ctx, async () => undefined);
    expect(first.replies).toEqual([[OWNER_ONLY_LINE]]);
    const second = fakeCtx(STRANGER);
    await flagsCommandHandler(d)(second.ctx, async () => undefined);
    expect(second.replies).toEqual([]);
  });

  it('an update with no sender gets nothing', async () => {
    const { ctx, replies } = fakeCtx(undefined);
    await flagsCommandHandler(deps())(ctx, async () => undefined);
    expect(replies).toEqual([]);
  });
});
