import { describe, it, expect, vi } from 'vitest';
import {
  nextRepoIndex,
  repoToHermesTarget,
  parseFinding,
  parseVerdict,
  runRepoImproverScout,
  reviewProposedImprovements,
  shouldRaiseAlarm,
  SCOUT_REPOS,
  type ScoutDeps,
  type ReviewDeps,
  type ImprovementRow,
} from '../repo-improver';

describe('nextRepoIndex', () => {
  it('rotates and wraps', () => {
    expect(nextRepoIndex(3, -1)).toBe(0);
    expect(nextRepoIndex(3, 0)).toBe(1);
    expect(nextRepoIndex(3, 2)).toBe(0);
  });
  it('handles empty', () => {
    expect(nextRepoIndex(0, 5)).toBe(0);
  });
});

describe('repoToHermesTarget', () => {
  it('maps known repos to targets', () => {
    expect(repoToHermesTarget('bettercallzaal/ZAOOS')).toBe('zaoos');
    expect(repoToHermesTarget('ZAODEVZ/ZAOcowork')).toBe('zaocowork');
  });
  it('returns null for surface-only repos', () => {
    expect(repoToHermesTarget('bettercallzaal/zao-website')).toBeNull();
  });
  it('returns null for unknown repos', () => {
    expect(repoToHermesTarget('someone/else')).toBeNull();
  });
});

describe('parseFinding', () => {
  const valid = '{"area":"auth","problem":"no guard","proposed_fix":"add guard","files":["a.ts"],"risk":"low","confidence":"high"}';
  it('parses a valid finding', () => {
    expect(parseFinding(valid)?.area).toBe('auth');
  });
  it('parses out of a ```json fence with prose', () => {
    const wrapped = 'Here is the finding:\n```json\n' + valid + '\n```\nThanks';
    expect(parseFinding(wrapped)?.problem).toBe('no guard');
  });
  it('returns null on {"none":true}', () => {
    expect(parseFinding('{"none":true}')).toBeNull();
  });
  it('returns null on malformed / missing fields', () => {
    expect(parseFinding('not json')).toBeNull();
    expect(parseFinding('{"area":"x"}')).toBeNull(); // missing required fields
    expect(parseFinding('')).toBeNull();
  });
  it('defaults files to []', () => {
    const noFiles = '{"area":"a","problem":"b","proposed_fix":"c","risk":"low","confidence":"low"}';
    expect(parseFinding(noFiles)?.files).toEqual([]);
  });
});

describe('parseVerdict', () => {
  it('parses an approve verdict', () => {
    const v = parseVerdict('{"approve":true,"reasoning":"clear + safe"}');
    expect(v.approve).toBe(true);
  });
  it('defaults to REJECT on malformed output (conservative)', () => {
    const v = parseVerdict('garbage');
    expect(v.approve).toBe(false);
    expect(v.reasoning).toContain('reject');
  });
});

function row(over: Partial<ImprovementRow> = {}): ImprovementRow {
  return {
    id: 'imp-1',
    repo: 'bettercallzaal/ZAOOS',
    hermes_target: 'zaoos',
    area: 'auth',
    problem: 'no guard',
    proposed_fix: 'add guard',
    files: ['a.ts'],
    risk: 'low',
    confidence: 'high',
    status: 'proposed',
    model: 'deepseek/deepseek-chat',
    zoe_reasoning: null,
    pr_url: null,
    run_id: null,
    ...over,
  };
}

describe('runRepoImproverScout', () => {
  function deps(over: Partial<ScoutDeps> = {}): ScoutDeps {
    return {
      pickNextRepo: vi.fn(async () => SCOUT_REPOS[0]),
      gatherContext: vi.fn(async () => 'README + tree'),
      audit: vi.fn(async () => ({
        text: '{"area":"auth","problem":"p","proposed_fix":"f","files":[],"risk":"low","confidence":"high"}',
        model: 'deepseek/deepseek-chat',
      })),
      saveProposed: vi.fn(async () => {}),
      ...over,
    };
  }
  it('audits and saves a proposed finding', async () => {
    const d = deps();
    const status = await runRepoImproverScout(d);
    expect(d.saveProposed).toHaveBeenCalledWith(
      expect.objectContaining({ repo: 'bettercallzaal/ZAOOS', hermes_target: 'zaoos', area: 'auth' }),
    );
    expect(status).toContain('proposed');
  });
  it('skips (no save) when the model finds nothing', async () => {
    const d = deps({ audit: vi.fn(async () => ({ text: '{"none":true}', model: 'm' })) });
    const status = await runRepoImproverScout(d);
    expect(d.saveProposed).not.toHaveBeenCalled();
    expect(status).toContain('no finding');
  });
  it('skips gracefully when context gathering fails', async () => {
    const d = deps({ gatherContext: vi.fn(async () => { throw new Error('clone failed'); }) });
    const status = await runRepoImproverScout(d);
    expect(d.audit).not.toHaveBeenCalled();
    expect(status).toContain('context failed');
  });
});

