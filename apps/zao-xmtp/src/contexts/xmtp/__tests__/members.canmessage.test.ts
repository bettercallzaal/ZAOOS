// Ported from ZAOOS src/contexts/xmtp/__tests__/members.canmessage.test.ts (bettercallzaal/ZAOOS, MIT) on 2026-10-17. Code unchanged; comment em dashes became hyphens.
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { XMTPSharedRefs, XMTPSharedState } from '@/contexts/xmtp/types';

vi.mock('@xmtp/browser-sdk', () => ({ IdentifierKind: { Ethereum: 'ethereum' } }));

import { useMembers } from '@/contexts/xmtp/members';

const PEER_ADDRESS = `0x${'1'.repeat(40)}`;

function setup(canMessage: () => Promise<unknown>) {
  const showActionError = vi.fn();
  const refs = {
    walletsRef: {
      current: new Map([
        ['0xabc', { address: '0xabc', client: { canMessage: vi.fn(canMessage) } }],
      ]),
    },
    messagingPrefsRef: { current: {} },
    zaoMembersRef: { current: [] },
  } as unknown as XMTPSharedRefs;
  const state = {
    setZaoMembers: vi.fn(),
    setLoadingMembers: vi.fn(),
    showActionError,
  } as unknown as XMTPSharedState;

  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      currentFid: 42,
      members: [
        { fid: 7, username: 'peer', displayName: 'Peer', pfpUrl: null, addresses: [PEER_ADDRESS] },
      ],
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);

  return { refs, state, showActionError };
}

describe('useMembers.checkZaoMembers canMessage failure', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('surfaces an error to the UI when canMessage fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { refs, state, showActionError } = setup(() => Promise.reject(new Error('network down')));
    const { result } = renderHook(() => useMembers(refs, state, vi.fn(), vi.fn()));

    await act(async () => {
      await result.current.checkZaoMembers();
    });

    expect(showActionError).toHaveBeenCalledTimes(1);
    expect(showActionError).toHaveBeenCalledWith(expect.stringContaining('Could not check'));
  });

  it('does not show an error when canMessage succeeds', async () => {
    const { refs, state, showActionError } = setup(() =>
      Promise.resolve(new Map([[PEER_ADDRESS, true]])),
    );
    const { result } = renderHook(() => useMembers(refs, state, vi.fn(), vi.fn()));

    await act(async () => {
      await result.current.checkZaoMembers();
    });

    expect(showActionError).not.toHaveBeenCalled();
  });
});
