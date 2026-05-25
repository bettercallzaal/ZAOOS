/**
 * Juke release-feed consumer.
 *
 * Nicky publishes a structured changelog at https://juke.audio/changelog.json.
 * Each entry has a `resolves: string[]` of opaque slugs that map directly to
 * our `OpenAsk.id` values. Polling this feed and joining on `resolves[]` lets
 * /juke-status auto-flip asks from "open" to "resolved" the moment Juke
 * ships, with zero manual edits to our manifest.
 *
 * Server-side fetch only (the page that uses this is SSR). Cached short via
 * Next's fetch cache so we do not hammer Juke on every page view.
 */

const CHANGELOG_URL = 'https://juke.audio/changelog.json';
const CACHE_TTL_SECONDS = 300; // 5 min - changelog updates rarely

export interface JukeChangelogEntry {
  id: string;
  shipped_at: string;
  category: string;
  title: string;
  summary: string;
  endpoints?: string[];
  docs?: string;
  docs_section?: string;
  resolves?: string[];
}

export interface JukeChangelog {
  version: number;
  generated_at: string;
  canonical_spec: string;
  skill_md: string;
  entries: JukeChangelogEntry[];
}

/** Fetch the Juke changelog. Returns null on any failure - callers should
 * treat a null as "do not annotate, render asks as-is." */
export async function fetchJukeChangelog(): Promise<JukeChangelog | null> {
  try {
    const res = await fetch(CHANGELOG_URL, {
      next: { revalidate: CACHE_TTL_SECONDS },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as JukeChangelog;
    if (!json || !Array.isArray(json.entries)) return null;
    return json;
  } catch {
    return null;
  }
}

/** Build a lookup from OpenAsk.id -> the changelog entry that resolves it,
 * if any. An ask can be resolved by multiple entries - we keep the most
 * recent one (highest shipped_at). */
export function buildResolutionIndex(
  changelog: JukeChangelog | null,
): Map<string, JukeChangelogEntry> {
  const out = new Map<string, JukeChangelogEntry>();
  if (!changelog) return out;
  for (const entry of changelog.entries) {
    // 1) Explicit join: entry.resolves[] -> OpenAsk.id (canonical path).
    for (const askId of entry.resolves ?? []) {
      const prior = out.get(askId);
      if (!prior || entry.shipped_at > prior.shipped_at) {
        out.set(askId, entry);
      }
    }
    // 2) Implicit join: an OpenAsk.id matches the entry.id directly. Lets a
    // newly-shipped Juke entry resolve our ask without needing Nicky to
    // backfill the resolves[] array. Pre-condition is identical ids on both
    // sides - which is exactly how we author asks for new Juke features
    // (e.g. our 'developer-end-space' ask matches Juke's 'developer-end-space'
    // changelog entry). resolves[] still wins for explicit cross-id mappings.
    const idMatch = out.get(entry.id);
    if (!idMatch || entry.shipped_at > idMatch.shipped_at) {
      out.set(entry.id, entry);
    }
  }
  return out;
}
