export interface OGMetadata {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

const URL_REGEX = /^https?:\/\//i;

export function isUrl(input: string): boolean {
  return URL_REGEX.test(input.trim());
}

const BLOCKED_HOSTS = [
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',
  'metadata.internal',
];

function isPrivateUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // Block known metadata/internal hostnames
    if (BLOCKED_HOSTS.includes(hostname)) return true;

    // Block non-http(s) schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;

    // Block private IP ranges
    const parts = hostname.split('.');
    if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
      const [a, b] = parts.map(Number);
      if (a === 10) return true;                          // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
      if (a === 192 && b === 168) return true;             // 192.168.0.0/16
      if (a === 127) return true;                          // 127.0.0.0/8
      if (a === 169 && b === 254) return true;             // 169.254.0.0/16
      if (a === 0) return true;                            // 0.0.0.0/8
    }

    // Block IPv6 localhost
    if (hostname === '[::1]' || hostname === '::1') return true;

    return false;
  } catch {
    return true; // Block unparseable URLs
  }
}

/**
 * Fetch a URL and extract Open Graph meta tags.
 * Returns nulls on timeout, error, or missing tags.
 */
export async function extractOGMetadata(url: string): Promise<OGMetadata> {
  const empty: OGMetadata = { ogTitle: null, ogDescription: null, ogImage: null };

  if (isPrivateUrl(url)) return empty;

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
