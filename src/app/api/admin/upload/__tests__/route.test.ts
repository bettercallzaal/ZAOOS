import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

// Helper to create a NextRequest with mocked formData
function makeUploadRequest(csvContent: string, fileSize?: number): NextRequest {
  const req = new NextRequest(new URL('/api/admin/upload', 'http://localhost:3000'), {
    method: 'POST',
  });

  // Mock the formData method on the request
  const mockFile = {
    text: vi.fn().mockResolvedValue(csvContent),
    size: fileSize ?? csvContent.length,
  };

  const formDataMock = new Map();
  formDataMock.set('file', mockFile);

  vi.spyOn(req, 'formData').mockResolvedValue(formDataMock as unknown as FormData);

  return req;
}

// ============================================================================
// POST /api/admin/upload
// ============================================================================

describe('POST /api/admin/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeUploadRequest('testuser,0x1234567890abcdef1234567890abcdef12345678\n');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const req = makeUploadRequest('testuser,0x1234567890abcdef1234567890abcdef12345678\n');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('file validation', () => {
    it('returns 400 when no file is provided', async () => {
      const req = new NextRequest(new URL('/api/admin/upload', 'http://localhost:3000'), {
        method: 'POST',
      });

      const emptyFormData = new Map();
      vi.spyOn(req, 'formData').mockResolvedValue(emptyFormData as unknown as FormData);

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('No file provided');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when file exceeds 1MB', async () => {
      const csvContent = `testuser,${VALID_WALLET}`;
      const req = makeUploadRequest(csvContent, 1024 * 1024 + 1); // File size exceeds limit

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('File too large (max 1MB)');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts file exactly 1MB in size', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `testuser,${VALID_WALLET}`;
      const req = makeUploadRequest(csvContent, 1024 * 1024); // Exactly 1MB

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('CSV parsing and row validation', () => {
    it('returns 400 when CSV has more than 1000 rows', async () => {
      const rows = Array.from({ length: 1001 }, (_, i) => {
        const num = String(i + 1).padStart(4, '0');
        return `user${num},${VALID_WALLET}`;
      }).join('\n');

      const req = makeUploadRequest(rows);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Too many rows (max 1000)');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts exactly 1000 rows', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const rows = Array.from({ length: 1000 }, (_, i) => {
        const num = String(i + 1).padStart(4, '0');
        return `user${num},${VALID_WALLET}`;
      }).join('\n');

      const req = makeUploadRequest(rows);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1000);
    });

    it('validates each row with csvRowSchema (valid rows)', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `testuser,${VALID_WALLET}
anotheruser,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(2);
      expect(body.errors).toBeUndefined();
    });

    it('rejects rows with invalid wallet address format', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `testuser,${VALID_WALLET}
baduser,not-a-wallet
anotheruser,0xInvalidHex123456789012345678901234567890
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1); // Only first row is valid
      expect(body.errors).toBeDefined();
      expect(body.errors?.length).toBe(2);
      expect(body.errors?.[0]).toContain('Row 2');
      expect(body.errors?.[1]).toContain('Row 3');
    });

    it('rejects rows with empty IGN', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `,${VALID_WALLET}
testuser,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1); // Only second row is valid
      expect(body.errors).toBeDefined();
      expect(body.errors?.length).toBe(1);
    });

    it('rejects rows with IGN exceeding max length (100 chars)', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const longIgn = 'a'.repeat(101);
      const csvContent = `${longIgn},${VALID_WALLET}
testuser,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1);
      expect(body.errors).toBeDefined();
      expect(body.errors?.length).toBe(1);
    });

    it('strips whitespace from IGN and wallet address', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `  testuser  ,  ${VALID_WALLET}
anotheruser,${VALID_WALLET}`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(2);

      const upsertCall = vi.mocked(chain.upsert);
      const [entries] = upsertCall.mock.calls[0] as unknown as [
        Array<{ ign: string; wallet_address: string }>,
      ];

      expect(entries[0].ign).toBe('testuser');
      expect(entries[0].wallet_address).toBe(VALID_WALLET);
    });

    it('strips trailing commas from wallet address', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const walletWithCommas = `${VALID_WALLET},,,`;
      const csvContent = `testuser,${walletWithCommas}`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1);

      const upsertCall = vi.mocked(chain.upsert);
      const [entries] = upsertCall.mock.calls[0] as unknown as [
        Array<{ ign: string; wallet_address: string }>,
      ];

      expect(entries[0].wallet_address).toBe(VALID_WALLET);
    });

    it('skips empty lines in CSV', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `testuser,${VALID_WALLET}

anotheruser,${VALID_WALLET}

`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(2);
    });

    it('returns 400 when all rows are invalid', async () => {
      const csvContent = `,${VALID_WALLET}
,invalid-wallet
,`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('No valid entries found');
      expect(body.errors).toBeDefined();
      expect(body.errors?.length).toBe(3);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns partial success with both imported count and errors', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `validuser1,${VALID_WALLET}
,invalid-no-ign
validuser2,${VALID_WALLET}
invalid-user,not-a-wallet
validuser3,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(3);
      expect(body.errors).toBeDefined();
      expect(body.errors?.length).toBe(2);
    });
  });

  describe('Supabase upsert interaction', () => {
    it('calls supabaseAdmin.from with allowlist table', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('allowlist');
    });

    it('upsets entries with onConflict strategy', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      await POST(req);

      const upsertCall = vi.mocked(chain.upsert);
      const [_, options] = upsertCall.mock.calls[0] as unknown as [unknown, unknown];

      expect(options).toEqual({
        onConflict: 'wallet_address',
        ignoreDuplicates: true,
      });
    });

    it('passes correct payload structure to upsert', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `user1,${VALID_WALLET}
user2,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
`;

      const req = makeUploadRequest(csvContent);
      await POST(req);

      const upsertCall = vi.mocked(chain.upsert);
      const [entries] = upsertCall.mock.calls[0] as unknown as [
        Array<{ ign: string; wallet_address: string }>,
      ];

      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        ign: 'user1',
        wallet_address: VALID_WALLET,
      });
      expect(entries[1]).toEqual({
        ign: 'user2',
        wallet_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 when supabase upsert fails', async () => {
      const dbError = new Error('Database connection failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to process CSV');
      expect(body.details).toBeUndefined();
    });

    it('returns 500 when file.text() throws', async () => {
      const req = new NextRequest(new URL('/api/admin/upload', 'http://localhost:3000'), {
        method: 'POST',
      });

      // Mock a file that throws when text() is called
      const mockFile = {
        text: vi.fn().mockRejectedValue(new Error('File read error')),
        size: 100,
      };

      const formDataMock = new Map();
      formDataMock.set('file', mockFile);

      vi.spyOn(req, 'formData').mockResolvedValue(formDataMock as unknown as FormData);

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to process CSV');
    });

    it('logs error to logger.error on upsert failure', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      await POST(req);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('CSV upload error:', expect.any(Error));
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Password: secret123, host: db.internal');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      const res = await POST(req);
      const body = await res.json();

      expect(body.error).toBe('Failed to process CSV');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('success response', () => {
    it('returns 200 with success true', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns imported count', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `user1,${VALID_WALLET}
user2,${VALID_WALLET}
user3,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(body.imported).toBe(3);
    });

    it('returns undefined errors when all rows are valid', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `user1,${VALID_WALLET}
user2,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(body.errors).toBeUndefined();
    });

    it('returns errors array when some rows are invalid', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `user1,${VALID_WALLET}
,invalid-no-ign
user3,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(body.errors).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors?.length).toBe(1);
    });

    it('response does not include undefined errors property', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeUploadRequest(`testuser,${VALID_WALLET}`);
      const res = await POST(req);
      const body = await res.json();

      expect(Object.keys(body)).toContain('success');
      expect(Object.keys(body)).toContain('imported');
      expect(Object.keys(body)).not.toContain('errors');
    });
  });

  describe('edge cases', () => {
    it('handles CSV with only headers (no data rows)', async () => {
      const csvContent = 'ign,wallet\n';

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('No valid entries found');
    });

    it('handles CSV with BOM (byte order mark)', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      // CSV with UTF-8 BOM
      const csvContent = `﻿testuser,${VALID_WALLET}\n`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      // Papa.parse handles BOM; should still parse correctly
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('handles mixed case wallet addresses', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const mixedCaseWallet = '0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd';
      const csvContent = `testuser,${mixedCaseWallet}`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1);
    });

    it('error row numbers are 1-indexed', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const csvContent = `validuser,${VALID_WALLET}
,invalid
validuser2,${VALID_WALLET}
`;

      const req = makeUploadRequest(csvContent);
      const res = await POST(req);
      const body = await res.json();

      expect(body.errors?.[0]).toContain('Row 2');
    });
  });
});
