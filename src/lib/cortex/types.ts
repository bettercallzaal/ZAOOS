/**
 * Executive Cortex v1 - type system
 *
 * The Cortex THINKS (analyzes priorities, dependencies, blockers) and RECOMMENDS
 * (emits decisions). It NEVER executes work, never holds execution state, never
 * modifies Spine or Grid data - it reads only and is purely advisory.
 *
 * Core types:
 * - Goal: task hierarchy (mission -> objective -> task)
 * - PriorityScore: weighted component breakdown + reasoning + confidence
 * - TaskDAG: dependency graph, critical path, cycle detection
 * - DecisionReceipt: immutable recommendation snapshot
 * - ContextSnapshot: reconstructable state from Spine + Grids
 * - BottleneckReport: strategic blockers, waiting work, external deps
 */

/**
 * Goal kinds: the mission -> objective -> task hierarchy.
 * Mission: "Build the Executive Cortex MVP"
 * Objective: "Implement priority engine logic", "Get tests green"
 * Task: "Write priority-engine.ts", "Debug cycle detection"
 */
export type GoalKind = 'mission' | 'objective' | 'task';

export interface Goal {
  id: string;
  kind: GoalKind;
  /** Parent goal (if part of a hierarchy); null if top-level mission. */
  parentId: string | null;
  title: string;
  description?: string;
  /** Current state of the goal. */
  status: 'backlog' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  /** Human estimate of how complete this is (0-100). */
  percentComplete: number;
  /** Confidence that this goal's status is correct (0-1). */
  confidence: number;
  /** When the goal was created. */
  createdAt: string;
  /** When it was last updated. */
  updatedAt: string;
  /** Optional human note (e.g., "waiting on Greg's feedback"). */
  notes?: string;
}

/**
 * Component breakdown of a priority score.
 * Each component is 0-1, and the total is their weighted sum (capped at 1).
 */
export interface PriorityScore {
  /** How well this task aligns with active missions (0-1). */
  goalAlignment: number;
  /** How many other tasks are waiting on this one (0-1). */
  blockingOthers: number;
  /** Time-sensitive urgency (0-1). 0 = nice-to-have, 1 = do-today. */
  urgency: number;
  /** Quality of data available to decide this task (0-1). */
  contextQuality: number;
  /** Human signal: a Zaal comment or flag (0-1). 0 = no signal, 1 = high priority. */
  humanSignal: number;

  /** Final score: weighted sum of components (0-1). */
  total: number;
  /** Reasoning: why this score (as prose, 200-500 chars). */
  reasoning: string;
  /** Confidence in this scoring (0-1). */
  confidence: number;
}

/**
 * A directed edge in the work dependency graph.
 * "task B is blocked by task A" is represented as { from: A, to: B, kind: 'blocks' }.
 */
export interface WorkDependencyEdge {
  from: string;
  to: string;
  /** What kind of dependency: task A must COMPLETE before B starts,
   * or is CONTEXT (informational) for B, or B WAITS for A's approval. */
  kind: 'blocks' | 'context' | 'approval';
  /** Optional note on why this dependency exists. */
  reason?: string;
}

/**
 * The task DAG: dependency graph analysis.
 * Used to find the critical path, detect cycles, and identify blocked/waiting work.
 */
export interface TaskDAG {
  nodes: Goal[];
  edges: WorkDependencyEdge[];
  /** Topological order of tasks (execution order if all deps were satisfied). */
  topologicalOrder: string[];
  /** Detected cycles (e.g., [['A', 'B', 'C', 'A']]); empty if acyclic. */
  cycles: string[][];
  /** Critical path: the longest chain of dependencies (a bottleneck). */
  criticalPath: string[];
  /** Critical path duration estimate (days, if available). */
  criticalPathDays?: number;
}

/**
 * Decision receipt: an immutable recommendation snapshot.
 * The Cortex emits these to answer executive questions.
 *
 * Example: "What's the most important thing to do right now?"
 * Answer: DecisionReceipt with kind='most_important_now', answer=['task-42'], reasoning=...
 */
