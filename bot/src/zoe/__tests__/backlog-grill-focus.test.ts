import { describe, expect, it } from 'vitest';
import { focusHorizon, isOffClock } from '../backlog-grill';

// The ten cards ZOE sent on 2026-09-28 and that jammed the phone for 10 hours,
// shaped like the real rows: every one parked to 2026-10-06 or typed as lane work.
const SENT_2026_09_28 = [
  { due: '2026-10-06T00:00:00+00:00', metadata: { card_type: 'review' } },
  { due: '2026-10-06T00:00:00+00:00', metadata: { card_type: 'build' } },
];

describe('isOffClock - the phone asks only what the terminal counts', () => {
  const h = '2026-10-04';
  it('holds a card parked past the horizon', () => {
    expect(isOffClock({ due: '2026-10-06T00:00:00+00:00', metadata: { card_type: 'hand' } }, h)).toBe(true);
  });
  it('holds lane work (build, review, record) even when due inside the horizon', () => {
    for (const t of ['build', 'review', 'record']) {
      expect(isOffClock({ due: '2026-09-30T00:00:00+00:00', metadata: { card_type: t } }, h)).toBe(true);
    }
  });
  it('holds an untyped lane handoff', () => {
    expect(isOffClock({ due: null, metadata: {}, legacy_source: 'handoff:zaostock' }, h)).toBe(true);
  });
  it('asks his-hand types due inside the horizon', () => {
    for (const t of ['hand', 'decision', 'ask']) {
      expect(isOffClock({ due: '2026-09-28T00:00:00+00:00', metadata: { card_type: t } }, h)).toBe(false);
    }
  });
  it('asks an undated untyped card - undated counts, as in zao-todo-week', () => {
    expect(isOffClock({ due: null, metadata: {}, legacy_source: 'inbox' }, h)).toBe(false);
  });
  it('asks a card due ON the horizon', () => {
    expect(isOffClock({ due: '2026-10-04T12:00:00+00:00', metadata: { card_type: 'ask' } }, h)).toBe(false);
  });
  it('holds every one of the ten cards that jammed the phone on 2026-09-28', () => {
    for (const r of SENT_2026_09_28) expect(isOffClock(r, h)).toBe(true);
  });
  it('an unknown metadata shape never hides a card that names no type', () => {
    expect(isOffClock({ due: null, metadata: 'garbage' as unknown, legacy_source: null }, h)).toBe(false);
  });
});

describe('focusHorizon', () => {
  const now = Date.parse('2026-09-28T15:00:00Z');
  it('defaults to today plus six days, like zao-todo-week', () => {
    expect(focusHorizon(now, undefined)).toBe('2026-10-04');
  });
  it('honours ZAO_FOCUS_DATE when it is a real date', () => {
    expect(focusHorizon(now, '2026-10-03')).toBe('2026-10-03');
  });
  it('ignores a malformed focus date rather than widening to everything', () => {
    expect(focusHorizon(now, 'garbage')).toBe('2026-10-04');
  });
});
