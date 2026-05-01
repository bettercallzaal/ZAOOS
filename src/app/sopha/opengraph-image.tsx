import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sopha x ZAO OS — Curated Farcaster, inside the music DAO';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function SophaOG() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a1628 0%, #0a1628 60%, #1a1f2e 100%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          color: '#e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(184, 150, 111, 0.12)',
              border: '1px solid rgba(184, 150, 111, 0.35)',
              color: '#B8966F',
              fontSize: 22,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Live integration
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
            <span
              style={{
                background: 'linear-gradient(90deg, #f5a623, #ffd700)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Sopha
            </span>
            <span style={{ color: '#6b7280', margin: '0 24px' }}>x</span>
            <span style={{ color: 'white' }}>ZAO OS</span>
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: '#9ca3af', maxWidth: 1000, lineHeight: 1.3 }}>
            Deep Social meets the Music DAO. Sopha curates the long-form, philosophy, and art end of Farcaster — ZAO OS pipes the signal into our gated chat.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22, color: '#6b7280' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#B8966F', fontSize: 20, letterSpacing: 1 }}>sopha.social</span>
            <span style={{ color: '#f5a623', fontSize: 20, letterSpacing: 1 }}>zaoos.com/sopha</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>50 casts / refresh</span>
            <span style={{ color: '#374151' }}>·</span>
            <span>Quality 65-85</span>
            <span style={{ color: '#374151' }}>·</span>
            <span>5min cache</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
