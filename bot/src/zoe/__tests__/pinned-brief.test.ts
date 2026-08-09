import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  renderPinnedBrief,
  syncPinnedBrief,
  readPinState,
  type BriefInput,
  type PinDeps,
} from '../pinned-brief';

const BASE: BriefInput = {
  needsYou: ['ZOE login revoked - ssh vps, claude, /login'],
  running: [
    ['ZOE', 'up'],
    ['PRs', '0'],
  ],
  changed: ['relay stopped losing messages'],
  updatedLabel: '08:24',
};

let statePath: string;

beforeEach(async () => {
  statePath = join(await fs.mkdtemp(join(tmpdir(), 'pin-')), 'pinned-brief.json');
});

afterEach(() => {
  vi.restoreAllMocks();
});

function deps(over: Partial<PinDeps> = {}): PinDeps {
  return {
    sendMessage: vi.fn(async () => ({ message_id: 42 })),
    pinMessage: vi.fn(async () => undefined),
    editMessage: vi.fn(async () => undefined),
    statePath,
    ...over,
  };
}

describe('renderPinnedBrief', () => {
  it('puts NEEDS YOU first, because it is the only actionable block', () => {
    const text = renderPinnedBrief(BASE);
    expect(text.indexOf('NEEDS YOU')).toBeLessThan(text.indexOf('RUNNING'));
    expect(text.startsWith('NEEDS YOU')).toBe(true);
  });

  it('counts the needs-you items so the count is readable without counting', () => {
    expect(renderPinnedBrief({ ...BASE, needsYou: ['a', 'b', 'c'] })).toContain('NEEDS YOU (3)');
  });

  it('says he is clear rather than rendering an empty heading', () => {
    const text = renderPinnedBrief({ ...BASE, needsYou: [] });
    expect(text).toContain('nothing - you are clear');
  });

  it('aligns the running column so values line up on a phone', () => {
    const text = renderPinnedBrief({
      ...BASE,
      running: [
        ['ZOE', 'up'],
        ['grill queue', '20'],
      ],
    });
    // Scope to the RUNNING block. Filtering the whole text on "up" also catches
    // the "updated ..." footer, which is not part of the aligned column.
    const running = text.split('\n\n').find((b) => b.startsWith('RUNNING')) ?? '';
    const cols = running
      .split('\n')
      .slice(1)
      .map((l) => l.search(/(up|20)/));
    expect(cols.length).toBe(2);
    expect(new Set(cols).size).toBe(1);
  });

  it('drops CHANGED first when over budget, never the actionable blocks', () => {
    const text = renderPinnedBrief({
      ...BASE,
      changed: Array.from({ length: 400 }, (_, i) => `a very long changed line number ${i}`),
    });
    expect(text).toContain('NEEDS YOU');
    expect(text).toContain('RUNNING');
    expect(text).not.toContain('CHANGED');
  });

  it('never exceeds the Telegram 4096 limit', () => {
    const text = renderPinnedBrief({
      ...BASE,
      needsYou: Array.from({ length: 500 }, (_, i) => `needs you item ${i} with plenty of text`),
    });
    expect(text.length).toBeLessThanOrEqual(4096);
  });
});

describe('syncPinnedBrief', () => {
  it('sends and pins on the first run, and remembers the id', async () => {
    const d = deps();
    const r = await syncPinnedBrief('hello', d);
    expect(r).toEqual({ action: 'pinned', messageId: 42 });
    expect(d.pinMessage).toHaveBeenCalledWith(42);
    expect(await readPinState(statePath)).toEqual({ messageId: 42, lastText: 'hello' });
  });

  it('edits the SAME message on the next run rather than sending a new one', async () => {
    const d = deps();
    await syncPinnedBrief('first', d);
    const r = await syncPinnedBrief('second', d);
    expect(r).toEqual({ action: 'edited', messageId: 42 });
    expect(d.sendMessage).toHaveBeenCalledTimes(1);
    expect(d.editMessage).toHaveBeenCalledWith(42, 'second');
  });

  it('skips the API entirely when nothing changed', async () => {
    const d = deps();
    await syncPinnedBrief('same', d);
    const r = await syncPinnedBrief('same', d);
    expect(r).toEqual({ action: 'unchanged', messageId: 42 });
    expect(d.editMessage).not.toHaveBeenCalled();
  });

  it('re-pins when the message was deleted, rather than going silent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({
      editMessage: vi.fn(async () => {
        throw new Error('Bad Request: message to edit not found');
      }),
      sendMessage: vi.fn(async () => ({ message_id: 99 })),
    });
    await syncPinnedBrief('first', d);
    const r = await syncPinnedBrief('second', d);
    expect(r).toEqual({ action: 'pinned', messageId: 99 });
    expect(await readPinState(statePath)).toEqual({ messageId: 99, lastText: 'second' });
  });

  it('keeps the message when only the PIN fails - readable beats discarded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({
      pinMessage: vi.fn(async () => {
        throw new Error('not enough rights');
      }),
    });
    const r = await syncPinnedBrief('hello', d);
    expect(r).toEqual({ action: 'pinned', messageId: 42 });
    expect(await readPinState(statePath)).toEqual({ messageId: 42, lastText: 'hello' });
  });

  it('reports failure loudly when the send itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({
      sendMessage: vi.fn(async () => {
        throw new Error('network down');
      }),
    });
    const r = await syncPinnedBrief('hello', d);
    expect(r).toEqual({ action: 'failed', reason: 'network down' });
  });

  it('survives a corrupt state file by re-pinning', async () => {
    await fs.mkdir(join(statePath, '..'), { recursive: true });
    await fs.writeFile(statePath, 'not json at all', 'utf8');
    const d = deps();
    const r = await syncPinnedBrief('hello', d);
    expect(r.action).toBe('pinned');
  });
});
