// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getConnectedWallets,
  getMemberProfiles,
  getOrCreateLocalKey,
  getPeerProfiles,
  removeConnectedWallet,
  saveConnectedWallet,
  saveMemberProfile,
  savePeerProfile,
  type XMTPPeerProfile,
} from '../client';

afterEach(() => vi.unstubAllGlobals());

// In-memory localStorage substitute that shares state across getItem/setItem calls
function makeStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };
}

// Stub both `window` (for typeof check) and bare `localStorage` (for ops)
function withBrowserWindow(initial: Record<string, string> = {}) {
  const ls = makeStorage(initial);
  vi.stubGlobal('window', { localStorage: ls });
  vi.stubGlobal('localStorage', ls);
  return ls;
}

// ── server-side (window === undefined) ─────────────────────────────────────

describe('server-side guards (no window)', () => {
  it('getConnectedWallets returns []', () => {
    expect(getConnectedWallets()).toEqual([]);
  });

  it('saveConnectedWallet is a no-op', () => {
    expect(() => saveConnectedWallet('0xABC')).not.toThrow();
  });

  it('removeConnectedWallet is a no-op', () => {
    expect(() => removeConnectedWallet('0xABC')).not.toThrow();
  });

  it('getPeerProfiles returns {}', () => {
    expect(getPeerProfiles()).toEqual({});
  });

  it('getMemberProfiles returns {}', () => {
    expect(getMemberProfiles()).toEqual({});
  });

  it('savePeerProfile is a no-op', () => {
    const p: XMTPPeerProfile = { fid: 1, username: 'a', displayName: 'A', pfpUrl: '' };
    savePeerProfile('conv', p);
    expect(getPeerProfiles()).toEqual({});
  });

  it('saveMemberProfile is a no-op', () => {
    const p: XMTPPeerProfile = { fid: 1, username: 'a', displayName: 'A', pfpUrl: '' };
    saveMemberProfile('inbox', p);
    expect(getMemberProfiles()).toEqual({});
  });

  it('getOrCreateLocalKey throws', () => {
    expect(() => getOrCreateLocalKey(1)).toThrow('Cannot access localStorage on server');
  });
});

// ── getConnectedWallets ─────────────────────────────────────────────────────

describe('getConnectedWallets', () => {
  it('returns [] when storage is empty', () => {
    withBrowserWindow();
    expect(getConnectedWallets()).toEqual([]);
  });

  it('returns stored wallets array', () => {
    withBrowserWindow({ 'zaoos-xmtp-wallets': JSON.stringify(['0xabc', '0xdef']) });
    expect(getConnectedWallets()).toEqual(['0xabc', '0xdef']);
  });

  it('returns [] on corrupted JSON', () => {
    withBrowserWindow({ 'zaoos-xmtp-wallets': '{bad json}' });
    expect(getConnectedWallets()).toEqual([]);
  });
});

// ── saveConnectedWallet ─────────────────────────────────────────────────────

describe('saveConnectedWallet', () => {
  it('adds a wallet normalized to lowercase', () => {
    withBrowserWindow();
    saveConnectedWallet('0xABCDEF');
    expect(getConnectedWallets()).toEqual(['0xabcdef']);
  });

  it('does not add duplicates', () => {
    withBrowserWindow({ 'zaoos-xmtp-wallets': JSON.stringify(['0xabcdef']) });
    saveConnectedWallet('0xABCDEF');
    expect(getConnectedWallets()).toHaveLength(1);
  });
});

// ── removeConnectedWallet ───────────────────────────────────────────────────

describe('removeConnectedWallet', () => {
  it('removes a wallet by address', () => {
    withBrowserWindow({ 'zaoos-xmtp-wallets': JSON.stringify(['0xabc', '0xdef']) });
    removeConnectedWallet('0xabc');
    expect(getConnectedWallets()).toEqual(['0xdef']);
  });

  it('is a no-op when the wallet is not in the list', () => {
    withBrowserWindow({ 'zaoos-xmtp-wallets': JSON.stringify(['0xabc']) });
    removeConnectedWallet('0xother');
    expect(getConnectedWallets()).toHaveLength(1);
  });
});

// ── getPeerProfiles / savePeerProfile ───────────────────────────────────────

const PEER: XMTPPeerProfile = {
  fid: 42,
  username: 'zaal',
  displayName: 'Zaal P',
  pfpUrl: 'https://pfp.example.com',
};

describe('getPeerProfiles / savePeerProfile', () => {
  it('returns {} when no profiles stored', () => {
    withBrowserWindow();
    expect(getPeerProfiles()).toEqual({});
  });

  it('saves and retrieves a peer profile', () => {
    withBrowserWindow();
    savePeerProfile('conv-1', PEER);
    expect(getPeerProfiles()).toEqual({ 'conv-1': PEER });
  });

  it('returns {} on corrupted JSON', () => {
    withBrowserWindow({ 'zaoos-xmtp-peers': 'bad json' });
    expect(getPeerProfiles()).toEqual({});
  });
});

// ── getMemberProfiles / saveMemberProfile ────────────────────────────────────

const MEMBER: XMTPPeerProfile = { fid: 99, username: 'arthur', displayName: 'Arthur', pfpUrl: '' };

describe('getMemberProfiles / saveMemberProfile', () => {
  it('returns {} when no members stored', () => {
    withBrowserWindow();
    expect(getMemberProfiles()).toEqual({});
  });

  it('saves and retrieves a member profile', () => {
    withBrowserWindow();
    saveMemberProfile('inbox-1', MEMBER);
    expect(getMemberProfiles()).toEqual({ 'inbox-1': MEMBER });
  });
});

// ── getOrCreateLocalKey ──────────────────────────────────────────────────────

describe('getOrCreateLocalKey', () => {
  it('generates a valid 0x hex key and persists it', () => {
    withBrowserWindow();
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => { arr.fill(0xab); return arr; },
    });
    const key = getOrCreateLocalKey(999);
    expect(key).toBe('0x' + 'ab'.repeat(32));
    // second call should return same key from storage (no new random values)
    const stored = getOrCreateLocalKey(999);
    expect(stored).toBe(key);
  });

  it('returns the existing stored key without regenerating', () => {
    const existing = '0x' + 'cd'.repeat(32);
    withBrowserWindow({ 'zaoos-xmtp-local-key-5': existing });
    const key = getOrCreateLocalKey(5);
    expect(key).toBe(existing);
  });

  it('regenerates if the stored key has an invalid format', () => {
    withBrowserWindow({ 'zaoos-xmtp-local-key-7': 'notvalidhex' });
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => { arr.fill(0xee); return arr; },
    });
    const key = getOrCreateLocalKey(7);
    expect(key).toBe('0x' + 'ee'.repeat(32));
  });
});
