import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChat } from '../useChat';

// Mock Supabase browser client
let insertCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null;
let updateCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null;
const mockRemoveChannel = vi.fn();

const mockChannel = {
  on: vi.fn(
    (
      _event: string,
      filter: Record<string, unknown>,
      cb: (payload: { new: Record<string, unknown> }) => void,
    ) => {
      if (filter.event === 'INSERT') insertCallback = cb;
      if (filter.event === 'UPDATE') updateCallback = cb;
      return mockChannel;
    },
  ),
  subscribe: vi.fn((cb: (status: string) => void) => {
    cb('SUBSCRIBED');
    return mockChannel;
  }),
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeChannel: mockRemoveChannel,
};

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseBrowser: vi.fn(() => mockSupabaseClient),
}));

const initialCasts = [
  {
    hash: '0xcast1',
    author: {
      fid: 1,
      username: 'zaal',
      display_name: 'Zaal',
      pfp_url: 'https://example.com/zaal.png',
    },
    text: 'Welcome to ZAO chat',
    timestamp: '2026-10-05T12:00:00Z',
    replies: { count: 0 },
    reactions: { likes_count: 5, recasts_count: 1, likes: [], recasts: [] },
    parent_hash: null,
    embeds: [],
  },
];

describe('useChat with Supabase Realtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCallback = null;
    updateCallback = null;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ casts: initialCasts, hasMore: false }),
      }),
    );
  });

  it('fetches initial messages and sets up realtime subscription', async () => {
    const { result } = renderHook(() => useChat('zao'));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].hash).toBe('0xcast1');
    expect(result.current.isRealtime).toBe(true);
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('chat-casts-zao');
  });

  it('appends incoming realtime casts on INSERT event', async () => {
    const { result } = renderHook(() => useChat('zao'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(insertCallback).not.toBeNull();

    // Simulate incoming realtime cast from Supabase
    act(() => {
      insertCallback?.({
        new: {
          hash: '0xcast2',
          fid: 2,
          author_username: 'vitalik',
          author_display: 'Vitalik',
          author_pfp: 'https://example.com/v.png',
          text: 'Realtime chat is working!',
          timestamp: '2026-10-05T12:01:00Z',
          channel_id: 'zao',
          reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
          replies_count: 0,
        },
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].hash).toBe('0xcast2');
    expect(result.current.messages[0].text).toBe('Realtime chat is working!');
    expect(result.current.messages[0].author.username).toBe('vitalik');
  });

  it('updates cast on UPDATE event', async () => {
    const { result } = renderHook(() => useChat('zao'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(updateCallback).not.toBeNull();

    // Simulate like count update via Realtime
    act(() => {
      updateCallback?.({
        new: {
          hash: '0xcast1',
          fid: 1,
          author_username: 'zaal',
          author_display: 'Zaal',
          author_pfp: 'https://example.com/zaal.png',
          text: 'Welcome to ZAO chat',
          timestamp: '2026-10-05T12:00:00Z',
          reactions: { likes_count: 12, recasts_count: 3, likes: [], recasts: [] },
          replies_count: 1,
        },
      });
    });

    expect(result.current.messages[0].reactions.likes_count).toBe(12);
    expect(result.current.messages[0].reactions.recasts_count).toBe(3);
    expect(result.current.messages[0].replies.count).toBe(1);
  });

  it('unsubscribes channel on unmount', async () => {
    const { unmount } = renderHook(() => useChat('zao'));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
