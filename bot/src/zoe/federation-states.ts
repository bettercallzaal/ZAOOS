/**
 * federation-states.ts - the vocabulary the canary is allowed to conclude in.
 *
 * Brandon's spec, verbatim on the point that matters:
 *
 *   ONE ZOE JOB MUST NOT BE ABLE TO REPORT SUCCESS UNLESS BOTH SIDES CAN PROVE
 *   THE INTENDED THING ACTUALLY HAPPENED.
 *
 * WHY A TYPE AND NOT A BOOLEAN. A boolean has two values, and this domain has
 * six. Collapsing them forces every "I could not tell" into either true or
 * false, and whichever way you collapse it you have invented a fact. The whole
 * class of bug this repo spent a week finding - ZOE up while 401ing, a logger
 * recording 158 merged PRs as zero, a verifier that would have passed an empty
 * hash - is a two-valued answer to a three-valued question.
 *
 * So UNVERIFIABLE is a first-class outcome here, not an error path.
 *
 * THE THREE LAYERS THAT MUST NEVER COLLAPSE (also Brandon's, also verbatim in
 * intent):
 *
 *   TRANSPORT_ACK    Jim's bus accepted or delivered bytes. Transport only.
 *   APPLICATION_ACK  the receiver accepted the envelope after auth, schema,
 *                    replay and hash checks.
 *   PROOF_OF_EFFECT  the intended result was independently observed.
 *
 * A 200 is not proof. A handler returning true is not proof. A log line is not
 * proof. Exit 0 is not proof.
 */

/** Terminal states. Never a bare boolean, and never inferred from silence. */
export type TerminalState =
  | 'VERIFIED_PASS'
  | 'VERIFIED_FAIL'
  | 'UNVERIFIABLE'
  | 'BLOCKED'
  | 'TIMEOUT'
  | 'CANCELLED';

/**
 * Why a run ended where it did. Every terminal state that is not
 * VERIFIED_PASS carries one of these - "it failed" with no reason is the
 * message that cost three days on the cheap-loop fleet.
 */
export type ReasonCode =
  // hash + content
  | 'HASH_MISMATCH'
  | 'MISSING_HASH'
  | 'EMPTY_HASH'
  | 'PAYLOAD_HASH_INVALID'
  // identity + replay
  | 'DUPLICATE_MESSAGE'
  | 'REPLAYED_NONCE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'EXPIRED_MESSAGE'
  // negotiation
  | 'UNSUPPORTED_VERSION'
  | 'UNSUPPORTED_CAPABILITY'
  | 'CAPABILITY_DENIED'
  // the three ack layers, kept distinct on purpose
  | 'TRANSPORT_FAILED'
  | 'TRANSPORT_ACK_MISSING'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_ACK_MISSING'
  | 'EFFECT_NOT_OBSERVED'
  // receipts + durability
  | 'MISSING_RECEIPT'
  | 'RECEIPT_INVALID'
  | 'RECEIPT_WRITE_FAILED'
  | 'CHECKPOINT_WRITE_FAILED'
  | 'CHECKPOINT_RECOVERY_FAILED'
  // auth + signature
  | 'AUTH_FAILED'
  | 'SIGNATURE_INVALID'
  // waiting
  | 'TIMEOUT_WAITING_FOR_ACK'
  | 'TIMEOUT_WAITING_FOR_EFFECT';

/** The canonical step order. A run advances through these and no others. */
export const STEPS = [
  'RECEIVE',
  'VALIDATE',
  'HASH',
  'SEND',
  'TRANSPORT_ACK',
  'APPLICATION_ACK',
  'VERIFY_EFFECT',
  'RECORD',
  'CHECKPOINT',
  'COMPLETE',
] as const;

export type Step = (typeof STEPS)[number];

export interface Outcome {
  state: TerminalState;
  reason?: ReasonCode;
  /** Human-readable detail. Never the only record - `reason` is machine-read. */
  detail?: string;
}

export function pass(detail?: string): Outcome {
  return { state: 'VERIFIED_PASS', detail };
}

export function fail(reason: ReasonCode, detail?: string): Outcome {
  return { state: 'VERIFIED_FAIL', reason, detail };
}

/**
 * "I could not tell." The most important constructor in this file.
 *
 * Missing evidence produces UNVERIFIABLE, never PASS. If a run reaches the end
 * without the evidence it needed, that is not success with a caveat - it is a
 * different answer.
 */
export function unverifiable(reason: ReasonCode, detail?: string): Outcome {
  return { state: 'UNVERIFIABLE', reason, detail };
}

export function blocked(reason: ReasonCode, detail?: string): Outcome {
  return { state: 'BLOCKED', reason, detail };
}

export function timedOut(reason: ReasonCode, detail?: string): Outcome {
  return { state: 'TIMEOUT', reason, detail };
}

/** Did this run actually prove the thing happened? Only one state qualifies. */
export function isProven(o: Outcome): boolean {
  return o.state === 'VERIFIED_PASS';
}

/**
 * Deliberately NOT provided: an `isOk()` that treats UNVERIFIABLE as fine, or a
 * `toBoolean()`. Both would re-introduce the two-valued answer this file exists
 * to prevent, and a caller reaching for one is a caller about to make the
 * mistake.
 */
