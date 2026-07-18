/**
 * Agent Control Plane: Two-Plane OS Machine Execution Layer
 *
 * This module defines the types and pure helpers for Brandon's two-plane OS:
 * - AssignmentEnvelope: the work directive from human -> machine plane
 * - Agent run lifecycle: status transitions and legal paths
 * - Receipt: proof of every action taken
 *
 * No database calls in this file - all functions are pure (testable in isolation).
 * Database I/O lives in src/app/api/agents/* routes and bot/src/zoe/*
 */

import type { z } from "zod";

/**
 * AssignmentEnvelope: The complete work directive from human plane to machine.
 * Created when a task transitions to "ready-for-agent" status on the cowork board.
 * Couples to public.tasks via taskId but is independent (machines may get work
 * from other sources too - not just cowork board).
 */
export interface AssignmentEnvelope {
  /** Unique identifier for this assignment */
  assignmentId: string;

  /** Project or workspace ID (for visibility + routing scoping) */
  projectId: string;

  /** Link to the cowork board task (nullable - assignments may not be board-sourced) */
  taskId: string | null;

  /** Who initiated this assignment (human handle, fid, or 'orchestrator') */
  requestedBy: string;

  /** Which agent to target (or leave null for routing layer to decide) */
  suggestedAgent?: string;

  /** Free-form objective (what work needs doing) */
  objective: string;

  /** Capabilities required from the agent (e.g. ['read_farcaster', 'post_x']) */
  requiredCapabilities: string[];

  /** Context references (doc ids, URLs, code snippets for the agent to consider) */
  contextReferences: Array<{
    type: "doc" | "url" | "code_snippet" | "memory";
    value: string;
  }>;

  /** Approval policy: 'auto' (no approval), 'user_confirm' (needs sign-off),
   * 'external_spend' (financial), 'on_chain' (blockchain action) */
  approvalPolicy: "auto" | "user_confirm" | "external_spend" | "on_chain";

  /** Visibility: 'private' (team only), 'team' (team + observers), 'public' (all) */
  visibility: "private" | "team" | "public";

  /** Budget constraints (optional) */
  budget?: {
    /** Max compute cost (in credits or USD) */
    computeLimit?: number;
    /** Max external API spend (e.g. API calls, on-chain gas) */
    externalSpendLimit?: number;
    /** Deadline for completion (ISO8601 timestamp) */
    deadline?: string;
  };

  /** Idempotency key: same (taskId, objective, input_digest) never creates duplicate runs */
  idempotencyKey: string;
}

/**
 * Agent run status: the complete lifecycle of a machine assignment.
 * Transitions are constrained - not all paths are legal.
 */
export type RunStatus =
  | "queued" // Created, waiting to be routed
  | "routing" // Routing layer deciding which agent
  | "running" // Agent is executing
  | "awaiting_approval" // Awaiting human approval (approval_policy != 'auto')
  | "verifying" // Result is being verified
  | "done" // Successfully completed
  | "failed" // Agent failed (or hit hard limit)
  | "cancelled"; // Manually cancelled

/**
 * AgentRun: The database row reflecting a single assignment's execution.
 * Matches the agent_runs table structure.
 */
