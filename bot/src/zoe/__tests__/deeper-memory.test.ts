import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readDecisions, readBuildState, appendDecision, appendBuildState } from '../memory';
import type { DecisionRecord, BuildStateRecord } from '../types';

test('appendDecision creates record with timestamp + id', async () => {
  const before = Date.now();
  await appendDecision({
    decision: 'Ship WaveWarZ on Solana mainnet',
    rationale: 'Protocol is stable, community wants it',
    context: 'After 2 weeks of testnet',
  });
  const after = Date.now();

  const records = await readDecisions(1);
  assert.equal(records.length, 1);
  const r = records[0] as DecisionRecord;
  assert.equal(r.decision, 'Ship WaveWarZ on Solana mainnet');
  assert.equal(r.rationale, 'Protocol is stable, community wants it');
  assert.equal(r.context, 'After 2 weeks of testnet');
  assert.match(r.id, /^dec-\d+-[a-z0-9]+$/);
  const ts = Date.parse(r.created_at);
  assert.ok(ts >= before && ts <= after, 'timestamp is recent');
});

test('readDecisions returns most recent first', async () => {
  // Append 3 decisions
  await appendDecision({ decision: 'First', rationale: 'R1' });
  await appendDecision({ decision: 'Second', rationale: 'R2' });
  await appendDecision({ decision: 'Third', rationale: 'R3' });

  const records = await readDecisions(3);
  assert.ok(records.length >= 3, 'at least 3 records');
  // Most recent first
  assert.equal(records[0]?.decision, 'Third');
  assert.equal(records[1]?.decision, 'Second');
  assert.equal(records[2]?.decision, 'First');
});

test('readDecisions respects limit', async () => {
  const records = await readDecisions(2);
  assert.ok(records.length <= 2, 'limit is respected');
});

test('appendBuildState creates record with timestamp + id', async () => {
  const before = Date.now();
  await appendBuildState({
    feature: 'WaveWarZ-v2',
    status: 'in-review',
    pr: '1250',
    branch: 'ws/wavewarz-v2',
    reason: 'Awaiting security audit completion',
  });
  const after = Date.now();

  const records = await readBuildState(1);
  assert.equal(records.length, 1);
  const r = records[0] as BuildStateRecord;
  assert.equal(r.feature, 'WaveWarZ-v2');
  assert.equal(r.status, 'in-review');
  assert.equal(r.pr, '1250');
  assert.equal(r.branch, 'ws/wavewarz-v2');
  assert.equal(r.reason, 'Awaiting security audit completion');
  assert.match(r.id, /^build-\d+-[a-z0-9]+$/);
  const ts = Date.parse(r.created_at);
  assert.ok(ts >= before && ts <= after, 'timestamp is recent');
});

test('readBuildState returns most recent first', async () => {
  // Append 3 build-state entries
  await appendBuildState({ feature: 'F1', status: 'open' });
  await appendBuildState({ feature: 'F2', status: 'open' });
  await appendBuildState({ feature: 'F3', status: 'shipped' });

  const records = await readBuildState(3);
  assert.ok(records.length >= 3, 'at least 3 records');
  // Most recent first
  assert.equal(records[0]?.feature, 'F3');
  assert.equal(records[1]?.feature, 'F2');
  assert.equal(records[2]?.feature, 'F1');
});

test('readBuildState returns empty array if file missing', async () => {
  const records = await readBuildState();
  assert.ok(Array.isArray(records), 'always returns array');
});

test('readDecisions returns empty array if file missing', async () => {
  const records = await readDecisions();
  assert.ok(Array.isArray(records), 'always returns array');
});
