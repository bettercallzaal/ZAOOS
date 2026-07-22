/**
 * Priority Engine - pure functions for scoring and ranking work.
 *
 * Given a goal and its context (is it blocking others? is it urgent? do we have data?),
 * compute a numerical priority score (0-1). This is the core of the Cortex's ability
 * to recommend "what's most important now."
 *
 * All functions are pure (no I/O, no side effects) for testability.
 */

import { type Goal, type PriorityScore, type WorkDependencyEdge } from './types';

/**
 * Compute goalAlignment score: how well does this task align with active missions?
 *
 * Logic:
 * - Task is part of a 'in_progress' or 'ready' objective -> high (0.9)
 * - Task's parent objective is 'backlog' -> medium (0.5)
 * - No parent (orphan) -> low (0.3)
 * - Task's parent is 'completed' or 'cancelled' -> 0
 */
function scoreGoalAlignment(goal: Goal, allGoals: Goal[]): number {
  if (goal.parentId === null) {
    // Top-level mission
    return goal.status === 'in_progress' ? 0.9 : goal.status === 'ready' ? 0.7 : 0.3;
  }

  const parent = allGoals.find((g) => g.id === goal.parentId);
  if (!parent) return 0.3; // orphan

  if (parent.status === 'completed' || parent.status === 'cancelled') return 0;
  if (parent.status === 'in_progress') return 0.9;
  if (parent.status === 'ready') return 0.7;
  if (parent.status === 'blocked') return 0.4;
  return 0.5; // backlog
}

/**
 * Compute blockingOthers score: how many tasks depend on this one?
 *
 * Logic:
 * - If this task blocks 3+ other ready/in_progress tasks -> high (0.9)
 * - If this task blocks 1-2 -> medium (0.6)
 * - If this task blocks only backlog tasks -> low (0.3)
 * - If no one depends on this -> 0
 */
function scoreBlockingOthers(goal: Goal, edges: WorkDependencyEdge[], allGoals: Goal[]): number {
  // Find all tasks that this goal blocks
  const dependents = edges
    .filter((e) => e.from === goal.id && e.kind === 'blocks')
    .map((e) => {
      const dep = allGoals.find((g) => g.id === e.to);
      return dep;
    })
    .filter((g) => g !== undefined) as Goal[];

  if (dependents.length === 0) return 0;

  // Count how many dependents are actively waiting on this task: 'ready' or
  // 'in_progress' (want to start / are running) OR 'blocked' (a task in the
  // 'blocked' state downstream of a 'blocks' edge is blocked BY this one, so it
  // is precisely what this task is holding up). Only 'backlog'/'completed'/
  // 'cancelled' dependents do not count as actively blocked.
  const activeCount = dependents.filter(
    (g) => g.status === 'ready' || g.status === 'in_progress' || g.status === 'blocked',
  ).length;

  if (activeCount >= 3) return 0.9;
  if (activeCount >= 1) return 0.6;
  return 0.3;
}

/**
 * Compute urgency score: is this time-sensitive?
 *
 * Logic:
 * - Goal has no parent (is a mission) -> high urgency (0.8)
 * - Goal is 'in_progress' -> high (0.8)
 * - Goal is 'ready' -> medium (0.6)
 * - Goal is 'backlog' -> low (0.3)
 * - Goal is 'blocked' -> depends on how long blocked (0.2-0.5)
 * - Goal is 'completed' or 'cancelled' -> 0
 */
