import { Client, type Signer } from '@xmtp/browser-sdk';
import { IdentifierKind } from '@xmtp/browser-sdk';

const XMTP_ENV = 'production' as const;
const DB_KEY_STORAGE = 'zaoos-xmtp-db-key';

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
 * Get or generate the DB encryption key for local XMTP storage
 */
function getDbEncryptionKey(): Uint8Array {
  if (typeof window === 'undefined') {
    return crypto.getRandomValues(new Uint8Array(32));
  }
  const stored = localStorage.getItem(DB_KEY_STORAGE);
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const key = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(DB_KEY_STORAGE, JSON.stringify(Array.from(key)));
  return key;
}

/**
 * Create and initialize an XMTP client
 */
export async function createXMTPClient(signer: Signer) {
  const client = await Client.create(signer, {
    env: XMTP_ENV,
    dbEncryptionKey: getDbEncryptionKey(),
  } as Parameters<typeof Client.create>[1]);
  return client;
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
      // Someone else is asking — respond that we're here
      channel.postMessage({ type: 'pong' });
    }
    if (e.data.type === 'pong') {
      isLocked = true;
    }
  };

  // Give 200ms for a response
  return {
    get isLocked() { return isLocked; },
    release: () => {
      channel.close();
    },
  };
}
