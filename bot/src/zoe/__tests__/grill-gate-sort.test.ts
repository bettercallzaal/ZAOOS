/**
 * The gated-or-not sort (doc 2679 PR 2b, ZOE_GRILL_GATE_SORT). Both directions
 * (loop-evals.md): a card that is Zaal's must never be auto-proceeded, and a
 * card that is safe and carries a recommendation must not reach his DM. The
 * sort's IO is injected; nothing here touches the real grill state file.
 */
import { describe, expect, it } from 'vitest';
import type { CockpitTask } from '../../cockpit/types';
import { type GrillItem, type GrillState, sortOutAutoProceed } from '../grill';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allowlistedChoice, appendAutoDeferred, autoProceedLine, classifyGate, gateSortEnabled, isDeferChoice, readAutoDeferred } from '../grill-queue';
import { formatNeedsZaalDigest } from '../needs-zaal-digest';

describe('classifyGate - what stays with Zaal', () => {
  it.each([
    ['money', 'Pay the venue deposit', 'recommended: pay today'],
    ['money', 'Top up the Neynar plan to Scale ($249)', 'recommended: wait a week'],
    ['public', 'Post the recap to the channel', 'recommended: post tonight'],
    ['public', 'Email the sponsor the deck', 'recommended: send Friday'],
    ['irreversible', 'Delete the old lineup poster', 'recommended: delete it'],
    ['irreversible', 'Deploy the contract to Base', 'recommended: deploy'],
    ['his-fact', 'Which wallet is the operations wallet, do you know?', 'recommended: the first one'],
    ['settings', 'Turn on the inbox nudge flag', 'recommended: on'],
  ])('%s: %s', (cls, title, notes) => {
    // An allowlisted, non-letter recommendation, so the gated word list over the title is what decides.
    void notes;
    const v = classifyGate({ kind: 'decision', title, notes: null, recommended: 'lint first' });
    expect(v.gated).toBe(true);
    expect(v.classes).toContain(cls);
  });
  it('no recommended option: stays, whatever it says', () => {
    expect(classifyGate({ kind: 'decision', title: 'Order the lanes for tomorrow', notes: null }).gated).toBe(true);
  });
  it('events and PR reviews always stay, even with a recommendation and no gated word', () => {
    expect(classifyGate({ kind: 'event', title: '10:00 AM - standup', recommended: 'go' }).gated).toBe(true);
    expect(classifyGate({ kind: 'review', title: 'docs: fix a typo', recommended: 'approve' }).gated).toBe(true);
  });
});

// Seat review on #3984: plain gated actions came back NOT gated under the
// first, denylist-only version. Each phrase is probed two ways: as the
// recommendation itself (the allowlist must refuse it) and as the card's title
// with an allowlisted recommendation (the denylist must still catch it).
const PROBES = [
  'go live',
  'ship it',
  'rm the repo',
  'push to production',
  'launch the site',
  'merge to main',
  'burn tokens',
  'upload the video',
  'broadcast it',
  'tell Joseph',
  'commit the key',
  'set the hook',
];
describe('classifyGate - fail closed on plain gated actions', () => {
  it.each(PROBES)('as the recommendation: %s stays with Zaal', (phrase) => {
    expect(classifyGate({ kind: 'decision', title: 'What next on this card', notes: null, recommended: phrase }).gated).toBe(true);
  });
  it.each(PROBES)('as the title under an allowlisted recommendation: %s stays with Zaal', (phrase) => {
    const v = classifyGate({ kind: 'decision', title: `Should we ${phrase}?`, notes: null, recommended: 'lint first' });
    expect(v.gated).toBe(true);
    expect(v.classes.length).toBeGreaterThan(0);
  });
  it('a recommendation outside the allowlist stays, even with nothing gated in it', () => {
    expect(classifyGate({ kind: 'decision', title: 'Pick the lane', notes: null, recommended: 'zao-app' }).reason).toBe(
      'recommendation is not an allowlisted reversible choice',
    );
  });
});

