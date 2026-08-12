/**
 * bus-receipt.ts - ACK a DreamNet federation receipt and verify its hashes.
 *
 * Tenant-side receipt handling for the DreamNet federation canary. Given a
 * receipt received from DreamNet (via the bus), this module:
 *   1. Verifies the content hash matches what we computed locally
 *   2. Verifies the message ID matches what we sent
 *   3. ACKs the receipt back to the bus so DreamNet knows we got it
 *
 * All verification is PURE (no I/O). The result is a clear enum-like return
 * value that distinguishes MATCH (everything verified), MISMATCH (a field has
 * the wrong value), and CANNOT_VERIFY (a field is missing). Never reads a
 * missing field as a match - that is the silent-failure-guard rule: a missing
 * field must be CANNOT_VERIFY, never success.
 */

import type { BusConfig } from './bus-send';
import { busConfig, busConfigured, sendBusReply } from './bus-send';

/**
 * Result of verifying a receipt against what we sent. Three distinct outcomes
 * that never conflate.
 */
export type ReceiptVerificationResult = 'MATCH' | 'MISMATCH' | 'CANNOT_VERIFY';

/**
 * The shape of a DreamNet receipt as received over the bus. Only fields we
 * care about for verification are required; others can be present but are not
 * used here.
 */
export interface DreamNetReceipt {
  messageId?: unknown;
  contentHash?: unknown;
  [key: string]: unknown;
}

/**
 * Verify a receipt's content hash and message ID against what we sent.
 *
 * `sentMessageId` is the ID of the message we sent (the one that prompted
 * DreamNet to send us this receipt). `sentContentHash` is the sha256 we
 * computed locally over the exact bytes we uploaded. The receipt's fields
 * must match both exactly.
 *
 * CRITICAL: a missing field is CANNOT_VERIFY, not a match. If the receipt has
 * no contentHash, or if contentHash is null/undefined, returns CANNOT_VERIFY
 * rather than treating it as success. This is anti-fabrication.md rule 2:
 * never let a missing field read as a match.
 *
 * Returns:
 *   - MATCH: receipt.messageId === sentMessageId AND receipt.contentHash === sentContentHash
 *   - MISMATCH: both fields are present but at least one differs
 *   - CANNOT_VERIFY: one or both fields are missing/undefined/null
 */
export function verifyReceipt(
  receipt: DreamNetReceipt,
  sentMessageId: string,
  sentContentHash: string,
): ReceiptVerificationResult {
  // Both fields must be present and non-null to proceed.
  const hasMessageId = receipt.messageId !== null && receipt.messageId !== undefined;
  const hasContentHash = receipt.contentHash !== null && receipt.contentHash !== undefined;

  if (!hasMessageId || !hasContentHash) {
    return 'CANNOT_VERIFY';
  }

  // OUR OWN side must be present too. Comparing '' to '' is true, so an empty
  // local hash would sail through as a MATCH while proving nothing whatsoever -
  // the vacuous verify of agent-loops.md rule 30, where the check passes because
  // it never actually ran. sha256 cannot return an empty string, so reaching
  // here means a caller passed one, and that is a bug we must not launder into
  // a green result.
  if (!sentMessageId || !sentContentHash) {
    return 'CANNOT_VERIFY';
  }

  // Both fields are present. Check if they match what we sent (comparing as strings).
  const messageIdMatch = String(receipt.messageId) === sentMessageId;
  const contentHashMatch = String(receipt.contentHash) === sentContentHash;

  if (messageIdMatch && contentHashMatch) {
    return 'MATCH';
  }

  return 'MISMATCH';
}

export interface AckReceiptResult {
  ok: boolean;
  /** Message to show Zaal or a handler. Always present. */
  reply: string;
  verification?: ReceiptVerificationResult;
  reason?: string;
}

/**
 * ACK a receipt back to the bus after verifying it. Sends a reply to the
 * partner containing the verification result.
 *
 * `receiptMessageId` is the ID of the receipt message itself (what we are
 * ACKing), not the ID of the message that prompted the receipt.
 *
 * Flow:
 *   1. Verify the receipt's content hash and message ID match what we sent
 *   2. Send an ACK back to the bus with the verification result
 *   3. Return both the verification outcome and the send result
 *
 * If verification fails (MISMATCH or CANNOT_VERIFY), the ACK still sends
 * (so DreamNet knows we received it), but the reply clearly states the problem.
 */
export async function ackReceipt(
  receipt: DreamNetReceipt,
  receiptMessageId: string,
  sentMessageId: string,
  sentContentHash: string,
  cfg: BusConfig = busConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<AckReceiptResult> {
  if (!busConfigured(cfg)) {
    return {
      ok: false,
      reason: 'unconfigured',
      reply: 'Bus not connected - BUS_URL and BUS_TOKEN are not set, so this did not ACK.',
    };
  }

  const verification = verifyReceipt(receipt, sentMessageId, sentContentHash);

  let ackBody: string;
  switch (verification) {
    case 'MATCH':
      ackBody = `Receipt verified. Content hash and message ID both match.`;
      break;
    case 'MISMATCH':
      ackBody =
        `Receipt verification FAILED - MISMATCH.\n` +
        `Received contentHash: ${String(receipt.contentHash)}\n` +
        `Sent contentHash: ${sentContentHash}\n` +
        `Received messageId: ${String(receipt.messageId)}\n` +
        `Sent messageId: ${sentMessageId}`;
      break;
    case 'CANNOT_VERIFY':
      ackBody =
        `Receipt verification FAILED - CANNOT_VERIFY.\n` +
        `Missing or null fields in receipt.` +
        (receipt.contentHash === undefined
          ? ` contentHash is missing.`
          : receipt.contentHash === null
            ? ` contentHash is null.`
            : '') +
        (receipt.messageId === undefined
          ? ` messageId is missing.`
          : receipt.messageId === null
            ? ` messageId is null.`
            : '');
      break;
  }

  try {
    const sendResult = await sendBusReply(
      {
        to: 'coordinator',
        subject: `ACK receipt ${String(receiptMessageId).slice(0, 8)}`,
        body: ackBody,
      },
      cfg,
      fetchImpl,
    );

    return {
      ok: sendResult.ok,
      reply: sendResult.reply,
      verification,
      reason: sendResult.reason,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'request failed';
    return {
      ok: false,
      reply: `Could not send ACK: ${msg.slice(0, 120)}`,
      verification,
      reason: msg,
    };
  }
}
