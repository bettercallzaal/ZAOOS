// @vitest-environment node
import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/publish/telegram', () => ({
  publishToTelegram: vi.fn().mockResolvedValue({ success: true }),
  escapeMarkdownV2: (s: string) => s,
}));

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockFrom = vi.hoisted(() => vi.fn().mockReturnValue({ insert: mockInsert }));
const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn(() => ({ from: mockFrom })));
vi.mock('@/lib/db/supabase', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }));

import { POST } from '../route';

const TEST_SECRET = 'test-github-secret';

beforeEach(() => {
  process.env.GITHUB_WEBHOOK_SECRET = TEST_SECRET;
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.GITHUB_WEBHOOK_SECRET;
});

function signGithub(body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', TEST_SECRET).update(body).digest('hex');
}

function makeGithubRequest(body: object, event: string, sig?: string) {
  const bodyStr = JSON.stringify(body);
  return new NextRequest(new URL('/api/webhooks/github', 'http://localhost:3000'), {
    method: 'POST',
    body: bodyStr,
    headers: {
      'x-github-event': event,
      'x-hub-signature-256': sig ?? signGithub(bodyStr),
    },
  });
}

describe('POST /api/webhooks/github', () => {
  it('returns 503 when GITHUB_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const req = makeGithubRequest({ type: 'ping' }, 'ping', 'any-sig');
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 401 when signature does not match', async () => {
    const req = makeGithubRequest({ type: 'ping' }, 'ping', 'sha256=deadbeef');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns ok:true pong:true for ping event', async () => {
    const req = makeGithubRequest({ zen: 'Keep it simple' }, 'ping');
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.pong).toBe(true);
  });

  it('returns ok:true handled:pull_request.opened for PR opened event', async () => {
    const payload = {
      action: 'opened',
      pull_request: { number: 42, title: 'My PR', html_url: 'https://github.com/pr/42', merged: false, user: { login: 'zabal' }, base: { ref: 'main' } },
      repository: { full_name: 'bettercallzaal/ZAOOS', name: 'ZAOOS' },
      sender: { login: 'zabal' },
    };
    const req = makeGithubRequest(payload, 'pull_request');
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.handled).toBe('pull_request.opened');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ action: 'pr_opened' }));
  });

  it('returns ok:true skipped for push to non-default branch', async () => {
    const payload = {
      ref: 'refs/heads/feat/some-feature',
      commits: [{ id: 'abc', message: 'fix', author: { name: 'zabal' } }],
      pusher: { name: 'zabal' },
      repository: { full_name: 'bettercallzaal/ZAOOS', name: 'ZAOOS', default_branch: 'main' },
    };
    const req = makeGithubRequest(payload, 'push');
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.skipped).toBe('non-default-branch');
  });

  it('returns ok:true ignored for unhandled event types', async () => {
    const req = makeGithubRequest({ action: 'created' }, 'star');
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ignored).toBe('star');
  });
});
