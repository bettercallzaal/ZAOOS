import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockRevalidatePath } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSessionData() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));

import { DELETE, GET, PUT } from '../route';

const SESSION_FID = 123;

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'update', 'eq']) c[m] = vi.fn().mockReturnValue(c);
  c.maybeSingle = vi.fn().mockResolvedValue(result);
  // Update chains are awaited directly.
  // biome-ignore lint/suspicious/noThenProperty: a Supabase query builder is awaited directly
  (c as unknown as { then: unknown }).then = (resolve: (value: unknown) => void) => resolve(result);
  return c;
}

const put = (body: unknown) =>
  new Request('http://localhost/api/members/me/public-profile', {
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/members/me/public-profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: SESSION_FID }));
  });

  describe.each([
    ['GET', () => GET()],
    ['PUT', () => PUT(put({ name: 'Ally', fields: [] }))],
    ['DELETE', () => DELETE()],
  ])('%s auth', (_method, call) => {
    it('401 with no session and no database access', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await call();
      expect(res.status).toBe(401);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('401 for a wallet session with no fid', async () => {
      mockGetSessionData.mockResolvedValue({ fid: 0 });
      const res = await call();
      expect(res.status).toBe(401);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  it('GET returns the owner state and flags empty fields', async () => {
    mockFrom.mockReturnValue(
      chain({
        data: {
          id: 'member-id',
          public_name: 'Ally',
          public_fields: ['bio', 'retired_field'],
          username: 'alice',
          bio: 'hi',
        },
        error: null,
      }),
    );
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(body.name).toBe('Ally');
    expect(body.fields).toEqual(['bio']);
    expect(body.empty).toContain('x');
    expect(body.empty).not.toContain('bio');
    expect(body.id).toBe('member-id');
    expect(body.username).toBe('alice');
  });

  it('GET defaults to opted out', async () => {
    mockFrom.mockReturnValue(chain({ data: { public_name: null, public_fields: null } }));
    const body = await (await GET()).json();
    expect(body.name).toBe('');
    expect(body.fields).toEqual([]);
  });

  it('PUT writes only to the session member', async () => {
    const c = chain({ data: [{ fid: SESSION_FID }], error: null });
    mockFrom.mockReturnValue(c);
    const res = await PUT(put({ name: ' Ally ', fields: ['bio', 'bio'] }));
    expect(res.status).toBe(200);
    expect(c.update).toHaveBeenCalledWith({ public_name: 'Ally', public_fields: ['bio'] });
    expect(c.eq).toHaveBeenCalledWith('fid', SESSION_FID);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/members');
  });

  it.each([
    ['another member fid', { name: 'Ally', fields: [], fid: 999 }],
    ['no name', { fields: ['bio'] }],
    ['blank name', { name: '   ', fields: [] }],
    ['unknown field', { name: 'Ally', fields: ['lastLoginAt'] }],
    ['malformed json', '{nope'],
  ])('PUT 400 on %s, with no write', async (_label, body) => {
    const res = await PUT(put(body));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('PUT 404 when no active row matches the session', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));
    const res = await PUT(put({ name: 'Ally', fields: [] }));
    expect(res.status).toBe(404);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('DELETE clears the name and every toggle for the session member', async () => {
    const c = chain({ error: null });
    mockFrom.mockReturnValue(c);
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(c.update).toHaveBeenCalledWith({ public_name: null, public_fields: [] });
    expect(c.eq).toHaveBeenCalledWith('fid', SESSION_FID);
  });

  describe.each([
    ['GET', () => GET()],
    ['PUT', () => PUT(put({ name: 'Ally', fields: [] }))],
    ['DELETE', () => DELETE()],
  ])('%s failures', (_method, call) => {
    it('503 before the migration is applied', async () => {
      mockFrom.mockReturnValue(chain({ data: null, error: { code: '42703' } }));
      const res = await call();
      expect(res.status).toBe(503);
      expect((await res.json()).error).toBe('Public profiles are not switched on yet');
    });

    it('500 with a sanitized message on a database error', async () => {
      mockFrom.mockReturnValue(chain({ data: null, error: { code: 'XX000', message: 'secret' } }));
      const res = await call();
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain('secret');
    });
  });
});
