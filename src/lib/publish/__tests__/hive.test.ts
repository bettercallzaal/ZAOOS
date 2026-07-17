// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@hiveio/dhive', () => ({
  Client: vi.fn().mockImplementation(() => ({ broadcast: { comment: vi.fn() } })),
  PrivateKey: { fromString: vi.fn((s: string) => s) },
}));

import { decryptPostingKey, encryptPostingKey, getHiveClient } from '../hive';

const SECRET = 'test-session-secret-32-bytes!!';

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
});

// ---------------------------------------------------------------------------
// encryptPostingKey
// ---------------------------------------------------------------------------

describe('encryptPostingKey', () => {
  it('returns a string with exactly 3 colon-separated segments', () => {
    const result = encryptPostingKey('5KhivePk...');
    expect(result.split(':').length).toBe(3);
  });

  it('throws when SESSION_SECRET is not set', () => {
    delete process.env.SESSION_SECRET;
    expect(() => encryptPostingKey('key')).toThrow('SESSION_SECRET is not set');
  });

  it('produces a different ciphertext on every call (random IV)', () => {
    const a = encryptPostingKey('same-key');
    const b = encryptPostingKey('same-key');
    expect(a).not.toBe(b);
  });

  it('all three segments are non-empty base64 strings', () => {
    const [iv, authTag, ciphertext] = encryptPostingKey('key123').split(':');
    const b64 = /^[A-Za-z0-9+/=]+$/;
    expect(iv).toMatch(b64);
    expect(authTag).toMatch(b64);
    expect(ciphertext).toMatch(b64);
  });
});

// ---------------------------------------------------------------------------
// decryptPostingKey
// ---------------------------------------------------------------------------

describe('decryptPostingKey', () => {
  it('round-trips a posting key', () => {
    const original = '5KhivePkExampleWIFKey';
    const encrypted = encryptPostingKey(original);
    expect(decryptPostingKey(encrypted)).toBe(original);
  });

  it('round-trips an empty string', () => {
    const encrypted = encryptPostingKey('');
    expect(decryptPostingKey(encrypted)).toBe('');
  });

  it('throws when SESSION_SECRET is not set', () => {
    const encrypted = encryptPostingKey('key');
    delete process.env.SESSION_SECRET;
    expect(() => decryptPostingKey(encrypted)).toThrow('SESSION_SECRET is not set');
  });

  it('throws on invalid format — too few segments', () => {
    expect(() => decryptPostingKey('onlytwoparts:xyz')).toThrow('Invalid encrypted key format');
  });

  it('throws on invalid format — too many segments', () => {
    expect(() => decryptPostingKey('a:b:c:d')).toThrow('Invalid encrypted key format');
  });

  it('throws when decrypting with a different SESSION_SECRET (auth tag mismatch)', () => {
    const encrypted = encryptPostingKey('5Khive');
    process.env.SESSION_SECRET = 'a-completely-different-secret!';
    expect(() => decryptPostingKey(encrypted)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getHiveClient
// ---------------------------------------------------------------------------

describe('getHiveClient', () => {
  it('returns a Client instance', async () => {
    const { Client } = await import('@hiveio/dhive');
    const client = getHiveClient();
    expect(Client).toHaveBeenCalled();
    expect(client).toBeDefined();
  });
});
