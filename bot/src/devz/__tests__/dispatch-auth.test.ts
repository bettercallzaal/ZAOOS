import { describe, it, expect } from 'vitest';
import { safeEqual, isValidDocPath } from '../dispatch-auth';

// First unit coverage for the ZAO Devz module (doc 869: was zero tests).
describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('s3cret-token', 's3cret-token')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(safeEqual('aaaaaa', 'aaaaab')).toBe(false);
  });

  it('returns false for different-length strings (no throw)', () => {
    expect(safeEqual('short', 'a-much-longer-secret')).toBe(false);
  });

  it('returns false when one side is empty', () => {
    expect(safeEqual('', 'secret')).toBe(false);
    expect(safeEqual('secret', '')).toBe(false);
  });

  it('treats empty/empty as equal', () => {
    expect(safeEqual('', '')).toBe(true);
  });
});

describe('isValidDocPath', () => {
  it('accepts a normal research doc path', () => {
    expect(isValidDocPath('research/agents/869-bot-fleet-audit-2026-06/README.md')).toBe(true);
  });

  it('accepts a top-level .md file', () => {
    expect(isValidDocPath('README.md')).toBe(true);
  });

  it('rejects empty input', () => {
    expect(isValidDocPath('')).toBe(false);
  });

  it('rejects path traversal', () => {
    expect(isValidDocPath('../../../etc/passwd.md')).toBe(false);
    expect(isValidDocPath('research/../../secret.md')).toBe(false);
  });

  it('rejects non-.md files', () => {
    expect(isValidDocPath('research/notes.txt')).toBe(false);
    expect(isValidDocPath('src/app/api/route.ts')).toBe(false);
  });

  it('rejects absolute paths and leading separators', () => {
    expect(isValidDocPath('/etc/passwd.md')).toBe(false);
  });

  it('rejects paths with shell-ish characters', () => {
    expect(isValidDocPath('research/x;rm -rf.md')).toBe(false);
    expect(isValidDocPath('research/$(whoami).md')).toBe(false);
  });
});
