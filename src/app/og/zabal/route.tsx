import { ImageResponse } from 'next/og';

// OG / Mini App embed image for the ZABAL hub. Referenced by the
// per-route fc:miniapp embed in src/app/zabal/page.tsx (Research Doc 707/708).

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 800 };

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 50% 10%, rgba(224,221,170,0.18), transparent 55%), linear-gradient(135deg, #0a0a0a 0%, #141e27 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            letterSpacing: 12,
            background: 'linear-gradient(135deg, #ffffff 0%, #e0ddaa 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          ZABAL
        </div>
        <div style={{ fontSize: 40, color: '#e0ddaa', marginTop: 16, fontWeight: 700 }}>
          Vote weekly on ZAO direction
        </div>
        <div style={{ fontSize: 28, color: '#a0a0a0', marginTop: 24, display: 'flex', gap: 28 }}>
          <span>Music</span>
          <span>Governance</span>
          <span>Events</span>
          <span>Build</span>
        </div>
      </div>
    ),
    size,
  );
}
