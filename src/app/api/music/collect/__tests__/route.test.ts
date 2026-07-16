import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST } from '@/app/api/music/collect/route';
import { makePostRequest } from '@/test-utils/api-helpers';

// ── Chainable Supabase mock helper ───────────────────────────────────────────
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

// ── Test fixtures ────────────────────────────────────────────────────────────
const assetTxId = 'test_tx_12345';
const assetId = 'asset_uuid_123';
const collectorFid = 456;

describe('POST /api/music/collect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session exists but fid is missing', async () => {
      mockGetSessionData.mockResolvedValue({ username: 'testuser' }); // no fid
      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('returns 400 when assetTxId is missing', async () => {
      const req = makePostRequest('/api/music/collect', {});

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when assetTxId is empty string', async () => {
      const req = makePostRequest('/api/music/collect', { assetTxId: '' });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when assetTxId is not a string', async () => {
      const req = makePostRequest('/api/music/collect', { assetTxId: 123 });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('ignores extra fields in request body', async () => {
      const asset = { id: assetId, collected_count: 0 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', {
        assetTxId,
        extraField: 'should be ignored',
        another: 'ignored too',
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Asset lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('returns 404 when asset not found', async () => {
      const assetChain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(assetChain);

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Asset not found');
    });

    it('queries arweave_assets by arweave_tx_id', async () => {
      const asset = { id: assetId, collected_count: 5 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('arweave_assets');
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const selectCall = (assetChain.select as any).mock.calls[0];
      expect(selectCall[0]).toBe('id, collected_count');
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const eqCall = (assetChain.eq as any).mock.calls[0];
      expect(eqCall[0]).toBe('arweave_tx_id');
      expect(eqCall[1]).toBe(assetTxId);
    });
  });

  describe('Duplicate collection check', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('returns 409 when asset already collected by user', async () => {
      const asset = { id: assetId, collected_count: 2 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: { id: 'existing_collection_id' }, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        return existingChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('Already collected');
    });

    it('checks arweave_collections with correct filters', async () => {
      const asset = { id: assetId, collected_count: 0 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('arweave_collections');
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const firstEqCall = (existingChain.eq as any).mock.calls[0];
      expect(firstEqCall[0]).toBe('asset_id');
      expect(firstEqCall[1]).toBe(assetId);
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const secondEqCall = (existingChain.eq as any).mock.calls[1];
      expect(secondEqCall[0]).toBe('collector_fid');
      expect(secondEqCall[1]).toBe(collectorFid);
    });
  });

  describe('Successful collection', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('creates collection record with correct data', async () => {
      const asset = { id: assetId, collected_count: 3 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('arweave_collections');
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const insertCall = (insertChain.insert as any).mock.calls[0];
      expect(insertCall[0]).toEqual({
        asset_id: assetId,
        collector_fid: collectorFid,
        collector_address: '',
      });
    });

    it('increments collected_count on asset', async () => {
      const asset = { id: assetId, collected_count: 10 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      // Verify update was called on arweave_assets
      const updateCalls = mockFrom.mock.calls.filter((call) => call[0] === 'arweave_assets');
      expect(updateCalls.length).toBeGreaterThan(0);
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const updateCall = (updateChain.update as any).mock.calls[0];
      expect(updateCall[0]).toEqual({ collected_count: 11 });
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const updateEqCall = (updateChain.eq as any).mock.calls[0];
      expect(updateEqCall[0]).toBe('id');
      expect(updateEqCall[1]).toBe(assetId);
    });

    it('handles collected_count as null/undefined with fallback to 0', async () => {
      const asset = { id: assetId, collected_count: null };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collectedCount).toBe(1);
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const updateCall = (updateChain.update as any).mock.calls[0];
      expect(updateCall[0]).toEqual({ collected_count: 1 });
    });

    it('returns success response with incremented collected count', async () => {
      const asset = { id: assetId, collected_count: 7 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.collectedCount).toBe(8);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('returns 500 when asset lookup throws', async () => {
      const errorChain: Record<string, unknown> = {};
      errorChain.select = vi.fn().mockReturnValue(errorChain);
      errorChain.eq = vi.fn().mockReturnValue(errorChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      errorChain.then = vi.fn().mockRejectedValue(new Error('DB connection failed'));
      mockFrom.mockReturnValue(errorChain);

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Collection failed');
    });

    it('returns 500 when insert throws', async () => {
      const asset = { id: assetId, collected_count: 0 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });

      // insertChain for arweave_collections call
      const insertChain: Record<string, unknown> = {};
      insertChain.insert = vi.fn().mockImplementation(() => {
        throw new Error('Insert failed');
      });
      const insertFromChain: Record<string, unknown> = {};
      insertFromChain.from = vi.fn().mockReturnValue(insertChain);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        // For the insert call, throw
        throw new Error('Insert failed');
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Collection failed');
    });

    it('returns 500 when update throws', async () => {
      const asset = { id: assetId, collected_count: 0 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        // For the 4th call (update), throw an error
        throw new Error('Update failed');
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Collection failed');
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: collectorFid });
    });

    it('works with very large collected_count', async () => {
      const asset = { id: assetId, collected_count: 999999 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.collectedCount).toBe(1000000);
    });

    it('works with special characters in assetTxId', async () => {
      const specialTxId = 'tx_!@#$%^&*()_+-={}[]|:;<>,.?/~`';
      const asset = { id: assetId, collected_count: 0 };
      const assetChain = chainMock({ data: asset, error: null });
      const existingChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: { id: 'collection_id' }, error: null });
      const updateChain = chainMock({ data: asset, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return assetChain;
        if (callCount === 2) return existingChain;
        if (callCount === 3) return insertChain;
        return updateChain;
      });

      const req = makePostRequest('/api/music/collect', { assetTxId: specialTxId });

      const res = await POST(req);

      expect(res.status).toBe(200);
      // biome-ignore lint/suspicious/noExplicitAny: accessing mock.calls in test
      const eqCall = (assetChain.eq as any).mock.calls[0];
      expect(eqCall[1]).toBe(specialTxId);
    });
  });
});
