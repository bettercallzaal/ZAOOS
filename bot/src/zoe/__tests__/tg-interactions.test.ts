// @vitest-environment node
// Tests for the pure classification and formatting functions in tg-interactions.ts.
// No mocks needed: classifyIntent, formatPulse, formatAgenda have no I/O.
import { describe, expect, it, vi } from 'vitest';
import { classifyIntent, formatAgenda, formatPulse, handleMessageReaction, type BoardItem } from '../tg-interactions';
import type { Context } from 'grammy';

function makeItem(
  id: string,
  title: string,
  status: BoardItem['status'] = 'open',
  priority?: BoardItem['priority'],
): BoardItem {
  return { id, title, status, priority };
}

// ── classifyIntent ────────────────────────────────────────────────────────────

describe('classifyIntent', () => {
  it('returns "research" for text containing "research"', async () => {
    expect(await classifyIntent('research this topic', false, false, false)).toBe('research');
  });

  it('returns "research" for text containing "article"', async () => {
    expect(await classifyIntent('check out this article', false, false, false)).toBe('research');
  });

  it('returns "research" when hasUrl=true regardless of text', async () => {
    expect(await classifyIntent('', false, false, true)).toBe('research');
  });

  it('returns "research" for URL even when text also mentions "meeting" (URL checked first)', async () => {
    expect(await classifyIntent('meeting at x.com', false, false, true)).toBe('research');
  });

  it('returns "meeting" for text containing "meeting"', async () => {
    expect(await classifyIntent('schedule a meeting tomorrow', false, false, false)).toBe('meeting');
  });

  it('returns "meeting" for text containing "calendar"', async () => {
    expect(await classifyIntent('put it on the calendar', false, false, false)).toBe('meeting');
  });

  it('returns "meeting" when hasPhoto=true (photo = meeting, per spec)', async () => {
    expect(await classifyIntent('', false, true, false)).toBe('meeting');
  });

  it('returns "task" for text containing "task"', async () => {
    expect(await classifyIntent('create a task for this', false, false, false)).toBe('task');
  });

  it('returns "task" for text containing "todo"', async () => {
    expect(await classifyIntent('todo: write the docs', false, false, false)).toBe('task');
  });

  it('returns "task" for text containing "do:"', async () => {
    expect(await classifyIntent('do: fix the bug', false, false, false)).toBe('task');
  });

  it('returns "task" when hasFile=true', async () => {
    expect(await classifyIntent('', true, false, false)).toBe('task');
  });

  it('returns "fyi" for plain text with no matching keywords or flags', async () => {
    expect(await classifyIntent('hey there', false, false, false)).toBe('fyi');
  });

  it('returns "fyi" for empty text with no flags', async () => {
    expect(await classifyIntent('', false, false, false)).toBe('fyi');
  });
});

// ── formatPulse ───────────────────────────────────────────────────────────────

describe('formatPulse', () => {
  it('starts with "PULSE"', async () => {
    expect(await formatPulse([])).toContain('PULSE');
  });

  it('shows OPEN count with open items only (excludes done/archived)', async () => {
    const items = [
      makeItem('1', 'Open thing', 'open'),
      makeItem('2', 'Done thing', 'done'),
      makeItem('3', 'Archived', 'archived'),
    ];
    expect(await formatPulse(items)).toContain('OPEN (1)');
  });

  it('shows URGENT section when there are urgent open items', async () => {
    const items = [makeItem('1', 'Critical fix', 'open', 'urgent')];
    const result = await formatPulse(items);
    expect(result).toContain('URGENT (1)');
    expect(result).toContain('Critical fix');
  });

  it('does NOT show URGENT section when no urgent items', async () => {
    const items = [makeItem('1', 'Normal task', 'open', 'normal')];
    expect(await formatPulse(items)).not.toContain('URGENT');
  });

  it('lists open item titles under OPEN section', async () => {
    const items = [makeItem('1', 'Ship the music module', 'open')];
    expect(await formatPulse(items)).toContain('Ship the music module');
  });

  it('caps URGENT display at 5 items (URGENT section only, count header shows true count)', async () => {
    const items = Array.from({ length: 7 }, (_, i) =>
      makeItem(`${i}`, `Urgent ${i}`, 'open', 'urgent'),
    );
    const result = await formatPulse(items);
    // Count header reflects all 7
    expect(result).toContain('URGENT (7):');
    // Only items 0-4 appear in the URGENT block (before OPEN:)
    const urgentSection = result.split('\nOPEN')[0];
    expect(urgentSection).toContain('Urgent 4');
    expect(urgentSection).not.toContain('Urgent 5');
  });

  it('caps OPEN display at 10 items', async () => {
    const items = Array.from({ length: 12 }, (_, i) => makeItem(`${i}`, `Task ${i}`));
    const result = await formatPulse(items);
    expect(result).toContain('Task 9');
    expect(result).not.toContain('Task 10');
  });

  it('returns OPEN (0) when all items are done', async () => {
    const items = [makeItem('1', 'Done', 'done'), makeItem('2', 'Also done', 'done')];
    expect(await formatPulse(items)).toContain('OPEN (0)');
  });
});

