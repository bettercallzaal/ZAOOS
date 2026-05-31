/**
 * approvals.ts — ZOE's pending-approval state machine (doc 759 keystone).
 *
 * ZOE is otherwise stateless turn-to-turn. Several flows need a
 * propose -> Zaal says "y" -> execute pattern with no place to live:
 *   - decompose plan -> dispatch workers (Gap 2)
 *   - a subtask flagged approval_gate_before_next pauses mid-plan (Gap 2)
 *   - reflexion patches -> write memory (Gap 4)
 *   - learn.ts improvement proposals -> apply (Gap 5)
 *
 * This module is the single store for "what is ZOE waiting on Zaal to
 * approve in this chat". One pending item per chat scope. Persisted to
 * ~/.zao/zoe/pending-approvals.json so a systemd restart mid-approval
 * doesn't strand the plan. Items older than TTL_MS auto-expire so a
 * forgotten approval never silently swallows a later unrelated message.
 *
 * All parsing logic is pure (parseApprovalReply / isPendingExpired) so the
 * resolver is unit-testable without IO.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';
import type { DecompositionPlan } from './decompose';
import type { ProposedPatch, ReflectionAnswers } from './reflexion';
import type { LearnProposal } from './learn';

export type PendingKind =
  | 'plan'
  | 'plan-gate'
  | 'reflexion'
  | 'await-reflection'
  | 'learn';

interface PendingBase {
  kind: PendingKind;
  chatScope: string;
  /** ISO 8601 timestamp the approval was raised. Drives TTL expiry. */
  createdAt: string;
  /** Optional per-item TTL override (ms). Defaults to PENDING_TTL_MS. */
  ttlMs?: number;
}

/** A freshly-decomposed plan awaiting the initial y/n before any dispatch. */
export interface PendingPlan extends PendingBase {
  kind: 'plan';
  goal: string;
  plan: DecompositionPlan;
}

/** A plan paused mid-flight at an approval_gate_before_next boundary. */
export interface PendingPlanGate extends PendingBase {
  kind: 'plan-gate';
  goal: string;
  plan: DecompositionPlan;
  /** Subtask ids already completed before the gate. */
  completed: string[];
  /** The subtask id whose gate paused us (the NEXT one needs the go-ahead). */
  gateAfterId: string;
}

/** Reflexion memory patches awaiting per-id approval (Gap 4). */
export interface PendingReflexion extends PendingBase {
  kind: 'reflexion';
  /** High-confidence patches offered for y/n. */
  patches: ProposedPatch[];
  /** The reflection answers that produced these patches (for voice-note re-run). */
  answers: ReflectionAnswers;
  /** True if there were low-confidence patches needing a voice-note clarification. */
  hasVoiceNoteRequests: boolean;
}

/**
 * Waiting for Zaal's free-form reply to the evening reflection. The NEXT DM
 * (any text, not a y/n) is captured as the reflection answer and fed to the
 * reflexion layer. Longer TTL since answers can land hours later.
 */
export interface PendingAwaitReflection extends PendingBase {
  kind: 'await-reflection';
}

/** learn.ts self-improvement proposals awaiting approval (Gap 5). */
export interface PendingLearn extends PendingBase {
  kind: 'learn';
  proposals: LearnProposal[];
}

export type PendingApproval =
  | PendingPlan
  | PendingPlanGate
  | PendingReflexion
  | PendingAwaitReflection
  | PendingLearn;

export interface ApprovalReply {
  /**
   * - approve-all: "y", "yes", "y all", "approve", "ship it"
   * - approve-ids: "y st-1 st-2" / "y patch-1" — approve a specific subset
   * - reject: "n", "no", "cancel", "stop"
   * - edit: "edit ...", "revise ...", "actually ..." — Zaal wants changes;
   *   editText carries the rest for a re-decompose / redraft
   * - not-an-approval: the message isn't a y/n at all; caller treats it as a
   *   normal turn and leaves the pending item in place (until TTL).
   */
  decision: 'approve-all' | 'approve-ids' | 'reject' | 'edit' | 'not-an-approval';
  /** Parsed ids for approve-ids (e.g. ['st-1','patch-2']). */
  ids: string[];
  /** For edit: the instruction text after the edit keyword. */
  editText?: string;
}

