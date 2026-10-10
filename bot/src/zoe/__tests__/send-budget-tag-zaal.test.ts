// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  gateSend,
  resetSendBudgetForTest,
  runWithSendClass,
  tagForZaal,
  tagZaalEnabled,
  zaalTgHandle,
  type SendClass,
} from '../send-budget';

const GROUP = -1003813973176;
const DM = 123456;
const ON = { ZOE_TAG_ZAAL: '1' };

describe('flag and handle', () => {
  it('is on only for the literal 1', () => {
    expect(tagZaalEnabled(ON)).toBe(true);
    expect(tagZaalEnabled({ ZOE_TAG_ZAAL: 'true' })).toBe(false);
    expect(tagZaalEnabled({})).toBe(false);
  });
  it('handle defaults to bettercallzaal, accepts an override with or without @, rejects junk', () => {
    expect(zaalTgHandle({})).toBe('bettercallzaal');
    expect(zaalTgHandle({ ZOE_ZAAL_TG_HANDLE: '@zaal_p' })).toBe('zaal_p');
    expect(zaalTgHandle({ ZOE_ZAAL_TG_HANDLE: 'zaal_p' })).toBe('zaal_p');
    expect(zaalTgHandle({ ZOE_ZAAL_TG_HANDLE: 'a b; rm' })).toBe('bettercallzaal');
  });
});

describe('tagForZaal', () => {
  it('tags an alarm and a needs-Zaal message in a group', () => {
    expect(tagForZaal('deploy failed', 'alarm', GROUP, ON)).toBe('@bettercallzaal deploy failed');
    expect(tagForZaal('pick A or B', 'gated', GROUP, ON)).toBe('@bettercallzaal pick A or B');
  });
  it.each(['status', 'digest', 'noise', 'reply', 'morning'] as SendClass[])(
    'does not tag class %s (a mention on everything means nothing)',
    (cls) => {
      expect(tagForZaal('fyi', cls, GROUP, ON)).toBe('fyi');
    },
  );
  it('never tags a DM', () => {
    expect(tagForZaal('pick A or B', 'gated', DM, ON)).toBe('pick A or B');
  });
  it('does not tag twice, whatever the case', () => {
    expect(tagForZaal('@BetterCallZaal pick one', 'gated', GROUP, ON)).toBe('@BetterCallZaal pick one');
  });
  it('accepts a group id passed as a string', () => {
    expect(tagForZaal('x', 'alarm', String(GROUP), ON)).toBe('@bettercallzaal x');
  });
  it('a message that only fits untagged goes out untagged (4096 limit)', () => {
    const full = 'x'.repeat(4090);
    expect(tagForZaal(full, 'alarm', GROUP, ON)).toBe(full);
    const fits = 'x'.repeat(4080);
    expect(tagForZaal(fits, 'alarm', GROUP, ON)).toHaveLength(4096);
  });
  it('red control: flag off, nothing is tagged', () => {
    expect(tagForZaal('deploy failed', 'alarm', GROUP, {})).toBe('deploy failed');
  });
});

describe('gateSend applies the tag to what is actually sent', () => {
  let home: string;
  const saved = { ...process.env };
  beforeEach(async () => {
    home = await fs.mkdtemp(join(tmpdir(), 'zoe-tag-'));
    process.env.ZOE_HOME = home;
    delete process.env.ZOE_SEND_BUDGET;
    resetSendBudgetForTest();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...saved };
  });

  const sender = () => {
    const calls: Array<[number, string]> = [];
    const raw = async (chatId: number, text: string) => {
      calls.push([chatId, text]);
      return { message_id: 1 };
    };
    return { calls, send: gateSend(raw) };
  };

  it('a gated group send goes out tagged; the same send as status does not', async () => {
    process.env.ZOE_TAG_ZAAL = '1';
    const s = sender();
    await runWithSendClass('gated', () => s.send(GROUP, 'pick A or B'));
    await runWithSendClass('status', () => s.send(GROUP, 'doc 2654 merged'));
    expect(s.calls).toEqual([
      [GROUP, '@bettercallzaal pick A or B'],
      [GROUP, 'doc 2654 merged'],
    ]);
  });

  it('the per-call class hint is honoured', async () => {
    process.env.ZOE_TAG_ZAAL = '1';
    const s = sender();
    await s.send(GROUP, 'bot down', { zoeSendClass: 'alarm' });
    expect(s.calls[0][1]).toBe('@bettercallzaal bot down');
  });

  it('still tags when the budget itself is switched off', async () => {
    process.env.ZOE_TAG_ZAAL = '1';
    process.env.ZOE_SEND_BUDGET = 'off';
    const s = sender();
    await s.send(GROUP, 'bot down', { zoeSendClass: 'alarm' });
    expect(s.calls[0][1]).toBe('@bettercallzaal bot down');
  });

  it('red control: flag off, the gated send is byte-identical', async () => {
    const s = sender();
    await runWithSendClass('gated', () => s.send(GROUP, 'pick A or B'));
    expect(s.calls).toEqual([[GROUP, 'pick A or B']]);
  });
});
