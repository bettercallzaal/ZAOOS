// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({})),
  createWalletClient: vi.fn(() => ({})),
  fallback: vi.fn((arr: unknown[]) => arr[0]),
  http: vi.fn(),
  namehash: vi.fn(() => '0xdeadbeef'),
}));
vi.mock('viem/accounts', () => ({ privateKeyToAccount: vi.fn() }));
vi.mock('viem/chains', () => ({ mainnet: {} }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

import { FUSES } from '../subnames';

describe('FUSES constants', () => {
  it('CANNOT_UNWRAP equals 1', () => {
    expect(FUSES.CANNOT_UNWRAP).toBe(1);
  });

  it('CANNOT_BURN_FUSES equals 2', () => {
    expect(FUSES.CANNOT_BURN_FUSES).toBe(2);
  });

  it('CANNOT_TRANSFER equals 4', () => {
    expect(FUSES.CANNOT_TRANSFER).toBe(4);
  });

  it('CANNOT_SET_RESOLVER equals 8', () => {
    expect(FUSES.CANNOT_SET_RESOLVER).toBe(8);
  });

  it('CANNOT_SET_TTL equals 16', () => {
    expect(FUSES.CANNOT_SET_TTL).toBe(16);
  });

  it('CANNOT_CREATE_SUBDOMAIN equals 32', () => {
    expect(FUSES.CANNOT_CREATE_SUBDOMAIN).toBe(32);
  });

  it('CANNOT_APPROVE equals 64', () => {
    expect(FUSES.CANNOT_APPROVE).toBe(64);
  });

  it('PARENT_CANNOT_CONTROL equals 65536 (1 << 16)', () => {
    expect(FUSES.PARENT_CANNOT_CONTROL).toBe(65536);
  });

  it('CAN_EXTEND_EXPIRY equals 262144 (1 << 18)', () => {
    expect(FUSES.CAN_EXTEND_EXPIRY).toBe(262144);
  });
});

describe('FUSES bitflag composition', () => {
  it('CANNOT_UNWRAP | CANNOT_TRANSFER equals 5', () => {
    expect(FUSES.CANNOT_UNWRAP | FUSES.CANNOT_TRANSFER).toBe(5);
  });

  it('PARENT_CANNOT_CONTROL | CAN_EXTEND_EXPIRY equals 327680', () => {
    expect(FUSES.PARENT_CANNOT_CONTROL | FUSES.CAN_EXTEND_EXPIRY).toBe(327680);
  });

  it('all child restriction flags compose without collision', () => {
    const combined =
      FUSES.CANNOT_UNWRAP |
      FUSES.CANNOT_BURN_FUSES |
      FUSES.CANNOT_TRANSFER |
      FUSES.CANNOT_SET_RESOLVER |
      FUSES.CANNOT_SET_TTL |
      FUSES.CANNOT_CREATE_SUBDOMAIN |
      FUSES.CANNOT_APPROVE;
    // Each flag is a distinct bit — combined should equal the arithmetic sum
    expect(combined).toBe(
      FUSES.CANNOT_UNWRAP +
        FUSES.CANNOT_BURN_FUSES +
        FUSES.CANNOT_TRANSFER +
        FUSES.CANNOT_SET_RESOLVER +
        FUSES.CANNOT_SET_TTL +
        FUSES.CANNOT_CREATE_SUBDOMAIN +
        FUSES.CANNOT_APPROVE,
    );
  });
});
