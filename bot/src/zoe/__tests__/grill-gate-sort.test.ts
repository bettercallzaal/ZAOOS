/**
 * The gated-or-not sort (doc 2679 PR 2b, ZOE_GRILL_GATE_SORT). Both directions
 * (loop-evals.md): a card that is Zaal's must never be auto-proceeded, and a
 * card that is safe and carries a recommendation must not reach his DM. The
 * sort's IO is injected; nothing here touches the real grill state file.
 */
import { describe, expect, it } from 'vitest';
import type { CockpitTask } from '../../cockpit/types';
import { type GrillItem, type GrillState, sortOutAutoProceed } from '../grill';
import { autoProceedLine, classifyGate, gateSortEnabled } from '../grill-queue';

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
    const v = classifyGate({ kind: 'decision', title, notes, recommended: 'x' });
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

describe('classifyGate - what is auto-proceeded', () => {
  it('a reversible ordering choice with a recommended option goes', () => {
    const v = classifyGate({ kind: 'decision', title: 'Which lane goes first tomorrow', notes: 'recommended: zao-app', recommended: 'zao-app' });
    expect(v).toMatchObject({ gated: false, recommended: 'zao-app' });
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
    task('t1', 'Which lane goes first tomorrow', 'recommended: zao-app'),
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
    expect(written).toEqual([{ taskId: 't1', title: 'Which lane goes first tomorrow', why: 'auto-proceeded: zao-app, override anytime' }]);
    expect(out.map((q) => q.key)).toEqual(['t2', 't3', 'evt:1']);
    expect(state.items.t1).toMatchObject({ status: 'done', answer: 'auto-proceeded: zao-app, override anytime' });
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
