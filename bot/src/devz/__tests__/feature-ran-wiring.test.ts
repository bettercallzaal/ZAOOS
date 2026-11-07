import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * devz/index.ts boots two Telegram pollers at import time, so it must never be
 * imported in a test (agent-loops.md rule 21). These checks read the source
 * instead: each Devz entry point announces itself with featureRan, and each
 * call sits on the success path, after the work, never before a gate.
 */
const src = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');

function indexOfOnce(needle: string): number {
  const first = src.indexOf(needle);
  expect(first, `missing: ${needle}`).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(needle, first + 1), `more than once: ${needle}`).toBe(-1);
  return first;
}

describe('devz featureRan wiring', () => {
  it('imports the shared featureRan helper', () => {
    expect(src).toContain("import { featureRan } from '../zoe/feature-ran';");
  });

  it.each(['devz-fix', 'devz-run-finished', 'devz-hermes-dispatch'])('%s is announced exactly once', (name) => {
    indexOfOnce(`featureRan('${name}'`);
  });

  it('devz-fix-status is announced on each of its four success branches', () => {
    expect(src.match(/featureRan\('devz-fix-status'/g)?.length).toBe(4);
  });

  it('devz-fix fires after every kickOffFix gate and the acknowledgement', () => {
    const start = indexOfOnce('async function kickOffFix(');
    const ran = indexOfOnce("featureRan('devz-fix', source)");
    const ack = indexOfOnce("await ctx.reply('Got it. Spinning up the loop.");
    const lastGate = src.lastIndexOf("await ctx.reply('Cannot identify sender.');", ran);
    expect(start).toBeLessThan(lastGate);
    expect(lastGate).toBeLessThan(ack);
    expect(ack).toBeLessThan(ran);
  });

  it('both triggers pass their source', () => {
    indexOfOnce("await kickOffFix(ctx, text, 'command');");
    indexOfOnce("await kickOffFix(ctx, issue, 'mention');");
  });

  it('devz-run-finished fires only after dispatchHermesRun resolves, inside the try', () => {
    const dispatch = indexOfOnce('await dispatchHermesRun(input, buildNarrator());');
    const ran = indexOfOnce("featureRan('devz-run-finished')");
    const katch = src.indexOf('} catch (err) {', dispatch);
    expect(dispatch).toBeLessThan(ran);
    expect(ran).toBeLessThan(katch);
  });

  it('devz-hermes-dispatch fires after the 202 is written, not before auth', () => {
    const auth = indexOfOnce("res.end(JSON.stringify({ error: 'unauthorized' }));");
    const accepted = indexOfOnce('res.end(JSON.stringify({ accepted: true, doc, intent }));');
    const ran = indexOfOnce("featureRan('devz-hermes-dispatch', intent)");
    expect(auth).toBeLessThan(accepted);
    expect(accepted).toBeLessThan(ran);
  });
});
