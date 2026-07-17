// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPostCast = vi.hoisted(() => vi.fn());

vi.mock('@/lib/farcaster/neynar', () => ({ postCast: mockPostCast }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { autoCastToZao } from '../auto-cast';

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ZAO_OFFICIAL_SIGNER_UUID;
  delete process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;
});

describe('autoCastToZao', () => {
  it('returns null when ZAO_OFFICIAL_SIGNER_UUID is missing', async () => {
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    const result = await autoCastToZao('hello');
    expect(result).toBeNull();
    expect(mockPostCast).not.toHaveBeenCalled();
  });

  it('returns null when ZAO_OFFICIAL_NEYNAR_API_KEY is missing', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    const result = await autoCastToZao('hello');
    expect(result).toBeNull();
    expect(mockPostCast).not.toHaveBeenCalled();
  });

  it('returns null when both env vars are missing', async () => {
    const result = await autoCastToZao('hello');
    expect(result).toBeNull();
    expect(mockPostCast).not.toHaveBeenCalled();
  });

  it('passes short text (≤ 320 chars) through unchanged', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    const text = 'a'.repeat(320);
    mockPostCast.mockResolvedValue({ cast: { hash: 'hash-abc' } });

    await autoCastToZao(text);

    expect(mockPostCast).toHaveBeenCalledWith(
      'signer-uuid',
      text,
      'zao',
      undefined,
      undefined,
      undefined,
      undefined,
      'api-key',
    );
  });

  it('truncates text > 320 chars to exactly 320 chars (319 + ellipsis)', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    const text = 'b'.repeat(321);
    mockPostCast.mockResolvedValue({ cast: { hash: 'hash-abc' } });

    await autoCastToZao(text);

    const calledText = mockPostCast.mock.calls[0][1] as string;
    expect(calledText).toHaveLength(320);
    expect(calledText.endsWith('…')).toBe(true);
    expect(calledText.slice(0, 319)).toBe('b'.repeat(319));
  });

  it('returns the cast hash on success', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockResolvedValue({ cast: { hash: 'cast-hash-123' } });

    const result = await autoCastToZao('hello');

    expect(result).toBe('cast-hash-123');
  });

  it('returns null when result.cast is undefined', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockResolvedValue({ cast: undefined });

    const result = await autoCastToZao('hello');

    expect(result).toBeNull();
  });

  it('returns null when postCast throws', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockRejectedValue(new Error('network error'));

    const result = await autoCastToZao('hello');

    expect(result).toBeNull();
  });

  it('passes embedUrl as [embedUrl] when provided', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockResolvedValue({ cast: { hash: 'hash-xyz' } });

    await autoCastToZao('hello', 'https://example.com/post');

    expect(mockPostCast).toHaveBeenCalledWith(
      'signer-uuid',
      'hello',
      'zao',
      undefined,
      undefined,
      ['https://example.com/post'],
      undefined,
      'api-key',
    );
  });

  it('passes undefined embedUrls when no embedUrl given', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockResolvedValue({ cast: { hash: 'hash-xyz' } });

    await autoCastToZao('hello');

    expect(mockPostCast).toHaveBeenCalledWith(
      'signer-uuid',
      'hello',
      'zao',
      undefined,
      undefined,
      undefined,
      undefined,
      'api-key',
    );
  });
});
