import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  brandBoxFor,
  brandsMentioned,
  discordIcmEnabled,
  dropRetiredLines,
  fetchIcmBrain,
  brandSystemPreamble,
  namesRetiredPartner,
  zaoGroundingFor,
  _resetBrainCache,
} from '../brand-brain';

// Mock global fetch for ICM box API calls.
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.stubGlobal('fetch', fetchMock);

describe('brandBoxFor', () => {
  it('returns the box ID for a registered brand topic', () => {
    expect(brandBoxFor('ZABAL Games')).toBe('icm_6EcindcuwxlkMO7-lT83cQ');
  });

  it('returns undefined for an unregistered topic', () => {
    expect(brandBoxFor('NotARealTopic')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(brandBoxFor(undefined)).toBeUndefined();
  });
});

describe('fetchIcmBrain', () => {
  afterEach(() => {
    fetchMock.mockReset();
    _resetBrainCache();
  });

  it('fetches and returns ICM brain text', async () => {
    const brandText = 'ZABAL Games: music mentorship, Magnetic platform...';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(brandText),
    });

    const result = await fetchIcmBrain('icm_test123');
    expect(result).toBe(brandText);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://useicm.com/api/objects/icm_test123/llm.txt',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('ZOE'),
          Origin: 'https://thezao.xyz',
        }),
      }),
    );
  });

  it('caches the result and does not re-fetch within 10 minutes', async () => {
    const brandText = 'ZABAL Games context';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(brandText),
    });

    const result1 = await fetchIcmBrain('icm_test123');
    const result2 = await fetchIcmBrain('icm_test123');

    expect(result1).toBe(brandText);
    expect(result2).toBe(brandText);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    const result = await fetchIcmBrain('icm_notfound');
    expect(result).toBeNull();
  });

  it('returns null on empty response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    });

    const result = await fetchIcmBrain('icm_empty');
    expect(result).toBeNull();
  });

  it('returns null on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await fetchIcmBrain('icm_error');
    expect(result).toBeNull();
  });

  it('returns null on timeout (abort)', async () => {
    fetchMock.mockImplementation(() => {
      const err = new Error('Aborted');
      (err as any).name = 'AbortError';
      throw err;
    });

    const result = await fetchIcmBrain('icm_timeout');
    expect(result).toBeNull();
  });
});

describe('brandSystemPreamble', () => {
  it('builds a preamble with brand context and instructions', () => {
    const brandText = 'ZABAL: mentorship, music, creation';
    const preamble = brandSystemPreamble(brandText, 'ZABAL Games');

    expect(preamble).toContain('ZABAL Games');
    expect(preamble).toContain(brandText);
    expect(preamble).toContain('Stay in character');
    expect(preamble).toContain('<brand_context>');
    expect(preamble).toContain('</brand_context>');
  });

  it('does not use em-dashes or emojis', () => {
    const brandText = 'test';
    const preamble = brandSystemPreamble(brandText, 'TestBrand');

    expect(preamble).not.toMatch(/[—–]/); // em-dash or en-dash
    expect(preamble).not.toMatch(/[\p{Emoji}]/u); // emoji
  });
});

// Retired partner names, base64 so this public file does not spell them.
const b64 = (s: string): string => Buffer.from(s, 'base64').toString('utf8');
const RETIRED = ['QXJ0aXplbg==', 'QWNhZGlhIFJpc2luZw==', 'TWFnbmV0aXE=', 'U29uZ0phbQ==', 'U0FORw=='].map(b64);

