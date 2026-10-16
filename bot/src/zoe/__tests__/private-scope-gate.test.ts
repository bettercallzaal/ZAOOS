/**
 * Only Zaal reaches the private concierge scope.
 *
 * The private scope carries Zaal's memory, the DM build and the bus reply path.
 * A plain DM from anyone else is stopped by ownerOnly in index.ts; /ask in a
 * private chat used to call dispatchConcierge(..., "private", ...) with no such
 * gate. index.ts cannot be imported in a test (agent-loops.md rule 21: its top
 * level starts a live poller), so the wiring is asserted on its SOURCE, read as
 * text, the same way command-routing-order.test.ts does.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { privateScopeAllowed } from '../owner-only';

const INDEX_SOURCE = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');

/** The body of a handler or function: from its opening line to the next top-level close. */
function block(startMarker: string): string {
  const start = INDEX_SOURCE.indexOf(startMarker);
  expect(start, `marker not found: ${startMarker}`).toBeGreaterThanOrEqual(0);
  const end = INDEX_SOURCE.indexOf('\n}', start);
  return INDEX_SOURCE.slice(start, end);
}

describe('privateScopeAllowed', () => {
  it.each([
    ['private', true, true],
    ['private', false, false],
    ['-100123', false, true],
    ['-100123', true, true],
  ])('scope %s fromZaal=%s -> %s', (scope, fromZaal, expected) => {
    expect(privateScopeAllowed(scope, fromZaal)).toBe(expected);
  });
});

describe('index.ts wiring', () => {
  it('/ask in a private chat runs the owner gate before the private concierge', () => {
    const ask = block('bot.command("ask"');
    const gate = ask.indexOf('ownerOnly(ctx)');
    const dispatch = ask.indexOf('dispatchConcierge(ctx, prompt, "private"');
    expect(dispatch).toBeGreaterThan(0);
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(dispatch);
  });

  it('dispatchConcierge refuses the private scope for a non-owner before any work', () => {
    const fn = block('async function dispatchConcierge(');
    const guard = fn.indexOf('privateScopeAllowed(scope, isFromZaal(ctx))');
    expect(guard).toBeGreaterThan(0);
    // Ahead of the first thing that could act on the message.
    for (const later of ['ZOE_DM_BUILD', 'parseBusReply', 'startProgressNarration', 'buildMemoryBlocks']) {
      const at = fn.indexOf(later);
      if (at >= 0) expect(guard, later).toBeLessThan(at);
    }
  });

  it('every direct private dispatchConcierge call sits in a gated handler', () => {
    const calls = [...INDEX_SOURCE.matchAll(/dispatchConcierge\(ctx, [^,]+, ["']private["']/g)].map((m) => m.index ?? 0);
    expect(calls.length).toBeGreaterThan(0);
    for (const at of calls) {
      // Walk back to the enclosing top-level handler or function.
      const head = Math.max(INDEX_SOURCE.lastIndexOf('\nbot.', at), INDEX_SOURCE.lastIndexOf('\nasync function ', at));
      const body = INDEX_SOURCE.slice(head, at);
      // handlePrivateMessage is only ever enqueued behind ownerOnly/isFromZaal; it
      // labels the sender 'Zaal'. Any other host must gate inline.
      const gated = /ownerOnly\(ctx\)|isFromZaal\(ctx\)/.test(body) || body.startsWith('\nasync function handlePrivateMessage');
      expect(gated, INDEX_SOURCE.slice(head, head + 60)).toBe(true);
    }
  });
});
