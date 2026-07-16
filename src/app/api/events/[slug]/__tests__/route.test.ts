import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const { mockGetEventBySlug, mockLogger } = vi.hoisted(() => ({
  mockGetEventBySlug: vi.fn(),
  mockLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/unlock/events', () => ({
  getEventBySlug: mockGetEventBySlug,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { GET } from '../route';

/** A valid published event. */
const SAMPLE_EVENT = {
  id: 'evt-1',
  slug: 'community-gathering-2026',
  title: 'Community Gathering 2026',
  description: 'A gathering of the ZAO community.',
  lock_address: '0x1234567890abcdef1234567890abcdef12345678',
  unlock_event_url: 'https://unlock-protocol.com/event/1',
  chain_id: 8453, // Base
  starts_at: '2026-07-20T10:00:00Z',
  ends_at: '2026-07-20T15:00:00Z',
  location: 'Virtual',
  is_published: true,
};

/** An unpublished event. */
const UNPUBLISHED_EVENT = {
  ...SAMPLE_EVENT,
  is_published: false,
};

describe('GET /api/events/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Validation Tests ==========

  it('returns 400 when slug is empty string', async () => {
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: '' });

    const res = await GET(req, { params });
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid event slug');
  });

  it('returns 400 when slug exceeds max length (100 chars)', async () => {
    const longSlug = 'a'.repeat(101);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: longSlug });

    const res = await GET(req, { params });
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid event slug');
  });

  it('returns 400 when slug is exactly 101 characters (exceeds 100 max)', async () => {
    const exactlyTooLong = 'b'.repeat(101);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: exactlyTooLong });

    const res = await GET(req, { params });
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Invalid event slug');
  });

  // ========== Valid Slug Tests ==========

  it('accepts slug at minimum length (1 character)', async () => {
    mockGetEventBySlug.mockResolvedValue(null);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'x' });

    const _res = await GET(req, { params });

    expect(mockGetEventBySlug).toHaveBeenCalledWith('x');
  });

  it('accepts slug at maximum length (100 characters)', async () => {
    const maxLengthSlug = 'c'.repeat(100);
    mockGetEventBySlug.mockResolvedValue(null);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: maxLengthSlug });

    const _res = await GET(req, { params });

    expect(mockGetEventBySlug).toHaveBeenCalledWith(maxLengthSlug);
  });

  // ========== Event Not Found ==========

  it('returns 404 when event is not found', async () => {
    mockGetEventBySlug.mockResolvedValue(null);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'nonexistent-event' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Event not found');
  });

  it('returns 404 when event exists but is not published', async () => {
    mockGetEventBySlug.mockResolvedValue(UNPUBLISHED_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'unpublished-event' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Event not found');
  });

  // ========== Success Path ==========

  it('returns 200 with event when event is found and published', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('event');
    expect(body.event).toEqual(SAMPLE_EVENT);
  });

  it('returns complete event object with all fields', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });
    const body = (await res.json()) as Record<string, unknown>;
    const event = body.event as Record<string, unknown>;

    expect(event).toHaveProperty('id', 'evt-1');
    expect(event).toHaveProperty('slug', 'community-gathering-2026');
    expect(event).toHaveProperty('title', 'Community Gathering 2026');
    expect(event).toHaveProperty('description');
    expect(event).toHaveProperty('lock_address');
    expect(event).toHaveProperty('unlock_event_url');
    expect(event).toHaveProperty('chain_id', 8453);
    expect(event).toHaveProperty('starts_at');
    expect(event).toHaveProperty('ends_at');
    expect(event).toHaveProperty('location');
    expect(event).toHaveProperty('is_published', true);
  });

  it('calls getEventBySlug with the parsed slug', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'test-slug-123' });

    await GET(req, { params });

    expect(mockGetEventBySlug).toHaveBeenCalledWith('test-slug-123');
    expect(mockGetEventBySlug).toHaveBeenCalledTimes(1);
  });

  // ========== Partial/Null Fields ==========

  it('handles event with null optional fields', async () => {
    const eventWithNulls = {
      ...SAMPLE_EVENT,
      description: null,
      lock_address: null,
      unlock_event_url: null,
      starts_at: null,
      ends_at: null,
      location: null,
    };
    mockGetEventBySlug.mockResolvedValue(eventWithNulls);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'sparse-event' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.event).toEqual(eventWithNulls);
  });

  // ========== Error Handling ==========

  it('returns 500 when getEventBySlug throws an error', async () => {
    mockGetEventBySlug.mockRejectedValue(new Error('Database connection failed'));
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Server error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[events/[slug]] Unexpected error:',
      expect.any(Error),
    );
  });

  it('logs error details when exception occurs', async () => {
    const testError = new Error('Query failed');
    mockGetEventBySlug.mockRejectedValue(testError);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    await GET(req, { params });

    expect(mockLogger.error).toHaveBeenCalledWith('[events/[slug]] Unexpected error:', testError);
  });

  it('handles getEventBySlug rejection with non-Error objects', async () => {
    mockGetEventBySlug.mockRejectedValue('Unknown error string');
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Server error');
  });

  // ========== Edge Cases ==========

  it('handles slug with special characters (preserved as-is for lookup)', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'event-with-dashes_and_underscores' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    expect(mockGetEventBySlug).toHaveBeenCalledWith('event-with-dashes_and_underscores');
  });

  it('does not require authentication (public route)', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    // No session check or auth error
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('returns 404 for falsy event (null or undefined)', async () => {
    mockGetEventBySlug.mockResolvedValue(undefined);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'missing-event' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('error', 'Event not found');
  });

  // ========== Response Format ==========

  it('returns NextResponse.json format with proper headers', async () => {
    mockGetEventBySlug.mockResolvedValue(SAMPLE_EVENT);
    const req = makeRequest('/api/events/[slug]');
    const params = Promise.resolve({ slug: 'community-gathering-2026' });

    const res = await GET(req, { params });

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
