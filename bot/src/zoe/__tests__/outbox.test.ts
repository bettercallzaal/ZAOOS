import { describe, expect, it } from 'vitest';
import { outboxChannelFor, outboxLine } from '../outbox';

describe('outboxChannelFor', () => {
  it('maps -cast kinds to the cast channel', () => {
    expect(outboxChannelFor('zol-cast')).toBe('cast');
    expect(outboxChannelFor('farcaster-cast')).toBe('cast');
    expect(outboxChannelFor('wavewarz-cast')).toBe('cast');
    expect(outboxChannelFor('zabal-cast')).toBe('cast');
  });

  it('maps newsletter to the newsletter channel', () => {
    expect(outboxChannelFor('newsletter')).toBe('newsletter');
  });

  it('returns null for non-outbox kinds', () => {
    expect(outboxChannelFor('proactive-post')).toBeNull();
    expect(outboxChannelFor('demo')).toBeNull();
  });
});

describe('outboxLine', () => {
  it('produces a parseable JSONL entry marked unsent', () => {
    const line = outboxLine('zol-cast', 'gm from ZOL', 1_700_000_000_000);
    const parsed = JSON.parse(line);
    expect(parsed).toEqual({
      kind: 'zol-cast',
      text: 'gm from ZOL',
      approvedAt: new Date(1_700_000_000_000).toISOString(),
      sent: false,
    });
  });
});
