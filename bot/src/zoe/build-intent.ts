/**
 * build-intent.ts - decide whether a DM to ZOE is asking for CODE to be written.
 *
 * WHY THIS EXISTS (Zaal, 2026-08-07): "imma define the output of all you do for
 * the zoe from now on based on how im able to build using my telegram bot
 * conversation with you that is a 1/10".
 *
 * The 1/10 had a specific, verifiable cause. `dispatchHermesRun` - the
 * coder+critic auto-PR pipeline - had exactly ONE call site in index.ts, inside
 * the ZAAL BOTZ *group* handler, reached only when `routeTopic()` returned
 * `{kind:'coding'}` - which happens only for a forum topic literally named
 * "Coding". A plain DM went to `runConciergeTurn`, which talks and files tasks.
 * So the DM, the surface Zaal actually lives in, could not build anything. The
 * capability was not missing; it was wired to a room he was not standing in.
 *
 * This module is the missing classifier: given a DM, is he asking for code?
 *
 * IT IS DELIBERATELY CONSERVATIVE, and the asymmetry is the whole design. A
 * false negative costs one message ("build: <same thing>") and he gets his PR. A
 * false positive spins the coder against the repo over an offhand remark, burns
 * budget, and opens a junk PR - and after that happens twice he stops trusting
 * the feature, which is how we get back to 1/10 by a different route. Today's
 * sessions produced that lesson three separate times: a route detector that
 * cried wolf 35 times, a review flag that could never reach zero, and a
 * contradiction loop that would invent collisions on a four-note vault. A signal
 * that fires when it should not teaches you to ignore it.
 *
 * So: an EXPLICIT prefix always wins, a clear code-shaped request wins, and
 * everything ambiguous stays conversation.
 */

export type BuildConfidence = 'explicit' | 'likely';

export interface BuildIntent {
  /** true = route this to the coder pipeline instead of the concierge */
  build: boolean;
  confidence?: BuildConfidence;
  /** the text to hand the coder - the prefix stripped, if there was one */
  task?: string;
  /** why it matched or did not, for the reply and for the logs */
  reason: string;
}

/** `build:` / `code:` / `fix:` / `ship:` - the unambiguous escape hatch. Whatever
 *  follows is the task, verbatim. This is the documented way to force a build
 *  when the classifier would not have fired on its own. */
const EXPLICIT_PREFIX = /^\s*(build|code|fix|ship|implement)\s*:\s*(.+)$/is;

/** Verbs that ONLY ever describe code. Nobody refactors a morning routine or
 *  hotfixes a relationship, so these carry the whole signal on their own and do
 *  not need a matching noun - which matters, because a noun list can never cover
 *  every thing in the repo ("the surface map generator" is obviously code and
 *  "generator" will always be missing from somebody's list). */
const CODE_EXCLUSIVE_VERBS = ['refactor', 'hotfix', 'debug', 'typecheck', 'lint', 'redeploy'];

/** Verbs that mean "produce code" only when paired with something code-shaped.
 *  "add", "build" and "fix" are far too common in ordinary conversation to
 *  stand alone. */
const CODE_VERBS = [
  'add', 'build', 'implement', 'fix', 'rename', 'remove', 'delete',
  'wire', 'hook up', 'migrate', 'patch', 'rewrite', 'port', 'expose',
];

/** Nouns that mean the target is SOFTWARE. A generic verb alone is not enough -
 *  "build a morning routine" and "build a route" share a verb and nothing else. */
const CODE_NOUNS = [
  'route', 'endpoint', 'api', 'component', 'hook', 'function', 'method', 'module',
  'test', 'tests', 'migration', 'schema', 'column', 'table', 'query', 'button',
  'page', 'handler', 'script', 'command', 'flag', 'env var', 'type', 'interface',
  'bug', 'error', 'crash', 'typecheck', 'lint', 'ci', 'webhook', 'cron', 'cache',
  'parser', 'validator', 'middleware', 'repo', 'branch', 'pr',
  'generator', 'json', 'config', 'pipeline', 'worker', 'client', 'server',
  'import', 'imports', 'dependency', 'package', 'class', 'field', 'payload',
];

