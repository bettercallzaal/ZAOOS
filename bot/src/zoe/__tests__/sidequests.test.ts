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

test('applyQuestOps: set_main writes the main quest', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readMainQuest } = await import('../sidequests.ts');
    const res = await applyQuestOps([{ op: 'set_main', text: 'Ship the ZAO' }]);
    assert.equal(res.main_quest_set, true);
    assert.equal(await readMainQuest(), 'Ship the ZAO');
  });
});

test('applyQuestOps: add with alignment scores immediately and can go active', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const res = await applyQuestOps([
      { op: 'add', quest: { title: 'WaveWarZ Africa', description: 'launch', alignment: 8, alignment_reason: 'direct' } },
    ]);
    assert.equal(res.added.length, 1);
    const stored = await readSideQuests();
    assert.equal(stored.length, 1);
    assert.equal(stored[0].alignment, 8);
    assert.equal(stored[0].status, 'active');
    assert.notEqual(stored[0].scored_at, null);
  });
});

test('applyQuestOps: add without alignment stays unscored and parked', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    await applyQuestOps([{ op: 'add', quest: { title: 'Someday thing', description: 'd' } }]);
    const stored = await readSideQuests();
    assert.equal(stored[0].alignment, null);
    assert.equal(stored[0].status, 'parked');
    assert.equal(stored[0].scored_at, null);
  });
});

test('applyQuestOps: score updates an existing quest and recomputes active', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([{ op: 'add', quest: { title: 'Q', description: 'd' } }]);
    const id = add.added[0].id;
    const res = await applyQuestOps([{ op: 'score', id, alignment: 9, reason: 'core' }]);
    assert.deepEqual(res.scored, [id]);
    const stored = await readSideQuests();
    assert.equal(stored[0].alignment, 9);
    assert.equal(stored[0].alignment_reason, 'core');
    assert.equal(stored[0].status, 'active');
  });
});

test('applyQuestOps: complete and drop are terminal', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 5, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 6, alignment_reason: 'r' } },
    ]);
    const [idA, idB] = add.added.map((q) => q.id);
    await applyQuestOps([{ op: 'complete', id: idA }, { op: 'drop', id: idB }]);
    const stored = await readSideQuests();
    const byId = Object.fromEntries(stored.map((q) => [q.id, q.status]));
    assert.equal(byId[idA], 'done');
    assert.equal(byId[idB], 'dropped');
  });
});

test('applyQuestOps: pin forces a quest active across recompute', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 8, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'C', description: 'd', alignment: 7, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'D', description: 'd', alignment: 1, alignment_reason: 'r' } },
    ]);
    const idD = add.added[3].id;
    await applyQuestOps([{ op: 'pin', id: idD }]);
    const stored = await readSideQuests();
    const byId = Object.fromEntries(stored.map((q) => [q.id, q.status]));
    assert.equal(byId[idD], 'active');
  });
});

test('applyQuestOps: unknown id on score is skipped, not thrown', async () => {
  await withTempHome(async () => {
    const { applyQuestOps } = await import('../sidequests.ts');
    const res = await applyQuestOps([{ op: 'score', id: 'sq-nope', alignment: 5, reason: 'r' }]);
    assert.deepEqual(res.scored, []);
  });
});

test('applyQuestOps: add then score the same quest works across batches', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, readSideQuests } = await import('../sidequests.ts');
    const add = await applyQuestOps([{ op: 'add', quest: { title: 'Q', description: 'd' } }]);
    const id = add.added[0].id;
    const res = await applyQuestOps([
      { op: 'add', quest: { title: 'Q2', description: 'd2' } },
      { op: 'score', id, alignment: 8, reason: 'evolved' },
    ]);
    assert.equal(res.scored.length, 1);
    const stored = await readSideQuests();
    const scored = stored.find((q) => q.id === id);
    assert.equal(scored?.alignment, 8);
    assert.equal(scored?.status, 'active');
  });
});

test('buildQuestsBlock: no main quest, no side quests', async () => {
  await withTempHome(async () => {
    const { buildQuestsBlock } = await import('../sidequests.ts');
    const block = await buildQuestsBlock();
    assert.match(block, /Main quest: \(not set\)/);
    assert.match(block, /Active side quests: \(none yet\)/);
  });
});

test('buildQuestsBlock: shows main quest, active ids, and parked count', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, buildQuestsBlock } = await import('../sidequests.ts');
    await applyQuestOps([
      { op: 'set_main', text: 'Ship the ZAO' },
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'core' } },
      { op: 'add', quest: { title: 'B', description: 'd', alignment: 7, alignment_reason: 'near' } },
      { op: 'add', quest: { title: 'C', description: 'd', alignment: 5, alignment_reason: 'some' } },
      { op: 'add', quest: { title: 'D', description: 'd', alignment: 2, alignment_reason: 'weak' } },
    ]);
    const block = await buildQuestsBlock();
    assert.match(block, /Main quest: Ship the ZAO/);
    assert.match(block, /Active side quests \(top 3 by alignment\)/);
    assert.match(block, /\[9\/10\] \(sq-.*\) A - core/);
    assert.match(block, /Parked \(1\):/);
  });
});

test('formatQuestList: includes parked and a done/dropped count', async () => {
  await withTempHome(async () => {
    const { applyQuestOps, formatQuestList } = await import('../sidequests.ts');
    const add = await applyQuestOps([
      { op: 'add', quest: { title: 'A', description: 'd', alignment: 9, alignment_reason: 'r' } },
      { op: 'add', quest: { title: 'B', description: 'd' } },
    ]);
    await applyQuestOps([{ op: 'complete', id: add.added[0].id }]);
    const out = await formatQuestList();
    assert.match(out, /B/);
    assert.match(out, /Done\/dropped: 1/);
  });
});
