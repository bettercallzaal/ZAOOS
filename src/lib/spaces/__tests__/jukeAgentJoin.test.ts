// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// jukeAgentJoin imports @/lib/env which calls requireEnv() at module load.
// Mock the ENV object before importing to prevent the throw.
vi.mock('@/lib/env', () => ({
  ENV: { JUKE_API_KEY: undefined },
}));

import { isAutoAgentJoinEnabled } from '../jukeAgentJoin';

describe('isAutoAgentJoinEnabled', () => {
  const ORIGINAL = process.env.ZAO_AUTO_AGENT_JOIN;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.ZAO_AUTO_AGENT_JOIN;
    } else {
      process.env.ZAO_AUTO_AGENT_JOIN = ORIGINAL;
    }
  });

  it('returns false when env var is not set', () => {
    delete process.env.ZAO_AUTO_AGENT_JOIN;
    expect(isAutoAgentJoinEnabled()).toBe(false);
  });

  it('returns true when env var is "true"', () => {
    process.env.ZAO_AUTO_AGENT_JOIN = 'true';
    expect(isAutoAgentJoinEnabled()).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.ZAO_AUTO_AGENT_JOIN = 'false';
    expect(isAutoAgentJoinEnabled()).toBe(false);
  });

  it('returns false when env var is "True" (strict comparison)', () => {
    process.env.ZAO_AUTO_AGENT_JOIN = 'True';
    expect(isAutoAgentJoinEnabled()).toBe(false);
  });

  it('returns false for "1" (not "true")', () => {
    process.env.ZAO_AUTO_AGENT_JOIN = '1';
    expect(isAutoAgentJoinEnabled()).toBe(false);
  });
});
