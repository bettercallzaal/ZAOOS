'use client';

interface Props {
  accent: string;
  scale: number;
}

/** Pulsing LIVE pill. Pauses animation under prefers-reduced-motion (see brand KEYFRAMES). */
export function LiveBadge({ accent, scale }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6 * scale,
        padding: `${4 * scale}px ${10 * scale}px`,
        borderRadius: 999,
        background: accent,
        color: '#0a1628',
        fontWeight: 800,
        fontSize: 12 * scale,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      <span
        className="zg-animated"
        style={{
          width: 8 * scale,
          height: 8 * scale,
          borderRadius: 999,
          background: '#0a1628',
          animation: 'zg-pulse 1.4s ease-in-out infinite',
        }}
      />
      Live
    </span>
  );
}
