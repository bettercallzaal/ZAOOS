import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClipMetadata, ClipStage } from '@/lib/autocliper';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockListClipsByStage, mockGetDraftStats } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockListClipsByStage: vi.fn(),
  mockGetDraftStats: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/autocliper', () => ({
  listClipsByStage: (...args: unknown[]) => mockListClipsByStage(...args),
  getDraftStats: () => mockGetDraftStats(),
}));

import { GET } from '../route';

/** Factory for creating mock ClipMetadata objects */
function createMockClip(overrides?: Partial<ClipMetadata>): ClipMetadata {
  return {
    id: 'clip-001',
    sourceUrl: 'https://example.com/video',
    sourceType: 'stream',
    title: 'Test Clip',
    description: 'A test clip',
    createdAt: new Date().toISOString(),
    stage: 'draft',
    stagedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('GET /api/autocliper/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockListClipsByStage.mockReturnValue([]);
    mockGetDraftStats.mockReturnValue({
      total: 0,
      byStage: { draft: 0, approved: 0, published: 0, rejected: 0 },
    });
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/autocliper/drafts'));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
      expect(mockListClipsByStage).not.toHaveBeenCalled();
      expect(mockGetDraftStats).not.toHaveBeenCalled();
    });

    it('succeeds with an authenticated session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const res = await GET(makeGetRequest('/api/autocliper/drafts'));

      expect(res.status).toBe(200);
      expect(mockListClipsByStage).toHaveBeenCalled();
    });
  });

  describe('stage parameter handling', () => {
    it('returns all clips when no stage parameter is provided', async () => {
      const draftClip = createMockClip({ id: 'draft-1', stage: 'draft' });
      const approvedClip = createMockClip({ id: 'approved-1', stage: 'approved' });
      const publishedClip = createMockClip({ id: 'published-1', stage: 'published' });
      const rejectedClip = createMockClip({ id: 'rejected-1', stage: 'rejected' });

      mockListClipsByStage.mockImplementation((stage: ClipStage) => {
        const stageMap: Record<ClipStage, ClipMetadata[]> = {
          draft: [draftClip],
          approved: [approvedClip],
          published: [publishedClip],
          rejected: [rejectedClip],
        };
        return stageMap[stage];
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts'));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.clips)).toBe(true);
      expect((body.clips as unknown[]).length).toBe(4);
      expect(mockListClipsByStage).toHaveBeenCalledTimes(4);
      expect(mockListClipsByStage).toHaveBeenNthCalledWith(1, 'draft');
      expect(mockListClipsByStage).toHaveBeenNthCalledWith(2, 'approved');
      expect(mockListClipsByStage).toHaveBeenNthCalledWith(3, 'published');
      expect(mockListClipsByStage).toHaveBeenNthCalledWith(4, 'rejected');
    });

    it('returns only draft stage clips when ?stage=draft', async () => {
      const draftClip = createMockClip({ id: 'draft-1', stage: 'draft' });
      mockListClipsByStage.mockReturnValue([draftClip]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.clips)).toBe(true);
      expect((body.clips as unknown[]).length).toBe(1);
      expect(mockListClipsByStage).toHaveBeenCalledTimes(1);
      expect(mockListClipsByStage).toHaveBeenCalledWith('draft');
    });

    it('returns only approved stage clips when ?stage=approved', async () => {
      const approvedClip = createMockClip({ id: 'approved-1', stage: 'approved' });
      mockListClipsByStage.mockReturnValue([approvedClip]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'approved' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.clips as unknown[]).length).toBe(1);
      expect(mockListClipsByStage).toHaveBeenCalledWith('approved');
    });

    it('returns only published stage clips when ?stage=published', async () => {
      const publishedClip = createMockClip({ id: 'published-1', stage: 'published' });
      mockListClipsByStage.mockReturnValue([publishedClip]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'published' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.clips as unknown[]).length).toBe(1);
      expect(mockListClipsByStage).toHaveBeenCalledWith('published');
    });

    it('returns only rejected stage clips when ?stage=rejected', async () => {
      const rejectedClip = createMockClip({ id: 'rejected-1', stage: 'rejected' });
      mockListClipsByStage.mockReturnValue([rejectedClip]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'rejected' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.clips as unknown[]).length).toBe(1);
      expect(mockListClipsByStage).toHaveBeenCalledWith('rejected');
    });

    it('returns 400 when stage parameter is invalid', async () => {
      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'invalid-stage' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(String(body.error)).toContain('Invalid stage: invalid-stage');
      expect(mockListClipsByStage).not.toHaveBeenCalled();
    });

    it('treats empty string stage as no stage parameter (returns all clips)', async () => {
      const draftClip = createMockClip({ id: 'draft-1', stage: 'draft' });
      const approvedClip = createMockClip({ id: 'approved-1', stage: 'approved' });

      mockListClipsByStage.mockImplementation((stage: ClipStage) => {
        const stageMap: Record<ClipStage, ClipMetadata[]> = {
          draft: [draftClip],
          approved: [approvedClip],
          published: [],
          rejected: [],
        };
        return stageMap[stage];
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: '' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      // Should call listClipsByStage 4 times (once per stage)
      expect(mockListClipsByStage).toHaveBeenCalledTimes(4);
    });

    it('rejects stage parameter with special characters', async () => {
      const res = await GET(
        makeGetRequest('/api/autocliper/drafts', { stage: 'draft; DROP TABLE' }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('response shape', () => {
    it('includes success, clips, stats, and count in response', async () => {
      const clip1 = createMockClip({ id: 'clip-1', stage: 'draft' });
      const clip2 = createMockClip({ id: 'clip-2', stage: 'draft' });

      mockListClipsByStage.mockImplementation((stage: ClipStage) => {
        if (stage === 'draft') return [clip1, clip2];
        return [];
      });

      mockGetDraftStats.mockReturnValue({
        total: 2,
        byStage: { draft: 2, approved: 0, published: 0, rejected: 0 },
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.success).toBe(true);
      expect(Array.isArray(body.clips)).toBe(true);
      expect(body.stats).toBeDefined();
      expect(body.count).toBe(2);
    });

    it('includes accurate count of clips returned', async () => {
      const clips = [
        createMockClip({ id: 'clip-1', stage: 'draft' }),
        createMockClip({ id: 'clip-2', stage: 'draft' }),
        createMockClip({ id: 'clip-3', stage: 'draft' }),
      ];

      mockListClipsByStage.mockReturnValue(clips);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.count).toBe(3);
      expect((body.clips as unknown[]).length).toBe(3);
    });

    it('returns stats with all stages when all stages requested', async () => {
      const stats = {
        total: 10,
        byStage: { draft: 3, approved: 2, published: 4, rejected: 1 },
      };

      mockGetDraftStats.mockReturnValue(stats);
      mockListClipsByStage.mockReturnValue([]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts'));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.stats).toEqual(stats);
    });
  });

  describe('error handling', () => {
    it('returns 500 when listClipsByStage throws', async () => {
      mockListClipsByStage.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(String(body.error)).toContain('Database connection failed');
    });

    it('returns 500 when getDraftStats throws', async () => {
      mockListClipsByStage.mockReturnValue([]);
      mockGetDraftStats.mockImplementation(() => {
        throw new Error('Stats aggregation failed');
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(String(body.error)).toContain('Stats aggregation failed');
    });

    it('returns 500 with generic message for unknown errors', async () => {
      mockListClipsByStage.mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'not an error object';
      });

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'draft' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unknown error');
    });
  });

  describe('clip data preservation', () => {
    it('preserves clip metadata in response', async () => {
      const clip = createMockClip({
        id: 'clip-123',
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Great Moment',
        description: 'A great moment from the stream',
        tags: ['important', 'viral'],
        mentions: ['@user1', '@user2'],
        stage: 'approved',
      });

      mockListClipsByStage.mockReturnValue([clip]);

      const res = await GET(makeGetRequest('/api/autocliper/drafts', { stage: 'approved' }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      const returnedClips = body.clips as unknown[];
      expect(returnedClips.length).toBe(1);
      const returnedClip = returnedClips[0] as Record<string, unknown>;
      expect(returnedClip.id).toBe('clip-123');
      expect(returnedClip.title).toBe('Great Moment');
      expect(returnedClip.sourceType).toBe('stream');
      expect(returnedClip.tags).toEqual(['important', 'viral']);
    });
  });
});
