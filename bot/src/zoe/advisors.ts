/**
 * Advisory Sandbox: independent advisors REVIEW Hermes decisions, they never make them.
 *
 * Zaal's call (2026-07-23): "keep what we have and create a sandbox to check
 * decisions made and dont make the decisions themselves but be advisors to help
 * hermes become better."
 *
 * This is Brandon's organism invariant applied one level up. In the organism the
 * Cortex is permanently ADVISORY and the Spine is the sole executor. Here the
 * alternative frameworks/models are permanently ADVISORY and Hermes remains the
 * sole executor. Advisors read a decision Hermes already made and say whether
 * they would have made it - nothing else.
 *
 * HARD INVARIANT: an advisor is text-in, verdict-out. It gets no tools, no repo
 * write path, no PR path, no merge path. That is enforced by construction here:
 * the only thing this module can produce is an AdvisorVerdict. There is no code
 * path from a verdict to an action. If a future change gives an advisor the
 * ability to act, it stops being an advisor and this invariant is broken.
 *
 * The point is LEARNING, not gatekeeping. Because Hermes decisions carry ground
 * truth (did the PR merge, did CI pass, was it reverted), we can score advisors
 * against reality over time and find where Hermes is genuinely weak - instead of
 * trusting whichever model sounds most confident.
 */

import { z } from 'zod';

/** How a Hermes decision actually turned out. The label we learn against. */
export type DecisionOutcome = 'merged' | 'closed' | 'reverted' | 'ci_failed' | 'unknown';

/** A decision Hermes already made, replayed for review. Read-only input. */
export interface HermesDecision {
  runId: string;
  /** The issue/problem Hermes was asked to fix. */
  issueText: string;
  /** The diff Hermes produced. */
  diff: string;
  /** Hermes' own critic score (0-100), if it ran. */
  criticScore: number | null;
  /** Ground truth, once known. */
  outcome: DecisionOutcome;
}

export const VerdictSchema = z.object({
  /** Would this advisor have shipped the same change? */
  agrees: z.boolean(),
  /** Specific, concrete concerns. Empty when it fully agrees. */
  concerns: z.array(z.string()).max(6).default([]),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string().min(1).max(600),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export interface AdvisorVerdict extends Verdict {
  /** Which advisor produced this (model/framework id). */
  advisor: string;
}

/** An advisor is just a named perspective + the model that voices it. */
export interface Advisor {
  id: string;
  /** The lens this advisor reviews through - diversity beats redundancy. */
  lens: string;
}

/**
 * Distinct lenses, not N copies of the same reviewer. Redundant advisors agree
 * with each other and teach nothing; different lenses catch different failures.
 */
export const ADVISORS: Advisor[] = [
  { id: 'correctness', lens: 'Does this diff actually fix the stated problem, and is it correct? Look for logic errors, off-by-one, wrong branch, unhandled null.' },
  { id: 'safety', lens: 'Could this diff cause harm? Look for secrets, destructive operations, migrations, auth/permission changes, anything irreversible.' },
  { id: 'scope', lens: 'Is this the SMALLEST change that fixes it? Flag unrequested refactors, scope creep, or unrelated edits bundled in.' },
  { id: 'regression', lens: 'What could this break that currently works? Look for changed shared behavior, altered contracts, missing test coverage.' },
];

// ---------------------------------------------------------------------------
// Pure helpers - the tested core.
// ---------------------------------------------------------------------------

export function buildAdvisorSystemPrompt(advisor: Advisor): string {
  return [
    'You are an ADVISOR reviewing a code change that another agent (Hermes) already made.',
    'You do NOT make the decision and you cannot act - you only give a verdict on the decision made.',
    `Your lens: ${advisor.lens}`,
    'Judge only through your lens. Do not restate general praise. If you agree, say so briefly.',
    'Respond with ONLY JSON: {"agrees": true|false, "concerns": ["..."], "confidence": "low|medium|high", "reasoning": "<1-3 sentences>"}',
  ].join('\n');
}

export function buildAdvisorUserPrompt(d: HermesDecision): string {
  return [
    `Problem Hermes was asked to fix:`,
    d.issueText.slice(0, 2000),
    ``,
    `The diff Hermes produced:`,
    d.diff.slice(0, 6000),
    ``,
    d.criticScore !== null ? `Hermes' own critic scored this ${d.criticScore}/100.` : `Hermes' critic did not score this.`,
    ``,
    `Would you have shipped this change? JSON only.`,
  ].join('\n');
}

/** Parse an advisor verdict. Malformed output = an abstention, never an approval. */
export function parseVerdict(raw: string, advisor: string): AdvisorVerdict {
  const fenced = raw?.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : (raw ?? '');
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const parsed = VerdictSchema.safeParse(JSON.parse(candidate.slice(start, end + 1)));
      if (parsed.success) return { advisor, ...parsed.data };
    } catch {
      // fall through to abstention
    }
  }
  return {
    advisor,
    agrees: false,
    concerns: ['advisor output could not be parsed'],
    confidence: 'low',
    reasoning: 'unparseable verdict - counted as an abstention, not an approval',
  };
}

