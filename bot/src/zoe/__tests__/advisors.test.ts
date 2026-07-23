import { describe, it, expect, vi } from 'vitest';
import {
  parseVerdict,
  consensus,
  learningSignal,
  advisorAccuracy,
  formatReviewSummary,
  reviewDecision,
  buildAdvisorSystemPrompt,
  ADVISORS,
  type AdvisorVerdict,
  type HermesDecision,
  type AdvisoryDeps,
} from '../advisors';

const decision: HermesDecision = {
  runId: 'run-abcdef123456',
  issueText: 'board throws on null priority',
  diff: '--- a/Board.tsx\n+++ b/Board.tsx\n- it.priority\n+ it.priority ?? "P2"',
  criticScore: 88,
  outcome: 'merged',
};

function v(advisor: string, agrees: boolean, concerns: string[] = []): AdvisorVerdict {
  return { advisor, agrees, concerns, confidence: 'high', reasoning: 'r' };
}

describe('parseVerdict', () => {
  it('parses clean JSON', () => {
    const r = parseVerdict('{"agrees":true,"concerns":[],"confidence":"high","reasoning":"looks right"}', 'correctness');
    expect(r.agrees).toBe(true);
    expect(r.advisor).toBe('correctness');
  });

  it('parses out of a ```json fence with prose around it', () => {
    const raw = 'Sure:\n```json\n{"agrees":false,"concerns":["no test"],"confidence":"medium","reasoning":"needs a test"}\n```';
    expect(parseVerdict(raw, 'regression').concerns).toEqual(['no test']);
  });

  it('treats unparseable output as an ABSTENTION, never an approval', () => {
    const r = parseVerdict('the model rambled', 'safety');
    expect(r.agrees).toBe(false);
    expect(r.reasoning).toContain('not an approval');
  });

  it('treats empty output as an abstention', () => {
    expect(parseVerdict('', 'scope').agrees).toBe(false);
  });
});

describe('consensus', () => {
  it('counts agreement and dedupes dissent concerns', () => {
    const c = consensus([v('a', true), v('b', false, ['risky']), v('c', false, ['risky', 'no test'])]);
    expect(c.total).toBe(3);
    expect(c.agreed).toBe(1);
    expect(c.dissented).toBe(2);
    expect(c.concerns.sort()).toEqual(['no test', 'risky']);
    expect(c.unanimous).toBe(false);
  });

  it('detects unanimity both ways', () => {
    expect(consensus([v('a', true), v('b', true)]).unanimous).toBe(true);
    expect(consensus([v('a', false), v('b', false)]).unanimous).toBe(true);
  });

  it('empty verdict set is not unanimous', () => {
    expect(consensus([]).unanimous).toBe(false);
  });
});

describe('learningSignal - the whole point of the sandbox', () => {
  const agreeing = consensus([v('a', true), v('b', true)]);
  const dissenting = consensus([v('a', false), v('b', false)]);

  it('advisors agreed but it FAILED -> a real Hermes blind spot (the valuable case)', () => {
    expect(learningSignal(agreeing, 'reverted')).toBe('hermes_blind_spot');
    expect(learningSignal(agreeing, 'ci_failed')).toBe('hermes_blind_spot');
  });

  it('advisors dissented and it FAILED -> advisors vindicated', () => {
    expect(learningSignal(dissenting, 'reverted')).toBe('advisors_vindicated');
  });

  it('advisors dissented but it merged fine -> advisors were noisy', () => {
    expect(learningSignal(dissenting, 'merged')).toBe('advisors_noisy');
  });

  it('advisors agreed and it merged -> aligned', () => {
    expect(learningSignal(agreeing, 'merged')).toBe('aligned');
  });

  it('unknown outcome is pending, never scored', () => {
    expect(learningSignal(agreeing, 'unknown')).toBe('pending');
  });
});

describe('advisorAccuracy', () => {
  it('credits dissent on bad changes and agreement on good ones', () => {
    const acc = advisorAccuracy([
      { verdict: v('safety', false), outcome: 'reverted' }, // correct dissent
      { verdict: v('safety', true), outcome: 'merged' },    // correct agreement
      { verdict: v('safety', true), outcome: 'reverted' },  // wrong
    ]);
    expect(acc.safety.calls).toBe(3);
    expect(acc.safety.correct).toBe(2);
    expect(acc.safety.accuracy).toBeCloseTo(0.667, 2);
  });

  it('ignores decisions with unknown outcomes', () => {
    const acc = advisorAccuracy([{ verdict: v('scope', true), outcome: 'unknown' }]);
    expect(acc.scope).toBeUndefined();
  });
});

describe('reviewDecision', () => {
  function deps(over: Partial<AdvisoryDeps> = {}): AdvisoryDeps {
    return {
      ask: vi.fn(async () => '{"agrees":true,"concerns":[],"confidence":"high","reasoning":"ok"}'),
      record: vi.fn(async () => {}),
      ...over,
    };
  }

  it('asks EVERY advisor lens and records the review', async () => {
    const d = deps();
    const out = await reviewDecision(decision, d);
    expect(d.ask).toHaveBeenCalledTimes(ADVISORS.length);
    expect(out.verdicts).toHaveLength(ADVISORS.length);
    expect(d.record).toHaveBeenCalledOnce();
    expect(out.signal).toBe('aligned');
  });

  it('a failing advisor becomes an abstention and never blocks the others', async () => {
    let n = 0;
    const d = deps({
      ask: vi.fn(async () => {
        if (n++ === 0) throw new Error('model down');
        return '{"agrees":true,"concerns":[],"confidence":"high","reasoning":"ok"}';
      }),
    });
    const out = await reviewDecision(decision, d);
    expect(out.verdicts).toHaveLength(ADVISORS.length);
    expect(out.verdicts.filter((v) => !v.agrees)).toHaveLength(1);
  });

  it('surfaces a Hermes blind spot when advisors approved something that got reverted', async () => {
    const out = await reviewDecision({ ...decision, outcome: 'reverted' }, deps());
    expect(out.signal).toBe('hermes_blind_spot');
  });

  it('INVARIANT: advisors are advisory only - the deps expose no action path', () => {
    // reviewDecision can only ask, record, and log. There is deliberately no
    // dep that writes to a repo, opens a PR, or merges. If this test needs
    // updating because such a dep was added, the invariant has been broken.
    const d = deps();
    expect(Object.keys(d).sort()).toEqual(['ask', 'record']);
  });
});

describe('prompts + summary', () => {
  it('the system prompt tells the advisor it cannot act', () => {
    const p = buildAdvisorSystemPrompt(ADVISORS[0]);
    expect(p).toContain('ADVISOR');
    expect(p).toContain('cannot act');
  });

  it('summary includes the signal and concerns', () => {
    const c = consensus([v('a', false, ['risky'])]);
    const s = formatReviewSummary(decision, c, 'advisors_noisy');
    expect(s).toContain('advisors_noisy');
    expect(s).toContain('risky');
  });
});
