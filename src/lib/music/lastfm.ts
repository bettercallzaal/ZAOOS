import crypto from 'crypto'

const API_URL = 'https://ws.audioscrobbler.com/2.0/'

function getApiKey() { return process.env.LASTFM_API_KEY! }
function getApiSecret() { return process.env.LASTFM_API_SECRET! }

function signParams(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const sig = sorted.map((k) => `${k}${params[k]}`).join('') + getApiSecret()
  return crypto.createHash('md5').update(sig).digest('hex')
}

async function callApi(params: Record<string, string>) {
  const allParams: Record<string, string> = { ...params, api_key: getApiKey(), format: 'json' }
  allParams.api_sig = signParams(allParams)

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(allParams).toString(),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Last.fm API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function scrobble(params: {
  artist: string
  track: string
  album?: string
  timestamp: number
  sk: string
}) {
  return callApi({
    method: 'track.scrobble',
    artist: params.artist,
    track: params.track,
    ...(params.album ? { album: params.album } : {}),
    timestamp: String(params.timestamp),
    sk: params.sk,
  })
}

export async function updateNowPlaying(params: {
  artist: string
  track: string
  album?: string
  sk: string
}) {
  return callApi({
    method: 'track.updateNowPlaying',
    artist: params.artist,
    track: params.track,
    ...(params.album ? { album: params.album } : {}),
    sk: params.sk,
  })
}

export function getAuthUrl(callbackUrl: string): string {
  return `https://www.last.fm/api/auth/?api_key=${getApiKey()}&cb=${encodeURIComponent(callbackUrl)}`
}

export async function getSession(token: string): Promise<string> {
  const result = await callApi({
    method: 'auth.getSession',
    token,
  })
  return result.session.key
}
