import { describe, it, assert, beforeEach, afterEach } from 'vitest';
import { findNewTeamComments, type BoardComment, type BoardTask } from '../task-teammate-ack';

function task(id: string, comments: BoardComment[]): BoardTask {
  return {
    id,
    legacy_id: null,
    title: 'Test Task',
    metadata: { comments },
  };
}

function comment(id: string, userId?: string, content?: string): BoardComment {
  return {
    id,
    userId,
    displayName: userId,
    content: content || 'test comment',
    createdAt: new Date().toISOString(),
  };
}

describe('task-teammate-ack', () => {
  describe('findNewTeamComments', () => {
    it('detects team member comments not yet seen', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'iman', 'Can you review?')])];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 1);
      assert.equal(pending[0].comment.userId, 'iman');
    });

    it('skips comments already seen', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'iman', 'Can you review?')])];
      const seen = new Set(['t1:c1']); // Already seen

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 0);
    });

    it('skips comments from Zaal', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'zaal', 'My comment')])];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 0);
    });

    it('skips comments from ZOE', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'zoe', 'Noted - looping Zaal in.')])];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 0);
    });

    it('skips comments from non-team members', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'unknown', 'Random person')])];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 0);
    });

    it('handles case-insensitive team member matching', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [task('t1', [comment('c1', 'IMAN', 'Question?')])];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 1);
    });

    it('processes multiple tasks and comments', () => {
      const teamMembers = new Set(['iman', 'jose']);
      const tasks = [
        task('t1', [
          comment('c1', 'iman', 'Q1?'),
          comment('c2', 'zaal', 'A1'),
          comment('c3', 'jose', 'Q2?'),
        ]),
        task('t2', [comment('c4', 'iman', 'Q3?')]),
      ];
      const seen = new Set<string>();

      const pending = findNewTeamComments(tasks, teamMembers, seen);

      assert.equal(pending.length, 3); // c1, c3, c4
    });
  });
});
