import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  BONFIRE_PUBLIC_NAMES,
  fullNameHits,
  type GroupMemoryConfig,
  isMemoryChat,
  parseSummary,
  previousUtcDay,
  type RollDeps,
  readGroupMemoryConfig,
  readGroupSummary,
  readYesterdayLine,
  rollGroupDay,
  SUMMARY_MAX,
  safeSender,
  summaryPath,
  summaryPrompt,
  TURN_TEXT_MAX,
  TURNS_PER_DAY_MAX,
  turnsForDay,
  writeGroupSummary,
  yesterdayLine,
} from '../group-memory';
import { buildGroupContext, type RecentTurn } from '../memory';
import { containsPii } from '../pii';
import { containsSecret } from '../recall';

const CHAT = '-100123';
const CFG: GroupMemoryConfig = { chats: new Set([CHAT]) };
const DAY = '2026-11-07';

function turn(ts: string, text: string, sender?: string, from: RecentTurn['from'] = 'other'): RecentTurn {
  return { from, text, ts, sender };
}

function deps(over: Partial<RollDeps> = {}): RollDeps & {
  [K in 'readArchive' | 'draft' | 'writeSummary' | 'remember' | 'featureRan' | 'log']: ReturnType<typeof vi.fn>;
} {
  return {
    readArchive: vi.fn(async () => [
      turn(`${DAY}T10:00:00.000Z`, 'when is the next build call?', 'Sam'),
      turn(`${DAY}T10:00:05.000Z`, 'Thursday, per the board.', undefined, 'zoe'),
      turn('2026-11-06T23:59:59.000Z', 'old day line', 'Sam'),
    ]),
    draft: vi.fn(async () => 'Sam asked about the build call; ZOE said Thursday.'),
    writeSummary: vi.fn(async () => {}),
    remember: vi.fn(async () => ({ ok: true })),
    containsSecret,
    containsPii,
    featureRan: vi.fn(),
    log: vi.fn(),
    ...over,
  } as never;
}

describe('readGroupMemoryConfig', () => {
  it.each([
    [{}],
    [{ ZOE_GROUP_MEMORY: '0', ZOE_GROUP_MEMORY_CHATS: CHAT }],
    [{ ZOE_GROUP_MEMORY: 'true', ZOE_GROUP_MEMORY_CHATS: CHAT }],
    [{ ZOE_GROUP_MEMORY: '1' }],
    [{ ZOE_GROUP_MEMORY: '1', ZOE_GROUP_MEMORY_CHATS: 'abc, ../x' }],
  ])('is off for %j', (env) => {
    expect(readGroupMemoryConfig(env as NodeJS.ProcessEnv)).toBeNull();
  });

  it('is on with the flag and a numeric chat list', () => {
    const cfg = readGroupMemoryConfig({ ZOE_GROUP_MEMORY: '1', ZOE_GROUP_MEMORY_CHATS: ` ${CHAT}, -100456 ,junk` });
    expect(cfg && [...cfg.chats]).toEqual([CHAT, '-100456']);
  });

  it('isMemoryChat is true only for a listed chat', () => {
    expect(isMemoryChat(CFG, CHAT)).toBe(true);
    expect(isMemoryChat(CFG, -100123)).toBe(true);
    expect(isMemoryChat(CFG, '-100999')).toBe(false);
    expect(isMemoryChat(null, CHAT)).toBe(false);
    expect(isMemoryChat(CFG, undefined)).toBe(false);
  });
});

describe('turn shaping', () => {
  it('keeps first names and hides handles and ids', () => {
    expect(safeSender({ from: 'other', sender: 'Sam Lee' })).toBe('Sam');
    expect(safeSender({ from: 'other', sender: '@zaodevz_bot' })).toBe('a member');
    expect(safeSender({ from: 'other', sender: 'user:987654' })).toBe('a member');
    expect(safeSender({ from: 'other', sender: undefined })).toBe('a member');
    expect(safeSender({ from: 'zoe', sender: undefined })).toBe('ZOE');
  });

  it('takes only the given day and caps turns per day', () => {
    const many = Array.from({ length: TURNS_PER_DAY_MAX + 50 }, (_, i) =>
      turn(`${DAY}T10:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z`, `m${i}`, 'Sam'),
    );
    many.push(turn('2026-11-08T00:00:01.000Z', 'next day', 'Sam'));
    const got = turnsForDay(many, DAY);
    expect(got).toHaveLength(TURNS_PER_DAY_MAX);
    expect(got[got.length - 1].text).toBe(`m${TURNS_PER_DAY_MAX + 49}`);
    expect(got.some((t) => t.text === 'next day')).toBe(false);
  });

  it('builds a prompt with capped text and no handle or id', () => {
    const p = summaryPrompt(DAY, [
      turn(`${DAY}T01:00:00.000Z`, 'x'.repeat(TURN_TEXT_MAX + 100), '@zaodevz_bot'),
      turn(`${DAY}T01:00:01.000Z`, 'hi', 'user:987654'),
    ]);
    expect(p).not.toContain('@zaodevz_bot');
    expect(p).not.toContain('987654');
    expect(p).toContain(`a member: ${'x'.repeat(TURN_TEXT_MAX)}\n`);
    expect(p).toContain('<<<TURNS');
  });
});