describe('classifyGate - what is auto-proceeded (allowlist controls)', () => {
  it.each(['do lint first', 'lint before tests', 'tabs on top'])('%s goes', (rec) => {
    expect(allowlistedChoice(rec)).toBe(true);
    expect(classifyGate({ kind: 'decision', title: 'Which check runs first?', notes: null, recommended: rec })).toMatchObject({
      gated: false,
      recommended: rec,
      choice: rec,
    });
  });
  it('tabs, wording and defer shapes are allowlisted; an action is not', () => {
    for (const rec of ['keep the two tabs', 'shorter wording', 'defer to next week', 'skip it']) expect(allowlistedChoice(rec)).toBe(true);
    for (const rec of ['zao-app', 'yes', 'approve']) expect(allowlistedChoice(rec)).toBe(false);
  });
  it('the logged line names the option and the override', () => {
    expect(autoProceedLine('zao-app')).toBe('auto-proceeded: zao-app, override anytime');
  });
  it('flag reads 1 only', () => {
    expect(gateSortEnabled({})).toBe(false);
    expect(gateSortEnabled({ ZOE_GRILL_GATE_SORT: 'true' })).toBe(false);
    expect(gateSortEnabled({ ZOE_GRILL_GATE_SORT: '1' })).toBe(true);
  });
});

const task = (id: string, title: string, notes: string | null): CockpitTask =>
  ({ id, legacy_id: id, title, notes } as unknown as CockpitTask);
const item = (key: string, title: string, kind: GrillItem['kind'] = 'decision'): GrillItem => ({ key, kind, title, priority: 1 });
const fresh = (): GrillState => ({ items: {}, activeKey: null } as GrillState);

describe('sortOutAutoProceed - with injected IO', () => {
  const queue = [
    item('t1', 'Which check runs first'),
    item('t2', 'Pay the venue deposit'),
    item('t3', 'Pick the order of the recap sections'),
    item('evt:1', '10:00 AM - standup', 'event'),
  ];
  const tasks = [
    task('t1', 'Which check runs first', 'recommended: lint first'),
    task('t2', 'Pay the venue deposit', 'recommended: pay today'),
    task('t3', 'Pick the order of the recap sections', null),
  ];

  it('writes only the safe card with a recommendation, marks it handled, and removes it from the queue', async () => {
    const written: { taskId: string; why?: string }[] = [];
    let saved = 0;
    const state = fresh();
    const out = await sortOutAutoProceed(queue, tasks, state, Date.parse('2026-10-16T16:00:00Z'),
      async (cards) => {
        written.push(...cards);
        return { wrote: 'spool', path: '/x', count: cards.length, numbers: [] };
      },
      async () => {
        saved += 1;
      },
      async () => true);
    expect(written).toEqual([{ taskId: 't1', title: 'Which check runs first', why: 'auto-proceeded: lint first, override anytime' }]);
    expect(out.map((q) => q.key)).toEqual(['t2', 't3', 'evt:1']);
    expect(state.items.t1).toMatchObject({ status: 'done', answer: 'auto-proceeded: lint first, override anytime' });
    expect(saved).toBe(1);
  });

  it('a failed write keeps every card in the queue and marks nothing', async () => {
    const state = fresh();
    let saved = 0;
    const out = await sortOutAutoProceed(queue, tasks, state, Date.now(),
      async () => ({ wrote: 'nothing', path: '/x', count: 0, numbers: [] }),
      async () => {
        saved += 1;
      },
      async () => true);
    expect(out).toHaveLength(4);
    expect(state.items).toEqual({});
    expect(saved).toBe(0);
  });

  it('a card already in state is never re-sorted or written twice', async () => {
    const state = fresh();
    state.items.t1 = { askedAt: '2026-10-15T10:00:00Z', status: 'asked' };
    let calls = 0;
    const out = await sortOutAutoProceed(queue, tasks, state, Date.now(),
      async (cards) => {
        calls += cards.length;
        return { wrote: 'spool', path: '/x', count: cards.length, numbers: [] };
      },
      async () => {},
      async () => true);
    expect(calls).toBe(0);
    expect(out).toHaveLength(4);
  });
});

