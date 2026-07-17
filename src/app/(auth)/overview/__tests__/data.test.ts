// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  botFleet,
  controlPlane,
  improvements,
  repoMap,
  tooling,
  toolingNote,
} from '../data';

const VALID_BOT_STATUSES = ['live', 'pending', 'dormant', 'decommissioned', 'external'] as const;
const VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;

// ---------------------------------------------------------------------------
// repoMap
// ---------------------------------------------------------------------------

describe('repoMap', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(repoMap)).toBe(true);
    expect(repoMap.length).toBeGreaterThan(0);
  });

  it('every group has a "group" string and non-empty "areas" array', () => {
    for (const g of repoMap) {
      expect(typeof g.group).toBe('string');
      expect(Array.isArray(g.areas)).toBe(true);
      expect(g.areas.length).toBeGreaterThan(0);
    }
  });

  it('every area has area, path, and desc fields', () => {
    for (const g of repoMap) {
      for (const a of g.areas) {
        expect(typeof a.area).toBe('string');
        expect(typeof a.path).toBe('string');
        expect(typeof a.desc).toBe('string');
      }
    }
  });

  it('includes an "App & API" group', () => {
    const groups = repoMap.map((g) => g.group);
    expect(groups.some((g) => g.includes('App'))).toBe(true);
  });

  it('includes a bot fleet group', () => {
    const groups = repoMap.map((g) => g.group);
    expect(groups.some((g) => g.toLowerCase().includes('bot'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// botFleet
// ---------------------------------------------------------------------------

describe('botFleet', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(botFleet)).toBe(true);
    expect(botFleet.length).toBeGreaterThan(0);
  });

  it('every bot has name, handle, source, status, and board', () => {
    for (const bot of botFleet) {
      expect(typeof bot.name).toBe('string');
      expect(typeof bot.handle).toBe('string');
      expect(typeof bot.source).toBe('string');
      expect(typeof bot.status).toBe('string');
      expect(typeof bot.board).toBe('string');
    }
  });

  it('every bot status is a valid BotStatus value', () => {
    for (const bot of botFleet) {
      expect(VALID_BOT_STATUSES).toContain(bot.status as typeof VALID_BOT_STATUSES[number]);
    }
  });

  it('includes ZOE with status "live"', () => {
    const zoe = botFleet.find((b) => b.name === 'ZOE');
    expect(zoe?.status).toBe('live');
  });

  it('includes ZAO Devz', () => {
    const devz = botFleet.find((b) => b.name === 'ZAO Devz');
    expect(devz).toBeDefined();
  });

  it('all bot names are unique', () => {
    const names = botFleet.map((b) => b.name);
    expect(new Set(names).size).toBe(botFleet.length);
  });
});

// ---------------------------------------------------------------------------
// controlPlane
// ---------------------------------------------------------------------------

describe('controlPlane', () => {
  it('has a url, summary, and capabilities array', () => {
    expect(typeof controlPlane.url).toBe('string');
    expect(typeof controlPlane.summary).toBe('string');
    expect(Array.isArray(controlPlane.capabilities)).toBe(true);
  });

  it('capabilities array is non-empty', () => {
    expect(controlPlane.capabilities.length).toBeGreaterThan(0);
  });

  it('every capability is a string', () => {
    for (const cap of controlPlane.capabilities) {
      expect(typeof cap).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// tooling
// ---------------------------------------------------------------------------

describe('tooling', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(tooling)).toBe(true);
    expect(tooling.length).toBeGreaterThan(0);
  });

  it('every group has a "group" string and non-empty "skills" array', () => {
    for (const g of tooling) {
      expect(typeof g.group).toBe('string');
      expect(Array.isArray(g.skills)).toBe(true);
      expect(g.skills.length).toBeGreaterThan(0);
    }
  });

  it('every skill has name and desc', () => {
    for (const g of tooling) {
      for (const s of g.skills) {
        expect(typeof s.name).toBe('string');
        expect(typeof s.desc).toBe('string');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// toolingNote
// ---------------------------------------------------------------------------

describe('toolingNote', () => {
  it('is a non-empty string', () => {
    expect(typeof toolingNote).toBe('string');
    expect(toolingNote.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// improvements
// ---------------------------------------------------------------------------

describe('improvements', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(improvements)).toBe(true);
    expect(improvements.length).toBeGreaterThan(0);
  });

  it('every improvement has priority, title, and detail', () => {
    for (const item of improvements) {
      expect(typeof item.priority).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.detail).toBe('string');
    }
  });

  it('all priorities are valid (P0–P3)', () => {
    for (const item of improvements) {
      expect(VALID_PRIORITIES).toContain(item.priority as typeof VALID_PRIORITIES[number]);
    }
  });

  it('includes at least one P0 item', () => {
    expect(improvements.some((i) => i.priority === 'P0')).toBe(true);
  });
});