// ── formatAgenda ──────────────────────────────────────────────────────────────

describe('formatAgenda', () => {
  it('starts with "AGENDA"', async () => {
    expect(await formatAgenda([])).toContain('AGENDA');
  });

  it('excludes done items', async () => {
    const items = [makeItem('1', 'Done thing', 'done'), makeItem('2', 'Open thing', 'open')];
    const result = await formatAgenda(items);
    expect(result).toContain('Open thing');
    expect(result).not.toContain('Done thing');
  });

  it('excludes archived items', async () => {
    const items = [makeItem('1', 'Archived', 'archived'), makeItem('2', 'Active', 'open')];
    const result = await formatAgenda(items);
    expect(result).toContain('Active');
    expect(result).not.toContain('Archived');
  });

  it('sorts urgent items before normal and low items', async () => {
    const items = [
      makeItem('1', 'Normal task', 'open', 'normal'),
      makeItem('2', 'Urgent fix', 'open', 'urgent'),
      makeItem('3', 'Low priority', 'open', 'low'),
    ];
    const result = await formatAgenda(items);
    const urgentIdx = result.indexOf('Urgent fix');
    const normalIdx = result.indexOf('Normal task');
    const lowIdx = result.indexOf('Low priority');
    expect(urgentIdx).toBeLessThan(normalIdx);
    expect(normalIdx).toBeLessThan(lowIdx);
  });

  it('prefixes urgent items with "[URGENT] "', async () => {
    const items = [makeItem('1', 'Ship it now', 'open', 'urgent')];
    expect(await formatAgenda(items)).toContain('[URGENT] Ship it now');
  });

  it('does NOT prefix non-urgent items', async () => {
    const items = [makeItem('1', 'Routine task', 'open', 'normal')];
    const result = await formatAgenda(items);
    expect(result).toContain('Routine task');
    expect(result).not.toContain('[URGENT]');
  });

  it('caps display at 20 items', async () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      makeItem(`${i}`, `Item ${i}`, 'open'),
    );
    const result = await formatAgenda(items);
    expect(result).toContain('Item 19');
    expect(result).not.toContain('Item 20');
  });
});

// ── handleMessageReaction ─────────────────────────────────────────────────────

function makeReactionCtx(opts: {
  chatId?: number;
  messageId?: number;
  emojis?: string[];
  noReaction?: boolean;
} = {}): Context {
  const { chatId = 456, messageId = 99, emojis = [], noReaction = false } = opts;
  return {
    chat: chatId !== undefined ? { id: chatId } : undefined,
    messageReaction: noReaction
      ? undefined
      : {
          message_id: messageId,
          new_reaction: emojis.map((e) => ({ emoji: e, type: 'emoji' })),
        },
  } as unknown as Context;
}