// Seat re-review on #3984: an allowed keyword anywhere in the recommendation
// let the rest of it through. Every shape is now anchored to the whole
// recommendation, so an allowed word plus a dangerous verb is gated. The first
// two are the seat's probes; the next ten are this lane's own.
const COMBOS = [
  'later: wire the money',
  'hold off then wire funds',
  'first delete the repo',
  'skip review and merge',
  'option A then deploy',
  'defer and burn tokens',
  'tabs then push to main',
  'later post it',
  'do lint first then ship',
  'A: transfer the funds',
  'shorter wording, then tell the sponsor',
  'park it and publish',
];
describe('anchored allow shapes - an allowed word plus a dangerous verb stays gated', () => {
  it.each(COMBOS)('%s is not an allowlisted choice, and the card stays with Zaal', (rec) => {
    expect(allowlistedChoice(rec)).toBe(false);
    expect(classifyGate({ kind: 'decision', title: 'Which lane goes first tomorrow', notes: null, recommended: rec }).gated).toBe(true);
  });
  it('the new money words are gated by the word list too', () => {
    for (const w of ['wire it', 'move the money', 'release funds', 'pay cash', 'venmo him', 'zelle', 'paypal', 'stripe link', 'send $50']) {
      const v = classifyGate({ kind: 'decision', title: `Should we ${w}?`, notes: null, recommended: 'lint first' });
      expect(v.classes).toContain('money');
    }
  });
  it('the allowed shapes still go when they are the whole recommendation', () => {
    for (const rec of ['do lint first', 'lint before tests', 'tabs on top', 'clearer wording', 'skip the optional step', 'defer until monday', 'later']) {
      expect(allowlistedChoice(rec)).toBe(true);
    }
  });
});

// Seat round 3 on #3984: the open ordering shapes let any verb through. These
// are the evaluator's 13 probes verbatim; each must be refused by the
// allowlist and stay with Zaal. The shapes now accept only a fixed noun list.
const ROUND3 = [
  'withdraw first',
  'sell first',
  'stake first',
  'approve first',
  'execute first',
  'kill first',
  'overwrite first',
  'hire first',
  'bridge first',
  'truncate first',
  'unpublish first',
  'reboot first',
  'restart first',
];
describe('ordering shapes take only the fixed nouns', () => {
  it.each(ROUND3)('%s stays with Zaal', (rec) => {
    expect(allowlistedChoice(rec)).toBe(false);
    expect(classifyGate({ kind: 'decision', title: 'What goes first?', notes: null, recommended: rec }).gated).toBe(true);
  });
  it('the same verbs in the before/after/then shape stay too', () => {
    for (const rec of ['withdraw before review', 'lint then sell', 'restart after tests']) expect(allowlistedChoice(rec)).toBe(false);
  });
  it('the fixed nouns still go', () => {
    for (const rec of ['do lint first', 'run the tests first', 'typecheck next', 'docs before tests', 'review then build', 'spec last']) {
      expect(allowlistedChoice(rec)).toBe(true);
    }
  });
});

// Seat round 4 on #3984: a bare letter is only as safe as the option it picks.
const ROUND4 = [
  'stake the treasury',
  'sell the NFTs',
  'execute the proposal',
  'kill the VPS',
  'overwrite main',
  'hire Sam at 2k',
  'bridge to Base',
  'reset the database',
  'unlock the account',
  'fire Sam',
];

