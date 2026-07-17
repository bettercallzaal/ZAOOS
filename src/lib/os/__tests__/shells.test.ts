// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_SHELL, SHELLS, getAllShells, getShell } from '../shells';

const VALID_IDS = ['phone', 'desktop', 'dashboard', 'feed'] as const;

// ---------------------------------------------------------------------------
// SHELLS constant
// ---------------------------------------------------------------------------

describe('SHELLS', () => {
  it('has exactly 4 shells', () => {
    expect(Object.keys(SHELLS)).toHaveLength(4);
  });

  it('includes phone, desktop, dashboard, and feed keys', () => {
    for (const id of VALID_IDS) {
      expect(SHELLS).toHaveProperty(id);
    }
  });

  it('every shell has id, name, description, and icon fields', () => {
    for (const shell of Object.values(SHELLS)) {
      expect(typeof shell.id).toBe('string');
      expect(typeof shell.name).toBe('string');
      expect(typeof shell.description).toBe('string');
      expect(typeof shell.icon).toBe('string');
    }
  });

  it('each shell\'s id matches its key in the record', () => {
    for (const [key, shell] of Object.entries(SHELLS)) {
      expect(shell.id).toBe(key);
    }
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_SHELL
// ---------------------------------------------------------------------------

describe('DEFAULT_SHELL', () => {
  it('is "phone"', () => {
    expect(DEFAULT_SHELL).toBe('phone');
  });

  it('exists as a key in SHELLS', () => {
    expect(SHELLS).toHaveProperty(DEFAULT_SHELL);
  });
});

// ---------------------------------------------------------------------------
// getShell
// ---------------------------------------------------------------------------

describe('getShell', () => {
  it('returns the phone shell for "phone"', () => {
    expect(getShell('phone').id).toBe('phone');
  });

  it('returns the desktop shell for "desktop"', () => {
    expect(getShell('desktop').id).toBe('desktop');
  });

  it('returns the dashboard shell for "dashboard"', () => {
    expect(getShell('dashboard').id).toBe('dashboard');
  });

  it('returns the feed shell for "feed"', () => {
    expect(getShell('feed').id).toBe('feed');
  });
});

// ---------------------------------------------------------------------------
// getAllShells
// ---------------------------------------------------------------------------

describe('getAllShells', () => {
  it('returns exactly 4 shells', () => {
    expect(getAllShells()).toHaveLength(4);
  });

  it('includes all 4 shell IDs', () => {
    const ids = getAllShells().map((s) => s.id);
    for (const id of VALID_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('each returned shell has all required fields', () => {
    for (const shell of getAllShells()) {
      expect(typeof shell.id).toBe('string');
      expect(typeof shell.name).toBe('string');
      expect(typeof shell.description).toBe('string');
    }
  });
});
