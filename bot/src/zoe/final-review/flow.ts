/**
 * Orchestration for the ZOE final reviewer: review -> one card -> owner tap ->
 * re-read -> pinned merge line. Dependencies are injected; this file sends
 * nothing and merges nothing. Design note sections 2 and 3, decision 184 A.
 *
 * Fail closed: every dependency failing yields no card (review) or no line
 * (tap), with a plain reason. The only text that carries a merge line is the
 * tap reply when head, verdict and CI at the CARD's sha still pass.
 */

import { OWNER_ONLY_LINE } from '../owner-only';
import { evaluateGates, type GateResult } from './gates';
import { gradeOutcome, renderFinalReviewComment, type GradeFn, type GradeResult } from './grade';
import { cardCallback, parseCardCallback, type Card, type CardStore } from './card';
import { buildMergeLine } from './merge-line';
import type { PrSnapshot } from './snapshot';

export interface FlowDeps {
  store: CardStore;
  read: (repo: string, number: number) => Promise<PrSnapshot | null>;
  grade: GradeFn;
  allowedLogins: readonly string[];
  now: () => number;
  ttlMs: number;
}

export interface CardView {
  card: Card;
  text: string;
  buttons: Array<Array<{ text: string; data: string }>>;
}

export type ReviewOutcome =
  | { kind: 'card'; view: CardView; comment: string; superseded: Card[] }
  | { kind: 'no-card'; reason: string; comment?: string; stage: NoCardStage };

/**
 * Where a review stopped. 'read' and 'gates' cost no model call and may pass on
 * a later read; 'carded' and 'graded' mean this head is settled (auto-offer.ts
 * uses this to grade each head at most once).
 */
export type NoCardStage = 'read' | 'gates' | 'carded' | 'graded';

export function renderCardText(card: Card, snap: PrSnapshot, gates: GateResult, grade: GradeResult): string {
  const lines = [
    `ZOE final review: ${card.repo} #${card.number}`,
    `Head ${card.sha.slice(0, 12)}`,
    `Seat verdict ${gates.verdict?.state ?? 'none'} at this head, CI green on ${snap.checks.length} checks.`,
    `ZOE grade ${grade.score}/100 (${grade.reviewerFamily}-family reviewer).`,
  ];
  if (grade.summary) lines.push(grade.summary);
  if (card.reserved.length > 0) lines.push(`Reserved: ${card.reserved.join(', ')}. That merge is yours on github.com.`);
  lines.push(`Expires ${new Date(card.expiresAt).toISOString()}. Tap re-checks the head and CI, then shows the merge line. ZOE does not merge.`);
  return lines.join('\n');
}

export async function reviewPr(repo: string, number: number, deps: FlowDeps): Promise<ReviewOutcome> {
  let snap: PrSnapshot | null;
  try {
    snap = await deps.read(repo, number);
  } catch {
    snap = null;
  }
  if (!snap) return { kind: 'no-card', reason: 'could not read the PR or its CI; nothing raised', stage: 'read' };

  const gates = evaluateGates(snap, deps.allowedLogins);
  if (!gates.ready) {
    return { kind: 'no-card', reason: gates.blocks.join('; '), comment: renderFinalReviewComment(snap, gates, null), stage: 'gates' };
  }

  const now = deps.now();
  const live = deps.store.findLive(`${repo}#${number}@${snap.headSha}`, now);
  if (live) return { kind: 'no-card', reason: `already carded at this head (${live.state})`, stage: 'carded' };

  let grade: GradeResult;
  try {
    grade = gradeOutcome(await deps.grade(snap));
  } catch {
    return { kind: 'no-card', reason: 'critic call failed; nothing raised', stage: 'graded' };
  }
  const comment = renderFinalReviewComment(snap, gates, grade);
  if (!grade.pass) return { kind: 'no-card', reason: `ZOE grade ${grade.score}/100 below the pass bar or has critical issues`, comment, stage: 'graded' };

  const issued = deps.store.issue(repo, number, snap.headSha, gates.reserved, now, deps.ttlMs);
  if (issued.kind === 'duplicate') return { kind: 'no-card', reason: 'already carded at this head', stage: 'carded' };
  return {
    kind: 'card',
    comment,
    superseded: issued.superseded,
    view: {
      card: issued.card,
      text: renderCardText(issued.card, snap, gates, grade),
      buttons: [[{ text: 'Re-check and show merge line', data: cardCallback(issued.card.id) }]],
    },
  };
}

export interface TapInput {
  data: string;
  fromZaal: boolean;
  /** 'private' only; any group or other scope is refused. */
  scope: string;
}

export interface TapOutcome {
  /** Plain text for the reply. */
  text: string;
  /** Present only when the reply carries a pinned merge line. */
  mergeLine?: string;
}

export async function handleTap(input: TapInput, deps: FlowDeps): Promise<TapOutcome> {
  if (!input.fromZaal) return { text: OWNER_ONLY_LINE };
  if (input.scope !== 'private') return { text: 'That card only works in your private chat.' };
  const id = parseCardCallback(input.data);
  if (!id) return { text: 'That button is not a final-review card.' };

  const now = deps.now();
  const found = deps.store.lookup(id, now);
  if (found.kind === 'unknown') return { text: 'That card is not known. Run a new review.' };
  if (found.kind === 'expired') return { text: 'That card expired. Run a new review.' };
  if (found.kind === 'handled') return { text: 'That card was already handled.' };
  const card = found.card;

  let snap: PrSnapshot | null;
  try {
    snap = await deps.read(card.repo, card.number);
  } catch {
    snap = null;
  }
  if (!snap) return { text: 'Could not re-read the PR just now. Nothing changed; tap again in a minute.' };

  if (snap.headSha !== card.sha) {
    deps.store.supersede(card.id);
    return { text: `The head moved to ${snap.headSha.slice(0, 12)}. This card is superseded; run a new review.` };
  }
  const gates = evaluateGates(snap, deps.allowedLogins);
  if (!gates.ready) return { text: `Not ready at ${card.sha.slice(0, 12)}: ${gates.blocks.join('; ')}.` };

  if (gates.reserved.length > 0) {
    deps.store.resolve(card.id);
    return { text: `${card.repo} #${card.number} is reserved (${gates.reserved.join(', ')}). That merge is yours on github.com. No agent line.` };
  }
  const line = buildMergeLine(card.repo, card.number, card.sha);
  if (!line) return { text: 'Could not build a safe merge line. Nothing changed.' };
  deps.store.resolve(card.id);
  return { text: `${card.repo} #${card.number} at ${card.sha.slice(0, 12)}, your call, run it yourself:\n${line}`, mergeLine: line };
}
