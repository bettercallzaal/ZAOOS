/**
 * Hive/InLeo publishing client.
 *
 * Handles encryption of posting keys, client setup, and broadcasting
 * markdown posts to the Hive blockchain via @hiveio/dhive.
 */

import { Client, PrivateKey } from '@hiveio/dhive';
import crypto from 'crypto';
import type { NormalizedContent } from '@/lib/publish/normalize';

// ---------------------------------------------------------------------------
// Encryption helpers — AES-256-GCM using SESSION_SECRET
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;


/**
 * Derive a 32-byte key from SESSION_SECRET (which may be any length).
 */
function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * AES-256-GCM encrypt a Hive posting key.
 * Returns base64-encoded `iv:authTag:ciphertext`.
 */
export function encryptPostingKey(key: string): string {
  const encKey = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encKey, iv);

  let encrypted = cipher.update(key, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a previously encrypted posting key.
 */
export function decryptPostingKey(encrypted: string): string {
  const encKey = deriveKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted key format');

  const [ivB64, authTagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, encKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ---------------------------------------------------------------------------
// Hive client
// ---------------------------------------------------------------------------

const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
];

/**
 * Get a configured dhive Client connected to public Hive API nodes.
 */
export function getHiveClient(): Client {
  return new Client(HIVE_NODES);
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const DEFAULT_TAGS = ['zao', 'music', 'web3', 'farcaster', 'inleo'];

interface HivePublishResult {
  permlink: string;
  url: string;
}

/**
 * Publish a post to the Hive blockchain.
 *
 * @param username    Hive account name
 * @param postingKey  Decrypted Hive posting key (WIF format)
 * @param content     Normalized content from normalizeForHive()
 * @param tags        Optional tags — defaults to ['zao','music','web3','farcaster','inleo']
 */
export async function publishToHive(
  username: string,
  postingKey: string,
  content: NormalizedContent,
  tags?: string[],
): Promise<HivePublishResult> {
  const client = getHiveClient();
  const resolvedTags = tags && tags.length > 0 ? tags : DEFAULT_TAGS;

  const permlink = `zao-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const jsonMetadata = JSON.stringify({
    tags: resolvedTags,
    app: 'zaoos',
    format: 'markdown',
    image: content.images,
  });

  await client.broadcast.comment(
    {
      parent_author: '',
      parent_permlink: resolvedTags[0] || 'zao',
      author: username,
      permlink,
      title: '',
      body: content.text,
      json_metadata: jsonMetadata,
    },
    PrivateKey.fromString(postingKey),
  );

  return {
    permlink,
    url: `https://inleo.io/@${username}/${permlink}`,
  };
}
