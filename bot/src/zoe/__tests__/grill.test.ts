import { describe, it, expect } from 'vitest';
import {
  toQueue,
  pickNext,
  formatGrill,
  parseOptions,
  matchTypedAnswer,
  toggleSelection,
  multiKeyboard,
  type GrillState,
} from '../grill';
import type { CockpitTask, ReviewPR } from '../../cockpit/types';

function task(over: Partial<CockpitTask>): CockpitTask {
  return {
    id: '1',
    title: 'a task',
    status: 'todo',
    priority: 'P2',
    due: null,
    legacy_id: null,
    next_owner: null,
    ...over,
  } as CockpitTask;
}
function pr(over: Partial<ReviewPR>): ReviewPR {
  return { url: 'https://github.com/x/y/pull/1', title: 'a PR', ...over } as ReviewPR;
}

const emptyState: GrillState = { items: {}, activeKey: null, lastAskedAt: null };

describe('toQueue', () => {
  it('includes need-you decisions, review PRs, and blocked - ranked by urgency', () => {
    const tasks = [
      task({ id: '1', title: 'P0 decision', priority: 'P0', next_owner: 'me' }),
      task({ id: '2', title: 'not mine', next_owner: null, priority: 'P2' }), // excluded
      task({ id: '3', title: 'blocked thing', next_owner: 'blocked' }),
    ];
    const prs = [pr({ url: 'u1', title: 'review me' })];
    const q = toQueue(tasks, prs);
    const kinds = q.map((i) => i.kind);
    // P0 decision (0) < review (2) < blocked (3)
    expect(q[0].title).toBe('P0 decision');
    expect(kinds).toContain('review');
    expect(kinds).toContain('blocked');
    expect(q.map((i) => i.title)).not.toContain('not mine');
  });

  it("today's events lead the queue (priority -1, above P0) so the day starts with the schedule", () => {
    const tasks = [task({ id: '1', title: 'P0 decision', priority: 'P0', next_owner: 'me' })];
    const events = [{ key: 'evt:abc', title: '5:30pm - Promotions Committee @ Franklin St' }];
    const q = toQueue(tasks, [], events);
    expect(q[0].kind).toBe('event');
    expect(q[0].title).toContain('Promotions Committee');
    expect(q[1].title).toBe('P0 decision');
  });

  it('dedupes by key keeping the most urgent', () => {
    const tasks = [task({ id: '5', legacy_id: 'k', title: 'P1', priority: 'P1', next_owner: 'me' })];
    const q = toQueue([...tasks, ...tasks], []);
    expect(q.filter((i) => i.key === 'k')).toHaveLength(1);
  });
});

describe('pickNext', () => {
  const queue = toQueue([task({ id: '1', legacy_id: 'a', title: 'A', priority: 'P0', next_owner: 'me' })], []);

  it('picks a never-asked item', () => {
    expect(pickNext(queue, emptyState, 1000)?.key).toBe('a');
  });
  it('skips a done item', () => {
    const s: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'done' } } };
    expect(pickNext(queue, s, Date.now())).toBeNull();
  });
  it('does not re-nag an asked item within cooldown', () => {
    const now = Date.parse('2026-07-25T00:00:00Z');
    const s: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'asked' } } };
    expect(pickNext(queue, s, now + 60_000)).toBeNull(); // 1 min later, still cooling
    expect(pickNext(queue, s, now + 4 * 3600_000)?.key).toBe('a'); // 4h later, re-surface
  });
  it('re-surfaces a skipped item + respects snooze window', () => {
    const now = Date.parse('2026-07-25T00:00:00Z');
    const skipped: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'skipped' } } };
    expect(pickNext(queue, skipped, now)?.key).toBe('a');
    const snoozed: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'snoozed', snoozeUntil: '2026-07-25T06:00:00Z' } } };
    expect(pickNext(queue, snoozed, now + 3600_000)).toBeNull(); // still snoozed
    expect(pickNext(queue, snoozed, Date.parse('2026-07-25T07:00:00Z'))?.key).toBe('a'); // snooze elapsed
  });
});

