// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  ZOUNZ_AUCTION,
  ZOUNZ_GOVERNOR,
  ZOUNZ_TOKEN,
  ZOUNZ_TREASURY,
  auctionAbi,
  governorAbi,
  tokenAbi,
} from '../contracts';

// ---------------------------------------------------------------------------
// Address constants — 0x-prefixed 42-char hex strings
// ---------------------------------------------------------------------------

describe('ZOUNZ contract addresses', () => {
  const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

  it('ZOUNZ_TOKEN is a valid EVM address', () => {
    expect(ZOUNZ_TOKEN).toMatch(EVM_ADDRESS);
  });

  it('ZOUNZ_AUCTION is a valid EVM address', () => {
    expect(ZOUNZ_AUCTION).toMatch(EVM_ADDRESS);
  });

  it('ZOUNZ_GOVERNOR is a valid EVM address', () => {
    expect(ZOUNZ_GOVERNOR).toMatch(EVM_ADDRESS);
  });

  it('ZOUNZ_TREASURY is a valid EVM address', () => {
    expect(ZOUNZ_TREASURY).toMatch(EVM_ADDRESS);
  });
});

// ---------------------------------------------------------------------------
// Parsed ABIs — non-empty arrays from viem's parseAbi
// ---------------------------------------------------------------------------

describe('auctionAbi', () => {
  it('is a non-empty ABI array', () => {
    expect(Array.isArray(auctionAbi)).toBe(true);
    expect(auctionAbi.length).toBeGreaterThanOrEqual(6);
  });

  it('contains the auction() view function', () => {
    const fn = auctionAbi.find((e) => e.type === 'function' && e.name === 'auction');
    expect(fn).toBeDefined();
  });

  it('contains createBid as a payable function', () => {
    const fn = auctionAbi.find((e) => e.type === 'function' && e.name === 'createBid');
    expect(fn).toBeDefined();
    if (fn && fn.type === 'function') expect(fn.stateMutability).toBe('payable');
  });
});

describe('governorAbi', () => {
  it('is a non-empty ABI array', () => {
    expect(Array.isArray(governorAbi)).toBe(true);
    expect(governorAbi.length).toBeGreaterThanOrEqual(8);
  });

  it('contains the proposalCount() function', () => {
    const fn = governorAbi.find((e) => e.type === 'function' && e.name === 'proposalCount');
    expect(fn).toBeDefined();
  });
});

describe('tokenAbi', () => {
  it('is a non-empty ABI array', () => {
    expect(Array.isArray(tokenAbi)).toBe(true);
    expect(tokenAbi.length).toBeGreaterThanOrEqual(6);
  });

  it('contains the ownerOf() function', () => {
    const fn = tokenAbi.find((e) => e.type === 'function' && e.name === 'ownerOf');
    expect(fn).toBeDefined();
  });
});