export interface AgentRun {
  id: string; // UUID
  taskId: string | null;
  assignmentId: string; // UUID, unique
  objective: string;
  requiredCapabilities: string[];
  status: RunStatus;
  assignedAgent: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: string | null; // ISO8601
  retries: number;
  budget: {
    computeLimit?: number;
    externalSpendLimit?: number;
    deadline?: string;
  } | null;
  approvalState: "auto" | "pending" | "approved" | "rejected";
  visibility: "private" | "team" | "public";
  idempotencyKey: string;
  createdBy: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

/**
 * Receipt: Proof of a single action an agent took.
 * Not the full evidence blob (that's in S3/IPFS), but the index entry.
 * Matches the receipts table structure.
 */
export interface Receipt {
  id: string; // UUID
  runId: string; // FK to agent_runs.id
  agentIdentity: string; // Which agent took the action
  capability: string; // e.g. 'post_farcaster'
  tool: string; // e.g. 'neynar_api'
  action: string; // e.g. 'post_cast'
  inputDigest: string | null; // SHA256 of request body
  resultType: "success" | "error" | "pending_approval" | "rate_limited";
  approvalClass: "auto" | "user_confirm" | "external_spend" | "on_chain";
  evidenceUrl: string | null; // S3/IPFS link to full evidence
  createdAt: string; // ISO8601
}

/**
 * Legal status transitions in the agent run lifecycle.
 * Not all paths are allowed (e.g., can't go from 'done' to 'running').
 */
const LEGAL_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  queued: ["routing", "cancelled"],
  routing: ["running", "failed", "cancelled"],
  running: ["awaiting_approval", "verifying", "done", "failed", "cancelled"],
  awaiting_approval: ["verifying", "failed", "cancelled"],
  verifying: ["done", "failed", "cancelled"],
  done: [], // Terminal state
  failed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * buildAssignmentEnvelope: Create a complete assignment from task + context.
 * Pure function - can be called from anywhere (API routes, bot, tests).
 *
 * @param input - Partial envelope + required fields
 * @returns Complete AssignmentEnvelope, ready to insert into agent_runs
 */
export function buildAssignmentEnvelope(input: {
  assignmentId: string;
  projectId: string;
  taskId?: string | null;
  requestedBy: string;
  objective: string;
  requiredCapabilities?: string[];
  contextReferences?: AssignmentEnvelope["contextReferences"];
  approvalPolicy?: "auto" | "user_confirm" | "external_spend" | "on_chain";
  visibility?: "private" | "team" | "public";
  budget?: AssignmentEnvelope["budget"];
  idempotencyKey: string;
}): AssignmentEnvelope {
  return {
    assignmentId: input.assignmentId,
    projectId: input.projectId,
    taskId: input.taskId ?? null,
    requestedBy: input.requestedBy,
    objective: input.objective,
    requiredCapabilities: input.requiredCapabilities ?? [],
    contextReferences: input.contextReferences ?? [],
    approvalPolicy: input.approvalPolicy ?? "auto",
    visibility: input.visibility ?? "team",
    budget: input.budget ?? undefined,
    idempotencyKey: input.idempotencyKey,
  };
}

/**
 * nextRunStatus: Determine the next valid status for an assignment.
 * Enforces legal transitions - throws if the requested transition is illegal.
 *
 * @param currentStatus - Current status of the run
 * @param event - What event just happened (route_complete, execute_success, etc.)
 * @returns The next valid status
 * @throws If the transition is illegal (e.g., trying to move from 'done' to 'running')
 */
export function nextRunStatus(
  currentStatus: RunStatus,
  event:
    | "route_complete" // Routing layer assigned an agent
    | "execute_start" // Agent started execution
    | "approval_needed" // Needs human sign-off
    | "execute_success" // Agent completed successfully
    | "execute_failure" // Agent failed
    | "verify_start" // Started verification
    | "verify_complete" // Verification passed
    | "user_approve" // Human approved
    | "user_reject" // Human rejected
    | "cancel_request", // Cancellation requested
): RunStatus {
  const nextMap: Readonly<Record<string, RunStatus>> = {
    "queued:route_complete": "routing",
    "routing:execute_start": "running",
    "routing:execute_failure": "failed",
    "running:approval_needed": "awaiting_approval",
    "running:execute_success": "verifying",
    "running:execute_failure": "failed",
    "awaiting_approval:user_approve": "verifying",
    "awaiting_approval:user_reject": "failed",
    "verifying:verify_complete": "done",
    "verifying:execute_failure": "failed",
    "queued:cancel_request": "cancelled",
    "routing:cancel_request": "cancelled",
    "running:cancel_request": "cancelled",
    "awaiting_approval:cancel_request": "cancelled",
    "verifying:cancel_request": "cancelled",
  };

  const key = `${currentStatus}:${event}`;
  const next = nextMap[key] as RunStatus | undefined;

  if (!next) {
    throw new Error(
      `Illegal transition: cannot move from '${currentStatus}' on event '${event}'`,
    );
  }

  // Verify the transition is in LEGAL_TRANSITIONS (belt + suspenders)
  const legalNexts = LEGAL_TRANSITIONS[currentStatus];
  if (!legalNexts.includes(next)) {
    throw new Error(
      `Transition check failed: '${next}' is not in legal next states for '${currentStatus}'`,
    );
  }

  return next;
}

/**
 * isTerminal: Check if a status is a terminal state (no further transitions).
 *
 * @param status - The status to check
 * @returns True if terminal (done, failed, cancelled)
 */
export function isTerminal(status: RunStatus): boolean {
  return LEGAL_TRANSITIONS[status].length === 0;
}

/**
 * getApprovalClass: Determine which receipts from this run need approval.
 * Pairs with AssignmentEnvelope.approvalPolicy to decide review gates.
 *
 * @param approvalPolicy - Policy set on the assignment
 * @returns The approval class for receipts from this run
 */
export function getApprovalClass(
  approvalPolicy: "auto" | "user_confirm" | "external_spend" | "on_chain",
): Receipt["approvalClass"] {
  return approvalPolicy as Receipt["approvalClass"];
}
