import { describe, it, expect, vi } from 'vitest';
import { sanitizeErrorForUser } from '../user-errors';

describe('sanitizeErrorForUser', () => {
  it('redacts absolute unix paths', () => {
    const out = sanitizeErrorForUser(new Error('ENOENT: /Users/zaal/inbox/voice-note.m4a not found'));
    expect(out).not.toContain('/Users/zaal');
    expect(out).toContain('<path>');
  });

  it('redacts home-dir and file:// paths', () => {
    const out = sanitizeErrorForUser(new Error('cannot read file:///home/zaal/.zao/private/keys.json'));
    expect(out).not.toContain('/home/zaal');
    expect(out).not.toContain('.zao/private');
  });

  it('redacts tokens and long hashes', () => {
    // fixtures built at runtime so no secret-shaped literal sits in source (pre-commit hook)
    const ghp = `ghp_${'a'.repeat(36)}`;
    const hex = '0123456789abcdef'.repeat(3); // 48 hex chars
    const skant = `sk-ant-${'z'.repeat(30)}`;
    expect(sanitizeErrorForUser(new Error(`auth failed with ${ghp}`))).not.toContain(ghp);
    expect(sanitizeErrorForUser(new Error(`bad sig ${hex}`))).toContain('<redacted>');
    expect(sanitizeErrorForUser(new Error(`Bearer ${skant}`))).not.toContain(skant);
  });

  it('adds the action prefix', () => {
    expect(sanitizeErrorForUser(new Error('boom'), { action: 'Transcription' })).toBe('Transcription failed - boom');
  });

  it('clips long messages on a word boundary', () => {
    const long = `Transcription failed with ${'word '.repeat(60)}end`;
    const out = sanitizeErrorForUser(new Error(long), { max: 60 });
    expect(out.length).toBeLessThanOrEqual(64);
    expect(out.endsWith('...')).toBe(true);
    expect(out).not.toMatch(/wor$/); // no mid-word cut
  });

  it('handles non-Error throwables', () => {
    expect(sanitizeErrorForUser('plain string oops')).toBe('plain string oops');
    expect(sanitizeErrorForUser(null)).toBe('unknown error');
  });

  it('logs the raw error internally only when asked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sanitizeErrorForUser(new Error('x'), { log: false });
    expect(spy).not.toHaveBeenCalled();
    sanitizeErrorForUser(new Error('y'), { log: true, action: 'Note save' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