export interface Consensus {
  total: number;
  agreed: number;
  dissented: number;
  unanimous: boolean;
  /** Concerns raised by any dissenting advisor, deduped. */
  concerns: string[];
}

export function consensus(verdicts: AdvisorVerdict[]): Consensus {
  const agreed = verdicts.filter((v) => v.agrees).length;
  const dissenters = verdicts.filter((v) => !v.agrees);
  const concerns = [...new Set(dissenters.flatMap((v) => v.concerns))];
  return {
    total: verdicts.length,
    agreed,
    dissented: dissenters.length,
    unanimous: verdicts.length > 0 && (agreed === verdicts.length || agreed === 0),
    concerns,
  };
}

/**
 * The learning signal. A decision is worth Zaal's attention when the advisors
 * and reality DISAGREE - those are the cases Hermes (or the advisors) got wrong.
 *
 *  - advisors dissented but it merged fine  -> advisors are noisy (or caught a latent bug)
 *  - advisors agreed but it failed/reverted -> a real Hermes blind spot, the valuable case
 *  - advisors dissented and it failed       -> advisors were right, tighten Hermes here
 */
export type LearningSignal = 'hermes_blind_spot' | 'advisors_vindicated' | 'advisors_noisy' | 'aligned' | 'pending';

export function learningSignal(c: Consensus, outcome: DecisionOutcome): LearningSignal {
  if (outcome === 'unknown') return 'pending';
  const bad = outcome === 'reverted' || outcome === 'ci_failed' || outcome === 'closed';
  const majorityDissent = c.total > 0 && c.dissented > c.agreed;
  if (bad && !majorityDissent) return 'hermes_blind_spot';
  if (bad && majorityDissent) return 'advisors_vindicated';
  if (!bad && majorityDissent) return 'advisors_noisy';
  return 'aligned';
}

/** Per-advisor calibration: how often was this advisor's call borne out? */
export function advisorAccuracy(
  history: Array<{ verdict: AdvisorVerdict; outcome: DecisionOutcome }>,
): Record<string, { calls: number; correct: number; accuracy: number }> {
  const out: Record<string, { calls: number; correct: number; accuracy: number }> = {};
  for (const { verdict, outcome } of history) {
    if (outcome === 'unknown') continue;
    const bad = outcome === 'reverted' || outcome === 'ci_failed' || outcome === 'closed';
    // Correct = dissented on a bad change, or agreed with a good one.
    const correct = verdict.agrees ? !bad : bad;
    const e = (out[verdict.advisor] ??= { calls: 0, correct: 0, accuracy: 0 });
    e.calls++;
    if (correct) e.correct++;
    e.accuracy = e.calls === 0 ? 0 : Number((e.correct / e.calls).toFixed(3));
  }
  return out;
}

/** A short, human-readable line for the learning log / group status. */
export function formatReviewSummary(d: HermesDecision, c: Consensus, signal: LearningSignal): string {
  const head = `[advisors] run ${d.runId.slice(0, 8)} - ${c.agreed}/${c.total} agreed, outcome ${d.outcome} -> ${signal}`;
  return c.concerns.length ? `${head}\n  concerns: ${c.concerns.slice(0, 3).join('; ')}` : head;
}

// ---------------------------------------------------------------------------
// Orchestration - injected deps. Note there is NO action dep here, by design:
// the only output is verdicts + a signal. Advisors cannot do anything.
// ---------------------------------------------------------------------------

export interface AdvisoryDeps {
  /** Cheap model call (OpenRouter ladder). Returns raw text. */
  ask: (systemPrompt: string, userPrompt: string) => Promise<string>;
  /** Persist the review for learning. Read-only w.r.t. the repo. */
  record: (input: {
    decision: HermesDecision;
    verdicts: AdvisorVerdict[];
    consensus: Consensus;
    signal: LearningSignal;
  }) => Promise<void>;
  /** Log line (status only). */
  log?: (message: string) => Promise<void>;
}

/**
 * Review one Hermes decision through every advisor lens. Returns the verdicts
 * and the learning signal. Takes no action and cannot take one.
 */
export async function reviewDecision(
  decision: HermesDecision,
  deps: AdvisoryDeps,
  advisors: Advisor[] = ADVISORS,
): Promise<{ verdicts: AdvisorVerdict[]; consensus: Consensus; signal: LearningSignal }> {
  const verdicts: AdvisorVerdict[] = [];
  for (const a of advisors) {
    let raw = '';
    try {
      raw = await deps.ask(buildAdvisorSystemPrompt(a), buildAdvisorUserPrompt(decision));
    } catch (err) {
      raw = '';
      console.error(`[advisors] ${a.id} failed:`, (err as Error)?.message ?? err);
    }
    verdicts.push(parseVerdict(raw, a.id));
  }
  const c = consensus(verdicts);
  const signal = learningSignal(c, decision.outcome);
  await deps.record({ decision, verdicts, consensus: c, signal });
  if (deps.log) await deps.log(formatReviewSummary(decision, c, signal));
  return { verdicts, consensus: c, signal };
}
