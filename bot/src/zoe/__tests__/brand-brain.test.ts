import { afterEach, describe, expect, it, vi } from 'vitest';
import { brandBoxFor, fetchIcmBrain, brandSystemPreamble, _resetBrainCache } from '../brand-brain';

// Mock global fetch for ICM box API calls.
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.stubGlobal('fetch', fetchMock);

describe('brandBoxFor', () => {
  it('returns the box ID for a registered brand topic', () => {
    expect(brandBoxFor('ZABAL Games')).toBe('icm_PiCDHNNZ3WZpNoF59OA8Dw');
  });

  it('returns undefined for an unregistered topic', () => {
    expect(brandBoxFor('WaveWarZ')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(brandBoxFor(undefined)).toBeUndefined();
  });
});

describe('fetchIcmBrain', () => {
  afterEach(() => {
    fetchMock.mockReset();
    _resetBrainCache();
  });

  it('fetches and returns ICM brain text', async () => {
    const brandText = 'ZABAL Games: music mentorship, Magnetic platform...';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(brandText),
    });

    const result = await fetchIcmBrain('icm_test123');
    expect(result).toBe(brandText);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://useicm.com/api/objects/icm_test123/llm.txt',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('ZOE'),
          Origin: 'https://thezao.xyz',
        }),
      }),
    );
  });

  it('caches the result and does not re-fetch within 10 minutes', async () => {
    const brandText = 'ZABAL Games context';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(brandText),
    });

    const result1 = await fetchIcmBrain('icm_test123');
    const result2 = await fetchIcmBrain('icm_test123');

    expect(result1).toBe(brandText);
    expect(result2).toBe(brandText);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    const result = await fetchIcmBrain('icm_notfound');
    expect(result).toBeNull();
  });

  it('returns null on empty response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    const result = await fetchIcmBrain('icm_empty');
    expect(result).toBeNull();
  });

  it('returns null on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await fetchIcmBrain('icm_error');
    expect(result).toBeNull();
  });

  it('returns null on timeout (abort)', async () => {
    fetchMock.mockImplementation(() => {
      const err = new Error('Aborted');
      (err as any).name = 'AbortError';
      throw err;
    });

    const result = await fetchIcmBrain('icm_timeout');
    expect(result).toBeNull();
  });
});

describe('brandSystemPreamble', () => {
  it('builds a preamble with brand context and instructions', () => {
    const brandText = 'ZABAL: mentorship, music, creation';
    const preamble = brandSystemPreamble(brandText, 'ZABAL Games');

    expect(preamble).toContain('ZABAL Games');
    expect(preamble).toContain(brandText);
    expect(preamble).toContain('Stay in character');
    expect(preamble).toContain('<brand_context>');
    expect(preamble).toContain('</brand_context>');
  });

  it('does not use em-dashes or emojis', () => {
    const brandText = 'test';
    const preamble = brandSystemPreamble(brandText, 'TestBrand');

    expect(preamble).not.toMatch(/[—–]/); // em-dash or en-dash
    expect(preamble).not.toMatch(/[\p{Emoji}]/u); // emoji
  });
});
