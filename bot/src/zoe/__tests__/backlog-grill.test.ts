import { describe, expect, it } from 'vitest';
import {
  classifyReconcile,
  DRIP_DEFAULT,
  parseVerdict,
  renderCard,
  shouldSendNext,
  TERMINAL_VERDICT_RE,
  verdictButtons,
  verdictNote,
  VERDICTS,
} from '../backlog-grill';

describe('parseVerdict - a thumb at a traffic light', () => {
  it.each([
    ['1', 'done'],
    ['2', 'keep'],
    ['3', 'work'],
    ['4', 'drop'],
    ['5', 'skip'],
  ])('a bare "%s" is %s', (reply, key) => {
    expect(parseVerdict(reply)?.key).toBe(key);
  });

  it.each(['1.', '1)', '1 -', ' 1 '])('tolerates punctuation and spacing: %s', (reply) => {
    expect(parseVerdict(reply)?.key).toBe('done');
  });

  it('accepts the word instead of the number', () => {
    expect(parseVerdict('done')?.key).toBe('done');
    expect(parseVerdict('drop')?.key).toBe('drop');
    expect(parseVerdict('work on it')?.key).toBe('work');
  });

  // "1" and "1 but ask iman first" mean different things, and the second is the
  // more valuable message. Never discard the words.
  it('keeps what he typed alongside the number', () => {
    const v = parseVerdict('1 but check with iman first');
    expect(v?.key).toBe('done');
    expect(v?.note).toBe('but check with iman first');
  });

  // A sentence is a richer answer than a digit. Dropping it because it did not
  // start with a number would be the wrong call.
  it('treats free text as work-on-it with the text as the brief', () => {
    const v = parseVerdict('actually split this into two and do the first half');
    expect(v?.key).toBe('work');
    expect(v?.note).toContain('split this into two');
  });

  it('returns null for nothing', () => {
    expect(parseVerdict('')).toBeNull();
    expect(parseVerdict('   ')).toBeNull();
  });

  it('ignores a number outside 1-5 as a choice', () => {
    const v = parseVerdict('9');
    expect(v?.key).toBe('work');
    expect(v?.note).toBe('9');
  });
});

describe('the verdict shape', () => {
  // A task is never done because work STARTED. It comes back for confirmation.
  it('work and skip go back in the queue', () => {
    expect(parseVerdict('3')?.requeue).toBe(true);
    expect(parseVerdict('5')?.requeue).toBe(true);
  });

  it('done, keep and drop do not requeue', () => {
    for (const r of ['1', '2', '4']) expect(parseVerdict(r)?.requeue).toBe(false);
  });

  it('only done and drop close the task', () => {
    expect(parseVerdict('1')?.closesTask).toBe(true);
    expect(parseVerdict('4')?.closesTask).toBe(true);
    expect(parseVerdict('2')?.closesTask).toBe(false);
    expect(parseVerdict('3')?.closesTask).toBe(false);
  });

  it('the five never reorder - the numbers are muscle memory', () => {
    expect(VERDICTS.map((v) => v.key)).toEqual(['done', 'keep', 'work', 'drop', 'skip']);
  });
});

describe('renderCard', () => {
  const task = { title: 'Fix Fractal documentation', createdAt: '2026-07-07T00:00:00Z' };
  const now = Date.parse('2026-08-08T00:00:00Z');

  it('shows position so the sweep has an end in sight', () => {
    expect(renderCard(task, { index: 3, total: 320 }, now)).toContain('3/320');
  });

  it('shows the age - a 32-day-old task deserves a different answer', () => {
    expect(renderCard(task, { index: 1, total: 10 }, now)).toContain('open 32d');
  });

  it('lists all five options', () => {
    const out = renderCard(task, { index: 1, total: 10 }, now);
    for (const v of VERDICTS) expect(out).toContain(`${v.n}. ${v.label}`);
  });

  it('includes a real why', () => {
    const out = renderCard({ ...task, why: 'Audit written in doc 1306 but bios still dead' }, { index: 1, total: 5 }, now);
    expect(out).toContain('bios still dead');
  });

  // 13 of Iman's 20 open tasks carry this exact boilerplate. It costs a line
  // and says nothing.
  it('never shows the boilerplate note', () => {
    const out = renderCard(
      { ...task, why: 'Action item captured from forwarded email. Reply to Claude in next session if blocked' },
      { index: 1, total: 5 },
      now,
    );
    expect(out).not.toContain('Reply to Claude');
  });

  it('survives a task with no date or why', () => {
    expect(() => renderCard({ title: 'bare' }, { index: 1, total: 1 }, now)).not.toThrow();
  });
});

