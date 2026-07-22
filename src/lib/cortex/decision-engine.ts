/**
 * Decision Engine - orchestrates the Cortex to answer executive questions.
 *
 * This module calls the pure functions (priority engine, dependency resolver)
 * and the I/O functions (context aggregator) to build complete strategic answers.
 *
 * All decisions are immutable DecisionReceipts - recommendations only, never execution.
 */

import { v4 as uuidv4 } from 'uuid';
import { type DecisionReceipt, type BottleneckReport, type Goal, type WorkDependencyEdge } from './types';
import { scoreGoalPriority, rankGoalsByPriority, explainRanking } from './priority-engine';
import {
  buildTaskDAG,
  findBlockedTasks,
  findWaitingForApproval,
  findParallelizableTasks,
  estimateCompletionImpact,
} from './work-dependency-resolver';
import { assembleContextSnapshot } from './context-aggregator';

/**
 * Ask the Cortex: "What's the most important thing to do right now?"
 *
 * Returns a DecisionReceipt with:
 * - The top 1 task (goal ID)
 * - Reasoning (why this task is #1)
 * - Confidence (0-1)
 * - Recommended action (e.g., "Start this task" or "Approve and start")
 */
export async function decideMostImportantNow(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));
  const dag = snapshot.dag;

  // Rank all ready/in_progress goals
  const readyGoals = goals.filter((g) => g.status === 'ready' || g.status === 'in_progress');
  if (readyGoals.length === 0) {
    return {
      id,
      createdAt,
      decisionKind: 'most_important_now',
      answer: [],
      reasoning: 'No ready or in-progress tasks. All work is blocked or backlog. Consider approving blocked work or unblocking dependencies.',
      confidence: 0.5,
      inputsSnapshotId: snapshot.id,
      recommendedAction: 'Unblock external dependencies or approve waiting tasks.',
    };
  }

  const ranked = rankGoalsByPriority(readyGoals, edges);
  const top = ranked[0];
  const topGoal = goals.find((g) => g.id === top.goalId);

  if (!topGoal) {
    return {
      id,
      createdAt,
      decisionKind: 'most_important_now',
      answer: [],
      reasoning: 'Could not resolve top goal.',
      confidence: 0,
      inputsSnapshotId: snapshot.id,
    };
  }

  // Estimate impact of completing this task
  const impact = estimateCompletionImpact(topGoal.id, goals, edges);

  const reasoning =
    `Task "${topGoal.title}" is the top priority. ` +
    `Score: ${(top.score.total * 100).toFixed(0)}. ` +
    (impact > 0 ? `Completing it will unblock ${impact} downstream task(s). ` : '') +
    `Key drivers: ${top.score.reasoning}`;

  return {
    id,
    createdAt,
    decisionKind: 'most_important_now',
    answer: [topGoal.id],
    reasoning,
    confidence: top.score.confidence,
    inputsSnapshotId: snapshot.id,
    recommendedAction: `Focus on "${topGoal.title}" next.`,
  };
}

/**
 * Ask the Cortex: "What are the top 5 priorities?"
 *
 * Returns a DecisionReceipt with a list of goal IDs ranked by priority.
 */
export async function decideTop5Priorities(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));

  // Rank all goals, filter out completed/cancelled
  const activeGoals = goals.filter((g) => g.status !== 'completed' && g.status !== 'cancelled');
  const ranked = rankGoalsByPriority(activeGoals, edges);
  const top5 = ranked.slice(0, 5);

  const reasoning =
    `Top priorities in order of impact:\n` +
    top5
      .map((r, i) => {
        const goal = goals.find((g) => g.id === r.goalId);
        return `${i + 1}. "${goal?.title}" (score: ${(r.score.total * 100).toFixed(0)})`;
      })
      .join('\n') +
    `\n\nFocus work on this order to maximize value.`;

  return {
    id,
    createdAt,
    decisionKind: 'top_5_priorities',
    answer: top5.map((r) => r.goalId),
    reasoning,
    confidence: top5.length > 0 ? top5[0].score.confidence : 0.5,
    inputsSnapshotId: snapshot.id,
  };
}

/**
 * Ask the Cortex: "What's blocking progress?"
 *
 * Returns a BottleneckReport listing:
 * - External dependencies
 * - Tasks waiting for approval
 * - Stalled tasks
 * - Critical path
 * - Recommended interventions
 */
