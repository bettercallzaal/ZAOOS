import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendApproved, outboxChannelFor, outboxLine, outboxPathFor } from '../outbox';

describe('outboxChannelFor', () => {
  it('maps -cast kinds to the cast channel', () => {
    expect(outboxChannelFor('zol-cast')).toBe('cast');
    expect(outboxChannelFor('farcaster-cast')).toBe('cast');
    expect(outboxChannelFor('wavewarz-cast')).toBe('cast');
    expect(outboxChannelFor('zabal-cast')).toBe('cast');
  });

  it('maps newsletter to the newsletter channel', () => {
    expect(outboxChannelFor('newsletter')).toBe('newsletter');
  });

  it('returns null for non-outbox kinds', () => {
    expect(outboxChannelFor('proactive-post')).toBeNull();
    expect(outboxChannelFor('demo')).toBeNull();
  });
});

describe('outboxLine', () => {
  it('produces a parseable JSONL entry marked unsent', () => {
    const line = outboxLine('zol-cast', 'gm from ZOL', 1_700_000_000_000);
    const parsed = JSON.parse(line);
    expect(parsed).toEqual({
      kind: 'zol-cast',
      text: 'gm from ZOL',
      approvedAt: new Date(1_700_000_000_000).toISOString(),
      sent: false,
    });
  });
});

describe('appendApproved (file I/O)', () => {
  const orig = process.env.ZOE_HOME;
  let dir: string;
  beforeEach(async () => {
    dir = join(tmpdir(), `outbox-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    process.env.ZOE_HOME = dir;
  });
  afterEach(async () => {
    if (orig === undefined) delete process.env.ZOE_HOME;
    else process.env.ZOE_HOME = orig;
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  });

  it('appends a cast draft to the cast outbox file', async () => {
    const channel = await appendApproved('zol-cast', 'gm from ZOL');
    expect(channel).toBe('cast');
    const body = await fs.readFile(outboxPathFor('cast'), 'utf8');
    const entry = JSON.parse(body.trim());
    expect(entry).toMatchObject({ kind: 'zol-cast', text: 'gm from ZOL', sent: false });
  });

  it('appends multiple entries as separate JSONL lines', async () => {
    await appendApproved('farcaster-cast', 'one');
    await appendApproved('wavewarz-cast', 'two');
    const lines = (await fs.readFile(outboxPathFor('cast'), 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]).text).toBe('two');
  });

  it('returns null and writes nothing for a non-outbox kind', async () => {
    const channel = await appendApproved('proactive-post', 'hi');
    expect(channel).toBeNull();
    await expect(fs.readFile(outboxPathFor('cast'), 'utf8')).rejects.toBeTruthy();
  });
});
