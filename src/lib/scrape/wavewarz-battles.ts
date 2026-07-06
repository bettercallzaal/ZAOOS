/**
 * WaveWarZ Intelligence battle-history scraper.
 *
 * The /battles page embeds each battle as a clean JSON object inside the React
 * flight payload: {"data":{"battle_id":1781751572,"dateFormatted":"Jun 18, 2026",
 * "song1Title":...,"song2Title":...,"winnerTitle":...,"totalVolSol":...}}.
 *
 * History pages back with /battles?page=N (page 2, 3, ... return progressively
 * older battles, ~22-24 per page). This module parses one page into validated
 * battle records and paginates back as far as possible (dedupe by battle_id,
 * stop when a page yields no new battles or maxPages is hit).
 *
 * Pure functions with an injectable page fetcher so it is testable offline.
 */

import { z } from 'zod';
import { isRetryableHttpError, withRetry } from './retry';

const INTELLIGENCE_BASE = 'https://wavewarz-intelligence.vercel.app';

// WaveWarZ serves numeric stats inconsistently - battle_id is a JSON number but
// totalVolSol / marginPct arrive as strings (e.g. "5.2337"). Accept either and
// coerce in normalize().
const numericLike = z.union([z.number(), z.string()]).nullish();

const RawBattleSchema = z
  .object({
    battle_id: z.union([z.number(), z.string()]),
    dateFormatted: z.string().nullish(),
    song1Title: z.string().nullish(),
    song2Title: z.string().nullish(),
    song1Handle: z.string().nullish(),
    song2Handle: z.string().nullish(),
    song1Link: z.string().nullish(),
    song2Link: z.string().nullish(),
    winnerTitle: z.string().nullish(),
    loserTitle: z.string().nullish(),
    totalVolSol: numericLike,
    marginPct: numericLike,
  })
  .passthrough();

/** Coerce a string|number|null/undefined into a finite number or null. */
function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export interface WaveWarzBattle {
  battleId: number;
  date: string | null;
  song1Title: string | null;
  song2Title: string | null;
  song1Handle: string | null;
  song2Handle: string | null;
  song1Link: string | null;
  song2Link: string | null;
  winnerTitle: string | null;
  loserTitle: string | null;
  totalVolumeSol: number | null;
  marginPct: number | null;
}

export class WaveWarzBattlesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaveWarzBattlesError';
  }
}

/** Flight data escapes quotes as \". Normalize so the objects parse as JSON. */
function unescapeFlight(html: string): string {
  return html.replace(/\\"/g, '"');
}

/**
 * Extract a balanced JSON object starting at the `{` index, respecting string
 * literals and escapes. Returns the object substring or null.
 */
function extractJsonObjectAt(s: string, startBrace: number): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = startBrace; i < s.length; i += 1) {
    const ch = s[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(startBrace, i + 1);
    }
  }
  return null;
}

function normalize(raw: z.infer<typeof RawBattleSchema>): WaveWarzBattle | null {
  const battleId = toNum(raw.battle_id);
  if (battleId === null) return null;
  return {
    battleId,
    date: raw.dateFormatted ?? null,
    song1Title: raw.song1Title ?? null,
    song2Title: raw.song2Title ?? null,
    song1Handle: raw.song1Handle ?? null,
    song2Handle: raw.song2Handle ?? null,
    song1Link: raw.song1Link ?? null,
    song2Link: raw.song2Link ?? null,
    winnerTitle: raw.winnerTitle ?? null,
    loserTitle: raw.loserTitle ?? null,
    totalVolumeSol: toNum(raw.totalVolSol),
    marginPct: toNum(raw.marginPct),
  };
}

/**
 * Parse all battle records from a /battles page's HTML. Skips any object that
 * fails validation rather than throwing on a single malformed record.
 */
export function parseWaveWarzBattlesPage(html: string): WaveWarzBattle[] {
  const flight = unescapeFlight(html);
  const battles: WaveWarzBattle[] = [];
  const seen = new Set<number>();
  const marker = '{"battle_id":';
  let from = 0;
  while (true) {
    const idx = flight.indexOf(marker, from);
    if (idx < 0) break;
    from = idx + marker.length;
    const objStr = extractJsonObjectAt(flight, idx);
    if (!objStr) continue;
    try {
      const parsed = RawBattleSchema.safeParse(JSON.parse(objStr));
      if (!parsed.success) continue;
      const battle = normalize(parsed.data);
      if (battle && !seen.has(battle.battleId)) {
        seen.add(battle.battleId);
        battles.push(battle);
      }
    } catch {
      // malformed slice - skip
    }
  }
  return battles;
}

/** Fetch one /battles page (1-indexed). Injectable fetch for tests. */
export type FetchBattlesPage = (page: number) => Promise<string>;

export function httpBattlesPageFetcher(fetchImpl: typeof fetch = fetch): FetchBattlesPage {
  return (page: number): Promise<string> =>
    withRetry(
      async () => {
        const url =
          page <= 1 ? `${INTELLIGENCE_BASE}/battles` : `${INTELLIGENCE_BASE}/battles?page=${page}`;
        const res = await fetchImpl(url, {
          headers: { 'User-Agent': 'ZAO-OS-Sync/1.0' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          throw new WaveWarzBattlesError(`/battles page ${page} returned HTTP ${res.status}`);
        }
        return res.text();
      },
      { shouldRetry: isRetryableHttpError },
    );
}

/**
 * Paginate /battles back as far as possible, deduping by battle_id. Stops when a
 * page yields no new battles or maxPages is reached.
 */
export async function scrapeWaveWarzBattles(
  opts: { maxPages?: number; fetchPage?: FetchBattlesPage; fetchImpl?: typeof fetch } = {},
): Promise<{ battles: WaveWarzBattle[]; pagesFetched: number; truncated: boolean }> {
  const maxPages = opts.maxPages ?? 100;
  const fetchPage = opts.fetchPage ?? httpBattlesPageFetcher(opts.fetchImpl);
  const seen = new Set<number>();
  const battles: WaveWarzBattle[] = [];
  let page = 1;

  for (; page <= maxPages; page += 1) {
    const html = await fetchPage(page);
    const pageBattles = parseWaveWarzBattlesPage(html);
    let added = 0;
    for (const b of pageBattles) {
      if (!seen.has(b.battleId)) {
        seen.add(b.battleId);
        battles.push(b);
        added += 1;
      }
    }
    if (added === 0) {
      // No new battles on this page - we have reached the end of history.
      return { battles, pagesFetched: page, truncated: false };
    }
  }
  return { battles, pagesFetched: maxPages, truncated: true };
}
