import { describe, it, expect, vi } from 'vitest';
import {
  detectDelegationIntent,
  formatDelegationAck,
  dispatchDelegatedTask,
} from '../agent-delegation';
import type { WorkItem } from '../work-loop';

describe('agent-delegation: detectDelegationIntent', () => {
  it('detects investigation tasks', () => {
    const r1 = detectDelegationIntent('look into sound gear in Ellsworth');
    expect(r1.isDelegated).toBe(true);
    expect(r1.cleanTask).toBe('sound gear in Ellsworth');
    expect(r1.kind).toBe('investigation');

    const r2 = detectDelegationIntent('please investigate lodging options in Bangor');
    expect(r2.isDelegated).toBe(true);
    expect(r2.cleanTask).toBe('lodging options in Bangor');
    expect(r2.kind).toBe('investigation');

    const r3 = detectDelegationIntent('dig into the latest PRs on ZAO OS');
    expect(r3.isDelegated).toBe(true);
    expect(r3.cleanTask).toBe('the latest PRs on ZAO OS');
    expect(r3.kind).toBe('investigation');
  });

  it('detects research tasks', () => {
    const r1 = detectDelegationIntent('research ticket tiers for ZAOstock 2026');
    expect(r1.isDelegated).toBe(true);
    expect(r1.cleanTask).toBe('ticket tiers for ZAOstock 2026');
    expect(r1.kind).toBe('research');

    const r2 = detectDelegationIntent('please find out who holds the commercial permit');
    expect(r2.isDelegated).toBe(true);
    expect(r2.cleanTask).toBe('who holds the commercial permit');
    expect(r2.kind).toBe('research');
  });

  it('detects brief/doc preparation tasks', () => {
    const r1 = detectDelegationIntent('draft a brief on festival sound engineers');
    expect(r1.isDelegated).toBe(true);
    expect(r1.cleanTask).toBe('festival sound engineers');
    expect(r1.kind).toBe('brief');

    const r2 = detectDelegationIntent('write a doc on stage lighting safety regulations');
    expect(r2.isDelegated).toBe(true);
    expect(r2.cleanTask).toBe('stage lighting safety regulations');
    expect(r2.kind).toBe('brief');
  });

  it('rejects slash commands', () => {
    expect(detectDelegationIntent('/companion').isDelegated).toBe(false);
    expect(detectDelegationIntent('/lanes').isDelegated).toBe(false);
    expect(detectDelegationIntent('/tasks').isDelegated).toBe(false);
  });

  it('rejects commands with existing reserved prefixes', () => {
    expect(detectDelegationIntent('queue: research topic').isDelegated).toBe(false);
    expect(detectDelegationIntent('plan: goal description').isDelegated).toBe(false);
    expect(detectDelegationIntent('note: remember this').isDelegated).toBe(false);
    expect(detectDelegationIntent('claude: check this').isDelegated).toBe(false);
  });

  it('rejects short chat greetings and direct questions', () => {
    expect(detectDelegationIntent('hi').isDelegated).toBe(false);
    expect(detectDelegationIntent('good morning zoe').isDelegated).toBe(false);
    expect(detectDelegationIntent('what time is it right now?').isDelegated).toBe(false);
    expect(detectDelegationIntent('who is scheduled to perform?').isDelegated).toBe(false);
    expect(detectDelegationIntent('where is the venue located?').isDelegated).toBe(false);
    expect(detectDelegationIntent('why did that last job fail?').isDelegated).toBe(false);
  });
});

describe('agent-delegation: formatDelegationAck', () => {
  const sampleItem: WorkItem = {
    id: 'agt-test123',
    kind: 'research',
    input: 'sound gear options in Ellsworth',
    addedTs: '2026-09-15T18:00:00.000Z',
  };

  it('formats confirmation with task ID and clean description', () => {
    const ack = formatDelegationAck(sampleItem, 'investigation');
    expect(ack).toContain('Investigation delegated to autonomous agent');
    expect(ack).toContain('sound gear options in Ellsworth');
    expect(ack).toContain('(ID: agt-test123)');
    expect(ack).toContain('Results will report back with verified artifacts.');
  });

  it('strictly adheres to house style: zero emojis and zero em dashes', () => {
    const ack = formatDelegationAck(sampleItem, 'investigation');
    expect(ack).not.toContain('\u2014');
    expect(ack).not.toContain('\u2013');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(ack)).toBe(false);
  });
});

describe('agent-delegation: dispatchDelegatedTask', () => {
  it('enqueues work, sends ack, and triggers work tick', async () => {
    const sentMessages: string[] = [];
    const mockSendAck = vi.fn(async (msg: string) => {
      sentMessages.push(msg);
    });

    const item = await dispatchDelegatedTask('sound gear in Ellsworth', 'investigation', {
      sendAck: mockSendAck,
      workDeps: {
        sendToZaal: vi.fn().mockResolvedValue(undefined),
        sendToChat: vi.fn().mockResolvedValue(undefined),
        zaalTgId: 12345,
        repoDir: '/tmp',
        currentDate: '2026-09-15',
      },
    });

    expect(item.input).toBe('Investigate sound gear in Ellsworth');
    expect(mockSendAck).toHaveBeenCalledTimes(1);
    expect(sentMessages[0]).toContain('Investigation delegated to autonomous agent');
  });
});