describe('formatGrill', () => {
  it('frames a review as build-to-test with a link + calm cockpit pointer (no guilt-count)', () => {
    const { text, buttons } = formatGrill({ key: 'u', kind: 'review', title: 'PR X', link: 'https://gh/pr/1', priority: 2 }, 3);
    expect(text).toContain('review/test');
    expect(text).toContain('https://gh/pr/1');
    // reframed: the old "N more waiting" guilt-count is gone; the rest live in /cockpit
    expect(text).toContain('/cockpit');
    expect(text).not.toContain('more waiting');
    expect(buttons[0][0].text).toBe('Reviewed');
    expect(buttons[0].map((b) => b.data)).toEqual(['grill:done', 'grill:skip', 'grill:snooze']);
  });
  it('renders one-line context from task notes so the card explains itself', () => {
    const { text } = formatGrill(
      { key: 'k', kind: 'decision', title: 'lock token config', priority: 1, context: 'freezes supply + 50%/mo emissions' },
      0,
    );
    expect(text).toContain('lock token config');
    expect(text).toContain('freezes supply');
  });
  it('frames a decision plainly with no counter when none remain', () => {
    const { text } = formatGrill({ key: 'a', kind: 'decision', title: 'pick 1 or 2', priority: 0 }, 0);
    expect(text).toContain('Decision needed');
    expect(text).not.toContain('more waiting');
  });
});

describe('parseOptions (one-click)', () => {
  it('parses numbered options with labels', () => {
    const o = parseOptions('Creator Studio: pick 1 (intro test) / 2 (map) / 3 (both)');
    expect(o.map((x) => x.value)).toEqual(['1', '2', '3']);
    expect(o[0].label).toBe('1: intro test');
    expect(o[2].label).toBe('3: both');
  });
  it('parses word options', () => {
    expect(parseOptions('Publish the box: publish / hold').map((x) => x.value)).toEqual(['publish', 'hold']);
    expect(parseOptions('yes / no').map((x) => x.value)).toEqual(['yes', 'no']);
  });
  it('returns [] when there is no clean option set', () => {
    expect(parseOptions('Finish the whitepaper docs and schedule the stream')).toEqual([]);
    expect(parseOptions('a / b / c / d / e')).toEqual([]); // >4
    expect(parseOptions('review this long descriptive title with slashes / and more prose here that is too long')).toEqual([]);
  });
});

describe('formatGrill one-click buttons', () => {
  it('renders the actual options as answer buttons for a decision', () => {
    const { buttons } = formatGrill(
      { key: 'k', kind: 'decision', title: 'Creator Studio: pick 1 (intro test) / 2 (map) / 3 (both)', priority: 0 },
      5,
    );
    // first row = the 3 answer options, mapped to grill:ans:<value>
    expect(buttons[0].map((b) => b.data)).toEqual(['grill:ans:1', 'grill:ans:2', 'grill:ans:3']);
    expect(buttons[0][0].text).toBe('1: intro test');
    // second row = Pick multiple (3+ options, #51) then Skip / Later
    expect(buttons[1].map((b) => b.data)).toEqual(['grill:multi', 'grill:skip', 'grill:snooze']);
  });
  it('a no-option decision offers Approve (resolve) / Skip / Later', () => {
    const { buttons, text } = formatGrill(
      { key: 'k', kind: 'decision', title: 'Onboard Brandon to Discord', priority: 1 },
      0,
    );
    expect(buttons[0].map((b) => b.data)).toEqual(['grill:approve', 'grill:skip', 'grill:snooze']);
    expect(buttons[0][0].text).toBe('Approve');
    // the reply-to-resolve path is surfaced in the text
    expect(text).toContain('Reply with your call');
  });
  it('a review offers Reviewed (grill:done) + a reply-with-a-note hint', () => {
    const { buttons, text } = formatGrill(
      { key: 'https://github.com/x/y/pull/1', kind: 'review', title: 'a PR', link: 'u', priority: 2 },
      0,
    );
    expect(buttons[0][0]).toEqual({ text: 'Reviewed', data: 'grill:done' });
    expect(text).toContain('Reply with a note');
  });
  it('a blocked item offers Unblock (grill:approve)', () => {
    const { buttons } = formatGrill({ key: 'k', kind: 'blocked', title: 'stuck on X', priority: 3 }, 0);
    expect(buttons[0][0]).toEqual({ text: 'Unblock', data: 'grill:approve' });
  });
  it('an event is informational - "On your calendar today" + a single Got it button', () => {
    const { buttons, text } = formatGrill(
      { key: 'evt:1', kind: 'event', title: '6:00pm - Artizen w/ Brandon', priority: -1 },
      2,
    );
    expect(text).toContain('On your calendar today');
    expect(buttons[0][0]).toEqual({ text: 'Got it', data: 'grill:done' });
    expect(text).toContain('Reply if you want me to prep');
  });
})

