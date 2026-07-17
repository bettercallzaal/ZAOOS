// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSession: mockGetSession }));

const mockRunAPO = vi.hoisted(() => vi.fn());
vi.mock('@/lib/apo/engine', () => ({ runAPO: mockRunAPO }));

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

const ADMIN_SESSION = { isAdmin: true };
const NON_ADMIN_SESSION = { isAdmin: false };
const VALID_BODY = { promptName: 'rag' };
const MOCK_CONFIG = { name: 'RAG', description: 'rag', maxRounds: 3, testCases: [] };

describe('POST /api/admin/apo/run', () => {
  it('returns 401 when user is not admin', async () => {
    mockGetSession.mockResolvedValue(NON_ADMIN_SESSION);
    const req = makePostRequest('/api/admin/apo/run', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (missing promptName)', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION);
    const req = makePostRequest('/api/admin/apo/run', { rounds: 3 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when prompt config not found on disk', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION);
    mockExistsSync.mockReturnValue(false);
    const req = makePostRequest('/api/admin/apo/run', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns APO result on success', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION);
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(MOCK_CONFIG));
    mockRunAPO.mockResolvedValue({ optimizedPrompt: 'Better prompt', score: 0.95 });
    const req = makePostRequest('/api/admin/apo/run', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.score).toBe(0.95);
  });
});