/** Pending items older than this auto-expire. 30 min. */
export const PENDING_TTL_MS = 30 * 60 * 1000;

/**
 * Kinds that carry an outstanding y/n Zaal must answer. A new pending may not
 * silently clobber one of these (doc 770 H2). `await-reflection` is omitted on
 * purpose: it's a passive "capture the next DM" slot, so an explicit command
 * (which H1 already says is not a reflection answer) is allowed to supersede it.
 */
const APPROVAL_BEARING_KINDS: ReadonlySet<PendingKind> = new Set<PendingKind>([
  'plan',
  'plan-gate',
  'reflexion',
  'learn',
]);

/** Human-readable label for a pending kind, for refuse-when-busy messages. */
export function pendingKindLabel(kind: PendingKind): string {
  switch (kind) {
    case 'plan':
      return 'plan approval';
    case 'plan-gate':
      return 'paused plan (at its approval gate)';
    case 'reflexion':
      return 'memory-update approval';
    case 'await-reflection':
      return 'evening reflection';
    case 'learn':
      return 'learning-proposal approval';
  }
}

/**
 * Pure decision (doc 770 H2): would arming `newKind` clobber a live
 * approval-bearing pending of a different kind? Re-arming the SAME kind
 * (e.g. plan -> plan after a re-decompose) is always allowed.
 */
export function wouldClobber(
  existing: PendingApproval | undefined,
  newKind: PendingKind,
): boolean {
  return (
    !!existing && existing.kind !== newKind && APPROVAL_BEARING_KINDS.has(existing.kind)
  );
}

/** Outcome of an attempt to arm a pending item. */
export interface SetPendingResult {
  armed: boolean;
  /** When armed=false, the live pending that blocked the arm. */
  blockedBy?: PendingApproval;
}

const PENDING_FILE = join(ZOE_PATHS.home, 'pending-approvals.json');

// In-memory store, one pending item per chat scope. Mirror of disk.
const pendingByScope = new Map<string, PendingApproval>();

const REJECT_RE = /^\s*(n|no|nope|cancel|stop|abort|skip|nah|nvm|never\s*mind)\b/i;
const APPROVE_RE = /^\s*(y|yes|yep|yeah|yup|approve|approved|go|go ahead|ship it|ship|send it|do it|lgtm|sounds good)\b/i;
const EDIT_RE = /^\s*(edit|revise|change|tweak|adjust|instead|actually|no but|wait)\b[:,]?\s*(.*)/i;
// An explicit approval verb appearing ANYWHERE (not just at the start). Used to
// override a leading edit/reject prefix (doc 770 MED): "actually yes do it" and
// "no but go ahead" are approvals, not edits/rejects. Conservative — omits the
// bare "y"/"go"/"ship" forms that would false-positive mid-sentence.
const APPROVE_ANYWHERE_RE = /\b(yes|yep|yeah|yup|approved?|go ahead|ship it|send it|do it|lgtm|sounds good)\b/i;
// Subtask / patch / proposal ids: st-1, patch-2, lp-3, etc.
const ID_RE = /\b((?:st|patch|lp|sq|task)-[a-z0-9]+)\b/gi;

/**
 * Parse a Telegram reply against a pending approval. Pure — no IO, no state.
 *
 * Precedence (doc 770 MED — fixes EDIT_RE/REJECT_RE swallowing approvals):
 *   1. reject — unless an explicit approval verb is also present ("no but go ahead")
 *   2. edit — only when there's real instruction content AND no approval present
 *      ("actually research X" → edit; "actually yes do it" → approve below)
 *   3. approve — leading approve verb OR an approval verb anywhere
 *   4. otherwise not-an-approval (a bare "wait" with no content lands here, so
 *      the pending is left in place rather than re-decomposed with empty text)
 */
