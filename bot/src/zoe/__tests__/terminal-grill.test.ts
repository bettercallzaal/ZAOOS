import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  answerKey,
  formatTerminalCard,
  nextTerminalItem,
  parseItemOptions,
  readTerminalGrillState,
  recordTerminalAnswer,
  stampKey,
} from '../terminal-grill';

// Zaal, 2026-10-08: "can i do a /grill command aswell so that i can click
// through the todos for terminals". Rows below are verbatim Item cells from
// the seat page's Waiting on Zaal table, vault main, 2026-10-08.

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'tgrill-'));
  process.env.ZOE_TERMINAL_GRILL_DIR = dir;
});
afterEach(async () => {
  delete process.env.ZOE_TERMINAL_GRILL_DIR;
  delete process.env.ZOE_GRILL_STOP;
  await fs.rm(dir, { recursive: true, force: true });
});

describe('parseItemOptions - "A <text> / B <text> / ..." into lettered options', () => {
  it('question then A/B', () => {
    const r = parseItemOptions('Delete the old lineup poster from the public repo (ZAOstock #461)? A yes (vault copy exists) / B keep');
    expect(r.question).toBe('Delete the old lineup poster from the public repo (ZAOstock #461)?');
    expect(r.options).toEqual([{ letter: 'A', text: 'yes (vault copy exists)' }, { letter: 'B', text: 'keep' }]);
  });
  it('question with a colon, then A/B', () => {
    const r = parseItemOptions('Which Ryan leads design: A Ryan Miller (OPEN X) / B someone else (name)');
    expect(r.question).toBe('Which Ryan leads design:');
    expect(r.options.map((o) => o.letter)).toEqual(['A', 'B']);
    expect(r.options[1].text).toBe('someone else (name)');
  });
  it('four options', () => {
    const r = parseItemOptions('Ticket-queue idea: who counts as having ZAO? A Respect holders / B ZABAL holders / C the 188 Farcaster members / D other');
    expect(r.options.map((o) => `${o.letter} ${o.text}`)).toEqual(['A Respect holders', 'B ZABAL holders', 'C the 188 Farcaster members', 'D other']);
  });
  it.each([
    'Un-draft ZAOOS #3630 (proof green)',
    'Thank-yous A/B and Eteis spelling (held)',
    'vercel.json A/B; ZAOstock #358 paid reviewers A/B/C; dotfiles #430, #438, #439; zao-papers #13; stale external PRs',
    'Ask A friend / later',
  ])('no options in %s', (item) => {
    expect(parseItemOptions(item).options).toEqual([]);
  });
});

const page = {
  stamp: '2026-10-08 05:46 EDT',
  waiting: [
    { id: 'W1', item: 'Delete the poster? A yes / B keep' },
    { id: 'W2', item: 'Un-draft ZAOOS #3630 (proof green)' },
  ],
  running: [],
  terminals: [],
  terminalsProblem: null,
};

describe('the card', () => {
  it('options become lettered buttons, then Skip and Type an answer, then Stop grill', () => {
    process.env.ZOE_GRILL_STOP = '1';
    const c = formatTerminalCard(page.waiting[0], page.stamp);
    const sk = stampKey(page.stamp);
    expect(c.text).toContain('W1');
    expect(c.text).toContain('A) yes');
    expect(c.buttons[0]).toEqual([{ text: 'A: yes', data: `tw:${sk}:W1:A` }, { text: 'B: keep', data: `tw:${sk}:W1:B` }]);
    expect(c.buttons[1]).toEqual([{ text: 'Skip', data: `tw:${sk}:W1:skip` }, { text: 'Type an answer', data: `tw:${sk}:W1:type` }]);
    expect(c.buttons.at(-1)).toEqual([{ text: 'Stop grill', data: 'gpause:stop' }]);
    for (const b of c.buttons.flat()) expect(Buffer.byteLength(b.data)).toBeLessThanOrEqual(64);
  });
  it('no options: Done, Skip, Type an answer', () => {
    const c = formatTerminalCard(page.waiting[1], page.stamp);
    expect(c.buttons[0].map((b) => b.text)).toEqual(['Done', 'Skip', 'Type an answer']);
  });
});

