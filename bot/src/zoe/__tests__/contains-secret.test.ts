import { describe, expect, it } from 'vitest';
import { containsSecret } from '../recall';

// Card 10546. Values are built at run time so no secret-shaped literal sits in
// the repo.
const hex = (n: number, ch = 'a') => ch.repeat(n);

describe('containsSecret - a 64-hex private key', () => {
  it('flags it with the 0x prefix, as before', () => {
    expect(containsSecret(`key 0x${hex(64)} here`)).toBe(true);
  });

  it('flags it without the 0x prefix', () => {
    expect(containsSecret(`key ${hex(64, 'f')} here`)).toBe(true);
    expect(containsSecret(hex(64, '9'))).toBe(true);
  });

  it('leaves a 40-character git SHA alone', () => {
    expect(containsSecret(`merged as ${hex(40, 'c')} on main`)).toBe(false);
  });

  it('leaves a longer hex run alone, and a 64-hex run glued to letters', () => {
    expect(containsSecret(hex(65, 'b'))).toBe(false);
    expect(containsSecret(`id${hex(64, 'd')}x`)).toBe(false);
  });
});