describe('reviewProposedImprovements (ZOE self-gate + learn)', () => {
  function deps(over: Partial<ReviewDeps> = {}): ReviewDeps {
    return {
      fetchProposed: vi.fn(async () => [row()]),
      judge: vi.fn(async () => '{"approve":true,"reasoning":"clear and safe"}'),
      markStatus: vi.fn(async () => {}),
      dispatchFix: vi.fn(async () => ({ kind: 'ready' as const, prUrl: 'https://x/pull/9', runId: 'r1' })),
      log: vi.fn(async () => {}),
      ...over,
    };
  }
  it('approves -> dispatches -> marks fixed + logs the outcome', async () => {
    const d = deps();
    const status = await reviewProposedImprovements(d);
    expect(d.dispatchFix).toHaveBeenCalledWith(expect.objectContaining({ targetRepo: 'zaoos' }));
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'fixing', expect.objectContaining({ zoe_reasoning: 'clear and safe' }));
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'fixed', expect.objectContaining({ pr_url: 'https://x/pull/9' }));
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('fixed'));
    expect(status).toContain('1 approved');
  });
  it('rejects -> marks rejected + logs the reasoning (learning), never dispatches', async () => {
    const d = deps({ judge: vi.fn(async () => '{"approve":false,"reasoning":"too vague"}') });
    await reviewProposedImprovements(d);
    expect(d.dispatchFix).not.toHaveBeenCalled();
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'rejected', expect.objectContaining({ zoe_reasoning: 'too vague' }));
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('rejected'));
  });
  it('malformed verdict defaults to reject (never dispatches on garbage)', async () => {
    const d = deps({ judge: vi.fn(async () => 'not json at all') });
    await reviewProposedImprovements(d);
    expect(d.dispatchFix).not.toHaveBeenCalled();
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'rejected', expect.anything());
  });
  it('approved but no fix target -> escalates (manual), no dispatch', async () => {
    const d = deps({ fetchProposed: vi.fn(async () => [row({ hermes_target: null, repo: 'bettercallzaal/zao-website' })]) });
    await reviewProposedImprovements(d);
    expect(d.dispatchFix).not.toHaveBeenCalled();
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'escalated', expect.anything());
  });
  it('dispatch throw -> escalates, never crashes the loop', async () => {
    const d = deps({ dispatchFix: vi.fn(async () => { throw new Error('boom'); }) });
    const status = await reviewProposedImprovements(d);
    expect(d.markStatus).toHaveBeenCalledWith('imp-1', 'escalated', expect.anything());
    expect(status).toContain('reviewed 1');
  });
  it('dispatch throw -> goes out as an ALARM, not a status log, and is counted as errored', async () => {
    // Verbatim error from journald 2026-09-16 21:30:10.
    const msg = "createRun failed: Could not find the table 'public.hermes_runs' in the schema cache";
    const alarm = vi.fn(async () => {});
    const d = deps({ alarm, dispatchFix: vi.fn(async () => { throw new Error(msg); }) });
    const status = await reviewProposedImprovements(d);
    expect(alarm).toHaveBeenCalledWith(expect.stringContaining('hermes_runs'));
    expect(d.log).not.toHaveBeenCalledWith(expect.stringContaining('hermes_runs'));
    expect(status).toContain('1 errored');
  });
  it('dispatch throw without an alarm sink still reaches the log', async () => {
    const d = deps({ dispatchFix: vi.fn(async () => { throw new Error('boom'); }) });
    await reviewProposedImprovements(d);
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('boom'));
  });
  it('a successful fix reports 0 errored', async () => {
    expect(await reviewProposedImprovements(deps())).toContain('0 errored');
  });
  it('nothing to review is a no-op', async () => {
    const d = deps({ fetchProposed: vi.fn(async () => []) });
    expect(await reviewProposedImprovements(d)).toBe('nothing to review');
  });
});

describe('shouldRaiseAlarm', () => {
  const DAY = 24 * 60 * 60 * 1000;
  it('raises the first time a key is seen', () => {
    expect(shouldRaiseAlarm('k', new Map(), 1000)).toBe(true);
  });
  it('suppresses a repeat inside the window', () => {
    const m = new Map<string, number>();
    shouldRaiseAlarm('k', m, 0);
    expect(shouldRaiseAlarm('k', m, DAY - 1)).toBe(false);
  });
  it('raises again once the window has passed', () => {
    const m = new Map<string, number>();
    shouldRaiseAlarm('k', m, 0);
    expect(shouldRaiseAlarm('k', m, DAY)).toBe(true);
  });
  it('keys are independent', () => {
    const m = new Map<string, number>();
    shouldRaiseAlarm('a', m, 0);
    expect(shouldRaiseAlarm('b', m, 1)).toBe(true);
  });
});