/** Phrases that look like a build but are a QUESTION, an OPINION, or a STATUS
 *  report. These veto a match even when a verb and a noun are both present. */
const NOT_A_BUILD = [
  'should we', 'should i', 'what should', 'do you think', 'thoughts on',
  'how do i', 'how would', 'can you explain', 'what is', "what's the",
  'why does', 'why is', 'is it worth', 'worth building', 'idea for',
  'did you', 'have you', 'the build failed', 'build failed', 'build is broken',
  'plan for', 'plan to', 'thinking about', 'brainstorm', 'compare',
];

/** Non-software things people "build" - present to make the failure mode explicit
 *  rather than accidental. */
const NOT_SOFTWARE = [
  'routine', 'habit', 'relationship', 'trust', 'audience', 'community',
  'brand', 'reputation', 'team', 'muscle', 'career', 'following',
];

const has = (haystack: string, needles: string[]): boolean =>
  needles.some((n) => haystack.includes(n));

/**
 * Classify one DM.
 *
 * Order matters and encodes the policy: an explicit prefix is Zaal overriding the
 * classifier and is honoured unconditionally. Everything after it is the
 * classifier being careful.
 */
export function detectBuildIntent(message: string): BuildIntent {
  const text = (message || '').trim();
  if (!text) return { build: false, reason: 'empty message' };

  // 1. The explicit prefix. Zaal typed it on purpose; do not second-guess it.
  const explicit = EXPLICIT_PREFIX.exec(text);
  if (explicit) {
    const task = explicit[2].trim();
    if (task.length < 8) {
      return { build: false, reason: `"${explicit[1]}:" with nothing after it` };
    }
    return {
      build: true,
      confidence: 'explicit',
      task,
      reason: `explicit "${explicit[1].toLowerCase()}:" prefix`,
    };
  }

  const lower = text.toLowerCase();

  // 2. Vetoes. A question about building is not a build request, and neither is
  //    a status report about one that already ran.
  const veto = NOT_A_BUILD.find((p) => lower.includes(p));
  if (veto) return { build: false, reason: `reads as a question or status ("${veto}")` };

  const soft = NOT_SOFTWARE.find((n) => lower.includes(n));
  if (soft) return { build: false, reason: `"${soft}" is not software` };

  // 3. A question mark almost always means he wants an answer, not a PR.
  if (lower.includes('?')) return { build: false, reason: 'it is a question' };

  // 4. Enough detail to act on, whichever path matches below. A coder given six
  //    words writes the wrong thing, and a wrong PR costs more than a question.
  const tooShort = text.length < 25;

  // 5a. A code-exclusive verb carries the signal alone. No noun list can cover
  //     every thing in a repo, and demanding one here is what made
  //     "refactor the surface map generator" fall through.
  const soleVerb = CODE_EXCLUSIVE_VERBS.find((v) => new RegExp(`\\b${v}\\b`, 'i').test(lower));
  if (soleVerb) {
    if (tooShort) return { build: false, reason: 'too short to build from - say what and where' };
    return { build: true, confidence: 'likely', task: text, reason: `"${soleVerb}" is code-only` };
  }

  // 5b. Otherwise: verb AND noun. Either alone is too weak - "add" appears in
  //     ordinary chat and "the api" appears in discussion. Together they
  //     describe a change to something that exists.
  const verb = CODE_VERBS.find((v) => new RegExp(`\\b${v}\\b`, 'i').test(lower));
  if (!verb) return { build: false, reason: 'no code verb' };

  const noun = CODE_NOUNS.find((n) => new RegExp(`\\b${n}\\b`, 'i').test(lower));
  if (!noun) return { build: false, reason: `verb "${verb}" but nothing code-shaped to act on` };

  if (tooShort) return { build: false, reason: 'too short to build from - say what and where' };

  return {
    build: true,
    confidence: 'likely',
    task: text,
    reason: `"${verb}" + "${noun}"`,
  };
}
