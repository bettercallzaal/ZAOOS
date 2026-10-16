import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ctx = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
  fid: 42 as number | null,
}));

vi.mock('@/contexts/XMTPContext', () => ({
  useXMTPContext: () => ctx.value,
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: ctx.fid === null ? null : { fid: ctx.fid } }),
}));
vi.mock('@/hooks/useMobile', () => ({ useMobile: () => false }));
vi.mock('@/hooks/useWalletXMTP', () => ({
  useWalletXMTP: () => ({ canConnect: false, connectWalletToXMTP: vi.fn() }),
}));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/messages/ConnectXMTP', () => ({ ConnectXMTP: () => null }));
vi.mock('@/components/messages/ConversationList', () => ({ ConversationList: () => null }));
vi.mock('@/components/messages/MessageCompose', () => ({ MessageCompose: () => null }));
vi.mock('@/components/messages/MessageThread', () => ({ MessageThread: () => null }));
vi.mock('@/components/messages/NewConversationDialog', () => ({
  NewConversationDialog: () => null,
}));

import { MessagesRoom } from '@/components/messages/MessagesRoom';

function baseContext(overrides: Record<string, unknown> = {}) {
  return {
    isConnecting: false,
    isConnected: false,
    error: null,
    actionError: null,
    streamConnected: false,
    reconnecting: false,
    conversations: [],
    activeConversationId: null,
    messages: [],
    loadingMessages: false,
    tabLocked: false,
    autoConnect: vi.fn(async () => {}),
    selectConversation: vi.fn(),
    sendMessage: vi.fn(),
    createDm: vi.fn(),
    createGroup: vi.fn(),
    zaoMembers: [],
    startDmWithMember: vi.fn(),
    clearError: vi.fn(),
    clearActionError: vi.fn(),
    reconnectStreams: vi.fn(),
    removeConversation: vi.fn(),
    ...overrides,
  };
}

describe('MessagesRoom FID auto-connect (NEXT_PUBLIC_XMTP_AUTO_CONNECT)', () => {
  beforeEach(() => {
    ctx.fid = 42;
    ctx.value = baseContext();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('calls autoConnect(fid) exactly once on mount when the flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    const autoConnect = ctx.value.autoConnect as ReturnType<typeof vi.fn>;

    const { rerender } = render(<MessagesRoom />);
    rerender(<MessagesRoom />);

    expect(autoConnect).toHaveBeenCalledTimes(1);
    expect(autoConnect).toHaveBeenCalledWith(42);
  });

  it('does not call autoConnect when the flag is off (default)', () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', '');
    const autoConnect = ctx.value.autoConnect as ReturnType<typeof vi.fn>;

    render(<MessagesRoom />);

    expect(autoConnect).not.toHaveBeenCalled();
  });

  it('does not call autoConnect without a session FID, even with the flag on', () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    ctx.fid = null;
    const autoConnect = ctx.value.autoConnect as ReturnType<typeof vi.fn>;

    render(<MessagesRoom />);

    expect(autoConnect).not.toHaveBeenCalled();
  });

  it('retries once after a transient error, and not while the tab is locked', async () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    vi.useFakeTimers();
    const autoConnect = ctx.value.autoConnect as ReturnType<typeof vi.fn>;

    const { rerender } = render(<MessagesRoom />);
    expect(autoConnect).toHaveBeenCalledTimes(1);

    ctx.value = baseContext({ error: 'transient', autoConnect });
    rerender(<MessagesRoom />);
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(autoConnect).toHaveBeenCalledTimes(2);

    ctx.value = baseContext({ error: 'open in another tab', tabLocked: true, autoConnect });
    rerender(<MessagesRoom />);
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(autoConnect).toHaveBeenCalledTimes(2);
  });
});
