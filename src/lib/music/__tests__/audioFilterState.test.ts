// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveFilterKey, setActiveFilterKey } from '../audioFilterState';

describe('audioFilterState', () => {
  beforeEach(() => {
    setActiveFilterKey(null);
  });

  it('returns null initially after reset', () => {
    expect(getActiveFilterKey()).toBeNull();
  });

  it('returns the key after setActiveFilterKey is called', () => {
    setActiveFilterKey('reverb');
    expect(getActiveFilterKey()).toBe('reverb');
  });

  it('returns null after setting a key then resetting to null', () => {
    setActiveFilterKey('reverb');
    setActiveFilterKey(null);
    expect(getActiveFilterKey()).toBeNull();
  });

  it('overwrites the previous key when a new key is set', () => {
    setActiveFilterKey('reverb');
    setActiveFilterKey('echo');
    expect(getActiveFilterKey()).toBe('echo');
  });

  it('is idempotent when the same key is set twice', () => {
    setActiveFilterKey('reverb');
    setActiveFilterKey('reverb');
    expect(getActiveFilterKey()).toBe('reverb');
  });

  it('works with a non-simple key string like filter-123-abc', () => {
    setActiveFilterKey('filter-123-abc');
    expect(getActiveFilterKey()).toBe('filter-123-abc');
  });
});
