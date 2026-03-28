import { z } from 'zod';

const querySchema = z.object({
  track: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  artwork: z.string().url().optional(),
  url: z.string().url().optional(),
  filter: z.string().max(50).optional(),
});

/** Escape HTML special characters */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      track: searchParams.get('track'),
      artist: searchParams.get('artist'),
      artwork: searchParams.get('artwork'),
      url: searchParams.get('url'),
      filter: searchParams.get('filter'),
    });

    if (!parsed.success) {
      return new Response('Bad request: ' + parsed.error.issues.map(i => i.message).join(', '), {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { track, artist, artwork, url, filter } = parsed.data;

    // Build the share card image URL (points to the share-card endpoint)
    const origin = new URL(request.url).origin;
    const imageParams = new URLSearchParams({ track, artist });
    if (artwork) imageParams.set('artwork', artwork);
    if (filter) imageParams.set('filter', filter);
    const imageUrl = `${origin}/api/music/share-card?${imageParams.toString()}`;

    // App URL — where "Listen on ZAO" sends users
    const appUrl = url || `${origin}/music`;

    const safeTrack = escapeHtml(track);
    const safeArtist = escapeHtml(artist);
    const title = `${safeTrack} by ${safeArtist} | THE ZAO`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(track)} by ${escapeHtml(artist)}"/>
  <meta property="og:description" content="Listening on THE ZAO - decentralized music network"/>
  <meta property="og:image" content="${escapeHtml(imageUrl)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:type" content="music.song"/>

  <!-- Farcaster Frame v2 -->
  <meta property="fc:frame" content="vNext"/>
  <meta property="fc:frame:image" content="${escapeHtml(imageUrl)}"/>
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1"/>
  <meta property="fc:frame:button:1" content="Listen on ZAO"/>
  <meta property="fc:frame:button:1:action" content="link"/>
  <meta property="fc:frame:button:1:target" content="${escapeHtml(appUrl)}"/>
  <meta property="fc:frame:button:2" content="View Artist"/>
  <meta property="fc:frame:button:2:action" content="link"/>
  <meta property="fc:frame:button:2:target" content="${escapeHtml(appUrl)}"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(track)} by ${escapeHtml(artist)}"/>
  <meta name="twitter:description" content="Listening on THE ZAO"/>
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}"/>
</head>
<body style="margin:0;background:#0a1628;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:2rem;">
    <img src="${escapeHtml(imageUrl)}" alt="Now Playing" style="max-width:600px;width:100%;border-radius:12px;"/>
    <h1 style="color:#f5a623;margin-top:1.5rem;font-size:1.5rem;">${safeTrack}</h1>
    <p style="color:#9ca3af;font-size:1.1rem;">${safeArtist}</p>
    <a href="${escapeHtml(appUrl)}" style="display:inline-block;margin-top:1.5rem;padding:0.75rem 2rem;background:#f5a623;color:#0a1628;border-radius:9999px;text-decoration:none;font-weight:600;">Listen on THE ZAO</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('[frame] Error generating frame:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
