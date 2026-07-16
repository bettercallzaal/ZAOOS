import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockValidateRequest, mockCreateClipDraft } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockValidateRequest: vi.fn(),
  mockCreateClipDraft: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/autocliper', () => ({
  ClipMetadataSchema: {
    /* mock schema */
  },
  validateRequest: mockValidateRequest,
  createClipDraft: mockCreateClipDraft,
}));

import { POST } from '../route';

describe('POST /api/autocliper/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Authentication tests (401)
  // ========================================================================

  it('returns 401 Unauthorized when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('does not call validateRequest when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    await POST(req);

    expect(mockValidateRequest).not.toHaveBeenCalled();
  });

  it('does not call createClipDraft when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    await POST(req);

    expect(mockCreateClipDraft).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Validation failure tests (400)
  // ========================================================================

  it('returns 400 Bad Request when validation fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: false,
      error: 'sourceUrl: Must be a valid URL',
    });

    const invalidBody = {
      sourceUrl: 'not-a-url',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', invalidBody);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('sourceUrl: Must be a valid URL');
  });

  it('returns 400 with detailed error message for multiple validation failures', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: false,
      error: 'sourceUrl: Must be a valid URL; title: String must contain at least 1 character',
    });

    const invalidBody = {
      sourceUrl: 'invalid',
      sourceType: 'stream' as const,
      title: '',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', invalidBody);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toContain('sourceUrl');
    expect(body.error).toContain('title');
  });

  it('does not call createClipDraft when validation fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: false,
      error: 'sourceUrl: Must be a valid URL',
    });

    const invalidBody = {
      sourceUrl: 'invalid-url',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', invalidBody);
    await POST(req);

    expect(mockCreateClipDraft).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Success path tests (201)
  // ========================================================================

  it('returns 201 Created with clip data when validation succeeds', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Test Clip',
        description: 'A test clip description',
      },
    });

    const mockClip = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
      createdAt: '2026-07-16T10:00:00Z',
      stage: 'draft' as const,
      stagedAt: '2026-07-16T10:00:00Z',
    };

    mockCreateClipDraft.mockReturnValue(mockClip);

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(true);
    expect(body.clip).toEqual(mockClip);
    expect(body.message).toContain('Clip draft created');
    expect(body.message).toContain('550e8400-e29b-41d4-a716-446655440000');
  });

  it('calls createClipDraft with correct parameters on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Test Clip',
        description: 'A test clip description',
      },
    });

    const mockClip = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
      createdAt: '2026-07-16T10:00:00Z',
      stage: 'draft' as const,
      stagedAt: '2026-07-16T10:00:00Z',
    };

    mockCreateClipDraft.mockReturnValue(mockClip);

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    await POST(req);

    expect(mockCreateClipDraft).toHaveBeenCalledWith(
      'https://example.com/video.mp4',
      'stream',
      'Test Clip',
      'A test clip description',
    );
  });

  it('supports all valid sourceType values', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const sourceTypes = ['restream', 'stream', 'call', 'wavewarz', 'other'] as const;

    for (const sourceType of sourceTypes) {
      vi.clearAllMocks();
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockValidateRequest.mockReturnValue({
        success: true,
        data: {
          sourceUrl: 'https://example.com/video.mp4',
          sourceType,
          title: 'Test Clip',
          description: 'A test clip description',
        },
      });

      const mockClip = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sourceUrl: 'https://example.com/video.mp4',
        sourceType,
        title: 'Test Clip',
        description: 'A test clip description',
        createdAt: '2026-07-16T10:00:00Z',
        stage: 'draft' as const,
        stagedAt: '2026-07-16T10:00:00Z',
      };

      mockCreateClipDraft.mockReturnValue(mockClip);

      const validBody = {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType,
        title: 'Test Clip',
        description: 'A test clip description',
      };

      const req = makePostRequest('/api/autocliper/ingest', validBody);
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockCreateClipDraft).toHaveBeenCalledWith(
        'https://example.com/video.mp4',
        sourceType,
        'Test Clip',
        'A test clip description',
      );
    }
  });

  it('returns correct response shape with success=true and clip object', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'call',
        title: 'Recorded Call',
        description: 'A recorded call',
      },
    });

    const mockClip = {
      id: 'abc12345-e29b-41d4-a716-446655440000',
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'call' as const,
      title: 'Recorded Call',
      description: 'A recorded call',
      createdAt: '2026-07-16T10:00:00Z',
      stage: 'draft' as const,
      stagedAt: '2026-07-16T10:00:00Z',
    };

    mockCreateClipDraft.mockReturnValue(mockClip);

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'call' as const,
      title: 'Recorded Call',
      description: 'A recorded call',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('clip');
    expect(body).toHaveProperty('message');
    expect(body.clip).toEqual(mockClip);
  });

  // ========================================================================
  // Error handling tests (500)
  // ========================================================================

  it('returns 500 when request.json() throws an Error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = makePostRequest('/api/autocliper/ingest', {});
    // Override the json method to throw
    (req.json as ReturnType<typeof vi.fn>) = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid JSON');

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/ingest]', 'Invalid JSON');

    consoleSpy.mockRestore();
  });

  it('returns 500 when createClipDraft throws an Error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Test Clip',
        description: 'A test clip description',
      },
    });

    const error = new Error('Draft creation failed');
    mockCreateClipDraft.mockImplementation(() => {
      throw error;
    });

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Draft creation failed');

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/ingest]', 'Draft creation failed');

    consoleSpy.mockRestore();
  });

  it('returns 500 with "Unknown error" when an unknown error is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Test Clip',
        description: 'A test clip description',
      },
    });

    mockCreateClipDraft.mockImplementation(() => {
      throw 'unexpected string error';
    });

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unknown error');

    expect(consoleSpy).toHaveBeenCalledWith('[api/autocliper/ingest]', 'Unknown error');

    consoleSpy.mockRestore();
  });

  it('logs error with correct prefix when exception occurs', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'stream',
        title: 'Test Clip',
        description: 'A test clip description',
      },
    });

    const error = new Error('Test error in createClipDraft');
    mockCreateClipDraft.mockImplementation(() => {
      throw error;
    });

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'stream' as const,
      title: 'Test Clip',
      description: 'A test clip description',
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[api/autocliper/ingest]',
      'Test error in createClipDraft',
    );

    consoleSpy.mockRestore();
  });

  // ========================================================================
  // Integration-like tests (flow validation)
  // ========================================================================

  it('extracts sourceUrl, sourceType, title, description from validated data', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://youtu.be/abc123',
        sourceType: 'wavewarz',
        title: 'WaveWarZ Clip',
        description: 'Exciting gameplay moment',
      },
    });

    const mockClip = {
      id: 'xyz-123',
      sourceUrl: 'https://youtu.be/abc123',
      sourceType: 'wavewarz' as const,
      title: 'WaveWarZ Clip',
      description: 'Exciting gameplay moment',
      createdAt: '2026-07-16T10:00:00Z',
      stage: 'draft' as const,
      stagedAt: '2026-07-16T10:00:00Z',
    };

    mockCreateClipDraft.mockReturnValue(mockClip);

    const validBody = {
      sourceUrl: 'https://youtu.be/abc123',
      sourceType: 'wavewarz' as const,
      title: 'WaveWarZ Clip',
      description: 'Exciting gameplay moment',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockCreateClipDraft).toHaveBeenCalledWith(
      'https://youtu.be/abc123',
      'wavewarz',
      'WaveWarZ Clip',
      'Exciting gameplay moment',
    );
  });

  it('preserves clip properties from createClipDraft in response', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockValidateRequest.mockReturnValue({
      success: true,
      data: {
        sourceUrl: 'https://example.com/video.mp4',
        sourceType: 'restream',
        title: 'Restream Event',
        description: 'Live stream recording',
      },
    });

    const mockClip = {
      id: 'clip-uuid-12345',
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'restream' as const,
      title: 'Restream Event',
      description: 'Live stream recording',
      createdAt: '2026-07-16T12:30:45Z',
      stage: 'draft' as const,
      stagedAt: '2026-07-16T12:30:45Z',
    };

    mockCreateClipDraft.mockReturnValue(mockClip);

    const validBody = {
      sourceUrl: 'https://example.com/video.mp4',
      sourceType: 'restream' as const,
      title: 'Restream Event',
      description: 'Live stream recording',
    };

    const req = makePostRequest('/api/autocliper/ingest', validBody);
    const res = await POST(req);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.clip).toEqual(mockClip);
    expect(body.clip.id).toBe('clip-uuid-12345');
    expect(body.clip.createdAt).toBe('2026-07-16T12:30:45Z');
    expect(body.clip.stage).toBe('draft');
  });
});
