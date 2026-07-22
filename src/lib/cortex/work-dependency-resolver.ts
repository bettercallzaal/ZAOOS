/**
 * Work Dependency Resolver - pure functions for analyzing task dependencies.
 *
 * Builds a DAG (directed acyclic graph), detects cycles, computes critical path,
 * and identifies blocked/waiting work.
 *
 * All functions are pure (no I/O).
 */

import { type Goal, type TaskDAG, type WorkDependencyEdge } from './types';

/**
 * Topological sort of goals by dependencies.
 * Returns task IDs in execution order (dependencies before dependents).
 * If there are cycles, returns an empty array (see detectCycles separately).
 */
function topologicalSort(nodes: Goal[], edges: WorkDependencyEdge[]): string[] {
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const node of nodes) {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  // Build adjacency list and in-degree count
  for (const edge of edges) {
    if (edge.kind === 'blocks') {
      const deps = adjList.get(edge.from) ?? [];
      deps.push(edge.to);
      adjList.set(edge.from, deps);

      const deg = (inDegree.get(edge.to) ?? 0) + 1;
      inDegree.set(edge.to, deg);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    for (const neighbor of adjList.get(nodeId) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If we didn't visit all nodes, there's a cycle
  return order.length === nodes.length ? order : [];
}

/**
 * Detect cycles in the dependency graph using DFS.
 * Returns a list of cycles (each cycle is a list of node IDs).
 * If acyclic, returns [].
 */
function detectCycles(nodes: Goal[], edges: WorkDependencyEdge[]): string[][] {
  const adjList = new Map<string, string[]>();
  for (const node of nodes) {
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (edge.kind === 'blocks') {
      const deps = adjList.get(edge.from) ?? [];
      deps.push(edge.to);
      adjList.set(edge.from, deps);
    }
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): void {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adjList.get(nodeId) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = [...path.slice(cycleStart), neighbor];
        cycles.push(cycle);
      }
    }

    path.pop();
    recStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycles;
}

/**
 * Compute the critical path: the longest chain of dependencies.
 * This is the bottleneck - the minimum time required to complete all work.
 *
 * Returns the list of task IDs in critical path order.
 */
function computeCriticalPath(nodes: Goal[], edges: WorkDependencyEdge[], topo: string[]): string[] {
  if (topo.length === 0) return []; // Cycle detected; no valid path

  // Map of node -> its longest path length
  const longestPath = new Map<string, number>();
  // Map of node -> predecessor in critical path
  const predecessor = new Map<string, string>();

  // Visit nodes in topological order
  for (const nodeId of topo) {
    let maxDep = 0;
    let maxPred = '';

    // Check all incoming edges
    for (const edge of edges) {
      if (edge.kind === 'blocks' && edge.to === nodeId) {
        const depLen = (longestPath.get(edge.from) ?? 0) + 1;
        if (depLen > maxDep) {
          maxDep = depLen;
          maxPred = edge.from;
        }
      }
    }

    longestPath.set(nodeId, maxDep);
    if (maxPred) predecessor.set(nodeId, maxPred);
  }

  // Find the node with the longest path
  let maxNode = '';
  let maxLen = 0;
  for (const [nodeId, len] of longestPath) {
    if (len > maxLen) {
      maxLen = len;
      maxNode = nodeId;
    }
  }

  // Reconstruct the path
  const path: string[] = [];
  let current: string | undefined = maxNode;
  while (current) {
    path.unshift(current);
    current = predecessor.get(current);
  }

  return path;
}

/**
 * Build the task DAG and return all dependency analysis.
 */
export function buildTaskDAG(goals: Goal[], edges: WorkDependencyEdge[]): TaskDAG {
  const cycles = detectCycles(goals, edges);
  const topo = cycles.length === 0 ? topologicalSort(goals, edges) : [];
  const critPath = topo.length > 0 ? computeCriticalPath(goals, edges, topo) : [];

  return {
    nodes: goals,
    edges,
    topologicalOrder: topo,
    cycles,
    criticalPath: critPath,
    // Rough estimate: assume 1 day per task on critical path
    criticalPathDays: critPath.length,
  };
}

/**
 * Find all tasks that are currently blocked by one or more dependencies.
 * Returns goal IDs that are in 'blocked' status or have unmet dependencies.
 */
export function findBlockedTasks(goals: Goal[], edges: WorkDependencyEdge[]): string[] {
  const blocked: Set<string> = new Set();

  // Mark goals that are explicitly in 'blocked' status
  for (const goal of goals) {
    if (goal.status === 'blocked') {
      blocked.add(goal.id);
    }
  }

  // Mark goals that have incoming 'blocks' edges from incomplete tasks
  for (const edge of edges) {
    if (edge.kind === 'blocks') {
      const fromGoal = goals.find((g) => g.id === edge.from);
      if (fromGoal && (fromGoal.status !== 'completed' && fromGoal.status !== 'cancelled')) {
        blocked.add(edge.to);
      }
    }
  }

  return Array.from(blocked);
}

/**
 * Find all tasks that are waiting for approval.
 * These are 'ready' tasks that have an 'approval' edge from a dependent.
 */
export function findWaitingForApproval(goals: Goal[], edges: WorkDependencyEdge[]): string[] {
  const waiting: Set<string> = new Set();

  for (const edge of edges) {
    if (edge.kind === 'approval') {
      const toGoal = goals.find((g) => g.id === edge.to);
      if (toGoal && (toGoal.status === 'ready' || toGoal.status === 'in_progress')) {
        waiting.add(edge.to);
      }
    }
  }

  return Array.from(waiting);
}

/**
 * Find all tasks that can be parallelized (have no blocking dependencies between them).
 * Returns pairs of goal IDs that could run in parallel.
 */
export function findParallelizableTasks(goals: Goal[], edges: WorkDependencyEdge[]): [string, string][] {
  const pairs: [string, string][] = [];

  // For each pair of tasks in 'ready' status, check if they have any dependency
  const readyGoals = goals.filter((g) => g.status === 'ready' || g.status === 'in_progress');

  for (let i = 0; i < readyGoals.length; i++) {
    for (let j = i + 1; j < readyGoals.length; j++) {
      const a = readyGoals[i];
      const b = readyGoals[j];

      // Check if there's any blocking edge between them
      const hasEdge = edges.some(
        (e) => (e.kind === 'blocks' && ((e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id))),
      );

      if (!hasEdge) {
        pairs.push([a.id, b.id]);
      }
    }
  }

  return pairs;
}

/**
 * Estimate the impact of completing a task: how many downstream tasks would be unblocked?
 * Returns count of tasks that would transition from 'blocked' to 'ready' if this task completed.
 */
export function estimateCompletionImpact(goalId: string, goals: Goal[], edges: WorkDependencyEdge[]): number {
  let impact = 0;

  for (const edge of edges) {
    if (edge.from === goalId && edge.kind === 'blocks') {
      const toGoal = goals.find((g) => g.id === edge.to);
      if (toGoal && toGoal.status === 'blocked') {
        // Check if this is the ONLY blocker
        const otherBlockers = edges.filter(
          (e) => e.to === edge.to && e.kind === 'blocks' && e.from !== goalId,
        );
        const otherBlockerGoals = otherBlockers
          .map((e) => goals.find((g) => g.id === e.from))
          .filter((g) => g && g.status !== 'completed' && g.status !== 'cancelled');

        if (otherBlockerGoals.length === 0) {
          impact += 1;
        }
      }
    }
  }

  return impact;
}
