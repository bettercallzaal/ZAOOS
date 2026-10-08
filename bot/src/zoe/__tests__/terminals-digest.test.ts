import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatTerminalsDigest, parseTerminalsPage, readTerminalsPage, sendTerminalsDigest } from '../terminals-digest';

// Same headings, table columns, stamp line and row counts as the page the seat
// wrote at 2026-10-07 20:53 EDT (zao-vault origin/main
// notes/orca-terminals-latest.md, commit f54e7003). The rows are neutral: the
// real page names people and money, and this repo is public.
const PAGE = readFileSync(join(__dirname, 'fixtures', 'orca-terminals-2026-10-07.md'), 'utf8');

afterEach(() => {
  delete process.env.ZOE_TERMINALS_DIGEST;
  delete process.env.ZOE_GRILL_STOP;
  delete process.env.ZOE_GRILL_PAUSE_PATH;
});

describe('parseTerminalsPage - the seat page as it really is', () => {
  const p = parseTerminalsPage(PAGE);
  it('reads the stamp', () => {
    expect(p.stamp).toBe('2026-10-07 20:53 EDT');
  });
  it('reads every Waiting on Zaal row, in order', () => {
    expect(p.waiting.map((w) => w.id)).toEqual(['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z10', 'Z11']);
    expect(p.waiting[4].item).toBe('Confirm which X account the Vercel token posts as (TheZAODAO or thezao)');
  });
  it('reads all 20 terminals with their role', () => {
    expect(p.terminals).toHaveLength(20);
    expect(p.terminals.filter((t) => /^ACTIVE/.test(t.role)).map((t) => t.tab)).toEqual(['bcz-yapz', 'ideas', 'zaostock']);
  });
  it('reads the running rows', () => {
    expect(p.running.map((r) => r.id)).toEqual(['R1', 'R2', 'R3']);
  });
});

describe('formatTerminalsDigest', () => {
  const text = formatTerminalsDigest(parseTerminalsPage(PAGE), { fetched: true });
  it('puts the wants-from-you lines first, before anything about terminals', () => {
    const want = text.indexOf('Wants from you');
    expect(want).toBeGreaterThan(-1);
    expect(want).toBeLessThan(text.indexOf('Active'));
    expect(text).toContain('Z1 ');
  });
  it('names the active terminals and what each is on', () => {
    expect(text).toContain('bcz-yapz: R2');
    expect(text).toContain('zaostock: waits on Z3');
  });
  it('states the page stamp so a stale page reads as stale', () => {
    expect(text).toContain('2026-10-07 20:53 EDT');
  });
  it('fits one Telegram message', () => {
    expect(text.length).toBeLessThanOrEqual(3800);
  });
  it('says so when the vault could not be fetched', () => {
    const t = formatTerminalsDigest(parseTerminalsPage(PAGE), { fetched: false });
    expect(t).toMatch(/could not reach the vault/i);
  });
  it('an empty or unrecognised page is reported, never shown as an empty list', () => {
    expect(formatTerminalsDigest(parseTerminalsPage(''), { fetched: true })).toMatch(/could not read the terminals page/i);
  });
});

describe('readTerminalsPage - fetch, then read origin/main, never the working tree', () => {
  it('reads the file from origin/main after a fetch', async () => {
    const run = vi.fn(async (args: string[]) => (args[0] === 'fetch' ? '' : PAGE));
    const r = await readTerminalsPage('/vault', run);
    expect(run.mock.calls[0][0]).toEqual(['fetch', '-q', 'origin', 'main']);
    expect(run.mock.calls[1][0]).toEqual(['show', 'origin/main:notes/orca-terminals-latest.md']);
    expect(r).toMatchObject({ fetched: true });
    expect(r.text).toBe(PAGE);
  });
  it('a failed fetch still reads the last known copy, and marks it', async () => {
    const run = vi.fn(async (args: string[]) => {
      if (args[0] === 'fetch') throw new Error('ssh: connect timed out');
      return PAGE;
    });
    const r = await readTerminalsPage('/vault', run);
    expect(r.fetched).toBe(false);
    expect(r.text).toBe(PAGE);
  });
});

describe('sendTerminalsDigest - flag and Stop grill', () => {
  const read = async () => ({ text: PAGE, fetched: true });
  it('flag off: sends nothing', async () => {
    const send = vi.fn();
    expect(await sendTerminalsDigest({ send, read, scheduled: true })).toBe('off');
    expect(send).not.toHaveBeenCalled();
  });
  it('flag on: sends one message', async () => {
    process.env.ZOE_TERMINALS_DIGEST = '1';
    const send = vi.fn();
    expect(await sendTerminalsDigest({ send, read, scheduled: true })).toBe('sent');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('scheduled digest is held while Zaal has the grill stopped', async () => {
    process.env.ZOE_TERMINALS_DIGEST = '1';
    process.env.ZOE_GRILL_STOP = '1';
    process.env.ZOE_GRILL_PAUSE_PATH = join(__dirname, 'fixtures', 'paused.json');
    const send = vi.fn();
    expect(await sendTerminalsDigest({ send, read, scheduled: true })).toBe('paused');
    expect(send).not.toHaveBeenCalled();
  });
  it('/terminals, which he asked for, answers even while paused', async () => {
    process.env.ZOE_TERMINALS_DIGEST = '1';
    process.env.ZOE_GRILL_STOP = '1';
    process.env.ZOE_GRILL_PAUSE_PATH = join(__dirname, 'fixtures', 'paused.json');
    const send = vi.fn();
    expect(await sendTerminalsDigest({ send, read, scheduled: false })).toBe('sent');
  });
});
