/**
 * Jina Reader - free URL-to-text extraction
 * Handles JS-rendered pages, bypasses common blocks (X, Linktree, etc.)
 * Free tier: 1000 req/day
 * Docs: https://jina.ai/reader/
 *
 * Usage:
 *   const text = await jinaFetch("https://x.com/STILOWORLD");
 *   const extracted = await extractFromUrl("https://youtube.com/watch?v=...");
 */

const JINA_READER_URL = 'https://r.jina.ai/';
const JINA_TIMEOUT = 10000; // 10 seconds

type Platform = 'x' | 'twitter' | 'youtube' | 'reddit' | 'linktree' | 'spotify' | 'website';

interface ExtractedContent {
  platform: Platform;
  title?: string;
  description?: string;
  author?: string;
  links?: string[];
  rawText: string;
}

interface OEmbedData {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url?: string;
  html?: string;
}

/**
 * Fetch URL content via Jina Reader
 * Prepends https://r.jina.ai/ and returns clean markdown/text
 */
export async function jinaFetch(url: string): Promise<string> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  const jinaUrl = `${JINA_READER_URL}${url}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JINA_TIMEOUT);

    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; ZAO Reader/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jina Reader returned ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Jina Reader request timeout (10s)');
    }
    throw error;
  }
}

/**
 * Detect platform from URL hostname
 * Returns: 'x' | 'youtube' | 'reddit' | 'linktree' | 'spotify' | 'website'
 */
export function detectPlatform(url: string): Platform {
  if (!url || typeof url !== 'string') {
    return 'website';
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'x';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('reddit.com')) {
      return 'reddit';
    }
    if (hostname.includes('linktree.com')) {
      return 'linktree';
    }
    if (hostname.includes('spotify.com')) {
      return 'spotify';
    }

    return 'website';
  } catch {
    return 'website';
  }
}

/**
 * Fetch oEmbed metadata for supported platforms
 * Supports: X, YouTube, Spotify, and fallback via noembed.com
 */
export async function oembedFetch(url: string): Promise<OEmbedData | null> {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const platform = detectPlatform(url);
    let oembedUrl: string | null = null;

    switch (platform) {
      case 'x':
      case 'twitter':
        oembedUrl = `https://publish.x.com/oembed?url=${encodeURIComponent(url)}`;
        break;
      case 'youtube':
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        break;
      case 'spotify':
        oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        break;
      default:
        // Fallback to noembed.com for other platforms
        oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    }

    if (!oembedUrl) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JINA_TIMEOUT);

    const response = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZAO Reader/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Normalize response to OEmbedData structure
    return {
      title: data.title || '',
      author_name: data.author_name || data.author || '',
      author_url: data.author_url || data.author_url || '',
      thumbnail_url: data.thumbnail_url || undefined,
      html: data.html || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract structured content from URL
 * Combines oEmbed metadata (if available) + Jina Reader for full text
 */
export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  const platform = detectPlatform(url);
  const rawText = await jinaFetch(url);

  // Try to get oEmbed metadata in parallel
  const oembedData = await oembedFetch(url);

  const extracted: ExtractedContent = {
    platform,
    rawText,
    title: oembedData?.title || extractTitleFromText(rawText),
    description: extractDescriptionFromText(rawText),
    author: oembedData?.author_name || undefined,
    links: extractLinksFromText(rawText),
  };

  return extracted;
}

/**
 * Extract title from raw text (first line or h1/title tag)
 */
function extractTitleFromText(text: string): string | undefined {
  if (!text) return undefined;

  // Try to find markdown h1
  const h1Match = text.match(/^#\s+(.+?)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to first non-empty line
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length > 0) {
    return lines[0].substring(0, 200).trim();
  }

  return undefined;
}

/**
 * Extract description from raw text (first paragraph)
 */
function extractDescriptionFromText(text: string): string | undefined {
  if (!text) return undefined;

  const lines = text.split('\n');
  let description = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headings
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    description += (description ? ' ' : '') + trimmed;

    // Stop after ~500 chars or 2-3 sentences
    if (description.length > 300) {
      break;
    }
  }

  return description.length > 0 ? description.substring(0, 500).trim() : undefined;
}

/**
 * Extract URLs from raw text (lines that look like URLs)
 */
function extractLinksFromText(text: string): string[] {
  if (!text) return [];

  const urlPattern = /https?:\/\/[^\s\)]+/g;
  const matches = text.match(urlPattern) || [];

  // Deduplicate and return unique links
  return Array.from(new Set(matches)).slice(0, 10);
}
