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
    // An allowlisted recommendation with its option shown, so the gated word list is what decides.
    const v = classifyGate({ kind: 'decision', title: `${title}? A lint first / B wait`, notes, recommended: 'A' });
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
  it.each(PROBES)('as the title with option A recommended: %s stays with Zaal', (phrase) => {
    const v = classifyGate({ kind: 'decision', title: `Should we ${phrase}? A lint first / B wait`, notes: null, recommended: 'A' });
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
  it.each(['do lint first', 'option B', 'A'])('%s goes', (rec) => {
    expect(allowlistedChoice(rec)).toBe(true);
    expect(classifyGate({ kind: 'decision', title: 'Which check runs first? A lint first / B tests first', notes: null, recommended: rec })).toMatchObject({
      gated: false,
      recommended: rec,
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
      });
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
      });
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
      async () => {});
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
      const v = classifyGate({ kind: 'decision', title: `Should we ${w}? A lint first / B wait`, notes: null, recommended: 'A' });
      expect(v.classes).toContain('money');
    }
  });
  it('the allowed shapes still go when they are the whole recommendation', () => {
    for (const rec of ['A', 'option B', 'C)', 'A (pick)', 'do lint first', 'lint before tests', 'tabs on top', 'clearer wording', 'skip the optional step', 'defer until monday', 'later']) {
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

describe('a bare option letter is checked against that option\'s own text', () => {
  // Options are only ever read from the title and notes, which the gate list
  // already scans, so this case is also caught without the option check (red
  // control, run). The check's own effect is the next test: a letter whose
  // option the card does not show is refused.
  it('a dangerous option text in the notes keeps the card', () => {
    const v = classifyGate({ kind: 'decision', title: 'Next step for the lane', notes: 'A wire the funds / B wait', recommended: 'A' });
    expect(v.gated).toBe(true);
    expect(v.reason).toBe('option A is not an allowlisted reversible choice');
  });
  it('a letter whose option is not on the card stays with Zaal', () => {
    expect(classifyGate({ kind: 'decision', title: 'Next step for the lane', notes: null, recommended: 'B' })).toMatchObject({
      gated: true,
      reason: 'option B is not shown on the card',
    });
  });
  it('a safe option text still goes', () => {
    expect(classifyGate({ kind: 'decision', title: 'Which check runs first? A lint first / B tests first', notes: null, recommended: 'B' }).gated).toBe(false);
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
describe('a bare letter auto-proceeds only when its option text is itself an allowed shape', () => {
  it.each(ROUND4)('A = %s stays with Zaal', (option) => {
    const v = classifyGate({ kind: 'decision', title: `Next step? A ${option} / B wait`, notes: null, recommended: 'A' });
    expect(v.gated).toBe(true);
  });
  it('a benign option letter still goes, and the choice is the option text', () => {
    expect(classifyGate({ kind: 'decision', title: 'Next step? A lint first / B wait', notes: null, recommended: 'A' })).toMatchObject({
      gated: false,
      choice: 'lint first',
    });
  });
});

describe('auto-deferred cards are logged and listed in the digest', () => {
  it('the defer shapes are exactly skip, defer/park/hold, later/not now/wait', () => {
    for (const c of ['skip it', 'defer until monday', 'park it', 'hold', 'later', 'not now', 'wait']) expect(isDeferChoice(c)).toBe(true);
    for (const c of ['lint first', 'tabs on top', 'clearer wording', 'A']) expect(isDeferChoice(c)).toBe(false);
  });
  it('the sort logs a deferred card and still marks it handled', async () => {
    const logged: { taskId: string; choice: string }[] = [];
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
    expect(logged.map((l) => [l.taskId, l.choice])).toEqual([['d1', 'later']]);
  });
});

describe('auto-deferred: fail closed, the log, and the digest', () => {
  it('when the deferred log cannot be written, the deferred card is not marked and stays in the queue', async () => {
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
    expect(out.map((q) => q.key)).toEqual(['d1']);
    expect(state.items.d1).toBeUndefined();
    expect(state.items.d2).toMatchObject({ status: 'done' });
  });

  it('the log round-trips and keeps only the last 24 hours', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'autodef-'));
    const path = join(dir, 'auto-deferred.jsonl');
    try {
      expect(await appendAutoDeferred([{ taskId: 'old', title: 'Old', choice: 'later', at: '2026-10-15T12:00:00Z' }], path)).toBe(true);
      expect(await appendAutoDeferred([{ taskId: 'new', title: 'New', choice: 'park it', at: '2026-10-17T11:00:00Z' }], path)).toBe(true);
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
    expect(text).toContain('AUTO-DEFERRED, last 24h (1)');
    expect(text).toContain('Tidy the tabs section (choice: later)');
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
