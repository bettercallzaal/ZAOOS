import type { Client, Signer } from '@xmtp/browser-sdk';

const XMTP_ENV = 'production' as const;

// ── Security Notice ─────────────────────────────────────────────────
//
// XMTP MESSAGING KEY MANAGEMENT
//
// This module generates a dedicated XMTP-only signing key per user.
// This is NOT the user's personal wallet or Farcaster custody key.
//
// How it works:
// - A random 32-byte key is generated client-side via crypto.getRandomValues()
// - The key is stored in the browser's localStorage (per FID)
// - It is used ONLY to sign XMTP messages — never for on-chain transactions
// - The derived address has no funds and controls no assets
// - This avoids requiring users to connect MetaMask or sign wallet popups
//
// Security considerations:
// - The key is stored in plaintext in localStorage. This is an accepted
//   trade-off — XMTP's browser SDK requires client-side signing.
// - If localStorage is cleared, the XMTP identity is lost and past
//   encrypted messages cannot be decrypted on this device.
// - XSS protection is critical — any XSS vulnerability could extract
//   the XMTP key. We mitigate this by having zero dangerouslySetInnerHTML
//   usage, validating all inputs with Zod, and using httpOnly session cookies.
// - This key NEVER leaves the browser. It is never sent to our servers.
// - Users' personal wallets are NEVER accessed or stored by ZAO OS.
//
// ─────────────────────────────────────────────────────────────────────

/**
 * Create an EOA signer from a browser wallet (EIP-1193 provider).
 * Used when a user explicitly connects their own wallet for XMTP.
 * ZAO OS does NOT store or access the user's private key — only
 * the signMessage callback provided by the wallet extension.
 */
export async function createWalletSigner(
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string>
): Promise<Signer> {
  const { IdentifierKind } = await import('@xmtp/browser-sdk');
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: address,
    }),
    signMessage: async (message: string) => {
      const sig = await signMessage(message);
      const hex = sig.startsWith('0x') ? sig.slice(2) : sig;
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i >> 1] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    },
  };
}

/**
 * Create a local signer from a ZAO-generated XMTP key.
 * This is an app-generated burner key for XMTP messaging ONLY.
 * It is NOT the user's personal wallet key — ZAO OS never asks for
 * or touches personal wallet private keys.
 */
export async function createLocalSigner(privateKey: `0x${string}`): Promise<Signer> {
  const [{ privateKeyToAccount }, { IdentifierKind }] = await Promise.all([
    import('viem/accounts'),
    import('@xmtp/browser-sdk'),
  ]);
  const account = privateKeyToAccount(privateKey);

  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address,
    }),
    signMessage: async (message: string) => {
      const sig = await account.signMessage({ message });
      const hex = sig.startsWith('0x') ? sig.slice(2) : sig;
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i >> 1] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    },
  };
}

/**
 * Get or generate the DB encryption key for XMTP's local message storage.
 * This encrypts XMTP's IndexedDB/OPFS cache so messages are encrypted at rest
 * in the browser. The key is stored in localStorage — if cleared, the local
 * message cache is lost (but messages remain on the XMTP network).
 */
function getDbEncryptionKey(address: string): Uint8Array {
  if (typeof window === 'undefined') {
    return crypto.getRandomValues(new Uint8Array(32));
  }
  const storageKey = `zaoos-xmtp-db-key-${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return new Uint8Array(JSON.parse(stored));
    } catch {
      // Corrupted stored key — remove and generate fresh
      localStorage.removeItem(storageKey);
    }
  }
  const key = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(storageKey, JSON.stringify(Array.from(key)));
  return key;
}

/**
 * Create and initialize an XMTP client for a specific wallet
 */
export async function createXMTPClient(signer: Signer, address: string): Promise<Client> {
  const { Client } = await import('@xmtp/browser-sdk');
  const client = await Client.create(signer, {
    env: XMTP_ENV,
    dbEncryptionKey: getDbEncryptionKey(address),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return client;
}

/**
 * Get or generate a local XMTP-only signing key for a FID.
 *
 * SECURITY: This generates an app-specific burner key used exclusively
 * for XMTP message signing. It is NOT the user's personal wallet key.
 * - Generated via crypto.getRandomValues() (cryptographically secure)
 * - Stored in localStorage per FID
 * - Never sent to any server
 * - Never used for on-chain transactions or fund transfers
 * - The derived address holds no assets
 * - If cleared, XMTP identity is lost (messages not recoverable on this device)
 */
export function getOrCreateLocalKey(fid: number): `0x${string}` {
  if (typeof window === 'undefined') {
    throw new Error('Cannot access localStorage on server');
  }

  const storageKey = `zaoos-xmtp-local-key-${fid}`;
  const stored = localStorage.getItem(storageKey);
  if (stored && /^0x[0-9a-fA-F]{64}$/.test(stored)) {
    return stored as `0x${string}`;
  }
  // Invalid or missing — remove corrupted data and regenerate
  if (stored) localStorage.removeItem(storageKey);

  // Generate a random 32-byte XMTP-only signing key (not a wallet key)
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const key = `0x${hex}` as `0x${string}`;
  localStorage.setItem(storageKey, key);
  return key;
}

/**
 * Get the address for a local key
 */
export async function getLocalKeyAddress(fid: number): Promise<`0x${string}`> {
  const key = getOrCreateLocalKey(fid);
  const { privateKeyToAccount } = await import('viem/accounts');
  return privateKeyToAccount(key).address;
}

/**
 * Get the list of connected wallet addresses from localStorage
 */
export function getConnectedWallets(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('zaoos-xmtp-wallets');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Save a wallet address to the connected wallets list
 */
export function saveConnectedWallet(address: string): void {
  if (typeof window === 'undefined') return;
  const wallets = getConnectedWallets();
  const normalized = address.toLowerCase();
  if (!wallets.includes(normalized)) {
    wallets.push(normalized);
    localStorage.setItem('zaoos-xmtp-wallets', JSON.stringify(wallets));
  }
}

/**
 * Remove a wallet address from the connected wallets list
 */
export function removeConnectedWallet(address: string): void {
  if (typeof window === 'undefined') return;
  const wallets = getConnectedWallets().filter(
    (w) => w !== address.toLowerCase()
  );
  localStorage.setItem('zaoos-xmtp-wallets', JSON.stringify(wallets));
}

// ── Peer profile storage ────────────────────────────────────────────
// Maps XMTP conversation IDs → peer profile info so DMs show usernames

export interface XMTPPeerProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

const PEER_STORAGE_KEY = 'zaoos-xmtp-peers';

export function getPeerProfiles(): Record<string, XMTPPeerProfile> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(PEER_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

export function savePeerProfile(conversationId: string, profile: XMTPPeerProfile): void {
  if (typeof window === 'undefined') return;
  const peers = getPeerProfiles();
  peers[conversationId] = profile;
  localStorage.setItem(PEER_STORAGE_KEY, JSON.stringify(peers));
}

// Maps XMTP inbox IDs → profile info for message sender resolution
const MEMBER_STORAGE_KEY = 'zaoos-xmtp-members';

export function getMemberProfiles(): Record<string, XMTPPeerProfile> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(MEMBER_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

export function saveMemberProfile(inboxId: string, profile: XMTPPeerProfile): void {
  if (typeof window === 'undefined') return;
  const members = getMemberProfiles();
  members[inboxId] = profile;
  localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(members));
}
