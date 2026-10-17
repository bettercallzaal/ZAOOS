/**
 * The gated-or-not sort (doc 2679 PR 2b, ZOE_GRILL_GATE_SORT). Both directions
 * (loop-evals.md): a card that is Zaal's must never be auto-proceeded, and a
 * card that is safe and carries a recommendation must not reach his DM. The
 * sort's IO is injected; nothing here touches the real grill state file.
 */
import { describe, expect, it } from 'vitest';
import type { CockpitTask } from '../../cockpit/types';
import { type GrillItem, type GrillState, sortOutAutoProceed } from '../grill';
import { allowlistedChoice, autoProceedLine, classifyGate, gateSortEnabled } from '../grill-queue';

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
    // An allowlisted recommendation, so the gated word list is what decides.
    const v = classifyGate({ kind: 'decision', title, notes, recommended: 'A' });
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
    const v = classifyGate({ kind: 'decision', title: `Should we ${phrase}? A yes / B no`, notes: null, recommended: 'A' });
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
    expect(classifyGate({ kind: 'decision', title: 'Which lane goes first tomorrow', notes: null, recommended: rec })).toMatchObject({
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
    item('t1', 'Which lane goes first tomorrow'),
    item('t2', 'Pay the venue deposit'),
    item('t3', 'Pick the order of the recap sections'),
    item('evt:1', '10:00 AM - standup', 'event'),
  ];
  const tasks = [
    task('t1', 'Which lane goes first tomorrow', 'recommended: zao-app first'),
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
    expect(written).toEqual([{ taskId: 't1', title: 'Which lane goes first tomorrow', why: 'auto-proceeded: zao-app first, override anytime' }]);
    expect(out.map((q) => q.key)).toEqual(['t2', 't3', 'evt:1']);
    expect(state.items.t1).toMatchObject({ status: 'done', answer: 'auto-proceeded: zao-app first, override anytime' });
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
      const v = classifyGate({ kind: 'decision', title: `Should we ${w}? A yes / B no`, notes: null, recommended: 'A' });
      expect(v.classes).toContain('money');
    }
  });
  it('the allowed shapes still go when they are the whole recommendation', () => {
    for (const rec of ['A', 'option B', 'C)', 'A (pick)', 'do lint first', 'lint before tests', 'tabs on top', 'clearer wording', 'skip the optional step', 'defer until monday', 'later']) {
      expect(allowlistedChoice(rec)).toBe(true);
    }
  });
});
