import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Each test points ZOE_HOME at a fresh temp dir. sidequests.ts reads
// process.env.ZOE_HOME lazily (per call), so this works if set before import-use.
async function withTempHome<T>(fn: () => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'sidequests-test-'));
  const prev = process.env.ZOE_HOME;
  process.env.ZOE_HOME = dir;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.ZOE_HOME;
    else process.env.ZOE_HOME = prev;
    await rm(dir, { recursive: true, force: true });
  }
}

test('readMainQuest returns empty string when no file exists', async () => {
  await withTempHome(async () => {
    const { readMainQuest } = await import('../sidequests.ts');
    assert.equal(await readMainQuest(), '');
  });
});

test('writeMainQuest then readMainQuest round-trips trimmed text', async () => {
  await withTempHome(async () => {
    const { readMainQuest, writeMainQuest } = await import('../sidequests.ts');
    await writeMainQuest('  Build the ZAO into a self-running impact network  ');
    assert.equal(await readMainQuest(), 'Build the ZAO into a self-running impact network');
  });
});

test('readSideQuests returns [] when no file exists', async () => {
  await withTempHome(async () => {
    const { readSideQuests } = await import('../sidequests.ts');
    assert.deepEqual(await readSideQuests(), []);
  });
});

test('writeSideQuests then readSideQuests round-trips', async () => {
  await withTempHome(async () => {
    const { readSideQuests, writeSideQuests } = await import('../sidequests.ts');
    const q = {
      id: 'sq-1', title: 'X', description: 'desc', alignment: 5,
      alignment_reason: 'r', status: 'parked' as const, pinned: false,
      created_at: 't', updated_at: 't', scored_at: 't',
    };
    await writeSideQuests([q]);
    assert.deepEqual(await readSideQuests(), [q]);
  });
});

test('readSideQuests returns [] on corrupt JSON', async () => {
  await withTempHome(async () => {
    const { readSideQuests } = await import('../sidequests.ts');
    const { writeFile, mkdir } = await import('node:fs/promises');
    await mkdir(process.env.ZOE_HOME!, { recursive: true });
    await writeFile(join(process.env.ZOE_HOME!, 'sidequests.json'), '{not json', 'utf8');
    assert.deepEqual(await readSideQuests(), []);
  });
});

// --- recomputeActive tests ---

import type { SideQuest } from '../types.ts';

function mkQuest(over: Partial<SideQuest>): SideQuest {
  return {
    id: 'sq-x', title: 'T', description: 'D', alignment: null,
    alignment_reason: '', status: 'parked', pinned: false,
    created_at: 't', updated_at: 't', scored_at: null,
    ...over,
  };
}

test('recomputeActive: empty pool returns empty', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  assert.deepEqual(recomputeActive([]), []);
});

test('recomputeActive: top 3 by alignment go active, rest parked', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9 }),
    mkQuest({ id: 'b', alignment: 7 }),
    mkQuest({ id: 'c', alignment: 5 }),
    mkQuest({ id: 'd', alignment: 3 }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'active');
  assert.equal(status.c, 'active');
  assert.equal(status.d, 'parked');
});

test('recomputeActive: unscored quests are never active', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 8 }),
    mkQuest({ id: 'b', alignment: null }),
    mkQuest({ id: 'c', alignment: null }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'parked');
  assert.equal(status.c, 'parked');
});

test('recomputeActive: done and dropped quests are excluded and untouched', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9, status: 'done' }),
    mkQuest({ id: 'b', alignment: 8, status: 'dropped' }),
    mkQuest({ id: 'c', alignment: 2 }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'done');
  assert.equal(status.b, 'dropped');
  assert.equal(status.c, 'active');
});

test('recomputeActive: a pinned quest is always active even with a low score', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 9 }),
    mkQuest({ id: 'b', alignment: 8 }),
    mkQuest({ id: 'c', alignment: 7 }),
    mkQuest({ id: 'd', alignment: 1, pinned: true }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.d, 'active');
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'active');
  assert.equal(status.c, 'parked');
});

test('recomputeActive: alignment 0 is scored (active) - null is not', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 5 }),
    mkQuest({ id: 'b', alignment: 0 }),
    mkQuest({ id: 'c', alignment: null }),
  ];
  const out = recomputeActive(pool);
  const status = Object.fromEntries(out.map((q) => [q.id, q.status]));
  assert.equal(status.a, 'active');
  assert.equal(status.b, 'active'); // 0 is a real score, not null
  assert.equal(status.c, 'parked'); // null is never active
});

test('recomputeActive: more than ACTIVE_LIMIT pinned still yields only 3 active', async () => {
  const { recomputeActive } = await import('../sidequests.ts');
  const pool = [
    mkQuest({ id: 'a', alignment: 1, pinned: true }),
    mkQuest({ id: 'b', alignment: 1, pinned: true }),
    mkQuest({ id: 'c', alignment: 1, pinned: true }),
    mkQuest({ id: 'd', alignment: 1, pinned: true }),
    mkQuest({ id: 'e', alignment: 9 }),
  ];
  const out = recomputeActive(pool);
  const active = out.filter((q) => q.status === 'active');
  assert.equal(active.length, 3); // capped at ACTIVE_LIMIT even with 4 pinned
});
