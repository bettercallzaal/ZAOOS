'use client';

interface Props {
  accent: string;
  scale: number;
}

/** Steady on-air pill - a lit dot, no blink. A stream is always live, so this reads as ambient, not a toggled status. */
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
        style={{
          width: 8 * scale,
          height: 8 * scale,
          borderRadius: 999,
          background: '#0a1628',
        }}
      />
      Live
    </span>
  );
}
