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
      // Convert hex string to Uint8Array
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

/**
 * Check if another tab already has XMTP active using BroadcastChannel
 */
export function checkTabLock(): { isLocked: boolean; release: () => void } {
  if (typeof window === 'undefined') return { isLocked: false, release: () => {} };

  const channel = new BroadcastChannel('zaoos-xmtp-lock');
  let isLocked = false;

  // Ask if anyone else is active
  channel.postMessage({ type: 'ping' });

  channel.onmessage = (e) => {
    if (e.data.type === 'ping') {
      channel.postMessage({ type: 'pong' });
    }
    if (e.data.type === 'pong') {
      isLocked = true;
    }
  };

  return {
    get isLocked() { return isLocked; },
    release: () => {
      channel.close();
    },
  };
}
