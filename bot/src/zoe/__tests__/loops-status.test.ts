import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  stateEmoji,
  agoLabel,
  isStale,
  formatLoopsStatus,
  formatLoopDetail,
  type FleetStatus,
} from '../loops-status.ts';

const NOW = Date.parse('2026-07-17T10:00:00Z');
const sample: FleetStatus = {
  updated: '2026-07-17T09:59:00Z', // 60s ago
  loops: [
    { session: 'zoe', state: 'working', last: '  polling as @zaoclaw_bot   ' },
    { session: 'ww', state: 'idle', last: '' },
    { session: 'coc', state: 'dead', last: 'crashed' },
  ],
};

test('stateEmoji maps known states + falls back', () => {
  assert.equal(stateEmoji('working'), '🟢');
  assert.equal(stateEmoji('IDLE'), '🟡');
  assert.equal(stateEmoji('dead'), '🔴');
  assert.equal(stateEmoji('whatever'), '⚪');
});

test('agoLabel: seconds / minutes / hours / invalid', () => {
  assert.equal(agoLabel('2026-07-17T09:59:00Z', NOW), '60s ago');
  assert.equal(agoLabel('2026-07-17T09:50:00Z', NOW), '10m ago');
  assert.equal(agoLabel('2026-07-17T07:00:00Z', NOW), '3h ago');
  assert.equal(agoLabel('not-a-date', NOW), 'unknown');
});

test('isStale: fresh vs >10min vs invalid', () => {
  assert.equal(isStale('2026-07-17T09:59:00Z', NOW), false);
  assert.equal(isStale('2026-07-17T09:45:00Z', NOW), true); // 15m
  assert.equal(isStale('bad', NOW), true);
});

test('formatLoopsStatus: null -> warning', () => {
  const out = formatLoopsStatus(null, NOW);
  assert.match(out, /No fleet status available/);
});

test('formatLoopsStatus: one line per loop, emoji, trimmed last, footer', () => {
  const out = formatLoopsStatus(sample, NOW);
  assert.match(out, /Fleet loops \(updated 60s ago\)/);
  assert.match(out, /🟢 zoe: working — polling as @zaoclaw_bot/);
  assert.match(out, /🟡 ww: idle$/m); // empty last => no tail
  assert.match(out, /🔴 coc: dead — crashed/);
  assert.match(out, /Use \/loop <name> for detail\./);
});

test('formatLoopsStatus: stale fleet flagged', () => {
  const stale = { ...sample, updated: '2026-07-17T09:40:00Z' }; // 20m
  assert.match(formatLoopsStatus(stale, NOW), /⚠️ STALE/);
});

test('formatLoopsStatus: empty loops', () => {
  assert.match(formatLoopsStatus({ updated: sample.updated, loops: [] }, NOW), /no loops reporting/);
});

test('formatLoopDetail: known loop shows state + last line', () => {
  const out = formatLoopDetail(sample, 'zoe', NOW);
  assert.match(out, /Loop: zoe/);
  assert.match(out, /State: working/);
  assert.match(out, /Last line: polling as @zaoclaw_bot/);
});

test('formatLoopDetail: case-insensitive match', () => {
  assert.match(formatLoopDetail(sample, 'WW', NOW), /Loop: ww/);
});

test('formatLoopDetail: unknown name lists loops', () => {
  const out = formatLoopDetail(sample, 'nope', NOW);
  assert.match(out, /No loop named "nope"/);
  assert.match(out, /zoe, ww, coc/);
});

test('formatLoopDetail: no name -> usage + loop list', () => {
  assert.match(formatLoopDetail(sample, '', NOW), /Usage: \/loop <name>/);
});

test('formatLoopDetail: empty last -> placeholder', () => {
  assert.match(formatLoopDetail(sample, 'ww', NOW), /Last line: \(no recent output line\)/);
});

test('formatLoopDetail: null data -> warning', () => {
  assert.match(formatLoopDetail(null, 'zoe', NOW), /No fleet status available/);
});
