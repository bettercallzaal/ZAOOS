import { describe, expect, it } from 'vitest';
import { buildSignInMessage, formatRespect, TCG_DROP } from '../drop';

const WALLET = '0x00000000000000000000000000000000000000aA';
const AT = new Date('2026-10-20T19:00:00Z');

describe('buildSignInMessage', () => {
  it('names the wallet, nonce and time, and says no transaction is sent', () => {
    const message = buildSignInMessage(WALLET, 'abc12345', AT);
    expect(message).toContain(`Wallet: ${WALLET}`);
    expect(message).toContain('Nonce: abc12345');
    expect(message).toContain('Issued at: 2026-10-20T19:00:00.000Z');
    expect(message).toContain('sends no transaction');
  });

  it.each([
    ['a short address', '0x1234', 'abc12345'],
    ['a non-hex address', `0x${'g'.repeat(40)}`, 'abc12345'],
    ['a short nonce', WALLET, 'abc'],
    ['a nonce with symbols', WALLET, 'abc-1234'],
  ])('refuses %s', (_label, address, nonce) => {
    expect(() => buildSignInMessage(address, nonce, AT)).toThrow();
  });
});

describe('formatRespect', () => {
  it.each([
    [0, '0'],
    [1250, '1,250'],
    [12.3456, '12.35'],
  ])('%s shows as %s', (value, shown) => {
    expect(formatRespect(value)).toBe(shown);
  });
});

describe('TCG_DROP', () => {
  it('credits the card artist and links the song on WaveZ Station', () => {
    expect(TCG_DROP.cardArtist).toEqual({ name: 'Cannon Jones', handle: '@cannonjones973' });
    expect(TCG_DROP.song.url).toMatch(/^https:\/\/www\.wavezstation\.com\/song\/[0-9a-f-]{36}$/);
  });
});
