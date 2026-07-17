// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({
  promises: { readFile: mockReadFile },
}));

import { formatAuditForTelegram, runAudit } from '../trust-audit';

afterEach(() => vi.clearAllMocks());

const NOW = 1_700_000_000_000; // fixed epoch
const DAY_MS = 24 * 60 * 60 * 1000;
const days = (n: number) => new Date(NOW - n * DAY_MS).toISOString();

// tasks.json path → first readFile call; captures.jsonl → second readFile call
function stubFiles(tasks: unknown[], capLines: string[] = []) {
  mockReadFile
    .mockResolvedValueOnce(JSON.stringify(tasks))     // tasks.json
    .mockResolvedValueOnce(capLines.join('\n'));       // captures.jsonl
}

// ── formatAuditForTelegram (pure) ─────────────────────────────────────────────

describe('formatAuditForTelegram', () => {
  it('returns the summary directly when there are no findings', () => {
    const report = { scannedAt: '2026-07-17T00:00:00Z', findings: [], summary: 'All clear.' };
    expect(formatAuditForTelegram(report)).toBe('All clear.');
  });

  it('groups capture and task findings with labels', () => {
    const report = {
      scannedAt: '2026-07-17T00:00:00Z',
      summary: '2 gaps found.',
      findings: [
        { type: 'capture' as const, id: 'c1', title: 'Old idea', daysSince: 20, reason: '...' },
        { type: 'task' as const, id: 't1', title: 'Stuck task', daysSince: 15, status: 'pending', reason: '...' },
      ],
    };
    const msg = formatAuditForTelegram(report);
    expect(msg).toContain('Captures:');
    expect(msg).toContain('Old idea');
    expect(msg).toContain('Tasks:');
    expect(msg).toContain('Stuck task');
    expect(msg).toContain('[pending]');
  });
});

// ── runAudit ──────────────────────────────────────────────────────────────────

describe('runAudit', () => {
  it('returns all-clear summary when no tasks/captures exist', async () => {
    stubFiles([]);
    const r = await runAudit([], NOW);
    expect(r.findings).toHaveLength(0);
    expect(r.summary).toContain('all clear');
  });

  it('flags a capture older than 14 days with no related done task', async () => {
    const cap = JSON.stringify({ id: 'c1', text: 'Research ZAO music system', created_at: days(15) });
    stubFiles([], [cap]);
    const r = await runAudit([], NOW);
    expect(r.findings.some((f) => f.type === 'capture' && f.id === 'c1')).toBe(true);
  });

  it('does NOT flag a capture younger than 14 days', async () => {
    const cap = JSON.stringify({ id: 'c2', text: 'Fresh idea', created_at: days(5) });
    stubFiles([], [cap]);
    const r = await runAudit([], NOW);
    expect(r.findings).toHaveLength(0);
  });

  it('does NOT flag a stale capture when a related completed task exists', async () => {
    const cap = JSON.stringify({ id: 'c3', text: 'add artist profile page', created_at: days(20) });
    const task = { id: 't1', title: 'artist profile page', status: 'completed', created_at: days(25), priority: 'high', description: '', notes: [] };
    stubFiles([task], [cap]);
    const r = await runAudit([], NOW);
    const capFinding = r.findings.find((f) => f.type === 'capture' && f.id === 'c3');
    expect(capFinding).toBeUndefined();
  });

  it('flags a pending task older than 14 days', async () => {
    const task = { id: 't2', title: 'Old pending task', status: 'pending', created_at: days(20), priority: 'med', description: '', notes: [] };
    stubFiles([task]);
    const r = await runAudit([], NOW);
    const finding = r.findings.find((f) => f.id === 't2');
    expect(finding).toBeDefined();
    expect(finding?.reason).toContain('Pending for 20 days');
  });

  it('does NOT flag a pending task younger than 14 days', async () => {
    const task = { id: 't3', title: 'Fresh task', status: 'pending', created_at: days(5), priority: 'med', description: '', notes: [] };
    stubFiles([task]);
    const r = await runAudit([], NOW);
    expect(r.findings).toHaveLength(0);
  });

  it('flags a blocked task older than 14 days', async () => {
    const task = { id: 't4', title: 'Long-blocked task', status: 'blocked', created_at: days(20), priority: 'high', description: '', notes: ['waiting on API key'] };
    stubFiles([task]);
    const r = await runAudit([], NOW);
    const finding = r.findings.find((f) => f.id === 't4');
    expect(finding).toBeDefined();
    expect(finding?.status).toBe('blocked');
    expect(finding?.reason).toContain('Blocked for 20 days');
  });

  it('includes the last note in the blocked reason', async () => {
    const task = { id: 't5', title: 'Blocked task', status: 'blocked', created_at: days(20), priority: 'med', description: '', notes: ['note 1', 'waiting on Zaal decision'] };
    stubFiles([task]);
    const r = await runAudit([], NOW);
    const finding = r.findings.find((f) => f.id === 't5');
    expect(finding?.reason).toContain('waiting on Zaal decision');
  });

  it('uses grouped summary for > 3 findings', async () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({
      id: `t${i}`, title: `Old task ${i}`, status: 'pending', created_at: days(20), priority: 'low', description: '', notes: [],
    }));
    stubFiles(tasks);
    const r = await runAudit([], NOW);
    expect(r.findings).toHaveLength(4);
    expect(r.summary).toContain('4 potential gaps');
    expect(r.summary).toContain('stuck tasks');
  });

  it('records the scannedAt timestamp from the now parameter', async () => {
    stubFiles([]);
    const r = await runAudit([], NOW);
    expect(r.scannedAt).toBe(new Date(NOW).toISOString());
  });
});
