/**
 * Repo Improver Scout: cheap-AI audit loop that ZOE self-gates and learns from.
 *
 * A scout rotates through the ZAO repos, one per cycle. It audits that repo with
 * a CHEAP OpenRouter model (via callCapFallback - OpenRouter/grok/gpt, never the
 * Claude cap) and proposes ONE high-value, safe improvement, saved to
 * repo_improvements as 'proposed'.
 *
 * Then ZOE reviews the finding with its OWN judgment (its own yes/no - not
 * Zaal's) and LOGS the decision + reasoning + outcome, so it accumulates a
 * corpus it can learn from. On a ZOE-yes it routes the fix through the Hermes
 * coder pipeline (the same dispatchHermesRun the error-remediation rail uses).
 * The human gate stays ONLY at PR merge (agent-loops rule 8) - ZOE opens the PR,
 * Zaal merges. ZOE reports its decisions to the group as status, not questions.
 *
 * Cost ladder (claude-usage.md): scouting is cheap; the grounded fix spends the
 * Claude cap only after ZOE's own confirm. Twin of the error-remediation rail:
 * trigger is a cheap-scout finding, gate is ZOE's judgment.
 *
 * Pure helpers (nextRepoIndex/repoToHermesTarget/parseFinding/parseVerdict/
 * findingToLog) are unit-tested; the orchestration takes injected deps.
 */

import { z } from 'zod';
import type { HermesRepoTarget } from '../hermes/types';

/** The repos the scout rotates through. hermesTarget=null => surface-only (no auto-fix target yet). */
export interface ScoutRepo {
  repo: string; // owner/name
  hermesTarget: HermesRepoTarget | null;
}

export const SCOUT_REPOS: ScoutRepo[] = [
  { repo: 'bettercallzaal/ZAOOS', hermesTarget: 'zaoos' },
  { repo: 'bettercallzaal/zaostock', hermesTarget: 'zaostock' },
  { repo: 'ZAODEVZ/ZAOcowork', hermesTarget: 'zaocowork' },
  { repo: 'bettercallzaal/zao-website', hermesTarget: null },
  { repo: 'ZAODEVZ/zabalgames', hermesTarget: null },
  { repo: 'bettercallzaal/wwtracker', hermesTarget: null },
];

export type ImprovementStatus =
  | 'proposed' // scout wrote it, awaiting ZOE's review
  | 'rejected' // ZOE reviewed and declined (logged, learned)
  | 'fixing' // ZOE approved, fix pipeline running
  | 'fixed' // PR open
  | 'escalated'; // approved but no target / pipeline could not fix

/** A single audit finding, validated from the scout model's JSON output. */
export const FindingSchema = z.object({
  area: z.string().min(1).max(120),
  problem: z.string().min(1).max(800),
  proposed_fix: z.string().min(1).max(800),
  files: z.array(z.string()).max(20).default([]),
  risk: z.enum(['low', 'medium', 'high']),
  confidence: z.enum(['low', 'medium', 'high']),
});
export type Finding = z.infer<typeof FindingSchema>;

