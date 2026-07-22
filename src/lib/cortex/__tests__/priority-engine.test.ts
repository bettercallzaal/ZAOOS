import { describe, it, expect } from 'vitest';
import { scoreGoalPriority, rankGoalsByPriority, explainRanking } from '../priority-engine';
import type { Goal, WorkDependencyEdge } from '../types';

const now = new Date().toISOString();

describe('Priority Engine', () => {
  describe('scoreGoalPriority', () => {
    it('scores a simple in-progress goal high', () => {
      const goals: Goal[] = [
        {
          id: 'task-1',
          kind: 'task',
          parentId: null,
          title: 'Write cortex',
          status: 'in_progress',
          percentComplete: 50,
          confidence: 0.8,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const score = scoreGoalPriority(goals[0], goals, []);
      expect(score.total).toBeGreaterThan(0.5);
      expect(score.confidence).toBeGreaterThan(0.5);
    });

    it('scores a completed goal as 0 urgency', () => {
      const goals: Goal[] = [
        {
          id: 'task-1',
          kind: 'task',
          parentId: null,
          title: 'Done task',
          status: 'completed',
          percentComplete: 100,
          confidence: 1,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const score = scoreGoalPriority(goals[0], goals, []);
      expect(score.urgency).toBe(0);
    });

    it('boosts score when task blocks others', () => {
      const goals: Goal[] = [
        {
          id: 'blocker',
          kind: 'task',
          parentId: null,
          title: 'Deploy to prod',
          status: 'ready',
          percentComplete: 0,
          confidence: 0.9,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'waiting',
          kind: 'task',
          parentId: null,
          title: 'Monitor prod',
          status: 'blocked',
          percentComplete: 0,
          confidence: 0.9,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const edges: WorkDependencyEdge[] = [
        { from: 'blocker', to: 'waiting', kind: 'blocks' },
      ];

      const score = scoreGoalPriority(goals[0], goals, edges);
      expect(score.blockingOthers).toBeGreaterThan(0.5);
    });

    it('respects human urgency signals', () => {
      const goal: Goal = {
        id: 'task-1',
        kind: 'task',
        parentId: null,
        title: 'Critical fix',
        status: 'backlog',
        percentComplete: 0,
        confidence: 0.5,
        createdAt: now,
        updatedAt: now,
        notes: 'URGENT - do this today or the system breaks.',
      };

      const score = scoreGoalPriority(goal, [goal], []);
      expect(score.humanSignal).toBeGreaterThan(0.8);
    });

    it('gives low score to backlog with low confidence', () => {
      const goal: Goal = {
        id: 'task-1',
        kind: 'task',
        parentId: null,
        title: 'Vague task',
        status: 'backlog',
        percentComplete: 0,
        confidence: 0.2,
        createdAt: now,
        updatedAt: now,
      };

      const score = scoreGoalPriority(goal, [goal], []);
      expect(score.total).toBeLessThan(0.4);
    });
  });

  describe('rankGoalsByPriority', () => {
    it('ranks multiple goals by score', () => {
      const goals: Goal[] = [
        {
          id: 'low-priority',
          kind: 'task',
          parentId: null,
          title: 'Nice to have',
          status: 'backlog',
          percentComplete: 0,
          confidence: 0.3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'high-priority',
          kind: 'task',
          parentId: null,
          title: 'Critical',
          status: 'in_progress',
          percentComplete: 50,
          confidence: 0.9,
          createdAt: now,
          updatedAt: now,
          notes: 'URGENT',
        },
      ];

      const ranked = rankGoalsByPriority(goals, []);
      expect(ranked[0].goalId).toBe('high-priority');
      expect(ranked[1].goalId).toBe('low-priority');
      expect(ranked[0].score.total).toBeGreaterThan(ranked[1].score.total);
    });

    it('returns empty list for no goals', () => {
      const ranked = rankGoalsByPriority([], []);
      expect(ranked).toEqual([]);
    });
  });

  describe('explainRanking', () => {
    it('generates a readable explanation of ranking', () => {
      const scoreA = {
        goalAlignment: 0.9,
        blockingOthers: 0.6,
        urgency: 0.8,
        contextQuality: 0.7,
        humanSignal: 0.5,
        total: 0.74,
        reasoning: 'High priority task',
        confidence: 0.8,
      };

      const scoreB = {
        goalAlignment: 0.3,
        blockingOthers: 0.1,
        urgency: 0.2,
        contextQuality: 0.4,
        humanSignal: 0,
        total: 0.2,
        reasoning: 'Low priority task',
        confidence: 0.5,
      };

      const explanation = explainRanking(scoreA, scoreB, 'Task A', 'Task B');
      expect(explanation).toContain('Task A');
      expect(explanation).toContain('Task B');
      expect(explanation).toContain('%');
    });

    it('detects when tasks are nearly equal', () => {
      const scoreA = {
        goalAlignment: 0.5,
        blockingOthers: 0.5,
        urgency: 0.5,
        contextQuality: 0.5,
        humanSignal: 0.5,
        total: 0.5,
        reasoning: '',
        confidence: 0.5,
      };

      const scoreB = { ...scoreA, total: 0.51 };

      const explanation = explainRanking(scoreA, scoreB, 'Task A', 'Task B');
      expect(explanation).toContain('nearly equal');
    });
  });
});
