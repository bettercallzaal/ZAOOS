// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ardrive/turbo-sdk has a broken bs58 subpath in its ESM build — mock it so
// the module can load without requiring the broken transitive dep.
vi.mock('@ardrive/turbo-sdk', () => ({
  TurboFactory: { authenticated: vi.fn() },
}));

import { buildMusicTags, isArweaveConfigured, LICENSE_PRESETS } from '../arweave';

// ---------------------------------------------------------------------------
// isArweaveConfigured
// ---------------------------------------------------------------------------

describe('isArweaveConfigured', () => {
  beforeEach(() => { delete process.env.ARWEAVE_WALLET_KEY; });
  afterEach(() => { delete process.env.ARWEAVE_WALLET_KEY; });

  it('returns false when ARWEAVE_WALLET_KEY is not set', () => {
    expect(isArweaveConfigured()).toBe(false);
  });

  it('returns true when ARWEAVE_WALLET_KEY is set', () => {
    process.env.ARWEAVE_WALLET_KEY = '{"kty":"RSA"}';
    expect(isArweaveConfigured()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildMusicTags — required fields
// ---------------------------------------------------------------------------

describe('buildMusicTags required fields', () => {
  it('includes App-Name: ZAO-OS', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'App-Name', value: 'ZAO-OS' });
  });

  it('includes App-Version: 1.0.0', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'App-Version', value: '1.0.0' });
  });

  it('includes Type: music-track', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Type', value: 'music-track' });
  });

  it('includes Title and Artist from opts', () => {
    const tags = buildMusicTags({ title: 'My Track', artist: 'ZAO Band', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Title', value: 'My Track' });
    expect(tags).toContainEqual({ name: 'Artist', value: 'ZAO Band' });
  });

  it('includes License UDL tx ID', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    const licenseTag = tags.find((t) => t.name === 'License');
    expect(licenseTag?.value).toMatch(/^[a-zA-Z0-9_-]{43}$/); // Arweave tx ID format
  });
});

// ---------------------------------------------------------------------------
// buildMusicTags — optional fields
// ---------------------------------------------------------------------------

describe('buildMusicTags optional fields', () => {
  it('includes Genre when provided', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', genre: 'Hip-Hop', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Genre', value: 'Hip-Hop' });
  });

  it('omits Genre when not provided', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags.every((t) => t.name !== 'Genre')).toBe(true);
  });

  it('includes Description when provided', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', description: 'A great song', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Description', value: 'A great song' });
  });

  it('includes Thumbnail (coverTxId) when provided', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', coverTxId: 'arweave-tx-abc', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Thumbnail', value: 'arweave-tx-abc' });
  });

  it('omits Thumbnail when coverTxId not provided', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags.every((t) => t.name !== 'Thumbnail')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildMusicTags — license presets
// ---------------------------------------------------------------------------

describe('buildMusicTags license presets', () => {
  it('open preset: Commercial-Use=Allowed, Derivation=Allowed', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'open' });
    expect(tags).toContainEqual({ name: 'Commercial-Use', value: 'Allowed' });
    expect(tags).toContainEqual({ name: 'Derivation', value: 'Allowed' });
  });

  it('community preset: Commercial-Use=Allowed-With-Credit', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'community' });
    expect(tags).toContainEqual({ name: 'Commercial-Use', value: 'Allowed-With-Credit' });
    expect(tags).toContainEqual({ name: 'Derivation', value: 'Allowed-With-Credit' });
  });

  it('collectible preset: Derivation=Allowed-With-RevenueShare-25%', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'collectible' });
    expect(tags).toContainEqual({ name: 'Derivation', value: 'Allowed-With-RevenueShare-25%' });
  });

  it('premium preset: Commercial-Use=Disallowed, has Access-Fee', () => {
    const tags = buildMusicTags({ title: 'Song', artist: 'Artist', licensePreset: 'premium' });
    expect(tags).toContainEqual({ name: 'Commercial-Use', value: 'Disallowed' });
    expect(tags).toContainEqual({ name: 'Access-Fee', value: 'One-Time-0.001' });
  });

  it('LICENSE_PRESETS export has all 4 keys', () => {
    expect(Object.keys(LICENSE_PRESETS)).toEqual(
      expect.arrayContaining(['community', 'collectible', 'premium', 'open']),
    );
  });
});
