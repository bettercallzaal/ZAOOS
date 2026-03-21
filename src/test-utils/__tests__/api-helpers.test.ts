import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  makeRequest,
  makeGetRequest,
  makePostRequest,
  chainMock,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  mockAdminSession,
  createHoistedMocks,
  createNotificationsMock,
  VALID_UUID,
  VALID_WALLET,
} from '@/test-utils';

// ---------------------------------------------------------------------------
// makeRequest
// ---------------------------------------------------------------------------

describe('makeRequest', () => {
  it('creates a NextRequest with the given path', () => {
    const req = makeRequest('/api/proposals');
    expect(req).toBeInstanceOf(NextRequest);
    expect(req.url).toBe('http://localhost:3000/api/proposals');
  });

  it('forwards RequestInit options (method, body)', () => {
    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    expect(req.method).toBe('POST');
  });

  it('defaults to GET when no options are provided', () => {
    const req = makeRequest('/api/members');
    expect(req.method).toBe('GET');
  });
});

// ---------------------------------------------------------------------------
// makeGetRequest
// ---------------------------------------------------------------------------

describe('makeGetRequest', () => {
  it('creates a GET request with search params', () => {
    const req = makeGetRequest('/api/proposals/comment', {
      proposal_id: VALID_UUID,
    });
    expect(req.url).toContain(`proposal_id=${VALID_UUID}`);
    expect(req.method).toBe('GET');
  });

  it('works without params', () => {
    const req = makeGetRequest('/api/proposals');
    expect(req.url).toBe('http://localhost:3000/api/proposals');
  });
});

// ---------------------------------------------------------------------------
// makePostRequest
// ---------------------------------------------------------------------------

describe('makePostRequest', () => {
  it('creates a POST request with JSON body', async () => {
    const payload = { title: 'Test', description: 'Desc' };
    const req = makePostRequest('/api/proposals', payload);
    expect(req.method).toBe('POST');
    const body = await req.json();
    expect(body).toEqual(payload);
  });
});

// ---------------------------------------------------------------------------
// chainMock
// ---------------------------------------------------------------------------

describe('chainMock', () => {
  it('returns a chain where every chained method returns the chain', () => {
    const { chain } = chainMock({ data: [1], error: null });
    // Chaining should not throw and should return the chain itself
    const result = chain.select('*');
    expect(result).toBe(chain);
    expect(chain.eq('id', 1)).toBe(chain);
    expect(chain.order('created_at')).toBe(chain);
  });

  it('resolves .single() with the provided result', async () => {
    const expected = { data: { id: 'p1' }, error: null };
    const { chain } = chainMock(expected);
    const result = await chain.single();
    expect(result).toEqual(expected);
  });

  it('resolves when awaited directly via .then()', async () => {
    const expected = { data: [1, 2, 3], error: null, count: 3 };
    const { chain } = chainMock(expected);
    // Simulate: const result = await supabaseAdmin.from('t').select('*')
    const result = await new Promise((resolve) => chain.then(resolve));
    expect(result).toEqual(expected);
  });

  it('provides a handler function that returns the chain', () => {
    const { chain, handler } = chainMock({ data: null, error: null });
    expect(handler()).toBe(chain);
  });

  it('includes insert, update, upsert, and delete methods', () => {
    const { chain } = chainMock({ data: null, error: null });
    expect(chain.insert).toBeDefined();
    expect(chain.update).toBeDefined();
    expect(chain.upsert).toBeDefined();
    expect(chain.delete).toBeDefined();
  });

  it('includes comparison methods (neq, in, not, gt, lt, like, ilike)', () => {
    const { chain } = chainMock({ data: null, error: null });
    expect(chain.neq('status', 'closed')).toBe(chain);
    expect(chain.in('id', ['a', 'b'])).toBe(chain);
    expect(chain.not('deleted', 'is', null)).toBe(chain);
    expect(chain.gt('score', 10)).toBe(chain);
    expect(chain.lt('score', 100)).toBe(chain);
    expect(chain.like('name', '%test%')).toBe(chain);
    expect(chain.ilike('name', '%test%')).toBe(chain);
  });
});

// ---------------------------------------------------------------------------
// Session factories
// ---------------------------------------------------------------------------

describe('mockAuthenticatedSession', () => {
  it('returns default session with fid, username, isAdmin: false', () => {
    const session = mockAuthenticatedSession();
    expect(session.fid).toBe(123);
    expect(session.username).toBe('testuser');
    expect(session.isAdmin).toBe(false);
  });

  it('merges overrides', () => {
    const session = mockAuthenticatedSession({ fid: 999, username: 'custom' });
    expect(session.fid).toBe(999);
    expect(session.username).toBe('custom');
    expect(session.isAdmin).toBe(false);
  });
});

describe('mockUnauthenticatedSession', () => {
  it('returns null', () => {
    expect(mockUnauthenticatedSession()).toBeNull();
  });
});

describe('mockAdminSession', () => {
  it('returns session with isAdmin: true', () => {
    const session = mockAdminSession();
    expect(session.isAdmin).toBe(true);
    expect(session.username).toBe('admin');
  });

  it('merges overrides while keeping isAdmin: true', () => {
    const session = mockAdminSession({ fid: 456 });
    expect(session.fid).toBe(456);
    expect(session.isAdmin).toBe(true);
  });

  it('allows overriding isAdmin to false if explicitly passed', () => {
    const session = mockAdminSession({ isAdmin: false });
    expect(session.isAdmin).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('VALID_UUID is a valid UUID v4', () => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(VALID_UUID).toMatch(uuidPattern);
  });

  it('VALID_WALLET is a 42-char hex address', () => {
    expect(VALID_WALLET).toMatch(/^0x[0-9a-f]{40}$/);
  });
});

// ---------------------------------------------------------------------------
// Mock setup helpers
// ---------------------------------------------------------------------------

describe('createHoistedMocks', () => {
  it('returns mockGetSessionData and mockFrom as mock functions', () => {
    const mocks = createHoistedMocks();
    expect(mocks.mockGetSessionData).toBeDefined();
    expect(mocks.mockFrom).toBeDefined();
    expect(typeof mocks.mockGetSessionData.mockResolvedValue).toBe('function');
    expect(typeof mocks.mockFrom.mockReturnValue).toBe('function');
  });
});

describe('createNotificationsMock', () => {
  it('returns mock functions for createInAppNotification and sendNotification', () => {
    const mock = createNotificationsMock();
    expect(mock.createInAppNotification).toBeDefined();
    expect(mock.sendNotification).toBeDefined();
  });

  it('mock functions resolve to undefined', async () => {
    const mock = createNotificationsMock();
    await expect(mock.createInAppNotification()).resolves.toBeUndefined();
    await expect(mock.sendNotification()).resolves.toBeUndefined();
  });
});
