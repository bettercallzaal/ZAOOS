import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const { mockRunVault } = vi.hoisted(() => ({
  mockRunVault: vi.fn(),
}));

vi.mock('@/lib/agents/vault', () => ({
  runVault: mockRunVault,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/cron/agents/vault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-secret-vault');
  });

  describe('environment configuration', () => {
    it('returns 500 when CRON_SECRET is not configured', async () => {
      vi.stubEnv('CRON_SECRET', '');
      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('CRON_SECRET not configured');
    });
  });

  describe('bearer token authentication', () => {
    it('returns 401 when authorization header is missing', async () => {
      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when authorization header has wrong token', async () => {
      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer wrong-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when authorization header lacks Bearer prefix', async () => {
      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('accepts correct Bearer token', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Purchased 5 ZABAL tokens',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockRunVault).toHaveBeenCalled();
    });
  });

  describe('vault agent execution', () => {
    it('calls runVault on successful authentication', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Trade executed',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      await GET(req);

      expect(mockRunVault).toHaveBeenCalledOnce();
    });

    it('returns 200 with agent result on success', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Purchased 2.5 ZABAL at $0.50',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.agent).toBe('VAULT');
      expect(body.action).toBe('buy_zabal');
      expect(body.status).toBe('success');
      expect(body.details).toBe('Purchased 2.5 ZABAL at $0.50');
    });

    it('includes timestamp in response', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Trade succeeded',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
      // Verify it's a valid ISO string
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });

    it('handles runVault returning skipped status', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'skipped',
        details: 'Budget exceeded',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('skipped');
      expect(body.details).toBe('Budget exceeded');
    });

    it('handles runVault returning failed status', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'failed',
        details: 'Insufficient wallet balance',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('failed');
      expect(body.details).toBe('Insufficient wallet balance');
    });
  });

  describe('error handling', () => {
    it('returns 500 when runVault throws an Error', async () => {
      mockRunVault.mockRejectedValueOnce(new Error('Swap failed: slippage exceeded'));

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.agent).toBe('VAULT');
      expect(body.action).toBe('buy_zabal');
      expect(body.status).toBe('failed');
      expect(body.details).toContain('Unhandled: Swap failed: slippage exceeded');
    });

    it('returns 500 and logs error when runVault throws', async () => {
      const mockLogger = await import('@/lib/logger');
      const mockError = vi.spyOn(mockLogger.logger, 'error');

      mockRunVault.mockRejectedValueOnce(new Error('Network timeout'));

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining('[VAULT cron] Unhandled error'),
      );
    });

    it('handles non-Error thrown values gracefully', async () => {
      // eslint-disable-next-line no-throw-literal
      mockRunVault.mockRejectedValueOnce('String error');

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.agent).toBe('VAULT');
      expect(body.status).toBe('failed');
      expect(body.details).toContain('Unhandled: String error');
    });

    it('includes timestamp in error response', async () => {
      mockRunVault.mockRejectedValueOnce(new Error('Trade execution failed'));

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
    });
  });

  describe('response format', () => {
    it('includes agent name in all responses', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Success',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.agent).toBe('VAULT');
    });

    it('spreads runVault result into response', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'Test details',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.action).toBe('buy_zabal');
      expect(body.status).toBe('success');
      expect(body.details).toBe('Test details');
    });

    it('response is valid JSON', async () => {
      mockRunVault.mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'OK',
      });

      const req = makeRequest('/api/cron/agents/vault', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret-vault' },
      });
      const res = await GET(req);

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });
});
