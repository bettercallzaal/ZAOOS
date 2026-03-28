import { z } from 'zod';

const querySchema = z.object({
  track: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  artwork: z.string().url().optional(),
  filter: z.string().max(50).optional(),
});

/** Escape XML special characters for safe SVG embedding */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Truncate text to fit within a max character count */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      track: searchParams.get('track'),
      artist: searchParams.get('artist'),
      artwork: searchParams.get('artwork'),
      filter: searchParams.get('filter'),
    });

    if (!parsed.success) {
      return new Response('Bad request: ' + parsed.error.issues.map(i => i.message).join(', '), {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { track, artist, artwork, filter } = parsed.data;
    const safeTrack = escapeXml(truncate(track, 40));
    const safeArtist = escapeXml(truncate(artist, 45));
    const safeFilter = filter ? escapeXml(truncate(filter, 25)) : null;

    // Card dimensions: 1200x630 (OG image standard)
    const W = 1200;
    const H = 630;
    const artSize = 340;
    const artX = 80;
    const artY = (H - artSize) / 2;
    const textX = artX + artSize + 60;

    const filterBadge = safeFilter
      ? `<rect x="${textX}" y="340" width="${safeFilter.length * 14 + 40}" height="36" rx="18" fill="#f5a623" opacity="0.15"/>
         <text x="${textX + 20}" y="364" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#f5a623">${safeFilter}</text>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#0d1b2a"/>
    </linearGradient>
    <linearGradient id="goldShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f5a623"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#f5a623"/>
    </linearGradient>
    ${artwork ? `<clipPath id="artClip"><rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="24"/></clipPath>` : ''}
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Subtle border glow -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="0" fill="none" stroke="#f5a623" stroke-opacity="0.08" stroke-width="2"/>

  <!-- Artwork -->
  ${artwork
    ? `<image href="${escapeXml(artwork)}" x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" clip-path="url(#artClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="24" fill="#1a2a3a"/>
       <text x="${artX + artSize / 2}" y="${artY + artSize / 2 + 20}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="64" fill="#f5a623" opacity="0.4">&#9835;</text>`
  }

  <!-- Artwork shadow overlay (bottom) -->
  ${artwork ? `<rect x="${artX}" y="${artY + artSize - 60}" width="${artSize}" height="60" rx="0" fill="url(#bg)" opacity="0.3" clip-path="url(#artClip)"/>` : ''}

  <!-- Now Playing label -->
  <text x="${textX}" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#f5a623" letter-spacing="2" text-transform="uppercase" opacity="0.8">NOW PLAYING</text>

  <!-- Track name -->
  <text x="${textX}" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${safeTrack}</text>

  <!-- Artist name -->
  <text x="${textX}" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="400" fill="#9ca3af">${safeArtist}</text>

  <!-- Filter badge -->
  ${filterBadge}

  <!-- Playback bars (decorative) -->
  <g transform="translate(${textX}, 400)" opacity="0.5">
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const barH = 12 + ((i * 7 + 3) % 20);
      return `<rect x="${i * 10}" y="${30 - barH}" width="5" height="${barH}" rx="2.5" fill="#f5a623"/>`;
    }).join('\n    ')}
  </g>

  <!-- Footer -->
  <line x1="80" y1="${H - 80}" x2="${W - 80}" y2="${H - 80}" stroke="#f5a623" stroke-opacity="0.12" stroke-width="1"/>
  <text x="80" y="${H - 42}" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="url(#goldShine)">THE ZAO</text>
  <text x="220" y="${H - 42}" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#6b7280">Listening on the decentralized music network</text>
</svg>`;

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[share-card] Error generating card:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
