import { describe, it, expect } from 'vitest';
import { formatTaskSource } from '../brief';
import type { ZoeTask } from '../types';

describe('formatTaskSource', () => {
  const makeTask = (source: string): ZoeTask => ({
    id: 'task-1',
    title: 'Test task',
    description: 'Test',
    status: 'pending',
    priority: 'high',
    source,
    notes: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  it('returns null for ad-hoc/unset source', () => {
    expect(formatTaskSource(makeTask('ad-hoc'))).toBeNull();
    expect(formatTaskSource(makeTask('human'))).toBeNull();
    expect(formatTaskSource({ ...makeTask(''), source: '' })).toBeNull();
  });

  it('returns meeting suffix for meeting sources', () => {
    expect(formatTaskSource(makeTask('meeting:2026-01-15'))).toBe('(from a meeting)');
    expect(formatTaskSource(makeTask('meeting-capture'))).toBe('(from a meeting)');
    expect(formatTaskSource(makeTask('meeting:tyler-call-jan15'))).toBe('(from a meeting)');
  });

  it('returns research suffix for doc sources', () => {
    expect(formatTaskSource(makeTask('doc-601'))).toBe('(from research)');
    expect(formatTaskSource(makeTask('doc-1234'))).toBe('(from research)');
    expect(formatTaskSource(makeTask('research'))).toBe('(from research)');
    expect(formatTaskSource(makeTask('bonfire-recall'))).toBe('(from research)');
  });

  it('returns research dispatch suffix for dispatch sources', () => {
    expect(formatTaskSource(makeTask('research-dispatch'))).toBe('(from research dispatch)');
    expect(formatTaskSource(makeTask('doc-dispatch'))).toBe('(from research dispatch)');
  });

  it('returns PR auto suffix for PR sources', () => {
    expect(formatTaskSource(makeTask('pr-auto'))).toBe('(from PR auto)');
    expect(formatTaskSource(makeTask('github'))).toBe('(from PR auto)');
    expect(formatTaskSource(makeTask('pr-auto-fix'))).toBe('(from PR auto)');
  });

  it('is case-insensitive', () => {
    expect(formatTaskSource(makeTask('MEETING:2026-01-15'))).toBe('(from a meeting)');
    expect(formatTaskSource(makeTask('DOC-601'))).toBe('(from research)');
    expect(formatTaskSource(makeTask('RESEARCH-DISPATCH'))).toBe('(from research dispatch)');
    expect(formatTaskSource(makeTask('PR-AUTO'))).toBe('(from PR auto)');
  });

  it('handles empty/undefined source gracefully', () => {
    const task = makeTask('doc-1');
    task.source = '';
    expect(formatTaskSource(task)).toBeNull();

    const task2 = makeTask('doc-2');
    task2.source = undefined as any;
    expect(formatTaskSource(task2)).toBeNull();
  });
});
