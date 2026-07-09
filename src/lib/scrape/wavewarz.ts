/**
 * WaveWarZ Intelligence artist-page parser.
 *
 * The Intelligence site (wavewarz-intelligence.vercel.app) is an App-Router
 * (RSC) Next.js app: there is no public JSON API and no __NEXT_DATA__ blob.
 * The artist stats are rendered inside the React flight payload as
 * label/value pairs, e.g.:
 *   ...{"children":61},...{"children":"Wins"}...
 *   ...{"children":"Total Volume"}...{"children":"5.2337 SOL"}...
 *
 * The previous scraper used regexes like /Wins[:\s]*(\d+)/ that never match this
 * structure, so it silently returned 0 for every artist. This parser extracts
 * the values from the actual flight tree, validates them with Zod, and returns a
 * typed result so failures are explicit instead of silent.
 *
 * Long-term, the authoritative source is on-chain (the site itself says
 * "Every number. ONCHAIN."); this parser is the no-dependency interim.
 */

import { z } from 'zod';

export const WaveWarzStatsSchema = z.object({
  name: z.string(),
  wallet: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  battlesCount: z.number().int().nonnegative(),
  winRatePct: z.number().min(0).max(100).nullable(),
  totalVolumeSol: z.number().nonnegative(),
  careerEarningsSol: z.number().nonnegative(),
});

export type WaveWarzStats = z.infer<typeof WaveWarzStatsSchema>;

export type WaveWarzParseResult = { ok: true; data: WaveWarzStats } | { ok: false; reason: string };

/** Flight data escapes quotes as \". Normalize so the extractors can match plain JSON. */
function unescapeFlight(html: string): string {
  return html.replace(/\\"/g, '"');
}

/** Artist name from the page <title>: "NAME - WaveWarZ Player Card". */
function extractName(html: string): string | null {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return null;
  // The site uses an em-dash separator in its own title; split on any dash variant.
  const raw = m[1].split(/\s[—–-]\s/)[0].trim();
  return raw.length > 0 ? raw : null;
}

/**
 * A stat count (wins/losses) renders as a numeric child immediately BEFORE its
 * label: ...{"children":61},...{"children":"Wins"}... Take the last numeric
 * child in the ~220 chars preceding the label.
 */
function extractCountBeforeLabel(flight: string, label: string): number | null {
  const idx = flight.indexOf(`"children":"${label}"`);
  if (idx < 0) return null;
  const window = flight.slice(Math.max(0, idx - 240), idx);
  const matches = [...window.matchAll(/"children":(\d+)\}/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1][1];
  return Number.parseInt(last, 10);
}

/**
 * A SOL stat renders as a string child AFTER its label:
 * ...{"children":"Total Volume"}...{"children":"5.2337 SOL"}...
 */
function extractSolAfterLabel(flight: string, label: string): number | null {
  const idx = flight.indexOf(`"children":"${label}"`);
  if (idx < 0) return null;
  const window = flight.slice(idx, idx + 240);
  const m = window.match(/"children":"([\d.]+)\s*SOL"/i);
  return m ? Number.parseFloat(m[1]) : null;
}

/** Win rate renders as e.g. "69% overall". */
function extractWinRate(flight: string): number | null {
  const m = flight.match(/(\d{1,3})%\s*overall/i);
  if (!m) return null;
  const pct = Number.parseInt(m[1], 10);
  return pct >= 0 && pct <= 100 ? pct : null;
}

/**
 * Parse a WaveWarZ Intelligence artist page into validated stats.
 * Returns { ok: false, reason } when the page does not contain parseable stats,
 * instead of throwing or silently returning zeros.
 */
export function parseWaveWarzArtistPage(html: string, wallet: string): WaveWarzParseResult {
  if (!html || html.length < 100) {
    return { ok: false, reason: 'empty or too-short HTML' };
  }
  const flight = unescapeFlight(html);

  const name = extractName(html);
  const wins = extractCountBeforeLabel(flight, 'Wins');
  const losses = extractCountBeforeLabel(flight, 'Losses');
  const totalVolumeSol = extractSolAfterLabel(flight, 'Total Volume');
  const careerEarningsSol = extractSolAfterLabel(flight, 'Career Earnings');
  const winRatePct = extractWinRate(flight);

  // Require at least the financial stats OR a win/loss record - otherwise the
  // page shape changed and we should fail loudly rather than store zeros.
  if (wins === null && losses === null && totalVolumeSol === null && careerEarningsSol === null) {
    return { ok: false, reason: 'no stats found - WaveWarZ page structure may have changed' };
  }

  const candidate = {
    name: name ?? 'Unknown',
    wallet,
    wins: wins ?? 0,
    losses: losses ?? 0,
    battlesCount: (wins ?? 0) + (losses ?? 0),
    winRatePct,
    totalVolumeSol: totalVolumeSol ?? 0,
    careerEarningsSol: careerEarningsSol ?? 0,
  };

  const parsed = WaveWarzStatsSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `validation failed: ${parsed.error.issues[0]?.message ?? 'unknown'}`,
    };
  }
  return { ok: true, data: parsed.data };
}
