import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A board card the digest treats as a decision, so it would get a verdict card.
vi.mock('../../cockpit/adapters', () => ({
  fetchCockpitTasks: async () => [
    { id: 'card-1234-5678', title: '[decision] Pick the venue', status: 'todo', priority: 1, due: null, notes: null, next_owner: null },
  ],
}));

import { runNeedsZaalDigest } from '../needs-zaal-digest';
import { setGrillPaused } from '../grill-pause';

// dreamnet-54's review of #3793: the 08:00 and 20:00 digest sends "for the
// grill" questions with verdict buttons and never read the Stop grill pause.

let dir: string;
const refresh = async () => ({ state: 'FRESH' as const, behind: 0, ahead: 0, dirty: false, pulled: 0, headCommittedAt: new Date('2026-10-08T00:00:00Z'), reason: '' });

beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'nzd-pause-'));
  await fs.mkdir(join(dir, 'handoffs', 'status'), { recursive: true });
  await fs.writeFile(join(dir, 'handoffs', 'status', 'lane-a.md'), '# lane-a\n\n## for the grill\n\n- Should the lane ship the widget? Recommended: yes\n');
  process.env.ZOE_GRILL_PAUSE_PATH = join(dir, 'grill-pause.json');
});
afterEach(async () => {
  delete process.env.ZOE_GRILL_STOP;
  delete process.env.ZOE_GRILL_PAUSE_PATH;
  await fs.rm(dir, { recursive: true, force: true });
});

async function run() {
  const sent: { text: string; options?: { reply_markup?: { inline_keyboard: { callback_data: string }[][] } } }[] = [];
  const botApi = { sendMessage: async (_c: number, text: string, options?: never) => { sent.push({ text, options }); return { message_id: sent.length }; } };
  const r = await runNeedsZaalDigest({ botApi, zaalTgId: 1, timeSlot: 'morning', vaultDir: dir, now: new Date('2026-10-08T12:00:00Z'), refresh });
  return { r, sent };
}

describe('needs-zaal digest and the Stop grill pause', () => {
  it('paused: one overview, no grill questions in it, no verdict cards, a Resume button', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    await setGrillPaused(true);
    const { r, sent } = await run();
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toMatch(/grill paused/i);
    expect(sent[0].text).not.toContain('ship the widget');
    expect(sent[0].text).not.toContain('Pick the venue');
    const data = sent[0].options?.reply_markup?.inline_keyboard.flat().map((b) => b.callback_data) ?? [];
    expect(data).toEqual(['gpause:resume']);
    expect(r).toMatchObject({ grillPaused: true, laneCount: 1 });
  });

  it('flag on, not paused: questions and the verdict card go out as before', async () => {
    process.env.ZOE_GRILL_STOP = '1';
    const { r, sent } = await run();
    expect(sent.length).toBe(2);
    expect(sent[0].text).toContain('ship the widget');
    expect(sent[1].options?.reply_markup?.inline_keyboard.flat().some((b) => b.callback_data.startsWith('bg:'))).toBe(true);
    expect(r.grillPaused).toBe(false);
  });

  it('flag off: a leftover pause file changes nothing', async () => {
    await fs.writeFile(process.env.ZOE_GRILL_PAUSE_PATH!, JSON.stringify({ paused: true }));
    const { sent } = await run();
    expect(sent.length).toBe(2);
    expect(sent[0].text).toContain('ship the widget');
  });
});
