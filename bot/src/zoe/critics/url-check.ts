/**
 * url-check.ts - a research doc's links are fetched, not taken on its word.
 *
 * THE GAP (doc 2191, 2026-08-04; research-grounding.md): research-critic
 * scores Hard Requirement 8, "All URLs verified for liveness", with a model
 * reading the doc. A model cannot tell a real arxiv id from an invented one by
 * reading it, and research subagents in this estate have invented arxiv ids,
 * thread numbers and repos before (research-grounding.md, 2026-08-03). The
 * cheapest certain check is to fetch every cited URL.
 *
 * WHAT COUNTS AS BROKEN (so the signal can reach zero on an honest doc,
 * noisy-signal-guard.md): only a definite "not there": HTTP 404 or 410, or a
 * host that does not resolve. A 401/403/429 is a site blocking bots, a 5xx or
 * timeout is the network: those are UNKNOWN and never fail a doc. 2xx/3xx is
 * alive. Redirects are followed.
 *
 * EFFECT: each broken URL becomes a critical critic issue and the score is
 * capped under the pass line, so workers.ts runs its existing one revision
 * pass with feedback naming the dead links. It never raises a score.
 *
 * Bounded: at most MAX_URLS per doc, a few at a time, each with a timeout. The
 * fetcher is injected so tests never touch the network. Off unless
 * ZOE_RESEARCH_URL_CHECK=1.
 */

import { featureRan } from '../feature-ran';
import { CRITIQUE_PASS_THRESHOLD, defaultShipsAsIs, type CritiqueIssue, type CritiqueOutput } from './types';

export const MAX_URLS = 25;
const TIMEOUT_MS = 8000;
const CONCURRENCY = 4;
/** Sent so sites that refuse a bare client still answer (agent-loops.md rule 14). */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export function urlCheckEnabled(): boolean {
  return process.env.ZOE_RESEARCH_URL_CHECK === '1';
}

export type UrlVerdict = 'alive' | 'dead' | 'unknown';

export interface UrlResult {
  url: string;
  verdict: UrlVerdict;
  /** HTTP status, or the network error code. */
  detail: string;
}

export type Fetcher = (url: string, init: { method: string; redirect: 'follow'; headers: Record<string, string>; signal: AbortSignal }) => Promise<{ status: number }>;

/** Every distinct http(s) URL in the doc, trailing punctuation trimmed, capped. */
export function extractUrls(doc: string, max: number = MAX_URLS): string[] {
  const found = doc.match(/https?:\/\/[^\s<>"'`]+/g) ?? [];
  const out: string[] = [];
  for (const raw of found) {
    let u = raw.replace(/[.,;:!?*_]+$/, '');
    // Drop a closing bracket only when it is unbalanced (markdown link wrap), keep wiki-style (x).
    while (/[)\]]$/.test(u)) {
      const close = u.endsWith(')') ? ')' : ']';
      const open = close === ')' ? '(' : '[';
      if (u.split(open).length >= u.split(close).length) break;
      u = u.slice(0, -1);
    }
    if (!out.includes(u)) out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

/** Map a status or error to a verdict. Only a definite absence is 'dead'. */
export function verdictFor(status: number | null, errCode?: string): UrlVerdict {
  if (status === null) return errCode === 'ENOTFOUND' ? 'dead' : 'unknown';
  if (status >= 200 && status < 400) return 'alive';
  if (status === 404 || status === 410) return 'dead';
  return 'unknown';
}

function errCodeOf(err: unknown): string {
  const e = err as { code?: string; cause?: { code?: string }; name?: string };
  return e?.cause?.code ?? e?.code ?? (e?.name === 'AbortError' || e?.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR');
}

export async function checkUrl(url: string, fetcher: Fetcher, timeoutMs: number = TIMEOUT_MS): Promise<UrlResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetcher(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': BROWSER_UA }, signal: ctrl.signal });
    return { url, verdict: verdictFor(res.status), detail: String(res.status) };
  } catch (err) {
    const code = errCodeOf(err);
    return { url, verdict: verdictFor(null, code), detail: code };
  } finally {
    clearTimeout(timer);
    // Only the status is needed: aborting after the response cancels the body
    // download, so a large page does not hold the socket open.
    ctrl.abort();
  }
}

export async function checkUrls(urls: string[], fetcher: Fetcher, timeoutMs: number = TIMEOUT_MS): Promise<UrlResult[]> {
  const results: UrlResult[] = new Array(urls.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < urls.length) {
      const i = next++;
      results[i] = await checkUrl(urls[i], fetcher, timeoutMs);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, lane));
  return results;
}

/**
 * Fold dead URLs into a critique: one critical issue each, score capped below
 * the pass line, ships_as_is recomputed. Pure. Unchanged when nothing is dead.
 */
export function applyUrlResults(critique: CritiqueOutput, results: UrlResult[]): CritiqueOutput {
  const dead = results.filter((r) => r.verdict === 'dead');
  if (dead.length === 0) return critique;
  const added: CritiqueIssue[] = dead.map((r) => ({
    severity: 'critical',
    location: r.url,
    issue: `Cited URL does not exist (${r.detail} when fetched). Replace it with a source you fetched, or remove the claim it supports.`,
  }));
  const issues = [...added, ...critique.issues];
  const score = Math.min(critique.score, CRITIQUE_PASS_THRESHOLD - 1);
  return {
    ...critique,
    score,
    summary: `${dead.length} cited URL(s) do not exist. ${critique.summary}`,
    issues,
    ships_as_is: defaultShipsAsIs(score, issues),
  };
}

/** The research critic's result with real link checks applied. Never throws; off = unchanged. */
export async function withUrlCheck(
  critique: CritiqueOutput | null,
  doc: string,
  fetcher: Fetcher = fetch as unknown as Fetcher,
): Promise<CritiqueOutput | null> {
  if (!critique || !urlCheckEnabled()) return critique;
  try {
    const urls = extractUrls(doc);
    if (urls.length === 0) return critique;
    const results = await checkUrls(urls, fetcher);
    const dead = results.filter((r) => r.verdict === 'dead').length;
    featureRan('research-url-check', `${urls.length} url(s): ${dead} dead, ${results.filter((r) => r.verdict === 'unknown').length} unknown`);
    return applyUrlResults(critique, results);
  } catch (err) {
    console.error('[zoe/url-check] failed, critique unchanged:', (err as Error)?.message);
    return critique;
  }
}
