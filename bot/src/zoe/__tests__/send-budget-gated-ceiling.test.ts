// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  applyGatedCeiling,
  decide,
  DEFAULT_GATED_HOURLY_CAP,
  gatedHourlyCap,
  pruneGatedWindow,
  gateSend,
  readDeferred,
  resetSendBudgetForTest,
  runWithSendClass,
} from '../send-budget';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-gated-ceiling-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
  vi.stubEnv('ZOE_DAILY_SEND_CAP', '3');
  resetSendBudgetForTest();
});
afterEach(async () => {
  vi.unstubAllEnvs();
  resetSendBudgetForTest();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('gatedHourlyCap', () => {
  it('is off unless ZOE_ATTENTION=1 or the cap is set', () => {
    expect(gatedHourlyCap({})).toBeNull();
    expect(gatedHourlyCap({ ZOE_ATTENTION: '1' })).toBe(DEFAULT_GATED_HOURLY_CAP);
    expect(gatedHourlyCap({ ZOE_GATED_HOURLY_CAP: '5' })).toBe(5);
    expect(gatedHourlyCap({ ZOE_GATED_HOURLY_CAP: 'garbage' })).toBe(DEFAULT_GATED_HOURLY_CAP);
  });
});

describe('applyGatedCeiling (pure)', () => {
  const gated = decide('gated', 50, 3); // over the daily cap, still passes
  it('passes gated below the ceiling, defers at it', () => {
    expect(gated.allow).toBe(true);
    expect(applyGatedCeiling(gated, 19, 20).allow).toBe(true);
    const held = applyGatedCeiling(gated, 20, 20);
    expect(held).toMatchObject({ outcome: 'deferred', allow: false, counts: false });
    expect(held.reason).toContain('gated hourly ceiling (20/20)');
  });

  it('leaves every other class, and an inactive ceiling, alone', () => {
    for (const cls of ['reply', 'alarm', 'morning', 'digest', 'status'] as const) {
      const d = decide(cls, 0, 3);
      expect(applyGatedCeiling(d, 999, 20)).toBe(d);
    }
    expect(applyGatedCeiling(gated, 999, null)).toBe(gated);
  });
});

describe('gateSend with the ceiling', () => {
  async function sendGated(n: number, at: () => Date) {
    const raw = vi.fn(async () => ({ message_id: 1 }));
    const send = gateSend(raw as never, at);
    for (let i = 0; i < n; i++) await runWithSendClass('gated', () => send(7, `relay ${i}`));
    return raw;
  }

  it('red control: ceiling off, a relay loop of 30 all goes out', async () => {
    const raw = await sendGated(30, () => new Date('2026-10-09T12:00:00Z'));
    expect(raw).toHaveBeenCalledTimes(30);
  });

  it('ZOE_ATTENTION=1: 20 go out in the hour, the rest wait for the morning batch', async () => {
    vi.stubEnv('ZOE_ATTENTION', '1');
    const raw = await sendGated(30, () => new Date('2026-10-09T12:00:00Z'));
    expect(raw).toHaveBeenCalledTimes(20);
    const held = await readDeferred();
    expect(held).toHaveLength(10);
    expect(held[0]).toMatchObject({ cls: 'gated', chatId: 7, text: 'relay 20' });
  });

  it('the window slides: an hour later gated sends pass again', async () => {
    vi.stubEnv('ZOE_GATED_HOURLY_CAP', '2');
    let now = Date.parse('2026-10-09T12:00:00Z');
    const raw = await sendGated(3, () => new Date(now));
    expect(raw).toHaveBeenCalledTimes(2);
    now += 60 * 60 * 1000;
    expect(pruneGatedWindow([now - 60 * 60 * 1000, now - 1], now)).toEqual([now - 1]);
    const raw2 = await sendGated(1, () => new Date(now));
    expect(raw2).toHaveBeenCalledTimes(1);
  });

  it('a restart does not reset the window: the hour is read back from send-budget.json', async () => {
    vi.stubEnv('ZOE_ATTENTION', '1');
    const at = () => new Date('2026-10-09T12:00:00Z');
    expect(await sendGated(20, at)).toHaveBeenCalledTimes(20);
    // Simulate a crash and restart: forget everything held in memory.
    resetSendBudgetForTest();
    const afterRestart = await sendGated(5, () => new Date('2026-10-09T12:10:00Z'));
    expect(afterRestart).not.toHaveBeenCalled();
    expect(await readDeferred()).toHaveLength(5);
    const onDisk = JSON.parse(await fs.readFile(join(tmp, 'send-budget.json'), 'utf8'));
    expect(onDisk.gatedAt).toHaveLength(20);
  });

  it('the window survives midnight while the daily counter resets', async () => {
    vi.stubEnv('ZOE_GATED_HOURLY_CAP', '2');
    // 23:50 and 23:55 ET on 10-09 (03:50Z / 03:55Z on 10-10), then 00:05 ET.
    await sendGated(2, () => new Date('2026-10-10T03:50:00Z'));
    resetSendBudgetForTest();
    const raw = await sendGated(1, () => new Date('2026-10-10T04:05:00Z'));
    expect(raw).not.toHaveBeenCalled();
  });
});