describe('summary file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zoe-group-memory-'));
  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('parseSummary refuses junk', () => {
    expect(parseSummary('not json')).toBeNull();
    expect(parseSummary('{}')).toBeNull();
    expect(parseSummary(JSON.stringify({ day: 'yesterday', summary: 'x' }))).toBeNull();
    expect(parseSummary(JSON.stringify({ day: DAY, summary: '   ' }))).toBeNull();
    expect(parseSummary(JSON.stringify({ day: DAY, summary: 'x'.repeat(SUMMARY_MAX + 1) }))).toBeNull();
    expect(parseSummary(JSON.stringify({ day: DAY, summary: 'ok' }))).toEqual({ day: DAY, summary: 'ok' });
  });

  it('round-trips through the per-group file', async () => {
    await writeGroupSummary(dir, CHAT, { day: DAY, summary: 'a short day' });
    expect(await readGroupSummary(dir, CHAT)).toEqual({ day: DAY, summary: 'a short day' });
    expect(await readGroupSummary(dir, '-100999')).toBeNull();
  });

  it('refuses a chat id that is not a number', () => {
    expect(() => summaryPath(dir, '../../etc')).toThrow(/bad chat id/);
  });
});

describe('read-back', () => {
  const s = { day: DAY, summary: 'Sam asked about the build call.' };

  it('reads back yesterday for a listed chat', () => {
    expect(previousUtcDay('2026-11-08')).toBe(DAY);
    expect(previousUtcDay('2026-12-01')).toBe('2026-11-30');
    expect(yesterdayLine(CFG, CHAT, s, '2026-11-08')).toBe(s.summary);
  });

  it('does not read back an older day, an unlisted chat, or with the flag off', () => {
    expect(yesterdayLine(CFG, CHAT, s, '2026-11-09')).toBeUndefined();
    expect(yesterdayLine(CFG, '-100999', s, '2026-11-08')).toBeUndefined();
    expect(yesterdayLine(null, CHAT, s, '2026-11-08')).toBeUndefined();
    expect(yesterdayLine(CFG, CHAT, null, '2026-11-08')).toBeUndefined();
  });

  it('buildGroupContext adds the line only when given', () => {
    const plain = buildGroupContext(CHAT, 'Test Group');
    expect(plain).not.toContain('Yesterday in this group');
    expect(buildGroupContext(CHAT, 'Test Group', undefined, '   ')).toBe(plain);
    expect(buildGroupContext(CHAT, 'Test Group', undefined, s.summary)).toContain(
      `Yesterday in this group: ${s.summary}`,
    );
  });
});

describe('rollGroupDay', () => {
  it('does nothing for an unlisted chat or with the flag off', async () => {
    for (const [cfg, chat] of [
      [null, CHAT],
      [CFG, '-100999'],
    ] as const) {
      const d = deps();
      expect(await rollGroupDay(cfg, chat, DAY, d)).toBe('off');
      expect(d.readArchive).not.toHaveBeenCalled();
      expect(d.draft).not.toHaveBeenCalled();
      expect(d.writeSummary).not.toHaveBeenCalled();
      expect(d.remember).not.toHaveBeenCalled();
    }
  });

  it('makes no model call for a chat with no turns that day', async () => {
    const d = deps({ readArchive: vi.fn(async () => [turn('2026-11-06T10:00:00.000Z', 'old', 'Sam')]) });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('no-turns');
    expect(d.draft).not.toHaveBeenCalled();
    expect(d.writeSummary).not.toHaveBeenCalled();
  });

  it('makes one model call, saves the summary and writes one episode', async () => {
    const d = deps();
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('saved');
    expect(d.readArchive).toHaveBeenCalledWith(CHAT, '2026-11');
    expect(d.draft).toHaveBeenCalledTimes(1);
    expect(d.draft.mock.calls[0][0]).not.toContain('old day line');
    expect(d.writeSummary).toHaveBeenCalledWith(CHAT, {
      day: DAY,
      summary: 'Sam asked about the build call; ZOE said Thursday.',
    });
    expect(d.remember).toHaveBeenCalledTimes(1);
    expect(d.remember.mock.calls[0][0]).toMatchObject({
      name: `group-memory:${CHAT}:${DAY}`,
      sourceTag: 'zoe:group-memory',
    });
    expect(d.featureRan).toHaveBeenCalledWith('group-memory-roll', expect.stringContaining(CHAT));
  });

  it('caps the saved summary', async () => {
    const d = deps({ draft: vi.fn(async () => 'y'.repeat(SUMMARY_MAX + 300)) });
    await rollGroupDay(CFG, CHAT, DAY, d);
    expect(d.writeSummary.mock.calls[0][1].summary).toHaveLength(SUMMARY_MAX);
  });

  it('skips an empty summary', async () => {
    const d = deps({ draft: vi.fn(async () => '   ') });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('empty-summary');
    expect(d.writeSummary).not.toHaveBeenCalled();
    expect(d.remember).not.toHaveBeenCalled();
  });

  it('never sends a summary with an email to Bonfire', async () => {
    const d = deps({ draft: vi.fn(async () => 'Sam said to write to sam.lee@example.com about it.') });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('saved-bonfire-skipped-pii');
    expect(d.remember).not.toHaveBeenCalled();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('PII'));
  });

  it('never sends a secret-shaped summary to Bonfire', async () => {
    const d = deps({ draft: vi.fn(async () => `the key is ghp_${'a'.repeat(36)}`) });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('saved-bonfire-skipped-secret');
    expect(d.remember).not.toHaveBeenCalled();
  });

  it('says so when Bonfire does not take the episode', async () => {
    const d = deps({ remember: vi.fn(async () => ({ ok: false, skipped: 'no-config' })) });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('saved-bonfire-not-sent');
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('no-config'));
  });
});

