// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  EMPIRE_BUILDER_BASE_URL,
  EMPIRE_BUILDER_CACHE_TTL_MS,
  EMPIRE_BUILDER_FETCH_TIMEOUT_MS,
  ZABAL_EMPIRE_ADDRESS,
  ZABAL_TOKEN_ADDRESS,
} from '../config';
import { TOKENS } from '../../agents/types';

const ETH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

describe('ZABAL_TOKEN_ADDRESS', () => {
  it('matches agents/types TOKENS.ZABAL (consistency)', () => {
    expect(ZABAL_TOKEN_ADDRESS).toBe(TOKENS.ZABAL);
  });

  it('is a valid Ethereum address', () => {
    expect(ZABAL_TOKEN_ADDRESS).toMatch(ETH_ADDRESS);
  });
});

describe('ZABAL_EMPIRE_ADDRESS', () => {
  it('is a valid Ethereum address', () => {
    expect(ZABAL_EMPIRE_ADDRESS).toMatch(ETH_ADDRESS);
  });

  it('is distinct from ZABAL_TOKEN_ADDRESS', () => {
    expect(ZABAL_EMPIRE_ADDRESS.toLowerCase()).not.toBe(ZABAL_TOKEN_ADDRESS.toLowerCase());
  });
});

describe('EMPIRE_BUILDER_BASE_URL', () => {
  it('is the Empire Builder API base URL', () => {
    expect(EMPIRE_BUILDER_BASE_URL).toBe('https://empirebuilder.world/api');
  });

  it('starts with https://', () => {
    expect(EMPIRE_BUILDER_BASE_URL).toMatch(/^https:\/\//);
  });

  it('does not end with a trailing slash', () => {
    expect(EMPIRE_BUILDER_BASE_URL).not.toMatch(/\/$/);
  });
});

describe('EMPIRE_BUILDER_CACHE_TTL_MS', () => {
  it('is 60 seconds (60_000 ms)', () => {
    expect(EMPIRE_BUILDER_CACHE_TTL_MS).toBe(60_000);
  });

  it('is a positive integer', () => {
    expect(Number.isInteger(EMPIRE_BUILDER_CACHE_TTL_MS)).toBe(true);
    expect(EMPIRE_BUILDER_CACHE_TTL_MS).toBeGreaterThan(0);
  });
});

describe('EMPIRE_BUILDER_FETCH_TIMEOUT_MS', () => {
  it('is 8000 ms', () => {
    expect(EMPIRE_BUILDER_FETCH_TIMEOUT_MS).toBe(8000);
  });

  it('is less than the cache TTL (timeout shorter than cache)', () => {
    expect(EMPIRE_BUILDER_FETCH_TIMEOUT_MS).toBeLessThan(EMPIRE_BUILDER_CACHE_TTL_MS);
  });
});
