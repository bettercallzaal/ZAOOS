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

import { randomUUID } from 'node:crypto';
import { db } from '../supabase';
import { computeActionDigest } from './receipt-envelope';

/**
 * Resolve a run_id for a receipt. receipts.run_id is NOT NULL with an FK to
 * agent_runs, so a receipt cannot exist without a run. When the caller has no
 * run context, create a minimal "adhoc" agent_run so the action is still
 * recorded and auditable - otherwise the insert silently fails the constraint
 * and the receipt is lost. Returns null only if even the run insert fails
 * (then the receipt is dropped, best-effort).
 */
async function resolveRunId(
  client: ReturnType<typeof db>,
  input: { runId?: string | null; action: string; agentIdentity: string },
): Promise<string | null> {
  if (input.runId) return input.runId;
  const assignmentId = randomUUID();
  const { data, error } = await client
    .from('agent_runs')
    .insert([
      {
        assignment_id: assignmentId,
        objective: `adhoc: ${input.action}`.slice(0, 500),
        idempotency_key: `adhoc-${assignmentId}`,
        created_by: input.agentIdentity,
        status: 'completed',
      },
    ])
    .select('id')
    .single();
  if (error || !data) {
    console.error('[zoe/receipts] adhoc agent_run insert failed:', error?.message || error);
    return null;
  }
  return (data as { id: string }).id;
}

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

    // receipts.run_id is NOT NULL + FK: resolve (or create) a run before inserting.
    const runId = await resolveRunId(client, input);
    if (!runId) return false;

    const payload = {
      run_id: runId,
      agent_identity: input.agentIdentity,
      capability: input.capability,
      tool: input.tool,
      action: input.action,
      // Default to a stable action-identity digest so replays are detectable
      // on the existing column (DreamNet contentSha256 pattern, doc 2030).
      input_digest: input.inputDigest ?? computeActionDigest(input, runId),
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
    // Resolve (or create) a run_id per receipt - run_id is NOT NULL + FK.
    const resolved = await Promise.all(
      inputs.map(async (input) => ({ input, runId: await resolveRunId(client, input) })),
    );
    const payloads = resolved
      .filter((r) => r.runId !== null)
      .map(({ input, runId }) => ({
        run_id: runId,
        agent_identity: input.agentIdentity,
        capability: input.capability,
        tool: input.tool,
        action: input.action,
        input_digest: input.inputDigest ?? computeActionDigest(input, runId as string),
        result_type: input.resultType,
        approval_class: input.approvalClass ?? 'auto',
        evidence_url: input.evidenceUrl ?? null,
      }));
    if (payloads.length === 0) return 0;

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