describe('auto-deferred cards are logged and listed in the digest', () => {
  it('the defer shapes are exactly skip, defer/park/hold, later/not now/wait', () => {
    for (const c of ['skip it', 'defer until monday', 'park it', 'hold', 'later', 'not now', 'wait']) expect(isDeferChoice(c)).toBe(true);
    for (const c of ['lint first', 'tabs on top', 'clearer wording', 'A']) expect(isDeferChoice(c)).toBe(false);
  });
  it('the sort logs every auto-handled card, proceeded and deferred, and marks them handled', async () => {
    const logged: { taskId: string; choice: string; deferred?: boolean }[] = [];
    const state = fresh();
    const out = await sortOutAutoProceed(
      [item('d1', 'Tidy the tabs section'), item('d2', 'Which check runs first')],
      [task('d1', 'Tidy the tabs section', 'recommended: later'), task('d2', 'Which check runs first', 'recommended: lint first')],
      state,
      Date.parse('2026-10-17T12:00:00Z'),
      async (cards) => ({ wrote: 'spool', path: '/x', count: cards.length, numbers: [] }),
      async () => {},
      async (entries) => {
        logged.push(...entries);
        return true;
      },
    );
    expect(out).toHaveLength(0);
    expect(logged.map((l) => [l.taskId, l.choice, l.deferred])).toEqual([
      ['d1', 'later', true],
      ['d2', 'lint first', false],
    ]);
    expect(state.items.d2).toMatchObject({ status: 'done' });
  });
});

describe('auto-deferred: fail closed, the log, and the digest', () => {
  it('when the log cannot be written, no card is marked, proceeded or deferred, and all stay in the queue', async () => {
    const state = fresh();
    const out = await sortOutAutoProceed(
      [item('d1', 'Tidy the tabs section'), item('d2', 'Which check runs first')],
      [task('d1', 'Tidy the tabs section', 'recommended: later'), task('d2', 'Which check runs first', 'recommended: lint first')],
      state,
      Date.parse('2026-10-17T12:00:00Z'),
      async (cards) => ({ wrote: 'spool', path: '/x', count: cards.length, numbers: [] }),
      async () => {},
      async () => false,
    );
    expect(out.map((q) => q.key)).toEqual(['d1', 'd2']);
    expect(state.items).toEqual({});
  });

  it('the log round-trips and keeps only the last 24 hours', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'autodef-'));
    const path = join(dir, 'auto-deferred.jsonl');
    // Pin the clock: append trims to the last 7 days of `now`, so a wall clock
    // aged these fixed entries out of the log (main went red on 2026-10-24).
    const now = Date.parse('2026-10-17T12:00:00Z');
    try {
      expect(await appendAutoDeferred([{ taskId: 'old', title: 'Old', choice: 'later', at: '2026-10-15T12:00:00Z' }], path, now)).toBe(true);
      expect(await appendAutoDeferred([{ taskId: 'new', title: 'New', choice: 'park it', at: '2026-10-17T11:00:00Z' }], path, now)).toBe(true);
      await fs.appendFile(path, 'not json\n');
      const got = await readAutoDeferred(Date.parse('2026-10-16T12:00:00Z'), path);
      expect(got.map((e) => e.taskId)).toEqual(['new']);
      expect(await readAutoDeferred(0, join(dir, 'missing.jsonl'))).toEqual([]);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  const deferredEntry = [{ taskId: 'd1', title: 'Tidy the tabs section', choice: 'later', at: '2026-10-17T11:00:00Z' }];
  it('the digest lists every deferred card with its choice', () => {
    const text = formatNeedsZaalDigest({
      timeSlot: 'morning',
      dueSoon: [],
      laneAsks: [{ lane: 'zoe', text: 'Pick a name', file: 'x.md' } as never],
      decisions: [],
      autoDeferred: deferredEntry,
    });
    expect(text).toContain('AUTO-PROCEEDED OR DEFERRED, last 24h (1)');
    expect(text).toContain('Tidy the tabs section (choice: later)');
  });
  it("a proceeded card is listed with its title and choice (seat round 8: 'Liquidate the treasury?' + 'lint first')", () => {
    const text = formatNeedsZaalDigest({
      timeSlot: 'morning',
      dueSoon: [],
      laneAsks: [],
      decisions: [],
      autoDeferred: [{ taskId: 'p1', title: 'Liquidate the treasury?', choice: 'lint first', at: '2026-10-17T11:00:00Z', deferred: false }],
    });
    expect(text).toContain('AUTO-PROCEEDED OR DEFERRED, last 24h (1)');
    expect(text).toContain('Liquidate the treasury? (choice: lint first)');
  });
  it('an otherwise clear digest still lists them', () => {
    const text = formatNeedsZaalDigest({ timeSlot: 'evening', dueSoon: [], laneAsks: [], decisions: [], autoDeferred: deferredEntry });
    expect(text).toContain('All clear');
    expect(text).toContain('Tidy the tabs section (choice: later)');
  });
  it('a paused digest still lists them', () => {
    const text = formatNeedsZaalDigest({
      timeSlot: 'evening',
      dueSoon: [],
      laneAsks: [{ lane: 'zoe', text: 'Pick a name', file: 'x.md' } as never],
      decisions: [],
      grillPaused: true,
      autoDeferred: deferredEntry,
    });
    expect(text).toContain('Grill paused');
    expect(text).toContain('Tidy the tabs section (choice: later)');
  });
});

