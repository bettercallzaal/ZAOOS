import { Client, type Signer } from '@xmtp/browser-sdk';
import { IdentifierKind } from '@xmtp/browser-sdk';

const XMTP_ENV = 'production' as const;

/**
 * Create an EOA signer from a browser wallet (EIP-1193 provider)
 */
export function createWalletSigner(
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string>
): Signer {
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
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    },
  };
}

/**
 * Create a local signer from a stored private key (no MetaMask needed).
 * Uses viem's privateKeyToAccount for signing.
 */
export async function createLocalSigner(privateKey: `0x${string}`): Promise<Signer> {
  const { privateKeyToAccount } = await import('viem/accounts');
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
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    },
  };
}

/**
 * Get or generate the DB encryption key for a specific wallet's XMTP storage
 */
function getDbEncryptionKey(address: string): Uint8Array {
  if (typeof window === 'undefined') {
    return crypto.getRandomValues(new Uint8Array(32));
  }
  const storageKey = `zaoos-xmtp-db-key-${address.toLowerCase()}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const key = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(storageKey, JSON.stringify(Array.from(key)));
  return key;
}

/**
 * Create and initialize an XMTP client for a specific wallet
 */
export async function createXMTPClient(signer: Signer, address: string) {
  const client = await Client.create(signer, {
    env: XMTP_ENV,
    dbEncryptionKey: getDbEncryptionKey(address),
  } as Parameters<typeof Client.create>[1]);
  return client;
}

/**
 * Get or generate a local XMTP private key for a FID.
 * Stored in localStorage — no wallet extension needed.
 */
export function getOrCreateLocalKey(fid: number): `0x${string}` {
  if (typeof window === 'undefined') {
    throw new Error('Cannot access localStorage on server');
  }

  const storageKey = `zaoos-xmtp-local-key-${fid}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return stored as `0x${string}`;
  }

  // Generate a random 32-byte private key
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
  return stored ? JSON.parse(stored) : [];
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
