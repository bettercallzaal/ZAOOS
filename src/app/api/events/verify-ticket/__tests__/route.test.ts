import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

const { mockGetEventBySlug, mockFindKeyHolder, mockGetUserByFid, mockLogger } = vi.hoisted(() => ({
  mockGetEventBySlug: vi.fn(),
  mockFindKeyHolder: vi.fn(),
  mockGetUserByFid: vi.fn(),
  mockLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/unlock/events', () => ({
  getEventBySlug: mockGetEventBySlug,
}));

vi.mock('@/lib/unlock/lock', () => ({
  findKeyHolder: mockFindKeyHolder,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: mockGetUserByFid,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

/** A valid event with a lock address. */
const SAMPLE_EVENT = {
  id: 'evt-1',
  slug: 'community-gathering-2026',
  title: 'Community Gathering 2026',
  description: 'A gathering of the ZAO community.',
  lock_address: '0x1234567890abcdef1234567890abcdef12345678',
  unlock_event_url: 'https://unlock-protocol.com/event/1',
  chain_id: 8453, // Base
  starts_at: '2026-07-20T10:00:00Z',
  ends_at: '2026-07-20T15:00:00Z',
  location: 'Virtual',
  is_published: true,
};

/** A valid Farcaster user with verified addresses and custody. */
const SAMPLE_NEYNAR_USER = {
  fid: 123,
  username: 'testuser',
  verified_addresses: {
    eth_addresses: ['0xabcd1234567890abcd1234567890abcd12345678'],
  },
  custody_address: '0xdeff1234567890deff1234567890deff12345678',
};

/** A Farcaster user with no verified addresses. */
const SAMPLE_NEYNAR_USER_NO_VERIFIED = {
  fid: 456,
  username: 'noaddruser',
  verified_addresses: null,
  custody_address: '0x1111111111111111111111111111111111111111',
};

describe('POST /api/events/verify-ticket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Validation Tests ==========

  it('returns 400 when eventSlug is missing', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
    expect(body).toHaveProperty('details');
  });

  it('returns 400 when eventSlug is empty string', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: '',
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
  });

  it('returns 400 when eventSlug exceeds max length', async () => {
    const longSlug = 'a'.repeat(101);
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: longSlug,
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
  });

  it('returns 400 when neither fid nor wallet is provided', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
    expect(body).toHaveProperty('details');
  });

  it('returns 400 when wallet is malformed (not 0x...)', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: 'not-a-wallet',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
  });

  it('returns 400 when wallet is valid format but wrong length', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0x1234567890abcdef1234567890abcdef123456', // 39 chars instead of 40
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
  });

  it('returns 400 when fid is not a positive integer', async () => {
    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: -5,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid input');
  });

  // ========== Event Not Found ==========

  it('returns 404 when event is not found', async () => {
    mockGetEventBySlug.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'nonexistent-event',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Event not found');
  });

  // ========== Event Has No Lock ==========

  it('returns 409 when event has no lock_address', async () => {
    const eventNoLock = { ...SAMPLE_EVENT, lock_address: null };
    mockGetEventBySlug.mockResolvedValue(eventNoLock);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Event has no ticket lock yet');
    expect(body).toHaveProperty('holdsTicket', false);
  });

  // ========== Wallet Mode: Holder Found ==========

  it('returns 200 with holdsTicket=true when wallet holds key', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockFindKeyHolder.mockResolvedValue('0xabcd1234567890abcd1234567890abcd12345678');

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0xabcd1234567890abcd1234567890abcd12345678',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', true);
    expect(body).toHaveProperty('matchedAddress', '0xabcd1234567890abcd1234567890abcd12345678');
    expect(body).toHaveProperty('eventSlug', 'community-gathering-2026');
    expect(body).toHaveProperty('lockAddress', SAMPLE_EVENT.lock_address);
    expect(body).toHaveProperty('chainId', 8453);
  });

  // ========== Wallet Mode: No Holder ==========

  it('returns 200 with holdsTicket=false when wallet does not hold key', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockFindKeyHolder.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0xdead000000000000000000000000000000000000',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', false);
    expect(body).toHaveProperty('matchedAddress', null);
    expect(body).toHaveProperty('eventSlug', 'community-gathering-2026');
  });

  // ========== FID Mode: Holder Found ==========

  it('resolves fid to addresses and returns holdsTicket=true when holder found', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(SAMPLE_NEYNAR_USER);
    mockFindKeyHolder.mockResolvedValue('0xabcd1234567890abcd1234567890abcd12345678');

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', true);
    expect(body).toHaveProperty('matchedAddress', '0xabcd1234567890abcd1234567890abcd12345678');

    // Verify that findKeyHolder was called with both verified + custody addresses
    expect(mockFindKeyHolder).toHaveBeenCalledWith(
      SAMPLE_EVENT.lock_address,
      expect.arrayContaining([
        '0xabcd1234567890abcd1234567890abcd12345678',
        '0xdeff1234567890deff1234567890deff12345678',
      ]),
    );
  });

  // ========== FID Mode: No Holder ==========

  it('resolves fid and returns holdsTicket=false when no holder found', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(SAMPLE_NEYNAR_USER);
    mockFindKeyHolder.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', false);
    expect(body).toHaveProperty('matchedAddress', null);
  });

  // ========== FID Mode: Neynar Returns Null ==========

  it('handles fid lookup returning null gracefully', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(null);
    mockFindKeyHolder.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 999,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', false);
    expect(body).toHaveProperty('matchedAddress', null);

    // findKeyHolder should be called with empty array (no addresses for missing user)
    expect(mockFindKeyHolder).toHaveBeenCalledWith(SAMPLE_EVENT.lock_address, []);
  });

  // ========== FID Mode: Neynar Error ==========

  it('catches Neynar error and returns holdsTicket=false', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockRejectedValue(new Error('Neynar API error'));
    mockFindKeyHolder.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', false);
    expect(body).toHaveProperty('matchedAddress', null);

    // Logger should have been called with the error
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[events/verify-ticket] Neynar lookup failed:',
      expect.any(Error),
    );
  });

  // ========== FID Mode: No Verified Addresses ==========

  it('includes custody address when verified_addresses is null', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(SAMPLE_NEYNAR_USER_NO_VERIFIED);
    mockFindKeyHolder.mockResolvedValue('0x1111111111111111111111111111111111111111');

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 456,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', true);

    // findKeyHolder should be called with only custody address
    expect(mockFindKeyHolder).toHaveBeenCalledWith(SAMPLE_EVENT.lock_address, [
      '0x1111111111111111111111111111111111111111',
    ]);
  });

  // ========== Combined Mode: Wallet + FID ==========

  it('checks both wallet and fid-resolved addresses when both provided', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(SAMPLE_NEYNAR_USER);
    mockFindKeyHolder.mockResolvedValue('0xabcd1234567890abcd1234567890abcd12345678');

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0xdead000000000000000000000000000000000000',
      fid: 123,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', true);

    // findKeyHolder should be called with wallet first, then fid addresses
    expect(mockFindKeyHolder).toHaveBeenCalledWith(
      SAMPLE_EVENT.lock_address,
      expect.arrayContaining([
        '0xdead000000000000000000000000000000000000', // The direct wallet
        '0xabcd1234567890abcd1234567890abcd12345678', // FID verified
        '0xdeff1234567890deff1234567890deff12345678', // FID custody
      ]),
    );
  });

  // ========== Error Handling ==========

  it('returns 500 on unexpected error during processing', async () => {
    mockGetEventBySlug.mockRejectedValue(new Error('Database error'));

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Server error');

    // Logger should have been called with the error
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[events/verify-ticket] Unexpected error:',
      expect.any(Error),
    );
  });

  it('returns 500 when findKeyHolder throws', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockFindKeyHolder.mockRejectedValue(new Error('Contract read failed'));

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Server error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[events/verify-ticket] Unexpected error:',
      expect.any(Error),
    );
  });

  // ========== Response Shape Validation ==========

  it('always includes all required response fields on success', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockFindKeyHolder.mockResolvedValue(null);

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
    });

    const res = await POST(req);
    const body = (await res.json()) as Record<string, unknown>;

    expect(body).toHaveProperty('holdsTicket');
    expect(body).toHaveProperty('matchedAddress');
    expect(body).toHaveProperty('eventSlug');
    expect(body).toHaveProperty('lockAddress');
    expect(body).toHaveProperty('chainId');
  });

  // ========== Edge Case: Invalid JSON ==========

  it('returns 500 when request body is not valid JSON (caught by try/catch)', async () => {
    const req = new (await import('next/server')).NextRequest(
      new URL('/api/events/verify-ticket', 'http://localhost:3000'),
      {
        method: 'POST',
        body: 'not-json',
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Server error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[events/verify-ticket] Unexpected error:',
      expect.any(Error),
    );
  });

  // ========== Edge Case: Multiple Addresses Candidate Check ==========

  it('calls findKeyHolder with all candidate addresses including both verified and custody', async () => {
    const userWithMultiple = {
      fid: 789,
      username: 'multiaddr',
      verified_addresses: {
        eth_addresses: [
          '0xaaaa000000000000000000000000000000000000',
          '0xbbbb000000000000000000000000000000000000',
        ],
      },
      custody_address: '0xcccc000000000000000000000000000000000000',
    };

    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    mockGetUserByFid.mockResolvedValue(userWithMultiple);
    mockFindKeyHolder.mockResolvedValue('0xbbbb000000000000000000000000000000000000');

    const req = makePostRequest('/api/events/verify-ticket', {
      eventSlug: 'community-gathering-2026',
      fid: 789,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('holdsTicket', true);
    expect(body).toHaveProperty('matchedAddress', '0xbbbb000000000000000000000000000000000000');

    expect(mockFindKeyHolder).toHaveBeenCalledWith(SAMPLE_EVENT.lock_address, [
      '0xaaaa000000000000000000000000000000000000',
      '0xbbbb000000000000000000000000000000000000',
      '0xcccc000000000000000000000000000000000000',
    ]);
  });
});
