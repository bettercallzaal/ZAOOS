// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// STREAM_API_SECRET is a module-level const — must set before module import
vi.hoisted(() => {
  process.env.STREAM_API_SECRET = 'test-stream-secret';
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/security/timingSafeEqual', () => ({ timingSafeEqual: vi.fn().mockReturnValue(true) }));

const mockRpc = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockReturnValue({ update: mockUpdate }),
);
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom, rpc: mockRpc },
}));

import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

function makeWebhookRequest(body: object, signature = 'valid-sig') {
  const bodyStr = JSON.stringify(body);
  return new NextRequest(new URL('/api/stream/webhook', 'http://localhost:3000'), {
    method: 'POST',
    body: bodyStr,
    headers: { 'x-signature': signature },
  });
}

describe('POST /api/stream/webhook', () => {
  it('returns 401 when no signature header is provided (empty string)', async () => {
    // Empty signature → !signature is true → verifySignature returns false immediately
    const req = makeWebhookRequest({ type: 'call.live_started', call_cid: 'audio_room:abc' }, '');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns ok:true for unhandled event types', async () => {
    const req = makeWebhookRequest({ type: 'call.live_started', call_cid: 'audio_room:abc' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('increments participant count on session_participant_joined', async () => {
    mockRpc.mockResolvedValue({ error: null });
    const req = makeWebhookRequest({
      type: 'call.session_participant_joined',
      call_cid: 'audio_room:room-uuid-1',
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('increment_participant_count', { room_id: 'room-uuid-1' });
  });

  it('marks room as ended on call.ended event', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    const req = makeWebhookRequest({ type: 'call.ended', call_cid: 'audio_room:room-uuid-2' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ state: 'ended' }));
  });
});
