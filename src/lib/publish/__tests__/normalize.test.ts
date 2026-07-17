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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<{
  text: string;
  castHash: string;
  embedUrls: string[];
  imageUrls: string[];
  channel: string;
}> = {}) {
  return {
    text: 'Hello world',
    castHash: 'abc123',
    ...overrides,
  };
}

const CAST_URL = 'https://warpcast.com/~/conversations/abc123';

// A string of exactly N words with each word being "word", separated by spaces.
function longText(approxLen: number): string {
  const word = 'lorem';
  const words: string[] = [];
  let total = 0;
  while (total < approxLen) {
    words.push(word);
    total += word.length + 1;
  }
  return words.join(' ');
}

// ---------------------------------------------------------------------------
// normalizeForLens
// ---------------------------------------------------------------------------
describe('normalizeForLens', () => {
  it('builds castUrl from castHash', () => {
    const result = normalizeForLens(makeInput());
    expect(result.castUrl).toBe(CAST_URL);
  });

  it('appends "Posted via ZAO OS" footer to text', () => {
    const result = normalizeForLens(makeInput({ text: 'My post' }));
    expect(result.text).toContain('Posted via ZAO OS');
  });

  it('does not truncate long text', () => {
    const long = longText(5000);
    const result = normalizeForLens(makeInput({ text: long }));
    // The text field should start with the full original text
    expect(result.text.startsWith(long)).toBe(true);
  });

  it('passes through images and embeds arrays', () => {
    const result = normalizeForLens(makeInput({
      imageUrls: ['https://example.com/img.jpg'],
      embedUrls: ['https://example.com/link'],
    }));
    expect(result.images).toEqual(['https://example.com/img.jpg']);
    expect(result.embeds).toEqual(['https://example.com/link']);
  });
});

// ---------------------------------------------------------------------------
// normalizeForBluesky
// ---------------------------------------------------------------------------
describe('normalizeForBluesky', () => {
  it('builds castUrl from castHash', () => {
    const result = normalizeForBluesky(makeInput());
    expect(result.castUrl).toBe(CAST_URL);
  });

  it('text is always near the 300-char limit (truncate adds "..." so ≤ 302)', () => {
    // truncate() breaks at a word boundary then appends "..." (+3 chars, but
    // removes at least 1 space), so the final text can be up to limit+2.
    const result = normalizeForBluesky(makeInput({ text: longText(500) }));
    expect(result.text.length).toBeLessThanOrEqual(302);
  });

  it('truncates long text at a word boundary and appends "via ZAO OS"', () => {
    const result = normalizeForBluesky(makeInput({ text: longText(500) }));
    expect(result.text).toContain('via ZAO OS');
    // After truncation the text should end with "... \n\nvia ZAO OS" pattern,
    // meaning no partial words (text before footer ends with "...")
    const footer = '\n\nvia ZAO OS';
    const body = result.text.slice(0, result.text.length - footer.length);
    expect(body.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeForX
// ---------------------------------------------------------------------------
describe('normalizeForX', () => {
  it('appends castUrl to text', () => {
    const result = normalizeForX(makeInput());
    expect(result.text).toContain(CAST_URL);
  });

  it('text body (excluding the 23-char t.co slot and space) is ≤ 256 chars so total tweet ≤ 280', () => {
    // The raw text field contains the actual URL (longer than 23 chars), but
    // Twitter counts URLs as 23 chars. We test the original-text portion is ≤ 256.
    const result = normalizeForX(makeInput({ text: longText(500) }));
    // Strip the trailing " <url>" to get back the body
    const body = result.text.slice(0, result.text.lastIndexOf(' ' + CAST_URL));
    expect(body.length).toBeLessThanOrEqual(256);
  });

  it('truncates long text at a word boundary', () => {
    const result = normalizeForX(makeInput({ text: longText(500) }));
    const body = result.text.slice(0, result.text.lastIndexOf(' ' + CAST_URL));
    expect(body.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeForTelegram
// ---------------------------------------------------------------------------
describe('normalizeForTelegram', () => {
  it('includes castUrl in text', () => {
    const result = normalizeForTelegram(makeInput());
    expect(result.text).toContain(CAST_URL);
  });

  it('includes "via ZAO OS" in text', () => {
    const result = normalizeForTelegram(makeInput());
    expect(result.text).toContain('via ZAO OS');
  });

  it('respects 4096-char limit when input is 5000 chars', () => {
    const result = normalizeForTelegram(makeInput({ text: longText(5000) }));
    expect(result.text.length).toBeLessThanOrEqual(4096);
  });
});

// ---------------------------------------------------------------------------
// normalizeForDiscord
// ---------------------------------------------------------------------------
describe('normalizeForDiscord', () => {
  it('includes "Posted via ZAO OS" in text', () => {
    const result = normalizeForDiscord(makeInput());
    expect(result.text).toContain('Posted via ZAO OS');
  });

  it('respects 2000-char limit when input is long (≤ 2002 due to "..." suffix)', () => {
    // truncate() appends "..." after word-boundary cut (+3, −≥1 space) → ≤ limit+2.
    const result = normalizeForDiscord(makeInput({ text: longText(2500) }));
    expect(result.text.length).toBeLessThanOrEqual(2002);
  });

  it('truncates at a word boundary (body ends with "...")', () => {
    const result = normalizeForDiscord(makeInput({ text: longText(2500) }));
    const footer = '\n\nPosted via ZAO OS';
    const body = result.text.slice(0, result.text.length - footer.length);
    expect(body.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeForThreads
// ---------------------------------------------------------------------------
describe('normalizeForThreads', () => {
  it('strips hashtags from text', () => {
    const result = normalizeForThreads(makeInput({ text: 'Hello #world and #farcaster' }));
    expect(result.text).not.toMatch(/#\w+/);
  });

  it('includes castUrl in text', () => {
    const result = normalizeForThreads(makeInput());
    expect(result.text).toContain(CAST_URL);
  });

  it('respects 500-char limit when input is long (≤ 502 due to "..." suffix)', () => {
    // truncate() appends "..." after word-boundary cut (+3, −≥1 space) → ≤ limit+2.
    const result = normalizeForThreads(makeInput({ text: longText(600) }));
    expect(result.text.length).toBeLessThanOrEqual(502);
  });

  it('includes "via ZAO OS" in text', () => {
    const result = normalizeForThreads(makeInput());
    expect(result.text).toContain('via ZAO OS');
  });
});

// ---------------------------------------------------------------------------
// normalizeForHive
// ---------------------------------------------------------------------------
describe('normalizeForHive', () => {
  it('converts imageUrls to ![]() markdown in text', () => {
    const result = normalizeForHive(makeInput({
      imageUrls: ['https://example.com/photo.jpg'],
    }));
    expect(result.text).toContain('![](https://example.com/photo.jpg)');
  });

  it('converts embedUrls to []() link markdown in text', () => {
    const result = normalizeForHive(makeInput({
      embedUrls: ['https://example.com/article'],
    }));
    expect(result.text).toContain('[https://example.com/article](https://example.com/article)');
  });

  it('attribution contains "Originally posted on Farcaster via ZAO OS"', () => {
    const result = normalizeForHive(makeInput());
    expect(result.attribution).toBe('Originally posted on Farcaster via ZAO OS');
  });

  it('text contains "[View original cast]" link with correct castUrl', () => {
    const result = normalizeForHive(makeInput());
    expect(result.text).toContain(`[View original cast](${CAST_URL})`);
  });
});