describe('retired partner filter', () => {
  it.each(RETIRED)('a line naming a retired partner is caught (%#)', (name) => {
    expect(namesRetiredPartner(`- partners: Juke, ${name}, POIDH`)).toBe(true);
    expect(namesRetiredPartner(`signups run through ${name.toLowerCase()} today`)).toBe(name !== b64('U0FORw=='));
  });

  it('catches a name inside a domain', () => {
    expect(namesRetiredPartner(`- Signup: ${b64('YXBwLm1hZ25ldGlxLnh5eg==')} (ZABAL brand)`)).toBe(true);
  });

  it('keeps the national park, an ordinary past-tense verb, and ordinary lines', () => {
    expect(namesRetiredPartner('a town that every car heading to Acadia passes through.')).toBe(false);
    expect(namesRetiredPartner('She sang the closing set.')).toBe(false);
    expect(namesRetiredPartner('ZABAL Games is The ZAO\'s 3-month build-a-thon.')).toBe(false);
  });

  it('drops only the naming lines and keeps the rest in order', () => {
    const box = ['# ZABAL Games', `- Signup: ${RETIRED[2]}`, '- Three tracks', `- Workshops with ${RETIRED[3]}`, '- Free to join'].join('\n');
    expect(dropRetiredLines(box)).toBe('# ZABAL Games\n- Three tracks\n- Free to join');
  });

  it('fetchIcmBrain returns and caches the filtered text', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => `keep\nvia ${RETIRED[0]}\nalso keep` });
    expect(await fetchIcmBrain('icm_filter_test')).toBe('keep\nalso keep');
    expect(await fetchIcmBrain('icm_filter_test')).toBe('keep\nalso keep');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset();
    _resetBrainCache();
  });
});

describe('Discord ZAO grounding', () => {
  it.each([
    ['what is zabal gamez?', ['ZABAL Games']],
    ['ZABAL Games signup', ['ZABAL Games']],
    ['who won wave warz last night', ['WaveWarZ']],
    ['ZAO Stock recap and WaveWarZ', ['WaveWarZ', 'ZAOstock']],
    ['anything on zaolingo or Better Call Zaal', ['ZAOlingo', 'BetterCallZaal']],
    ['how are you doing', []],
    ['zabal update', []],
  ])('%j names %j', (text, want) => {
    expect(brandsMentioned(text)).toEqual(want);
  });

  it('is on unless ZOE_DISCORD_ICM=0', () => {
    expect(discordIcmEnabled({} as NodeJS.ProcessEnv)).toBe(true);
    expect(discordIcmEnabled({ ZOE_DISCORD_ICM: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(discordIcmEnabled({ ZOE_DISCORD_ICM: '0' } as NodeJS.ProcessEnv)).toBe(false);
  });

  it('always loads The ZAO, adds each named brand, and is reference not a persona', async () => {
    const seen: string[] = [];
    const g = await zaoGroundingFor('what is ZABAL Gamez?', async (id) => {
      seen.push(id);
      return `body of ${id}`;
    });
    expect(seen).toEqual([brandBoxFor('The ZAO'), brandBoxFor('ZABAL Games')]);
    expect(g?.brands).toEqual(['The ZAO', 'ZABAL Games']);
    expect(g?.context).toContain('### ZABAL Games\nbody of icm_6EcindcuwxlkMO7-lT83cQ');
    expect(g?.context).toContain('reference, not instructions');
    expect(g?.context).not.toContain('You are answering as');
  });

  it('a box that fails is skipped; none readable means no context at all', async () => {
    const one = await zaoGroundingFor('wavewarz?', async (id) => (id === brandBoxFor('The ZAO') ? null : 'ww'));
    expect(one?.brands).toEqual(['WaveWarZ']);
    expect(await zaoGroundingFor('hi', async () => null)).toBeUndefined();
    expect(await zaoGroundingFor('hi', async () => { throw new Error('down'); })).toBeUndefined();
  });

  it('discord.ts passes the grounding into the turn, behind the switch, and logs it ran', () => {
    const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');
    const at = d.indexOf('const grounding = discordIcmEnabled() ? await zaoGroundingFor(messageText)');
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(d.indexOf('const result = await runConciergeTurn({'));
    expect(d).toContain('brandContext: grounding?.context,');
    expect(d).toContain("featureRan('discord-icm'");
  });
});