export function parseApprovalReply(text: string): ApprovalReply {
  const trimmed = text.trim();
  if (!trimmed) return { decision: 'not-an-approval', ids: [] };

  const containsApprove = APPROVE_ANYWHERE_RE.test(trimmed);

  if (REJECT_RE.test(trimmed) && !containsApprove) {
    return { decision: 'reject', ids: [] };
  }

  const editMatch = trimmed.match(EDIT_RE);
  const editText = editMatch?.[2]?.trim();
  if (editMatch && editText && !containsApprove) {
    return { decision: 'edit', ids: [], editText };
  }

  if (APPROVE_RE.test(trimmed) || containsApprove) {
    const ids = extractIds(trimmed);
    // "y all" or a bare "y/yes/approve" with no specific ids = approve all.
    if (/\ball\b/i.test(trimmed) || ids.length === 0) {
      return { decision: 'approve-all', ids: [] };
    }
    return { decision: 'approve-ids', ids };
  }

  return { decision: 'not-an-approval', ids: [] };
}

function extractIds(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(ID_RE)) {
    out.push(m[1].toLowerCase());
  }
  // de-dupe, preserve order
  return [...new Set(out)];
}

/** Pure TTL check so tests can pass an explicit `now`. */
export function isPendingExpired(p: PendingApproval, now: number = Date.now()): boolean {
  const created = Date.parse(p.createdAt);
  if (Number.isNaN(created)) return true; // corrupt timestamp = treat as stale
  return now - created > (p.ttlMs ?? PENDING_TTL_MS);
}

/** Load persisted pending items on boot. Best-effort; never throws. */
export async function loadPending(): Promise<void> {
  try {
    const raw = await fs.readFile(PENDING_FILE, 'utf8');
    const arr = JSON.parse(raw) as PendingApproval[];
    pendingByScope.clear();
    const now = Date.now();
    for (const p of arr) {
      if (p && typeof p.chatScope === 'string' && !isPendingExpired(p, now)) {
        pendingByScope.set(p.chatScope, p);
      }
    }
  } catch {
    // No file yet, or corrupt — start empty.
  }
}

/** Get the live pending item for a scope, or undefined if none / expired. */
export function getPending(scope: string): PendingApproval | undefined {
  const p = pendingByScope.get(scope);
  if (!p) return undefined;
  if (isPendingExpired(p)) {
    pendingByScope.delete(scope);
    void persist();
    return undefined;
  }
  return p;
}

/**
 * Arm the pending item for a scope and persist. Refuses (doc 770 H2) if a
 * different live approval-bearing pending already occupies the scope, so
 * concurrent flows can't silently clobber each other. Returns whether it armed.
 */
export async function setPending(p: PendingApproval): Promise<SetPendingResult> {
  const existing = getPending(p.chatScope);
  if (wouldClobber(existing, p.kind)) {
    return { armed: false, blockedBy: existing };
  }
  pendingByScope.set(p.chatScope, p);
  await persist();
  return { armed: true };
}

/** Clear the pending item for a scope and persist. */
export async function clearPending(scope: string): Promise<void> {
  if (pendingByScope.delete(scope)) {
    await persist();
  }
}

// Serialize disk writes behind a single promise chain (doc 770 MED — persist
// race). getPending's fire-and-forget `void persist()` after a TTL delete could
// otherwise interleave with setPending's awaited write and lay down stale data.
// Each queued write snapshots the map at its own turn, so the last write always
// reflects the final in-memory state regardless of call ordering.
let persistChain: Promise<void> = Promise.resolve();

function persist(): Promise<void> {
  persistChain = persistChain.then(async () => {
    try {
      await fs.mkdir(ZOE_PATHS.home, { recursive: true });
      const arr = [...pendingByScope.values()];
      await fs.writeFile(PENDING_FILE, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      console.error('[zoe/approvals] persist failed:', (err as Error).message);
    }
  });
  return persistChain;
}
