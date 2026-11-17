import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  addPending,
  appendKept,
  dueToSend,
  keepPending,
  markPendingNotified,
  makeSuggestion,
  readGroupSuggestConfig,
  readPending,
  readUnnotifiedPending,
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
    expect(
      readGroupSuggestConfig({ ZOE_GROUP_SUGGEST: '1', ZOE_GROUP_SUGGEST_SENDERS: SENDER }),
    ).toBeNull();
    expect(
      readGroupSuggestConfig({ ZOE_GROUP_SUGGEST: '1', ZOE_GROUP_SUGGEST_CHATS: CHAT }),
    ).toBeNull();
    expect(
      readGroupSuggestConfig({
        ZOE_GROUP_SUGGEST: '1',
        ZOE_GROUP_SUGGEST_CHATS: `${CHAT}, bad`,
        ZOE_GROUP_SUGGEST_SENDERS: `${SENDER}, nope`,
      }),
    ).toEqual({ chats: new Set([CHAT]), senders: new Set([SENDER]) });
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
    expect(await readFile(join(dir, 'group-suggest', 'kept.md'), 'utf8')).toContain(
      `- <!-- group-suggestion:${item.id} --> ${item.at.slice(0, 10)} Sam Rivera in ZAO Group: ${item.text}`,
    );
  });

  it('remembers which pending cards were already sent automatically', async () => {
    const dir = await home();
    const item = suggestion();
    await addPending(dir, item);
    expect(await readUnnotifiedPending(dir)).toEqual([item]);
    expect(await markPendingNotified(dir, item.id, new Date('2026-11-16T23:00:00.000Z'))).toBe(true);
    expect(await readPending(dir)).toEqual([{ ...item, notifiedAt: '2026-11-16T23:00:00.000Z' }]);
    expect(await readUnnotifiedPending(dir)).toEqual([]);
  });

  it('keeps the pending item when writing the kept record fails, then retries without duplication', async () => {
    const dir = await home();
    const item = suggestion();
    await addPending(dir, item);
    const keptPath = join(dir, 'group-suggest', 'kept.md');
    await mkdir(keptPath);

    await expect(keepPending(dir, item.id)).rejects.toThrow();
    expect(await readPending(dir)).toEqual([item]);

    await rm(keptPath, { recursive: true });
    expect(await keepPending(dir, item.id)).toEqual(item);
    expect(await readPending(dir)).toEqual([]);
    const kept = await readFile(keptPath, 'utf8');
    expect(kept.match(new RegExp(item.id, 'g'))).toHaveLength(1);
  });

  it('serializes simultaneous keep taps and writes one kept record', async () => {
    const dir = await home();
    const item = suggestion();
    await addPending(dir, item);

    const results = await Promise.all([keepPending(dir, item.id), keepPending(dir, item.id)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const kept = await readFile(join(dir, 'group-suggest', 'kept.md'), 'utf8');
    expect(kept.match(new RegExp(item.id, 'g'))).toHaveLength(1);
    expect(await readPending(dir)).toEqual([]);
  });

  it('refuses new suggestions at capacity without dropping older ones', async () => {
    const dir = await home();
    const items = Array.from({ length: 51 }, (_, i) =>
      makeSuggestion({
        chatId: CHAT,
        chatTitle: 'Group',
        sender: 'Sam',
        text: `suggestion number ${i}`,
      }),
    );
    for (const item of items.slice(0, 50)) expect(await addPending(dir, item)).toBe(true);
    expect(await addPending(dir, items[50]!)).toBe(false);
    const read = await readPending(dir);
    expect(read).toHaveLength(50);
    expect(read[0]?.text).toBe('suggestion number 0');
    expect(read.at(-1)?.text).toBe('suggestion number 49');
  });

  it('preserves corrupt JSON and refuses a capture instead of overwriting it', async () => {
    const dir = await home();
    const path = join(dir, 'group-suggest', 'pending.json');
    await import('node:fs/promises').then(({ mkdir }) =>
      mkdir(join(dir, 'group-suggest'), { recursive: true }),
    );
    await import('node:fs/promises').then(({ writeFile }) => writeFile(path, '{broken', 'utf8'));
    await expect(readPending(dir)).rejects.toThrow(/invalid JSON/);
    await expect(addPending(dir, suggestion())).rejects.toThrow(/invalid JSON/);
    expect(await readFile(path, 'utf8')).toBe('{broken');
  });

  it('does not store secret-looking tokens or email addresses', async () => {
    const dir = await home();
    expect(await addPending(dir, suggestion(`token sk-ant-${'A'.repeat(30)}`))).toBe(false);
    expect(await addPending(dir, suggestion('write to person@example.com for details'))).toBe(
      false,
    );
    expect(await readPending(dir)).toEqual([]);
  });
});

describe('rendering and send gap', () => {
  it('renders plain text without handles or markdown markers', () => {
    const card = renderCard(
      makeSuggestion({
        chatId: CHAT,
        chatTitle: 'ZAO #1',
        sender: '@sam_handle',
        text: 'A *bold* useful `idea`',
      }),
    );
    expect(card).not.toMatch(/@\w|[*`#]/);
    expect(card.split('\n')).toHaveLength(3);
  });

  it('sends initially, then only after the gap', () => {
    expect(dueToSend(null, 100)).toBe(true);
    expect(dueToSend(100, 100 + SUGGEST_DM_MIN_GAP_MS - 1)).toBe(false);
    expect(dueToSend(100, 100 + SUGGEST_DM_MIN_GAP_MS)).toBe(true);
  });
});
