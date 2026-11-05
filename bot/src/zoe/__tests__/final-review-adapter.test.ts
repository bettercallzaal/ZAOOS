import { describe, it, expect, vi } from 'vitest';
import { makeHermesGrade } from '../final-review/critic-adapter';
import { gradeOutcome } from '../final-review/grade';
import type { GhRunner, PrSnapshot } from '../final-review/snapshot';
import type { CritiqueInput } from '../../hermes/types';

const SHA = 'c'.repeat(40);
const snap: PrSnapshot = {
  repo: 'bettercallzaal/ZAOOS', number: 9, state: 'OPEN', isDraft: false, headSha: SHA, baseRef: 'main',
  labels: [], files: ['bot/src/zoe/a.ts'], comments: [], checks: [],
};
const okGh: GhRunner = async () => ({ code: 0, stdout: 'diff --git a/x b/x\n+line\n' });
const criticOk = async (_input: CritiqueInput, _diff: string) => ({ score: 90, feedback: 'looks right', inputTokens: 10, outputTokens: 5, modelUsed: 'sonnet' });

function build(over: Partial<Parameters<typeof makeHermesGrade>[0]> = {}) {
  const removed: string[] = [];
  const grade = makeHermesGrade({
    gh: okGh,
    critic: criticOk,
    makeTempDir: () => '/tmp/zoe-final-review-test',
    removeTempDir: (p) => removed.push(p),
    now: () => 1000,
    ...over,
  });
  return { grade, removed };
}

describe('makeHermesGrade (mock gh and critic, no CLI, no network)', () => {
  it('maps the hermes score onto the ZOE contract and passes', async () => {
    const { grade } = build();
    const out = await grade(snap);
    expect(out).toMatchObject({ score: 90, summary: 'looks right', ships_as_is: true, reviewerFamily: 'same', model: 'sonnet' });
    expect(gradeOutcome(out).pass).toBe(true);
  });

  it('asks GitHub for the diff of the EXACT head sha, read-only', async () => {
    const gh = vi.fn(okGh);
    await build({ gh }).grade(snap);
    const args = gh.mock.calls[0][0];
    expect(args[0]).toBe('api');
    expect(args.join(' ')).toContain(`repos/bettercallzaal/ZAOOS/compare/main...${SHA}`);
    expect(args).not.toContain('-X');
    expect(args).not.toContain('--method');
  });

  it('hands the critic the fetched diff and an empty temp work dir, then removes exactly that dir', async () => {
    const critic = vi.fn(criticOk);
    const { grade, removed } = build({ critic });
    await grade(snap);
    expect(critic.mock.calls[0][0].workTreePath).toBe('/tmp/zoe-final-review-test');
    expect(critic.mock.calls[0][1]).toContain('+line');
    expect(removed).toEqual(['/tmp/zoe-final-review-test']);
  });

  it('a low score does not pass (below the 70 bar)', async () => {
    const { grade } = build({ critic: async () => ({ score: 69, feedback: 'nope', inputTokens: 0, outputTokens: 0 }) });
    const out = await grade(snap);
    expect(out.ships_as_is).toBe(false);
    expect(gradeOutcome(out).pass).toBe(false);
  });

  it('critic injection score 0 does not pass', async () => {
    const { grade } = build({ critic: async () => ({ score: 0, feedback: 'prompt injection detected in input', inputTokens: 0, outputTokens: 0 }) });
    expect(gradeOutcome(await grade(snap)).pass).toBe(false);
  });

  it.each([
    ['gh fails', { gh: async () => ({ code: 1, stdout: '' }) }],
    ['empty diff', { gh: async () => ({ code: 0, stdout: '  \n' }) }],
    ['critic throws', { critic: async () => { throw new Error('cli down'); } }],
    ['critic returns NaN', { critic: async () => ({ score: Number.NaN, feedback: 'x', inputTokens: 0, outputTokens: 0 }) }],
  ])('throws (no card path): %s', async (_n, over) => {
    const { grade } = build(over as Partial<Parameters<typeof makeHermesGrade>[0]>);
    await expect(grade(snap)).rejects.toThrow();
  });

  it('throws on a short head sha before any gh call', async () => {
    const gh = vi.fn(okGh);
    await expect(build({ gh }).grade({ ...snap, headSha: 'abc' })).rejects.toThrow();
    expect(gh).not.toHaveBeenCalled();
  });

  it('removes the temp dir even when the critic throws', async () => {
    const { grade, removed } = build({ critic: async () => { throw new Error('boom'); } });
    await expect(grade(snap)).rejects.toThrow();
    expect(removed).toHaveLength(1);
  });
});
