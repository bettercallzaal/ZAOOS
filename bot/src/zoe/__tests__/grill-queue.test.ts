import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendGrillQueue,
  nextItemNumber,
  renderQueueSection,
  type GrillQueueCard,
} from '../grill-queue';

const NOW = Date.parse('2026-08-26T12:00:00Z');

const cards: GrillQueueCard[] = [
  { taskId: 'aaa111', title: 'Send the deck', why: 'Sponsor call is Friday.', createdAt: '2026-08-16T12:00:00Z' },
  { taskId: 'bbb222', title: 'Wire the signup' },
];

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'grill-queue-'));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('nextItemNumber - the file numbers badly, so take the max', () => {
  it('is 1 for an empty file', () => {
    expect(nextItemNumber('')).toBe(1);
  });

  it('takes the HIGHEST number, not the last one written', () => {
    // This is the real shape of GRILL-QUEUE.md: a shepherd pass wrote 8-10
    // physically below a section that had already used 11-15. Reading "the
    // last number" would hand out 11 again and collide with a live item.
    const file = ['## batch a', '1. one', '15. fifteen', '## batch b', '8. eight', '10. ten'].join('\n');
    expect(nextItemNumber(file)).toBe(16);
  });

  it('ignores numbers that are not item markers', () => {
    expect(nextItemNumber('see 2026. and v3. also 4.5 things\n2. real item')).toBe(3);
  });
});

describe('renderQueueSection', () => {
  it('numbers from the start and carries the card id', () => {
    const out = renderQueueSection(cards, 30, NOW);
    expect(out).toContain('30. **Send the deck** - board card `aaa111`');
    expect(out).toContain('31. **Wire the signup** - board card `bbb222`');
  });

  it('states the age, and says so when it cannot', () => {
    const out = renderQueueSection(cards, 1, NOW);
    expect(out).toContain('10d old');
    expect(out).toContain('age unknown');
  });

  it('carries the standing rule so the lane knows what it may clear', () => {
    expect(renderQueueSection(cards, 1, NOW)).toContain('knocking those out');
  });
});

describe('appendGrillQueue', () => {
  it('appends to the queue when the handoffs dir already exists', async () => {
    const handoffs = join(dir, 'handoffs');
    await fs.mkdir(handoffs);
    const path = join(handoffs, 'GRILL-QUEUE.md');
    await fs.writeFile(path, '# GRILL-QUEUE\n\n## old\n\n7. seven\n');

    const r = await appendGrillQueue(cards, { now: NOW, path, spool: join(dir, 'spool.jsonl') });
    expect(r.wrote).toBe('queue');
    expect(r.numbers).toEqual([8, 9]);
    const body = await fs.readFile(path, 'utf8');
    expect(body).toContain('7. seven');
    expect(body).toContain('8. **Send the deck**');
  });

  it('spools instead of inventing a vault when the dir is missing', async () => {
    // The VPS case. Checked 2026-08-26: /home/zaal/zao-vault does not exist
    // there, and a mkdir -p would have produced a queue nobody reads.
    const path = join(dir, 'no-such-vault', 'handoffs', 'GRILL-QUEUE.md');
    const spool = join(dir, 'spool.jsonl');

    const r = await appendGrillQueue(cards, { now: NOW, path, spool });
    expect(r.wrote).toBe('spool');
    await expect(fs.stat(join(dir, 'no-such-vault'))).rejects.toThrow();

    const rows = (await fs.readFile(spool, 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
    expect(rows).toHaveLength(2);
    expect(rows[0].taskId).toBe('aaa111');
    expect(rows[0].spooledAt).toBe('2026-08-26T12:00:00.000Z');
  });

  it('appends to the spool rather than replacing it', async () => {
    const spool = join(dir, 'spool.jsonl');
    const path = join(dir, 'nope', 'GRILL-QUEUE.md');
    await appendGrillQueue([cards[0]], { now: NOW, path, spool });
    await appendGrillQueue([cards[1]], { now: NOW, path, spool });
    expect((await fs.readFile(spool, 'utf8')).trim().split('\n')).toHaveLength(2);
  });

  it('does nothing, and says so, for an empty batch', async () => {
    const r = await appendGrillQueue([], { now: NOW, path: join(dir, 'x.md'), spool: join(dir, 's') });
    expect(r).toMatchObject({ wrote: 'nothing', count: 0 });
  });
});