describe('parseOptions - #51 colon forms (the "solid" Creator Studio example)', () => {
  it('parses "1: intro test / 2: map / 3: both" with a colon prefix in the title', () => {
    const o = parseOptions('Creator Studio decision: 1: intro test / 2: map / 3: both');
    expect(o.map((x) => x.value)).toEqual(['1', '2', '3']);
    expect(o.map((x) => x.label)).toEqual(['1: intro test', '2: map', '3: both']);
  });

  it('still parses the paren form after a prefix colon', () => {
    const o = parseOptions('Creator Studio: pick 1 (intro test) / 2 (map) / 3 (both)');
    expect(o.map((x) => x.value)).toEqual(['1', '2', '3']);
    expect(o[0].label).toBe('1: intro test');
  });

  it('parses dash-labeled options', () => {
    const o = parseOptions('Ship it: 1 - now / 2 - after review');
    expect(o.map((x) => x.label)).toEqual(['1: now', '2: after review']);
  });
});

describe('matchTypedAnswer - #51 typed capture', () => {
  const opts = [
    { value: '1', label: '1: intro test' },
    { value: '2', label: '2: map' },
    { value: '3', label: '3: both' },
  ];

  it('matches a bare value, a full label, and a label tail', () => {
    expect(matchTypedAnswer('2', opts)).toBe('2');
    expect(matchTypedAnswer('2: map', opts)).toBe('2');
    expect(matchTypedAnswer('map', opts)).toBe('2');
    expect(matchTypedAnswer('BOTH', opts)).toBe('3');
  });

  it('matches multi forms and joins values', () => {
    expect(matchTypedAnswer('1,2', opts)).toBe('1,2');
    expect(matchTypedAnswer('1 and 3', opts)).toBe('1,3');
    expect(matchTypedAnswer('1 2 3', opts)).toBe('1,2,3');
  });

  it('never eats normal chat', () => {
    expect(matchTypedAnswer('can you also check the deploy logs', opts)).toBeNull();
    expect(matchTypedAnswer('1 but only after the map is done', opts)).toBeNull();
    expect(matchTypedAnswer('', opts)).toBeNull();
    expect(matchTypedAnswer('yes', opts)).toBeNull(); // not one of THESE options
    expect(matchTypedAnswer('anything', [])).toBeNull();
  });

  it('dedupes repeated tokens in a multi answer', () => {
    expect(matchTypedAnswer('1, 1, 2', opts)).toBe('1,2');
  });
});

describe('toggleSelection + multiKeyboard - #51 multi-choice', () => {
  const opts = [
    { value: '1', label: '1: intro test' },
    { value: '2', label: '2: map' },
    { value: '3', label: '3: both' },
  ];

  it('toggles on/off and keeps option order', () => {
    let sel = toggleSelection([], '3', opts);
    sel = toggleSelection(sel, '1', opts);
    expect(sel).toEqual(['1', '3']);
    sel = toggleSelection(sel, '3', opts);
    expect(sel).toEqual(['1']);
  });

  it('renders [x]/[ ] rows plus Send/Cancel', () => {
    const rows = multiKeyboard(opts, ['2']);
    expect(rows).toHaveLength(4);
    expect(rows[0][0].text).toBe('[ ] 1: intro test');
    expect(rows[1][0].text).toBe('[x] 2: map');
    expect(rows[1][0].data).toBe('grill:tog:2');
    expect(rows[3].map((b) => b.data)).toEqual(['grill:multisend', 'grill:multicancel']);
    expect(rows[3][0].text).toBe('Send (1)');
  });
});

describe('formatGrill - Pick multiple appears only for 3+ option decisions', () => {
  it('adds the multi button for a 3-option decision', () => {
    const { buttons } = formatGrill(
      { key: 'k', kind: 'decision', title: 'Pick: 1: a / 2: b / 3: c', priority: 0 },
      0,
    );
    expect(buttons[1].map((b) => b.data)).toEqual(['grill:multi', 'grill:skip', 'grill:snooze']);
  });

  it('keeps the plain tail for a 2-option decision', () => {
    const { buttons } = formatGrill(
      { key: 'k', kind: 'decision', title: 'Publish: yes / no', priority: 0 },
      0,
    );
    expect(buttons[1].map((b) => b.data)).toEqual(['grill:skip', 'grill:snooze']);
  });
});
