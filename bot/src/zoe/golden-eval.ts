/**
 * golden-eval.ts - a golden-set regression harness for ZOE (doc 2200).
 *
 * ZOE has a per-change gate (loop-evals.md) but no standing REGRESSION SET: a
 * fixed list of tasks you replay whenever a persona / worker-spec / learning
 * changes, so "this prompt edit made ZOE worse" is caught BEFORE it ships. This
 * is the "evaluation harness" doc 2200 named the winning teams invested in.
 *
 * Two-tier, per Langfuse/Sonar (doc 2198/2200): the grader here is the
 * DETERMINISTIC tier - a real command that returns pass/fail identically every
 * run (output contains X, matches a regex, parses as JSON, meets a length floor).
 * A probabilistic LLM-judge tier can layer on top later (reuse verify-replan's
 * judge), but the hard halt is deterministic - "a failing check is a fact."
 *
 * No new dependency. gradeOutput is pure + unit-tested; runGoldenSet takes an
 * injected `run` fn (the ZOE task runner) so tests never call the CLI, and CI
 * wiring (replay on a persona/spec change) is a thin script on top.
 */

export interface GoldenExpect {
  /** output must contain each string (case-insensitive). */
  contains?: string[];
  /** output must NOT contain any of these (case-insensitive). */
  notContains?: string[];
  /** output must match each regex (given as source strings, matched case-insensitively). */
  matches?: string[];
  /** output length floor (chars) - guards against a truncated/empty regression. */
  minLength?: number;
  /** output (or a {...} block inside it) must JSON-parse. */
  jsonParseable?: boolean;
}

export interface GoldenCase {
  id: string;
  input: string;
  expect: GoldenExpect;
}

export interface CaseResult {
  id: string;
  pass: boolean;
  failures: string[];
}

export interface GoldenReport {
  total: number;
  passed: number;
  failed: number;
  results: CaseResult[];
}

/** Deterministic grader: returns pass + the list of failed checks (empty if pass). */
export function gradeOutput(output: string, expect: GoldenExpect): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  const lower = output.toLowerCase();

  if (typeof expect.minLength === 'number' && output.trim().length < expect.minLength) {
    failures.push(`too short (${output.trim().length} < ${expect.minLength})`);
  }
  for (const s of expect.contains ?? []) {
    if (!lower.includes(s.toLowerCase())) failures.push(`missing required text: "${s}"`);
  }
  for (const s of expect.notContains ?? []) {
    if (lower.includes(s.toLowerCase())) failures.push(`contains forbidden text: "${s}"`);
  }
  for (const src of expect.matches ?? []) {
    let re: RegExp;
    try {
      re = new RegExp(src, 'i');
    } catch {
      failures.push(`bad regex in expectation: "${src}"`);
      continue;
    }
    if (!re.test(output)) failures.push(`did not match /${src}/i`);
  }
  if (expect.jsonParseable) {
    const m = output.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    let ok = false;
    if (m) {
      try {
        JSON.parse(m[0]);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) failures.push('no parseable JSON found in output');
  }

  return { pass: failures.length === 0, failures };
}

/**
 * Replay every golden case through `run` (the ZOE task runner) and grade the
 * output. `run` is injected so this is testable + reusable for any runner. A
 * case whose `run` throws is a FAIL (fail-closed - a runner that crashed is not
 * a pass; loop-evals rule). Never throws.
 */
export async function runGoldenSet(
  cases: GoldenCase[],
  run: (input: string) => Promise<string>,
): Promise<GoldenReport> {
  const results: CaseResult[] = [];
  for (const c of cases) {
    try {
      const output = await run(c.input);
      const { pass, failures } = gradeOutput(output, c.expect);
      results.push({ id: c.id, pass, failures });
    } catch (e) {
      results.push({ id: c.id, pass: false, failures: [`runner threw: ${(e as Error)?.message ?? 'unknown'}`] });
    }
  }
  const passed = results.filter((r) => r.pass).length;
  return { total: cases.length, passed, failed: cases.length - passed, results };
}

/** Render a compact report for CI logs / the loop self-report. */
export function formatGoldenReport(report: GoldenReport): string {
  const head = `Golden eval: ${report.passed}/${report.total} passed` + (report.failed ? `, ${report.failed} FAILED` : '');
  const fails = report.results
    .filter((r) => !r.pass)
    .map((r) => `- ${r.id}: ${r.failures.join('; ')}`)
    .join('\n');
  return fails ? `${head}\n${fails}` : head;
}

/**
 * A small SEED golden set - deterministic expectations that a healthy ZOE should
 * always satisfy. Grow this as regressions are found (promote a real failing
 * case into a golden case, per Langfuse's golden-dataset flow). Kept tiny + real
 * on purpose - a golden set is only as good as its cases being genuinely golden.
 */
export const SEED_GOLDEN_SET: GoldenCase[] = [
  {
    id: 'research-has-substance',
    input: 'Research: what is the ZAO in one paragraph',
    expect: { minLength: 120, contains: ['zao'], notContains: ['as an ai language model'] },
  },
  {
    id: 'decompose-returns-json-plan',
    input: 'Plan: build a new feature with three steps and a review gate',
    expect: { jsonParseable: true, matches: ['subtask|step|plan'] },
  },
];
