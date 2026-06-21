import { test } from 'vitest';
import assert from 'node:assert/strict';

import { resolveRelayChatId } from '../relay.ts';
import type { GroupConfig } from '../groups.ts';
import type { BotRelayOp } from '../types.ts';

function group(chat_id: number, chat_title: string): GroupConfig {
  return { chat_id, chat_title } as GroupConfig;
}

function op(over: Partial<BotRelayOp> = {}): BotRelayOp {
  return { op: 'relay_to_bot', tag_bot: '@zabal_bonfire_bot', message: 'hi', ...over };
}

const GROUPS = [
  group(-100, 'ZAO Civilization'),
  group(-200, 'ZAO Devz'),
  group(-300, 'ZAO'),
];

// =========================
// resolveRelayChatId — doc 770 MED (exact match, not substring)
// =========================

test('exact title match wins (case-insensitive, trimmed)', () => {
  assert.equal(resolveRelayChatId(GROUPS, op({ to_group: 'ZAO Civilization' })), -100);
  assert.equal(resolveRelayChatId(GROUPS, op({ to_group: '  zao civilization  ' })), -100);
});

test('"ZAO" no longer matches "ZAO Devz"/"ZAO Civilization" by substring', () => {
  // The old substring match would first-match-win onto "ZAO Civilization".
  assert.equal(resolveRelayChatId(GROUPS, op({ to_group: 'ZAO' })), -300);
});

test('a non-existent group resolves to undefined (caller reports not-registered)', () => {
  assert.equal(resolveRelayChatId(GROUPS, op({ to_group: 'ZAO Stock' })), undefined);
});

test('explicit to_chat_id short-circuits the title lookup', () => {
  assert.equal(resolveRelayChatId(GROUPS, op({ to_chat_id: -999, to_group: 'ZAO Devz' })), -999);
});