describe('answers reach the seat, verbatim, once', () => {
  it('a tap is written with the time, the stamp, the id, the letter and the option text', async () => {
    const r = await recordTerminalAnswer({ page, id: 'W1', choice: 'A', now: Date.parse('2026-10-08T14:00:00Z') });
    expect(r).toBe('recorded');
    const rows = (await fs.readFile(join(dir, 'terminal-answers.jsonl'), 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
    expect(rows).toEqual([
      expect.objectContaining({ at: '2026-10-08T14:00:00.000Z', stamp: page.stamp, id: 'W1', choice: 'A', answer: 'yes', item: 'Delete the poster? A yes / B keep' }),
    ]);
  });
  it('a typed answer is kept exactly as he wrote it', async () => {
    await recordTerminalAnswer({ page, id: 'W2', choice: 'typed', text: '  yes, un-draft it - proof is in the PR  ' });
    const row = JSON.parse((await fs.readFile(join(dir, 'terminal-answers.jsonl'), 'utf8')).trim());
    expect(row.answer).toBe('  yes, un-draft it - proof is in the PR  ');
  });
  it('one answer per id per page stamp: a second tap is refused and not written', async () => {
    await recordTerminalAnswer({ page, id: 'W1', choice: 'A' });
    expect(await recordTerminalAnswer({ page, id: 'W1', choice: 'B' })).toBe('already-answered');
    const n = (await fs.readFile(join(dir, 'terminal-answers.jsonl'), 'utf8')).trim().split('\n').length;
    expect(n).toBe(1);
  });
  it('the same id on a NEW page stamp can be answered again', async () => {
    await recordTerminalAnswer({ page, id: 'W1', choice: 'A' });
    expect(await recordTerminalAnswer({ page: { ...page, stamp: '2026-10-08 09:00 EDT' }, id: 'W1', choice: 'B' })).toBe('recorded');
  });
  it('a tap from an older page is refused, so a stale card cannot answer a new question', async () => {
    expect(await recordTerminalAnswer({ page, id: 'W1', choice: 'A', tapStampKey: '2610070900' })).toBe('stale');
  });
  it('a letter the item does not offer is refused', async () => {
    expect(await recordTerminalAnswer({ page, id: 'W1', choice: 'D' })).toBe('invalid');
  });
});

describe('order', () => {
  it('first unanswered, unskipped item; then none', async () => {
    let s = await readTerminalGrillState();
    expect(nextTerminalItem(page, s)?.id).toBe('W1');
    await recordTerminalAnswer({ page, id: 'W1', choice: 'A' });
    s = await readTerminalGrillState();
    expect(nextTerminalItem(page, s)?.id).toBe('W2');
    await recordTerminalAnswer({ page, id: 'W2', choice: 'skip' });
    s = await readTerminalGrillState();
    expect(nextTerminalItem(page, s)).toBeNull();
    expect(Object.keys(s.done)).toContain(answerKey(page.stamp, 'W2'));
  });
});

describe('flag', () => {
  it('off unless ZOE_GRILL_TERMINALS is exactly 1', async () => {
    const { terminalGrillEnabled } = await import('../terminal-grill');
    delete process.env.ZOE_GRILL_TERMINALS;
    expect(terminalGrillEnabled()).toBe(false);
    process.env.ZOE_GRILL_TERMINALS = 'true';
    expect(terminalGrillEnabled()).toBe(false);
    process.env.ZOE_GRILL_TERMINALS = '1';
    expect(terminalGrillEnabled()).toBe(true);
    delete process.env.ZOE_GRILL_TERMINALS;
  });
});
