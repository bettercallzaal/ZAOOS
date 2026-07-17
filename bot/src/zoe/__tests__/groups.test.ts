// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../memory', () => ({
  ZOE_PATHS: { home: '/tmp/zoe-groups-test' },
}));

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile, writeFile: mockWriteFile, mkdir: mockMkdir },
}));

import {
  addAllowlistMember,
  getGroupConfig,
  isBotMentioned,
  readGroups,
  removeAllowlistMember,
  setGroupMode,
  shouldRespond,
  upsertGroup,
  writeGroups,
  type GateContext,
  type GroupConfig,
} from '../groups';

afterEach(() => vi.clearAllMocks());

const BASE_CONFIG: GroupConfig = {
  chat_id: 100,
  chat_title: 'Test Group',
  mode: 'mention',
  member_allowlist: [42],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ── readGroups ────────────────────────────────────────────────────────────────

describe('readGroups', () => {
  it('returns [] when file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await readGroups()).toEqual([]);
  });

  it('returns [] when file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not-json');
    expect(await readGroups()).toEqual([]);
  });

  it('parses and returns the stored group list', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    const groups = await readGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].chat_id).toBe(100);
  });
});

// ── writeGroups ───────────────────────────────────────────────────────────────

describe('writeGroups', () => {
  it('creates the directory and writes serialized JSON', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await writeGroups([BASE_CONFIG]);
    expect(mockMkdir).toHaveBeenCalledWith('/tmp/zoe-groups-test', { recursive: true });
    const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(written[0].chat_id).toBe(100);
  });
});

// ── getGroupConfig ────────────────────────────────────────────────────────────

describe('getGroupConfig', () => {
  it('returns null when the group is not found', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    expect(await getGroupConfig(999)).toBeNull();
  });

  it('returns the matching config by chat_id', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    const cfg = await getGroupConfig(100);
    expect(cfg?.chat_title).toBe('Test Group');
  });
});

// ── upsertGroup ───────────────────────────────────────────────────────────────

describe('upsertGroup', () => {
  it('creates a new group with defaults when not present', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await upsertGroup({ chat_id: 200, chat_title: 'New Group' });
    expect(cfg.mode).toBe('silent');
    expect(cfg.member_allowlist).toEqual([]);
    expect(cfg.chat_title).toBe('New Group');
  });

  it('updates specified fields on an existing group without touching others', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await upsertGroup({ chat_id: 100, mode: 'all' });
    expect(cfg.mode).toBe('all');
    expect(cfg.chat_title).toBe('Test Group'); // unchanged
  });

  it('writes the updated list back to disk', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await upsertGroup({ chat_id: 300 });
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });
});

// ── addAllowlistMember ────────────────────────────────────────────────────────

describe('addAllowlistMember', () => {
  it('appends the user to the member_allowlist', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await addAllowlistMember(100, 99);
    expect(cfg.member_allowlist).toContain(99);
  });

  it('does not write when the member is already in the list', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG])); // 42 already present
    await addAllowlistMember(100, 42);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('throws when the group is not configured', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([]));
    await expect(addAllowlistMember(999, 1)).rejects.toThrow('not configured');
  });
});

// ── removeAllowlistMember ─────────────────────────────────────────────────────

describe('removeAllowlistMember', () => {
  it('removes the member and writes the updated list', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await removeAllowlistMember(100, 42);
    expect(cfg.member_allowlist).not.toContain(42);
  });

  it('throws when the group is not configured', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([]));
    await expect(removeAllowlistMember(999, 1)).rejects.toThrow();
  });
});

// ── setGroupMode ──────────────────────────────────────────────────────────────

describe('setGroupMode', () => {
  it('updates mode and writes', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([BASE_CONFIG]));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await setGroupMode(100, 'all');
    expect(cfg.mode).toBe('all');
  });

  it('throws when the group is not configured', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([]));
    await expect(setGroupMode(999, 'all')).rejects.toThrow();
  });
});

// ── shouldRespond ─────────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<GateContext>): GateContext {
  return {
    fromId: 42,
    botUsername: 'zoebot',
    botId: 7,
    messageText: 'hey @zoebot',
    entities: [{ type: 'mention', offset: 4, length: 8 }],
    ...overrides,
  };
}

describe('shouldRespond', () => {
  it('returns allow=false when config is null (group not configured)', () => {
    expect(shouldRespond(null, makeCtx())).toEqual({
      allow: false,
      reason: expect.stringContaining('not configured'),
    });
  });

  it('returns allow=false when mode=silent regardless of sender', () => {
    const cfg = { ...BASE_CONFIG, mode: 'silent' as const };
    expect(shouldRespond(cfg, makeCtx()).allow).toBe(false);
  });

  it('returns allow=false when sender is not in the allowlist', () => {
    const cfg = { ...BASE_CONFIG, mode: 'all' as const };
    expect(shouldRespond(cfg, makeCtx({ fromId: 999 })).allow).toBe(false);
  });

  it('returns allow=true when mode=all and sender is allowlisted', () => {
    const cfg = { ...BASE_CONFIG, mode: 'all' as const };
    expect(shouldRespond(cfg, makeCtx({ fromId: 42 })).allow).toBe(true);
  });

  it('returns allow=true for mode=mention when bot is @-mentioned', () => {
    const ctx = makeCtx({
      fromId: 42,
      messageText: 'hey @zoebot what?',
      entities: [{ type: 'mention', offset: 4, length: 7 }],
    });
    expect(shouldRespond(BASE_CONFIG, ctx).allow).toBe(true);
  });

  it('returns allow=true for mode=mention when message is a reply to the bot', () => {
    const ctx = makeCtx({ fromId: 42, messageText: 'yes', entities: [], replyToFromId: 7 });
    expect(shouldRespond(BASE_CONFIG, ctx).allow).toBe(true);
  });

  it('returns allow=false for mode=mention with no mention and no bot reply', () => {
    const ctx = makeCtx({ fromId: 42, messageText: 'random chat', entities: [] });
    expect(shouldRespond(BASE_CONFIG, ctx).allow).toBe(false);
  });
});

// ── isBotMentioned ────────────────────────────────────────────────────────────

describe('isBotMentioned', () => {
  it('returns false when botUsername is null', () => {
    expect(isBotMentioned(makeCtx({ botUsername: null }))).toBe(false);
  });

  it('returns true when a mention entity matches the bot handle', () => {
    const ctx = makeCtx({
      messageText: 'hey @zoebot',
      entities: [{ type: 'mention', offset: 4, length: 8 }],
    });
    expect(isBotMentioned(ctx)).toBe(true);
  });

  it('returns false when the mention entity does not match the bot handle', () => {
    const ctx = makeCtx({
      messageText: 'hey @otherbot',
      entities: [{ type: 'mention', offset: 4, length: 9 }],
    });
    expect(isBotMentioned(ctx)).toBe(false);
  });
});
