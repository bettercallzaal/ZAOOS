// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  APP_REGISTRY,
  getApp,
  getAppsByCategory,
  getDefaultPinnedApps,
  getFullApps,
  getMicroApps,
} from '../app-manifest';

// Valid sets derived from the AppCategory / AppType union types
const VALID_CATEGORIES = new Set(['social', 'music', 'governance', 'tools', 'earn']);
const VALID_TYPES = new Set(['full-app', 'micro-app']);

// ---------------------------------------------------------------------------
// APP_REGISTRY shape
// ---------------------------------------------------------------------------

describe('APP_REGISTRY', () => {
  it('has at least 10 apps', () => {
    expect(APP_REGISTRY.length).toBeGreaterThanOrEqual(10);
  });

  it('has exactly 18 apps', () => {
    expect(APP_REGISTRY).toHaveLength(18);
  });

  it('has no duplicate app IDs', () => {
    const ids = APP_REGISTRY.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every app has required fields: id, name, icon, category, type, description', () => {
    for (const app of APP_REGISTRY) {
      expect(typeof app.id, app.id).toBe('string');
      expect(app.id.length, app.id).toBeGreaterThan(0);
      expect(typeof app.name, app.id).toBe('string');
      expect(typeof app.icon, app.id).toBe('string');
      expect(typeof app.description, app.id).toBe('string');
      expect(typeof app.requiresAuth, app.id).toBe('boolean');
    }
  });

  it('all categories are valid AppCategory values', () => {
    for (const app of APP_REGISTRY) {
      expect(VALID_CATEGORIES.has(app.category), `${app.id}.category=${app.category}`).toBe(true);
    }
  });

  it('all types are valid AppType values', () => {
    for (const app of APP_REGISTRY) {
      expect(VALID_TYPES.has(app.type), `${app.id}.type=${app.type}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getApp
// ---------------------------------------------------------------------------

describe('getApp', () => {
  it('returns the music app by id', () => {
    const app = getApp('music');
    expect(app).toBeDefined();
    expect(app?.id).toBe('music');
    expect(app?.route).toBe('/music');
  });

  it('returns the chat app by id', () => {
    const app = getApp('chat');
    expect(app?.id).toBe('chat');
    expect(app?.category).toBe('social');
  });

  it('returns the wavewarz app', () => {
    const app = getApp('wavewarz');
    expect(app?.category).toBe('earn');
  });

  it('returns undefined for an unknown id', () => {
    expect(getApp('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getApp('')).toBeUndefined();
  });

  it('every app in the registry is retrievable by its own id', () => {
    for (const app of APP_REGISTRY) {
      expect(getApp(app.id)?.id, app.id).toBe(app.id);
    }
  });
});

// ---------------------------------------------------------------------------
// getAppsByCategory
// ---------------------------------------------------------------------------

describe('getAppsByCategory', () => {
  it('returns all governance apps', () => {
    const apps = getAppsByCategory('governance');
    expect(apps.length).toBeGreaterThan(0);
    for (const app of apps) {
      expect(app.category).toBe('governance');
    }
  });

  it('governance category includes the governance and respect apps', () => {
    const ids = getAppsByCategory('governance').map((a) => a.id);
    expect(ids).toContain('governance');
    expect(ids).toContain('respect');
  });

  it('earn category includes wavewarz', () => {
    const ids = getAppsByCategory('earn').map((a) => a.id);
    expect(ids).toContain('wavewarz');
  });

  it('returns an empty array for a category with no apps (if none)', () => {
    // All valid categories have at least one app — verify no spurious empties
    for (const cat of ['social', 'music', 'governance', 'tools', 'earn'] as const) {
      expect(getAppsByCategory(cat).length, cat).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getFullApps / getMicroApps
// ---------------------------------------------------------------------------

describe('getFullApps', () => {
  it('returns only full-app type entries', () => {
    for (const app of getFullApps()) {
      expect(app.type).toBe('full-app');
    }
  });

  it('includes the music and wavewarz full apps', () => {
    const ids = getFullApps().map((a) => a.id);
    expect(ids).toContain('music');
    expect(ids).toContain('wavewarz');
  });
});

describe('getMicroApps', () => {
  it('returns only micro-app type entries', () => {
    for (const app of getMicroApps()) {
      expect(app.type).toBe('micro-app');
    }
  });

  it('includes the search and settings micro-apps', () => {
    const ids = getMicroApps().map((a) => a.id);
    expect(ids).toContain('search');
    expect(ids).toContain('settings');
  });
});

describe('getFullApps + getMicroApps together', () => {
  it('covers all apps in the registry (no orphans)', () => {
    const all = [...getFullApps(), ...getMicroApps()].map((a) => a.id).sort();
    const registry = APP_REGISTRY.map((a) => a.id).sort();
    expect(all).toEqual(registry);
  });
});

// ---------------------------------------------------------------------------
// getDefaultPinnedApps
// ---------------------------------------------------------------------------

describe('getDefaultPinnedApps', () => {
  it('returns only apps where defaultPinned is true', () => {
    for (const app of getDefaultPinnedApps()) {
      expect(app.defaultPinned).toBe(true);
    }
  });

  it('includes chat, music, and governance as pinned', () => {
    const ids = getDefaultPinnedApps().map((a) => a.id);
    expect(ids).toContain('chat');
    expect(ids).toContain('music');
    expect(ids).toContain('governance');
  });

  it('admin app is not defaultPinned (requires allowlist gate)', () => {
    const ids = getDefaultPinnedApps().map((a) => a.id);
    expect(ids).not.toContain('admin');
  });

  it('all un-pinned apps in registry are absent from defaultPinned', () => {
    const pinnedIds = new Set(getDefaultPinnedApps().map((a) => a.id));
    for (const app of APP_REGISTRY) {
      if (!app.defaultPinned) {
        expect(pinnedIds.has(app.id), `${app.id} should not be pinned`).toBe(false);
      }
    }
  });
});
