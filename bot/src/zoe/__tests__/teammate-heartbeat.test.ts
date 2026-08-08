import { describe, expect, it } from 'vitest';
import {
  askButtons,
  IMAN_DEFAULT,
  isAskDue,
  isSilenceAlertDue,
  localHour,
  renderAsk,
  renderSilenceAlert,
  slotHours,
  type HeartbeatConfig,
} from '../teammate-heartbeat';

/** A UTC instant at a given hour, so tests read as times not epochs. */
const utcAt = (hour: number, day = 1): number => Date.UTC(2026, 7, day, hour, 0, 0);
const H = 3600_000;

describe('localHour - schedule in THEIR time, never the asker\'s', () => {
  it('applies a positive offset', () => {
    expect(localHour(utcAt(8), 2)).toBe(10);
  });

  it('applies a negative offset', () => {
    expect(localHour(utcAt(8), -4)).toBe(4);
  });

  it('wraps past midnight', () => {
    expect(localHour(utcAt(23), 2)).toBe(1);
  });

  it('wraps backwards past midnight', () => {
    expect(localHour(utcAt(1), -4)).toBe(21);
  });

  // The finding that motivated the whole module: Zaal's build window is Iman's
  // night, so a ping scheduled in Zaal's hours lands while Iman is asleep.
  it('confirms Zaal 18:00 ET is Iman midnight', () => {
    const utc = utcAt(22); // 18:00 ET
    expect(localHour(utc, -4)).toBe(18);
    expect(localHour(utc, 2)).toBe(0);
  });
});

describe('slotHours', () => {
  it('gives Iman three asks a day, none at night', () => {
    expect(slotHours(IMAN_DEFAULT)).toEqual([10, 14, 18]);
  });

  it('never schedules past the end of the working window', () => {
    const cfg: HeartbeatConfig = { ...IMAN_DEFAULT, workStartHour: 9, workEndHour: 17, everyHours: 4 };
    expect(slotHours(cfg).every((h) => h <= 17)).toBe(true);
  });
});

describe('isAskDue', () => {
  const base = { cfg: IMAN_DEFAULT, lastAskedUtcMs: null, lastActivityUtcMs: null };

  it('asks at a slot hour inside working hours', () => {
    // 08:00 UTC = 10:00 for Iman - his first slot.
    expect(isAskDue({ ...base, nowUtcMs: utcAt(8) }).due).toBe(true);
  });

  // The single rule that keeps this from becoming the thing he mutes.
  it.each([
    ['his midnight', 22],
    ['his 03:00', 1],
    ['his 08:00, before work', 6],
    ['his 21:00, after work', 19],
  ])('never asks at %s', (_label, utcHour) => {
    const r = isAskDue({ ...base, nowUtcMs: utcAt(utcHour) });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('outside working hours');
  });

  it('does not ask on a non-slot hour', () => {
    // 09:00 UTC = 11:00 his time - inside work, not a slot.
    const r = isAskDue({ ...base, nowUtcMs: utcAt(9) });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('not a slot');
  });

  it('does not ask twice in the same slot', () => {
    const now = utcAt(8);
    const r = isAskDue({ ...base, nowUtcMs: now, lastAskedUtcMs: now - 30 * 60_000 });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('already asked');
  });

  it('tolerates a late cron tick rather than double-asking', () => {
    const now = utcAt(8);
    expect(isAskDue({ ...base, nowUtcMs: now, lastAskedUtcMs: now - 1.9 * H }).due).toBe(false);
  });

  it('asks again at the next slot', () => {
    // Asked at his 10:00, now his 14:00.
    expect(isAskDue({ ...base, nowUtcMs: utcAt(12), lastAskedUtcMs: utcAt(8) }).due).toBe(true);
  });

  // Someone visibly working must never be interrupted to confirm it.
  it('stays quiet when they have been active recently', () => {
    const now = utcAt(12);
    const r = isAskDue({ ...base, nowUtcMs: now, lastActivityUtcMs: now - 1 * H });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('active recently');
  });

  it('asks when activity has gone stale', () => {
    const now = utcAt(12);
    expect(isAskDue({ ...base, nowUtcMs: now, lastActivityUtcMs: now - 6 * H }).due).toBe(true);
  });
});

describe('isSilenceAlertDue - the asker learns in 8h, not 24', () => {
  const base = { cfg: IMAN_DEFAULT, lastAlertUtcMs: null };

  it('reports silence after two slots during their working day', () => {
    const now = utcAt(12); // his 14:00
    const r = isSilenceAlertDue({ ...base, nowUtcMs: now, lastActivityUtcMs: now - 9 * H });
    expect(r.due).toBe(true);
    expect(r.reason).toContain('9h');
  });

  // A normal night must never look like a problem. This is the rule that keeps
  // the alert meaningful.
  it('never fires during their night, however long the quiet', () => {
    const now = utcAt(23); // his 01:00
    const r = isSilenceAlertDue({ ...base, nowUtcMs: now, lastActivityUtcMs: now - 20 * H });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('night');
  });

  it('does not fire on a short quiet spell', () => {
    const now = utcAt(12);
    expect(isSilenceAlertDue({ ...base, nowUtcMs: now, lastActivityUtcMs: now - 3 * H }).due).toBe(false);
  });

  it('reports once, not repeatedly - a repeating alarm gets muted', () => {
    const now = utcAt(12);
    const r = isSilenceAlertDue({
      ...base,
      nowUtcMs: now,
      lastActivityUtcMs: now - 12 * H,
      lastAlertUtcMs: now - 2 * H,
    });
    expect(r.due).toBe(false);
    expect(r.reason).toContain('already reported');
  });

  it('does not fire without an activity baseline', () => {
    expect(isSilenceAlertDue({ ...base, nowUtcMs: utcAt(12), lastActivityUtcMs: null }).due).toBe(false);
  });
});

describe('the messages', () => {
  // Posted in ZAO Devz, addressed to them - not a DM.
  it('addresses them by handle so it reads as a group message', () => {
    const out = renderAsk(['Upload COC Concertz 5 and 6'], IMAN_DEFAULT);
    expect(out.startsWith('@iman')).toBe(true);
  });

  it('names the open work so a reply can be a tap', () => {
    const out = renderAsk(['Upload COC Concertz 5 and 6', 'Review ZAO whitepapers']);
    expect(out).toContain('what are you on');
    expect(out).toContain('Upload COC Concertz');
  });

  it('works with nothing open', () => {
    expect(renderAsk([])).toContain('what are you on');
  });

  it('always offers buttons, including a way to say blocked', () => {
    const b = askButtons(['Upload COC Concertz 5 and 6']);
    expect(b.length).toBeGreaterThanOrEqual(2);
    expect(b.some((x) => /blocked/i.test(x))).toBe(true);
  });

  // Stating their local time is what stops the asker reading sleep as slacking.
  it('the alert states their local time', () => {
    const out = renderSilenceAlert(IMAN_DEFAULT, 9, utcAt(12));
    expect(out).toContain('iman');
    expect(out).toContain('9h');
    expect(out).toContain('14:00');
  });
});