describe('wiring (index.ts, scheduler.ts and memory.ts read as text; index.ts boots the bot and is never imported)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zoe-group-memory-wire-'));
  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });
  const src = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8');

  it('readYesterdayLine reads the file for a listed chat, and nothing for an unlisted one or the flag off', async () => {
    await writeGroupSummary(dir, CHAT, { day: DAY, summary: 'the build call is Thursday' });
    const now = new Date('2026-11-08T09:00:00Z');
    expect(await readYesterdayLine(CFG, dir, CHAT, now)).toBe('the build call is Thursday');
    expect(await readYesterdayLine(CFG, dir, '-100999', now)).toBeUndefined();
    expect(await readYesterdayLine(null, dir, CHAT, now)).toBeUndefined();
    expect(await readYesterdayLine(CFG, dir, CHAT, new Date('2026-11-10T09:00:00Z'))).toBeUndefined();
  });

  it('the group handler passes the read-back into buildMemoryBlocks, and memory.ts hands it to buildGroupContext', () => {
    const index = src('index.ts');
    expect(index).toContain('const groupMemoryCfg = readGroupMemoryConfig();');
    expect(index).toContain('await readYesterdayLine(groupMemoryCfg, ZOE_PATHS.home, scope, new Date())');
    expect(index).toContain('buildMemoryBlocks(scope, chatTitle, groupCfg?.persona_override, yesterday)');
    expect(src('memory.ts')).toContain('buildGroupContext(scope, chatTitle, personaOverride, yesterdaySummary)');
  });

  it('the day roll is scheduled only with the config and a model call, once a day, in UTC', () => {
    const sched = src('scheduler.ts');
    const guardAt = sched.indexOf('if (groupMemoryCfg && groupMemoryDraft) {');
    const claimAt = sched.indexOf("claimFire('group-memory-roll')");
    expect(guardAt).toBeGreaterThan(-1);
    expect(claimAt).toBeGreaterThan(guardAt);
    expect(sched.slice(guardAt, claimAt)).toContain("'10 0 * * *'");
    expect(sched.slice(claimAt, claimAt + 1600)).toContain("{ timezone: 'UTC' }");
    expect(src('index.ts')).toMatch(/groupMemoryDraft: groupMemoryCfg\s*\?/);
  });
});

describe('a full name never reaches Bonfire (seat-merge on #4281)', () => {
  it('fullNameHits flags a First Last pair and lets first names, kept names and dates through', () => {
    expect(fullNameHits('Sarah Johnson from Acme asked about the budget.')).toEqual(['Sarah Johnson']);
    expect(fullNameHits('Sam asked about the build call; ZOE said Thursday.')).toEqual([]);
    expect(fullNameHits('On Thursday Iman Ali shipped the hub and Zaal Panthaki reviewed it.')).toEqual([]);
    expect(fullNameHits('Next Monday the group meets.')).toEqual([]);
  });

  it('a summary with a full name is saved on disk but not sent to Bonfire', async () => {
    const d = deps({ draft: vi.fn(async () => 'Sarah Johnson from Acme asked about the budget.') });
    expect(await rollGroupDay(CFG, CHAT, DAY, d)).toBe('saved-bonfire-skipped-name');
    expect(d.writeSummary).toHaveBeenCalledTimes(1);
    expect(d.remember).not.toHaveBeenCalled();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('a full name'));
    expect(d.log.mock.calls[0][0]).not.toContain('Sarah');
  });

  it('the kept names match scripts/zoe/nightly-public-names.json plus Zaal and ZOE', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', '..', 'scripts', 'zoe', 'nightly-public-names.json'), 'utf8'));
    expect([...BONFIRE_PUBLIC_NAMES].sort()).toEqual([...new Set(['Zaal', 'ZOE', 'Zoe', ...file.names])].sort());
  });
});
