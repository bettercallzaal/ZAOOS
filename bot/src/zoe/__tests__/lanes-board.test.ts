import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readLaneSnapshot, renderLanes, STALE_AFTER_S, type LaneSnapshot } from '../lanes-board';

const AT = 1789140600; // 2026-09-11 15:30 UTC = 11:30 ET

const snap: LaneSnapshot = {
  at: AT,
  host: 'MacBook-Air-5',
  rows: [
    { rank: 1, state: 'choice-prompt', title: 'grill]', repo: 'zao-vault', ctx: null, question: 'PICKER: which card first?' },
    { rank: 1, state: 'choice-prompt', title: 'zaalvoice', repo: 'zaalvoice', ctx: null, question: '(question hidden: it mentions a credential)' },
    { rank: 2, state: 'asked-question', title: 'Wwtracker lane', repo: 'wwtracker', ctx: 67, question: 'new task?' },
    { rank: 3, state: 'waiting', title: 'vault', repo: 'zao-vault', ctx: 44, question: '' },
    { rank: 4, state: 'working', title: 'dotfiles', repo: 'zaal-dotfiles', ctx: 47, question: '' },
    { rank: 6, state: 'bare-shell', title: 'Terminal 1', repo: 'zao-vault', ctx: null, question: '' },
  ],
};

describe('renderLanes', () => {
  it('puts what wants Zaal first, with the question and why', () => {
    const out = renderLanes(snap, AT + 120);
    expect(out.indexOf('WANT YOU (3)')).toBeLessThan(out.indexOf('WORKING'));
    expect(out).toContain('- grill] [picker]: PICKER: which card first?');
    expect(out).toContain('- Wwtracker lane 67% [asked]: new task?');
    expect(out).toContain('(question hidden: it mentions a credential)');
  });

  it('groups the rest by state and says when and from where', () => {
    const out = renderLanes(snap, AT + 120);
    expect(out).toContain('Lanes at 11:30 AM ET (2 min ago, MacBook-Air-5)');
    expect(out).toContain('WORKING (1): dotfiles 47%');
    expect(out).toContain('IDLE AT A PROMPT (1): vault 44%');
    expect(out).toContain('OTHER (1): Terminal 1 (bare-shell)');
  });

  it('says STALE, first, when the snapshot is older than 15 minutes', () => {
    const out = renderLanes(snap, AT + STALE_AFTER_S + 60);
    expect(out.startsWith('STALE: this snapshot is 16 min old')).toBe(true);
    expect(renderLanes(snap, AT + 60).startsWith('STALE')).toBe(false);
  });

  it('says nothing is waiting rather than printing an empty list', () => {
    const quiet = { ...snap, rows: snap.rows.filter((r) => r.state === 'working') };
    expect(renderLanes(quiet, AT + 60)).toContain('Nothing is waiting on you.');
  });

  it('no snapshot says how one arrives, never an empty board', () => {
    expect(renderLanes(null, AT)).toContain('No lane snapshot yet');
  });
});

describe('readLaneSnapshot', () => {
  it('reads a pushed snapshot, and a missing or broken file is null', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'lanes-'));
    const good = join(dir, 'board-snapshot.json');
    await fs.writeFile(good, JSON.stringify(snap));
    expect((await readLaneSnapshot(good))?.rows).toHaveLength(6);
    expect(await readLaneSnapshot(join(dir, 'missing.json'))).toBeNull();
    const bad = join(dir, 'bad.json');
    await fs.writeFile(bad, '{"at": "soon"}');
    expect(await readLaneSnapshot(bad)).toBeNull();
  });
});
