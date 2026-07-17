// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_ARCHITECTURE_ASCII,
  getJukeIntegrationManifest,
  renderIntegrationMarkdown,
} from '../jukeIntegrationManifest';

// ---------------------------------------------------------------------------
// INTEGRATION_ARCHITECTURE_ASCII
// ---------------------------------------------------------------------------

describe('INTEGRATION_ARCHITECTURE_ASCII', () => {
  it('is a non-empty string', () => {
    expect(typeof INTEGRATION_ARCHITECTURE_ASCII).toBe('string');
    expect(INTEGRATION_ARCHITECTURE_ASCII.length).toBeGreaterThan(0);
  });

  it('references ZAO OS', () => {
    expect(INTEGRATION_ARCHITECTURE_ASCII).toContain('ZAO OS');
  });

  it('references juke.audio', () => {
    expect(INTEGRATION_ARCHITECTURE_ASCII).toContain('juke.audio');
  });

  it('describes the webhook path', () => {
    expect(INTEGRATION_ARCHITECTURE_ASCII).toContain('webhooks');
  });
});

// ---------------------------------------------------------------------------
// getJukeIntegrationManifest
// ---------------------------------------------------------------------------

describe('getJukeIntegrationManifest', () => {
  it('returns an object', () => {
    const m = getJukeIntegrationManifest();
    expect(typeof m).toBe('object');
    expect(m).not.toBeNull();
  });

  it('has a version string', () => {
    const { version } = getJukeIntegrationManifest();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('about.name is "The ZAO"', () => {
    expect(getJukeIntegrationManifest().about.name).toBe('The ZAO');
  });

  it('about has required URL fields', () => {
    const { about } = getJukeIntegrationManifest();
    expect(typeof about.site).toBe('string');
    expect(typeof about.farcaster).toBe('string');
    expect(typeof about.juke_path_a_route).toBe('string');
    expect(typeof about.juke_path_b_route).toBe('string');
    expect(typeof about.public_status_route).toBe('string');
  });

  it('shipped is a non-empty array', () => {
    const { shipped } = getJukeIntegrationManifest();
    expect(Array.isArray(shipped)).toBe(true);
    expect(shipped.length).toBeGreaterThan(0);
  });

  it('every shipped item has id, title, shippedAt, and files', () => {
    for (const item of getJukeIntegrationManifest().shipped) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.shippedAt).toBe('string');
      expect(Array.isArray(item.files)).toBe(true);
      expect(item.files.length).toBeGreaterThan(0);
    }
  });

  it('shipped IDs are all unique', () => {
    const ids = getJukeIntegrationManifest().shipped.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('open_asks is a non-empty array', () => {
    const { open_asks } = getJukeIntegrationManifest();
    expect(Array.isArray(open_asks)).toBe(true);
    expect(open_asks.length).toBeGreaterThan(0);
  });

  it('every open_ask has priority in p0/p1/p2', () => {
    for (const ask of getJukeIntegrationManifest().open_asks) {
      expect(['p0', 'p1', 'p2']).toContain(ask.priority);
    }
  });

  it('every open_ask has id, title, reason, blocks', () => {
    for (const ask of getJukeIntegrationManifest().open_asks) {
      expect(typeof ask.id).toBe('string');
      expect(typeof ask.title).toBe('string');
      expect(typeof ask.reason).toBe('string');
      expect(typeof ask.blocks).toBe('string');
    }
  });

  it('conventions is a non-empty array of strings', () => {
    const { conventions } = getJukeIntegrationManifest();
    expect(Array.isArray(conventions)).toBe(true);
    expect(conventions.length).toBeGreaterThan(0);
    for (const c of conventions) {
      expect(typeof c).toBe('string');
    }
  });

  it('contact has zao_dev, general, and partnership fields', () => {
    const { contact } = getJukeIntegrationManifest();
    expect(typeof contact.zao_dev).toBe('string');
    expect(typeof contact.general).toBe('string');
    expect(typeof contact.partnership).toBe('string');
  });

  it('juke_release_feed starts with https://', () => {
    expect(getJukeIntegrationManifest().juke_release_feed).toMatch(/^https:\/\//);
  });
});

// ---------------------------------------------------------------------------
// renderIntegrationMarkdown
// ---------------------------------------------------------------------------

describe('renderIntegrationMarkdown', () => {
  it('returns a non-empty string', () => {
    const manifest = getJukeIntegrationManifest();
    const md = renderIntegrationMarkdown(manifest);
    expect(typeof md).toBe('string');
    expect(md.length).toBeGreaterThan(0);
  });

  it('contains ## About section', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).toContain('## About');
  });

  it('contains ## Shipped section', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).toContain('## Shipped');
  });

  it('contains ## Open Asks section', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).toContain('## Open Asks');
  });

  it('contains ## Conventions section', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).toContain('## Conventions');
  });

  it('includes the manifest version', () => {
    const manifest = getJukeIntegrationManifest();
    const md = renderIntegrationMarkdown(manifest);
    expect(md).toContain(manifest.version);
  });

  it('includes the Architecture section when ASCII is embedded', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).toContain('## Architecture');
  });

  it('renders optional stats when provided', () => {
    const manifest = getJukeIntegrationManifest();
    const md = renderIntegrationMarkdown(manifest, { active_spaces: 3, total_webhooks: 42 });
    expect(md).toContain('## Live Stats');
    expect(md).toContain('active_spaces: 3');
    expect(md).toContain('total_webhooks: 42');
  });

  it('omits Live Stats section when no stats provided', () => {
    const md = renderIntegrationMarkdown(getJukeIntegrationManifest());
    expect(md).not.toContain('## Live Stats');
  });
});
