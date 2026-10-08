import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isGrillPaused, setGrillPaused, withStopRow } from '../grill-pause';
import { formatGrill, surfaceGrill, type GrillItem } from '../grill';
import { runBacklogGrillTick } from '../backlog-grill-runner';

// Zaal, 2026-10-07: "have one button be there always to stop grill". The pause
// is a file, so it survives a restart, and every grill send checks it first.

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'grill-pause-'));
  process.env.ZOE_GRILL_PAUSE_PATH = join(dir, 'grill-pause.json');
});
afterEach(async () => {
  delete process.env.ZOE_GRILL_STOP;
  delete process.env.ZOE_GRILL_ABCD;
  delete process.env.ZOE_GRILL_PAUSE_PATH;
  await fs.rm(dir, { recursive: true, force: true });
});

const decision: GrillItem = { key: 't1', kind: 'decision', title: 'Which venue: 1: parklet / 2: hall / 3: both', priority: 1 };

describe('ZOE_GRILL_STOP - the stop button and the stored pause', () => {
  it('flag on: every grill keyboard ends with Stop grill', () => {
    process.env.ZOE_GRILL_STOP = '1';
    const { buttons } = formatGrill(decision, 0);
    expect(buttons.at(-1)).toEqual([{ text: 'Stop grill', data: 'gpause:stop' }]);
    expect(withStopRow([[{ text: '1 Done', data: 'bg:done:x' }]]).at(-1)?.[0].data).toBe('gpause:stop');
  });

  it('flag off: no stop row, keyboards exactly as before', () => {
    const { buttons } = formatGrill(decision, 0);
    expect(buttons.flat().some((b) => b.data === 'gpause:stop')).toBe(false);
  });

  it('pause is stored on disk, so a fresh read after a restart still sees it', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    await setGrillPaused(true, Date.parse('2026-10-07T20:00:00Z'));
    const raw = JSON.parse(await fs.readFile(process.env.ZOE_GRILL_PAUSE_PATH!, 'utf8'));
    expect(raw).toMatchObject({ paused: true, at: '2026-10-07T20:00:00.000Z' });
    expect(await isGrillPaused()).toBe(true);
    await setGrillPaused(false);
    expect(await isGrillPaused()).toBe(false);
  });

  it('an unreadable pause file holds the pause rather than resuming pings', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    await fs.writeFile(process.env.ZOE_GRILL_PAUSE_PATH!, '{not json');
    expect(await isGrillPaused()).toBe(true);
  });

  it('no pause file means not paused', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    expect(await isGrillPaused()).toBe(false);
  });

  it('paused: surfaceGrill sends nothing and fetches nothing', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    await setGrillPaused(true);
    const sendDM = vi.fn();
    const fetchTasks = vi.fn(async () => []);
    const r = await surfaceGrill({ sendDM, fetchTasks, fetchPRs: async () => [], fetchEvents: async () => [], bypassCap: true });
    expect(r).toMatchObject({ sent: false, paused: true });
    expect(sendDM).not.toHaveBeenCalled();
    expect(fetchTasks).not.toHaveBeenCalled();
  });

  it('paused: the backlog grill sends nothing', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    await setGrillPaused(true);
    const sendDM = vi.fn();
    const r = await runBacklogGrillTick({ sendDM } as never);
    expect(r).toMatchObject({ sent: false, reason: 'grill paused by Zaal' });
    expect(sendDM).not.toHaveBeenCalled();
  });

  it('flag off: a pause file left behind is ignored', async () => {
    await fs.writeFile(process.env.ZOE_GRILL_PAUSE_PATH!, JSON.stringify({ paused: true }));
    expect(await isGrillPaused()).toBe(false);
    const r = await runBacklogGrillTick({ sendDM: vi.fn() } as never);
    expect(r.reason).not.toBe('grill paused by Zaal');
  });
});

describe('ZOE_GRILL_ABCD - lettered options, recommendation first', () => {
  it('flag on: options are lettered A, B, C and A is marked recommended', () => {
    process.env.ZOE_GRILL_ABCD = '1';
    const { text, buttons, options } = formatGrill(decision, 0);
    expect(buttons[0].map((b) => b.text)).toEqual(['A: parklet', 'B: hall', 'C: both']);
    expect(buttons[0].map((b) => b.data)).toEqual(['grill:ans:1', 'grill:ans:2', 'grill:ans:3']);
    expect(text).toContain('A) parklet (recommended)');
    expect(text).toContain('B) hall');
    expect(options.map((o) => o.value)).toEqual(['1', '2', '3']);
  });

  it('flag on: an option marked recommended moves to A', () => {
    process.env.ZOE_GRILL_ABCD = '1';
    const item = { ...decision, title: 'Ship it: yes / no / wait (recommended)' };
    const { buttons, text } = formatGrill(item, 0);
    expect(buttons[0][0]).toEqual({ text: 'A: wait', data: 'grill:ans:wait' });
    expect(text).toContain('A) wait (recommended)');
  });

  it('flag off: buttons read exactly as before', () => {
    const { buttons } = formatGrill(decision, 0);
    expect(buttons[0].map((b) => b.text)).toEqual(['1: parklet', '2: hall', '3: both']);
  });
});
