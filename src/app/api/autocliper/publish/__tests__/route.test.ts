import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClipMetadata, PostizPostResponse } from '@/lib/autocliper';
import { makePostRequest } from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockValidateRequest,
  mockGetClipDraft,
  mockPublishClipDraft,
  mockPostToPostiz,
  mockBuildCaption,
  mockPostizConfig,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockValidateRequest: vi.fn(),
  mockGetClipDraft: vi.fn(),
  mockPublishClipDraft: vi.fn(),
  mockPostToPostiz: vi.fn(),
  mockBuildCaption: vi.fn(),
  mockPostizConfig: {
    apiKey: 'test-key',
    baseUrl: 'https://api.postiz.com/public/v1',
    platforms: ['warpcast', 'x', 'bluesky', 'discord'] as const,
    rateLimitPerHour: 90,
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/autocliper', () => ({
  validateRequest: mockValidateRequest,
  getClipDraft: mockGetClipDraft,
  publishClipDraft: mockPublishClipDraft,
  postToPostiz: mockPostToPostiz,
  buildCaption: mockBuildCaption,
  postizConfig: mockPostizConfig,
  PublishRequestSchema: { parse: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/autocliper/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildCaption.mockReturnValue('Test caption');
  });

  // ========================================================================
  // Authentication tests
  // ========================================================================

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makePostRequest('/api/autocliper/publish', {
      clipId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session is undefined (safety check)', async () => {
    mockGetSessionData.mockResolvedValue(undefined);

    const req = makePostRequest('/api/autocliper/publish', {
      clipId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  // ========================================================================
  // Validation tests
  // ========================================================================

  it('returns 400 when validation fails with error message', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const invalidBody = { clipId: 'not-a-uuid' };
    const validationError = 'clipId: Invalid UUID format';

    mockValidateRequest.mockReturnValue({
      success: false,
      error: validationError,
    });

    const req = makePostRequest('/api/autocliper/publish', invalidBody);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe(validationError);
  });

  it('returns 400 when clipId is missing from validation', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const invalidBody = {};
    mockValidateRequest.mockReturnValue({
      success: false,
      error: 'clipId: Required',
    });

    const req = makePostRequest('/api/autocliper/publish', invalidBody);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('clipId: Required');
  });

  it('returns 400 when multiple validation errors occur', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const invalidBody = { clipId: 'bad', platforms: 'not-array' };
    mockValidateRequest.mockReturnValue({
      success: false,
      error: 'clipId: Invalid UUID; platforms: Expected array',
    });

    const req = makePostRequest('/api/autocliper/publish', invalidBody);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('clipId: Invalid UUID');
  });

  // ========================================================================
  // Clip not found tests
  // ========================================================================

  it('returns 404 when clip draft does not exist', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    mockGetClipDraft.mockReturnValue(undefined);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip not found');
    expect(body.error).toContain(clipId);
  });

  it('returns 404 when getClipDraft returns null', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    mockGetClipDraft.mockReturnValue(null);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip not found');
  });

  // ========================================================================
  // Clip stage validation tests
  // ========================================================================

  it('returns 400 when clip is not in approved stage (draft)', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const draftClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'draft',
      stagedAt: new Date().toISOString(),
    };

    mockGetClipDraft.mockReturnValue(draftClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip must be approved');
    expect(body.error).toContain('draft');
  });

  it('returns 400 when clip is in published stage', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const publishedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'published',
      stagedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    mockGetClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip must be approved');
    expect(body.error).toContain('published');
  });

  it('returns 400 when clip is in rejected stage', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const rejectedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'rejected',
      stagedAt: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
    };

    mockGetClipDraft.mockReturnValue(rejectedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip must be approved');
    expect(body.error).toContain('rejected');
  });

  // ========================================================================
  // Generated clips validation tests
  // ========================================================================

  it('returns 400 when clip has no generated clips', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('No generated clips');
  });

  it('returns 400 when clip has no ready clip found', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: false,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('No ready clip found');
  });

  // ========================================================================
  // Platform fallback tests
  // ========================================================================

  it('uses default platforms from postizConfig when none provided', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, platforms: undefined },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      clip: ClipMetadata;
      postizResponse: PostizPostResponse;
    };
    expect(body.success).toBe(true);
    expect(mockPostToPostiz).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: ['warpcast', 'x', 'bluesky', 'discord'],
      }),
    );
  });

  it('uses provided platforms when specified in request', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, platforms: ['warpcast', 'x'] },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: null,
        discord: null,
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', {
      clipId,
      platforms: ['warpcast', 'x'],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockPostToPostiz).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: ['warpcast', 'x'],
      }),
    );
  });

  it('uses default platforms when empty array provided', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, platforms: [] },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', {
      clipId,
      platforms: [],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // When empty array is provided, should use defaults
    expect(mockPostToPostiz).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: ['warpcast', 'x', 'bluesky', 'discord'],
      }),
    );
  });

  // ========================================================================
  // Success path tests
  // ========================================================================

  it('returns 200 and publishes clip on valid request', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'A test clip for publishing',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Amazing moment',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      clip: ClipMetadata;
      postizResponse: PostizPostResponse;
      message: string;
    };
    expect(body.success).toBe(true);
    expect(body.clip.stage).toBe('published');
    expect(body.postizResponse.id).toBe('post-123');
    expect(body.message).toContain('Clip published');
  });

  it('calls buildCaption with correct parameters', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Amazing Clip',
      description: 'This is an amazing clip',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Great moment',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    await POST(req);

    expect(mockBuildCaption).toHaveBeenCalledWith('Amazing Clip', 'Great moment', 300);
  });

  it('calls postToPostiz with video attachment and clip URL', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const videoUrl = 'https://example.com/clips/clip-1.mp4';
    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: videoUrl,
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    await POST(req);

    expect(mockPostToPostiz).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            type: 'video',
            url: videoUrl,
            altText: 'Test Clip',
          },
        ],
      }),
    );
  });

  it('calls publishClipDraft with postizResponse.id', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    const postizId = 'post-999';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: postizId,
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: postizId,
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    await POST(req);

    expect(mockPublishClipDraft).toHaveBeenCalledWith(clipId, postizId);
  });

  it('includes platforms in success message', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, platforms: ['warpcast', 'x'] },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: null,
        discord: null,
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', {
      clipId,
      platforms: ['warpcast', 'x'],
    });

    const res = await POST(req);

    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('warpcast');
    expect(body.message).toContain('x');
  });

  // ========================================================================
  // Postiz error handling tests
  // ========================================================================

  it('returns 503 when postToPostiz throws an error', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizError = new Error('Postiz API rate limit exceeded');
    mockPostToPostiz.mockRejectedValue(postizError);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Postiz API rate limit exceeded');
  });

  it('handles non-Error thrown from postToPostiz gracefully', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    mockPostToPostiz.mockRejectedValue('String error instead of Error object');

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Postiz error');
  });

  // ========================================================================
  // General error handling tests
  // ========================================================================

  it('returns 500 when getSessionData throws an error', async () => {
    mockGetSessionData.mockRejectedValue(new Error('Session error'));

    const req = makePostRequest('/api/autocliper/publish', {
      clipId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Session error');
  });

  it('returns 500 when request.json() throws an error', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const badRequest = new Request('http://localhost:3000/api/autocliper/publish', {
      method: 'POST',
      body: 'invalid json',
    });

    const res = await POST(badRequest as unknown as Request);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
  });

  it('returns 500 when getClipDraft throws an error', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    mockGetClipDraft.mockImplementation(() => {
      throw new Error('Database error on getClipDraft');
    });

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Database error');
  });

  it('logs error to console when exception occurs', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    mockGetClipDraft.mockImplementation(() => {
      throw new Error('Test error message');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/publish]', 'Test error message');

    consoleSpy.mockRestore();
  });

  it('handles non-Error thrown values gracefully', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    mockGetClipDraft.mockImplementation(() => {
      throw 'String error instead of Error object';
    });

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unknown error');
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('handles clip with multiple generated clips (finds first ready one)', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const readyClipUrl = 'https://example.com/clips/clip-2.mp4';
    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Not ready',
          generatedAt: new Date().toISOString(),
          ready: false,
        },
        {
          id: 'gc2',
          filename: 'clip-2.mp4',
          path: '/clips/clip-2.mp4',
          url: readyClipUrl,
          startSecond: 25,
          endSecond: 35,
          durationSeconds: 10,
          aspectRatio: '9:16',
          filesize: 6000000,
          caption: 'Ready caption',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
        {
          id: 'gc3',
          filename: 'clip-3.mp4',
          path: '/clips/clip-3.mp4',
          url: 'https://example.com/clips/clip-3.mp4',
          startSecond: 40,
          endSecond: 50,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 7000000,
          caption: 'Also not ready',
          generatedAt: new Date().toISOString(),
          ready: false,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    await POST(req);

    expect(mockPostToPostiz).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            url: readyClipUrl,
          }),
        ],
      }),
    );
  });

  it('response includes complete ApiResponse structure', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const approvedClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Test Clip',
      description: 'Test',
      createdAt: new Date().toISOString(),
      stage: 'approved',
      stagedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedClips: [
        {
          id: 'gc1',
          filename: 'clip-1.mp4',
          path: '/clips/clip-1.mp4',
          url: 'https://example.com/clips/clip-1.mp4',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          aspectRatio: '16:9',
          filesize: 5000000,
          caption: 'Test',
          generatedAt: new Date().toISOString(),
          ready: true,
        },
      ],
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const postizResponse: PostizPostResponse = {
      id: 'post-123',
      scheduled: {
        warpcast: {
          platform: 'warpcast',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        x: { platform: 'x', scheduledAt: new Date().toISOString(), status: 'scheduled' },
        bluesky: {
          platform: 'bluesky',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
        discord: {
          platform: 'discord',
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        },
      },
    };

    mockPostToPostiz.mockResolvedValue(postizResponse);

    const publishedClip: ClipMetadata = {
      ...approvedClip,
      stage: 'published',
      publishedAt: new Date().toISOString(),
      postizPostId: 'post-123',
    };

    mockPublishClipDraft.mockReturnValue(publishedClip);

    const req = makePostRequest('/api/autocliper/publish', { clipId });

    const res = await POST(req);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('clip');
    expect(body).toHaveProperty('postizResponse');
    expect(body).toHaveProperty('message');
    expect(typeof body.success).toBe('boolean');
    expect(typeof body.message).toBe('string');
  });
});
