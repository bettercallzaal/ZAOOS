import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';

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
            'radial-gradient(circle at 50% 0%, rgba(245,166,35,0.18), transparent 55%), #0a1628',
          color: '#f5e9d0',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background:
                'linear-gradient(135deg, #f5a623 0%, #ffd700 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 800,
              color: '#0a1628',
              boxShadow: '0 0 60px rgba(245,166,35,0.35)',
            }}
          >
            Z
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
              background:
                'linear-gradient(90deg, #f5a623, #ffd700)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ZAO OS
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Where music artists build onchain
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 22,
            color: '#94a3b8',
            display: 'flex',
            gap: 32,
          }}
        >
          <span>Farcaster</span>
          <span>·</span>
          <span>XMTP</span>
          <span>·</span>
          <span>Base</span>
          <span>·</span>
          <span>Snapshot</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
