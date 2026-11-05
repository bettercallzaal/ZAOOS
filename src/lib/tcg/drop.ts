// The first ZAO TCG Card drop: a perk for buyers of the BCZ Song on WaveZ Station.
// Song id read from the WaveZ Station discover API (/api/discover) on 2026-10-20;
// the /song/<id> route is WaveZ Station's own ("/song/".concat(e.id) in its app bundle).
// Card art is made by the artist, never generated (no AI-made visuals in ZAO public design).

export const TCG_DROP = {
  cardName: 'ZAO TCG Card',
  song: {
    title: 'BetterCallZaal',
    artist: 'IMan Afrikah',
    url: 'https://www.wavezstation.com/song/77c01f1f-c612-4f42-aa2f-de245fa7ebe5',
  },
  cardArtist: {
    name: 'Cannon Jones',
    handle: '@cannonjones973',
  },
  perks: [
    'The first ZAO TCG Card, made by Cannon Jones (@cannonjones973)',
    'Access to the ZAO TCG Telegram group',
    'Email updates as the ZAO TCG gets built',
  ],
} as const;

/**
 * The message a visitor signs to prove the connected wallet is theirs. Signing is
 * free and sends no transaction; the page verifies it locally and keeps no session.
 */
export function buildSignInMessage(address: string, nonce: string, issuedAt: Date): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('not a wallet address');
  if (!/^[A-Za-z0-9]{8,}$/.test(nonce)) throw new Error('nonce must be 8+ letters or digits');
  return [
    'Sign in to the ZAO TCG page.',
    '',
    'This proves you hold this wallet. It is free and sends no transaction.',
    '',
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    `Issued at: ${issuedAt.toISOString()}`,
  ].join('\n');
}

/** Respect as shown on the page: whole ZOR, OG to at most two decimals. */
export function formatRespect(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
