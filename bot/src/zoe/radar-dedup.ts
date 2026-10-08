/**
 * radar-dedup.ts - layered duplicate detection for incoming research items.
 *
 * Adapted from 99darwin/nexus (Nexus Contributors, MIT License), https://github.com/99darwin/nexus
 * (packages/agent/src/dedup.ts and packages/agent/src/sources/types.ts, read at
 * the commit pushed 2026-10-07). Licence and notice: bot/src/zoe/third_party/nexus/.
 *
 * What was taken: the layered dedup (URL, then exact title, then arXiv id, then
 * content-word Jaccard and title-entity overlap) and the source-adapter shape.
 * What was left out, on Zaal's 2026-10-08 ruling (vault item 64): nexus's paid
 * TypeSafe/Jev classifier, its Postgres tables, and its X API adapter. This file
 * is pure: no database, no network, no clock. Callers pass in what was seen.
 *
 * Doc: research/dev-workflows/2643-nickysap-github-clone-plan (rank 3).
 */

import { normalizeUrl } from './research-dedupe';

/** One incoming item from any source. Mirrors nexus's RawItem, trimmed to what dedup needs. */
export interface RadarItem {
  source: string;
  url: string;
  title: string;
  content?: string;
  /** Set by the adapter when known; otherwise extracted from the url. */
  arxivId?: string;
}

/**
 * The source-adapter shape, from nexus's sources/types.ts. An adapter fetches the
 * current window of items and MUST honour `signal`, so one slow source cannot hold
 * up the others. Keyless fetchers only (HN Algolia, arXiv, GitHub, RSS); no adapter
 * may need a paid key.
 */
export interface RadarSourceAdapter {
  name: string;
  priority: 'P0' | 'P1' | 'P2';
  poll(signal?: AbortSignal): Promise<RadarItem[]>;
}

export type DupReason = 'url' | 'title' | 'arxiv' | 'content' | 'entities';

export interface DedupResult {
  kept: RadarItem[];
  dropped: Array<{ item: RadarItem; reason: DupReason; duplicateOf: string }>;
}

// Thresholds kept from nexus: content Jaccard above 0.6, or 2+ shared title entities.
export const CONTENT_SIMILARITY_THRESHOLD = 0.6;
export const MIN_ENTITY_OVERLAP = 2;
// nexus caps the O(n^2) pass at 200 items; so do we.
export const MAX_DEDUP_BATCH = 200;

// Word lists from nexus's dedup.ts.
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
  'has', 'have', 'been', 'some', 'them', 'than', 'its', 'over', 'also', 'that', 'other', 'into', 'then',
  'about', 'would', 'this', 'with', 'from', 'they', 'will', 'what', 'when', 'make', 'like', 'just', 'more',
  'these', 'very', 'after', 'most', 'made', 'such', 'being', 'their', 'does', 'could', 'said', 'each',
  'which', 'she', 'how', 'who', 'get', 'got', 'use', 'using', 'used', 'new', 'great', 'really', 'think',
  'know', 'good', 'much', 'way', 'even', 'well', 'here',
]);

const TITLE_COMMON_WORDS = new Set([
  'the', 'this', 'that', 'what', 'when', 'where', 'which', 'how', 'why', 'new', 'first', 'last', 'next',
  'big', 'more', 'most', 'just', 'now', 'after', 'before', 'into', 'over', 'from', 'with', 'about', 'here',
  'for', 'and', 'not', 'all', 'can', 'has', 'was', 'are', 'will', 'get', 'its', 'our', 'his', 'her', 'may',
  'could', 'should', 'would', 'been', 'says', 'said', 'according', 'report', 'sources', 'via', 'per', 'use',
  'former', 'chief', 'company', 'startup', 'launches', 'announces', 'takes', 'raises', 'funding', 'round',
  'series', 'massive', 'major', 'top', 'every', 'best', 'latest', 'breaking', 'exclusive', 'update',
  'year', 'today',
]);

