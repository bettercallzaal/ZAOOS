// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockVerify = vi.hoisted(() => vi.fn());
vi.mock('tweetnacl', () => ({
  default: { sign: { detached: { verify: mockVerify } } },
}));

vi.mock('bs58', () => ({
  default: { decode: vi.fn().mockReturnValue(new Uint8Array(32)) },
}));

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockEqChain = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { DELETE, GET, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10 };
// Valid Solana address format (base58, 32-44 chars)
const VALID_WALLET = 'So11111111111111111111111111111111111111112';
const VALID_SIG = 'So11111111111111111111111111111111111111112';

describe('GET /api/users/solana-wallet', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns solana_wallet from database', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockMaybeSingle.mockResolvedValue({ data: { solana_wallet: VALID_WALLET }, error: null });
    mockEqChain.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEq.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: mockEq }) });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.solana_wallet).toBe(VALID_WALLET);
  });
});

describe('POST /api/users/solana-wallet', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/users/solana-wallet', {
      wallet: VALID_WALLET,
      signature: VALID_SIG,
      message: `Link wallet ${VALID_WALLET}`,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid wallet address', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/users/solana-wallet', {
      wallet: 'invalid!address',
      signature: VALID_SIG,
      message: 'msg',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature is invalid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockVerify.mockReturnValue(false);
    const req = makePostRequest('/api/users/solana-wallet', {
      wallet: VALID_WALLET,
      signature: VALID_SIG,
      message: `Link wallet ${VALID_WALLET}`,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns solana_wallet on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockVerify.mockReturnValue(true);
    mockEqChain.mockReturnValue({ error: null });
    mockEq.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: mockEq }) });
    const req = makePostRequest('/api/users/solana-wallet', {
      wallet: VALID_WALLET,
      signature: VALID_SIG,
      message: `Link wallet ${VALID_WALLET}`,
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.solana_wallet).toBe(VALID_WALLET);
  });
});

describe('DELETE /api/users/solana-wallet', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it('returns solana_wallet:null on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockEqChain.mockReturnValue({ error: null });
    mockEq.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: mockEq }) });
    const res = await DELETE();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.solana_wallet).toBeNull();
  });
});
