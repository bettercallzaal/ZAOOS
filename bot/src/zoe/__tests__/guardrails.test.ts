/**
 * guardrails.test.ts - the composable guardrail abstraction (doc 2235 #2 adopt).
 */
import { describe, it, expect } from 'vitest';
import {
  runGuardrails,
  runGuardrailsAsync,
  costGuard,
  piiGuard,
  preflightGuard,
  type Guardrail,
  type AsyncGuardrail,
} from '../guardrails';

describe('runGuardrails', () => {
  it('trips a preflight critical failure on the input stage', () => {
    const guards = [costGuard(() => false), preflightGuard(() => true)];
    const res = runGuardrails(guards, { input: 'go' }, 'input');
    expect(res.passed).toBe(false);
    expect(res.trips.map((t) => t.name)).toEqual(['preflight']);
  });

  it('passes when all input guards are clear', () => {
    const guards = [costGuard(() => false), preflightGuard(() => false)];
    expect(runGuardrails(guards, { input: 'go' }, 'input').passed).toBe(true);
  });

  it('only runs guards that apply to the stage (pii is output-only)', () => {
    const guards = [piiGuard((t) => t.includes('555-12'))];
    // input stage: pii guard does not apply, so it passes
    expect(runGuardrails(guards, { input: 'call 555-1234' }, 'input').passed).toBe(true);
    // output stage: it applies and trips
    const out = runGuardrails(guards, { output: 'call 555-1234' }, 'output');
    expect(out.passed).toBe(false);
    expect(out.trips[0].name).toBe('pii');
  });

  it('collects ALL trips (does not short-circuit)', () => {
    const res = runGuardrails(
      [costGuard(() => true), preflightGuard(() => true)],
      { input: 'x' },
      'input',
    );
    expect(res.trips.length).toBe(2);
  });

  it('respects the both stage', () => {
    const both: Guardrail = {
      name: 'always',
      stage: 'both',
      check: () => ({ tripwire: true, reason: 'nope' }),
    };
    expect(runGuardrails([both], {}, 'input').passed).toBe(false);
    expect(runGuardrails([both], {}, 'output').passed).toBe(false);
  });
});

describe('runGuardrailsAsync', () => {
  it('awaits async guards and collects trips', async () => {
    const g: AsyncGuardrail = {
      name: 'remote',
      stage: 'input',
      check: async () => ({ tripwire: true, reason: 'remote check failed' }),
    };
    const res = await runGuardrailsAsync([g], { input: 'x' }, 'input');
    expect(res.passed).toBe(false);
    expect(res.trips[0].reason).toContain('remote');
  });
});
