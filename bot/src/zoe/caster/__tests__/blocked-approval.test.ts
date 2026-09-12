import { describe, it, expect, vi } from 'vitest';

vi.mock('../reason', () => ({
  draftCast: vi.fn(async () => ({ text: 'a drafted cast', model: 'test-model' })),
}));
vi.mock('../../safety/klearu', () => ({
  checkCast: vi.fn(async () => ({ safe: true, label: 'ok', reason: '' })),
}));
vi.mock('../../farcaster/write', () => ({ publishCast: vi.fn() }));
vi.mock('../../exec/ffx', () => ({ ffxAvailable: () => false, executeActionOnFfx: vi.fn() }));

import { runCasterPipeline } from '../index';

const trigger = { agentId: 'zol', persona: 'p', context: 'someone cast something' };

function botWith(send: () => Promise<unknown>) {
  return { api: { sendMessage: vi.fn(send) } } as never;
}

describe('runCasterPipeline when the approval card is blocked by the send budget', () => {
  it('reports undelivered instead of awaiting_approval', async () => {
    const result = await runCasterPipeline(
      botWith(async () => ({ message_id: 0, zoeSendBudget: 'dropped' })),
      1,
      trigger,
    );
    expect(result.status).toBe('undelivered');
    expect(result.id).toBeUndefined(); // nothing left pending for a card nobody saw
  });

  it('still awaits approval when the card is delivered', async () => {
    const result = await runCasterPipeline(botWith(async () => ({ message_id: 12 })), 1, trigger);
    expect(result.status).toBe('awaiting_approval');
    expect(result.id).toBeTruthy();
  });
});
