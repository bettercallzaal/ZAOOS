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

const ETH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// ---------------------------------------------------------------------------
// Contract addresses
// ---------------------------------------------------------------------------

describe('ZOUNZ contract addresses', () => {
  it('ZOUNZ_TOKEN is a valid Ethereum address', () => {
    expect(ZOUNZ_TOKEN).toMatch(ETH_ADDRESS);
  });

  it('ZOUNZ_AUCTION is a valid Ethereum address', () => {
    expect(ZOUNZ_AUCTION).toMatch(ETH_ADDRESS);
  });

  it('ZOUNZ_GOVERNOR is a valid Ethereum address', () => {
    expect(ZOUNZ_GOVERNOR).toMatch(ETH_ADDRESS);
  });

  it('ZOUNZ_TREASURY is a valid Ethereum address', () => {
    expect(ZOUNZ_TREASURY).toMatch(ETH_ADDRESS);
  });

  it('all four addresses are distinct', () => {
    const addrs = [ZOUNZ_TOKEN, ZOUNZ_AUCTION, ZOUNZ_GOVERNOR, ZOUNZ_TREASURY].map((a) =>
      a.toLowerCase(),
    );
    expect(new Set(addrs).size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// ABIs (parseAbi results)
// ---------------------------------------------------------------------------

describe('auctionAbi', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(auctionAbi)).toBe(true);
    expect(auctionAbi.length).toBeGreaterThan(0);
  });

  it('includes the auction() read function', () => {
    const names = auctionAbi.map((f) => (f as { name?: string }).name);
    expect(names).toContain('auction');
  });

  it('includes createBid (payable)', () => {
    const entry = auctionAbi.find((f) => (f as { name?: string }).name === 'createBid') as
      | { stateMutability?: string }
      | undefined;
    expect(entry).toBeDefined();
    expect(entry?.stateMutability).toBe('payable');
  });

  it('includes minBidIncrement, reservePrice, duration, paused', () => {
    const names = auctionAbi.map((f) => (f as { name?: string }).name);
    expect(names).toContain('minBidIncrement');
    expect(names).toContain('reservePrice');
    expect(names).toContain('duration');
    expect(names).toContain('paused');
  });
});

describe('governorAbi', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(governorAbi)).toBe(true);
    expect(governorAbi.length).toBeGreaterThan(0);
  });

  it('includes proposalCount, state, getVotes, castVote, propose', () => {
    const names = governorAbi.map((f) => (f as { name?: string }).name);
    expect(names).toContain('proposalCount');
    expect(names).toContain('state');
    expect(names).toContain('getVotes');
    expect(names).toContain('castVote');
    expect(names).toContain('propose');
  });
});

describe('tokenAbi', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(tokenAbi)).toBe(true);
    expect(tokenAbi.length).toBeGreaterThan(0);
  });

  it('includes auction, tokenURI, totalSupply, ownerOf, name', () => {
    const names = tokenAbi.map((f) => (f as { name?: string }).name);
    expect(names).toContain('auction');
    expect(names).toContain('tokenURI');
    expect(names).toContain('totalSupply');
    expect(names).toContain('ownerOf');
    expect(names).toContain('name');
  });
});