describe('the auto-deferred log is capped', () => {
  it('keeps the last 7 days and at most 1,000 lines', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'autodef-cap-'));
    const path = join(dir, 'auto-deferred.jsonl');
    const now = Date.parse('2026-10-17T12:00:00Z');
    try {
      await appendAutoDeferred([{ taskId: 'old', title: 'Old', choice: 'later', at: '2026-10-01T12:00:00Z' }], path, now);
      const many = Array.from({ length: 1005 }, (_, i) => ({ taskId: `t${i}`, title: `T${i}`, choice: 'park it', at: '2026-10-17T11:00:00Z' }));
      expect(await appendAutoDeferred(many, path, now)).toBe(true);
      const lines = (await fs.readFile(path, 'utf8')).split('\n').filter(Boolean);
      expect(lines).toHaveLength(1000);
      expect(lines.some((l) => l.includes('"old"'))).toBe(false);
      expect(lines.at(-1)).toContain('"t1004"');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

// Seat round 7 on #3984: six rounds of checks on what a letter stands for each
// left a way to hide the real action, so a letter recommendation never
// auto-proceeds. Every bare-letter probe from rounds 3 to 7 is kept here,
// including the cards that used to go, and each must stay with Zaal.
const LETTER = 'an option letter always goes to Zaal';
const LETTER_PROBES: Array<[string, string, string | null, string]> = [
  // round 3
  ['round 3: dangerous option text in the notes', 'Next step for the lane', 'A wire the funds / B wait', 'A'],
  ['round 3: a letter whose option is not on the card', 'Next step for the lane', null, 'B'],
  ['round 3: a safe option text (used to go)', 'Which check runs first? A lint first / B tests first', null, 'B'],
  // round 4
  ...ROUND4.map((o): [string, string, string | null, string] => [`round 4: A = ${o}`, `Next step? A ${o} / B wait`, null, 'A']),
  ['round 4: a benign option letter (used to go)', 'Which first? A lint first / B wait', null, 'A'],
  // round 5
  ["round 5: a benign A in the title, a second A in the notes", 'Pick: A lint first / B docs', 'A sell the NFTs', 'A'],
  ['round 5: a duplicate letter, both copies safe', 'Pick: A lint first / B wait', 'A tests first / B later', 'A'],
  ['round 5: an unsafe sibling option', 'Pick: A lint first / B stake the treasury', null, 'A'],
  ['round 5: options repeated beside a plan', 'Next step? A lint first / B wait', 'A lint first / B wait\nPlan: stake the treasury after', 'A'],
  ['round 5: a plan beside the options', 'Next step? A lint first / B wait', 'Plan: stake the treasury after', 'A'],
  ['round 5: options plus the recommendation line (used to go)', 'Which first? A lint first / B wait', 'recommended: A', 'A'],
  // round 6
  ['round 6: a dangerous title over safe options', 'Sell the NFTs? A lint first / B docs before tests', null, 'A'],
  ...['Liquidate the pool?', 'Next step?', 'Pick:', 'Go ahead?', 'Sell or hold?'].map((q): [string, string, string | null, string] => [
    `round 6: title ${q}`,
    `${q} A lint first / B wait`,
    null,
    'A',
  ]),
  ...['Which first?', 'What goes first?', 'Which check runs first?', 'What order?', 'Which layout?', 'Which wording?', 'Lint or tests?'].map(
    (q): [string, string, string | null, string] => [`round 6: allowed title ${q} (used to go)`, `${q} A lint first / B wait`, null, 'A'],
  ),
  ['round 6: options only in the notes, dangerous title', 'Sell the NFTs', 'A lint first / B wait', 'A'],
  ['round 6: options only in the notes (used to go)', 'Which first', 'A lint first / B wait', 'A'],
  ["round 6: 'recommended: A. liquidate after'", 'Which first? A lint first / B wait', 'recommended: A. liquidate after', 'A'],
  ["round 6: 'rec: A. liquidate after'", 'Which first? A lint first / B wait', 'rec: A. liquidate after', 'A'],
  ...['recommended: A', '**recommended:** A', '(recommended: A)', 'recommended: A.'].map((n): [string, string, string | null, string] => [
    `round 6: bare value ${n} (used to go)`,
    'Which first? A lint first / B wait',
    n,
    'A',
  ]),
  // round 7
  ['round 7: text before an option line', 'Which first?', 'liquidate the treasury. A lint first / B docs', 'A'],
  ['round 7: text before a mid-line recommended:', 'Which first? A lint first / B docs', 'liquidate the treasury. recommended: A', 'A'],
];
describe('an option letter always goes to Zaal', () => {
  it.each(LETTER_PROBES)('%s', (_name, title, notes, rec) => {
    expect(classifyGate({ kind: 'decision', title, notes, recommended: rec })).toMatchObject({ gated: true, reason: LETTER });
  });
  it.each(['A', 'b', 'option B', 'C)', 'D.', 'A (pick)', 'A (recommended)', '  a  '])('every letter form: %s', (rec) => {
    expect(classifyGate({ kind: 'decision', title: 'Which first?', notes: null, recommended: rec })).toMatchObject({ gated: true, reason: LETTER });
    expect(allowlistedChoice(rec)).toBe(false);
  });
  it('a phrase that starts with a letter is not mistaken for one', () => {
    expect(classifyGate({ kind: 'decision', title: 'Which first?', notes: null, recommended: 'docs before tests' }).gated).toBe(false);
  });
});

describe('a recommended line must hold only the bare value', () => {
  it('trailing text after a non-letter recommendation stays with Zaal', () => {
    for (const notes of ['recommended: lint first; then wire the funds', 'recommended: lint first. liquidate after', 'rec: lint first. liquidate after']) {
      expect(classifyGate({ kind: 'decision', title: 'Which first', notes, recommended: 'lint first' })).toMatchObject({
        gated: true,
        reason: 'the recommended line holds more than the bare value',
      });
    }
  });
  it('bare values in the usual wrappings still go', () => {
    for (const notes of ['recommended: lint first', '**recommended:** lint first', '(recommended: lint first)', 'recommended: lint first.']) {
      expect(classifyGate({ kind: 'decision', title: 'Which first', notes, recommended: 'lint first' }).gated).toBe(false);
    }
  });
});
