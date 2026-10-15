import { describe, expect, it } from 'vitest';
import { neynarCastToCast } from '../cast-mapper';

describe('neynarCastToCast', () => {
  it('maps a full Neynar cast', () => {
    const cast = neynarCastToCast({
      hash: '0x1',
      author: { fid: 3, username: 'u', display_name: 'U', pfp_url: 'p' },
      text: 'hi',
      timestamp: 't',
      replies: { count: 4 },
      reactions: { likes_count: 2, recasts_count: 1, likes: [{ fid: 9 }], recasts: [] },
      parent_hash: '0x0',
      embeds: [{ url: 'https://a' }],
    });
    expect(cast).toEqual({
      hash: '0x1',
      author: { fid: 3, username: 'u', display_name: 'U', pfp_url: 'p' },
      text: 'hi',
      timestamp: 't',
      replies: { count: 4 },
      reactions: { likes_count: 2, recasts_count: 1, likes: [{ fid: 9 }], recasts: [] },
      parent_hash: '0x0',
      embeds: [{ url: 'https://a' }],
    });
  });

  it('fills safe defaults when fields are missing', () => {
    const cast = neynarCastToCast({ hash: '0x2' });
    expect(cast.author).toEqual({ fid: 0, username: '', display_name: '', pfp_url: '' });
    expect(cast.text).toBe('');
    expect(cast.replies.count).toBe(0);
    expect(cast.reactions.likes_count).toBe(0);
    expect(cast.parent_hash).toBeNull();
    expect(cast.embeds).toEqual([]);
  });
});
