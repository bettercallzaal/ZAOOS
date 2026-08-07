/**
 * mission-control.test.ts - the pinned mission-control render + emit layer (doc 2226).
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  emitStep,
  readStepJournal,
  renderPinnedText,
  type JournalStep,
} from '../mission-control';

function step(partial: Partial<JournalStep> & Pick<JournalStep, 'id' | 'topic' | 'text'>): JournalStep {
  return {
    ts: '2026-08-07T05:00:00.000Z',
    actor: 'zoe',
    severity: 3,
    parent: null,
    kind: 'step',
    ...partial,
  };
}

describe('readStepJournal + emitStep', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mc-'));
  const path = join(dir, 'journal.jsonl');

  it('missing journal = empty feed, not an error', async () => {
    await expect(readStepJournal(join(dir, 'nope.jsonl'))).resolves.toEqual([]);
  });

  it('emitStep appends python-compatible rows with sequential ids', async () => {
    const a = await emitStep('panel', 'builder', 5, 'started the run', { path });
    const b = await emitStep('panel', 'critic', 8, 'found a disagreement', { path, parent: a.id, kind: 'correction' });
    expect(a.id).toBe('s1');
    expect(b.id).toBe('s2');
    expect(b.parent).toBe('s1');
    const rows = await readStepJournal(path);
    expect(rows).toHaveLength(2);
    expect(rows[1].kind).toBe('correction');
  });

  it('severity is clamped to 0-10', async () => {
    const s = await emitStep('panel', 'zoe', 99, 'clamped', { path });
    expect(s.severity).toBe(10);
  });

  it('corrupt lines are skipped, never a crash', async () => {
    const { promises: fs } = await import('node:fs');
    await fs.appendFile(path, 'not json\n', 'utf8');
    const rows = await readStepJournal(path);
    expect(rows.length).toBeGreaterThanOrEqual(3); // the valid rows survive
  });
});

describe('renderPinnedText', () => {
  it('empty journal renders the quiet state', () => {
    expect(renderPinnedText([])).toContain('quiet');
  });

  it('priority steps (>=7) render in NEEDS YOU on top', () => {
    const out = renderPinnedText([
      step({ id: 's1', topic: 'relay', text: 'routine ping', severity: 2 }),
      step({ id: 's2', topic: 'deploy', text: 'boot FAILED on vps', severity: 9, ts: '2026-08-07T06:00:00.000Z' }),
    ]);
    const needsYou = out.indexOf('NEEDS YOU');
    expect(needsYou).toBeGreaterThan(-1);
    expect(out.indexOf('boot FAILED')).toBeGreaterThan(needsYou);
    expect(out.indexOf('boot FAILED')).toBeLessThan(out.indexOf('# deploy'));
  });

  it('threads are topic-grouped with counts; corrections marked FIX', () => {
    const out = renderPinnedText([
      step({ id: 's1', topic: 'panel', text: 'run started' }),
      step({ id: 's2', topic: 'panel', text: 'redo step 2', kind: 'correction', parent: 's1', severity: 6 }),
    ]);
    expect(out).toContain('# panel (2)');
    expect(out).toContain('FIX redo step 2');
  });

  it('muted topics are hidden (mutable channels)', () => {
    const out = renderPinnedText(
      [
        step({ id: 's1', topic: 'noise', text: 'chatter' }),
        step({ id: 's2', topic: 'signal', text: 'real work' }),
      ],
      { mutedTopics: ['noise'] },
    );
    expect(out).not.toContain('chatter');
    expect(out).toContain('real work');
  });

  it('stays within the Telegram limit and notes dropped topics', () => {
    const steps: JournalStep[] = [];
    for (let t = 0; t < 40; t++) {
      for (let i = 0; i < 5; i++) {
        steps.push(
          step({
            id: `s${t * 5 + i}`,
            topic: `topic-${t}`,
            text: `a fairly long step description line number ${i} with details `.repeat(3),
            ts: `2026-08-07T05:${String(t).padStart(2, '0')}:00.000Z`,
          }),
        );
      }
    }
    const out = renderPinnedText(steps);
    expect(out.length).toBeLessThanOrEqual(4096);
    expect(out).toContain('older topics');
  });

  it('most-recent-activity topic renders first', () => {
    const out = renderPinnedText([
      step({ id: 's1', topic: 'old', text: 'stale', ts: '2026-08-07T01:00:00.000Z' }),
      step({ id: 's2', topic: 'fresh', text: 'active', ts: '2026-08-07T06:00:00.000Z' }),
    ]);
    expect(out.indexOf('# fresh')).toBeLessThan(out.indexOf('# old'));
  });
});
