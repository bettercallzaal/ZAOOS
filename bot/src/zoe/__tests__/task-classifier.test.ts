import { describe, it, expect } from 'vitest';
import { classifyTask, applyClassification, needsTagging, planReconciliation, type TrackerRow } from '../task-classifier';

describe('needsTagging', () => {
  it('flags rows with no themes or no next_owner', () => {
    expect(needsTagging({ id: '1', title: 'x' })).toBe(true);
    expect(needsTagging({ id: '2', title: 'x', metadata: { themes: ['web3'] } })).toBe(true); // no owner
    expect(needsTagging({ id: '3', title: 'x', metadata: { next_owner: 'me' } })).toBe(true); // no themes
  });
  it('passes fully-tagged rows', () => {
    expect(needsTagging({ id: '4', title: 'x', metadata: { themes: ['web3'], next_owner: 'me' } })).toBe(false);
  });
});

describe('planReconciliation', () => {
  it('only patches untagged rows and preserves delegated routing', () => {
    const rows: TrackerRow[] = [
      { id: 'a', title: 'WaveWarZ profiles' }, // untagged -> patch
      { id: 'b', title: 'done-ish', metadata: { themes: ['ai'], next_owner: 'agent' } }, // tagged -> skip
      { id: 'c', title: 'Songjam fork', metadata: { delegated_to: 'research-queue' } }, // untagged, delegated
    ];
    const patches = planReconciliation(rows, '2026-07-06');
    const ids = patches.map((p) => p.id);
    expect(ids).toEqual(['a', 'c']);
    const cPatch = patches.find((p) => p.id === 'c')!.patch.metadata as Record<string, unknown>;
    expect(cPatch.next_owner).toBe('agent'); // delegated routing preserved
    expect(cPatch.delegated_to).toBe('research-queue'); // other metadata preserved
  });
  it('returns an empty plan when everything is tagged', () => {
    const rows: TrackerRow[] = [
      { id: 'a', title: 'x', metadata: { themes: ['ops'], next_owner: 'me' } },
    ];
    expect(planReconciliation(rows, '2026-07-06')).toEqual([]);
  });
});

describe('classifyTask', () => {
  it('routes a generic unmapped task to review, not auto-assigned', () => {
    const c = classifyTask({ title: 'Fill 6 WaveWarZ profiles' });
    expect(c.brands).toEqual(['WaveWarZ']);
    expect(c.themes).toContain('music');
    expect(c.nextOwner).toBe('review'); // unmapped -> review, not auto-assigned to a person
  });

  it('routes a fractal/onchain task to web3 + governance themes and The ZAO brand', () => {
    const c = classifyTask({ title: 'Fractal: Civil wallet fix + check ordaos' });
    expect(c.brands).toEqual(['The ZAO']);
    expect(c.themes).toEqual(expect.arrayContaining(['web3']));
    expect(c.category).toBe('Site / Tech');
  });

  it('caps themes at 2', () => {
    const c = classifyTask({ title: 'wavewarz onchain wallet mint fractal research profile campaign' });
    expect(c.themes.length).toBeLessThanOrEqual(2);
  });

  it('forces next_owner=agent when delegated', () => {
    const c = classifyTask({ title: 'Songjam fork', delegatedTo: 'research-queue' });
    expect(c.nextOwner).toBe('agent');
  });

  it('forces next_owner=me when needsZaal, over a blocked status', () => {
    const c = classifyTask({ title: 'ZAO Numbers - website analytics', needsZaal: true, status: 'blocked' });
    expect(c.nextOwner).toBe('me');
  });

  it('maps blocked status to blocked when not delegated/needsZaal', () => {
    const c = classifyTask({ title: 'Some task', status: 'blocked' });
    expect(c.nextOwner).toBe('blocked');
  });

  it('routes code-verifiable tasks (build/test/deploy) to agent for ZOE post-deploy checks', () => {
    const testCases = [
      { title: 'test this PR', expectedOwner: 'agent' as const },
      { title: 'build verification', expectedOwner: 'agent' as const },
      { title: 'run esbuild smoke test', expectedOwner: 'agent' as const },
      { title: 'check TypeScript coverage', expectedOwner: 'agent' as const },
      { title: 'Deploy and run CI smoke', expectedOwner: 'agent' as const },
    ];
    for (const tc of testCases) {
      const c = classifyTask({ title: tc.title });
      expect(c.nextOwner).toBe(tc.expectedOwner);
    }
  });

  it('falls back to The ZAO / Other / ops / review for unmatched text', () => {
    const c = classifyTask({ title: 'xyzzy plugh frobnicate' });
    expect(c.brands).toEqual(['The ZAO']);
    expect(c.category).toBe('Other');
    expect(c.themes).toEqual(['ops']);
    expect(c.nextOwner).toBe('review'); // unmatched -> review for human routing
  });

  it('is deterministic', () => {
    const a = classifyTask({ title: 'ZAOstock permit', notes: 'call Roddy' });
    const b = classifyTask({ title: 'ZAOstock permit', notes: 'call Roddy' });
    expect(a).toEqual(b);
  });
});

describe('applyClassification', () => {
  // Use a title that doesn't match code-verifiable patterns
  const c = classifyTask({ title: 'WaveWarZ Solana bridge partnerships' });

  it('fills brands/category when absent and always sets metadata themes/next_owner', () => {
    const out = applyClassification({ title: 'x' }, c, '2026-07-06');
    expect(out.brands).toEqual(['WaveWarZ']);
    expect(out.category).toBe('Site / Tech');
    const meta = out.metadata as Record<string, unknown>;
    expect(meta.themes).toEqual(c.themes);
    expect(meta.next_owner).toBe('review'); // generic task -> review, not auto-assigned
    expect(meta.autotagged).toBe('2026-07-06');
  });

  it('does not clobber an existing brand/category', () => {
    const out = applyClassification(
      { title: 'x', brands: ['ZOE'], category: 'Ops' },
      c,
      '2026-07-06',
    );
    expect(out.brands).toEqual(['ZOE']); // preserved
    expect(out.category).toBe('Ops'); // preserved
  });

  it('preserves other metadata keys', () => {
    const out = applyClassification(
      { title: 'x', metadata: { list: 'zaal-master', tier: 'P1' } },
      c,
      '2026-07-06',
    );
    const meta = out.metadata as Record<string, unknown>;
    expect(meta.list).toBe('zaal-master');
    expect(meta.tier).toBe('P1');
    expect(meta.next_owner).toBe('review'); // generic task -> review
  });

  it('does not mutate the input row', () => {
    const row = { title: 'x', metadata: { a: 1 } };
    applyClassification(row, c, '2026-07-06');
    expect(row.metadata).toEqual({ a: 1 });
  });
});
