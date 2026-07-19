import { describe, expect, it } from 'vitest';
import {
  buildAssignmentEnvelope,
  getApprovalClass,
  isTerminal,
  nextRunStatus,
  type RunStatus,
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
  it('should transition from created to ready on mark_ready', () => {
    expect(nextRunStatus('created', 'mark_ready')).toBe('ready');
  });

  it('should transition from ready to leased on lease_granted', () => {
    expect(nextRunStatus('ready', 'lease_granted')).toBe('leased');
  });

  it('should transition from leased to running on execute_start', () => {
    expect(nextRunStatus('leased', 'execute_start')).toBe('running');
  });

  it('should transition from running to waiting_approval on approval_needed', () => {
    expect(nextRunStatus('running', 'approval_needed')).toBe('waiting_approval');
  });

  it('should transition from running to verifying on execute_success', () => {
    expect(nextRunStatus('running', 'execute_success')).toBe('verifying');
  });

  it('should transition from verifying to completed on verify_complete', () => {
    expect(nextRunStatus('verifying', 'verify_complete')).toBe('completed');
  });

  it('should reject illegal transition from completed to running', () => {
    expect(() => {
      nextRunStatus('completed', 'execute_start');
    }).toThrow('Illegal transition');
  });

  it('should reject illegal transition from cancelled to running', () => {
    expect(() => {
      nextRunStatus('cancelled', 'execute_start');
    }).toThrow('Illegal transition');
  });

  it('should allow cancel from any non-terminal state', () => {
    const states: RunStatus[] = [
      'created',
      'ready',
      'leased',
      'running',
      'waiting_approval',
      'blocked',
      'verifying',
      'recovering',
      'failed',
      'quarantined',
    ];

    states.forEach((state) => {
      expect(nextRunStatus(state, 'cancel_request')).toBe('cancelled');
    });
  });

  it('should reject cancel from terminal states', () => {
    const terminals: Array<'completed' | 'cancelled'> = ['completed', 'cancelled'];
    terminals.forEach((state) => {
      expect(() => {
        nextRunStatus(state, 'cancel_request');
      }).toThrow('Illegal transition');
    });
  });

  it('should handle user approval flow (approve resumes running, then verifies)', () => {
    let status = nextRunStatus('waiting_approval', 'user_approve');
    expect(status).toBe('running');

    status = nextRunStatus(status, 'execute_success');
    expect(status).toBe('verifying');

    status = nextRunStatus(status, 'verify_complete');
    expect(status).toBe('completed');
  });

  it('should handle user rejection flow', () => {
    expect(nextRunStatus('waiting_approval', 'user_reject')).toBe('failed');
  });

  it('should handle execution failure at any point', () => {
    expect(nextRunStatus('running', 'execute_failure')).toBe('failed');
    expect(nextRunStatus('blocked', 'execute_failure')).toBe('failed');
    expect(nextRunStatus('recovering', 'execute_failure')).toBe('failed');
  });

  it('should route a stale lease into recovery and reassign', () => {
    expect(nextRunStatus('running', 'lease_expired')).toBe('recovering');
    expect(nextRunStatus('recovering', 'recover_reassign')).toBe('ready');
  });

  it('should allow an approved failed run to retry into recovery', () => {
    expect(nextRunStatus('failed', 'retry_approved')).toBe('recovering');
  });

  it('should quarantine from recovery and release back to ready', () => {
    expect(nextRunStatus('recovering', 'quarantine')).toBe('quarantined');
    expect(nextRunStatus('quarantined', 'release')).toBe('ready');
  });

  it('should handle a block/unblock cycle', () => {
    expect(nextRunStatus('running', 'blocked')).toBe('blocked');
    expect(nextRunStatus('blocked', 'unblocked')).toBe('running');
  });
});

describe('control-plane: isTerminal', () => {
  it('should identify completed as terminal', () => {
    expect(isTerminal('completed')).toBe(true);
  });

  it('should identify cancelled as terminal', () => {
    expect(isTerminal('cancelled')).toBe(true);
  });

  it('should identify failed as non-terminal (retryable)', () => {
    expect(isTerminal('failed')).toBe(false);
  });

  it('should identify quarantined as non-terminal (releasable)', () => {
    expect(isTerminal('quarantined')).toBe(false);
  });

  it('should identify created as non-terminal', () => {
    expect(isTerminal('created')).toBe(false);
  });

  it('should identify leased as non-terminal', () => {
    expect(isTerminal('leased')).toBe(false);
  });

  it('should identify running as non-terminal', () => {
    expect(isTerminal('running')).toBe(false);
  });

  it('should identify recovering as non-terminal', () => {
    expect(isTerminal('recovering')).toBe(false);
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
