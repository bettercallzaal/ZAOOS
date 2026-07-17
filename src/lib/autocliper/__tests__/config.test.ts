// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// postizConfig
// ---------------------------------------------------------------------------
describe('postizConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.POSTIZ_API_KEY;
    delete process.env.POSTIZ_API_URL;
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.POSTIZ_API_KEY;
    delete process.env.POSTIZ_API_URL;
  });

  it('platforms has all 4 values in order', async () => {
    const { postizConfig } = await import('../config');
    expect(postizConfig.platforms).toEqual(['warpcast', 'x', 'bluesky', 'discord']);
  });

  it('rateLimitPerHour is 90', async () => {
    const { postizConfig } = await import('../config');
    expect(postizConfig.rateLimitPerHour).toBe(90);
  });

  it('baseUrl defaults to the postiz public v1 URL when POSTIZ_API_URL is unset', async () => {
    const { postizConfig } = await import('../config');
    expect(postizConfig.baseUrl).toBe('https://api.postiz.com/public/v1');
  });

  it('baseUrl uses POSTIZ_API_URL when set', async () => {
    process.env.POSTIZ_API_URL = 'https://custom.postiz.internal/v2';
    const { postizConfig } = await import('../config');
    expect(postizConfig.baseUrl).toBe('https://custom.postiz.internal/v2');
  });

  it('apiKey is undefined when POSTIZ_API_KEY is unset', async () => {
    const { postizConfig } = await import('../config');
    expect(postizConfig.apiKey).toBeUndefined();
  });

  it('apiKey is set when POSTIZ_API_KEY is provided', async () => {
    process.env.POSTIZ_API_KEY = 'test-key-abc123';
    const { postizConfig } = await import('../config');
    expect(postizConfig.apiKey).toBe('test-key-abc123');
  });
});

// ---------------------------------------------------------------------------
// clipperConfig
// ---------------------------------------------------------------------------
describe('clipperConfig', () => {
  it('videoMaxSizeMB is 500', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.videoMaxSizeMB).toBe(500);
  });

  it('supportedFormats includes mp4, mov, webm, mkv', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.supportedFormats).toContain('mp4');
    expect(clipperConfig.supportedFormats).toContain('mov');
    expect(clipperConfig.supportedFormats).toContain('webm');
    expect(clipperConfig.supportedFormats).toContain('mkv');
  });

  it('transcriptionProvider is whisper', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.transcriptionProvider).toBe('whisper');
  });

  it('defaultAspectRatio is 9:16', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.defaultAspectRatio).toBe('9:16');
  });

  it('captionMaxChars is 300', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.captionMaxChars).toBe(300);
  });

  it('captionMustMention is /wavewarz', async () => {
    const { clipperConfig } = await import('../config');
    expect(clipperConfig.captionMustMention).toBe('/wavewarz');
  });
});
