import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeRequest } from '@/test-utils/api-helpers';

const { mockRunWeeklyReflection } = vi.hoisted(() => ({
  mockRunWeeklyReflection: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/memory-recall', () => ({
  runWeeklyReflection: mockRunWeeklyReflection,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const CRON_SECRET = 'test-secret-key';

describe('POST /api/cron/weekly-reflection', () => {
  let POST: typeof import('../route').POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    vi.resetModules();
    const route = await import('../route');
    POST = route.POST;
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when authorization header is missing', async () => {
    const membersChain = chainMock({
      data: [
        { fid: 1, username: 'user1' },
        { fid: 2, username: 'user2' },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: {},
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header is empty', async () => {
    const membersChain = chainMock({
      data: [{ fid: 1, username: 'user1' }],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: '' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when bearer token is incorrect', async () => {
    const membersChain = chainMock({
      data: [{ fid: 1, username: 'user1' }],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization scheme is not Bearer', async () => {
    const membersChain = chainMock({
      data: [{ fid: 1, username: 'user1' }],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Basic ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  // ========================================================================
  // Supabase member fetch tests
  // ========================================================================

  it('returns 500 when supabase member fetch errors', async () => {
    const membersChain = chainMock({
      data: null,
      error: new Error('Database error'),
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to fetch members' });
  });

  it('queries members table with correct filters', async () => {
    const membersChain = chainMock({
      data: [{ fid: 1, username: 'user1' }],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);
    mockRunWeeklyReflection.mockResolvedValue('reflection text');

    const insertChain = chainMock({
      data: { id: 1 },
      error: null,
    });
    mockFrom.mockReturnValueOnce(membersChain.chain);
    mockFrom.mockReturnValueOnce(insertChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(membersChain.chain.select).toHaveBeenCalledWith('fid, username');
    expect(membersChain.chain.eq).toHaveBeenCalledWith('status', 'active');
  });

  // ========================================================================
  // Success path tests
  // ========================================================================

  it('processes reflections for all active members successfully', async () => {
    const members = [
      { fid: 1, username: 'user1' },
      { fid: 2, username: 'user2' },
      { fid: 3, username: 'user3' },
    ];

    const membersChain = chainMock({
      data: members,
      error: null,
    });

    const insertChain = chainMock({
      data: { id: 1 },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return membersChain.chain;
      return insertChain.chain;
    });

    mockRunWeeklyReflection.mockResolvedValue('taste profile reflection');

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      processed: 3,
      failed: 0,
      errors: [],
    });

    expect(mockRunWeeklyReflection).toHaveBeenCalledTimes(3);
    expect(mockRunWeeklyReflection).toHaveBeenCalledWith('1');
    expect(mockRunWeeklyReflection).toHaveBeenCalledWith('2');
    expect(mockRunWeeklyReflection).toHaveBeenCalledWith('3');
  });

  it('handles empty member list', async () => {
    const membersChain = chainMock({
      data: [],
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      processed: 0,
      failed: 0,
      errors: [],
    });

    expect(mockRunWeeklyReflection).not.toHaveBeenCalled();
  });

  it('handles null members array', async () => {
    const membersChain = chainMock({
      data: null,
      error: null,
    });
    mockFrom.mockReturnValue(membersChain.chain);

    // Need to re-mock since data is null not an array
    const actualChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // biome-ignore lint/suspicious/noThenProperty: Intentionally creating a thenable for await
      then: vi.fn((_unknown_resolve: unknown) => {
        const resolve = _unknown_resolve as (val: unknown) => void;
        return resolve({ data: null, error: null });
      }),
    };
    mockFrom.mockReturnValue(actualChain as unknown as Record<string, unknown>);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      processed: 0,
      failed: 0,
      errors: [],
    });
  });

  it('stores reflection with correct user_fid and timestamp', async () => {
    const members = [{ fid: 123, username: 'testuser' }];
    const reflectionText = 'synthesized taste profile';

    const membersChain = chainMock({
      data: members,
      error: null,
    });

    const insertChain = chainMock({
      data: { id: 1 },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return membersChain.chain;
      return insertChain.chain;
    });

    mockRunWeeklyReflection.mockResolvedValue(reflectionText);

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.processed).toBe(1);

    expect(insertChain.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_fid: 123,
        reflection_text: reflectionText,
        reflected_at: expect.any(String),
      }),
    );
  });

  // ========================================================================
  // Partial failure tests
  // ========================================================================

  it('continues processing after reflection error for one member', async () => {
    const members = [
      { fid: 1, username: 'user1' },
      { fid: 2, username: 'user2' },
    ];

    const membersChain = chainMock({
      data: members,
      error: null,
    });

    const insertChain = chainMock({
      data: { id: 1 },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return membersChain.chain;
      return insertChain.chain;
    });

    mockRunWeeklyReflection
      .mockRejectedValueOnce(new Error('Hindsight unavailable'))
      .mockResolvedValueOnce('reflection for user 2');

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.processed).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain('User 1');
    expect(body.errors[0]).toContain('Hindsight unavailable');
  });

  it('continues processing after insertion error for one member', async () => {
    const members = [
      { fid: 1, username: 'user1' },
      { fid: 2, username: 'user2' },
    ];

    const membersChain = chainMock({
      data: members,
      error: null,
    });

    const insertChainError = chainMock({
      data: null,
      error: new Error('Unique constraint violation'),
    });

    const insertChainSuccess = chainMock({
      data: { id: 2 },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return membersChain.chain;
      if (callCount === 2) return insertChainError.chain;
      return insertChainSuccess.chain;
    });

    mockRunWeeklyReflection
      .mockResolvedValueOnce('reflection for user 1')
      .mockResolvedValueOnce('reflection for user 2');

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.processed).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain('User 1');
    expect(body.errors[0]).toContain('failed to store reflection');
  });

  it('increments failed and collects errors for all failing members', async () => {
    const members = [
      { fid: 1, username: 'user1' },
      { fid: 2, username: 'user2' },
      { fid: 3, username: 'user3' },
    ];

    const membersChain = chainMock({
      data: members,
      error: null,
    });

    const insertChain = chainMock({
      data: null,
      error: new Error('Insert failed'),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return membersChain.chain;
      return insertChain.chain;
    });

    mockRunWeeklyReflection.mockResolvedValue('reflection text');

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(3);
    expect(body.errors).toHaveLength(3);
  });

  // ========================================================================
  // Unexpected error tests
  // ========================================================================

  it('returns 500 and logs error when outer try/catch catches exception', async () => {
    mockFrom.mockRejectedValue(new Error('Supabase connection error'));

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Weekly reflection cron failed' });
  });

  it('handles non-Error exception thrown during processing', async () => {
    mockFrom.mockRejectedValue('string error');

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'Weekly reflection cron failed' });
  });

  // ========================================================================
  // Env var tests
  // ========================================================================

  it('returns 500 when CRON_SECRET is not configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('CRON_SECRET', '');
    vi.resetModules();
    const route = await import('../route');
    POST = route.POST;

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'POST',
      headers: { authorization: 'Bearer some-secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'CRON_SECRET not configured' });
  });
});

describe('GET /api/cron/weekly-reflection', () => {
  let GET: typeof import('../route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    vi.resetModules();
    const route = await import('../route');
    GET = route.GET;
  });

  it('returns 401 when authorization header is missing', async () => {
    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'GET',
      headers: {},
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when bearer token is incorrect', async () => {
    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong-secret' },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 200 with status ok and schedule on success', async () => {
    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      status: 'ok',
      schedule: 'Sunday 18:00 UTC',
    });
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('CRON_SECRET', '');
    vi.resetModules();
    const route = await import('../route');
    GET = route.GET;

    const req = makeRequest('/api/cron/weekly-reflection', {
      method: 'GET',
      headers: { authorization: 'Bearer some-secret' },
    });

    const res = await GET(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: 'CRON_SECRET not configured' });
  });
});
