// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_SHELL, getAllShells, getShell, SHELLS } from '../shells';

describe('SHELLS constant', () => {
  it('defines exactly four shell variants', () => {
    expect(Object.keys(SHELLS)).toHaveLength(4);
  });

  it('includes phone, desktop, dashboard, and feed shells', () => {
    expect(SHELLS).toHaveProperty('phone');
    expect(SHELLS).toHaveProperty('desktop');
    expect(SHELLS).toHaveProperty('dashboard');
    expect(SHELLS).toHaveProperty('feed');
  });

  it('each shell has a non-empty id, name, description, and icon', () => {
    for (const shell of Object.values(SHELLS)) {
      expect(shell.id).toBeTruthy();
      expect(shell.name).toBeTruthy();
      expect(shell.description).toBeTruthy();
      expect(shell.icon).toBeTruthy();
    }
  });

  it('each shell id matches its key in SHELLS', () => {
    for (const [key, shell] of Object.entries(SHELLS)) {
      expect(shell.id).toBe(key);
    }
  });
});

describe('DEFAULT_SHELL', () => {
  it('is "phone"', () => {
    expect(DEFAULT_SHELL).toBe('phone');
  });

  it('is a valid key in SHELLS', () => {
    expect(SHELLS).toHaveProperty(DEFAULT_SHELL);
  });
});

describe('getShell', () => {
  it('returns the correct shell for "phone"', () => {
    expect(getShell('phone').id).toBe('phone');
  });

  it('returns the correct shell for "dashboard"', () => {
    expect(getShell('dashboard').id).toBe('dashboard');
  });

  it('returns the correct shell for "desktop"', () => {
    expect(getShell('desktop').name).toBeTruthy();
  });

  it('returns the correct shell for "feed"', () => {
    expect(getShell('feed').id).toBe('feed');
  });
});

describe('getAllShells', () => {
  it('returns an array of four shells', () => {
    const shells = getAllShells();
    expect(shells).toHaveLength(4);
  });

  it('all returned shells have non-empty names', () => {
    for (const shell of getAllShells()) {
      expect(shell.name.length).toBeGreaterThan(0);
    }
  });
});
