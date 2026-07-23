import { describe, it, expect } from 'vitest';
import {
  isInstanceExpired,
  deadInstanceIds,
  runsLeasedToDeadInstances,
  DEFAULT_LIVENESS_TTL_MS,
} from '../liveness';
import type { AgentInstanceRow, AgentRunRow, RunStatus } from '../types';

const T0 = '2026-07-23T12:00:00.000Z';
const now = (offsetMs: number) => new Date(new Date(T0).getTime() + offsetMs);

function inst(over: Partial<AgentInstanceRow> = {}): AgentInstanceRow {
  return {
    instance_id: 'inst-1',
    hostname: 'box',
    pid: 100,
    status: 'alive',
    started_at: T0,
    last_heartbeat: T0,
    metadata: null,
    ...over,
  };
}

function run(over: Partial<AgentRunRow> = {}): AgentRunRow {
  return {
    id: 'run-1',
    task_id: null,
    assignment_id: 'a1',
    objective: 'x',
    required_capabilities: [],
    status: 'leased',
    assigned_agent: 'inst-1',
    lease_owner: 'inst-1',
    lease_expires_at: '2026-07-23T12:05:00.000Z',
    retries: 0,
    budget: null,
    approval_state: 'auto',
    visibility: 'private',
    idempotency_key: 'k1',
    created_by: 'zoe',
    created_at: T0,
    updated_at: T0,
    ...over,
  };
}

describe('isInstanceExpired', () => {
  it('is alive within the TTL', () => {
    expect(isInstanceExpired(inst({ last_heartbeat: T0 }), now(DEFAULT_LIVENESS_TTL_MS - 1))).toBe(false);
  });
  it('is expired once the TTL elapses', () => {
    expect(isInstanceExpired(inst({ last_heartbeat: T0 }), now(DEFAULT_LIVENESS_TTL_MS + 1))).toBe(true);
  });
  it('a dead instance is always expired regardless of heartbeat', () => {
    expect(isInstanceExpired(inst({ status: 'dead', last_heartbeat: T0 }), now(0))).toBe(true);
  });
  it('a draining instance is still live until its heartbeat goes stale', () => {
    expect(isInstanceExpired(inst({ status: 'draining', last_heartbeat: T0 }), now(1000))).toBe(false);
    expect(isInstanceExpired(inst({ status: 'draining', last_heartbeat: T0 }), now(DEFAULT_LIVENESS_TTL_MS + 1))).toBe(true);
  });
  it('honors a custom ttl', () => {
    expect(isInstanceExpired(inst({ last_heartbeat: T0 }), now(5000), 4000)).toBe(true);
    expect(isInstanceExpired(inst({ last_heartbeat: T0 }), now(3000), 4000)).toBe(false);
  });
  it('accepts string or Date for now', () => {
    expect(isInstanceExpired(inst({ last_heartbeat: T0 }), '2026-07-23T12:10:00.000Z')).toBe(true);
  });
});

describe('deadInstanceIds', () => {
  it('returns only the stale instances', () => {
    const instances = [
      inst({ instance_id: 'a', last_heartbeat: T0 }), // stale by now+TTL+1
      inst({ instance_id: 'b', last_heartbeat: new Date(now(DEFAULT_LIVENESS_TTL_MS).getTime()).toISOString() }), // fresh
      inst({ instance_id: 'c', status: 'dead', last_heartbeat: T0 }), // dead
    ];
    const ids = deadInstanceIds(instances, now(DEFAULT_LIVENESS_TTL_MS + 1));
    expect(ids).toContain('a');
    expect(ids).toContain('c');
    expect(ids).not.toContain('b');
  });
  it('empty when all fresh', () => {
    expect(deadInstanceIds([inst({ last_heartbeat: T0 })], now(1000))).toEqual([]);
  });
});

describe('runsLeasedToDeadInstances', () => {
  it('selects leased/running runs owned by a dead instance', () => {
    const runs = [
      run({ id: 'r1', lease_owner: 'dead-1', status: 'leased' }),
      run({ id: 'r2', lease_owner: 'dead-1', status: 'running' }),
      run({ id: 'r3', lease_owner: 'live-1', status: 'leased' }), // live owner
      run({ id: 'r4', lease_owner: 'dead-1', status: 'completed' }), // terminal
      run({ id: 'r5', lease_owner: null, status: 'ready' }), // unowned
    ];
    const picked = runsLeasedToDeadInstances(runs, ['dead-1']).map((r) => r.id);
    expect(picked).toEqual(['r1', 'r2']);
  });
  it('never reclaims a terminal or waiting run even if the owner is dead', () => {
    const terminal: RunStatus[] = ['completed', 'failed', 'cancelled', 'quarantined', 'waiting_approval', 'verifying', 'blocked'];
    for (const status of terminal) {
      expect(runsLeasedToDeadInstances([run({ lease_owner: 'dead', status })], ['dead'])).toEqual([]);
    }
  });
  it('empty when no dead instances', () => {
    expect(runsLeasedToDeadInstances([run({ lease_owner: 'x' })], [])).toEqual([]);
  });
  it('does not reclaim a run whose owner is alive', () => {
    expect(runsLeasedToDeadInstances([run({ lease_owner: 'alive' })], ['dead'])).toEqual([]);
  });
});