describe('verdictButtons', () => {
  it('offers all five as taps', () => {
    const flat = verdictButtons('t1').flat();
    expect(flat).toHaveLength(5);
    for (const v of VERDICTS) expect(flat.some((b) => b.text.startsWith(String(v.n)))).toBe(true);
  });

  // The bug this guards: cards pile up by design, so a button that named only
  // the verdict got applied to whatever card was sent LAST - closing the wrong
  // board task. Every tap has to carry its own subject.
  it('names the task each tap belongs to', () => {
    const flat = verdictButtons('abc-123').flat();
    for (const b of flat) expect(b.data.endsWith(':abc-123')).toBe(true);
    expect(new Set(flat.map((b) => b.data)).size).toBe(5);
  });

  // Telegram rejects callback_data over 64 bytes, which would make the whole
  // card fail to send.
  it('stays inside the 64-byte callback_data limit for a uuid', () => {
    const uuid = '0f2b8c1e-9a4d-4e77-b3c1-6d5a2f8e91ab';
    for (const b of verdictButtons(uuid).flat()) {
      expect(Buffer.byteLength(b.data, 'utf8')).toBeLessThanOrEqual(64);
    }
  });
});

describe('shouldSendNext - a pile is the feature, a flood is not', () => {
  const base = { nowMs: 1_000_000_000, localHour: 12, lastSentMs: null, outstanding: 0, remainingInQueue: 100 };

  it('sends when due', () => {
    expect(shouldSendNext(base).send).toBe(true);
  });

  it('waits out the interval', () => {
    const r = shouldSendNext({ ...base, lastSentMs: base.nowMs - 30_000 });
    expect(r.send).toBe(false);
    expect(r.reason).toContain('too soon');
  });

  it('sends once the interval has passed', () => {
    expect(shouldSendNext({ ...base, lastSentMs: base.nowMs - 3 * 60_000 }).send).toBe(true);
  });

  // Unbounded, the pile becomes a wall he never opens.
  it('stops adding when too many are unanswered', () => {
    const r = shouldSendNext({ ...base, outstanding: DRIP_DEFAULT.maxOutstanding });
    expect(r.send).toBe(false);
    expect(r.reason).toContain('catch up');
  });

  it('resumes once he has cleared some', () => {
    expect(shouldSendNext({ ...base, outstanding: 5 }).send).toBe(true);
  });

  it.each([3, 23, 0])('stays quiet at %s:00 local', (localHour) => {
    expect(shouldSendNext({ ...base, localHour }).send).toBe(false);
  });

  it('stops when the queue is empty', () => {
    const r = shouldSendNext({ ...base, remainingInQueue: 0 });
    expect(r.send).toBe(false);
    expect(r.reason).toContain('empty');
  });
});

describe('verdictNote - every change explains itself', () => {
  it('records what was chosen', () => {
    expect(verdictNote(parseVerdict('1')!, '2026-08-08')).toContain('confirmed done');
    expect(verdictNote(parseVerdict('4')!, '2026-08-08')).toContain('dropped');
  });

  it('quotes what he typed', () => {
    const note = verdictNote(parseVerdict('1 ask iman to verify')!, '2026-08-08');
    expect(note).toContain('ask iman to verify');
  });

  it('never claims done for a drop', () => {
    expect(verdictNote(parseVerdict('4')!, '2026-08-08')).not.toContain('confirmed done');
  });
});

// ── grill unification (card 6b6875d1) ───────────────────────────────────────

describe('TERMINAL_VERDICT_RE - the verdict forms measured on the live board', () => {
  it('matches every form actually found in task notes (2026-08-19 audit)', () => {
    expect(TERMINAL_VERDICT_RE.test('GRILL 2026-08-19 (Zaal): route to AGENT.')).toBe(true);
    expect(TERMINAL_VERDICT_RE.test('ZAAL VERDICT 2026-08-19: combine the grills.')).toBe(true);
    expect(TERMINAL_VERDICT_RE.test('GRILL 2026-08-18 (Telegram): confirmed done.')).toBe(true);
    expect(TERMINAL_VERDICT_RE.test('context above\n  GRILL 2026-08-19 (Zaal): mid-notes.')).toBe(true);
  });

  it('does not fire on prose that merely mentions the grill', () => {
    expect(TERMINAL_VERDICT_RE.test('add this to the grill queue later')).toBe(false);
    expect(TERMINAL_VERDICT_RE.test('the GRILL ran on some date')).toBe(false);
    expect(TERMINAL_VERDICT_RE.test('')).toBe(false);
  });
});

describe('classifyReconcile - what the other end settled', () => {
  it('board-closed for a missing, done, or archived row', () => {
    expect(classifyReconcile(undefined)).toBe('board-closed');
    expect(classifyReconcile({ status: 'done', archived_at: null })).toBe('board-closed');
    expect(classifyReconcile({ status: 'in_progress', archived_at: null })).toBe('board-closed');
    expect(classifyReconcile({ status: 'todo', archived_at: '2026-08-19T00:00:00Z' })).toBe('board-closed');
  });

  it('verdict-synced for a still-todo row carrying a terminal verdict', () => {
    expect(
      classifyReconcile({ status: 'todo', archived_at: null, notes: 'GRILL 2026-08-19 (Zaal): keep.' }),
    ).toBe('verdict-synced');
  });

  it('null for a genuinely open row - reconcile must be able to touch nothing', () => {
    expect(classifyReconcile({ status: 'todo', archived_at: null, notes: 'no ruling yet' })).toBeNull();
    expect(classifyReconcile({ status: 'todo', archived_at: null })).toBeNull();
  });
});
