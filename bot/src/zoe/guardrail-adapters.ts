/**
 * guardrail-adapters.ts - ZOE's real guards bound to the Guardrail interface.
 *
 * The #2 adopt from the ZOE-vs-toolkits audit (doc 2235), wired: cost-governance,
 * pii, and preflight each implement the composable Guardrail interface from
 * guardrails.ts (#2926), so the concierge/worker path can run ONE uniform
 * pre/post pipeline instead of three ad-hoc call sites.
 *
 * This module only BINDS existing guards - zero behavior change to the guards
 * themselves. Call-path wiring: `runConciergeGuardrails(ctx, stage)` is the single
 * entry; inserting it into concierge.ts is a 1-line change left for the wiring PR
 * review (live call-path edits get human eyes per the workflow contract).
 *
 * Pattern credit: openai/openai-agents-python guardrail.py (Apache-2.0).
 */
import { runGuardrails, type Guardrail, type GuardrailContext, type GuardrailRunResult } from './guardrails';
import { shouldPauseAutonomousWork } from './cost-governance';
import { containsPii } from './pii';
import { checkCapabilities, hasCriticalFailure } from './preflight';

/** cost-governance.ts -> input guard: spend at hard-stop pauses autonomous work. */
export const zoeCostGuard: Guardrail = {
  name: 'cost-governance',
  stage: 'input',
  check: () =>
    shouldPauseAutonomousWork()
      ? { tripwire: true, reason: 'spend at hard-stop threshold - autonomous work paused (cost-governance)' }
      : { tripwire: false, reason: '' },
};

/** pii.ts -> output guard: never emit non-allowlisted PII in a response. */
export const zoePiiGuard: Guardrail = {
  name: 'pii',
  stage: 'output',
  check: (ctx) =>
    ctx.output && containsPii(ctx.output)
      ? { tripwire: true, reason: 'output contains PII outside the allowlist - redact before sending (pii-hygiene)' }
      : { tripwire: false, reason: '' },
};

/** preflight.ts -> input guard: a critical capability (env/key) missing = fail loud. */
export const zoePreflightGuard: Guardrail = {
  name: 'preflight',
  stage: 'input',
  check: () =>
    hasCriticalFailure(checkCapabilities(process.env))
      ? { tripwire: true, reason: 'a critical capability (env/key) is missing - fail loud, do not proceed (preflight)' }
      : { tripwire: false, reason: '' },
};

/** The default ZOE pipeline, in check order. */
export const ZOE_GUARDRAILS: Guardrail[] = [zoePreflightGuard, zoeCostGuard, zoePiiGuard];

/**
 * The single uniform entry the concierge/worker path calls:
 *   pre:  runConciergeGuardrails({ input }, 'input')  -> block the turn if !passed
 *   post: runConciergeGuardrails({ output }, 'output') -> redact/hold if !passed
 * Collects ALL trips (no short-circuit) so every reason surfaces at once.
 */
export function runConciergeGuardrails(
  ctx: GuardrailContext,
  stage: 'input' | 'output',
): GuardrailRunResult {
  return runGuardrails(ZOE_GUARDRAILS, ctx, stage);
}
