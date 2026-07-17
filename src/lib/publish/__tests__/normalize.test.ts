// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  normalizeForBluesky,
  normalizeForDiscord,
  normalizeForHive,
  normalizeForLens,
  normalizeForTelegram,
  normalizeForThreads,
  normalizeForX,
} from '../normalize';

const BASE_INPUT = {
  text: 'Check out the new ZAO Concertz #7 featuring WaveWarZ!',
  castHash: '0xabc123def456',
};

const CAST_URL = 'https://warpcast.com/~/conversations/0xabc123def456';

// ---------------------------------------------------------------------------
// normalizeForLens
// ---------------------------------------------------------------------------
describe('normalizeForLens', () => {
  it('appends attribution footer to text', () => {
    const result = normalizeForLens(BASE_INPUT);
    expect(result.text).toContain('Posted via ZAO OS');
    expect(result.text).toContain(BASE_INPUT.text);
  });

  it('preserves full text without truncation', () => {
    const long = 'a'.repeat(5000);
    const result = normalizeForLens({ ...BASE_INPUT, text: long });
    expect(result.text).toContain(long);
  });

  it('returns correct castUrl', () => {
    const result = normalizeForLens(BASE_INPUT);
    expect(result.castUrl).toBe(CAST_URL);
  });

  it('passes through imageUrls and embedUrls', () => {
    const result = normalizeForLens({
      ...BASE_INPUT,
      imageUrls: ['https://cdn.zao.com/img.jpg'],
      embedUrls: ['https://embed.example.com'],
    });
    expect(result.images).toEqual(['https://cdn.zao.com/img.jpg']);
    expect(result.embeds).toEqual(['https://embed.example.com']);
  });

  it('defaults images and embeds to empty arrays when not provided', () => {
    const result = normalizeForLens(BASE_INPUT);
    expect(result.images).toEqual([]);
    expect(result.embeds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// normalizeForBluesky
// ---------------------------------------------------------------------------
describe('normalizeForBluesky', () => {
  it('final text is at most 300 characters', () => {
    const long = 'word '.repeat(100).trim();
    const result = normalizeForBluesky({ ...BASE_INPUT, text: long });
    expect(result.text.length).toBeLessThanOrEqual(300);
  });

  it('includes attribution in output', () => {
    const result = normalizeForBluesky(BASE_INPUT);
    expect(result.text).toContain('via ZAO OS');
  });

  it('does not truncate short text', () => {
    const result = normalizeForBluesky(BASE_INPUT);
    expect(result.text).toContain(BASE_INPUT.text);
  });

  it('breaks truncation on word boundary, not mid-word', () => {
    const text = 'word '.repeat(70).trim();
    const result = normalizeForBluesky({ ...BASE_INPUT, text });
    const truncatedPart = result.text.split('\n\n')[0];
    expect(truncatedPart.endsWith('...')).toBe(true);
    // The part before '...' must end with a complete word, not a partial one
    const beforeEllipsis = truncatedPart.slice(0, -3);
    expect(beforeEllipsis).toMatch(/\bword$/); // ends on the full word "word"
  });
});

// ---------------------------------------------------------------------------
// normalizeForX
// ---------------------------------------------------------------------------
describe('normalizeForX', () => {
  it('appends cast URL to text', () => {
    const result = normalizeForX(BASE_INPUT);
    expect(result.text).toContain(CAST_URL);
  });

  it('total text is at most 280 characters (accounting for t.co wrapping)', () => {
    const long = 'word '.repeat(60).trim();
    const result = normalizeForX({ ...BASE_INPUT, text: long });
    // The full output string may exceed 280 due to original URL length,
    // but the text portion before the URL must be <= 256 chars (280 - 23 - 1)
    const parts = result.text.split(' ');
    const textPart = parts.slice(0, -1).join(' ');
    expect(textPart.length).toBeLessThanOrEqual(256);
  });

  it('does not truncate short text', () => {
    const result = normalizeForX(BASE_INPUT);
    expect(result.text).toContain(BASE_INPUT.text);
  });

  it('sets attribution to the cast URL', () => {
    const result = normalizeForX(BASE_INPUT);
    expect(result.attribution).toBe(CAST_URL);
  });
});

// ---------------------------------------------------------------------------
// normalizeForTelegram
// ---------------------------------------------------------------------------
describe('normalizeForTelegram', () => {
  it('final text is at most 4096 characters', () => {
    const long = 'word '.repeat(1000).trim();
    const result = normalizeForTelegram({ ...BASE_INPUT, text: long });
    expect(result.text.length).toBeLessThanOrEqual(4096);
  });

  it('includes attribution and cast URL in footer', () => {
    const result = normalizeForTelegram(BASE_INPUT);
    expect(result.text).toContain('via ZAO OS');
    expect(result.text).toContain(CAST_URL);
  });

  it('does not truncate short text', () => {
    const result = normalizeForTelegram(BASE_INPUT);
    expect(result.text).toContain(BASE_INPUT.text);
  });
});

// ---------------------------------------------------------------------------
// normalizeForDiscord
// ---------------------------------------------------------------------------
describe('normalizeForDiscord', () => {
  it('final text is at most 2000 characters', () => {
    const long = 'word '.repeat(500).trim();
    const result = normalizeForDiscord({ ...BASE_INPUT, text: long });
    expect(result.text.length).toBeLessThanOrEqual(2000);
  });

  it('appends attribution footer', () => {
    const result = normalizeForDiscord(BASE_INPUT);
    expect(result.text).toContain('Posted via ZAO OS');
  });

  it('does not truncate short text', () => {
    const result = normalizeForDiscord(BASE_INPUT);
    expect(result.text).toContain(BASE_INPUT.text);
  });
});

// ---------------------------------------------------------------------------
// normalizeForThreads
// ---------------------------------------------------------------------------
describe('normalizeForThreads', () => {
  it('final text is at most 500 characters', () => {
    const long = 'word '.repeat(200).trim();
    const result = normalizeForThreads({ ...BASE_INPUT, text: long });
    expect(result.text.length).toBeLessThanOrEqual(500);
  });

  it('strips hashtags from text', () => {
    const withTags = { ...BASE_INPUT, text: 'Great show #COC7 #WaveWarZ tonight!' };
    const result = normalizeForThreads(withTags);
    expect(result.text).not.toMatch(/#\w+/);
  });

  it('includes attribution and cast URL', () => {
    const result = normalizeForThreads(BASE_INPUT);
    expect(result.text).toContain('via ZAO OS');
    expect(result.text).toContain(CAST_URL);
  });
});

// ---------------------------------------------------------------------------
// normalizeForHive
// ---------------------------------------------------------------------------
describe('normalizeForHive', () => {
  it('preserves full text (no character limit)', () => {
    const long = 'word '.repeat(1000).trim();
    const result = normalizeForHive({ ...BASE_INPUT, text: long });
    expect(result.text).toContain(long);
  });

  it('converts imageUrls to markdown image syntax', () => {
    const result = normalizeForHive({
      ...BASE_INPUT,
      imageUrls: ['https://cdn.zao.com/img1.jpg', 'https://cdn.zao.com/img2.jpg'],
    });
    expect(result.text).toContain('![](https://cdn.zao.com/img1.jpg)');
    expect(result.text).toContain('![](https://cdn.zao.com/img2.jpg)');
  });

  it('converts embedUrls to markdown link syntax', () => {
    const result = normalizeForHive({
      ...BASE_INPUT,
      embedUrls: ['https://embed.example.com/track'],
    });
    expect(result.text).toContain('[https://embed.example.com/track](https://embed.example.com/track)');
  });

  it('appends attribution footer with original cast link', () => {
    const result = normalizeForHive(BASE_INPUT);
    expect(result.text).toContain('Originally posted on Farcaster via ZAO OS');
    expect(result.text).toContain(`[View original cast](${CAST_URL})`);
  });

  it('includes --- separator before footer', () => {
    const result = normalizeForHive(BASE_INPUT);
    expect(result.text).toContain('---');
  });

  it('returns empty arrays when no images or embeds provided', () => {
    const result = normalizeForHive(BASE_INPUT);
    expect(result.images).toEqual([]);
    expect(result.embeds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// castHash passthrough
// ---------------------------------------------------------------------------
describe('castHash passthrough', () => {
  it('all normalizers return the same castHash', () => {
    const hash = '0xdeadbeef';
    const input = { text: 'hello', castHash: hash };
    for (const fn of [
      normalizeForLens,
      normalizeForBluesky,
      normalizeForX,
      normalizeForTelegram,
      normalizeForDiscord,
      normalizeForThreads,
      normalizeForHive,
    ]) {
      expect(fn(input).castHash).toBe(hash);
    }
  });

  it('all normalizers build the correct castUrl from castHash', () => {
    const hash = '0x99887766';
    const expectedUrl = `https://warpcast.com/~/conversations/${hash}`;
    const input = { text: 'test', castHash: hash };
    for (const fn of [
      normalizeForLens,
      normalizeForBluesky,
      normalizeForX,
      normalizeForTelegram,
      normalizeForDiscord,
      normalizeForThreads,
      normalizeForHive,
    ]) {
      expect(fn(input).castUrl).toBe(expectedUrl);
    }
  });
});
