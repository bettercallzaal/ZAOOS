// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FA_CALLBACK,
  faKeyboard,
  faStepText,
  faWalkthroughEnabled,
  nextStep,
  parseFaCallback,
  STEPS,
} from '../fa-walkthrough';

describe('faWalkthroughEnabled', () => {
  it('is on only for the literal 1', () => {
    expect(faWalkthroughEnabled({ ZOE_FA_WALKTHROUGH: '1' })).toBe(true);
    for (const v of [undefined, '', '0', 'true', 'yes', ' 1']) {
      expect(faWalkthroughEnabled({ ZOE_FA_WALKTHROUGH: v })).toBe(false);
    }
  });
});

describe('parseFaCallback', () => {
  it('reads a step and an action', () => {
    expect(parseFaCallback('fa:0:done')).toEqual({ step: 0, action: 'done' });
    expect(parseFaCallback('fa:3:back')).toEqual({ step: 3, action: 'back' });
  });

  it('refuses a step past the end, a bad action, and other prefixes', () => {
    expect(parseFaCallback(`fa:${STEPS.length}:done`)).toBeNull();
    expect(parseFaCallback('fa:2:skip')).toBeNull();
    expect(parseFaCallback('fa:-1:done')).toBeNull();
    expect(parseFaCallback('sl:h:7:2026-10-13')).toBeNull();
    expect(parseFaCallback('fax:1:done')).toBeNull();
  });
});

describe('nextStep', () => {
  it('Done moves forward and finishes after the last step', () => {
    expect(nextStep({ step: 0, action: 'done' })).toBe(1);
    expect(nextStep({ step: STEPS.length - 1, action: 'done' })).toBe('finished');
  });

  it('Back moves back and stops at the first step', () => {
    expect(nextStep({ step: 3, action: 'back' })).toBe(2);
    expect(nextStep({ step: 0, action: 'back' })).toBe(0);
  });

  it('walking Done from step 0 visits every step once, then finishes', () => {
    const seen: number[] = [0];
    let cur: number | 'finished' = 0;
    while (cur !== 'finished') {
      cur = nextStep({ step: cur, action: 'done' });
      if (cur !== 'finished') seen.push(cur);
    }
    expect(seen).toEqual(STEPS.map((_, i) => i));
  });
});

describe('faKeyboard', () => {
  it('step 1 has only Done; later steps have Back and Done', () => {
    expect(faKeyboard(0).inline_keyboard[0].map((b) => b.callback_data)).toEqual(['fa:0:done']);
    expect(faKeyboard(2).inline_keyboard[0].map((b) => b.callback_data)).toEqual(['fa:2:back', 'fa:2:done']);
  });

  it('every button it makes parses back, and fits the 64-byte Telegram limit', () => {
    for (let i = 0; i < STEPS.length; i++) {
      for (const b of faKeyboard(i).inline_keyboard.flat()) {
        expect(FA_CALLBACK.test(b.callback_data)).toBe(true);
        expect(parseFaCallback(b.callback_data)?.step).toBe(i);
        expect(Buffer.byteLength(b.callback_data)).toBeLessThanOrEqual(64);
      }
    }
  });

  it('the last step says it finishes', () => {
    expect(faKeyboard(STEPS.length - 1).inline_keyboard[0].at(-1)?.text).toBe('Done, finished');
  });
});

describe('step text', () => {
  it('numbers the step out of the total', () => {
    expect(faStepText(0)).toMatch(new RegExp(`^Fractured Atlas, step 1 of ${STEPS.length}: `));
  });

  it('fits a Telegram message and carries no em dash', () => {
    for (let i = 0; i < STEPS.length; i++) {
      expect(faStepText(i).length).toBeLessThan(4096);
      expect(faStepText(i)).not.toContain('\u2014');
    }
  });

  it('never tells Zaal ZOE will submit or pay for him', () => {
    const all = STEPS.map((s) => `${s.title} ${s.body}`).join(' ').toLowerCase();
    expect(all).not.toMatch(/\bi will (submit|pay|apply|sign)\b/);
  });
});

describe('index.ts wiring', () => {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const src = readFileSync(join(here, '..', 'index.ts'), 'utf8');

  it('registers /fa and the fa: handler above the generic text and callback routers', () => {
    const cmd = src.indexOf("bot.command('fa',");
    const cb = src.indexOf('bot.callbackQuery(FA_CALLBACK,');
    const genericCb = src.indexOf("bot.on('callback_query:data'");
    const genericText = src.indexOf("bot.on('message:text'");
    expect(cmd).toBeGreaterThan(-1);
    expect(cb).toBeGreaterThan(-1);
    expect(cb).toBeLessThan(genericCb);
    expect(cmd).toBeLessThan(genericText);
  });

  it('both handlers are owner-only and check the flag', () => {
    const block = src.slice(src.indexOf("bot.command('fa',"), src.indexOf('// Sleep check-in taps'));
    expect(block.match(/ownerOnly\(ctx\)/g)?.length).toBe(2);
    expect(block.match(/faWalkthroughEnabled\(\)/g)?.length).toBe(2);
  });
});