function makeDeps(
  overrides: Partial<{
    isFromZaal: boolean;
    getTaskForMessage: (id: number) => Promise<string | null>;
  }> = {},
) {
  return {
    isFromZaal: overrides.isFromZaal ?? true,
    zaalId: 123,
    reactions: {
      unpin: vi.fn<[number, number], Promise<void>>().mockResolvedValue(undefined),
      markDone: vi.fn<[string, 'done'], Promise<void>>().mockResolvedValue(undefined),
      getTaskForMessage: overrides.getTaskForMessage ?? vi.fn<[number], Promise<string | null>>().mockResolvedValue(null),
      ping: vi.fn<[string, string], Promise<void>>().mockResolvedValue(undefined),
    },
  };
}

describe('handleMessageReaction', () => {
  it('ignores reactions from non-Zaal users', async () => {
    const deps = makeDeps({ isFromZaal: false });
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['👍'] }), deps);
    expect(result).toEqual({ handled: false });
    expect(deps.reactions.unpin).not.toHaveBeenCalled();
  });

  it('ignores update with no messageReaction', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ noReaction: true }), deps);
    expect(result).toEqual({ handled: false });
  });

  it('ignores update with no chat id', async () => {
    const deps = makeDeps();
    const ctx = { chat: undefined, messageReaction: { message_id: 1, new_reaction: [] } } as unknown as Context;
    const result = await handleMessageReaction(ctx, deps);
    expect(result).toEqual({ handled: false });
  });

  it('thumbs-up calls unpin and returns approve', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['👍'] }), deps);
    expect(result).toEqual({ handled: true, action: 'approve' });
    expect(deps.reactions.unpin).toHaveBeenCalledWith(456, 99);
  });

  it('+1 string alias also triggers approve', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['+1'] }), deps);
    expect(result).toEqual({ handled: true, action: 'approve' });
    expect(deps.reactions.unpin).toHaveBeenCalledTimes(1);
  });

  it('checkmark with no linked task returns mark-done without DB call', async () => {
    const deps = makeDeps({ getTaskForMessage: vi.fn().mockResolvedValue(null) });
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['✅'] }), deps);
    expect(result).toEqual({ handled: true, action: 'mark-done' });
    expect(deps.reactions.markDone).not.toHaveBeenCalled();
    expect(deps.reactions.unpin).not.toHaveBeenCalled();
  });

  it('checkmark with linked task calls markDone + unpin', async () => {
    const deps = makeDeps({ getTaskForMessage: vi.fn().mockResolvedValue('task-abc') });
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['✅'], messageId: 7 }), deps);
    expect(result).toEqual({ handled: true, action: 'mark-done' });
    expect(deps.reactions.markDone).toHaveBeenCalledWith('task-abc', 'done');
    expect(deps.reactions.unpin).toHaveBeenCalledWith(456, 7);
  });

  it('fire emoji calls ping with urgent queue', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['🔥'], messageId: 5 }), deps);
    expect(result).toEqual({ handled: true, action: 'mark-urgent' });
    expect(deps.reactions.ping).toHaveBeenCalledWith('urgent', expect.stringContaining('5'));
  });

  it('lightning bolt alias also triggers mark-urgent', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['⚡'] }), deps);
    expect(result).toEqual({ handled: true, action: 'mark-urgent' });
  });

  it('unknown emoji returns handled:true with no action', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['🎵'] }), deps);
    expect(result).toEqual({ handled: true });
    expect(deps.reactions.unpin).not.toHaveBeenCalled();
    expect(deps.reactions.ping).not.toHaveBeenCalled();
  });

  it('empty reaction list returns handled:true with no action', async () => {
    const deps = makeDeps();
    const result = await handleMessageReaction(makeReactionCtx({ emojis: [] }), deps);
    expect(result).toEqual({ handled: true });
  });

  it('surfaces error when unpin throws', async () => {
    const deps = makeDeps();
    deps.reactions.unpin.mockRejectedValueOnce(new Error('network timeout'));
    const result = await handleMessageReaction(makeReactionCtx({ emojis: ['👍'] }), deps);
    expect(result).toEqual({ handled: true, error: 'network timeout' });
  });
});
