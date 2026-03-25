export interface OGMetadata {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

const URL_REGEX = /^https?:\/\//i;

export function isUrl(input: string): boolean {
  return URL_REGEX.test(input.trim());
}

/**
 * Fetch a URL and extract Open Graph meta tags.
 * Returns nulls on timeout, error, or missing tags.
 */
export async function extractOGMetadata(url: string): Promise<OGMetadata> {
  const empty: OGMetadata = { ogTitle: null, ogDescription: null, ogImage: null };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ZAO-OS-Library/1.0',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return empty;

    const html = await res.text();
    // Only parse the first 50KB to avoid memory issues on large pages
    const head = html.slice(0, 50_000);

    const ogTitle = extractMetaContent(head, 'og:title')
      ?? extractMetaContent(head, 'twitter:title')
      ?? extractTitle(head);
    const ogDescription = extractMetaContent(head, 'og:description')
      ?? extractMetaContent(head, 'twitter:description')
      ?? extractMetaContent(head, 'description');
    const ogImage = extractMetaContent(head, 'og:image')
      ?? extractMetaContent(head, 'twitter:image');

    return { ogTitle, ogDescription, ogImage };
  } catch {
    return empty;
  }
}

function extractMetaContent(html: string, property: string): string | null {
  // Match both property="..." and name="..." attributes
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']` +
    `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
    'i'
  );
  const match = html.match(regex);
  const value = match?.[1] ?? match?.[2] ?? null;
  return value ? decodeHTMLEntities(value).trim() : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? decodeHTMLEntities(match[1]).trim() : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
