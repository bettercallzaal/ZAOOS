import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockResolveENSNames, mockGetENSTextRecords, mockGetENSAvatar } = vi.hoisted(() => ({
  mockResolveENSNames: vi.fn(),
  mockGetENSTextRecords: vi.fn(),
  mockGetENSAvatar: vi.fn(),
}));

vi.mock('@/lib/ens/resolve', () => ({
  resolveENSNames: mockResolveENSNames,
  getENSTextRecords: mockGetENSTextRecords,
  getENSAvatar: mockGetENSAvatar,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/ens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Validation tests
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 400 when neither addresses nor name param is provided', async () => {
    const req = makeGetRequest('/api/ens');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Provide addresses or name param' });
  });

  it('returns 400 when addresses param exceeds 500 chars', async () => {
    const longAddresses = `0x${'a'.repeat(501)}`;
    const req = makeGetRequest('/api/ens', { addresses: longAddresses });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid params' });
  });

  it('returns 400 when name param exceeds 100 chars', async () => {
    const longName = `${'a'.repeat(101)}.eth`;
    const req = makeGetRequest('/api/ens', { name: longName });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid params' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Addresses mode tests
  // ─────────────────────────────────────────────────────────────────────────

  it('resolves names for a single address', async () => {
    const mockResult = { '0x1234567890abcdef1234567890abcdef12345678': 'vitalik.eth' };
    mockResolveENSNames.mockResolvedValue(mockResult);

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1234567890abcdef1234567890abcdef12345678',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockResolveENSNames).toHaveBeenCalledWith([
      '0x1234567890abcdef1234567890abcdef12345678',
    ]);

    const body = await res.json();
    expect(body).toEqual({ names: mockResult });
  });

  it('resolves names for multiple comma-separated addresses', async () => {
    const mockResult = {
      '0x1111111111111111111111111111111111111111': 'alice.eth',
      '0x2222222222222222222222222222222222222222': 'bob.eth',
    };
    mockResolveENSNames.mockResolvedValue(mockResult);

    const req = makeGetRequest('/api/ens', {
      addresses:
        '0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockResolveENSNames).toHaveBeenCalledWith([
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
    ]);

    const body = await res.json();
    expect(body).toEqual({ names: mockResult });
  });

  it('trims whitespace from addresses', async () => {
    const mockResult = { '0x1111111111111111111111111111111111111111': 'alice.eth' };
    mockResolveENSNames.mockResolvedValue(mockResult);

    const req = makeGetRequest('/api/ens', {
      addresses:
        '  0x1111111111111111111111111111111111111111  ,  0x2222222222222222222222222222222222222222  ',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    // resolveENSNames receives trimmed list
    expect(mockResolveENSNames).toHaveBeenCalledWith([
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
    ]);
  });

  it('filters out empty strings from addresses', async () => {
    const mockResult = { '0x1111111111111111111111111111111111111111': 'alice.eth' };
    mockResolveENSNames.mockResolvedValue(mockResult);

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111,,',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    // Empty strings filtered out
    expect(mockResolveENSNames).toHaveBeenCalledWith([
      '0x1111111111111111111111111111111111111111',
    ]);
  });

  it('returns empty object when no addresses resolve', async () => {
    mockResolveENSNames.mockResolvedValue({});

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ names: {} });
  });

  it('includes Cache-Control header in addresses response', async () => {
    mockResolveENSNames.mockResolvedValue({});

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111',
    });
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=600',
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Name mode tests
  // ─────────────────────────────────────────────────────────────────────────

  it('fetches text records and avatar for a valid ENS name', async () => {
    const mockRecords = {
      description: 'Ethereum founder',
      'com.twitter': 'vitalikbuterin',
      url: 'https://vitalik.ca',
    };
    const mockAvatar = 'https://example.com/avatar.png';

    mockGetENSTextRecords.mockResolvedValue(mockRecords);
    mockGetENSAvatar.mockResolvedValue(mockAvatar);

    const req = makeGetRequest('/api/ens', { name: 'vitalik.eth' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockGetENSTextRecords).toHaveBeenCalledWith('vitalik.eth');
    expect(mockGetENSAvatar).toHaveBeenCalledWith('vitalik.eth');

    const body = await res.json();
    expect(body).toEqual({
      name: 'vitalik.eth',
      records: mockRecords,
      avatar: mockAvatar,
    });
  });

  it('returns null avatar when getENSAvatar returns null', async () => {
    const mockRecords = { description: 'Some user' };

    mockGetENSTextRecords.mockResolvedValue(mockRecords);
    mockGetENSAvatar.mockResolvedValue(null);

    const req = makeGetRequest('/api/ens', { name: 'someuser.eth' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      name: 'someuser.eth',
      records: mockRecords,
      avatar: null,
    });
  });

  it('returns empty records when no text records are found', async () => {
    mockGetENSTextRecords.mockResolvedValue({});
    mockGetENSAvatar.mockResolvedValue(null);

    const req = makeGetRequest('/api/ens', { name: 'unknown.eth' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      name: 'unknown.eth',
      records: {},
      avatar: null,
    });
  });

  it('calls both getENSTextRecords and getENSAvatar in parallel', async () => {
    mockGetENSTextRecords.mockResolvedValue({});
    mockGetENSAvatar.mockResolvedValue(null);

    const req = makeGetRequest('/api/ens', { name: 'test.eth' });
    await GET(req);

    // Both should be called (Promise.all pattern)
    expect(mockGetENSTextRecords).toHaveBeenCalledWith('test.eth');
    expect(mockGetENSAvatar).toHaveBeenCalledWith('test.eth');
  });

  it('includes Cache-Control header in name response', async () => {
    mockGetENSTextRecords.mockResolvedValue({});
    mockGetENSAvatar.mockResolvedValue(null);

    const req = makeGetRequest('/api/ens', { name: 'test.eth' });
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=600',
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling tests
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when resolveENSNames throws', async () => {
    mockResolveENSNames.mockRejectedValue(new Error('RPC failed'));

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111',
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'ENS resolution failed' });
  });

  it('returns 500 when getENSTextRecords throws', async () => {
    mockGetENSTextRecords.mockRejectedValue(new Error('RPC failed'));
    mockGetENSAvatar.mockResolvedValue(null);

    const req = makeGetRequest('/api/ens', { name: 'test.eth' });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'ENS resolution failed' });
  });

  it('returns 500 when getENSAvatar throws', async () => {
    mockGetENSTextRecords.mockResolvedValue({});
    mockGetENSAvatar.mockRejectedValue(new Error('RPC failed'));

    const req = makeGetRequest('/api/ens', { name: 'test.eth' });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'ENS resolution failed' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query precedence and interaction tests
  // ─────────────────────────────────────────────────────────────────────────

  it('favors addresses mode when both addresses and name are provided', async () => {
    const mockResult = { '0x1111111111111111111111111111111111111111': 'alice.eth' };
    mockResolveENSNames.mockResolvedValue(mockResult);

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111',
      name: 'test.eth',
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    // resolveENSNames called (addresses mode takes precedence)
    expect(mockResolveENSNames).toHaveBeenCalled();
    // Name mode functions should NOT be called
    expect(mockGetENSTextRecords).not.toHaveBeenCalled();
    expect(mockGetENSAvatar).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body).toEqual({ names: mockResult });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Public endpoint (no auth required)
  // ─────────────────────────────────────────────────────────────────────────

  it('is publicly accessible with no auth check', async () => {
    mockResolveENSNames.mockResolvedValue({});

    const req = makeGetRequest('/api/ens', {
      addresses: '0x1111111111111111111111111111111111111111',
    });
    const res = await GET(req);

    // Should return 200 without any session/auth check
    expect(res.status).toBe(200);
  });
});
