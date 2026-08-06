import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Point persistence at a temp dir (path is read lazily, so setting it here works).
const TMP = mkdtempSync(join(tmpdir(), 'nudge-ladder-test-'));
process.env.ZOE_HOME = TMP;

import {
  nextIntervalMs,
  isPingDue,
  isExhausted,
  startNudge,
  stopNudge,
  markPinged,
  dueTracks,
  MAX_PINGS,
} from '../nudge-ladder';

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const MIN = 60_000;
const HOUR = 60 * MIN;

describe('nextIntervalMs - the ladder phases', () => {
  it('phase 1 (0-10 min) pings ~every 2 min', () => {
    expect(nextIntervalMs(0, 0)).toBeLessThanOrEqual(3 * MIN);
    expect(nextIntervalMs(5 * MIN, 2)).toBeLessThanOrEqual(3 * MIN);
  });
  it('phase 2 (10-60 min) pings ~every 3-4 min', () => {
    const i = nextIntervalMs(30 * MIN, 6);
    expect(i).toBeGreaterThanOrEqual(2.5 * MIN);
    expect(i).toBeLessThanOrEqual(4.5 * MIN);
  });
  it('phase 3 (1-3 h) pings ~every 90 min (twice per 3h)', () => {
    expect(nextIntervalMs(90 * MIN, 15)).toBe(90 * MIN);
  });
  it('phase 4 (3-24 h) decays to every 6 h', () => {
    expect(nextIntervalMs(5 * HOUR, 18)).toBe(6 * HOUR);
  });
  it('long tail (>24 h) is every 24 h - never fully silent', () => {
    expect(nextIntervalMs(30 * HOUR, 25)).toBe(24 * HOUR);
  });
});

describe('isPingDue', () => {
  const track = (over: Partial<Parameters<typeof isPingDue>[0]> = {}) => ({
    qid: 'q1',
    label: 'x',
    options: ['a'],
    startedMs: 0,
    pingMs: [0],
    ...over,
  });
  it('not due right after the original ping', () => {
    expect(isPingDue(track(), 30_000)).toBe(false); // 30s in, interval ~2min
  });
  it('due once the phase-1 interval elapses', () => {
    expect(isPingDue(track(), 3 * MIN)).toBe(true);
  });
  it('is capped at MAX_PINGS (no runaway)', () => {
    const capped = track({ pingMs: Array.from({ length: MAX_PINGS }, (_, i) => i) });
    expect(isPingDue(capped, 10 * 24 * HOUR)).toBe(false);
    expect(isExhausted(capped)).toBe(true);
  });
});

describe('the first-10-minutes burst is ~5 pings', () => {
  it('fires close to 5 pings within 10 minutes', () => {
    let now = 0;
    const t = { qid: 'q', label: 'x', options: ['a'], startedMs: 0, pingMs: [0] };
    let pings = 1; // the original counts
    // step forward in 30s increments across the first 10 min
    for (now = 30_000; now <= 10 * MIN; now += 30_000) {
      if (isPingDue(t, now)) {
        t.pingMs.push(now);
        pings++;
      }
    }
    expect(pings).toBeGreaterThanOrEqual(4);
    expect(pings).toBeLessThanOrEqual(7);
  });
});

describe('persistence + the kill switch', () => {
  it('start -> due after interval -> stop removes it', async () => {
    await startNudge('qX', 'a decision', ['yes', 'no'], 0);
    // not due immediately
    expect((await dueTracks(10_000)).some((t) => t.qid === 'qX')).toBe(false);
    // due after the phase-1 interval
    expect((await dueTracks(3 * MIN)).some((t) => t.qid === 'qX')).toBe(true);
    // stop removes it (the answer kill-switch)
    expect(await stopNudge('qX')).toBe(true);
    expect((await dueTracks(3 * MIN)).some((t) => t.qid === 'qX')).toBe(false);
  });
  it('markPinged advances the schedule so it is not due again immediately', async () => {
    await startNudge('qY', 'b', ['x'], 0);
    await markPinged('qY', 3 * MIN); // re-pinged at 3 min
    expect((await dueTracks(3 * MIN + 20_000)).some((t) => t.qid === 'qY')).toBe(false);
    await stopNudge('qY');
  });
  it('stopNudge on an unknown qid returns false', async () => {
    expect(await stopNudge('nope')).toBe(false);
  });
});