/** Proper nouns and dollar amounts in a title (nexus extractTitleEntities). */
export function extractTitleEntities(title: string): string[] {
  const entities: string[] = [];
  for (const match of title.matchAll(/\$\s*([\d,.]+)\s*(b|m|k|billion|million|thousand)?/gi)) {
    const num = parseFloat(match[1].replace(/,/g, ''));
    const s = (match[2] ?? '').charAt(0).toLowerCase();
    if (s === 'b') entities.push(`$${num}b`);
    else if (s === 'm') entities.push(`$${num}m`);
    else if (s === 'k' || s === 't') entities.push(`$${num}k`);
    else entities.push(`$${num}`);
  }
  for (const word of title.split(/[^a-zA-Z0-9]+/)) {
    if (word.length < 2) continue;
    if (/^[A-Z]/.test(word) && !TITLE_COMMON_WORDS.has(word.toLowerCase())) entities.push(word.toLowerCase());
  }
  return [...new Set(entities)];
}

/** Sorted significant words, for Jaccard (nexus contentFingerprint). */
export function contentFingerprint(text: string): string[] {
  const normalized = text
    .replace(/@[\w]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#[\w]+/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = normalized.split(' ').filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return [...new Set(words)].sort();
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let intersection = 0;
  for (const w of a) if (setB.has(w)) intersection++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function entityOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  return a.filter((e) => setB.has(e)).length;
}

/**
 * An arXiv id from a url or text, without its version: abs/2401.12345v2,
 * pdf/2401.12345.pdf and "arXiv:2401.12345" all give "2401.12345".
 */
export function extractArxivId(text: string): string | null {
  const m = /(?:arxiv\.org\/(?:abs|pdf|html)\/|arxiv:\s*)(\d{4}\.\d{4,5})(?:v\d+)?/i.exec(text);
  return m ? m[1] : null;
}

function normTitle(t: string): string {
  return t.toLowerCase().replace(/\s+/g, ' ').trim();
}

interface Seen {
  url: string;
  urlKey: string;
  titleKey: string;
  arxiv: string | null;
  fp: string[];
  entities: string[];
}

function fingerprint(item: RadarItem): Seen {
  return {
    url: item.url,
    urlKey: normalizeUrl(item.url),
    titleKey: normTitle(item.title),
    arxiv: item.arxivId ?? extractArxivId(item.url),
    fp: contentFingerprint(`${item.title} ${item.content ?? ''}`),
    entities: extractTitleEntities(item.title),
  };
}

function matchReason(a: Seen, b: Seen): DupReason | null {
  if (a.urlKey && a.urlKey === b.urlKey) return 'url';
  if (a.titleKey && a.titleKey === b.titleKey) return 'title';
  if (a.arxiv && a.arxiv === b.arxiv) return 'arxiv';
  if (jaccardSimilarity(a.fp, b.fp) > CONTENT_SIMILARITY_THRESHOLD) return 'content';
  if (entityOverlap(a.entities, b.entities) >= MIN_ENTITY_OVERLAP) return 'entities';
  return null;
}

/**
 * Keep the first of each group of duplicates, within the batch and against items
 * already seen (for example, recent radar items or existing research docs).
 * Order is kept. Every drop says why and what it duplicated, so nothing vanishes
 * silently. Items past MAX_DEDUP_BATCH are kept unchecked, never dropped.
 */
export function dedupeRadarItems(items: RadarItem[], alreadySeen: RadarItem[] = []): DedupResult {
  const seen: Seen[] = alreadySeen.slice(0, MAX_DEDUP_BATCH).map(fingerprint);
  const kept: RadarItem[] = [];
  const dropped: DedupResult['dropped'] = [];
  items.forEach((item, i) => {
    if (i >= MAX_DEDUP_BATCH) { kept.push(item); return; }
    const f = fingerprint(item);
    for (const s of seen) {
      const reason = matchReason(f, s);
      if (reason) { dropped.push({ item, reason, duplicateOf: s.url }); return; }
    }
    seen.push(f);
    kept.push(item);
  });
  return { kept, dropped };
}
