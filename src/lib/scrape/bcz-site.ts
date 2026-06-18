/**
 * BetterCallZaal site scraper (bettercallzaal.com).
 *
 * The site is a static personal/portfolio page. This extracts its title,
 * description, and outbound links, categorized into social profiles vs ZAO
 * ecosystem project links vs other - giving a structured map of Zaal's surfaces
 * without any login or API.
 *
 * Pure parser + thin fetcher (injectable fetch for tests).
 */

const BCZ_URL = 'https://bettercallzaal.com';

/** Hosts treated as social profiles. */
const SOCIAL_HOSTS = ['x.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'github.com', 'farcaster.xyz'];
/** Hosts treated as ZAO ecosystem projects. */
const PROJECT_HOSTS = ['wavewarz.com', 'clanker.world', 'empirebuilder.world', 'zaofestivals.com', 'thezao.com'];
/** Asset/infra hosts to ignore. */
const IGNORE_HOSTS = ['googleapis.com', 'gstatic.com', 'auth.farcaster.xyz'];

export type LinkCategory = 'social' | 'project' | 'other';

export interface BczLink {
  url: string;
  host: string;
  category: LinkCategory;
}

export interface BczSite {
  title: string | null;
  description: string | null;
  links: BczLink[];
  socials: string[];
  projects: string[];
}

export class BczSiteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BczSiteError';
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function categorize(host: string): LinkCategory {
  if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`) || host.includes(h))) return 'social';
  if (PROJECT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return 'project';
  return 'other';
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Parse bettercallzaal.com HTML into a structured profile. Pure. */
export function parseBczSite(html: string): BczSite {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : null;

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descMatch ? decodeEntities(descMatch[1]) : null;

  const seen = new Set<string>();
  const links: BczLink[] = [];
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
    const url = m[1];
    const host = hostOf(url);
    if (!host) continue;
    if (IGNORE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`) || host.includes(h))) continue;
    if (host === 'bettercallzaal.com') continue; // self-links
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ url, host, category: categorize(host) });
  }

  return {
    title,
    description,
    links,
    socials: links.filter((l) => l.category === 'social').map((l) => l.url),
    projects: links.filter((l) => l.category === 'project').map((l) => l.url),
  };
}

/** Fetch and parse bettercallzaal.com. Throws BczSiteError on HTTP failure. */
export async function scrapeBczSite(
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<BczSite> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(BCZ_URL, {
    headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 (compatible; ZAO Scraper/1.0)' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  });
  if (!res.ok) {
    throw new BczSiteError(`bettercallzaal.com returned HTTP ${res.status}`);
  }
  return parseBczSite(await res.text());
}
