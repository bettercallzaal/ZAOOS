// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSession: mockGetSession }));

const mockReaddirSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
vi.mock('fs', () => ({
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

describe('GET /api/admin/apo/prompts', () => {
  it('returns 401 when user is not admin', async () => {
    mockGetSession.mockResolvedValue({ isAdmin: false });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns list of prompts parsed from disk', async () => {
    mockGetSession.mockResolvedValue({ isAdmin: true });
    mockReaddirSync.mockReturnValue(['rag.json', 'music.json']);
    mockReadFileSync
      .mockReturnValueOnce(JSON.stringify({ name: 'RAG', description: 'rag prompts', testCases: [1, 2] }))
      .mockReturnValueOnce(JSON.stringify({ name: 'Music', description: 'music prompts', testCases: [] }));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.prompts).toHaveLength(2);
    expect(body.prompts[0].name).toBe('RAG');
    expect(body.prompts[0].testCaseCount).toBe(2);
    expect(body.prompts[1].name).toBe('Music');
    expect(body.prompts[1].testCaseCount).toBe(0);
  });

  it('filters out non-.json files', async () => {
    mockGetSession.mockResolvedValue({ isAdmin: true });
    mockReaddirSync.mockReturnValue(['rag.json', 'README.md', 'notes.txt']);
    mockReadFileSync.mockReturnValue(JSON.stringify({ name: 'RAG', description: 'd', testCases: [1] }));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.prompts).toHaveLength(1);
  });

  it('returns 500 when filesystem throws', async () => {
    mockGetSession.mockResolvedValue({ isAdmin: true });
    mockReaddirSync.mockImplementation(() => { throw new Error('ENOENT: no such file or directory'); });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
