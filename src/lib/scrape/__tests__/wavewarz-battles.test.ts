// @vitest-environment node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type FetchBattlesPage,
  httpBattlesPageFetcher,
  parseWaveWarzBattlesPage,
  scrapeWaveWarzBattles,
} from '../wavewarz-battles';
import type { FetchImpl } from '../x-fetch';

const fixture = readFileSync(join(__dirname, 'wavewarz-battles-fixture.txt'), 'utf-8');

describe('parseWaveWarzBattlesPage', () => {
  it('extracts battle records from a real escaped-flight fixture', () => {
    const battles = parseWaveWarzBattlesPage(fixture);
    expect(battles.length).toBeGreaterThanOrEqual(1);
    const first = battles[0];
    expect(first.battleId).toBe(1781751572);
    expect(first.date).toBe('Jun 18, 2026');
    expect(first.song1Title).toBe('LMNOPQRZ');
    expect(first.song1Handle).toBe('hoodrats');
    expect(first.song2Handle).toBe('CannonJones973');
  });

  it('dedupes repeated battle_ids', () => {
    const doubled = fixture + fixture;
    const battles = parseWaveWarzBattlesPage(doubled);
    const ids = battles.map((b) => b.battleId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns empty array for html with no battle records', () => {
    expect(parseWaveWarzBattlesPage('<html>nothing here</html>')).toEqual([]);
  });

  it('parses a minimal synthetic battle object', () => {
    const html =
      '{"battle_id":42,"dateFormatted":"Jan 1, 2026","song1Title":"A","song2Title":"B","totalVolSol":3.5,"winnerTitle":"A"}';
    const battles = parseWaveWarzBattlesPage(html);
    expect(battles).toHaveLength(1);
    expect(battles[0].battleId).toBe(42);
    expect(battles[0].totalVolumeSol).toBe(3.5);
    expect(battles[0].winnerTitle).toBe('A');
  });
});

describe('scrapeWaveWarzBattles', () => {
  function pageFetcher(pages: Record<number, string>): FetchBattlesPage {
    return async (page: number) => pages[page] ?? '';
  }

  it('paginates back until a page yields no new battles', async () => {
    const fetchPage = pageFetcher({
      1: '{"battle_id":3,"song1Title":"c"}{"battle_id":2,"song1Title":"b"}',
      2: '{"battle_id":1,"song1Title":"a"}',
      3: '',
    });
    const { battles, pagesFetched, truncated } = await scrapeWaveWarzBattles({ fetchPage });
    expect(battles.map((b) => b.battleId).sort()).toEqual([1, 2, 3]);
    expect(pagesFetched).toBe(3);
    expect(truncated).toBe(false);
  });

  it('stops and dedupes when a later page repeats earlier battles', async () => {
    const fetchPage = pageFetcher({
      1: '{"battle_id":2,"song1Title":"b"}',
      2: '{"battle_id":2,"song1Title":"b"}',
    });
    const { battles, pagesFetched } = await scrapeWaveWarzBattles({ fetchPage });
    expect(battles).toHaveLength(1);
    expect(pagesFetched).toBe(2);
  });

  it('marks truncated when maxPages is hit with new battles still coming', async () => {
    const fetchPage: FetchBattlesPage = async (page) => `{"battle_id":${page},"song1Title":"x"}`;
    const { truncated, pagesFetched } = await scrapeWaveWarzBattles({ fetchPage, maxPages: 3 });
    expect(pagesFetched).toBe(3);
    expect(truncated).toBe(true);
  });
});

describe('httpBattlesPageFetcher retry', () => {
  it('retries a transient 503 then succeeds', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 503 } as Response;
      return { ok: true, status: 200, text: async () => '{"battle_id":7}' } as Response;
    }) as unknown as FetchImpl;
    const fetchPage = httpBattlesPageFetcher(fetchImpl);
    const html = await fetchPage(1);
    expect(calls).toBe(2);
    expect(parseWaveWarzBattlesPage(html)[0].battleId).toBe(7);
  });

  it('does not retry a permanent 404', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return { ok: false, status: 404 } as Response;
    }) as unknown as FetchImpl;
    const fetchPage = httpBattlesPageFetcher(fetchImpl);
    await expect(fetchPage(1)).rejects.toThrow(/404/);
    expect(calls).toBe(1);
  });
});
