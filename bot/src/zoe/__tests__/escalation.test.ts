import { describe, it, expect } from 'vitest';
import { planEscalations, ESCALATION_WINDOW_MS, type CriticalPing } from '../escalation';

const NOW = Date.parse('2026-07-07T12:00:00Z');
function ping(over: Partial<CriticalPing> = {}): CriticalPing {
  return { id: 'p1', text: 'P0: do the thing', chatId: 1, sentAt: new Date(NOW - ESCALATION_WINDOW_MS - 60_000).toISOString(), resent: false, ...over };
}

describe('planEscalations', () => {
  it('escalates a critical ping past the window with no reply since', () => {
    const out = planEscalations([ping()], null, NOW);
    expect(out).toHaveLength(1);
  });

  it('does NOT escalate before the window has elapsed', () => {
    const fresh = ping({ sentAt: new Date(NOW - 60_000).toISOString() });
    expect(planEscalations([fresh], null, NOW)).toHaveLength(0);
  });

  it('does NOT escalate if Zaal replied after the ping was sent (acked)', () => {
    const p = ping(); // sent ~46 min ago
    const replyAfter = new Date(NOW - 5 * 60_000).toISOString(); // 5 min ago, after the ping
    expect(planEscalations([p], replyAfter, NOW)).toHaveLength(0);
  });

  it('DOES escalate if Zaal only replied BEFORE the ping', () => {
    const p = ping();
    const replyBefore = new Date(NOW - ESCALATION_WINDOW_MS - 120_000).toISOString(); // before the ping
    expect(planEscalations([p], replyBefore, NOW)).toHaveLength(1);
  });

  it('does NOT re-escalate an already-resent ping', () => {
    expect(planEscalations([ping({ resent: true })], null, NOW)).toHaveLength(0);
  });

  it('handles a mix - only the eligible ones come back', () => {
    const pings: CriticalPing[] = [
      ping({ id: 'due' }), // eligible
      ping({ id: 'fresh', sentAt: new Date(NOW - 60_000).toISOString() }), // too new
      ping({ id: 'sent', resent: true }), // already resent
    ];
    const out = planEscalations(pings, null, NOW).map((p) => p.id);
    expect(out).toEqual(['due']);
  });
});
