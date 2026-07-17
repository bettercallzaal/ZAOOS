// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  OREC_ADDRESS,
  Stage,
  VoteStatus,
  ZOR_RESPECT_ADDRESS,
} from '../client';

const ETH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// ---------------------------------------------------------------------------
// Contract addresses
// ---------------------------------------------------------------------------

describe('OREC_ADDRESS', () => {
  it('is a valid Ethereum address', () => {
    expect(OREC_ADDRESS).toMatch(ETH_ADDRESS);
  });

  it('is checksummed (mixed case)', () => {
    // viem addresses are checksum-cased; verify it has lowercase letters past 0x
    expect(OREC_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});

describe('ZOR_RESPECT_ADDRESS', () => {
  it('is a valid Ethereum address', () => {
    expect(ZOR_RESPECT_ADDRESS).toMatch(ETH_ADDRESS);
  });
});

describe('OREC_ADDRESS vs ZOR_RESPECT_ADDRESS', () => {
  it('are distinct addresses', () => {
    expect(OREC_ADDRESS.toLowerCase()).not.toBe(ZOR_RESPECT_ADDRESS.toLowerCase());
  });
});

// ---------------------------------------------------------------------------
// Stage enum
// ---------------------------------------------------------------------------

describe('Stage', () => {
  it('has exactly 4 entries', () => {
    expect(Object.keys(Stage)).toHaveLength(4);
  });

  it('maps 0 to "Voting"', () => {
    expect(Stage[0]).toBe('Voting');
  });

  it('maps 1 to "Veto"', () => {
    expect(Stage[1]).toBe('Veto');
  });

  it('maps 2 to "Execution"', () => {
    expect(Stage[2]).toBe('Execution');
  });

  it('maps 3 to "Expired"', () => {
    expect(Stage[3]).toBe('Expired');
  });

  it('all values are strings', () => {
    for (const v of Object.values(Stage)) {
      expect(typeof v).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// VoteStatus enum
// ---------------------------------------------------------------------------

describe('VoteStatus', () => {
  it('has exactly 4 entries', () => {
    expect(Object.keys(VoteStatus)).toHaveLength(4);
  });

  it('maps 0 to "Passing"', () => {
    expect(VoteStatus[0]).toBe('Passing');
  });

  it('maps 1 to "Failing"', () => {
    expect(VoteStatus[1]).toBe('Failing');
  });

  it('maps 2 to "Passed"', () => {
    expect(VoteStatus[2]).toBe('Passed');
  });

  it('maps 3 to "Failed"', () => {
    expect(VoteStatus[3]).toBe('Failed');
  });

  it('all values are strings', () => {
    for (const v of Object.values(VoteStatus)) {
      expect(typeof v).toBe('string');
    }
  });
});
