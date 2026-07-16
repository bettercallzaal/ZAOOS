import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

const { mockCreateSigner, mockRegisterUser, mockCheckAllowlist } = vi.hoisted(() => ({
  mockCreateSigner: vi.fn(),
  mockRegisterUser: vi.fn(),
  mockCheckAllowlist: vi.fn(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  createSigner: mockCreateSigner,
  registerUser: mockRegisterUser,
}));

vi.mock('@/lib/gates/allowlist', () => ({
  checkAllowlist: mockCheckAllowlist,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod validation: walletAddress', () => {
    it('returns 400 when walletAddress is missing', async () => {
      const req = makePostRequest('/api/auth/register', {
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string; details: unknown };
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when walletAddress is not a hex string', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: 'not-a-hex-address',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when walletAddress is missing 0x prefix', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when walletAddress has insufficient hex digits (39 instead of 40)', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef1234567',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when walletAddress has too many hex digits (41 instead of 40)', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef123456789',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid walletAddress with lowercase hex', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('accepts valid walletAddress with uppercase hex', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('accepts valid walletAddress with mixed case hex', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234AbCdEf1234567890aBcDeF1234567890AbCd',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Zod validation: signature', () => {
    it('returns 400 when signature is missing', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when signature is empty string', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('accepts non-empty signature', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'x',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Zod validation: deadline', () => {
    it('returns 400 when deadline is missing', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when deadline is not a number', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 'not-a-number',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when deadline is a float', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890.5,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when deadline is zero', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 0,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when deadline is negative', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: -1,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('accepts positive integer deadline', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('accepts large positive deadline', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 9999999999,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Zod validation: fname', () => {
    it('accepts missing fname (optional)', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('returns 400 when fname is empty string', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
        fname: '',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when fname exceeds 32 characters', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
        fname: 'a'.repeat(33),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Invalid input');
    });

    it('accepts fname with exactly 1 character', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
        fname: 'a',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('accepts fname with exactly 32 characters', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
        fname: 'a'.repeat(32),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Allowlist gate (checkAllowlist)', () => {
    it('returns 403 when checkAllowlist returns allowed: false', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as unknown as {
        error: string;
        redirect: string;
      };
      expect(body.error).toBe('Not on allowlist');
      expect(body.redirect).toBe('/not-allowed');
    });

    it('normalizes wallet address to lowercase before checking allowlist', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
        signature: 'sig123',
        deadline: 1234567890,
      });
      await POST(req);

      expect(mockCheckAllowlist).toHaveBeenCalledWith(
        undefined,
        '0xabcdef1234567890abcdef1234567890abcdef12',
      );
    });

    it('returns 500 when checkAllowlist throws an error', async () => {
      mockCheckAllowlist.mockRejectedValue(new Error('Database connection failed'));

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Registration failed');
    });
  });

  describe('registerUser call', () => {
    it('passes signature, normalized wallet, deadline, and fname to registerUser', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0xABCD1234567890ABCD1234567890ABCD12345678',
        signature: 'sig-data-123',
        deadline: 9876543210,
        fname: 'testuser',
      });
      await POST(req);

      expect(mockRegisterUser).toHaveBeenCalledWith(
        'sig-data-123',
        '0xabcd1234567890abcd1234567890abcd12345678',
        9876543210,
        'testuser',
      );
    });

    it('passes signature, normalized wallet, and deadline to registerUser when fname is not provided', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig-data-456',
        deadline: 1111111111,
      });
      await POST(req);

      expect(mockRegisterUser).toHaveBeenCalledWith(
        'sig-data-456',
        '0x1234567890abcdef1234567890abcdef12345678',
        1111111111,
        undefined,
      );
    });

    it('returns 500 when registerUser throws an error', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockRejectedValue(new Error('Neynar API error'));

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Registration failed');
    });
  });

  describe('createSigner call', () => {
    it('calls createSigner after successful registerUser', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      await POST(req);

      expect(mockCreateSigner).toHaveBeenCalled();
    });

    it('returns 500 when createSigner throws an error', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockRejectedValue(new Error('Signer creation failed'));

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Registration failed');
    });
  });

  describe('Response shape on success', () => {
    it('returns 200 with success response including signer data', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 12345 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-abc-123',
        status: 'approved',
        signer_approval_url: 'https://example.com/approve?sig=xyz',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown as {
        success: boolean;
        fid: number;
        signerUuid: string;
        signerStatus: string;
        signerApprovalUrl: string;
      };
      expect(body.success).toBe(true);
      expect(body.fid).toBe(12345);
      expect(body.signerUuid).toBe('uuid-abc-123');
      expect(body.signerStatus).toBe('approved');
      expect(body.signerApprovalUrl).toBe('https://example.com/approve?sig=xyz');
    });

    it('returns correct FID from registerUser response', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 99999 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        status: 'pending_approval',
        signer_approval_url: 'https://example.com/approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown as { fid: number };
      expect(body.fid).toBe(99999);
    });
  });

  describe('Error handling (top-level try/catch)', () => {
    it('returns 500 with generic error message on unhandled error', async () => {
      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });

      // Stub req.json() to throw an unhandled error
      const stub = req as unknown as { json: () => Promise<unknown> };
      stub.json = vi.fn(async () => {
        throw new Error('Unexpected JSON parse error');
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as unknown as { error: string };
      expect(body.error).toBe('Registration failed');
    });
  });

  describe('Integration: full registration flow', () => {
    it('successfully registers user and creates signer on allowlist', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockRegisterUser.mockResolvedValue({ fid: 54321 });
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'signer-uuid-final',
        status: 'approved',
        signer_approval_url: 'https://example.com/final-approve',
      });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0xFFFFFFFF90abcdef1234567890abcdef12345678',
        signature: 'complex-sig-data-xyz',
        deadline: 2000000000,
        fname: 'newmember',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown as {
        success: boolean;
        fid: number;
        signerUuid: string;
        signerStatus: string;
      };
      expect(body.success).toBe(true);
      expect(body.fid).toBe(54321);
      expect(body.signerUuid).toBe('signer-uuid-final');
      expect(body.signerStatus).toBe('approved');

      // Verify allowlist check was called with lowercase wallet
      expect(mockCheckAllowlist).toHaveBeenCalledWith(
        undefined,
        '0xffffffff90abcdef1234567890abcdef12345678',
      );

      // Verify registerUser was called with correct params
      expect(mockRegisterUser).toHaveBeenCalledWith(
        'complex-sig-data-xyz',
        '0xffffffff90abcdef1234567890abcdef12345678',
        2000000000,
        'newmember',
      );

      // Verify createSigner was called
      expect(mockCreateSigner).toHaveBeenCalled();
    });

    it('rejects registration when allowlist denies access', async () => {
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makePostRequest('/api/auth/register', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'sig123',
        deadline: 1234567890,
      });
      const res = await POST(req);

      expect(res.status).toBe(403);

      // registerUser and createSigner should not be called
      expect(mockRegisterUser).not.toHaveBeenCalled();
      expect(mockCreateSigner).not.toHaveBeenCalled();
    });
  });
});
