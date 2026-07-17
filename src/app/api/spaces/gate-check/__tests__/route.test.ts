// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockCheckTokenGate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/spaces/tokenGate', () => ({ checkTokenGate: mockCheckTokenGate }));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1 };
const VALID_GATE_BODY = {
  walletAddress: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
  gateConfig: {
    type: 'erc721',
    contractAddress: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf34',
    chainId: 8453,
  },
};

describe('POST /api/spaces/gate-check', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/spaces/gate-check', VALID_GATE_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid chainId', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/spaces/gate-check', {
      ...VALID_GATE_BODY,
      gateConfig: { ...VALID_GATE_BODY.gateConfig, chainId: 999 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns allowed:true when the wallet passes the gate', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockCheckTokenGate.mockResolvedValue({ allowed: true, balance: '3' });
    const req = makePostRequest('/api/spaces/gate-check', VALID_GATE_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.balance).toBe('3');
  });

  it('returns 500 with allowed:false when checkTokenGate throws', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockCheckTokenGate.mockRejectedValue(new Error('RPC error'));
    const req = makePostRequest('/api/spaces/gate-check', VALID_GATE_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.allowed).toBe(false);
  });
});
