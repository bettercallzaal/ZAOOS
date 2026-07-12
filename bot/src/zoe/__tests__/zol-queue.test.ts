import { describe, it, expect } from 'vitest';
import { buildZolRow } from '../zol-queue';

describe('buildZolRow', () => {
  it('truncates text to 300 chars', () => {
    const longText = 'a'.repeat(500);
    const row = buildZolRow(longText, 'test-id');
    expect((row.title as string).length).toBeLessThanOrEqual(300);
    expect(row.title).toBe('a'.repeat(300));
  });

  it('trims whitespace from title', () => {
    const textWithSpaces = '  hello world  ';
    const row = buildZolRow(textWithSpaces, 'test-id');
    expect(row.title).toBe('hello world');
  });

  it('sets legacy_source to zolcast:<id>', () => {
    const row = buildZolRow('test text', 'my-cast-id');
    expect(row.legacy_source).toBe('zolcast:my-cast-id');
  });

  it('sets status to todo', () => {
    const row = buildZolRow('test text', 'id1');
    expect(row.status).toBe('todo');
  });

  it('sets project to zol', () => {
    const row = buildZolRow('test text', 'id1');
    expect(row.project).toBe('zol');
  });

  it('builds a complete row with all required fields', () => {
    const row = buildZolRow('hello world', 'abc123');
    expect(row).toEqual({
      title: 'hello world',
      legacy_source: 'zolcast:abc123',
      status: 'todo',
      project: 'zol',
    });
  });
});
