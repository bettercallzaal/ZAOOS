import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  addPending,
  appendKept,
  dueToSend,
  makeSuggestion,
  readGroupSuggestConfig,
  readPending,
  renderCard,
  SUGGEST_DM_MIN_GAP_MS,
  shouldCapture,
  takePending,
} from '../group-suggest';

const CHAT = '-100123';
const SENDER = '456';
const cfg = { chats: new Set([CHAT]), senders: new Set([SENDER]) };
const homes: string[] = [];

async function home(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'zoe-group-suggest-'));
  homes.push(dir);
  return dir;
}

function suggestion(text = 'A useful suggestion for the group'): ReturnType<typeof makeSuggestion> {
  return makeSuggestion({ chatId: CHAT, chatTitle: 'ZAO Group', sender: 'Sam Rivera', text });
}

afterEach(async () => {
  await Promise.all(homes.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('readGroupSuggestConfig', () => {
  it('is off unless flag, chats and senders are present', () => {
    expect(readGroupSuggestConfig({})).toBeNull();
    expect(readGroupSuggestConfig({ ZOE_GROUP_SUGGEST: '1', ZOE_GROUP_SUGGEST_SENDERS: SENDER })).toBeNull();
    expect(readGroupSuggestConfig({ ZOE_GROUP_SUGGEST: '1', ZOE_GROUP_SUGGEST_CHATS: CHAT })).toBeNull();
    expect(readGroupSuggestConfig({
      ZOE_GROUP_SUGGEST: '1', ZOE_GROUP_SUGGEST_CHATS: `${CHAT}, bad`, ZOE_GROUP_SUGGEST_SENDERS: `${SENDER}, nope`,
    })).toEqual({ chats: new Set([CHAT]), senders: new Set([SENDER]) });
  });
});

describe('shouldCapture', () => {
  const input = { chatId: CHAT, fromId: SENDER, isBot: false, text: 'This is a useful suggestion' };
  it('requires listed chat and sender and a valid human text message', () => {
    expect(shouldCapture(cfg, input)).toBe(true);
    expect(shouldCapture(cfg, { ...input, chatId: '-100999' })).toBe(false);
    expect(shouldCapture(cfg, { ...input, fromId: '789' })).toBe(false);
    expect(shouldCapture(cfg, { ...input, isBot: true })).toBe(false);
    expect(shouldCapture(cfg, { ...input, text: '/help something' })).toBe(false);
    expect(shouldCapture(cfg, { ...input, text: 'short' })).toBe(false);
    expect(shouldCapture(null, input)).toBe(false);
  });
});

describe('pending store', () => {
  it('adds, reads, takes once, and appends kept lines', async () => {
    const dir = await home();
    const item = suggestion();
    expect(await addPending(dir, item)).toBe(true);
    expect(await readPending(dir)).toEqual([item]);
    expect(await takePending(dir, item.id)).toEqual(item);
    expect(await takePending(dir, item.id)).toBeNull();
    await appendKept(dir, item);
    expect(await readFile(join(dir, 'group-suggest', 'kept.md'), 'utf8')).toContain(`- ${item.at.slice(0, 10)} Sam Rivera in ZAO Group: ${item.text}`);
  });

  it('keeps only the newest 50 suggestions', async () => {
    const dir = await home();
    const items = Array.from({ length: 51 }, (_, i) => makeSuggestion({
      chatId: CHAT, chatTitle: 'Group', sender: 'Sam', text: `suggestion number ${i}`,
    }));
    for (const item of items) await addPending(dir, item);
    const read = await readPending(dir);
    expect(read).toHaveLength(50);
    expect(read[0]?.text).toBe('suggestion number 1');
  });

  it('treats corrupt JSON as empty', async () => {
    const dir = await home();
    const path = join(dir, 'group-suggest', 'pending.json');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(join(dir, 'group-suggest'), { recursive: true }));
    await import('node:fs/promises').then(({ writeFile }) => writeFile(path, '{broken', 'utf8'));
    expect(await readPending(dir)).toEqual([]);
  });

  it('does not store secret-looking tokens or email addresses', async () => {
    const dir = await home();
    expect(await addPending(dir, suggestion('token sk-ant-' + 'A'.repeat(30)))).toBe(false);
    expect(await addPending(dir, suggestion('write to person@example.com for details'))).toBe(false);
    expect(await readPending(dir)).toEqual([]);
  });
});

describe('rendering and send gap', () => {
  it('renders plain text without handles or markdown markers', () => {
    const card = renderCard(makeSuggestion({ chatId: CHAT, chatTitle: 'ZAO #1', sender: '@sam_handle', text: 'A *bold* useful `idea`' }));
    expect(card).not.toMatch(/@\w|[*`#]/);
    expect(card.split('\n')).toHaveLength(3);
  });

  it('sends initially, then only after the gap', () => {
    expect(dueToSend(null, 100)).toBe(true);
    expect(dueToSend(100, 100 + SUGGEST_DM_MIN_GAP_MS - 1)).toBe(false);
    expect(dueToSend(100, 100 + SUGGEST_DM_MIN_GAP_MS)).toBe(true);
  });
});
