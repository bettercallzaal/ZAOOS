// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../message-context', () => ({ recordMessageContext: vi.fn(async () => undefined) }));

import {
  buildDailyParts,
  CHANGES_PATH,
  formatDaily,
  INVITE_PATH,
  parseDatedLines,
  sendThezaoDaily,
  thezaoDailyEnabled,
} from '../thezao-daily';
import { readVaultFiles } from '../terminals-digest';

const TODAY = '2026-10-11';
const NOW = new Date('2026-10-11T12:30:00Z'); // 08:30 Eastern
const CHANGES = `# thezao daily changes
2026-10-10 The footer links were fixed.
2026-10-11 The /community page now loads member photos.
- 2026-10-11: The home page headline was shortened.
2026-10-11 review: does the Join button on the home page read right?
`;
const INVITE = `2026-10-10 Hey Ana, take a look at test.thezao.com/community and tell me what is missing.
2026-10-11 Hey Sam, open test.thezao.com and tell me if the first screen makes sense.
`;

afterEach(() => vi.unstubAllEnvs());

describe('flag', () => {
  it('is on only for the literal 1', () => {
    expect(thezaoDailyEnabled({ ZOE_THEZAO_DAILY: '1' })).toBe(true);
    expect(thezaoDailyEnabled({ ZOE_THEZAO_DAILY: 'yes' })).toBe(false);
    expect(thezaoDailyEnabled({})).toBe(false);
  });
});

describe('parseDatedLines', () => {
  it('reads the forms a lane writes and ignores everything else', () => {
    expect(parseDatedLines('# heading\n\nprose\n2026-10-11 a\n- 2026-10-11: b\n* 2026-10-11 | c\n  2026-10-11 - d')).toEqual([
      { date: TODAY, text: 'a' },
      { date: TODAY, text: 'b' },
      { date: TODAY, text: 'c' },
      { date: TODAY, text: 'd' },
    ]);
  });
  it('a timestamp is not a dated line (the date must end at a space or separator)', () => {
    expect(parseDatedLines('2026-10-11T09:00 The page loads.\n2026-10-111 x\n2026-10-11x y')).toEqual([]);
  });
  it('a date with no text is not a line', () => {
    expect(parseDatedLines('2026-10-11\n2026-10-11   ')).toEqual([]);
  });
});

describe('buildDailyParts', () => {
  it("takes today's changes, review item and invite; yesterday's lines are left out", () => {
    expect(buildDailyParts(CHANGES, INVITE, TODAY)).toEqual({
      changes: ['The /community page now loads member photos.', 'The home page headline was shortened.'],
      review: 'does the Join button on the home page read right?',
      invite: 'Hey Sam, open test.thezao.com and tell me if the first screen makes sense.',
    });
  });
  it("yesterday's invite is NOT reused when today's is missing", () => {
    expect(buildDailyParts(CHANGES, INVITE.split('\n')[0], TODAY).invite).toBeNull();
  });
  it('the NEWEST invite line decides: an older line appended last means no sentence today', () => {
    const reordered = `2026-10-11 Hey Sam, look.\n2026-10-10 Hey Ana, look.\n`;
    expect(buildDailyParts(null, reordered, TODAY).invite).toBeNull();
  });
  it('files not written yet read as nothing, not as an error', () => {
    expect(buildDailyParts(null, null, TODAY)).toEqual({ changes: [], review: null, invite: null });
  });
});

describe('formatDaily', () => {
  it('names each missing part instead of dropping it', () => {
    const t = formatDaily({ changes: [], review: null, invite: null }, TODAY, { fetched: true });
    expect(t).toContain('nothing was written for today');
    expect(t).toContain('One thing to review: none was written for today.');
    expect(t).toContain('No invite sentence today.');
  });
  it('never contains the invite sentence itself (it is its own message)', () => {
    const p = buildDailyParts(CHANGES, INVITE, TODAY);
    const t = formatDaily(p, TODAY, { fetched: true });
    expect(t).not.toContain('Hey Sam');
    expect(t).toContain("Today's invite sentence is the next message");
    expect(t).toContain('- The /community page now loads member photos.');
  });
  it('says so when the vault could not be reached', () => {
    expect(formatDaily({ changes: [], review: null, invite: null }, TODAY, { fetched: false })).toContain(
      'Could not reach the vault',
    );
  });
  it('caps a long list and points at the file', () => {
    const many = Array.from({ length: 11 }, (_, i) => `change ${i}`);
    const t = formatDaily({ changes: many, review: null, invite: null }, TODAY, { fetched: true });
    expect(t).toContain('- change 7');
    expect(t).not.toContain('- change 8');
    expect(t).toContain(`and 3 more (${CHANGES_PATH})`);
  });
});

