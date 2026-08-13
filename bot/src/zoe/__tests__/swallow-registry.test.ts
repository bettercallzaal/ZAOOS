/**
 * Swallow registry - every user-text matcher in index.ts must be declared.
 *
 * WHY THIS EXISTS
 *
 * index.ts is ~3700 lines with ~153 early-return branches and no routing
 * table. Routing is positional: whichever branch matches first by line number
 * wins and returns, so a broad matcher placed above a narrow one silently
 * makes the narrow one unreachable. That is not hypothetical - it happened
 * three times on 2026-08-08 (.claude/rules/first-handler-wins.md), and the
 * worst of them made the entire DM build vocabulary unreachable through its
 * own documented syntax while every existing test stayed green.
 *
 * Those tests stayed green because they import the extracted helpers
 * (isCommandPrefixed, detectBuildIntent, buildNotedAck) and assert the helper
 * is CORRECT. Nothing asserted the helper is REACHED. And nothing can, by the
 * usual route: agent-loops.md rule 21 forbids importing index.ts in a test,
 * because its top level boots a live poller and would collide with the running
 * instance.
 *
 * So this test reads index.ts as TEXT. It never imports it.
 *
 * WHAT IT ENFORCES
 *
 * Adding a new way to match user text in index.ts fails CI until you declare
 * it here - saying what it eats, whether its branch returns, and what it
 * excludes. The point is not that the declaration is checked for wisdom. The
 * point is that a human has to write down what the matcher swallows before it
 * can merge, which is exactly the step that was skipped three times.
 *
 * For matchers marked `broad`, the exclusion is checked in the source: the
 * named guard must actually appear next to the matcher. That is the specific
 * regression protection for the batch-answer guard that ate `build:`.
 *
 * WHAT IT DOES NOT COVER - read this before trusting it
 *
 * - Only index.ts. Other modules can swallow too.
 * - Only regex .test/.match and startsWith/includes/endsWith on a known set of
 *   user-text variable names. An `if (text === 'x') return;` or a matcher on a
 *   variable named something else is NOT detected.
 * - It does not prove ordering is correct. It proves ordering was considered.
 *
 * A registry that silently missed a case would be worse than none, so those
 * limits are stated rather than implied.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const INDEX_PATH = fileURLToPath(new URL('../index.ts', import.meta.url));
const SOURCE = readFileSync(INDEX_PATH, 'utf8');
const LINES = SOURCE.split('\n');

/** How far from a matcher an exclusion guard may sit and still count. */
const GUARD_WINDOW_BEFORE = 12;
const GUARD_WINDOW_AFTER = 4;

interface SwallowEntry {
  /** Matcher source text, whitespace-normalised. The key. */
  matcher: string;
  /** How many times it appears in index.ts. A new occurrence must be declared. */
  occurrences: number;
  /** What this matcher eats, in plain words. */
  why: string;
  /** Does the branch it gates END the request, so nothing downstream runs? */
  returns: boolean;
  /**
   * Broad = could match input meant for a DIFFERENT handler. A broad matcher
   * that returns MUST name its exclusions, and they are checked in source.
   */
  broad: boolean;
  /** Identifiers that must appear next to the matcher to narrow it. */
  excludes: string[];
}

/**
 * Measured from index.ts, not invented. Regenerate the key list by grepping
 * for the matcher forms below; do not hand-edit counts to make a test pass.
 */
