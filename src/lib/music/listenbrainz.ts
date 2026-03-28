const API_URL = 'https://api.listenbrainz.org';

export async function submitListen(params: {
  artist: string;
  track: string;
  album?: string;
  timestamp: number;
  userToken: string;
}) {
  const payload = {
    listen_type: 'single',
    payload: [
      {
        listened_at: params.timestamp,
        track_metadata: {
          artist_name: params.artist,
          track_name: params.track,
          ...(params.album ? { release_name: params.album } : {}),
        },
      },
    ],
  };

  const res = await fetch(`${API_URL}/1/submit-listens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${params.userToken}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ListenBrainz error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function submitNowPlaying(params: {
  artist: string;
  track: string;
  album?: string;
  userToken: string;
}) {
  const payload = {
    listen_type: 'playing_now',
    payload: [
      {
        track_metadata: {
          artist_name: params.artist,
          track_name: params.track,
          ...(params.album ? { release_name: params.album } : {}),
        },
      },
    ],
  };

  const res = await fetch(`${API_URL}/1/submit-listens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${params.userToken}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ListenBrainz error ${res.status}: ${text}`);
  }

  return res.json();
}
