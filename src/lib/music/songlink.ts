/**
 * Songlink/Odesli universal music link resolver.
 *
 * Resolves a music URL (Spotify, Apple Music, SoundCloud, etc.)
 * into links for every platform the song is available on.
 */

const SONGLINK_API = 'https://api.song.link/v1-alpha.1/links';

// Priority platforms for ZAO (web3 music community)
const ZAO_PLATFORMS = [
  { key: 'audius', label: 'Audius', color: '#7E1BCC' },
  { key: 'spotify', label: 'Spotify', color: '#1DB954' },
  { key: 'appleMusic', label: 'Apple Music', color: '#FA243C' },
  { key: 'soundcloud', label: 'SoundCloud', color: '#FF5500' },
  { key: 'tidal', label: 'Tidal', color: '#00FFFF' },
  { key: 'youtubeMusic', label: 'YouTube', color: '#FF0000' },
] as const;

// ---------- Types ----------

export interface PlatformLink {
  platform: string;
  label: string;
  url: string;
  color: string;
}

export interface UniversalMusicCard {
  title: string;
  artist: string;
  thumbnail: string;
  pageUrl: string;
  platforms: PlatformLink[];
}

/** Shape of the Songlink API response (subset we care about). */
interface SonglinkResponse {
  entityUniqueId: string;
  pageUrl: string;
  entitiesByUniqueId: Record<
    string,
    {
      id: string;
      title?: string;
      artistName?: string;
      thumbnailUrl?: string;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
      apiProvider?: string;
      platforms?: string[];
    }
  >;
  linksByPlatform: Record<
    string,
    {
      url: string;
      entityUniqueId: string;
      nativeAppUriMobile?: string;
      nativeAppUriDesktop?: string;
    }
  >;
}

// ---------- Public API ----------

/**
 * Call the Songlink/Odesli API and return the raw response.
 * Throws on network errors or non-OK status codes.
 */
export async function resolveMusicLinks(url: string): Promise<SonglinkResponse> {
  const endpoint = `${SONGLINK_API}?url=${encodeURIComponent(url)}&userCountry=US`;

  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'ZAO-OS/1.0' },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 429) {
    throw new RateLimitError('Songlink API rate limited');
  }

  if (!res.ok) {
    throw new Error(`Songlink API returned ${res.status}`);
  }

  return res.json() as Promise<SonglinkResponse>;
}

/**
 * Transform the raw Songlink response into a clean card structure
 * with only the platforms ZAO cares about, in priority order.
 */
export function buildUniversalCard(response: SonglinkResponse): UniversalMusicCard {
  // Find the primary entity to pull title/artist/thumbnail from
  const primaryEntity = response.entitiesByUniqueId[response.entityUniqueId];

  let title = '';
  let artist = '';
  let thumbnail = '';

  if (primaryEntity) {
    title = primaryEntity.title ?? '';
    artist = primaryEntity.artistName ?? '';
    thumbnail = primaryEntity.thumbnailUrl ?? '';
  }

  // If primary entity is missing metadata, scan all entities for the best data
  if (!title || !thumbnail) {
    for (const entity of Object.values(response.entitiesByUniqueId)) {
      if (!title && entity.title) title = entity.title;
      if (!artist && entity.artistName) artist = entity.artistName;
      if (!thumbnail && entity.thumbnailUrl) thumbnail = entity.thumbnailUrl;
      if (title && artist && thumbnail) break;
    }
  }

  // Build platform links in ZAO priority order
  const platforms: PlatformLink[] = [];

  for (const zp of ZAO_PLATFORMS) {
    const link = response.linksByPlatform[zp.key];
    if (link) {
      platforms.push({
        platform: zp.key,
        label: zp.label,
        url: link.url,
        color: zp.color,
      });
    }
  }

  return {
    title,
    artist,
    thumbnail,
    pageUrl: response.pageUrl,
    platforms,
  };
}

// ---------- Errors ----------

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