export async function decideWhatIsBlocking(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));
  const dag = snapshot.dag;

  // Find blocked tasks
  const blockedIds = findBlockedTasks(goals, edges);
  const blockedGoals = blockedIds.map((id) => goals.find((g) => g.id === id)).filter((g) => g !== undefined) as Goal[];

  // Find waiting for approval
  const waitingIds = findWaitingForApproval(goals, edges);
  const waitingGoals = waitingIds.map((id) => goals.find((g) => g.id === id)).filter((g) => g !== undefined) as Goal[];

  // Find stalled tasks (in_progress for >5 days)
  const stalledGoals = goals.filter((g) => {
    if (g.status !== 'in_progress') return false;
    const daysSinceUpdate = (Date.now() - new Date(g.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 5;
  });

  // Build BottleneckReport
  const report: BottleneckReport = {
    externalDeps: [],
    waitingForApproval: waitingGoals.map((g) => ({
      taskId: g.id,
      taskTitle: g.title,
      approverName: 'Zaal', // TODO: extract from goal.notes if available
      daysSinceSubmitted: Math.round(
        (Date.now() - new Date(g.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    })),
    stalledTasks: stalledGoals.map((g) => ({
      taskId: g.id,
      taskTitle: g.title,
      reason: g.notes ?? 'No explanation provided',
      daysSinceLastProgress: Math.round(
        (Date.now() - new Date(g.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    })),
    criticalPath: {
      taskIds: dag.criticalPath,
      estimatedDays: dag.criticalPathDays ?? 0,
    },
    recommendations: [
      ...(waitingGoals.length > 0 ? [`Approve ${waitingGoals.length} waiting task(s) to unblock work.`] : []),
      ...(stalledGoals.length > 0 ? [`Investigate why ${stalledGoals.length} task(s) have stalled.`] : []),
      ...(dag.cycles.length > 0 ? ['CRITICAL: Circular dependencies detected. Restructure tasks to break cycles.'] : []),
    ],
  };

  const reasoning =
    `Blockers: ${blockedGoals.length} tasks blocked, ${waitingGoals.length} awaiting approval, ` +
    `${stalledGoals.length} stalled. Critical path: ${dag.criticalPath.length} tasks, ~${dag.criticalPathDays} days.`;

  return {
    id,
    createdAt,
    decisionKind: 'what_is_blocking',
    answer: report,
    reasoning,
    confidence: 0.7,
    inputsSnapshotId: snapshot.id,
    recommendedAction: 'See details for specific unblocking actions.',
  };
}

/**
 * Ask the Cortex: "What can be delayed?"
 *
 * Returns a list of goal IDs that are low-priority and can slip without cascading damage.
 */
export async function decideWhatCanBeDelayed(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));

  // Rank all goals, take the lowest-score ones that don't block others
  const ranked = rankGoalsByPriority(goals, edges);
  const delayable = ranked
    .filter((r) => {
      const goal = goals.find((g) => g.id === r.goalId);
      if (!goal) return false;
      if (goal.status === 'completed' || goal.status === 'cancelled') return false;

      // Is it blocking anyone?
      const blocks = edges.some((e) => e.from === goal.id && e.kind === 'blocks');
      return !blocks && r.score.total < 0.4;
    })
    .slice(0, 5)
    .map((r) => r.goalId);

  const reasoning =
    delayable.length > 0
      ? `These ${delayable.length} low-priority goal(s) don't block critical path and can be deferred.`
      : 'All active goals are either high-priority or block critical work.';

  return {
    id,
    createdAt,
    decisionKind: 'what_can_be_delayed',
    answer: delayable,
    reasoning,
    confidence: 0.6,
    inputsSnapshotId: snapshot.id,
    recommendedAction:
      delayable.length > 0
        ? `Consider deferring these to focus on higher-priority work.`
        : 'No tasks can be safely delayed.',
  };
}

/**
 * Ask the Cortex: "What needs human approval?"
 *
 * Returns goal IDs for tasks in 'ready' status that have an 'approval' edge.
 */
export async function decideWhatNeedsApproval(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));

  const waitingIds = findWaitingForApproval(goals, edges);
  const waitingGoals = waitingIds.map((id) => goals.find((g) => g.id === id)).filter((g) => g !== undefined) as Goal[];

  const reasoning =
    waitingGoals.length > 0
      ? `${waitingGoals.length} task(s) are ready to start but need approval.\nTasks: ${waitingGoals.map((g) => `"${g.title}"`).join(', ')}`
      : 'No tasks are waiting for approval.';

  return {
    id,
    createdAt,
    decisionKind: 'what_needs_approval',
    answer: waitingIds,
    reasoning,
    confidence: 0.9,
    inputsSnapshotId: snapshot.id,
    recommendedAction: 'Review and approve waiting tasks to unblock work.',
  };
}

/**
 * Ask the Cortex: "What can be parallelized?"
 *
 * Returns pairs of goal IDs that can run in parallel (no blocking dependencies).
 */
export async function decideWhatCanParallelize(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): Promise<DecisionReceipt> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot = await assembleContextSnapshot(goals, buildTaskDAG(goals, edges));

  const parallelPairs = findParallelizableTasks(goals, edges);
  const parallelGoals = new Set<string>();
  for (const [a, b] of parallelPairs) {
    parallelGoals.add(a);
    parallelGoals.add(b);
  }

  const reasoning =
    parallelGoals.size > 0
      ? `${parallelGoals.size} ready/in-progress goal(s) can run in parallel. ${parallelPairs.length} independent pairs identified.`
      : 'All active tasks have blocking dependencies; no parallelization available.';

  return {
    id,
    createdAt,
    decisionKind: 'what_can_parallelize',
    answer: Array.from(parallelGoals),
    reasoning,
    confidence: 0.8,
    inputsSnapshotId: snapshot.id,
    recommendedAction: 'Assign independent tasks to different workers for faster throughput.',
  };
}
