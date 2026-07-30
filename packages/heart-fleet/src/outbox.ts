/**
 * sendOnce - the one call a channel adapter makes to deliver an outbound side
 * effect exactly once (design doc 2145). Ties the DurableEffectLedger to a
 * live fence: claim -> verify-fence -> dispatch -> send -> commit-evidence.
 *
 * Ordering guarantee (crash-safe):
 *   1. claim (atomic PK insert) - a duplicate here dedupes, effect never fires.
 *   2. verifyFence - a stale worker that lost the lease ABORTS before sending.
 *   3. markDispatched - takes ownership of the send.
 *   4. send() - the ONE external call.
 *   5. markCommitted(externalRef) - evidence in the same statement as commit.
 * A crash between 4 and 5 leaves a `dispatched` row the reconciler resolves; a
 * retry re-hits step 1 and dedupes. No path double-fires; no path loses evidence.
 */
import type { HeartFleet } from './lease';
import type { FencingToken } from './types';
import type { DurableEffectLedger, EffectChannel } from './durable-effect-ledger';
import { canonicalize, sha256Hex } from './canonical';

export interface SendOnceInput<T> {
  fence: FencingToken;
  channel: EffectChannel;
  /** Deterministic business identity - the SAME value on every retry. */
  effectKey: string;
  /** The payload, hashed for the intent's payload_digest (audit/repro). */
  payload: unknown;
  /** The single external call. Returns the evidence (message_id / hash / tx). */
  send: () => Promise<T>;
  /** Map the send() result to the external_ref stored as commit evidence. */
  toExternalRef: (result: T) => Record<string, unknown>;
}

export type SendOnceOutcome<T> =
  | { sent: true; result: T }
  | { sent: false; reason: 'deduped' | 'fence-rejected' | 'lost-dispatch-race' };

export async function sendOnce<T>(
  heart: HeartFleet,
  ledger: DurableEffectLedger,
  input: SendOnceInput<T>,
): Promise<SendOnceOutcome<T>> {
  const payloadDigest = `sha256:dreamnet-sorted-json:v0:${sha256Hex(canonicalize(input.payload))}`;

  // 1. Atomic claim. A duplicate effect_key on this run dedupes here.
  const claimed = await ledger.claimIntent({
    runId: input.fence.runId,
    effectKey: input.effectKey,
    channel: input.channel,
    payloadDigest,
  });
  if (!claimed) return { sent: false, reason: 'deduped' };

  // 2. Fence check RIGHT before the irreversible send.
  const fenceOk = await heart.verifyFence(input.fence);
  if (!fenceOk) return { sent: false, reason: 'fence-rejected' };

  // 3. Take ownership of the dispatch.
  const dispatched = await ledger.markDispatched({
    runId: input.fence.runId,
    effectKey: input.effectKey,
    fenceOwner: input.fence.owner,
    fenceExpiresAt: input.fence.leaseExpiresAt,
  });
  if (!dispatched) return { sent: false, reason: 'lost-dispatch-race' };

  // 4. The one external call.
  const result = await input.send();

  // 5. Commit the evidence.
  await ledger.markCommitted({
    runId: input.fence.runId,
    effectKey: input.effectKey,
    externalRef: input.toExternalRef(result),
  });

  return { sent: true, result };
}

/**
 * Build a deterministic effect_key: channel + sha256(canonical(identity)).
 * NEVER pass a timestamp/uuid as identity - a retry MUST reproduce the key.
 *   telegram: effectKey('telegram', { chatId, text })
 *   farcaster: effectKey('farcaster:cast', { text, embeds, channel })
 *   onchain: effectKey('onchain', { chainId, contract, method, args })
 */
export function effectKey(prefix: string, identity: unknown): string {
  return `${prefix}:${sha256Hex(canonicalize(identity))}`;
}