const SWALLOW_REGISTRY: SwallowEntry[] = [
  {
    matcher: '/https?:\\/\\/\\S+/i.test(',
    occurrences: 3,
    why: 'Detects a URL. Used as a predicate in wantsLinkResearch, for media caption auto-route, and to decide whether an answered research DM also gets committed as a doc.',
    returns: false,
    broad: false,
    excludes: [],
  },
  {
    matcher: '.match(/^## /gm)',
    occurrences: 1,
    why: 'Counts markdown headings in a generated document. Not user text and gates no branch.',
    returns: false,
    broad: false,
    excludes: [],
  },
  {
    matcher: "text.startsWith('/')",
    occurrences: 1,
    why: 'Slash commands are registered with grammy above this point, so a message starting with / is already handled and returns here. Exact single-character prefix, intended terminal.',
    returns: true,
    broad: false,
    excludes: [],
  },
  {
    matcher: "text.includes(':')",
    occurrences: 1,
    why: 'First half of the batch-answer gate. Any message containing a colon is a batch-answer candidate, which is broad enough to have eaten the entire build vocabulary once.',
    returns: true,
    broad: true,
    excludes: ['isCommandPrefixed'],
  },
  {
    matcher: '/^\\d+:|^[a-z]+:/i.test(',
    occurrences: 1,
    why: 'Second half of the batch-answer gate. THIS IS THE ONE that made `build:` unreachable on 2026-08-08 - every command prefix is lowercase letters plus a colon. It must stay excluded by isCommandPrefixed.',
    returns: true,
    broad: true,
    excludes: ['isCommandPrefixed'],
  },
  {
    matcher: '/^\\s*([1-5]|done|keep|work|drop|skip)\\s*$/i.test(',
    occurrences: 1,
    why: 'Backlog-grill single-word answer. Anchored start-to-end so a sentence containing "done" is never eaten, and skipped entirely when the message is a reply.',
    returns: true,
    broad: true,
    excludes: ['reply_to_message', '^\\s*'],
  },
  {
    matcher: '.match(/th-[\\w-]+/gi)',
    occurrences: 1,
    why: 'Extracts thread ids from an already-matched untrack command. Operates on a capture group, not raw user text.',
    returns: false,
    broad: false,
    excludes: [],
  },
  {
    matcher: '/res[ae]arch/i.test(',
    occurrences: 1,
    why: 'Paired with the URL test to decide whether an already-answered private research DM also gets committed as a numbered doc. Fire-and-forget, gates no return.',
    returns: false,
    broad: false,
    excludes: [],
  },
];

// --- detection -------------------------------------------------------------

