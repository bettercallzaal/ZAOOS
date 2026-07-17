// @vitest-environment node
// Tests for the pure classification and formatting functions in tg-interactions.ts.
// No mocks needed: classifyIntent, formatPulse, formatAgenda have no I/O.
import { describe, expect, it } from 'vitest';
import { classifyIntent, formatAgenda, formatPulse, type BoardItem } from '../tg-interactions';

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
