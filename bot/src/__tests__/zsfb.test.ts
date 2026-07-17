// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockSingle = vi.hoisted(() => vi.fn());
const mockSelectChain = vi.hoisted(() => vi.fn(() => ({ single: mockSingle })));
const mockInsert = vi.hoisted(() => vi.fn(() => ({ select: mockSelectChain })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ insert: mockInsert })));
const mockLogBotActivity = vi.hoisted(() => vi.fn());

vi.mock('../supabase', () => ({ db: vi.fn(() => ({ from: mockFrom })) }));
vi.mock('../activity', () => ({ logBotActivity: mockLogBotActivity }));

import { addZsFb, detectSection } from '../zsfb';
import type { TeamMember } from '../auth';

afterEach(() => vi.clearAllMocks());

const MEMBER: TeamMember = {
  id: 'member-001',
  name: 'Zaal',
  scope: 'admin',
  role: 'admin',
  telegram_id: 12345,
  telegram_username: 'bettercallzaal',
};

// ── detectSection (pure) ──────────────────────────────────────────────────────

describe('detectSection', () => {
  it('matches hero keywords', () => {
    expect(detectSection('the hero copy is too long')).toBe('hero');
    expect(detectSection('first section needs a tagline')).toBe('hero');
  });

  it('matches lineup keywords', () => {
    expect(detectSection('the lineup section needs more artists')).toBe('lineup');
    expect(detectSection('who is the DJ?')).toBe('lineup');
  });

  it('matches sponsors keywords', () => {
    expect(detectSection('sponsor section needs more detail')).toBe('sponsors');
    expect(detectSection('add a broadcast link to the section')).toBe('sponsors');
  });

  it('matches partners keywords', () => {
    expect(detectSection('partners section — add Fractured Atlas logo')).toBe('partners');
  });

  it('matches vibes/photo keywords', () => {
    expect(detectSection('gallery images look washed out')).toBe('vibes');
  });

  it('matches about keywords', () => {
    expect(detectSection('the about section story is too short')).toBe('about');
  });

  it('matches location/where keywords', () => {
    expect(detectSection('where is the location on the map?')).toBe('where');
  });

  it('matches team keywords', () => {
    expect(detectSection('team roster section looks good')).toBe('team');
  });

  it('matches rsvp/join keywords', () => {
    expect(detectSection('rsvp button is hard to find')).toBe('rsvp');
  });

  it('matches lineage/history keywords', () => {
    expect(detectSection('add more past events to the lineage')).toBe('lineage');
  });

  it('matches donate/donation keywords', () => {
    expect(detectSection('donation page needs a crypto option')).toBe('donate');
  });

  it('matches sticky/dock keywords', () => {
    expect(detectSection('sticky header covers the content')).toBe('sticky');
  });

  it('returns general for unmatched text', () => {
    expect(detectSection('the font is too small')).toBe('general');
    expect(detectSection('')).toBe('general');
  });
});

// ── addZsFb ───────────────────────────────────────────────────────────────────

describe('addZsFb', () => {
  it('returns a usage prompt when text is empty', async () => {
    const reply = await addZsFb(MEMBER, '');
    expect(reply).toContain('Say something after /zsfb');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns a usage prompt when text is whitespace only', async () => {
    const reply = await addZsFb(MEMBER, '   ');
    expect(reply).toContain('Say something after /zsfb');
  });

  it('inserts to suggestions with the detected section tag and returns success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'abc12345-xxxx' }, error: null });
    mockLogBotActivity.mockResolvedValue(undefined);
    const reply = await addZsFb(MEMBER, 'hero section headline is too long');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ suggestion: expect.stringContaining('[zsfb:hero]') }),
    );
    expect(reply).toContain('hero');
    expect(reply).toContain('abc1234'); // first 8 chars of the id
    expect(mockLogBotActivity).toHaveBeenCalledOnce();
  });

  it('returns an error message when the DB insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB down' } });
    const reply = await addZsFb(MEMBER, 'lineup needs work');
    expect(reply).toBe('Could not save: DB down');
    expect(mockLogBotActivity).not.toHaveBeenCalled();
  });
});
