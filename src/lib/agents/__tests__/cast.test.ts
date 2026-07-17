// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: vi.fn(),
}));

import { autoCastToZao } from '@/lib/publish/auto-cast';
import { postTradeUpdate } from '../cast';

const castMock = autoCastToZao as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.clearAllMocks();
});

describe('postTradeUpdate — action labels', () => {
  it('maps buy_zabal to "bought ZABAL" in the narration text', async () => {
    castMock.mockResolvedValue('cast-hash-1');
    await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: 'details' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('bought ZABAL');
  });

  it('maps buy_sang to "bought SANG"', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'BANKER', action: 'buy_sang', details: 'x' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('bought SANG');
  });

  it('maps report to "weekly report"', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'DEALER', action: 'report', details: 'weekly' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('weekly report');
  });

  it('falls back to raw action string for unknown action', async () => {
    castMock.mockResolvedValue('hash');
    // @ts-expect-error — deliberate unknown action for coverage of fallback
    await postTradeUpdate({ agentName: 'VAULT', action: 'mystery_action', details: 'x' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('mystery_action');
  });
});

describe('postTradeUpdate — text formatting', () => {
  it('includes the agent name in brackets', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'BANKER', action: 'buy_zabal', details: 'test' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('[BANKER]');
  });

  it('includes the details in the text', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'VAULT', action: 'report', details: 'Bought 10 ZABAL at $0.50' });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('Bought 10 ZABAL at $0.50');
  });

  it('appends TX suffix when txHash is provided', async () => {
    castMock.mockResolvedValue('hash');
    const txHash = '0xabc123def456789012345678901234567890';
    await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: 'test', txHash });
    const [text] = castMock.mock.calls[0];
    expect(text).toContain('TX:');
    expect(text).toContain(txHash.slice(0, 18));
  });

  it('does not include TX suffix when txHash is absent', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: 'test' });
    const [text] = castMock.mock.calls[0];
    expect(text).not.toContain('TX:');
  });
});

describe('postTradeUpdate — embedUrl', () => {
  it('passes blockscout URL when txHash is provided', async () => {
    castMock.mockResolvedValue('hash');
    const txHash = '0xaabbccdd';
    await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: 'x', txHash });
    const [, embedUrl] = castMock.mock.calls[0];
    expect(embedUrl).toContain(txHash);
    expect(embedUrl).toContain('blockscout.com');
  });

  it('passes undefined embedUrl when txHash is absent', async () => {
    castMock.mockResolvedValue('hash');
    await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: 'x' });
    const [, embedUrl] = castMock.mock.calls[0];
    expect(embedUrl).toBeUndefined();
  });
});

describe('postTradeUpdate — return value', () => {
  it('returns the cast hash from autoCastToZao', async () => {
    castMock.mockResolvedValue('cast-xyz');
    const result = await postTradeUpdate({ agentName: 'VAULT', action: 'report', details: 'x' });
    expect(result).toBe('cast-xyz');
  });

  it('returns null when autoCastToZao returns null', async () => {
    castMock.mockResolvedValue(null);
    const result = await postTradeUpdate({ agentName: 'VAULT', action: 'report', details: 'x' });
    expect(result).toBeNull();
  });

  it('returns null and does not throw when autoCastToZao throws', async () => {
    castMock.mockRejectedValue(new Error('Neynar API down'));
    const result = await postTradeUpdate({ agentName: 'VAULT', action: 'report', details: 'x' });
    expect(result).toBeNull();
  });
});
