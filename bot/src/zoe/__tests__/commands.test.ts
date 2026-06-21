import { test } from 'vitest';
import assert from 'node:assert/strict';

import { isZoeCommand, NOTE_PREFIX, PLAN_PREFIX } from '../commands.ts';

// =========================
// isZoeCommand — doc 770 H1 regression
// A command sent during the evening-reflection window MUST be recognized so
// handlePrivateMessage lets it through instead of swallowing it as the
// reflection answer.
// =========================

test('plan: / decompose: are commands (bypass await-reflection capture)', () => {
  for (const t of [
    'plan: ship the onepager and post it',
    'decompose: research pricing then draft a brief',
    'PLAN: do the thing', // case-insensitive
    'plan:\nmulti-line goal body', // dotall — body can span lines
  ]) {
    assert.equal(isZoeCommand(t), true, `"${t}" should be a command`);
  }
});

test('note: / cc: / claude: are commands', () => {
  for (const t of ['note: remember this', 'cc: idea for later', 'claude: fix the build']) {
    assert.equal(isZoeCommand(t), true, `"${t}" should be a command`);
  }
});

test('nudge toggles are commands', () => {
  for (const t of ['stop nudges', 'start nudges', 'pause tips', 'resume tip', 'disable nudge']) {
    assert.equal(isZoeCommand(t), true, `"${t}" should be a command`);
  }
});

test('a real reflection answer is NOT a command (still gets captured)', () => {
  for (const t of [
    'today went well, shipped the relay and felt good about it',
    'I struggled with focus this afternoon',
    'biggest win was closing the audit',
    'planning to rest tomorrow', // "planning" must not match the plan: prefix
    'noted, will circle back', // "noted" must not match the note: prefix
    '',
  ]) {
    assert.equal(isZoeCommand(t), false, `"${t}" should NOT be a command`);
  }
});

test('prefix regexes capture the body in group 2', () => {
  assert.equal(PLAN_PREFIX.exec('plan: do X')?.[2], 'do X');
  assert.equal(NOTE_PREFIX.exec('note: do Y')?.[2], 'do Y');
});
