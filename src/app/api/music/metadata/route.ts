import { NextRequest, NextResponse } from 'next/server';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { TrackMetadata, TrackType } from '@/types/music';

function makeId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchSpotify(url: string): Promise<TrackMetadata | null> {
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { 'User-Agent': 'ZAO-OS/1.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: makeId(url),
    type: 'spotify',
    trackName: data.title ?? '',
    artistName: data.author_name ?? '',
    artworkUrl: data.thumbnail_url ?? '',
    url,
    feedId: '',
  };
}

async function fetchSoundCloud(url: string): Promise<TrackMetadata | null> {
  const res = await fetch(
    `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { headers: { 'User-Agent': 'ZAO-OS/1.0' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: makeId(url),
    type: 'soundcloud',
    trackName: data.title ?? '',
    artistName: data.author_name ?? '',
    artworkUrl: data.thumbnail_url ?? '',
    url,
    feedId: '',
  };
}

async function fetchYouTube(url: string): Promise<TrackMetadata | null> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { headers: { 'User-Agent': 'ZAO-OS/1.0' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: makeId(url),
    type: 'youtube',
    trackName: data.title ?? '',
    artistName: data.author_name ?? '',
    artworkUrl: `https://img.youtube.com/vi/${extractYouTubeId(url)}/hqdefault.jpg`,
    url,
    feedId: '',
  };
}

function extractYouTubeId(url: string): string {
  const patterns = [/[?&]v=([^&]+)/, /youtu\.be\/([^?&#]+)/, /shorts\/([^?&#]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}

async function fetchSoundXyz(url: string): Promise<TrackMetadata | null> {
  const query = `
    query TrackInfo {
      releaseFromTrack(url: ${JSON.stringify(url)}) {
        id
        title
        artist { name }
        coverImage { url }
        track { normalizedAudioUrl }
      }
    }
  `;

  const res = await fetch('https://api.sound.xyz/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ZAO-OS/1.0' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const release = json?.data?.releaseFromTrack;
  if (!release) return null;

  return {
    id: release.id ?? makeId(url),
    type: 'soundxyz',
    trackName: release.title ?? '',
    artistName: release.artist?.name ?? '',
    artworkUrl: release.coverImage?.url ?? '',
    url,
    streamUrl: release.track?.normalizedAudioUrl ?? '',
    feedId: '',
  };
}

function audioFromUrl(url: string): TrackMetadata {
  let trackName = '';
  try {
    const pathname = new URL(url).pathname;
    trackName = decodeURIComponent(pathname.split('/').pop() ?? '') || url;
  } catch {
    trackName = url;
  }
  return {
    id: makeId(url),
    type: 'audio',
    trackName,
    artistName: '',
    artworkUrl: '',
    url,
    feedId: '',
  };
}

const fetchers: Record<TrackType, (url: string) => Promise<TrackMetadata | null>> = {
  spotify: fetchSpotify,
  soundcloud: fetchSoundCloud,
  youtube: fetchYouTube,
  soundxyz: fetchSoundXyz,
  audio: async (url) => audioFromUrl(url),
};

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  const type = isMusicUrl(url);
  if (!type) {
    return NextResponse.json({ error: 'Not a music URL' }, { status: 400 });
  }

  try {
    const metadata = await fetchers[type](url);
    if (!metadata) {
      return NextResponse.json({ error: 'Could not fetch metadata' }, { status: 404 });
    }
    return NextResponse.json(metadata, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error('[music/metadata] error:', err);
    return NextResponse.json({ error: 'Metadata fetch failed' }, { status: 500 });
  }
}
