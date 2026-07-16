import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockUpload, mockGetPublicUrl, mockStorageFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: mockStorageFrom,
    },
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

import { POST } from '../route';

// Setup mockStorageFrom to return storage methods
mockStorageFrom.mockReturnValue({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
});

interface MockRequest {
  formData: () => Promise<FormData>;
}

/**
 * Helper to mock a NextRequest with formData().
 */
function createMockRequest(file: File | null): MockRequest {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  return {
    formData: vi.fn().mockResolvedValue(formData),
  };
}

/**
 * Helper to create a File object for testing.
 * @param filename - The filename
 * @param mimeType - The MIME type
 * @param size - The file size in bytes
 */
function createFile(filename: string, mimeType: string, size: number = 1024): File {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  view[0] = 0xff; // Simple byte pattern
  return new File([buffer], filename, { type: mimeType });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/uploads/123/1720000000.png' },
    });
  });

  // =========================================================================
  // Auth guard tests
  // =========================================================================

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // =========================================================================
  // Validation tests (missing file, invalid type, oversized)
  // =========================================================================

  it('returns 400 when no file is provided', async () => {
    const req = createMockRequest(null);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No file provided');
  });

  it('returns 400 when file type is not allowed (e.g. PDF)', async () => {
    const file = createFile('test.pdf', 'application/pdf');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Only JPEG, PNG, GIF, and WebP images are allowed');
  });

  it('returns 400 when file type is not allowed (e.g. text)', async () => {
    const file = createFile('test.txt', 'text/plain');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when file size exceeds 5 MB limit', async () => {
    const file = createFile('large.png', 'image/png', 6 * 1024 * 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('File must be under 5 MB');
  });

  it('allows JPEG files', async () => {
    const file = createFile('test.jpg', 'image/jpeg', 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('allows PNG files', async () => {
    const file = createFile('test.png', 'image/png', 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('allows GIF files', async () => {
    const file = createFile('test.gif', 'image/gif', 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('allows WebP files', async () => {
    const file = createFile('test.webp', 'image/webp', 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // =========================================================================
  // Successful upload tests
  // =========================================================================

  it('uploads a valid PNG file and returns public URL', async () => {
    const file = createFile('test.png', 'image/png', 2048);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://storage.example.com/uploads/123/1720000000.png');
    expect(body.filename).toMatch(/^123\/\d+\.png$/);
  });

  it('uploads a JPEG file with correct extension', async () => {
    const file = createFile('photo.jpg', 'image/jpeg');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filename).toMatch(/^123\/\d+\.jpg$/);
  });

  it('uploads a GIF file with correct extension', async () => {
    const file = createFile('animation.gif', 'image/gif');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filename).toMatch(/^123\/\d+\.gif$/);
  });

  it('uploads a WebP file with correct extension', async () => {
    const file = createFile('modern.webp', 'image/webp');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filename).toMatch(/^123\/\d+\.webp$/);
  });

  it('uses session fid in the filename path', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filename).toMatch(/^999\/\d+\.png$/);
  });

  it('includes timestamp in filename format', async () => {
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    const res = await POST(req);
    const body = await res.json();

    // Filename format is fid/timestamp.ext
    expect(body.filename).toMatch(/^\d+\/\d+\.png$/);
    // Extract timestamp part
    const [, timestampPart] = body.filename.split('/');
    const timestamp = Number.parseInt(timestampPart.replace('.png', ''), 10);
    // Verify it's a reasonable Unix timestamp (milliseconds)
    expect(timestamp).toBeGreaterThan(1700000000000);
  });

  it('calls supabaseAdmin.storage.from with "uploads" bucket', async () => {
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    await POST(req);
    expect(mockStorageFrom).toHaveBeenCalledWith('uploads');
  });

  it('calls upload with correct contentType and upsert false', async () => {
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    await POST(req);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^123\/\d+\.png$/),
      expect.any(Buffer),
      {
        contentType: 'image/png',
        upsert: false,
      },
    );
  });

  // =========================================================================
  // Upload failure (error returned from Supabase) tests
  // =========================================================================

  it('returns 500 when Supabase upload fails', async () => {
    mockUpload.mockResolvedValue({ error: new Error('Storage quota exceeded') });
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Upload failed');
  });

  it('logs Supabase storage error when upload fails', async () => {
    const storageError = new Error('Storage error');
    mockUpload.mockResolvedValue({ error: storageError });
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    await POST(req);
  });

  // =========================================================================
  // Exception handling (try/catch) tests
  // =========================================================================

  it('returns 500 when formData parsing throws', async () => {
    const mockFormData = vi.fn().mockRejectedValue(new Error('formData parse error'));
    const req = { formData: mockFormData } as unknown as Parameters<typeof POST>[0];
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Upload failed');
  });

  it('returns 500 and logs when file.arrayBuffer() throws', async () => {
    const file = createFile('test.png', 'image/png');

    // Mock arrayBuffer to throw
    const originalArrayBuffer = file.arrayBuffer;
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.reject(new Error('Buffer read failed')),
      writable: true,
    });

    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Upload failed');

    // Restore
    Object.defineProperty(file, 'arrayBuffer', {
      value: originalArrayBuffer,
      writable: true,
    });
  });

  // =========================================================================
  // Edge case tests
  // =========================================================================

  it('accepts a file exactly at the 5 MB limit', async () => {
    const file = createFile('large.png', 'image/png', 5 * 1024 * 1024);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('rejects a file just over the 5 MB limit', async () => {
    const file = createFile('toolarge.png', 'image/png', 5 * 1024 * 1024 + 1);
    const req = createMockRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('File must be under 5 MB');
  });

  it('getPublicUrl is called with the uploaded filename', async () => {
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    await POST(req);

    expect(mockGetPublicUrl).toHaveBeenCalledWith(expect.stringMatching(/^123\/\d+\.png$/));
  });

  it('returns the full response object with url and filename', async () => {
    const file = createFile('test.png', 'image/png');
    const req = createMockRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('filename');
    expect(typeof body.url).toBe('string');
    expect(typeof body.filename).toBe('string');
  });
});
