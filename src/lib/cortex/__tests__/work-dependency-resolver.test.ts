import { describe, it, expect } from 'vitest';
import {
  buildTaskDAG,
  findBlockedTasks,
  findWaitingForApproval,
  findParallelizableTasks,
  estimateCompletionImpact,
} from '../work-dependency-resolver';
import type { Goal, WorkDependencyEdge } from '../types';

const now = new Date().toISOString();

describe('Work Dependency Resolver', () => {
  describe('buildTaskDAG', () => {
    it('returns empty dag for no goals', () => {
      const dag = buildTaskDAG([], []);
      expect(dag.nodes).toEqual([]);
      expect(dag.edges).toEqual([]);
      expect(dag.topologicalOrder).toEqual([]);
      expect(dag.cycles).toEqual([]);
    });

    it('builds a valid topological order for a simple chain', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'completed', percentComplete: 100, confidence: 1, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'c', kind: 'task', parentId: null, title: 'C', status: 'backlog', percentComplete: 0, confidence: 0.5, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [
        { from: 'a', to: 'b', kind: 'blocks' },
        { from: 'b', to: 'c', kind: 'blocks' },
      ];

      const dag = buildTaskDAG(goals, edges);
      expect(dag.topologicalOrder).toEqual(['a', 'b', 'c']);
      expect(dag.cycles).toEqual([]);
    });

    it('detects cycles', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [
        { from: 'a', to: 'b', kind: 'blocks' },
        { from: 'b', to: 'a', kind: 'blocks' },
      ];

      const dag = buildTaskDAG(goals, edges);
      expect(dag.cycles.length).toBeGreaterThan(0);
      expect(dag.topologicalOrder).toEqual([]);
    });

    it('computes critical path correctly', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'completed', percentComplete: 100, confidence: 1, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'c', kind: 'task', parentId: null, title: 'C', status: 'backlog', percentComplete: 0, confidence: 0.5, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [
        { from: 'a', to: 'b', kind: 'blocks' },
        { from: 'b', to: 'c', kind: 'blocks' },
      ];

      const dag = buildTaskDAG(goals, edges);
      expect(dag.criticalPath).toEqual(['a', 'b', 'c']);
      expect(dag.criticalPathDays).toBe(3);
    });
  });

  describe('findBlockedTasks', () => {
    it('finds tasks blocked by incomplete dependencies', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'backlog', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'blocked', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [{ from: 'a', to: 'b', kind: 'blocks' }];

      const blocked = findBlockedTasks(goals, edges);
      expect(blocked).toContain('b');
    });

    it('returns empty list if no tasks are blocked', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'completed', percentComplete: 100, confidence: 1, createdAt: now, updatedAt: now },
      ];

      const blocked = findBlockedTasks(goals, []);
      expect(blocked).toEqual([]);
    });
  });

  describe('findWaitingForApproval', () => {
    it('finds tasks with approval edges', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [{ from: 'zaal', to: 'a', kind: 'approval' }];

      const waiting = findWaitingForApproval(goals, edges);
      expect(waiting).toContain('a');
    });
  });

  describe('findParallelizableTasks', () => {
    it('finds independent ready tasks', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [];

      const pairs = findParallelizableTasks(goals, edges);
      expect(pairs).toContainEqual(['a', 'b']);
    });

    it('does not pair tasks with blocking dependencies', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [{ from: 'a', to: 'b', kind: 'blocks' }];

      const pairs = findParallelizableTasks(goals, edges);
      expect(pairs).toEqual([]);
    });
  });

  describe('estimateCompletionImpact', () => {
    it('counts unblocked downstream tasks', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'completed', percentComplete: 100, confidence: 1, createdAt: now, updatedAt: now },
        { id: 'b', kind: 'task', parentId: null, title: 'B', status: 'blocked', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
        { id: 'c', kind: 'task', parentId: null, title: 'C', status: 'blocked', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const edges: WorkDependencyEdge[] = [
        { from: 'a', to: 'b', kind: 'blocks' },
        { from: 'a', to: 'c', kind: 'blocks' },
      ];

      const impact = estimateCompletionImpact('a', goals, edges);
      expect(impact).toBe(2);
    });

    it('returns 0 for no impact', () => {
      const goals: Goal[] = [
        { id: 'a', kind: 'task', parentId: null, title: 'A', status: 'ready', percentComplete: 0, confidence: 0.9, createdAt: now, updatedAt: now },
      ];

      const impact = estimateCompletionImpact('a', goals, []);
      expect(impact).toBe(0);
    });
  });
});
