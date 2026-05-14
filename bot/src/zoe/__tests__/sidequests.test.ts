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
