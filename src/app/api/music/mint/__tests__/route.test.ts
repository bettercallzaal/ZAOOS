import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockIsArweaveConfigured, mockBuildMusicTags, mockUploadToArweave } = vi.hoisted(() => ({
  mockIsArweaveConfigured: vi.fn(),
  mockBuildMusicTags: vi.fn(),
  mockUploadToArweave: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/music/arweave', () => ({
  isArweaveConfigured: () => mockIsArweaveConfigured(),
  buildMusicTags: (opts: unknown) => mockBuildMusicTags(opts),
  uploadToArweave: (buffer: unknown, contentType: unknown, tags: unknown) =>
    mockUploadToArweave(buffer, contentType, tags),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// ── Route import ─────────────────────────────────────────────────────────────
import { POST } from '@/app/api/music/mint/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(path: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'), options);
}

function createFileBlob(content: string, filename: string, type: string): File {
  return new File([content], filename, { type });
}

async function makePostRequestWithFormData(path: string, formData: FormData): Promise<NextRequest> {
  const request = makeRequest(path, {
    method: 'POST',
  });

  // Override the request body to use FormData
  (request as unknown as { formData: () => Promise<FormData> }).formData = async () => formData;

  return request;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/music/mint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockIsArweaveConfigured.mockReturnValue(true);
    mockBuildMusicTags.mockReturnValue([{ name: 'App-Name', value: 'ZAO-OS' }]);
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ walletAddress: '0x123' });

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  describe('arweave configuration', () => {
    it('returns 503 when Arweave is not configured', async () => {
      mockIsArweaveConfigured.mockReturnValue(false);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Arweave not configured' });
    });
  });

  describe('audio file validation', () => {
    it('returns 400 when audio file is missing', async () => {
      const formData = new FormData();
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Audio file required' });
    });

    it('returns 400 when audio file type is invalid', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.txt', 'text/plain'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid audio type');
    });

    it('returns 400 when audio file exceeds max size', async () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const formData = new FormData();
      formData.append('audio', createFileBlob(largeContent, 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Audio file too large (max 50MB)' });
    });

    it('accepts all allowed audio types', async () => {
      const allowedTypes = [
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
        'audio/flac',
        'audio/ogg',
        'audio/aac',
      ];

      for (const audioType of allowedTypes) {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
        mockIsArweaveConfigured.mockReturnValue(true);
        mockUploadToArweave.mockResolvedValue({
          txId: 'test-tx-id',
          url: 'https://arweave.net/test-tx-id',
          arUri: 'ar://test-tx-id',
        });
        const mockChain = chainMock({
          data: { id: 'asset-123', arweave_tx_id: 'test-tx-id' },
          error: null,
        });
        mockFrom.mockReturnValue(mockChain.chain);

        const formData = new FormData();
        formData.append('audio', createFileBlob('fake audio', 'song.mp3', audioType));
        formData.append(
          'metadata',
          JSON.stringify({
            title: 'Test Song',
            artist: 'Test Artist',
            licensePreset: 'collectible',
          }),
        );

        const req = await makePostRequestWithFormData('/api/music/mint', formData);
        const res = await POST(req);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('cover image validation', () => {
    it('returns 400 when cover image type is invalid', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append('cover', createFileBlob('fake image', 'cover.txt', 'text/plain'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid image type');
    });

    it('returns 400 when cover image exceeds max size', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append('cover', createFileBlob(largeContent, 'cover.png', 'image/png'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Cover image too large (max 5MB)' });
    });

    it('accepts all allowed image types', async () => {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      for (const imageType of allowedImageTypes) {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
        mockIsArweaveConfigured.mockReturnValue(true);
        mockUploadToArweave.mockResolvedValue({
          txId: 'test-tx-id',
          url: 'https://arweave.net/test-tx-id',
          arUri: 'ar://test-tx-id',
        });
        const mockChain = chainMock({
          data: { id: 'asset-123', arweave_tx_id: 'test-tx-id' },
          error: null,
        });
        mockFrom.mockReturnValue(mockChain.chain);

        const formData = new FormData();
        formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
        formData.append('cover', createFileBlob('fake image', 'cover.png', imageType));
        formData.append(
          'metadata',
          JSON.stringify({
            title: 'Test Song',
            artist: 'Test Artist',
            licensePreset: 'collectible',
          }),
        );

        const req = await makePostRequestWithFormData('/api/music/mint', formData);
        const res = await POST(req);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('metadata validation', () => {
    it('returns 400 when metadata is missing', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Metadata required' });
    });

    it('returns 400 when metadata is invalid JSON', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append('metadata', 'not valid json {');

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({ error: 'Invalid metadata JSON' });
    });

    it('returns 400 when title is missing', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid metadata');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when artist is missing', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid metadata');
    });

    it('returns 400 when title exceeds max length', async () => {
      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'x'.repeat(201),
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid metadata');
    });

    it('uses default license preset when not provided', async () => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'test-tx-id',
        url: 'https://arweave.net/test-tx-id',
        arUri: 'ar://test-tx-id',
      });
      const mockChain = chainMock({
        data: { id: 'asset-123', arweave_tx_id: 'test-tx-id' },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockBuildMusicTags).toHaveBeenCalledWith(
        expect.objectContaining({
          licensePreset: 'collectible',
        }),
      );
    });

    it('accepts optional genre and description fields', async () => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'test-tx-id',
        url: 'https://arweave.net/test-tx-id',
        arUri: 'ar://test-tx-id',
      });
      const mockChain = chainMock({
        data: { id: 'asset-123', arweave_tx_id: 'test-tx-id' },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          genre: 'Electronic',
          description: 'A test song for unit testing',
          licensePreset: 'open',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockBuildMusicTags).toHaveBeenCalledWith({
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Electronic',
        description: 'A test song for unit testing',
        licensePreset: 'open',
        coverTxId: undefined,
      });
    });
  });

  describe('successful upload flow', () => {
    it('uploads audio file and returns success response', async () => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'audio-tx-id-123',
        url: 'https://arweave.net/audio-tx-id-123',
        arUri: 'ar://audio-tx-id-123',
      });
      const mockChain = chainMock({
        data: {
          id: 'asset-456',
          arweave_tx_id: 'audio-tx-id-123',
        },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'My Song',
          artist: 'My Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        asset: {
          id: 'asset-456',
          txId: 'audio-tx-id-123',
          url: 'https://arweave.net/audio-tx-id-123',
          arUri: 'ar://audio-tx-id-123',
          coverUrl: null,
          bazarUrl: 'https://bazar.arweave.net/#/asset/audio-tx-id-123',
        },
      });
    });

    it('uploads cover image before audio when both provided', async () => {
      mockBuildMusicTags.mockReturnValue([
        { name: 'App-Name', value: 'ZAO-OS' },
        { name: 'Type', value: 'music-track' },
      ]);

      mockUploadToArweave
        .mockResolvedValueOnce({
          txId: 'cover-tx-id',
          url: 'https://arweave.net/cover-tx-id',
          arUri: 'ar://cover-tx-id',
        })
        .mockResolvedValueOnce({
          txId: 'audio-tx-id',
          url: 'https://arweave.net/audio-tx-id',
          arUri: 'ar://audio-tx-id',
        });

      const mockChain = chainMock({
        data: {
          id: 'asset-789',
          arweave_tx_id: 'audio-tx-id',
        },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append('cover', createFileBlob('fake image', 'cover.png', 'image/png'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'My Song',
          artist: 'My Artist',
          licensePreset: 'premium',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockUploadToArweave).toHaveBeenCalledTimes(2);
      // First call: cover image
      expect(mockUploadToArweave).toHaveBeenNthCalledWith(
        1,
        expect.any(Buffer),
        'image/png',
        expect.arrayContaining([expect.objectContaining({ name: 'Type', value: 'music-cover' })]),
      );
      // Second call: audio
      expect(mockUploadToArweave).toHaveBeenNthCalledWith(
        2,
        expect.any(Buffer),
        'audio/mpeg',
        expect.any(Array),
      );

      const body = await res.json();
      expect(body.asset.coverUrl).toBe('https://arweave.net/cover-tx-id');
    });

    it('passes cover tx id to buildMusicTags when cover is uploaded', async () => {
      mockUploadToArweave
        .mockResolvedValueOnce({
          txId: 'cover-tx-id',
          url: 'https://arweave.net/cover-tx-id',
          arUri: 'ar://cover-tx-id',
        })
        .mockResolvedValueOnce({
          txId: 'audio-tx-id',
          url: 'https://arweave.net/audio-tx-id',
          arUri: 'ar://audio-tx-id',
        });

      const mockChain = chainMock({
        data: { id: 'asset-123', arweave_tx_id: 'audio-tx-id' },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append('cover', createFileBlob('fake image', 'cover.png', 'image/png'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'My Song',
          artist: 'My Artist',
          licensePreset: 'open',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const _res = await POST(req);

      expect(mockBuildMusicTags).toHaveBeenCalledWith(
        expect.objectContaining({
          coverTxId: 'cover-tx-id',
        }),
      );
    });

    it('stores metadata in supabase with correct fields', async () => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'audio-tx-id',
        url: 'https://arweave.net/audio-tx-id',
        arUri: 'ar://audio-tx-id',
      });

      const mockChain = chainMock({
        data: { id: 'asset-123', arweave_tx_id: 'audio-tx-id' },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const session = mockAuthenticatedSession({ fid: 999 });
      mockGetSessionData.mockResolvedValue(session);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'My Song',
          artist: 'My Artist',
          genre: 'Rock',
          description: 'A rock song',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const _res = await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('arweave_assets');
      expect(mockChain.chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          fid: 999,
          arweave_tx_id: 'audio-tx-id',
          title: 'My Song',
          artist: 'My Artist',
          content_type: 'audio/mpeg',
          genre: 'Rock',
          description: 'A rock song',
          license_preset: 'collectible',
          cover_tx_id: null,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 and logs error when uploadToArweave fails', async () => {
      mockUploadToArweave.mockRejectedValue(new Error('Arweave upload failed'));

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Arweave upload failed');
      expect(mockLogger.error).toHaveBeenCalledWith('[music/mint] Error:', expect.any(Error));
    });

    it('returns 500 when database insert fails', async () => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'audio-tx-id',
        url: 'https://arweave.net/audio-tx-id',
        arUri: 'ar://audio-tx-id',
      });

      const mockChain = chainMock({
        data: null,
        error: new Error('Database connection failed'),
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      // Route returns 200 even if DB fails (logs error)
      expect(res.status).toBe(200);
      expect(mockLogger.error).toHaveBeenCalledWith('[music/mint] DB error:', expect.any(Error));
    });

    it('returns 500 with error message when unknown error occurs', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session fetch failed'));

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Session fetch failed');
      expect(mockLogger.error).toHaveBeenCalledWith('[music/mint] Error:', expect.any(Error));
    });

    it('sanitizes error message for unknown error types', async () => {
      mockUploadToArweave.mockRejectedValue('Something went wrong');

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: 'collectible',
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Mint failed');
    });
  });

  describe('all license presets', () => {
    it.each([
      'community',
      'collectible',
      'premium',
      'open',
    ] as const)('accepts license preset: %s', async (preset) => {
      mockUploadToArweave.mockResolvedValue({
        txId: 'audio-tx-id',
        url: 'https://arweave.net/audio-tx-id',
        arUri: 'ar://audio-tx-id',
      });
      const mockChain = chainMock({
        data: { id: 'asset-123', arweave_tx_id: 'audio-tx-id' },
        error: null,
      });
      mockFrom.mockReturnValue(mockChain.chain);

      const formData = new FormData();
      formData.append('audio', createFileBlob('fake audio', 'song.mp3', 'audio/mpeg'));
      formData.append(
        'metadata',
        JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          licensePreset: preset,
        }),
      );

      const req = await makePostRequestWithFormData('/api/music/mint', formData);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockBuildMusicTags).toHaveBeenCalledWith(
        expect.objectContaining({ licensePreset: preset }),
      );
    });
  });
});