function scoreUrgency(goal: Goal, allGoals: Goal[]): number {
  if (goal.status === 'completed' || goal.status === 'cancelled') return 0;
  if (goal.status === 'in_progress') return 0.8;
  if (goal.status === 'ready') return 0.6;
  if (goal.status === 'blocked') {
    // If it's been blocked for a while, escalate urgency
    const updatedDays = (Date.now() - new Date(goal.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(0.5, 0.2 + updatedDays / 100);
  }

  // Check if this is a top-level mission (high urgency)
  if (goal.parentId === null) return 0.8;

  return 0.3; // backlog
}

/**
 * Compute contextQuality score: do we have enough data to decide on this task?
 *
 * Logic:
 * - If confidence > 0.8 -> high (0.9)
 * - If confidence 0.5-0.8 -> medium (0.6)
 * - If confidence < 0.5 -> low (0.3)
 */
function scoreContextQuality(goal: Goal): number {
  if (goal.confidence >= 0.8) return 0.9;
  if (goal.confidence >= 0.5) return 0.6;
  return 0.3;
}

/**
 * Compute humanSignal score: has Zaal flagged this as high-priority?
 *
 * Logic:
 * - If goal.notes contains keywords like "urgent", "asap", "priority" -> high (0.9)
 * - If goal.notes is long (detailed context) -> medium (0.5)
 * - Otherwise -> 0 (no signal)
 *
 * This is deliberately conservative - we only boost if Zaal explicitly says so.
 */
function scoreHumanSignal(goal: Goal): number {
  if (!goal.notes) return 0;

  const urgentKeywords = /\b(urgent|asap|critical|priority|blocker|do.*today|emergency)\b/i;
  if (urgentKeywords.test(goal.notes)) return 0.9;

  // Long notes = Zaal cared enough to explain -> slight boost
  if (goal.notes.length > 100) return 0.5;

  return 0;
}

/**
 * Weights for combining component scores into a total.
 * Sum of all weights should be 1.0.
 *
 * Rationale:
 * - Goal alignment (0.25): does this serve the mission?
 * - Blocking others (0.25): are we holding up critical path?
 * - Urgency (0.25): is it time-sensitive?
 * - Context quality (0.10): do we know enough to start?
 * - Human signal (0.15): what does Zaal say?
 */
const PRIORITY_WEIGHTS = {
  goalAlignment: 0.25,
  blockingOthers: 0.25,
  urgency: 0.25,
  contextQuality: 0.1,
  humanSignal: 0.15,
};

/**
 * Score a single goal's priority.
 * Returns component breakdown + total + reasoning + confidence.
 */
export function scoreGoalPriority(
  goal: Goal,
  allGoals: Goal[],
  edges: WorkDependencyEdge[],
): PriorityScore {
  const alignment = scoreGoalAlignment(goal, allGoals);
  const blocking = scoreBlockingOthers(goal, edges, allGoals);
  const urg = scoreUrgency(goal, allGoals);
  const context = scoreContextQuality(goal);
  const signal = scoreHumanSignal(goal);

  const total =
    alignment * PRIORITY_WEIGHTS.goalAlignment +
    blocking * PRIORITY_WEIGHTS.blockingOthers +
    urg * PRIORITY_WEIGHTS.urgency +
    context * PRIORITY_WEIGHTS.contextQuality +
    signal * PRIORITY_WEIGHTS.humanSignal;

  // Build reasoning: mention the top 2 components that drove the score
  const components = [
    { name: 'mission alignment', score: alignment },
    { name: 'blocking others', score: blocking },
    { name: 'urgency', score: urg },
    { name: 'context quality', score: context },
    { name: 'human signal', score: signal },
  ].sort((a, b) => b.score - a.score);

  const topComponents = components
    .slice(0, 2)
    .map((c) => `${c.name} ${(c.score * 100).toFixed(0)}%`)
    .join(', ');

  const reasoning =
    total > 0.8
      ? `High priority: ${topComponents} drive this task forward on critical path.`
      : total > 0.5
        ? `Medium priority: ${topComponents} indicate this is ready to start.`
        : `Low priority: ${topComponents} suggest this can wait for now.`;

  // Confidence: how sure are we? If context quality is low, confidence drops.
  const confidence = Math.max(0.3, Math.min(1, context + goal.confidence / 2));

  return {
    goalAlignment: alignment,
    blockingOthers: blocking,
    urgency: urg,
    contextQuality: context,
    humanSignal: signal,
    total: Math.min(1, total),
    reasoning,
    confidence,
  };
}

/**
 * Rank goals by priority: highest total score first.
 * Returns goal IDs in priority order.
 */
export function rankGoalsByPriority(
  goals: Goal[],
  edges: WorkDependencyEdge[],
): { goalId: string; score: PriorityScore }[] {
  const scored = goals.map((goal) => ({
    goalId: goal.id,
    score: scoreGoalPriority(goal, goals, edges),
  }));

  return scored.sort((a, b) => b.score.total - a.score.total);
}

/**
 * Given a ranked list of goals, explain why goal A is more important than goal B.
 * Returns a prose explanation (1-2 sentences).
 */
export function explainRanking(scoreA: PriorityScore, scoreB: PriorityScore, nameA: string, nameB: string): string {
  const diff = scoreA.total - scoreB.total;
  if (Math.abs(diff) < 0.05) {
    return `${nameA} and ${nameB} are nearly equal in priority.`;
  }

  const diffPct = ((diff / scoreB.total) * 100).toFixed(0);
  const topDriverA = ['goal alignment', 'blocking others', 'urgency', 'context quality', 'human signal'][
    [scoreA.goalAlignment, scoreA.blockingOthers, scoreA.urgency, scoreA.contextQuality, scoreA.humanSignal].indexOf(
      Math.max(scoreA.goalAlignment, scoreA.blockingOthers, scoreA.urgency, scoreA.contextQuality, scoreA.humanSignal),
    )
  ];

  return `${nameA} scores ${(scoreA.total * 100).toFixed(0)} (driven by ${topDriverA}), about ${diffPct}% higher than ${nameB} at ${(scoreB.total * 100).toFixed(0)}.`;
}
