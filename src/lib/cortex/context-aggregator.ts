/**
 * Context Aggregator - assembles the strategic context snapshot.
 *
 * Reads from the Spine (control-plane) and Grids (reputation, etc.) to build
 * a ContextSnapshot. All data is marked as sourced or pending - never fabricated.
 *
 * NOTE: The Spine (agent_runs, receipts tables) is not yet live in main.
 * This module is structured to read from those tables when they land, and
 * gracefully marks them as pending until then.
 */

import { v4 as uuidv4 } from 'uuid';
import { type Goal, type ContextSnapshot, type TaskDAG, type PendingSource } from './types';

/**
 * Fetch the Reputation Grid profile for the current user.
 * Follows the same PendingSource pattern as the Grids.
 *
 * For now, returns a pending marker since this is untested against live Grids.
 * When the route is stable, call it via fetch() to get actual profiles.
 */
async function fetchReputationGridSnapshot(): Promise<
  | { sourced: true; profiles: string }
  | { sourced: false; plannedSource: string }
> {
  // TODO: When src/app/api/grids/reputation/ is stable and tested in production,
  // fetch it here: const profiles = await fetch('/api/grids/reputation?id=zaal').then(r => r.json())
  // For now, return pending to signal we're ready but not yet integrated.
  return {
    sourced: false,
    plannedSource: 'Reputation Grid API (src/app/api/grids/reputation)',
  };
}

/**
 * Fetch active runs from the Spine control plane.
 * The Spine has agent_runs and receipts tables (not yet in main as of 2026-07-22).
 *
 * For now, returns a pending marker. When the Spine tables land:
 * - Query: SELECT * FROM agent_runs WHERE status IN ('created', 'ready', 'leased', 'running')
 * - Return: { sourced: true, activeRunCount: ..., lastRunId: ... }
 *
 * This is the Cortex's read into the Spine's execution state.
 */
async function fetchSpineRunsSnapshot(): Promise<
  | { sourced: true; activeRunCount: number; lastRunId?: string }
  | { sourced: false; plannedSource: string }
> {
  // TODO: When the Spine's agent_runs table lands in PR #2074, integrate here:
  // const { data: runs } = await supabaseAdmin.from('agent_runs')
  //   .select('id, status')
  //   .in('status', ['created', 'ready', 'leased', 'running'])
  // Return { sourced: true, activeRunCount: runs?.length ?? 0, lastRunId: runs?.[0]?.id };

  return {
    sourced: false,
    plannedSource: 'Spine agent_runs table (PR #2074, not yet in main)',
  };
}

/**
 * Compute completeness score: what fraction of the strategic picture do we have?
 * (0 = no data at all, 1 = all sources available and valid)
 *
 * Logic:
 * - Goals always sourced locally (1.0 contribution)
 * - Reputation Grid available: +0.3
 * - Spine runs available: +0.3
 * - More than 50% of goals have high confidence (>0.7): +0.4
 *
 * Capped at 1.0.
 */
function computeCompleteness(
  hasGoals: boolean,
  hasReputationGrid: boolean,
  hasSpineRuns: boolean,
  goalsHighConfidence: number,
  totalGoals: number,
): number {
  let score = 0;

  if (hasGoals) score += 1.0; // Goals are the foundation

  if (hasReputationGrid) score += 0.3;
  if (hasSpineRuns) score += 0.3;

  if (totalGoals > 0 && goalsHighConfidence / totalGoals > 0.5) {
    score += 0.4;
  }

  return Math.min(1.0, score);
}

/**
 * Assemble a strategic context snapshot by reading the Grids, Spine, and local goal state.
 *
 * @param goals - all known goals (from wherever they're stored)
 * @param dag - the task dependency graph
 * @returns a ContextSnapshot with all data sources marked as sourced or pending
 */
export async function assembleContextSnapshot(goals: Goal[], dag: TaskDAG): Promise<ContextSnapshot> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  // Fetch all source data in parallel
  const [reputationGrid, spineRuns] = await Promise.all([
    fetchReputationGridSnapshot(),
    fetchSpineRunsSnapshot(),
  ]);

  // Determine completeness
  const hasReputationGrid = reputationGrid.sourced;
  const hasSpineRuns = spineRuns.sourced;
  const goalsHighConfidence = goals.filter((g) => g.confidence > 0.7).length;

  const completeness = computeCompleteness(
    goals.length > 0,
    hasReputationGrid,
    hasSpineRuns,
    goalsHighConfidence,
    goals.length,
  );

  // List of unavailable sources
  const pendingSources: string[] = [];
  if (!hasReputationGrid) {
    pendingSources.push(reputationGrid.plannedSource);
  }
  if (!hasSpineRuns) {
    pendingSources.push(spineRuns.plannedSource);
  }

  return {
    id,
    createdAt,
    goals,
    dag,
    reputationGrid: reputationGrid as any,
    spineRuns: spineRuns as any,
    completeness,
    pendingSources,
  };
}

/**
 * Get a human-readable summary of what data is missing.
 * Used in decision explanations when completeness is low.
 */
export function summarizeMissingData(snapshot: ContextSnapshot): string {
  if (snapshot.pendingSources.length === 0) {
    return 'All data sources available.';
  }

  return `Missing: ${snapshot.pendingSources.join(', ')}. Decisions are based on available data only.`;
}

/**
 * Validate a context snapshot: check for obvious problems.
 * Returns a list of warnings (empty if snapshot is healthy).
 *
 * Checks:
 * - Completeness < 0.3: major data gap
 * - Goals with no dependencies: isolated work
 * - Cycles in DAG: impossible to execute
 */
export function validateSnapshot(snapshot: ContextSnapshot): string[] {
  const warnings: string[] = [];

  if (snapshot.completeness < 0.3) {
    warnings.push('Completeness is low (<30%). Decisions may be unreliable.');
  }

  const isolated = snapshot.goals.filter((g) => {
    const hasEdge = snapshot.dag.edges.some((e) => e.from === g.id || e.to === g.id);
    return !hasEdge && g.status !== 'completed' && g.status !== 'cancelled';
  });
  if (isolated.length > 0) {
    warnings.push(`${isolated.length} goal(s) have no dependencies - they may be orphaned.`);
  }

  if (snapshot.dag.cycles.length > 0) {
    warnings.push(`${snapshot.dag.cycles.length} cycle(s) detected in dependency graph. Execution impossible.`);
  }

  return warnings;
}
