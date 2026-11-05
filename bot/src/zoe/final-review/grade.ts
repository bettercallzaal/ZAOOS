/**
 * ZOE's last grade. Reuses the ZOE critic contract (CritiqueOutput, pass
 * threshold 70, reviewerFamily) from critics/types.ts. The model call is an
 * injected GradeFn; the live adapter over bot/src/hermes/critic.ts (which needs
 * a checkout of the head) is NOT built in this PR. See the PR body.
 *
 * Also renders the "ZOE final review" comment text. The text is never posted
 * by this code (outbound is Zaal's). Its first line is built so the seat
 * verdict parser cannot read it as a seat verdict.
 */

import { CRITIQUE_PASS_THRESHOLD, type CritiqueOutput } from '../critics/types';
import type { GateResult } from './gates';
import type { PrSnapshot } from './snapshot';

export type GradeFn = (snap: PrSnapshot) => Promise<CritiqueOutput>;

export interface GradeResult {
  pass: boolean;
  score: number;
  summary: string;
  reviewerFamily: 'cross' | 'same' | 'unknown';
  criticalIssues: number;
}

/** Pass needs score >= threshold, ships_as_is and zero critical issues. Garbage in is a fail. */
export function gradeOutcome(c: CritiqueOutput | null | undefined): GradeResult {
  if (!c || typeof c.score !== 'number' || !Number.isFinite(c.score)) {
    return { pass: false, score: 0, summary: 'critic output unusable', reviewerFamily: 'unknown', criticalIssues: 0 };
  }
  const issues = Array.isArray(c.issues) ? c.issues : [];
  const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
  return {
    pass: c.score >= CRITIQUE_PASS_THRESHOLD && c.ships_as_is === true && criticalIssues === 0,
    score: c.score,
    summary: String(c.summary ?? '').slice(0, 240),
    reviewerFamily: c.reviewerFamily ?? 'unknown',
    criticalIssues,
  };
}

export type FinalState = 'READY' | 'NEEDS_WORK' | 'BLOCKED';

/** Draft text only. Line 1 names the full head SHA, like the seat verdict, under a different heading. */
export function renderFinalReviewComment(snap: PrSnapshot, gates: GateResult, grade: GradeResult | null): string {
  const state: FinalState = !gates.ready ? 'BLOCKED' : grade?.pass ? 'READY' : 'NEEDS_WORK';
  const lines = [`ZOE final review, head ${snap.headSha}: **${state}**`];
  lines.push(`Seat verdict: ${gates.verdict ? `${gates.verdict.state} (comment ${gates.verdict.commentId})` : 'none for this head'}`);
  lines.push(`CI at this head: ${snap.checks.length} check runs, ${gates.blocks.some((b) => b.startsWith('CI')) ? 'not all green' : 'all green'}`);
  lines.push(gates.reserved.length > 0 ? `Reserved: ${gates.reserved.join(', ')} (Zaal's own merge)` : 'Reserved: none');
  if (grade) {
    lines.push(`ZOE grade: ${grade.score}/100, ${grade.reviewerFamily}-family reviewer, ${grade.criticalIssues} critical issues`);
    if (grade.summary) lines.push(grade.summary);
  }
  for (const b of gates.blocks) lines.push(`Blocked: ${b}`);
  lines.push('Draft only. ZOE never merges; the owner tap yields a pinned zao-merge line.');
  return lines.join('\n');
}
