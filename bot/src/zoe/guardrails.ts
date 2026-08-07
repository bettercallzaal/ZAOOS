/**
 * guardrails.ts - a composable guardrail abstraction for ZOE.
 *
 * The #2 adopt from the ZOE-vs-toolkits audit (doc 2235): ZOE's safety checks
 * (cost-governance, pii, preflight) each have their own shape and are called ad hoc.
 * OpenAI's Agents SDK (openai/openai-agents-python, Apache-2.0) models guardrails as a
 * first-class, composable interface with a "tripwire" result. This brings the same
 * pattern to ZOE: one `Guardrail` interface + a `runGuardrails` pipeline, so every
 * pre/post check is uniform, ordered, and testable.
 *
 * This FORMALIZES the existing guards, it does not replace them. Adoption = have
 * cost-governance.ts / pii.ts / preflight.ts each expose a `Guardrail` (adapters at the
 * bottom show exactly how). Wiring the live concierge/worker path to call
 * `runGuardrails` is a separate, gated step - this module is additive and imported by
 * nothing yet.
 *
 * Pattern credit: openai/openai-agents-python guardrail.py (Apache-2.0).
 */

/** When a guardrail runs relative to the model call. */
export type GuardrailStage = 'input' | 'output' | 'both';

/** What a guardrail sees. `input` = the prompt/request; `output` = the model result. */
export interface GuardrailContext {
  input?: string;
  output?: string;
  meta?: Record<string, unknown>;
}

/**
 * A guardrail's verdict. `tripwire: true` means BLOCK (the check failed / a limit was
 * hit); `reason` explains why, for logging + the user-facing surface.
 */
export interface GuardrailResult {
  tripwire: boolean;
  reason: string;
}

/** One composable safety check. Pure + synchronous by default; see AsyncGuardrail for I/O. */
export interface Guardrail {
  name: string;
  stage: GuardrailStage;
  check(ctx: GuardrailContext): GuardrailResult;
}

/** A guardrail that needs I/O (a network/db check) returns a promise. */
export interface AsyncGuardrail {
  name: string;
  stage: GuardrailStage;
  check(ctx: GuardrailContext): Promise<GuardrailResult>;
}

/** The outcome of running a pipeline: passed only if NO guardrail tripped. */
export interface GuardrailRunResult {
  passed: boolean;
  trips: Array<{ name: string; reason: string }>;
}

function appliesTo(g: { stage: GuardrailStage }, stage: 'input' | 'output'): boolean {
  return g.stage === stage || g.stage === 'both';
}

/**
 * Run the guardrails that apply to `stage`, in order. Collects EVERY trip (does not
 * short-circuit) so a caller sees all reasons at once. `passed` is true iff zero trips.
 */
export function runGuardrails(
  guards: Guardrail[],
  ctx: GuardrailContext,
  stage: 'input' | 'output',
): GuardrailRunResult {
  const trips: Array<{ name: string; reason: string }> = [];
  for (const g of guards) {
    if (!appliesTo(g, stage)) continue;
    const r = g.check(ctx);
    if (r.tripwire) trips.push({ name: g.name, reason: r.reason });
  }
  return { passed: trips.length === 0, trips };
}

/** Async variant for guardrails that do I/O. Same collect-all semantics. */
export async function runGuardrailsAsync(
  guards: AsyncGuardrail[],
  ctx: GuardrailContext,
  stage: 'input' | 'output',
): Promise<GuardrailRunResult> {
  const trips: Array<{ name: string; reason: string }> = [];
  for (const g of guards) {
    if (!appliesTo(g, stage)) continue;
    const r = await g.check(ctx);
    if (r.tripwire) trips.push({ name: g.name, reason: r.reason });
  }
  return { passed: trips.length === 0, trips };
}

// ── Adapter examples: how ZOE's REAL guards map onto this interface ──────────────
// These are self-contained reference adapters (no imports, so this module stays
// additive + testable in isolation). Adoption = replace each stub body with a call to
// the real function named in the comment.

/** Maps `cost-governance.ts shouldPauseAutonomousWork()` -> an input guardrail. */
export function costGuard(shouldPause: () => boolean): Guardrail {
  return {
    name: 'cost-governance',
    stage: 'input',
    check: () => shouldPause()
      ? { tripwire: true, reason: 'spend at hard-stop threshold (>=95%) - autonomous work paused' }
      : { tripwire: false, reason: '' },
  };
}

/** Maps `pii.ts` scan -> an output guardrail (never emit PII in a response). */
export function piiGuard(scan: (text: string) => boolean): Guardrail {
  return {
    name: 'pii',
    stage: 'output',
    check: (ctx) => ctx.output && scan(ctx.output)
      ? { tripwire: true, reason: 'output contains PII - redact before sending' }
      : { tripwire: false, reason: '' },
  };
}

/** Maps `preflight.ts hasCriticalFailure()` -> an input guardrail (don't run if broken). */
export function preflightGuard(hasCriticalFailure: () => boolean): Guardrail {
  return {
    name: 'preflight',
    stage: 'input',
    check: () => hasCriticalFailure()
      ? { tripwire: true, reason: 'a critical capability (env/key) is missing - fail loud, do not proceed' }
      : { tripwire: false, reason: '' },
  };
}

/** Self-test - exported so a runner (or vitest) can call it; returns 0 on success. */
export function _selftest(): number {
  const guards = [
    costGuard(() => false),
    preflightGuard(() => true), // critical failure -> should trip on input
    piiGuard((t) => t.includes('555-12')), // trips on a fake phone in output
  ];
  // input stage: costGuard passes, preflightGuard trips; piiGuard is output-only, skipped
  const inRes = runGuardrails(guards, { input: 'do the thing' }, 'input');
  if (inRes.passed) throw new Error('preflight critical failure must trip on input');
  if (inRes.trips.length !== 1 || inRes.trips[0].name !== 'preflight') {
    throw new Error('exactly the preflight guard should trip on input: ' + JSON.stringify(inRes.trips));
  }
  // output stage: only piiGuard applies; trips on the PII
  const outTrip = runGuardrails(guards, { output: 'call 555-1234' }, 'output');
  if (outTrip.passed || outTrip.trips[0].name !== 'pii') {
    throw new Error('pii guard should trip on output with a phone number');
  }
  // clean output passes
  const outClean = runGuardrails(guards, { output: 'all good' }, 'output');
  if (!outClean.passed) throw new Error('clean output must pass');
  // all-clear input (no critical failure) passes
  const okGuards = [costGuard(() => false), preflightGuard(() => false)];
  if (!runGuardrails(okGuards, { input: 'go' }, 'input').passed) {
    throw new Error('all-clear input must pass');
  }
  // collect-all: two input trips both reported, not short-circuited
  const twoTrip = runGuardrails(
    [costGuard(() => true), preflightGuard(() => true)],
    { input: 'x' }, 'input',
  );
  if (twoTrip.trips.length !== 2) throw new Error('runGuardrails must collect ALL trips, got ' + twoTrip.trips.length);
  // eslint-disable-next-line no-console
  console.log('selftest OK');
  return 0;
}
