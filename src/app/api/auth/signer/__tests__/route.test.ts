import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockCreateSigner,
  mockRegisterSignedKey,
  mockLogger,
  mockCreateWalletClient,
  mockPrivateKeyToAccount,
  // SECURITY: This suite uses ONLY the public anvil stub key for testing, never a real key.
  STUB_PRIVATE_KEY,
  STUB_APP_SIGNER_ADDRESS,
} = vi.hoisted(() => {
  const stubPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const stubAppSignerAddress = '0xF39FD6E51AAD88F6F4CE6AB8827279CFFB92266';
  return {
    mockGetSessionData: vi.fn(),
    mockCreateSigner: vi.fn(),
    mockRegisterSignedKey: vi.fn(),
    mockLogger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
    mockCreateWalletClient: vi.fn(),
    mockPrivateKeyToAccount: vi.fn(),
    STUB_PRIVATE_KEY: stubPrivateKey,
    STUB_APP_SIGNER_ADDRESS: stubAppSignerAddress,
  };
});

// Mock viem — sign operations must never hit the network or perform real signing
vi.mock('viem', () => ({
  createWalletClient: mockCreateWalletClient,
  http: vi.fn(() => vi.fn()),
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: mockPrivateKeyToAccount,
}));

vi.mock('viem/chains', () => ({
  optimism: { id: 10, name: 'Optimism' },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  createSigner: mockCreateSigner,
  registerSignedKey: mockRegisterSignedKey,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock ENV — use stub key, never a real one
vi.mock('@/lib/env', () => {
  const stubKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  return {
    ENV: {
      APP_SIGNER_PRIVATE_KEY: stubKey,
      APP_FID: '19640',
      NEYNAR_API_KEY: 'test-neynar-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-key',
      SESSION_SECRET: 'test-session-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_NEYNAR_CLIENT_ID: 'test-client-id',
    },
  };
});

import { POST } from '../route';

describe('POST /api/auth/signer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock chain
    mockPrivateKeyToAccount.mockReturnValue({
      address: STUB_APP_SIGNER_ADDRESS,
    });

    mockCreateWalletClient.mockReturnValue({
      signTypedData: vi.fn(async () => '0xMOCK_SIGNATURE_BYTES_HERE'),
    });

    mockCreateSigner.mockResolvedValue({
      signer_uuid: 'mock-signer-uuid-1',
      public_key: '0xMOCK_PUBLIC_KEY_BYTES',
    });

    mockRegisterSignedKey.mockResolvedValue({
      signer_uuid: 'mock-signer-uuid-1',
      status: 'pending_review',
      signer_approval_url: 'https://neynar.com/signer-approval?uuid=mock-signer-uuid-1',
    });
  });

  describe('authentication', () => {
    it('returns 401 when session is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST();

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockCreateSigner).not.toHaveBeenCalled();
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST();

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockCreateSigner).not.toHaveBeenCalled();
      expect(mockRegisterSignedKey).not.toHaveBeenCalled();
    });
  });

  describe('early-exit: user already has approved signer', () => {
    it('returns existing signerUuid and status approved when user already has one', async () => {
      const sessionData = mockAuthenticatedSession({ signerUuid: 'existing-uuid-123' });
      mockGetSessionData.mockResolvedValue(sessionData);

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        signerUuid: 'existing-uuid-123',
        status: 'approved',
      });
      // Should not create a new signer
      expect(mockCreateSigner).not.toHaveBeenCalled();
      expect(mockRegisterSignedKey).not.toHaveBeenCalled();
    });
  });

  describe('signer creation', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('calls createSigner without arguments', async () => {
      await POST();

      expect(mockCreateSigner).toHaveBeenCalledWith();
      expect(mockCreateSigner).toHaveBeenCalledTimes(1);
    });

    it('returns 502 when createSigner returns missing signer_uuid', async () => {
      mockCreateSigner.mockResolvedValue({
        public_key: '0xPUBLIC_KEY',
        // signer_uuid missing
      });

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer creation returned invalid data' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'createSigner returned incomplete data: missing signer_uuid or public_key',
      );
    });

    it('returns 502 when createSigner returns missing public_key', async () => {
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-123',
        // public_key missing
      });

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer creation returned invalid data' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'createSigner returned incomplete data: missing signer_uuid or public_key',
      );
    });

    it('returns 502 when createSigner returns null', async () => {
      mockCreateSigner.mockResolvedValue(null);

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer creation returned invalid data' });
    });

    it('extracts signer_uuid and public_key from createSigner response', async () => {
      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'extracted-uuid-xyz',
        public_key: '0xEXTRACTED_PUBLIC_KEY',
      });

      await POST();

      // Verify they're passed to registerSignedKey
      expect(mockRegisterSignedKey).toHaveBeenCalledWith(
        'extracted-uuid-xyz',
        19640,
        expect.any(Number),
        expect.any(String),
      );
    });
  });

  describe('wallet client setup', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('calls privateKeyToAccount with APP_SIGNER_PRIVATE_KEY', async () => {
      await POST();

      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith(STUB_PRIVATE_KEY);
      expect(mockPrivateKeyToAccount).toHaveBeenCalledTimes(1);
    });

    it('calls createWalletClient with account and optimism chain', async () => {
      await POST();

      const callArgs = mockCreateWalletClient.mock.calls[0][0];
      expect(callArgs.account).toEqual({ address: STUB_APP_SIGNER_ADDRESS });
      expect(callArgs.chain).toEqual({ id: 10, name: 'Optimism' });
      expect(callArgs.transport).toBeDefined();
    });
  });

  describe('EIP-712 signing', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('calls signTypedData on wallet client', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE_BYTES');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      expect(mockSignTypedData).toHaveBeenCalledTimes(1);
    });

    it('signs EIP-712 SignedKeyRequest with correct domain config', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain).toEqual({
        name: 'Farcaster SignedKeyRequestValidator',
        version: '1',
        chainId: 10,
        verifyingContract: '0x00000000FC700472606ED4fA22623Acf62c60553',
      });
    });

    it('signs with correct SignedKeyRequest type schema', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.types.SignedKeyRequest).toEqual([
        { name: 'requestFid', type: 'uint256' },
        { name: 'key', type: 'bytes' },
        { name: 'deadline', type: 'uint256' },
      ]);
    });

    it('signs with primaryType SignedKeyRequest', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.primaryType).toBe('SignedKeyRequest');
    });

    it('constructs message with APP_FID (19640) as requestFid', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-1',
        public_key: '0xPUB',
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.requestFid).toBe(BigInt(19640));
    });

    it('constructs message with public_key from createSigner', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'uuid-1',
        public_key: '0xCUSTOM_PUBLIC_KEY_VALUE',
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.message.key).toBe('0xCUSTOM_PUBLIC_KEY_VALUE');
    });

    it('sets deadline to 24 hours in the future', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      const beforeTime = Math.floor(Date.now() / 1000);

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      const deadlineBigInt = callArgs.message.deadline;
      const deadline = Number(deadlineBigInt);

      expect(deadline).toBeGreaterThanOrEqual(beforeTime + 86400);
      expect(deadline).toBeLessThanOrEqual(beforeTime + 86400 + 10);
    });
  });

  describe('key registration', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('calls registerSignedKey with signer_uuid, app_fid, deadline, and signature', async () => {
      const mockSignTypedData = vi.fn(async () => '0xREGISTRATION_SIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'new-uuid-456',
        public_key: '0xPUBLIC',
      });

      await POST();

      expect(mockRegisterSignedKey).toHaveBeenCalledWith(
        'new-uuid-456',
        19640,
        expect.any(Number),
        '0xREGISTRATION_SIGNATURE',
      );
    });

    it('returns 502 when registerSignedKey returns missing signer_uuid', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        status: 'pending_review',
        signer_approval_url: 'https://example.com',
        // signer_uuid missing
      });

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Key registration returned invalid data' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'registerSignedKey returned incomplete data: missing required fields',
      );
    });

    it('returns 502 when registerSignedKey returns missing status', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'uuid-1',
        signer_approval_url: 'https://example.com',
        // status missing
      });

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Key registration returned invalid data' });
    });

    it('returns 502 when registerSignedKey returns missing signer_approval_url', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'uuid-1',
        status: 'pending_review',
        // signer_approval_url missing
      });

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Key registration returned invalid data' });
    });

    it('returns 502 when registerSignedKey returns null', async () => {
      mockRegisterSignedKey.mockResolvedValue(null);

      const res = await POST();

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body).toEqual({ error: 'Key registration returned invalid data' });
    });
  });

  describe('successful response', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('returns 200 with signer data on successful registration', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'final-uuid-789',
        status: 'pending_review',
        signer_approval_url: 'https://neynar.com/approve?uuid=final-uuid-789',
      });

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        signerUuid: 'final-uuid-789',
        status: 'pending_review',
        approvalUrl: 'https://neynar.com/approve?uuid=final-uuid-789',
      });
    });

    it('maps signer_approval_url from Neynar to approvalUrl in response', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'uuid-xyz',
        status: 'pending_review',
        signer_approval_url: 'https://custom-approval-url.example.com',
      });

      const res = await POST();

      const body = await res.json();
      expect(body.approvalUrl).toBe('https://custom-approval-url.example.com');
    });

    it('returns all possible status values correctly', async () => {
      const statuses = ['pending_review', 'approved', 'rejected', 'expired'];

      for (const status of statuses) {
        mockRegisterSignedKey.mockResolvedValue({
          signer_uuid: 'uuid-test',
          status,
          signer_approval_url: 'https://example.com',
        });

        const res = await POST();
        const body = await res.json();
        expect(body.status).toBe(status);
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('returns 500 when createSigner throws', async () => {
      mockCreateSigner.mockRejectedValue(new Error('Neynar API failed'));

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to create signer' });
      expect(mockLogger.error).toHaveBeenCalledWith('Signer creation error:', expect.any(Error));
    });

    it('returns 500 when registerSignedKey throws', async () => {
      mockRegisterSignedKey.mockRejectedValue(new Error('Key registration failed'));

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to create signer' });
      expect(mockLogger.error).toHaveBeenCalledWith('Signer creation error:', expect.any(Error));
    });

    it('returns 500 when walletClient.signTypedData throws', async () => {
      const mockSignTypedData = vi.fn().mockRejectedValue(new Error('Signing failed'));
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to create signer' });
    });

    it('returns 500 when privateKeyToAccount throws', async () => {
      mockPrivateKeyToAccount.mockImplementation(() => {
        throw new Error('Invalid private key');
      });

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to create signer' });
    });

    it('logs error details for debugging', async () => {
      const debugError = new Error('Debug error message');
      mockCreateSigner.mockRejectedValue(debugError);

      await POST();

      expect(mockLogger.error).toHaveBeenCalledWith('Signer creation error:', debugError);
    });

    it('returns 500 on network timeout', async () => {
      const timeoutError = new Error('ETIMEDOUT');
      mockRegisterSignedKey.mockRejectedValue(timeoutError);

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to create signer' });
    });
  });

  describe('request/response shape', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('accepts POST with no body', async () => {
      const res = await POST();

      expect(res.status).toBe(200);
    });

    it('responds with JSON', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'uuid-1',
        status: 'pending_review',
        signer_approval_url: 'https://example.com',
      });

      const res = await POST();

      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('response has no extra fields', async () => {
      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'uuid-1',
        status: 'pending_review',
        signer_approval_url: 'https://example.com',
      });

      const res = await POST();
      const body = await res.json();

      const expectedKeys = ['signerUuid', 'status', 'approvalUrl'];
      const actualKeys = Object.keys(body).sort();
      expect(actualKeys).toEqual(expectedKeys.sort());
    });
  });

  describe('security & constants', () => {
    beforeEach(() => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined });
      mockGetSessionData.mockResolvedValue(sessionData);
    });

    it('uses Optimism chain ID 10 (not mainnet)', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain.chainId).toBe(10);
    });

    it('uses correct SignedKeyRequestValidator contract address', async () => {
      const mockSignTypedData = vi.fn(async () => '0xSIGNATURE');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      await POST();

      const callArgs = mockSignTypedData.mock.calls[0][0];
      expect(callArgs.domain.verifyingContract).toBe('0x00000000FC700472606ED4fA22623Acf62c60553');
    });

    it('does not expose secrets in error responses', async () => {
      mockCreateSigner.mockRejectedValue(new Error('Neynar error'));

      const res = await POST();
      const body = await res.json();

      // Should not leak API keys, private keys, etc.
      expect(JSON.stringify(body)).not.toContain('NEYNAR_API_KEY');
      expect(JSON.stringify(body)).not.toContain('APP_SIGNER_PRIVATE_KEY');
      expect(JSON.stringify(body)).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });
  });

  describe('integration flow', () => {
    it('completes full flow: unauthenticated user -> create signer -> register key -> return approval URL', async () => {
      const sessionData = mockAuthenticatedSession({ signerUuid: undefined, fid: 9999 });
      mockGetSessionData.mockResolvedValue(sessionData);

      mockCreateSigner.mockResolvedValue({
        signer_uuid: 'integration-uuid',
        public_key: '0xINTEGRATION_KEY',
      });

      const mockSignTypedData = vi.fn(async () => '0xINTEGRATION_SIG');
      mockCreateWalletClient.mockReturnValue({
        signTypedData: mockSignTypedData,
      });

      mockRegisterSignedKey.mockResolvedValue({
        signer_uuid: 'integration-uuid',
        status: 'pending_review',
        signer_approval_url: 'https://neynar.com/signer?uuid=integration-uuid',
      });

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(mockCreateSigner).toHaveBeenCalledTimes(1);
      expect(mockPrivateKeyToAccount).toHaveBeenCalledTimes(1);
      expect(mockCreateWalletClient).toHaveBeenCalledTimes(1);
      expect(mockSignTypedData).toHaveBeenCalledTimes(1);
      expect(mockRegisterSignedKey).toHaveBeenCalledTimes(1);

      expect(body).toEqual({
        signerUuid: 'integration-uuid',
        status: 'pending_review',
        approvalUrl: 'https://neynar.com/signer?uuid=integration-uuid',
      });
    });
  });
});
