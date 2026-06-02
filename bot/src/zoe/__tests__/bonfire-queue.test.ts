import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseSubmission,
  buildEpisode,
  isBonfireSteward,
  renderSubmission,
  type BonfireSubmission,
} from '../bonfire-queue.ts';

const valid: BonfireSubmission = {
  id: 'zg-1748736000000-abc',
  fid: 19640,
  username: 'bettercallzaal',
  type: 'project',
  title: 'WaveWarZ v2',
  body: 'Building the bracket engine.',
  url: 'https://example.com/x',
  source: 'zabalgames-web',
  status: 'pending',
  ts: 1748736000000,
};

test('parseSubmission accepts a well-formed item', () => {
  const s = parseSubmission(JSON.stringify(valid));
  assert.ok(s);
  assert.equal(s.type, 'project');
  assert.equal(s.fid, 19640);
  assert.equal(s.title, 'WaveWarZ v2');
});

test('parseSubmission rejects bad type / empty body / junk', () => {
  assert.equal(parseSubmission(JSON.stringify({ ...valid, type: 'spam' })), null);
  assert.equal(parseSubmission(JSON.stringify({ ...valid, body: '   ' })), null);
  assert.equal(parseSubmission(JSON.stringify({ ...valid, id: 123 })), null); // id must be string
  assert.equal(parseSubmission('not json'), null);
});

test('parseSubmission coerces a string fid + defaults username', () => {
  const s = parseSubmission(JSON.stringify({ ...valid, fid: '777', username: undefined }));
  assert.ok(s);
  assert.equal(s.fid, 777);
  assert.equal(s.username, null);
});

test('buildEpisode adds provenance + a stable name + title head', () => {
  const ep = buildEpisode(valid);
  assert.equal(ep.name, 'zg-submission:project:zg-1748736000000-abc');
  assert.equal(ep.sourceTag, 'zabalgames-web');
  assert.match(ep.body, /^WaveWarZ v2/); // title heads the body
  assert.match(ep.body, /Building the bracket engine\./);
  assert.match(ep.body, /Reference: https:\/\/example\.com\/x/);
  assert.match(ep.body, /Submitted by @bettercallzaal \(fid 19640\) via ZABAL Gamez, \d{4}-\d{2}-\d{2}/);
});

test('buildEpisode falls back to fid when no username', () => {
  const ep = buildEpisode({ ...valid, username: null });
  assert.match(ep.body, /Submitted by fid 19640/);
});

test('isBonfireSteward reads the env allowlist', () => {
  process.env.BONFIRE_STEWARD_FIDS = '19640, 42';
  assert.equal(isBonfireSteward(19640), true);
  assert.equal(isBonfireSteward(42), true);
  assert.equal(isBonfireSteward(99), false);
  delete process.env.BONFIRE_STEWARD_FIDS;
  assert.equal(isBonfireSteward(19640), false);
});

test('renderSubmission shows who, body, and the y/n prompt', () => {
  const text = renderSubmission({ item: valid, raw: '{}' }, 3);
  assert.match(text, /3 in queue/);
  assert.match(text, /@bettercallzaal \(fid 19640\)/);
  assert.match(text, /Building the bracket engine/);
  assert.match(text, /Reply "y" to promote/);
});
