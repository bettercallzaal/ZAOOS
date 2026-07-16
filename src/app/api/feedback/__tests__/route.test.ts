import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionData } from '@/test-utils/api-helpers';
import { makePostRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({ mockGetSessionData: vi.fn() }));
const { mockOctokit } = vi.hoisted(() => ({
  mockOctokit: vi.fn(() => ({
    issues: {
      create: vi.fn(),
    },
  })),
}));

// ── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@octokit/rest', () => ({
  Octokit: mockOctokit,
}));

// ── Route import ────────────────────────────────────────────────────────────
import { POST } from '@/app/api/feedback/route';

describe('POST /api/feedback', () => {
  let fidCounter = 100;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = 'mock-token-abc123';
    process.env.GITHUB_FEEDBACK_REPO = 'zaalpanthaki/zao-os';

    // Use a new FID for each test to avoid rate limit collisions
    // since the in-memory rate limit map persists across tests
    fidCounter += 1;

    // Default Octokit mock for success case
    const mockIssuesCreate = vi.fn().mockResolvedValue({
      data: {
        number: 42,
        html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42',
      },
    });
    mockOctokit.mockReturnValue({
      issues: {
        create: mockIssuesCreate,
      },
    });
  });

  // ── Auth Guard Tests ──────────────────────────────────────────────────────
  describe('Auth Guard', () => {
    it('returns 401 when session is null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({} as SessionData);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Unauthorized');
    });

    it('succeeds with valid session fid', async () => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── Zod Validation Tests ──────────────────────────────────────────────────
  describe('Input Validation (Zod)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);
    });

    it('returns 400 when type is invalid', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'invalid-type',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when title is too short (< 5 chars)', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Bad',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when title is too long (> 200 chars)', async () => {
      const longTitle = 'a'.repeat(201);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: longTitle,
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('accepts title at min boundary (5 chars)', async () => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Abcde',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts title at max boundary (200 chars)', async () => {
      const maxTitle = 'a'.repeat(200);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: maxTitle,
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('returns 400 when description is too short (< 10 chars)', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Short',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when description is too long (> 2000 chars)', async () => {
      const longDesc = 'a'.repeat(2001);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: longDesc,
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('accepts description at min boundary (10 chars)', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Abcdefghij',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts description at max boundary (2000 chars)', async () => {
      const maxDesc = 'a'.repeat(2000);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: maxDesc,
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('returns 400 when page is too long (> 200 chars)', async () => {
      const longPage = 'a'.repeat(201);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: longPage,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when browser is too long (> 200 chars)', async () => {
      const longBrowser = 'a'.repeat(201);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
        browser: longBrowser,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when screenshot is too long (> 5_000_000 chars)', async () => {
      const longScreenshot = 'a'.repeat(5_000_001);
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
        screenshot: longScreenshot,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid optional fields', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
        browser: 'Chrome 128',
        screenshot: 'data:image/png;base64,abc123',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts all three type enum values: bug', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts all three type enum values: feature', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'feature',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('accepts all three type enum values: feedback', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'feedback',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ── GitHub Token Tests ────────────────────────────────────────────────────
  describe('GitHub Token Configuration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);
    });

    it('returns 503 when GITHUB_TOKEN is not set', async () => {
      delete process.env.GITHUB_TOKEN;

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(503);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Feedback system not configured');
    });

    it('uses default GITHUB_FEEDBACK_REPO if not set', async () => {
      delete process.env.GITHUB_FEEDBACK_REPO;
      process.env.GITHUB_TOKEN = 'mock-token';

      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/x/y/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify Octokit was created with the token
      expect(mockOctokit).toHaveBeenCalledWith({ auth: 'mock-token' });

      // Verify the issue was created with default repo
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'zaalpanthaki',
          repo: 'zao-os',
        }),
      );
    });
  });

  // ── Octokit Issue Creation Tests ──────────────────────────────────────────
  describe('GitHub Issue Creation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);
    });

    it('creates issue with correct title format for bug type', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Button is broken',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[Bug] Button is broken',
        }),
      );
    });

    it('creates issue with correct title format for feature type', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'feature',
        title: 'Dark mode support',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[Feature] Dark mode support',
        }),
      );
    });

    it('creates issue with correct title format for feedback type', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'feedback',
        title: 'UI feels cluttered',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[Feedback] UI feels cluttered',
        }),
      );
    });

    it('includes description and context block in issue body', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'This is my test description',
        page: '/music',
        browser: 'Chrome 128',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).toContain('This is my test description');
      expect(body).toContain('**Page:** `/music`');
      expect(body).toContain('**Browser:** Chrome 128');
      expect(body).toContain('**User:** @testuser');
      expect(body).toContain('**Timestamp:**');
      expect(body).toContain('*Submitted via ZAO OS in-app feedback*');
    });

    it('uses "Unknown" for browser when not provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).toContain('**Browser:** Unknown');
    });

    it('includes screenshot in body when provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
        screenshot: 'data:image/png;base64,abc123==',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).toContain('**Screenshot:**');
      expect(body).toContain('![screenshot](data:image/png;base64,abc123==)');
    });

    it('does not include screenshot section when not provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).not.toContain('**Screenshot:**');
    });

    it('maps feedback type to feedback label', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'feedback',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      expect(labels).toContain('feedback');
    });

    it('maps bug type to bug label', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      expect(labels).toContain('bug');
    });

    it('maps feature type to enhancement label', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'feature',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      expect(labels).toContain('enhancement');
    });

    it('includes page label based on path segment', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/governance/voting',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      expect(labels).toContain('governance');
    });

    it('uses "general" label for unknown path segments', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/unknown-page',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      expect(labels).toContain('general');
    });

    it('includes all expected labels (feedback + type + page)', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const labels = callArgs.labels as string[];

      // Should have: 'feedback', 'bug' (LABEL_MAP), 'music' (page label)
      expect(labels).toHaveLength(3);
      expect(labels).toContain('feedback');
      expect(labels).toContain('bug');
      expect(labels).toContain('music');
    });

    it('creates issue in correct GitHub repo', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      process.env.GITHUB_FEEDBACK_REPO = 'owner/custom-repo';

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'owner',
          repo: 'custom-repo',
        }),
      );
    });
  });

  // ── Response Tests ────────────────────────────────────────────────────────
  describe('Success Response', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);
    });

    it('returns 200 with issue number and URL on success', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        data: {
          number: 42,
          html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42',
        },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(42);
      expect(body.issueUrl).toBe('https://github.com/zaalpanthaki/zao-os/issues/42');
    });
  });

  // ── Error Handling Tests ──────────────────────────────────────────────────
  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);
    });

    it('returns 500 when Octokit throws', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('GitHub API error'));
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Failed to submit feedback');
    });

    it('returns 500 when Octokit.issues.create throws auth error', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('Bad credentials'));
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Failed to submit feedback');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/feedback', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'invalid json',
        },
      );

      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);

      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('Failed to submit feedback');
    });
  });

  // ── Rate Limiting Tests ───────────────────────────────────────────────────
  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'testuser',
      } as SessionData);

      const mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });
    });

    it('allows first submission to go through', async () => {
      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('blocks second submission within 5 minutes with 429 status', async () => {
      const req1 = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'First submission',
        description: 'Test description text here',
        page: '/music',
      });

      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      // Second request immediately after
      const req2 = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Second submission',
        description: 'Test description text here',
        page: '/music',
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(429);

      const body = (await res2.json()) as Record<string, unknown>;
      expect(typeof body.error).toBe('string');
      expect((body.error as string).toLowerCase()).toContain('wait');
    });

    it('includes wait time in error message', async () => {
      const req1 = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'First submission',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req1);

      const req2 = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Second submission',
        description: 'Test description text here',
        page: '/music',
      });

      const res2 = await POST(req2);
      const body = (await res2.json()) as Record<string, unknown>;

      expect(body.error as string).toMatch(/Please wait \d+s/);
    });
  });

  // ── Session Username Tests ────────────────────────────────────────────────
  describe('User identification in issue body', () => {
    let mockCreate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Set up a fresh Octokit mock for these tests
      mockCreate = vi.fn().mockResolvedValue({
        data: { number: 42, html_url: 'https://github.com/zaalpanthaki/zao-os/issues/42' },
      });
      mockOctokit.mockReturnValue({
        issues: { create: mockCreate },
      });
    });

    it('uses username when available', async () => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
        username: 'johndoe',
      } as SessionData);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).toContain('**User:** @johndoe');
    });

    it('uses fid when username is not available', async () => {
      mockGetSessionData.mockResolvedValue({
        fid: fidCounter,
      } as SessionData);

      const req = makePostRequest('/api/feedback', {
        type: 'bug',
        title: 'Test Title',
        description: 'Test description text here',
        page: '/music',
      });

      await POST(req);

      const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
      const body = callArgs.body as string;

      expect(body).toContain(`**User:** @fid:${fidCounter}`);
    });
  });
});
