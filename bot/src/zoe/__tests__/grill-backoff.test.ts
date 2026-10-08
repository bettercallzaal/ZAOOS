import { afterEach, describe, expect, it } from 'vitest';
import { pickNext, recordAsk, type GrillItem, type GrillState } from '../grill';

// Zaal ruled D on seat item 52 (vault ref 5cdacb05): ask a card once; if it is
// unanswered ask again the next day, then 3 days later, then a week later;
// after that it appears only in the 8am and 8pm digest, never as a push. The
// five daily slots go to different cards.
//
// The shape this replaces, measured from the VPS send log for 2026-10-07 ET:
// "Decision needed: Post the Space 1 summary ..." (a card first raised
// 2026-09-26) was pushed at 05:00, 06:00, 07:00, 20:00 and 21:00 ET plus once in
// the morning batch, because a card over 7 days old had a 45-minute cooldown
// and was the most urgent item every hour.

afterEach(() => {
  delete process.env.ZOE_GRILL_BACKOFF;
});

const ET = (h: number, d = 7) => Date.parse(`2026-10-${String(d).padStart(2, '0')}T${String(h + 4).padStart(2, '0')}:00:00Z`);
const card = (key: string, priority: number): GrillItem => ({ key, kind: 'decision', title: `card ${key}`, priority });
const SPACE1 = card('space1', 0);
const OTHERS = ['b', 'c', 'd', 'e', 'f', 'g'].map((k) => card(k, 1));
const queue = [SPACE1, ...OTHERS];

/** Every card had been asked once on 2026-10-06; Space 1 was first raised 2026-09-26. */
function stateOn1006(): GrillState {
  const s: GrillState = { items: {}, activeKey: null, lastAskedAt: null };
  s.items.space1 = { askedAt: '2026-10-06T23:00:00.000Z', firstAskedAt: '2026-09-26T13:00:00.000Z', status: 'asked' };
  for (const c of OTHERS) s.items[c.key] = { askedAt: '2026-10-06T13:00:00.000Z', firstAskedAt: '2026-10-06T13:00:00.000Z', status: 'asked' };
  return s;
}

/** The hourly grill cron, 05:00 to 21:00 ET, capped at 5 pushes a day. */
function runDay(state: GrillState, day: number): string[] {
  const asked: string[] = [];
  for (let h = 5; h <= 21 && asked.length < 5; h++) {
    const item = pickNext(queue, state, ET(h, day));
    if (!item) continue;
    recordAsk(state, item, ET(h, day));
    asked.push(item.key);
  }
  return asked;
}

describe('red control: the 2026-10-07 shape, one card fills the day', () => {
  it('flag off: Space 1 takes all 5 slots, as it did on the VPS', () => {
    const asked = runDay(stateOn1006(), 7);
    expect(asked.filter((k) => k === 'space1')).toHaveLength(5);
  });

  it('flag on: the 5 slots go to 5 different cards', () => {
    process.env.ZOE_GRILL_BACKOFF = '1';
    const asked = runDay(stateOn1006(), 7);
    expect(asked).toHaveLength(5);
    expect(new Set(asked).size).toBe(5);
  });
});

describe('ZOE_GRILL_BACKOFF cadence: once, +1 day, +3 days, +7 days, then digest only', () => {
  it('walks the ladder and then stops pushing', () => {
    process.env.ZOE_GRILL_BACKOFF = '1';
    const one = [card('x', 0)];
    const s: GrillState = { items: {}, activeKey: null, lastAskedAt: null };
    const t0 = Date.parse('2026-10-08T12:00:00Z');
    const H = 3_600_000;
    const D = 24 * H;
    recordAsk(s, one[0], t0);
    expect(s.items.x.askCount).toBe(1);
    expect(pickNext(one, s, t0 + 23 * H)).toBeNull();
    expect(pickNext(one, s, t0 + 1 * D)?.key).toBe('x');
    recordAsk(s, one[0], t0 + 1 * D);
    expect(pickNext(one, s, t0 + 3 * D)).toBeNull();
    expect(pickNext(one, s, t0 + 4 * D)?.key).toBe('x');
    recordAsk(s, one[0], t0 + 4 * D);
    expect(pickNext(one, s, t0 + 10 * D)).toBeNull();
    expect(pickNext(one, s, t0 + 11 * D)?.key).toBe('x');
    recordAsk(s, one[0], t0 + 11 * D);
    expect(s.items.x.askCount).toBe(4);
    // After the weekly ask: never pushed again. It stays on the board, and the
    // needs-Zaal digest lists open decisions, so it still appears there.
    expect(pickNext(one, s, t0 + 60 * D)).toBeNull();
  });

  it('a state file written before askCount existed reads as asked once', () => {
    process.env.ZOE_GRILL_BACKOFF = '1';
    const s: GrillState = { items: { x: { askedAt: '2026-10-07T12:00:00.000Z', status: 'asked' } }, activeKey: null, lastAskedAt: null };
    expect(pickNext([card('x', 0)], s, Date.parse('2026-10-08T11:00:00Z'))).toBeNull();
    expect(pickNext([card('x', 0)], s, Date.parse('2026-10-08T12:00:00Z'))?.key).toBe('x');
  });

  it('a skipped card waits on the same ladder instead of coming straight back', () => {
    process.env.ZOE_GRILL_BACKOFF = '1';
    const s: GrillState = { items: { x: { askedAt: '2026-10-08T12:00:00.000Z', status: 'skipped', askCount: 1 } }, activeKey: null, lastAskedAt: null };
    expect(pickNext([card('x', 0)], s, Date.parse('2026-10-08T13:00:00Z'))).toBeNull();
  });

  it('done is still done, and a never-asked card still goes first', () => {
    process.env.ZOE_GRILL_BACKOFF = '1';
    const s: GrillState = { items: { x: { askedAt: '2026-10-01T12:00:00.000Z', status: 'done', askCount: 1 } }, activeKey: null, lastAskedAt: null };
    expect(pickNext([card('x', 0), card('y', 1)], s, Date.parse('2026-10-08T12:00:00Z'))?.key).toBe('y');
  });

  it('flag off: a skipped card comes straight back, as before', () => {
    const s: GrillState = { items: { x: { askedAt: '2026-10-08T12:00:00.000Z', status: 'skipped' } }, activeKey: null, lastAskedAt: null };
    expect(pickNext([card('x', 0)], s, Date.parse('2026-10-08T13:00:00Z'))?.key).toBe('x');
  });
});
