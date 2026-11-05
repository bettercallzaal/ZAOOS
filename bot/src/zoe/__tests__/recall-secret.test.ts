import { describe, it, expect } from 'vitest';
import { containsSecret } from '../recall';

// Every key shape .claude/rules/secret-hygiene.md scans for, in both directions:
// the shape is caught, and a near-miss is not. Fixtures are built at runtime so
// this file never carries a key-shaped literal of its own.
const hex64 = 'a1b2c3d4'.repeat(8);
const rep = (c: string, n: number) => c.repeat(n);

describe('containsSecret: bare 64-hex (raw private key without 0x)', () => {
  it('catches a bare 64-hex string in prose', () => {
    expect(containsSecret(`the deployer key is ${hex64} keep it safe`)).toBe(true);
  });
  it('catches it alone and in upper case', () => {
    expect(containsSecret(hex64)).toBe(true);
    expect(containsSecret(hex64.toUpperCase())).toBe(true);
  });
  it('still catches the 0x form', () => {
    expect(containsSecret(`0x${hex64}`)).toBe(true);
  });
  it('lets a labelled sha256 digest through', () => {
    expect(containsSecret(`image sha256:${hex64}`)).toBe(false);
    expect(containsSecret(`{"digest": "${hex64}"}`)).toBe(false);
    expect(containsSecret(`checksum=${hex64}`)).toBe(false);
    expect(containsSecret(`sha256: ${hex64}`)).toBe(false);
  });
  it('a digest label elsewhere on the line does not exempt an unlabelled key', () => {
    expect(containsSecret(`sha256:${hex64} and also ${'f0e1d2c3'.repeat(8)}`)).toBe(true);
  });
  it('does not fire on 63 or 65 hex characters, or on a 40-hex git sha', () => {
    expect(containsSecret(hex64.slice(1))).toBe(false);
    expect(containsSecret(hex64 + 'a')).toBe(false);
    expect(containsSecret(`commit ${'abcdef12'.repeat(5)}`)).toBe(false);
  });
});

describe('containsSecret: the other secret-hygiene shapes', () => {
  it('BEGIN PRIVATE KEY, plain, RSA and EC', () => {
    expect(containsSecret(`-----BEGIN ${''}PRIVATE KEY-----`)).toBe(true);
    expect(containsSecret(`-----BEGIN RSA ${''}PRIVATE KEY-----`)).toBe(true);
    expect(containsSecret(`-----BEGIN EC ${''}PRIVATE KEY-----`)).toBe(true);
    expect(containsSecret('-----BEGIN PUBLIC KEY-----')).toBe(false);
  });
  it('ghp_ with 36, not 35', () => {
    expect(containsSecret('ghp_' + rep('A', 36))).toBe(true);
    expect(containsSecret('ghp_' + rep('A', 35))).toBe(false);
  });
  it('sk-ant- with 20+, not 19', () => {
    expect(containsSecret('sk-ant-' + rep('b', 20))).toBe(true);
    expect(containsSecret('sk-ant-' + rep('b', 19))).toBe(false);
  });
  it('sk- with 32 (the rule) is caught; a short sk- word is not', () => {
    expect(containsSecret('sk-' + rep('c', 32))).toBe(true);
    expect(containsSecret('sk-learn is a library')).toBe(false);
  });
});