export interface DecisionReceipt {
  id: string;
  createdAt: string;
  /** What decision is this answering?
   * - 'most_important_now': what's the #1 priority right now
   * - 'top_5_priorities': ranked list of 5 highest-value tasks
   * - 'what_is_blocking': what external deps/approvals are holding up progress
   * - 'what_can_be_delayed': tasks that can slip without cascading damage
   * - 'what_needs_approval': decisions waiting for human sign-off
   * - 'what_can_parallelize': independent tasks that can run in parallel
   * - 'blockers_and_risks': BottleneckReport
   */
  decisionKind:
    | 'most_important_now'
    | 'top_5_priorities'
    | 'what_is_blocking'
    | 'what_can_be_delayed'
    | 'what_needs_approval'
    | 'what_can_parallelize'
    | 'blockers_and_risks';

  /** Answer to the decision (list of goal IDs, or a BottleneckReport, etc.). */
  answer: string[] | BottleneckReport;
  /** Why the Cortex made this decision (prose, 300-800 chars). */
  reasoning: string;
  /** Confidence in this recommendation (0-1). */
  confidence: number;

  /** Snapshot of the context used to make this decision (for auditing/learning). */
  inputsSnapshotId: string;

  /** Recommended action (if any): what Zaal should do with this decision. */
  recommendedAction?: string;
}

/**
 * A snapshot of the current strategic context: goals, Spine state, Grids status.
 * Used to reconstruct decisions later (auditing, learning, debugging).
 * Never fabricated - all fields are marked as sourced or pending.
 */
export interface ContextSnapshot {
  id: string;
  createdAt: string;

  /** All known goals at the time of the snapshot. */
  goals: Goal[];

  /** Dependency graph snapshot. */
  dag: TaskDAG;

  /** Reputation Grid snapshot (top N members + Zaal's profile). */
  reputationGrid?: {
    sourced: true;
    profiles: string; // serialized JSON, for storage
  } | {
    sourced: false;
    plannedSource: string;
  };

  /** Spine control-plane snapshot (active runs, recent completions). */
  spineRuns?: {
    sourced: true;
    activeRunCount: number;
    lastRunId?: string;
  } | {
    sourced: false;
    plannedSource: string;
  };

  /** Composite completeness metric: how much of the picture do we have? (0-1). */
  completeness: number;
  /** List of unavailable data sources (e.g., "Spine not yet live", "Reputation Grid pending"). */
  pendingSources: string[];
}

/**
 * Blockers and risks: a strategic view of what's preventing progress.
 * Used as an answer to 'what_is_blocking' and 'blockers_and_risks' decisions.
 */
export interface BottleneckReport {
  /** External dependencies: things ZAO needs that are not in ZAO's control. */
  externalDeps: {
    id: string;
    description: string;
    /** Which tasks are waiting on this. */
    blockingTaskIds: string[];
    /** Estimated days until resolved (if known). */
    estimatedDaysToResolve?: number;
  }[];

  /** Waiting for approval: tasks ready to start but blocked on human sign-off. */
  waitingForApproval: {
    taskId: string;
    taskTitle: string;
    /** Who it's waiting on (e.g., 'Zaal', 'Greg'). */
    approverName: string;
    /** How long it's been waiting (days). */
    daysSinceSubmitted: number;
  }[];

  /** In progress but stalled: tasks that are active but make no forward progress. */
  stalledTasks: {
    taskId: string;
    taskTitle: string;
    /** Why it's stalled. */
    reason: string;
    /** How long it's been stalled (days). */
    daysSinceLastProgress: number;
  }[];

  /** Critical path: the longest chain of dependencies (the bottleneck). */
  criticalPath: {
    taskIds: string[];
    estimatedDays: number;
  };

  /** Recommended interventions to unblock progress. */
  recommendations: string[];
}

/**
 * Zod-style PendingSource marker: used to declare that a field is typed but
 * not yet sourced from a real table (same pattern as Reputation Grid).
 */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired (e.g., 'agent_runs table', 'Spine receipts'). */
  plannedSource: string;
}