describe('sendThezaoDaily', () => {
  const read = (c: string | null, i: string | null, fetched = true) => async () => ({
    files: { [CHANGES_PATH]: c, [INVITE_PATH]: i },
    fetched,
  });
  const sender = (first: unknown = { message_id: 77 }) => {
    const sent: string[] = [];
    const send = async (text: string) => {
      sent.push(text);
      return sent.length === 1 ? first : { message_id: 78 };
    };
    return { sent, send };
  };

  it('red control: flag off, nothing is read or sent', async () => {
    const s = sender();
    const r = vi.fn(read(CHANGES, INVITE));
    expect(await sendThezaoDaily({ send: s.send, now: NOW, read: r })).toBe('off');
    expect(s.sent).toEqual([]);
    expect(r).not.toHaveBeenCalled();
  });

  it('sends the main message, then the invite alone, and records the reply context', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    const s = sender();
    const ctx = vi.fn(async () => undefined);
    expect(await sendThezaoDaily({ send: s.send, now: NOW, read: read(CHANGES, INVITE), recordContext: ctx })).toBe('sent');
    expect(s.sent).toHaveLength(2);
    expect(s.sent[0]).toContain(`test.thezao.com - ${TODAY}`);
    expect(s.sent[1]).toBe('Hey Sam, open test.thezao.com and tell me if the first screen makes sense.');
    expect(ctx).toHaveBeenCalledWith(77, { qid: `thezao-${TODAY}` });
  });

  it('no invite today: one message, and it says so', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    const s = sender();
    await sendThezaoDaily({ send: s.send, now: NOW, read: read(CHANGES, null), recordContext: vi.fn(async () => undefined) });
    expect(s.sent).toHaveLength(1);
    expect(s.sent[0]).toContain('No invite sentence today.');
  });

  it('a budget-blocked main message does not leave an orphan invite', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    const s = sender({ message_id: 0, zoeSendBudget: 'dropped' });
    const ctx = vi.fn(async () => undefined);
    expect(await sendThezaoDaily({ send: s.send, now: NOW, read: read(CHANGES, INVITE), recordContext: ctx })).toBe('blocked');
    expect(s.sent).toHaveLength(1);
    expect(ctx).not.toHaveBeenCalled();
  });

  it('invite blocked after the main message went out: partial, never sent', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sent: string[] = [];
    const send = async (text: string) => {
      sent.push(text);
      return sent.length === 1 ? { message_id: 1 } : { message_id: 0, zoeSendBudget: 'dropped' };
    };
    const r = await sendThezaoDaily({ send, now: NOW, read: read(CHANGES, INVITE), recordContext: vi.fn(async () => undefined) });
    expect(r).toBe('partial');
    vi.restoreAllMocks();
  });

  it('invite send throws after the main message went out: partial, not a throw', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let n = 0;
    const send = async () => {
      if (++n === 2) throw new Error('Telegram unavailable');
      return { message_id: 1 };
    };
    const r = await sendThezaoDaily({ send, now: NOW, read: read(CHANGES, INVITE), recordContext: vi.fn(async () => undefined) });
    expect(r).toBe('partial');
    vi.restoreAllMocks();
  });

  it('a vault that cannot be read is reported, not silent', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    const s = sender();
    const r = await sendThezaoDaily({
      send: s.send,
      now: NOW,
      read: async () => {
        throw new Error('not a git repository');
      },
    });
    expect(r).toBe('failed');
    expect(s.sent[0]).toContain('Could not read the vault on the VPS');
  });

  it('the Eastern date is used: 02:00 UTC is still the day before', async () => {
    vi.stubEnv('ZOE_THEZAO_DAILY', '1');
    const s = sender();
    await sendThezaoDaily({
      send: s.send,
      now: new Date('2026-10-12T02:00:00Z'),
      read: read(CHANGES, INVITE),
      recordContext: vi.fn(async () => undefined),
    });
    expect(s.sent[0]).toContain(`test.thezao.com - ${TODAY}`);
    expect(s.sent).toHaveLength(2);
  });
});

describe('readVaultFiles', () => {
  it('a missing file is null; a failed fetch is reported and the last ref is read', async () => {
    const calls: string[][] = [];
    const run = async (args: string[]) => {
      calls.push(args);
      if (args[0] === 'fetch') throw new Error('offline');
      if (args[0] === 'show' && args[1].endsWith('missing.md')) throw new Error('path not in ref');
      return args[0] === 'show' ? 'body' : 'sha';
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await readVaultFiles('/x', ['a.md', 'missing.md'], run);
    expect(r).toEqual({ files: { 'a.md': 'body', 'missing.md': null }, fetched: false });
    expect(calls.map((c) => c[0])).toEqual(['fetch', 'rev-parse', 'show', 'show']);
  });
  it('an unreadable ref throws, so "no git" is never read as "no file"', async () => {
    const run = async (args: string[]) => {
      if (args[0] === 'rev-parse') throw new Error('not a git repository');
      return '';
    };
    await expect(readVaultFiles('/x', ['a.md'], run)).rejects.toThrow('not a git repository');
  });
});
