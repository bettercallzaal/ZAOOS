// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock @discordjs/rest BEFORE any module is loaded.
const mockGet = vi.hoisted(() => vi.fn());

vi.mock('@discordjs/rest', () => ({
  REST: vi.fn().mockImplementation(() => ({
    setToken: vi.fn().mockReturnThis(),
    get: mockGet,
  })),
}));

// ── No-credentials path ──────────────────────────────────────────────────────
// Import the module WITHOUT bot token set — module-level constants capture the
// env at load time, so we get the "unconfigured" behaviour.

import {
  getActiveThreads,
  getChannelMessages,
  getGuildMembers,
  isDiscordConfigured,
} from '../client';

afterEach(() => {
  mockGet.mockReset();
});

describe('isDiscordConfigured (no credentials)', () => {
  it('returns false when DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are not set', () => {
    // Default test environment has no Discord env vars
    expect(isDiscordConfigured()).toBe(false);
  });
});

describe('getChannelMessages (no credentials)', () => {
  it('returns an empty array when no bot token is configured', async () => {
    const result = await getChannelMessages('channel-123');
    expect(result).toEqual([]);
  });
});

describe('getGuildMembers (no credentials)', () => {
  it('returns an empty array when no bot token is configured', async () => {
    const result = await getGuildMembers();
    expect(result).toEqual([]);
  });
});

describe('getActiveThreads (no credentials)', () => {
  it('returns an empty array when no bot token is configured', async () => {
    const result = await getActiveThreads();
    expect(result).toEqual([]);
  });
});

describe('getChannelMessages error handling (via mocked REST)', () => {
  // Even without real env vars the REST mock is set up; test the error fallback
  // by patching the mock to simulate a token being present via beforeAll.
  // Since DISCORD_BOT_TOKEN is a module-level const we cannot flip it per-test
  // after import. Instead we test the REST throw path through the no-client
  // short-circuit: if get() throws and the function catches, it returns [].
  // These cases verify that the mock REST throw is NOT reached when client is
  // null (no token) — the empty-array short-circuit comes first.

  it('does not call REST.get when client is null', async () => {
    await getChannelMessages('any-channel');
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('does not call REST.get when getGuildMembers has no client', async () => {
    await getGuildMembers();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
