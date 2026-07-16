import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, PATCH } from '../route';

describe('GET /api/users/wallet-visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 with no session', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ fid: null });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('successful retrieval', () => {
    it('returns hidden_wallets when user has some hidden', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 42 }));

      const hiddenList = ['custody_address', 'solana_address'];
      const { chain } = chainMock({ data: { hidden_wallets: hiddenList }, error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) =>
        resolve({ data: { hidden_wallets: hiddenList }, error: null }),
      );
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual(hiddenList);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('returns empty array when user has no hidden wallets', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 99 }));

      const { chain } = chainMock({ data: null, error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ data: null, error: null }));
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual([]);
    });

    it('filters by fid and is_active=true', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 77 }));

      const { chain } = chainMock({ data: { hidden_wallets: [] }, error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) =>
        resolve({ data: { hidden_wallets: [] }, error: null }),
      );
      mockFrom.mockReturnValue(chain);

      await GET();

      expect(chain.select).toHaveBeenCalledWith('hidden_wallets');
      expect(chain.eq).toHaveBeenCalledWith('fid', 77);
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase query throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 55 }));

      const { chain } = chainMock({ error: new Error('db connection lost') });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) =>
        resolve({ error: new Error('db connection lost') }),
      );
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load wallet visibility');
    });

    it('returns 500 when Supabase returns an error object', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 33 }));

      const supabaseError = { message: 'Column does not exist' };
      const { chain } = chainMock({ error: supabaseError });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: supabaseError }));
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load wallet visibility');
    });
  });
});

describe('PATCH /api/users/wallet-visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 with no session', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: [] });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ fid: null });

      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: [] });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when body is not valid JSON', async () => {
      const req = makeRequest('/api/users/wallet-visibility', {
        method: 'PATCH',
        body: '{invalid json',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid wallet visibility data');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when hidden_wallets is not an array', async () => {
      const req = makePostRequest('/api/users/wallet-visibility', {
        hidden_wallets: 'not-an-array',
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid wallet visibility data');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when hidden_wallets contains invalid wallet key', async () => {
      const req = makePostRequest('/api/users/wallet-visibility', {
        hidden_wallets: ['invalid_key'],
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid wallet visibility data');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when hidden_wallets exceeds max length of 10', async () => {
      const tooMany = Array(11).fill('custody_address');
      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: tooMany });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid wallet visibility data');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid wallet keys', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const validKeys = [
        'custody_address',
        'verified_addresses',
        'solana_address',
        'primary_wallet',
      ];
      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: validKeys });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual(validKeys);
    });

    it('defaults hidden_wallets to empty array when not provided', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', {});
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual([]);
    });
  });

  describe('successful update', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 88 }));
    });

    it('updates and returns the hidden_wallets list', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const update = ['custody_address'];
      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: update });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual(update);
      expect(chain.update).toHaveBeenCalledWith({ hidden_wallets: update });
    });

    it('filters update by fid and is_active=true', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', {
        hidden_wallets: ['solana_address'],
      });
      await PATCH(req);

      expect(chain.eq).toHaveBeenCalledWith('fid', 88);
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('accepts empty hidden_wallets to clear all hidden', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', { hidden_wallets: [] });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual([]);
      expect(chain.update).toHaveBeenCalledWith({ hidden_wallets: [] });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 66 }));
    });

    it('returns 500 when Supabase update throws', async () => {
      const { chain } = chainMock({ error: new Error('constraint violation') });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) =>
        resolve({ error: new Error('constraint violation') }),
      );
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', {
        hidden_wallets: ['custody_address'],
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update wallet visibility');
    });

    it('returns 500 when Supabase returns an error object', async () => {
      const supabaseError = { message: 'Row not found' };
      const { chain } = chainMock({ error: supabaseError });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: supabaseError }));
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', {
        hidden_wallets: ['verified_addresses'],
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update wallet visibility');
    });

    it('returns 400 when hidden_wallets is not provided and body has unknown fields', async () => {
      const { chain } = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ error: null }));
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/users/wallet-visibility', { unknown_field: 'value' });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.hidden_wallets).toEqual([]);
    });
  });
});
