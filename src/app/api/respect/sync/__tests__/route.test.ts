import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';
import { POST } from '../route';

// ── Hoisted Mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockReadMemberBalances } = vi.hoisted(() => ({
  mockReadMemberBalances: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const { mockCreatePublicClient, mockHttp, mockParseAbi } = vi.hoisted(() => ({
  mockCreatePublicClient: vi.fn(),
  mockHttp: vi.fn(),
  mockParseAbi: vi.fn(),
}));

// ── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/respect/onchainBalances', () => ({
  readMemberBalances: mockReadMemberBalances,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('viem', () => ({
  createPublicClient: mockCreatePublicClient,
  http: mockHttp,
  parseAbi: mockParseAbi,
}));

vi.mock('viem/chains', () => ({
  optimism: { id: 10, name: 'Optimism' },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/respect/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for viem
    mockParseAbi.mockImplementation((abi) => abi);
    mockHttp.mockReturnValue({});
    mockCreatePublicClient.mockReturnValue({
      multicall: vi.fn(),
    });
  });

  describe('Authorization', () => {
    it('returns 401 when session is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST();

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 403 when session is authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));

      const res = await POST();

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: 'Admin access required' });
    });
  });

  describe('Member fetch', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns error 500 when supabase fetch fails', async () => {
      const membersError = { message: 'Connection failed' };
      const membersChain = chainMock({ error: membersError });
      mockFrom.mockReturnValue(membersChain.chain);

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to fetch members' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch respect_members:',
        membersError,
      );
    });

    it('returns synced: 0 when no members exist', async () => {
      const membersChain = chainMock({ data: [] });
      mockFrom.mockReturnValue(membersChain.chain);

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        synced: 0,
        message: 'No members with wallet addresses',
      });
    });

    it('returns synced: 0 when all members have null wallet_address', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: null },
        { id: '2', name: 'Bob', wallet_address: null },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        synced: 0,
        message: 'No valid wallet addresses to sync',
      });
    });

    it('filters out members with invalid wallet addresses (not 0x-prefixed)', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1234567890abcdef1234567890abcdef12345678' },
        { id: '2', name: 'Bob', wallet_address: 'invalid_address' },
        { id: '3', name: 'Charlie', wallet_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) },
        { status: 'success', result: BigInt(5) },
        { status: 'success', result: BigInt(200) },
        { status: 'success', result: BigInt(10) },
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 100,
          onchainZor: 5,
          failed: [],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        });

      // Set up update chains
      const updateChain1 = chainMock({ error: null });
      const updateChain2 = chainMock({ error: null });
      mockFrom
        .mockReturnValueOnce(membersChain.chain) // select call
        .mockReturnValueOnce(updateChain1.chain) // first update
        .mockReturnValueOnce(updateChain2.chain); // second update

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(2);
      expect(body.total).toBe(2); // Only valid wallets
    });
  });

  describe('On-chain balance sync', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('successfully syncs balances for all valid members', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
        { id: '2', name: 'Bob', wallet_address: '0x2222222222222222222222222222222222222222' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) }, // Alice OG
        { status: 'success', result: BigInt(5) }, // Alice ZOR
        { status: 'success', result: BigInt(200) }, // Bob OG
        { status: 'success', result: BigInt(10) }, // Bob ZOR
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 100,
          onchainZor: 5,
          failed: [],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        });

      // Set up update chains
      const updateChain1 = chainMock({ error: null });
      const updateChain2 = chainMock({ error: null });
      mockFrom
        .mockReturnValueOnce(membersChain.chain) // select call
        .mockReturnValueOnce(updateChain1.chain) // first update
        .mockReturnValueOnce(updateChain2.chain); // second update

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        synced: 2,
        total: 2,
      });
    });

    it('skips members with failed on-chain reads', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
        { id: '2', name: 'Bob', wallet_address: '0x2222222222222222222222222222222222222222' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'failure' }, // Alice OG failed
        { status: 'success', result: BigInt(5) }, // Alice ZOR OK
        { status: 'success', result: BigInt(200) }, // Bob OG OK
        { status: 'success', result: BigInt(10) }, // Bob ZOR OK
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: false,
          onchainOg: 0,
          onchainZor: 5,
          failed: ['og'],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        });

      // Set up update chains
      const updateChain1 = chainMock({ error: null });
      mockFrom
        .mockReturnValueOnce(membersChain.chain) // select call
        .mockReturnValueOnce(updateChain1.chain); // only Bob's update

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(1);
      expect(body.total).toBe(2);
      expect(body.skipped).toEqual(['Alice (og read failed)']);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('skipped 1 members'));
    });

    it('handles multiple failed reads for the same member', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'failure' }, // Alice OG failed
        { status: 'failure' }, // Alice ZOR failed
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances.mockReturnValueOnce({
        complete: false,
        onchainOg: 0,
        onchainZor: 0,
        failed: ['og', 'zor'],
      });

      mockFrom.mockReturnValueOnce(membersChain.chain); // select call

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(0);
      expect(body.skipped).toEqual(['Alice (og,zor read failed)']);
    });

    it('continues syncing when one member update fails', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
        { id: '2', name: 'Bob', wallet_address: '0x2222222222222222222222222222222222222222' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) }, // Alice OG
        { status: 'success', result: BigInt(5) }, // Alice ZOR
        { status: 'success', result: BigInt(200) }, // Bob OG
        { status: 'success', result: BigInt(10) }, // Bob ZOR
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 100,
          onchainZor: 5,
          failed: [],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        });

      // Alice's update fails, Bob's succeeds
      const updateChain1 = chainMock({ error: { message: 'DB constraint error' } });
      const updateChain2 = chainMock({ error: null });
      mockFrom
        .mockReturnValueOnce(membersChain.chain) // select call
        .mockReturnValueOnce(updateChain1.chain) // Alice update fails
        .mockReturnValueOnce(updateChain2.chain); // Bob update succeeds

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(1);
      expect(body.total).toBe(2);
      expect(body.errors).toEqual(['Alice: DB constraint error']);
    });

    it('includes both errors and skipped in response', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
        { id: '2', name: 'Bob', wallet_address: '0x2222222222222222222222222222222222222222' },
        { id: '3', name: 'Charlie', wallet_address: '0x3333333333333333333333333333333333333333' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'failure' }, // Alice OG failed
        { status: 'success', result: BigInt(5) }, // Alice ZOR OK
        { status: 'success', result: BigInt(200) }, // Bob OG OK
        { status: 'success', result: BigInt(10) }, // Bob ZOR OK
        { status: 'success', result: BigInt(300) }, // Charlie OG OK
        { status: 'success', result: BigInt(15) }, // Charlie ZOR OK
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: false,
          onchainOg: 0,
          onchainZor: 5,
          failed: ['og'],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 300,
          onchainZor: 15,
          failed: [],
        });

      // Bob's update fails, Charlie's succeeds
      const updateChain1 = chainMock({ error: { message: 'Network error' } });
      const updateChain2 = chainMock({ error: null });
      mockFrom
        .mockReturnValueOnce(membersChain.chain) // select call
        .mockReturnValueOnce(updateChain1.chain) // Bob update fails
        .mockReturnValueOnce(updateChain2.chain); // Charlie update succeeds

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(1);
      expect(body.total).toBe(3);
      expect(body.skipped).toContain('Alice (og read failed)');
      expect(body.errors).toContain('Bob: Network error');
    });
  });

  describe('Multicall construction', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('builds correct multicall structure with OG and ZOR calls per member', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) },
        { status: 'success', result: BigInt(5) },
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances.mockReturnValueOnce({
        complete: true,
        onchainOg: 100,
        onchainZor: 5,
        failed: [],
      });

      const updateChain = chainMock({ error: null });
      mockFrom.mockReturnValueOnce(membersChain.chain).mockReturnValueOnce(updateChain.chain);

      await POST();

      expect(mockMulticall).toHaveBeenCalledWith({
        contracts: expect.arrayContaining([
          expect.objectContaining({
            functionName: 'balanceOf',
            args: ['0x1111111111111111111111111111111111111111'],
          }),
        ]),
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns 500 and logs error when multicall throws', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockRejectedValue(new Error('RPC connection failed'));
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      const res = await POST();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to sync on-chain balances' });
      expect(mockLogger.error).toHaveBeenCalledWith('Respect sync error:', expect.any(Error));
    });

    it('gracefully handles supabase update promise rejection via Promise.allSettled', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
        { id: '2', name: 'Bob', wallet_address: '0x2222222222222222222222222222222222222222' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) },
        { status: 'success', result: BigInt(5) },
        { status: 'success', result: BigInt(200) },
        { status: 'success', result: BigInt(10) },
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 100,
          onchainZor: 5,
          failed: [],
        })
        .mockReturnValueOnce({
          complete: true,
          onchainOg: 200,
          onchainZor: 10,
          failed: [],
        });

      // Alice's update rejects (caught by Promise.allSettled, not thrown)
      const aliceUpdateChain = chainMock({ error: null });
      // biome-ignore lint/suspicious/noThenProperty: testing thenable rejection behavior
      aliceUpdateChain.chain.then = vi
        .fn()
        .mockImplementation(() => Promise.reject(new Error('Supabase connection lost')));

      const bobUpdateChain = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(membersChain.chain)
        .mockReturnValueOnce(aliceUpdateChain.chain)
        .mockReturnValueOnce(bobUpdateChain.chain);

      const res = await POST();

      // Route returns 200 even though Alice's update rejected (Promise.allSettled absorbs it)
      expect(res.status).toBe(200);
      const body = await res.json();
      // Bob is synced, Alice is not counted (her rejection was silently absorbed)
      expect(body.synced).toBe(1);
      expect(body.total).toBe(2);
    });
  });

  describe('Response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('omits skipped and errors when both are empty', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) },
        { status: 'success', result: BigInt(5) },
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances.mockReturnValueOnce({
        complete: true,
        onchainOg: 100,
        onchainZor: 5,
        failed: [],
      });

      const updateChain = chainMock({ error: null });
      mockFrom.mockReturnValueOnce(membersChain.chain).mockReturnValueOnce(updateChain.chain);

      const res = await POST();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        synced: 1,
        total: 1,
      });
      expect(body.skipped).toBeUndefined();
      expect(body.errors).toBeUndefined();
    });

    it('includes skipped when present', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi
        .fn()
        .mockResolvedValue([{ status: 'failure' }, { status: 'failure' }]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances.mockReturnValueOnce({
        complete: false,
        onchainOg: 0,
        onchainZor: 0,
        failed: ['og', 'zor'],
      });

      mockFrom.mockReturnValueOnce(membersChain.chain);

      const res = await POST();

      const body = await res.json();
      expect(body.skipped).toBeDefined();
      expect(body.errors).toBeUndefined();
    });

    it('includes errors when present', async () => {
      const members = [
        { id: '1', name: 'Alice', wallet_address: '0x1111111111111111111111111111111111111111' },
      ];
      const membersChain = chainMock({ data: members });
      mockFrom.mockReturnValue(membersChain.chain);

      const mockMulticall = vi.fn().mockResolvedValue([
        { status: 'success', result: BigInt(100) },
        { status: 'success', result: BigInt(5) },
      ]);
      mockCreatePublicClient.mockReturnValue({ multicall: mockMulticall });

      mockReadMemberBalances.mockReturnValueOnce({
        complete: true,
        onchainOg: 100,
        onchainZor: 5,
        failed: [],
      });

      const updateChain = chainMock({ error: { message: 'Update failed' } });
      mockFrom.mockReturnValueOnce(membersChain.chain).mockReturnValueOnce(updateChain.chain);

      const res = await POST();

      const body = await res.json();
      expect(body.errors).toBeDefined();
      expect(body.skipped).toBeUndefined();
    });
  });
});
