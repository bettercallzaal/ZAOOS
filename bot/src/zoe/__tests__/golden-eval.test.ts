import { describe, it, expect, vi } from 'vitest';
import {
  gradeOutput,
  runGoldenSet,
  formatGoldenReport,
  SEED_GOLDEN_SET,
  type GoldenCase,
} from '../golden-eval';

describe('gradeOutput', () => {
  it('passes when all deterministic checks hold', () => {
    const r = gradeOutput('The ZAO is a decentralized music network. Here is a long enough answer.', {
      contains: ['zao'],
      notContains: ['as an ai language model'],
      minLength: 20,
      matches: ['network|community'],
    });
    expect(r.pass).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it('fails on missing text, forbidden text, short length, and no-match', () => {
    const r = gradeOutput('short', {
      contains: ['zao'],
      notContains: ['short'],
      minLength: 100,
      matches: ['network'],
    });
    expect(r.pass).toBe(false);
    expect(r.failures.length).toBe(4); // missing / forbidden / too-short / no-match
  });

  it('checks jsonParseable (block inside prose counts)', () => {
    expect(gradeOutput('here: {"a":1}', { jsonParseable: true }).pass).toBe(true);
    expect(gradeOutput('no json here', { jsonParseable: true }).pass).toBe(false);
  });
});

describe('runGoldenSet', () => {
  const cases: GoldenCase[] = [
    { id: 'a', input: 'x', expect: { contains: ['good'] } },
    { id: 'b', input: 'y', expect: { contains: ['nope'] } },
  ];

  it('replays each case and reports pass/fail counts', async () => {
    const run = vi.fn(async (input: string) => (input === 'x' ? 'this is good' : 'this is bad'));
    const report = await runGoldenSet(cases, run);
    expect(report).toMatchObject({ total: 2, passed: 1, failed: 1 });
    expect(report.results.find((r) => r.id === 'a')?.pass).toBe(true);
    expect(report.results.find((r) => r.id === 'b')?.pass).toBe(false);
  });

  it('a runner that THROWS is a fail-closed FAIL, never a silent pass', async () => {
    const run = vi.fn(async () => { throw new Error('cli down'); });
    const report = await runGoldenSet([cases[0]], run);
    expect(report.failed).toBe(1);
    expect(report.results[0].failures[0]).toMatch(/runner threw/);
  });
});

describe('formatGoldenReport + seed set', () => {
  it('formats a clean pass and a failure list', () => {
    expect(formatGoldenReport({ total: 2, passed: 2, failed: 0, results: [] })).toBe('Golden eval: 2/2 passed');
    const withFail = formatGoldenReport({
      total: 2,
      passed: 1,
      failed: 1,
      results: [{ id: 'b', pass: false, failures: ['missing required text: "nope"'] }],
    });
    expect(withFail).toContain('1 FAILED');
    expect(withFail).toContain('b: missing required text');
  });

  it('the seed set is non-empty and well-formed', () => {
    expect(SEED_GOLDEN_SET.length).toBeGreaterThan(0);
    for (const c of SEED_GOLDEN_SET) {
      expect(c.id).toBeTruthy();
      expect(c.input).toBeTruthy();
      expect(c.expect).toBeTruthy();
    }
  });
});
