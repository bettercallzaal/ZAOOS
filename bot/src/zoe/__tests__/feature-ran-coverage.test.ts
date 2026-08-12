/**
 * featureRan coverage - the autonomous path must be able to say it ran.
 *
 * WHY
 *
 * state-claims.md: "you cannot conclude a feature did NOT run from the absence
 * of log lines - unless you first prove it CAN log." Asked in August which of
 * eight shipped features had executed in production, seven days of journald
 * could not answer, because most of them contained no logging at all and the
 * rest spoke only from inside a catch. Silence meant "nothing crashed", never
 * "it ran".
 *
 * That gap matters most where nobody is watching. A feature Zaal triggers by
 * hand announces itself by replying to him. A feature that runs on a scheduler
 * at 4am does not, and its silence is indistinguishable from its death.
 *
 * So the rule this test enforces is narrow and stated: modules on the
 * AUTONOMOUS path must contain a featureRan call. Not every module - a
 * featureRan in all 127 would be the noise nobody greps, which
 * noisy-signal-guard.md warns is the same as no signal at all.
 *
 * The list can shrink as well as grow: a declared module that loses its call
 * fails here, so this cannot rot into a list that only ever gets longer.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { verifyReceipt } from '../bus-receipt';
import { announcedFeatures, featureRan, resetAnnouncedForTest } from '../feature-ran';

/**
 * Modules that do work with no human watching. Each must announce on its
 * success path.
 *
 * Deliberately NOT here: brief.ts and reflect.ts. They belong by the same rule,
 * but their success paths were not read when this landed, and a featureRan
 * placed in unread code would announce something other than what it claims.
 * Follow-up, not an oversight.
 */
const AUTONOMOUS_FEATURES = [
  'heart-run.ts',
  'bonfire-retry.ts',
  'receipts.ts',
  'bus-upload.ts',
  'bus-receipt.ts',
  'afferent-digest.ts',
  'recap.ts',
];

function sourceOf(file: string): string {
  return readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
}

/** A mention inside a comment is not a call. The swallow-registry test learned this the hard way. */
function hasRealCall(source: string): boolean {
  return source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    })
    .some((l) => /\bfeatureRan\s*\(/.test(l));
}

describe('featureRan coverage on the autonomous path', () => {
  it('every declared autonomous module calls featureRan outside a comment', () => {
    const missing = AUTONOMOUS_FEATURES.filter((f) => !hasRealCall(sourceOf(f)));
    expect(
      missing,
      `These run with nobody watching and cannot say they ran: ${missing.join(', ')}.\n` +
        `Add featureRan() on the SUCCESS path - not at import time, which only proves\n` +
        `the module loaded, the same empty proof a feature flag already gives.`,
    ).toEqual([]);
  });

  it('the call is on the success path, not only inside a catch', () => {
    // A module that speaks only when it fails tells you nothing when it works.
    const catchOnly: string[] = [];
    for (const f of AUTONOMOUS_FEATURES) {
      const src = sourceOf(f);
      const lines = src.split('\n');
      const callLines = lines
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => /\bfeatureRan\s*\(/.test(l) && !l.trim().startsWith('//'));
      const allInCatch = callLines.every(({ i }) => {
        // walk back to the nearest brace-opening construct
        for (let j = i; j >= 0 && i - j < 25; j--) {
          if (/\}\s*catch\s*\(/.test(lines[j])) return true;
          if (/^\s*(export\s+)?(async\s+)?function\b/.test(lines[j])) return false;
          if (/\btry\s*\{/.test(lines[j])) return false;
        }
        return false;
      });
      if (callLines.length > 0 && allInCatch) catchOnly.push(f);
    }
    expect(catchOnly, `featureRan only reachable from a catch block in: ${catchOnly.join(', ')}`).toEqual([]);
  });
});

describe('featureRan announces for real, not just in source', () => {
  beforeEach(() => resetAnnouncedForTest());

  it('verifyReceipt announces when called', () => {
    expect(announcedFeatures()).not.toContain('bus-receipt-verify');
    verifyReceipt({ messageId: 'm1', contentHash: 'abc' }, 'm1', 'abc');
    expect(announcedFeatures()).toContain('bus-receipt-verify');
  });

  it('CANNOT_VERIFY still counts as having run - a real outcome is not a failure to execute', () => {
    // The empty-hash case: '' === '' would have returned MATCH and proved nothing.
    // It now returns CANNOT_VERIFY, and the verifier still ran.
    const verdict = verifyReceipt({ messageId: 'm1', contentHash: '' }, 'm1', '');
    expect(verdict).toBe('CANNOT_VERIFY');
    expect(announcedFeatures()).toContain('bus-receipt-verify');
  });

  it('announces once per process, so a per-tick feature cannot flood the log', () => {
    featureRan('demo-feature', 'first');
    featureRan('demo-feature', 'second');
    featureRan('demo-feature', 'third');
    expect(announcedFeatures().filter((f) => f === 'demo-feature')).toHaveLength(1);
  });
});
