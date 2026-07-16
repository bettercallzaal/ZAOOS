import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClipMetadata } from '@/lib/autocliper';
import { makePostRequest } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockValidateRequest, mockGetClipDraft, mockApproveClipDraft } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockValidateRequest: vi.fn(),
    mockGetClipDraft: vi.fn(),
    mockApproveClipDraft: vi.fn(),
  }));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/autocliper', () => ({
  validateRequest: mockValidateRequest,
  getClipDraft: mockGetClipDraft,
  approveClipDraft: mockApproveClipDraft,
  ApprovalRequestSchema: { parse: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/autocliper/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Authentication tests
  // ========================================================================

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = makePostRequest('/api/autocliper/approve', {
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

    const req = makePostRequest('/api/autocliper/approve', {
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

    const req = makePostRequest('/api/autocliper/approve', invalidBody);

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

    const req = makePostRequest('/api/autocliper/approve', invalidBody);

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

    const req = makePostRequest('/api/autocliper/approve', invalidBody);

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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Clip not found');
  });

  // ========================================================================
  // Clip stage validation tests
  // ========================================================================

  it('returns 400 when clip is not in draft stage', async () => {
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
    };

    mockGetClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('not a draft');
    expect(body.error).toContain('approved');
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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('not a draft');
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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('not a draft');
    expect(body.error).toContain('rejected');
  });

  // ========================================================================
  // Success path tests
  // ========================================================================

  it('returns 200 and calls approveClipDraft on valid request', async () => {
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
      description: 'A test clip for approval',
      createdAt: new Date().toISOString(),
      stage: 'draft',
      stagedAt: new Date().toISOString(),
    };

    mockGetClipDraft.mockReturnValue(draftClip);

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; clip: ClipMetadata; message: string };
    expect(body.success).toBe(true);
    expect(body.clip.stage).toBe('approved');
    expect(body.message).toBe('Clip approved for publishing');
    expect(mockApproveClipDraft).toHaveBeenCalledWith(clipId);
  });

  it('returns 200 with approved clip metadata including approvedAt timestamp', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    const approvedAtTime = new Date().toISOString();

    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId },
    });

    const draftClip: ClipMetadata = {
      id: clipId,
      sourceUrl: 'https://example.com/video',
      sourceType: 'stream',
      title: 'Premium Content',
      description: 'High value clip',
      createdAt: new Date().toISOString(),
      stage: 'draft',
      stagedAt: new Date().toISOString(),
    };

    mockGetClipDraft.mockReturnValue(draftClip);

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: approvedAtTime,
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; clip: ClipMetadata; message: string };
    expect(body.clip.approvedAt).toBe(approvedAtTime);
    expect(body.clip.title).toBe('Premium Content');
    expect(body.clip.description).toBe('High value clip');
  });

  it('accepts optional platforms parameter in request body', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, platforms: ['warpcast', 'x'] },
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

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', {
      clipId,
      platforms: ['warpcast', 'x'],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; clip: ClipMetadata };
    expect(body.success).toBe(true);
  });

  it('accepts optional approvedBy parameter in request body', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, approvedBy: 'admin-user' },
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

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', {
      clipId,
      approvedBy: 'admin-user',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; clip: ClipMetadata };
    expect(body.success).toBe(true);
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  it('returns 500 when getSessionData throws an error', async () => {
    mockGetSessionData.mockRejectedValue(new Error('Session error'));

    const req = makePostRequest('/api/autocliper/approve', {
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

    const badRequest = new Request('http://localhost:3000/api/autocliper/approve', {
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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Database error');
  });

  it('returns 500 when approveClipDraft throws an error', async () => {
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

    mockApproveClipDraft.mockImplementation(() => {
      throw new Error('Failed to approve clip');
    });

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to approve clip');
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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/approve]', 'Test error message');

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

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unknown error');
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('extracts clipId correctly from validated data record', async () => {
    const session = { fid: 123, username: 'testuser' };
    mockGetSessionData.mockResolvedValue(session);

    const clipId = '550e8400-e29b-41d4-a716-446655440000';
    mockValidateRequest.mockReturnValue({
      success: true,
      data: { clipId, extraField: 'ignored' },
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

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockGetClipDraft).toHaveBeenCalledWith(clipId);
  });

  it('handles clip with full metadata including highlights and generated clips', async () => {
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
      highlights: [
        {
          id: 'h1',
          startSecond: 10,
          endSecond: 20,
          durationSeconds: 10,
          score: 0.95,
          reason: 'High engagement moment',
        },
      ],
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

    mockGetClipDraft.mockReturnValue(draftClip);

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; clip: ClipMetadata };
    expect(body.clip.highlights).toHaveLength(1);
    expect(body.clip.generatedClips).toHaveLength(1);
  });

  it('response includes correct ApiResponse structure', async () => {
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

    const approvedClip: ClipMetadata = {
      ...draftClip,
      stage: 'approved',
      approvedAt: new Date().toISOString(),
    };

    mockApproveClipDraft.mockReturnValue(approvedClip);

    const req = makePostRequest('/api/autocliper/approve', { clipId });

    const res = await POST(req);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('clip');
    expect(body).toHaveProperty('message');
    expect(typeof body.success).toBe('boolean');
    expect(typeof body.message).toBe('string');
  });
});
