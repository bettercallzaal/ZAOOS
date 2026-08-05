/**
 * verify-replan.ts - a ResultVerifier + bounded replan for ZOE's autonomous
 * research (work-loop). Today the work-loop commits whatever the research-worker
 * returns, with no check that it actually answers the goal - so a partial or
 * off-target research pass still lands as a doc + PR. This adds the VMAO-style
 * Verify -> Replan step: judge the output against the goal, and on a graded-
 * incomplete result, re-research once or twice with the missing aspects fed back,
 * before committing.
 *
 * Pure + testable: buildVerifyPrompt, parseVerifyVerdict, shouldRetry,
 * augmentGoalForRetry are pure; verifyReplanResearch takes injected `research`
 * and `judge` fns so it can be unit-tested with no network.
 *
 * Bounded (agent-loops rule 5): a hard maxRetries, and a stop as soon as the
 * verdict is accept. Fail-open: a judge/parse failure defaults to ACCEPT (logged)
 * - research is low-stakes + PR-only, and a broken judge must never block all
 * research (silent-failure-guard: the fallback is loud in the log, not silent).
 */

export type VerifyStatus = 'complete' | 'partial' | 'incomplete';
export type VerifyRecommendation = 'accept' | 'retry' | 'escalate';

export interface VerifyVerdict {
  status: VerifyStatus;
  /** 0-1 completeness score. */
  score: number;
  /** aspects of the goal the output did not cover. */
  missing: string[];
  recommendation: VerifyRecommendation;
}

export const DEFAULT_MAX_RETRIES = 2;
export const RETRY_SCORE_THRESHOLD = 0.7;

/** The judge prompt: score the research output against the goal, return JSON. */
export function buildVerifyPrompt(goal: string, output: string): string {
  return [
    'You are an independent verifier grading whether a research result adequately answers a goal.',
    'Be strict: a plausible-but-incomplete answer is NOT complete.',
    '',
    `GOAL:\n${goal}`,
    '',
    `RESEARCH RESULT:\n${output.slice(0, 8000)}`,
    '',
    'Return ONLY a JSON object, no prose, in this exact shape:',
    '{"status":"complete|partial|incomplete","score":0.0,"missing":["aspect not covered", "..."],"recommendation":"accept|retry|escalate"}',
    '- score: 0-1 how completely the result answers the goal.',
    '- missing: concrete aspects of the goal the result failed to cover (empty if complete).',
    '- recommendation: accept if good enough, retry if a re-research could close the gap, escalate if it needs a human.',
  ].join('\n');
}

/**
 * Parse the judge's JSON verdict. Fail-open: any parse/shape failure returns an
 * ACCEPT verdict (so a broken judge never blocks research) - the caller should
 * log that it fell back.
 */
export function parseVerifyVerdict(raw: string): VerifyVerdict {
  const fallback: VerifyVerdict = { status: 'complete', score: 1, missing: [], recommendation: 'accept' };
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return fallback;
    const j = JSON.parse(m[0]) as Partial<VerifyVerdict>;
    const status: VerifyStatus =
      j.status === 'incomplete' || j.status === 'partial' ? j.status : 'complete';
    const score = typeof j.score === 'number' && j.score >= 0 && j.score <= 1 ? j.score : 1;
    const missing = Array.isArray(j.missing) ? j.missing.filter((x) => typeof x === 'string').slice(0, 12) : [];
    const recommendation: VerifyRecommendation =
      j.recommendation === 'retry' || j.recommendation === 'escalate' ? j.recommendation : 'accept';
    return { status, score, missing, recommendation };
  } catch {
    return fallback;
  }
}

/** Retry only when the judge says retry AND the score is under threshold AND we have budget. */
export function shouldRetry(v: VerifyVerdict, retriesSoFar: number, maxRetries = DEFAULT_MAX_RETRIES): boolean {
  return v.recommendation === 'retry' && v.score < RETRY_SCORE_THRESHOLD && retriesSoFar < maxRetries;
}

/** Re-research the WHOLE goal but focused on the missing aspects (progressive refinement). */
export function augmentGoalForRetry(goal: string, missing: string[]): string {
  if (missing.length === 0) return goal;
  return `${goal}\n\n(The prior research pass was graded incomplete. This pass MUST additionally cover: ${missing.join('; ')}.)`;
}

export interface VerifyReplanDeps {
  /** Re-run the research-worker for an augmented goal; returns its output (or '' on failure). */
  research: (goal: string) => Promise<string>;
  /** Call the LLM judge with a prompt; returns its raw text. */
  judge: (prompt: string) => Promise<string>;
  maxRetries?: number;
  log?: (msg: string) => void;
}

export interface VerifyReplanResult {
  output: string;
  verdict: VerifyVerdict;
  retries: number;
}

/**
 * Verify the first research output; while the verdict says retry (bounded),
 * re-research with the missing aspects fed back and re-verify. Returns the final
 * output + verdict + retry count. Never throws (fail-open to accept).
 */
export async function verifyReplanResearch(
  goal: string,
  firstOutput: string,
  deps: VerifyReplanDeps,
): Promise<VerifyReplanResult> {
  const max = deps.maxRetries ?? DEFAULT_MAX_RETRIES;
  let output = firstOutput;
  let retries = 0;

  const judgeOnce = async (o: string): Promise<VerifyVerdict> => {
    try {
      return parseVerifyVerdict(await deps.judge(buildVerifyPrompt(goal, o)));
    } catch (e) {
      deps.log?.(`verify-replan: judge failed, accepting - ${(e as Error)?.message}`);
      return { status: 'complete', score: 1, missing: [], recommendation: 'accept' };
    }
  };

  let verdict = await judgeOnce(output);
  while (shouldRetry(verdict, retries, max)) {
    retries += 1;
    deps.log?.(`verify-replan: retry ${retries}/${max} (score ${verdict.score}) - missing: ${verdict.missing.join(', ')}`);
    const retryGoal = augmentGoalForRetry(goal, verdict.missing);
    const newOutput = await deps.research(retryGoal).catch(() => '');
    if (!newOutput.trim()) {
      deps.log?.('verify-replan: retry produced no output, keeping best');
      break;
    }
    output = newOutput; // re-research covers the whole goal + missing focus
    verdict = await judgeOnce(output);
  }
  return { output, verdict, retries };
}
