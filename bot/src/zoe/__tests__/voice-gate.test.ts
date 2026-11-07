// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { voiceGate } from '../owner-only';

describe('voiceGate', () => {
  it.each([
    ['Zaal in his DM', 'private', true, false, 'handle'],
    ['someone else in a DM', 'private', false, false, 'owner-line'],
    ['someone else in the ZAAL BOTZ group', 'supergroup', false, true, 'silent'],
    ['someone else in any other group (the ZAO Devz case)', 'supergroup', false, false, 'silent'],
    ['someone else in a basic group', 'group', false, false, 'silent'],
    ['someone else in a channel', 'channel', false, false, 'silent'],
    ['Zaal in the ZAAL BOTZ group', 'supergroup', true, true, 'handle'],
    ['Zaal in another group', 'supergroup', true, false, 'silent'],
  ] as const)('%s -> %s', (_label, chatType, fromZaal, isZaalBotz, expected) => {
    expect(voiceGate(chatType, fromZaal, isZaalBotz)).toBe(expected);
  });

  it('never sends the owner-only line outside a private chat', () => {
    for (const chatType of ['group', 'supergroup', 'channel']) {
      for (const isZaalBotz of [true, false]) {
        expect(voiceGate(chatType, false, isZaalBotz)).not.toBe('owner-line');
      }
    }
  });
});

/**
 * index.ts boots the poller on import (agent-loops.md rule 21), so the wiring is
 * checked in the source: inside the voice/audio handler the scope gate must run
 * before the owner gate. On origin/main before this change the first line of the
 * handler was `if (!(await ownerOnly(ctx))) return;`, which is the bug.
 */
describe('voice handler wiring in index.ts', () => {
  const src = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');
  const start = src.indexOf("bot.on(['message:voice', 'message:audio'], async (ctx) => {");
  const body = src.slice(start, src.indexOf('\n});', start));

  it('finds the handler', () => {
    expect(start).toBeGreaterThanOrEqual(0);
  });

  it('runs voiceGate before any ownerOnly call', () => {
    const gate = body.indexOf('voiceGate(');
    const owner = body.indexOf('ownerOnly(');
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(owner).toBeGreaterThan(gate);
  });

  it('calls ownerOnly only on the owner-line branch', () => {
    expect(body.match(/ownerOnly\(/g)?.length).toBe(1);
    expect(body).toMatch(/if \(gate === 'owner-line'\) \{\s*await ownerOnly\(ctx\);\s*return;\s*\}/);
  });
});

describe('newcomer welcome (ruling 300)', () => {
  const src = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');
  it('ZOE no longer greets each auto-allowlisted newcomer in the group', () => {
    expect(src).not.toContain('you can talk to me right here');
  });
  it('the allowlisting itself still happens', () => {
    expect(src).toContain('await addAllowlistMember(chatId, member.id);');
  });
});
