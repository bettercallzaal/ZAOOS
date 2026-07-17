// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetValidTwitchToken = vi.hoisted(() => vi.fn());
const mockCreateTwitchPoll = vi.hoisted(() => vi.fn());
const mockEndTwitchPoll = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/twitch/client', () => ({
  getValidTwitchToken: mockGetValidTwitchToken,
  createTwitchPoll: mockCreateTwitchPoll,
  endTwitchPoll: mockEndTwitchPoll,
}));

import { PATCH, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10 };
const MOCK_CREDS = { accessToken: 'tok', userId: 'uid' };
const VALID_POLL_BODY = { title: 'Favorite ZAO track?', choices: ['Anthem', 'Wave'] };

function makePatchRequest(body: object) {
  return new NextRequest(new URL('/api/twitch/poll', 'http://localhost:3000'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('POST /api/twitch/poll', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/twitch/poll', VALID_POLL_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (too few choices)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/twitch/poll', { title: 'Q?', choices: ['One'] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when Twitch is not connected', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(null);
    const req = makePostRequest('/api/twitch/poll', VALID_POLL_BODY);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when createTwitchPoll returns null (stream not live)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchPoll.mockResolvedValue(null);
    const req = makePostRequest('/api/twitch/poll', VALID_POLL_BODY);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns success:true with pollId on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockCreateTwitchPoll.mockResolvedValue({ id: 'poll-abc123' });
    const req = makePostRequest('/api/twitch/poll', VALID_POLL_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pollId).toBe('poll-abc123');
  });
});

describe('PATCH /api/twitch/poll', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ pollId: 'p1', status: 'TERMINATED' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when Twitch is not connected', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ pollId: 'p1', status: 'TERMINATED' }));
    expect(res.status).toBe(400);
  });

  it('returns success:true when poll ended', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetValidTwitchToken.mockResolvedValue(MOCK_CREDS);
    mockEndTwitchPoll.mockResolvedValue(true);
    const res = await PATCH(makePatchRequest({ pollId: 'p1', status: 'ARCHIVED' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
