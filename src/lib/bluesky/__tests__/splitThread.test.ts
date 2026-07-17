// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { splitIntoThread } from '../client';

describe('splitIntoThread', () => {
  it('returns a single-element array when text fits within maxLen', () => {
    const text = 'Hello Bluesky!';
    const result = splitIntoThread(text);
    expect(result).toEqual([text]);
  });

  it('returns a single element when text is exactly maxLen', () => {
    const text = 'a'.repeat(300);
    const result = splitIntoThread(text, 300);
    expect(result).toEqual([text]);
  });

  it('returns an empty-string chunk for empty input', () => {
    const result = splitIntoThread('');
    expect(result).toEqual(['']);
  });

  it('splits on sentence boundary (". ") when one exists before the midpoint', () => {
    // 'Sentence one. ' is 15 chars, then fill to > 30 so it must split
    const first = 'Sentence one.';
    const second = 'B'.repeat(30);
    const text = `${first} ${second}`;
    const chunks = splitIntoThread(text, 30);
    // First chunk should end at the sentence boundary
    expect(chunks[0]).toContain('Sentence one');
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('falls back to word boundary when no sentence boundary is near enough', () => {
    // No '. ' — only spaces
    const text = 'word '.repeat(20); // 100 chars
    const chunks = splitIntoThread(text.trim(), 20);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
    // Reassembled text should contain all words
    expect(chunks.join(' ').trim()).toBe(text.trim());
  });

  it('hard-splits at maxLen when no boundary is available', () => {
    const text = 'a'.repeat(50); // no spaces or periods
    const chunks = splitIntoThread(text, 20);
    // Each chunk should be at most maxLen characters
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
    // Full content preserved
    expect(chunks.join('')).toBe(text);
  });

  it('respects a custom maxLen', () => {
    const text = 'Hello World from Bluesky and ZAO Community'; // 42 chars
    const chunks = splitIntoThread(text, 20);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
  });

  it('produces multiple chunks for a long multi-sentence text', () => {
    const text = [
      'First sentence here.',
      'Second sentence here.',
      'Third sentence, quite long enough to force another split.',
    ].join(' ');
    const chunks = splitIntoThread(text, 40);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(40);
    }
  });
});
