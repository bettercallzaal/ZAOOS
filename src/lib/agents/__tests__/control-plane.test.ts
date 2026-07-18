import { describe, expect, it } from 'vitest';
import {
  buildAssignmentEnvelope,
  getApprovalClass,
  isTerminal,
  nextRunStatus,
} from '../control-plane';

describe('control-plane: buildAssignmentEnvelope', () => {
  it('should build a minimal envelope with defaults', () => {
    const result = buildAssignmentEnvelope({
      assignmentId: 'assign-123',
      projectId: 'proj-456',
      requestedBy: 'zaal',
      objective: 'Post a cast about ZAO',
      idempotencyKey: 'idem-789',
    });

    expect(result).toEqual({
      assignmentId: 'assign-123',
      projectId: 'proj-456',
      taskId: null,
      requestedBy: 'zaal',
      objective: 'Post a cast about ZAO',
      requiredCapabilities: [],
      contextReferences: [],
      approvalPolicy: 'auto',
      visibility: 'team',
      budget: undefined,
      idempotencyKey: 'idem-789',
    });
  });

  it('should preserve supplied fields', () => {
    const result = buildAssignmentEnvelope({
      assignmentId: 'assign-123',
      projectId: 'proj-456',
      taskId: 'task-111',
      requestedBy: 'zaal',
      objective: 'Complex task',
      requiredCapabilities: ['read_farcaster', 'post_x'],
      contextReferences: [
        { type: 'doc', value: '1410-architecture' },
        { type: 'url', value: 'https://example.com' },
      ],
      approvalPolicy: 'external_spend',
      visibility: 'public',
      budget: {
        externalSpendLimit: 100,
        deadline: '2026-07-20T10:00:00Z',
      },
      idempotencyKey: 'idem-789',
    });

    expect(result.taskId).toBe('task-111');
    expect(result.requiredCapabilities).toEqual(['read_farcaster', 'post_x']);
    expect(result.approvalPolicy).toBe('external_spend');
    expect(result.visibility).toBe('public');
    expect(result.budget?.externalSpendLimit).toBe(100);
    expect(result.contextReferences.length).toBe(2);
  });

  it('should handle null taskId', () => {
    const result = buildAssignmentEnvelope({
      assignmentId: 'assign-123',
      projectId: 'proj-456',
      taskId: null,
      requestedBy: 'zaal',
      objective: 'Task without board link',
      idempotencyKey: 'idem-789',
    });

    expect(result.taskId).toBeNull();
  });
});

describe('control-plane: nextRunStatus', () => {
  it('should transition from queued to routing on route_complete', () => {
    const next = nextRunStatus('queued', 'route_complete');
    expect(next).toBe('routing');
  });

  it('should transition from routing to running on execute_start', () => {
    const next = nextRunStatus('routing', 'execute_start');
    expect(next).toBe('running');
  });

  it('should transition from running to awaiting_approval on approval_needed', () => {
    const next = nextRunStatus('running', 'approval_needed');
    expect(next).toBe('awaiting_approval');
  });

  it('should transition from running to verifying on execute_success', () => {
    const next = nextRunStatus('running', 'execute_success');
    expect(next).toBe('verifying');
  });

  it('should transition from verifying to done on verify_complete', () => {
    const next = nextRunStatus('verifying', 'verify_complete');
    expect(next).toBe('done');
  });

  it('should reject illegal transition from done to running', () => {
    expect(() => {
      nextRunStatus('done', 'execute_start');
    }).toThrow('Illegal transition');
  });

  it('should reject illegal transition from failed to running', () => {
    expect(() => {
      nextRunStatus('failed', 'execute_start');
    }).toThrow('Illegal transition');
  });

  it('should allow cancel from any non-terminal state', () => {
    const states: Array<'queued' | 'routing' | 'running' | 'awaiting_approval' | 'verifying'> = [
      'queued',
      'routing',
      'running',
      'awaiting_approval',
      'verifying',
    ];

    states.forEach((state) => {
      const next = nextRunStatus(state, 'cancel_request');
      expect(next).toBe('cancelled');
    });
  });

  it('should reject cancel from terminal states', () => {
    const terminals: Array<'done' | 'failed' | 'cancelled'> = ['done', 'failed', 'cancelled'];
    terminals.forEach((state) => {
      expect(() => {
        nextRunStatus(state, 'cancel_request');
      }).toThrow('Illegal transition');
    });
  });

  it('should handle user approval flow', () => {
    let status = nextRunStatus('awaiting_approval', 'user_approve');
    expect(status).toBe('verifying');

    status = nextRunStatus(status, 'verify_complete');
    expect(status).toBe('done');
  });

  it('should handle user rejection flow', () => {
    const status = nextRunStatus('awaiting_approval', 'user_reject');
    expect(status).toBe('failed');
  });

  it('should handle execution failure at any point', () => {
    expect(nextRunStatus('routing', 'execute_failure')).toBe('failed');
    expect(nextRunStatus('running', 'execute_failure')).toBe('failed');
    expect(nextRunStatus('verifying', 'execute_failure')).toBe('failed');
  });
});

describe('control-plane: isTerminal', () => {
  it('should identify done as terminal', () => {
    expect(isTerminal('done')).toBe(true);
  });

  it('should identify failed as terminal', () => {
    expect(isTerminal('failed')).toBe(true);
  });

  it('should identify cancelled as terminal', () => {
    expect(isTerminal('cancelled')).toBe(true);
  });

  it('should identify queued as non-terminal', () => {
    expect(isTerminal('queued')).toBe(false);
  });

  it('should identify routing as non-terminal', () => {
    expect(isTerminal('routing')).toBe(false);
  });

  it('should identify running as non-terminal', () => {
    expect(isTerminal('running')).toBe(false);
  });

  it('should identify awaiting_approval as non-terminal', () => {
    expect(isTerminal('awaiting_approval')).toBe(false);
  });

  it('should identify verifying as non-terminal', () => {
    expect(isTerminal('verifying')).toBe(false);
  });
});

describe('control-plane: getApprovalClass', () => {
  it('should map auto to auto', () => {
    expect(getApprovalClass('auto')).toBe('auto');
  });

  it('should map user_confirm to user_confirm', () => {
    expect(getApprovalClass('user_confirm')).toBe('user_confirm');
  });

  it('should map external_spend to external_spend', () => {
    expect(getApprovalClass('external_spend')).toBe('external_spend');
  });

  it('should map on_chain to on_chain', () => {
    expect(getApprovalClass('on_chain')).toBe('on_chain');
  });
});
