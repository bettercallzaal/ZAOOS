// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildResolutionIndex } from '../jukeChangelog';
import type { JukeChangelog, JukeChangelogEntry } from '../jukeChangelog';

function makeEntry(overrides: Partial<JukeChangelogEntry> = {}): JukeChangelogEntry {
  return {
    id: 'entry-1',
    shipped_at: '2026-05-01',
    category: 'api',
    title: 'Some feature',
    summary: 'Details here',
    ...overrides,
  };
}

function makeChangelog(entries: JukeChangelogEntry[]): JukeChangelog {
  return {
    version: 1,
    generated_at: '2026-05-01T00:00:00Z',
    canonical_spec: 'https://juke.audio/llms.txt',
    skill_md: 'https://juke.audio/SKILL.md',
    entries,
  };
}

// ---------------------------------------------------------------------------
// buildResolutionIndex
// ---------------------------------------------------------------------------

describe('buildResolutionIndex', () => {
  it('returns an empty Map for null changelog', () => {
    const idx = buildResolutionIndex(null);
    expect(idx).toBeInstanceOf(Map);
    expect(idx.size).toBe(0);
  });

  it('returns an empty Map for a changelog with no entries', () => {
    expect(buildResolutionIndex(makeChangelog([]))).toEqual(new Map());
  });

  it('indexes an ask by explicit resolves[]', () => {
    const entry = makeEntry({ id: 'ship-1', resolves: ['ask-1'] });
    const idx = buildResolutionIndex(makeChangelog([entry]));
    expect(idx.has('ask-1')).toBe(true);
    expect(idx.get('ask-1')).toBe(entry);
  });

  it('indexes the entry by its own id (implicit join)', () => {
    const entry = makeEntry({ id: 'ask-implicit' });
    const idx = buildResolutionIndex(makeChangelog([entry]));
    expect(idx.has('ask-implicit')).toBe(true);
  });

  it('maps multiple resolves from a single entry', () => {
    const entry = makeEntry({ id: 'ship-x', resolves: ['ask-a', 'ask-b', 'ask-c'] });
    const idx = buildResolutionIndex(makeChangelog([entry]));
    expect(idx.has('ask-a')).toBe(true);
    expect(idx.has('ask-b')).toBe(true);
    expect(idx.has('ask-c')).toBe(true);
  });

  it('keeps the more recent entry when two entries resolve the same ask', () => {
    const older = makeEntry({ id: 'old', shipped_at: '2026-04-01', resolves: ['ask-1'] });
    const newer = makeEntry({ id: 'new', shipped_at: '2026-05-01', resolves: ['ask-1'] });
    const idx = buildResolutionIndex(makeChangelog([older, newer]));
    expect(idx.get('ask-1')).toBe(newer);
  });

  it('order does not matter — newer shipped_at always wins', () => {
    const older = makeEntry({ id: 'old', shipped_at: '2026-03-01', resolves: ['ask-x'] });
    const newer = makeEntry({ id: 'new', shipped_at: '2026-06-01', resolves: ['ask-x'] });
    // newer listed first
    const idx = buildResolutionIndex(makeChangelog([newer, older]));
    expect(idx.get('ask-x')).toBe(newer);
  });

  it('an entry with no resolves still gets indexed by its own id', () => {
    const entry = makeEntry({ id: 'solo-entry', resolves: undefined });
    const idx = buildResolutionIndex(makeChangelog([entry]));
    expect(idx.has('solo-entry')).toBe(true);
  });

  it('explicit resolves[] does not overwrite a newer implicit id match', () => {
    // entry-a has a newer shipped_at and id matching 'overlap'
    const implicit = makeEntry({ id: 'overlap', shipped_at: '2026-06-01' });
    // entry-b resolves 'overlap' but with an older date
    const explicit = makeEntry({ id: 'entry-b', shipped_at: '2026-03-01', resolves: ['overlap'] });
    const idx = buildResolutionIndex(makeChangelog([implicit, explicit]));
    // implicit (newer) should win
    expect(idx.get('overlap')).toBe(implicit);
  });
});
