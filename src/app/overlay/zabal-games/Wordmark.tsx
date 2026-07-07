'use client';

import type { Tokens } from './brand';

interface Props {
  logo: string;
  title: string;
  tokens: Tokens;
}

/** Logo image if a ?logo= URL was given, else a styled text wordmark. */
export function Wordmark({ logo, title, tokens }: Props) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={title}
        style={{ height: 40 * tokens.scale, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      style={{
        color: tokens.accent,
        fontWeight: 800,
        fontSize: 18 * tokens.scale,
        letterSpacing: 2,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {title}
    </span>
  );
}
