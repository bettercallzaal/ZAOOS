// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  AGENTS,
  EVENT_TYPES,
  deriveStatus,
  getAgent,
  getStatusDot,
} from '../constants';

// ---------------------------------------------------------------------------
// AGENTS constant
// ---------------------------------------------------------------------------

describe('AGENTS', () => {
  it('has exactly 7 agents', () => {
    expect(AGENTS).toHaveLength(7);
  });

  it('every agent has name, label, emoji, color, and role', () => {
    for (const agent of AGENTS) {
      expect(typeof agent.name).toBe('string');
      expect(typeof agent.label).toBe('string');
      expect(typeof agent.emoji).toBe('string');
      expect(typeof agent.color).toBe('string');
      expect(typeof agent.role).toBe('string');
    }
  });

  it('all agent names are unique', () => {
    const names = AGENTS.map((a) => a.name);
    expect(new Set(names).size).toBe(AGENTS.length);
  });

  it('includes zoe with role "Orchestrator"', () => {
    const zoe = AGENTS.find((a) => a.name === 'zoe');
    expect(zoe?.role).toBe('Orchestrator');
  });

  it('includes caster with role "Social"', () => {
    const caster = AGENTS.find((a) => a.name === 'caster');
    expect(caster?.role).toBe('Social');
  });
});

// ---------------------------------------------------------------------------
// EVENT_TYPES constant
// ---------------------------------------------------------------------------

describe('EVENT_TYPES', () => {
  it('has exactly 6 event types', () => {
    expect(Object.keys(EVENT_TYPES)).toHaveLength(6);
  });

  it('every event type has label, color, and icon', () => {
    for (const et of Object.values(EVENT_TYPES)) {
      expect(typeof et.label).toBe('string');
      expect(typeof et.color).toBe('string');
      expect(typeof et.icon).toBe('string');
    }
  });

  it('includes task_started with label "Started"', () => {
    expect(EVENT_TYPES.task_started.label).toBe('Started');
  });

  it('includes approval_needed with label "Needs Approval"', () => {
    expect(EVENT_TYPES.approval_needed.label).toBe('Needs Approval');
  });

  it('includes heartbeat event type', () => {
    expect('heartbeat' in EVENT_TYPES).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAgent
// ---------------------------------------------------------------------------

describe('getAgent', () => {
  it('returns the zoe agent by name', () => {
    const agent = getAgent('zoe');
    expect(agent?.name).toBe('zoe');
    expect(agent?.role).toBe('Orchestrator');
  });

  it('returns the builder agent by name', () => {
    expect(getAgent('builder')?.role).toBe('Code');
  });

  it('returns undefined for an unknown name', () => {
    expect(getAgent('unknown')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getAgent('')).toBeUndefined();
  });

  it('can retrieve every agent by its name', () => {
    for (const agent of AGENTS) {
      expect(getAgent(agent.name)?.name).toBe(agent.name);
    }
  });
});

// ---------------------------------------------------------------------------
// getStatusDot
// ---------------------------------------------------------------------------

describe('getStatusDot', () => {
  it('returns green dot for "active"', () => {
    expect(getStatusDot('active')).toBe('bg-green-500');
  });

  it('returns red dot for "error"', () => {
    expect(getStatusDot('error')).toBe('bg-red-500');
  });

  it('returns amber dot for "approval_needed"', () => {
    expect(getStatusDot('approval_needed')).toBe('bg-[#f5a623]');
  });

  it('returns gray dot for "idle" (default)', () => {
    expect(getStatusDot('idle')).toBe('bg-gray-500');
  });
});

// ---------------------------------------------------------------------------
// deriveStatus
// ---------------------------------------------------------------------------

describe('deriveStatus', () => {
  it('returns "idle" when lastEvent is null', () => {
    expect(deriveStatus(null)).toBe('idle');
  });

  it('returns "active" for task_started event', () => {
    const event = { event_type: 'task_started' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('active');
  });

  it('returns "error" for task_failed event', () => {
    const event = { event_type: 'task_failed' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('error');
  });

  it('returns "error" for blocked event', () => {
    const event = { event_type: 'blocked' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('error');
  });

  it('returns "approval_needed" for approval_needed event', () => {
    const event = { event_type: 'approval_needed' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('approval_needed');
  });

  it('returns "idle" for heartbeat event (default case)', () => {
    const event = { event_type: 'heartbeat' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('idle');
  });

  it('returns "idle" for task_completed event (default case)', () => {
    const event = { event_type: 'task_completed' } as Parameters<typeof deriveStatus>[0];
    expect(deriveStatus(event)).toBe('idle');
  });
});