const DETECTORS: RegExp[] = [
  // a regex literal or a SCREAMING_RE constant, followed by .test(
  /(?:\/(?:[^/\n\\]|\\.)+\/[gimsuy]*|\b[A-Z][A-Z0-9_]*_RE\b)\s*\.test\(/g,
  // .match( with a regex literal
  /\.match\(\s*\/(?:[^/\n\\]|\\.)+\/[gimsuy]*\)?/g,
  // string matching on a known user-text variable
  /\b(?:text|lowerText|lowered|trimmed|body|caption)\s*\.\s*(?:startsWith|includes|endsWith)\(\s*(?:'[^']*'|"[^"]*"|`[^`]*`)\s*\)/g,
];

interface Site {
  key: string;
  line: number;
}

function detectSites(): Site[] {
  const sites: Site[] = [];
  for (const re of DETECTORS) {
    for (const m of SOURCE.matchAll(re)) {
      const line = SOURCE.slice(0, m.index).split('\n').length;
      sites.push({ key: m[0].replace(/\s+/g, ' ').trim(), line });
    }
  }
  return sites.sort((a, b) => a.line - b.line);
}

/**
 * Comments must not count as protection.
 *
 * The first version of this test did count them, and the negative proof caught
 * it: deleting `!isCommandPrefixed(text) &&` from index.ts left the test GREEN,
 * because the comment four lines above still said the word "isCommandPrefixed".
 * The test was reading documentation as if it were a guard - which is the exact
 * failure mode it exists to prevent. Strip comments before looking for a guard.
 */
function stripComments(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return '';
  // Trailing comment, but never the // inside a protocol or a regex literal.
  return line.replace(/(?<![:/\\])\/\/.*$/, '');
}

function windowAround(line: number): string {
  const from = Math.max(0, line - 1 - GUARD_WINDOW_BEFORE);
  const to = Math.min(LINES.length, line + GUARD_WINDOW_AFTER);
  return LINES.slice(from, to).map(stripComments).join('\n');
}

// --- the gate --------------------------------------------------------------

describe('swallow registry: index.ts cannot grow a new user-text matcher silently', () => {
  const sites = detectSites();
  const byKey = new Map<string, SwallowEntry>(SWALLOW_REGISTRY.map((e) => [e.matcher, e]));

  it('detects the matchers that are actually there (guards the detector itself)', () => {
    // If this drops to zero the detector broke and every other assertion below
    // would pass vacuously - a green test proving nothing.
    //
    // The floor was 12 and is now 10, because four command regexes
    // (FOCUS_ON_RE, FOCUS_OFF_RE, AUDIT_COMMAND_RE, BUDGET_COMMAND_RE) moved out
    // of index.ts into COMMAND_TABLE and are dispatched via classifyCommand.
    // Lowering this number is how a broken detector would hide, so it is only
    // ever moved together with a deliberate, named removal - never to make a
    // red test go green.
    expect(sites.length).toBeGreaterThanOrEqual(10);
  });

  it('every matcher in index.ts is declared in the registry', () => {
    const undeclared = [...new Set(sites.filter((s) => !byKey.has(s.key)).map((s) => s.key))];
    expect(
      undeclared,
      `New user-text matcher(s) in index.ts with no registry entry.\n` +
        `index.ts routes positionally - a broad matcher above a narrow one makes\n` +
        `the narrow one unreachable, silently. Declare what this eats in\n` +
        `SWALLOW_REGISTRY (matcher, why, returns, broad, excludes) before merging.\n` +
        `Undeclared: ${undeclared.join(' | ')}`,
    ).toEqual([]);
  });

  it('no stale registry entries - the list can reach zero drift', () => {
    // A registry that only ever grows becomes a list nobody trusts. If a
    // matcher is deleted from index.ts, its entry must go too.
    const present = new Set(sites.map((s) => s.key));
    const stale = SWALLOW_REGISTRY.filter((e) => !present.has(e.matcher)).map((e) => e.matcher);
    expect(stale, `Registry entries no longer in index.ts - delete them: ${stale.join(' | ')}`).toEqual([]);
  });

  it('occurrence counts match, so a new copy of an existing matcher is caught too', () => {
    const counted = new Map<string, number>();
    for (const s of sites) counted.set(s.key, (counted.get(s.key) ?? 0) + 1);
    const drift = SWALLOW_REGISTRY.filter((e) => (counted.get(e.matcher) ?? 0) !== e.occurrences).map(
      (e) => `${e.matcher} declared ${e.occurrences}, found ${counted.get(e.matcher) ?? 0}`,
    );
    expect(drift, `Occurrence drift:\n${drift.join('\n')}`).toEqual([]);
  });

  it('a returning matcher explains what it swallows', () => {
    const thin = SWALLOW_REGISTRY.filter((e) => e.returns && e.why.trim().length < 20).map((e) => e.matcher);
    expect(thin, `These end the request but do not say what they eat: ${thin.join(' | ')}`).toEqual([]);
  });

  it('a broad returning matcher names its exclusions', () => {
    const unguarded = SWALLOW_REGISTRY.filter((e) => e.broad && e.returns && e.excludes.length === 0).map(
      (e) => e.matcher,
    );
    expect(
      unguarded,
      `Broad matchers that end the request without naming an exclusion: ${unguarded.join(' | ')}`,
    ).toEqual([]);
  });

  it('declared exclusions actually appear beside the matcher in index.ts', () => {
    // The regression protection. On 2026-08-08 the batch guard was correctly
    // ORDERED and still ate `build:` - what it needed was an EXCLUSION. This
    // asserts the exclusion is really in the source, not just claimed here.
    const missing: string[] = [];
    for (const entry of SWALLOW_REGISTRY) {
      if (!entry.broad || entry.excludes.length === 0) continue;
      const occurrences = sites.filter((s) => s.key === entry.matcher);
      for (const token of entry.excludes) {
        const satisfied = occurrences.some((s) => windowAround(s.line).includes(token));
        if (!satisfied) missing.push(`${entry.matcher} -> missing guard "${token}"`);
      }
    }
    expect(missing, `Declared exclusions not found next to the matcher:\n${missing.join('\n')}`).toEqual([]);
  });
});

describe('the 2026-08-08 regression, asserted against live source', () => {
  it('the batch-answer gate is still excluded by isCommandPrefixed', () => {
    // Verbatim from first-handler-wins.md rule 5: the regression test uses the
    // input that actually failed, and here the source that actually failed.
    const idx = SOURCE.indexOf('/^\\d+:|^[a-z]+:/i.test(');
    expect(idx, 'the batch-answer regex is gone - if it moved, update this test deliberately').toBeGreaterThan(-1);
    const line = SOURCE.slice(0, idx).split('\n').length;
    expect(
      windowAround(line),
      'The batch-answer gate lost its isCommandPrefixed exclusion. This is the exact ' +
        'shape that made `build:` unreachable through its own documented syntax.',
    ).toContain('isCommandPrefixed');
  });
});
