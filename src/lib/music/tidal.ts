const TIDAL_API = 'https://openapi.tidal.com/v2'

function getClientId() { return process.env.TIDAL_CLIENT_ID! }
function getClientSecret() { return process.env.TIDAL_CLIENT_SECRET! }

export async function searchTidal(query: string, limit = 10): Promise<TidalTrack[]> {
  const token = await getClientToken()
  if (!token) return []

  try {
    const res = await fetch(
      `${TIDAL_API}/searchresults/${encodeURIComponent(query)}?countryCode=US&limit=${limit}&include=tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.tracks ?? []).map(mapTrack)
  } catch {
    return []
  }
}

export async function getTidalTrack(id: string): Promise<TidalTrack | null> {
  const token = await getClientToken()
  if (!token) return null

  try {
    const res = await fetch(`${TIDAL_API}/tracks/${id}?countryCode=US`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return mapTrack(await res.json())
  } catch {
    return null
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getClientToken(): Promise<string | null> {
  if (!process.env.TIDAL_CLIENT_ID || !process.env.TIDAL_CLIENT_SECRET) return null

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  try {
    const res = await fetch('https://auth.tidal.com/v1/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: getClientId(),
        client_secret: getClientSecret(),
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null
    const data = await res.json()

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }
    return cachedToken.token
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrack(raw: any): TidalTrack {
  return {
    id: String(raw.id ?? raw.data?.id ?? ''),
    title: raw.title ?? raw.attributes?.title ?? 'Unknown',
    artist: raw.artists?.[0]?.name ?? raw.attributes?.artists?.[0]?.name ?? 'Unknown',
    album: raw.album?.title ?? '',
    artworkUrl: raw.album?.imageCover?.[0]?.url ?? '',
    duration: raw.duration ?? raw.attributes?.duration ?? 0,
    url: `https://tidal.com/browse/track/${raw.id ?? raw.data?.id}`,
  }
}

export interface TidalTrack {
  id: string
  title: string
  artist: string
  album: string
  artworkUrl: string
  duration: number
  url: string
}
