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
  autoRegisterGroup,
  getGroupConfig,
  isBotMentioned,
  readGroups,
  removeAllowlistMember,
  setGroupMode,
  shouldRespond,
  groupUntaggedAllowed,
  upsertGroup,
  ENGAGED_MAX_TURNS,
  ENGAGED_WINDOW_MS,
  engagedUntilFor,
  markEngaged,
  resetEngagedForTests,
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
  it("returns allow=true for mode=mention when member_allowlist is empty and bot is @-mentioned", () => {
    const cfg = { ...BASE_CONFIG, member_allowlist: [] };
    const ctx = makeCtx({
      fromId: 999,
      messageText: "hey @zoebot what?",
      entities: [{ type: "mention", offset: 4, length: 7 }],
    });
    expect(shouldRespond(cfg, ctx).allow).toBe(true);
  });

  it("returns allow=true for mode=mention when member_allowlist has wildcard -1 and bot is @-mentioned", () => {
    const cfg = { ...BASE_CONFIG, member_allowlist: [-1] };
    const ctx = makeCtx({
      fromId: 999,
      messageText: "hey @zoebot what?",
      entities: [{ type: "mention", offset: 4, length: 7 }],
    });
    expect(shouldRespond(cfg, ctx).allow).toBe(true);
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


// ── autoRegisterGroup ─────────────────────────────────────────────────────────

describe("autoRegisterGroup", () => {
  it("creates group with mode=mention and wildcard -1 allowlist", async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const cfg = await autoRegisterGroup(555, "Auto Group", 888);
    expect(cfg.chat_id).toBe(555);
    expect(cfg.chat_title).toBe("Auto Group");
    expect(cfg.mode).toBe("mention");
    expect(cfg.member_allowlist).toContain(-1);
    expect(cfg.member_allowlist).toContain(888);
  });
});


// ── engaged window (1 Nov 2026) ───────────────────────────────────────────────
// Shape measured on the VPS journal: a member mentions ZOE once, gets a reply,
// then types two more lines without a mention; both were skipped as
// "mode=mention + no mention/reply". Ids below are made up.

describe('shouldRespond engaged window (only with ZOE_GROUP_UNTAGGED=1)', () => {
  const CHAT = -1000000000001;
  const MEMBER = 424242;
  const OTHER = 515151;
  const mentionCfg = {
    chat_id: CHAT,
    chat_title: 'Test Group',
    mode: 'mention' as const,
    member_allowlist: [-1, 777],
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  };
  const base = {
    fromId: MEMBER,
    botUsername: 'zaoclaw_bot',
    botId: 999,
    messageText: 'a follow-up line with no mention of the bot',
    entities: [],
  };

  afterEach(() => resetEngagedForTests());

  it('allows a follow-up with no mention while the window is open', () => {
    const now = 1_000_000;
    const r = shouldRespond(mentionCfg, { ...base, engagedUntil: now + 60_000, nowMs: now }, true);
    expect(r.allow).toBe(true);
    expect(r.reason).toBe('mode=mention + engaged window');
  });

  it('skips the same follow-up once the window has passed', () => {
    const now = 1_000_000;
    const r = shouldRespond(mentionCfg, { ...base, engagedUntil: now - 1, nowMs: now }, true);
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('mode=mention + no mention/reply');
  });

  it('skips when no window was ever opened (the pre-change behaviour)', () => {
    expect(shouldRespond(mentionCfg, { ...base }).allow).toBe(false);
  });

  it('mode=silent still wins over an open window', () => {
    const now = 1_000_000;
    const r = shouldRespond({ ...mentionCfg, mode: 'silent' }, { ...base, engagedUntil: now + 60_000, nowMs: now });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('group mode=silent');
  });

  it('a restricted allowlist still wins over an open window', () => {
    const now = 1_000_000;
    const r = shouldRespond({ ...mentionCfg, member_allowlist: [777] }, { ...base, engagedUntil: now + 60_000, nowMs: now });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe(`sender ${MEMBER} not in member_allowlist`);
  });

  // Item 135 (2026-11-02): the window is chat-wide. Red on the per-sender
  // key this replaced: OTHER got undefined there.
  it('markEngaged opens a window of ENGAGED_WINDOW_MS for EVERY sender in that chat, and no other chat', () => {
    markEngaged(CHAT, MEMBER, 5_000);
    expect(engagedUntilFor(CHAT, MEMBER)).toBe(5_000 + ENGAGED_WINDOW_MS);
    expect(engagedUntilFor(CHAT, OTHER)).toBe(5_000 + ENGAGED_WINDOW_MS);
    expect(engagedUntilFor(CHAT - 1, MEMBER)).toBeUndefined();
  });

  it('a member with no mention passes the gate once anyone in the chat was answered', () => {
    const now = 10_000;
    markEngaged(CHAT, MEMBER, now);
    const r = shouldRespond(mentionCfg, { ...base, fromId: OTHER, engagedUntil: engagedUntilFor(CHAT, OTHER), nowMs: now + 1_000 }, true);
    expect(r.allow).toBe(true);
    expect(r.reason).toBe('mode=mention + engaged window');
  });

  it('each reply in the chat pushes the window out for everyone', () => {
    markEngaged(CHAT, MEMBER, 0);
    markEngaged(CHAT, OTHER, 60_000);
    expect(engagedUntilFor(CHAT, MEMBER)).toBe(60_000 + ENGAGED_WINDOW_MS);
  });

  it('markEngaged prunes windows that have expired', () => {
    markEngaged(1, 10, 0);
    markEngaged(2, 20, ENGAGED_WINDOW_MS + 1);
    expect(engagedUntilFor(1, 10)).toBeUndefined();
    expect(engagedUntilFor(2, 20)).toBe(2 * ENGAGED_WINDOW_MS + 1);
  });

  it('the cap closes the window for one sender after ENGAGED_MAX_TURNS replies in a row, not for the room', () => {
    let t = 0;
    for (let n = 1; n < ENGAGED_MAX_TURNS; n++) {
      markEngaged(CHAT, MEMBER, (t += 1_000));
      expect(engagedUntilFor(CHAT, MEMBER)).toBe(t + ENGAGED_WINDOW_MS);
    }
    markEngaged(CHAT, MEMBER, (t += 1_000));
    expect(engagedUntilFor(CHAT, MEMBER)).toBeUndefined();
    expect(engagedUntilFor(CHAT, OTHER)).toBe(t + ENGAGED_WINDOW_MS);
  });

  it('a reply after the window lapsed starts the count again', () => {
    for (let n = 0; n < ENGAGED_MAX_TURNS; n++) markEngaged(CHAT, MEMBER, n * 1_000);
    expect(engagedUntilFor(CHAT, MEMBER)).toBeUndefined();
    const later = ENGAGED_MAX_TURNS * 1_000 + ENGAGED_WINDOW_MS + 1;
    markEngaged(CHAT, MEMBER, later);
    expect(engagedUntilFor(CHAT, MEMBER)).toBe(later + ENGAGED_WINDOW_MS);
  });
});

// Ruling 300 (Zaal, 2026-11-07): in a group ZOE replies only when @-mentioned or
// replied to. Red controls: each "refused" case below was allowed before.
describe('shouldRespond: mention or reply only (untagged off, the default)', () => {
  const cfgOf = (mode: 'mention' | 'all') => ({
    chat_id: 1, chat_title: 'g', mode, member_allowlist: [], created_at: '', updated_at: '',
  });
  const plain = {
    fromId: 42, botUsername: 'zaoclaw_bot', botId: 999,
    messageText: 'talking to someone else, not to ZOE', entities: [],
  };

  it('refuses an untagged message in mode=all', () => {
    const r = shouldRespond(cfgOf('all'), plain, false);
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('mode=all + no mention/reply (untagged replies off)');
  });

  it('refuses an untagged message inside an open engaged window', () => {
    const now = 1_000_000;
    const r = shouldRespond(cfgOf('mention'), { ...plain, engagedUntil: now + 60_000, nowMs: now }, false);
    expect(r.allow).toBe(false);
  });

  it.each(['mention', 'all'] as const)('mode=%s still answers an @-mention', (mode) => {
    const text = '@zaoclaw_bot what is on today';
    const r = shouldRespond(cfgOf(mode), { ...plain, messageText: text, entities: [{ type: 'mention', offset: 0, length: 12 }] }, false);
    expect(r.allow).toBe(true);
  });

  it.each(['mention', 'all'] as const)('mode=%s still answers a reply to ZOE', (mode) => {
    expect(shouldRespond(cfgOf(mode), { ...plain, replyToFromId: 999 }, false).allow).toBe(true);
  });

  it('/ask counts as an explicit address', () => {
    expect(shouldRespond(cfgOf('mention'), { ...plain, isCommand: true }, false).allow).toBe(true);
  });

  it('the default comes from ZOE_GROUP_UNTAGGED, off unless exactly 1', () => {
    expect(groupUntaggedAllowed({})).toBe(false);
    expect(groupUntaggedAllowed({ ZOE_GROUP_UNTAGGED: 'true' })).toBe(false);
    expect(groupUntaggedAllowed({ ZOE_GROUP_UNTAGGED: '1' })).toBe(true);
  });
});
