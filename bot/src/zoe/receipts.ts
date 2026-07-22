/**
 * Receipt Emitter: Best-effort proof-of-action logging for ZOE tool calls.
 *
 * When ZOE (or any agent) takes a meaningful action (post, PR, API call),
 * emitReceipt() logs it to the receipts table for audit + replay. Built
 * for the Spine control plane (doc 1410).
 *
 * Design: fire-and-forget. Never throws into the caller. Logs + swallows
 * on failure (network error, missing table, etc). Pair with critical
 * approval gates upstream if a failure must block (not emitReceipt's job).
 *
 * No database calls from this file - all I/O is via db() imported caller-side.
 */

import { db } from '../supabase';

export interface ReceiptInput {
  /** FK to agent_runs.id. Optional in v1 for adhoc receipts; if null, create a lightweight run. */
  runId?: string | null;

  /** Identity of the agent (e.g. 'zoe', 'zol', 'zai', or a fid). */
  agentIdentity: string;

  /** High-level capability used (e.g. 'post_farcaster', 'post_github', 'read_onchain_state'). */
  capability: string;

  /** Specific tool invoked (e.g. 'github_cli', 'neynar_api', 'wagmi'). */
  tool: string;

  /** The action taken (e.g. 'create_pull_request', 'post_cast', 'get_token_holders'). */
  action: string;

  /** Optional: SHA256 hash of the request body (for deduplication + audit). */
  inputDigest?: string | null;

  /** Outcome type: 'success' | 'error' | 'pending_approval' | 'rate_limited'. */
  resultType: 'success' | 'error' | 'pending_approval' | 'rate_limited';

  /** Approval class: tells auditors which receipts need review. */
  approvalClass?: 'auto' | 'user_confirm' | 'external_spend' | 'on_chain';

  /** Optional: URL to the evidence (S3, IPFS, GitHub link, etc). */
  evidenceUrl?: string | null;
}

/**
 * emitReceipt: Log a single action to the receipts table (best-effort).
 *
 * @param input - Receipt fields; runId is optional (null is OK in v1)
 * @returns true on success, false on any error (always swallowed)
 *
 * Usage:
 *   await emitReceipt({
 *     agentIdentity: 'zoe',
 *     capability: 'post_github',
 *     tool: 'github_cli',
 *     action: 'create_pull_request',
 *     resultType: 'success',
 *     evidenceUrl: 'https://github.com/bettercallzaal/ZAOOS/pull/123',
 *   });
 */
export async function emitReceipt(input: ReceiptInput): Promise<boolean> {
  try {
    const client = db();

    // If runId is not provided, v1 accepts null per the schema NOT NULL FK constraint check.
    // If the schema requires a run to exist, create a lightweight one or make runId mandatory.
    // For now, this handler respects whatever runId is passed (null or a real UUID).

    const payload = {
      run_id: input.runId ?? null,
      agent_identity: input.agentIdentity,
      capability: input.capability,
      tool: input.tool,
      action: input.action,
      input_digest: input.inputDigest ?? null,
      result_type: input.resultType,
      approval_class: input.approvalClass ?? 'auto',
      evidence_url: input.evidenceUrl ?? null,
    };

    const { error } = await client.from('receipts').insert([payload]);

    if (error) {
      console.error('[zoe/receipts] insert failed:', error.message || error);
      return false;
    }

    return true;
  } catch (err) {
    // Swallow all errors: network, parse, auth, etc. Receipts are best-effort.
    console.error('[zoe/receipts] unexpected error:', (err as Error)?.message || err);
    return false;
  }
}

/**
 * emitReceiptBatch: Log multiple actions in one call (uses transactions when possible).
 * Also best-effort; returns count of successfully inserted receipts.
 *
 * @param inputs - Array of receipt inputs
 * @returns Number of receipts successfully inserted (0 on total failure)
 */
export async function emitReceiptBatch(inputs: ReceiptInput[]): Promise<number> {
  if (!inputs || inputs.length === 0) return 0;

  try {
    const client = db();
    const payloads = inputs.map((input) => ({
      run_id: input.runId ?? null,
      agent_identity: input.agentIdentity,
      capability: input.capability,
      tool: input.tool,
      action: input.action,
      input_digest: input.inputDigest ?? null,
      result_type: input.resultType,
      approval_class: input.approvalClass ?? 'auto',
      evidence_url: input.evidenceUrl ?? null,
    }));

    const { data, error } = await client.from('receipts').insert(payloads).select('id');

    if (error) {
      console.error('[zoe/receipts] batch insert failed:', error.message || error);
      return 0;
    }

    const inserted = data?.length ?? 0;
    if (inserted !== inputs.length) {
      console.warn(
        `[zoe/receipts] batch partial: ${inserted}/${inputs.length} inserted`,
      );
    }

    return inserted;
  } catch (err) {
    console.error('[zoe/receipts] batch unexpected error:', (err as Error)?.message || err);
    return 0;
  }
}