/** ZOE's own verdict on a proposed finding (its yes/no + why - logged to learn). */
export const VerdictSchema = z.object({
  approve: z.boolean(),
  reasoning: z.string().min(1).max(800),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export interface ImprovementRow extends Finding {
  id: string;
  repo: string;
  hermes_target: string | null;
  status: ImprovementStatus;
  model: string | null;
  zoe_reasoning: string | null;
  pr_url: string | null;
  run_id: string | null;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Round-robin: next repo index after lastIndex (-1 => start at 0). */
export function nextRepoIndex(total: number, lastIndex: number): number {
  if (total <= 0) return 0;
  return ((lastIndex < 0 ? -1 : lastIndex) + 1) % total;
}

/** A repo's Hermes fix target, or null if not auto-fixable yet. */
export function repoToHermesTarget(repo: string): HermesRepoTarget | null {
  return SCOUT_REPOS.find((r) => r.repo === repo)?.hermesTarget ?? null;
}

function extractJson(rawText: string): unknown | null {
  if (!rawText) return null;
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : rawText;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Extract the finding JSON from a scout response. Returns null if absent or if
 * the model signalled {"none":true} - the scout then skips rather than invent.
 */
export function parseFinding(rawText: string): Finding | null {
  const obj = extractJson(rawText);
  if (!obj || typeof obj !== 'object') return null;
  if ((obj as Record<string, unknown>).none === true) return null;
  const parsed = FindingSchema.safeParse(obj);
  return parsed.success ? parsed.data : null;
}

/** Parse ZOE's verdict JSON. Defaults to a conservative reject on malformed output. */
export function parseVerdict(rawText: string): Verdict {
  const obj = extractJson(rawText);
  const parsed = VerdictSchema.safeParse(obj);
  if (parsed.success) return parsed.data;
  return { approve: false, reasoning: 'unparseable verdict - defaulting to reject (safe)' };
}

export function buildAuditSystemPrompt(): string {
  return [
    'You are a senior engineer auditing a repository for ONE high-value, LOW-RISK, concrete improvement.',
    'Prefer: a real correctness bug with a clear fix, a missing input guard/error handler, a missing test on important code, or a broken reference.',
    'Do NOT propose broad refactors, style-only changes, dependency bumps, or anything touching secrets, env, or database migrations.',
    'Respond with ONLY a JSON object, no prose, matching:',
    '{"area":"<short area>","problem":"<what is wrong>","proposed_fix":"<the smallest safe change>","files":["path"],"risk":"low|medium|high","confidence":"low|medium|high"}',
    'If there is NO genuinely valuable, safe improvement, respond exactly {"none":true}. Never invent one.',
  ].join('\n');
}

export function buildAuditUserPrompt(repo: string, context: string): string {
  return `Repository: ${repo}\n\nContext (README, structure, key files):\n${context.slice(0, 12000)}\n\nFind ONE improvement per the rules. JSON only.`;
}

/** ZOE's review prompt: judge whether to make the scout's proposed fix. */
export function buildReviewSystemPrompt(): string {
  return [
    'You are ZOE, deciding whether to act on an improvement a scout proposed for one of your repos.',
    'Approve ONLY if the fix is genuinely valuable, clearly safe, and concrete enough to implement without guessing.',
    'Reject vague, speculative, style-only, risky, or low-value proposals - a rejection is logged so you learn what is worth acting on.',
    'Respond with ONLY JSON: {"approve": true|false, "reasoning": "<one or two sentences>"}.',
  ].join('\n');
}

export function buildReviewUserPrompt(f: Finding, repo: string): string {
  return `Repo: ${repo}\nArea: ${f.area}\nProblem: ${f.problem}\nProposed fix: ${f.proposed_fix}\nFiles: ${f.files.join(', ') || '(none listed)'}\nRisk: ${f.risk} | Confidence: ${f.confidence}\n\nShould you make this fix? JSON only.`;
}

/** One-line log/status summary of a decision (for the group + the learning log). */
export function findingToLog(row: ImprovementRow, decision: 'approved' | 'rejected'): string {
  return `[repo-improver] ${row.repo} - ${row.area}: ${decision}${row.zoe_reasoning ? ` (${row.zoe_reasoning})` : ''}`;
}

// ---------------------------------------------------------------------------
// Orchestration (injected deps -> testable)
// ---------------------------------------------------------------------------

export interface ScoutDeps {
  pickNextRepo: () => Promise<ScoutRepo>;
  gatherContext: (repo: string) => Promise<string>;
  /** Cheap audit: raw model text + the model name used. */
  audit: (systemPrompt: string, userPrompt: string) => Promise<{ text: string; model: string }>;
  saveProposed: (row: Omit<ImprovementRow, 'id' | 'status' | 'zoe_reasoning'>) => Promise<void>;
}

/** One scout cycle: audit the next repo and save a proposed finding (or skip). */
export async function runRepoImproverScout(deps: ScoutDeps): Promise<string> {
  const target = await deps.pickNextRepo();
  let context: string;
  try {
    context = await deps.gatherContext(target.repo);
  } catch (err) {
    return `context failed for ${target.repo}: ${(err as Error)?.message ?? err}`;
  }
  const { text, model } = await deps.audit(
    buildAuditSystemPrompt(),
    buildAuditUserPrompt(target.repo, context),
  );
  const finding = parseFinding(text);
  if (!finding) return `no finding for ${target.repo}`;
  await deps.saveProposed({
    ...finding,
    repo: target.repo,
    hermes_target: target.hermesTarget,
    model,
    pr_url: null,
    run_id: null,
  });
  return `proposed: ${target.repo} - ${finding.area}`;
}

export interface ReviewDeps {
  fetchProposed: () => Promise<ImprovementRow[]>;
  /** ZOE's own judgment on a finding (its yes/no + reasoning). */
  judge: (systemPrompt: string, userPrompt: string) => Promise<string>;
  markStatus: (
    id: string,
    status: ImprovementStatus,
    extra?: { zoe_reasoning?: string; pr_url?: string | null; run_id?: string | null },
  ) => Promise<void>;
  dispatchFix: (input: {
    issueText: string;
    targetRepo: HermesRepoTarget;
  }) => Promise<{ kind: 'ready' | 'failed' | 'escalated'; prUrl: string | null; runId: string; reason?: string }>;
  /** Status log to the group (not a question) + the durable learning log. */
  log: (message: string) => Promise<void>;
}

/**
 * ZOE reviews every proposed finding with its own judgment, LOGS the decision,
 * and on approve routes the fix. This is the self-gate + learning loop.
 */
export async function reviewProposedImprovements(deps: ReviewDeps): Promise<string> {
  const rows = await deps.fetchProposed();
  if (rows.length === 0) return 'nothing to review';
  let approved = 0;
  let rejected = 0;

  for (const row of rows) {
    const verdict = parseVerdict(
      await deps.judge(buildReviewSystemPrompt(), buildReviewUserPrompt(row, row.repo)),
    );
    const withReason: ImprovementRow = { ...row, zoe_reasoning: verdict.reasoning };

    if (!verdict.approve) {
      await deps.markStatus(row.id, 'rejected', { zoe_reasoning: verdict.reasoning });
      await deps.log(findingToLog(withReason, 'rejected'));
      rejected++;
      continue;
    }

    const target = row.hermes_target as HermesRepoTarget | null;
    if (!target) {
      await deps.markStatus(row.id, 'escalated', { zoe_reasoning: verdict.reasoning });
      await deps.log(`[repo-improver] ${row.repo} - ${row.area}: approved but no fix target (manual). (${verdict.reasoning})`);
      continue;
    }

    await deps.markStatus(row.id, 'fixing', { zoe_reasoning: verdict.reasoning });
    approved++;
    const issueText = [
      `Repo improvement approved by ZOE (repo-improver scout).`,
      ``,
      `Area: ${row.area}`,
      `Problem: ${row.problem}`,
      `Proposed fix: ${row.proposed_fix}`,
      row.files.length ? `Suspect files: ${row.files.join(', ')}` : ``,
      ``,
      `Make the SMALLEST safe change to address this. Verify with typecheck/build before the PR. Do not touch secrets, env, or DB migrations.`,
    ]
      .filter((l) => l !== ``)
      .join('\n');

    let result: Awaited<ReturnType<ReviewDeps['dispatchFix']>>;
    try {
      result = await deps.dispatchFix({ issueText, targetRepo: target });
    } catch (err) {
      await deps.markStatus(row.id, 'escalated', { zoe_reasoning: verdict.reasoning });
      await deps.log(`[repo-improver] ${row.repo} - fix pipeline errored: ${(err as Error)?.message ?? err}`);
      continue;
    }

    if (result.kind === 'ready') {
      await deps.markStatus(row.id, 'fixed', {
        zoe_reasoning: verdict.reasoning,
        pr_url: result.prUrl,
        run_id: result.runId,
      });
      await deps.log(`[repo-improver] ${row.repo} - ${row.area}: fixed, PR ${result.prUrl ?? '(open)'} - ready for merge.`);
    } else {
      await deps.markStatus(row.id, 'escalated', { zoe_reasoning: verdict.reasoning, run_id: result.runId });
      await deps.log(`[repo-improver] ${row.repo} - could not auto-fix (${result.kind}): ${result.reason ?? ''}`);
    }
  }

  return `reviewed ${rows.length}: ${approved} approved, ${rejected} rejected`;
}
