#!/usr/bin/env node
/**
 * scripts/zoe/nightly-check.mjs - the PR-side gate for the ZOE nightly
 * processing run's docs/daily files.
 *
 * nightly-dates.mjs (card 9919) and nightly-redact.mjs (#3957) are correct and
 * tested, but the run is a cloud scheduled session whose prompt is not in this
 * repo, and it never calls them. Measured 2026-10-19 on gh:
 *   - #4005, opened 2026-10-18T03:10:06Z (23:10 EDT Saturday 17 October), added
 *     2026-10-18-captures.md and 2026-10-19-briefing.md: one day ahead.
 *   - #4034, opened 2026-10-19T03:07:54Z (23:07 EDT Sunday 18 October), added
 *     2026-10-19-captures.md and 2026-10-20-briefing.md: one day ahead, and the
 *     night it covered was already on main under #4005's wrong labels.
 *   - Every nightly file since 2026-10-16 carries em dashes. 2026-10-15 had none
 *     only because #3957 scrubbed docs/daily on main that day.
 * A helper nobody calls fixes nothing, so this check fails the PR instead.
 *
 * For each docs/daily/YYYY-MM-DD-<kind>.md the PR adds, three problems:
 *   date       the date is not the one nightly-dates gives for the PR's open time
 *   duplicate  the file the run should have written is already on the base
 *   redact     the content still carries a nightly-redact class (dashes, paths...)
 *
 * Usage (CI):
 *   node scripts/zoe/nightly-check.mjs --instant <PR created_at> --base <ref>
 * Exit 0 clean or nothing to check, 1 problems found, 2 could not check.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { nightlyDates } from './nightly-dates.mjs';
import { remaining } from './nightly-redact.mjs';

const NIGHTLY = /^docs\/daily\/(\d{4}-\d{2}-\d{2})-(captures|briefing|newsletter|tasks)\.md$/;

/**
 * Pure. added: [{ path, content }]; baseHas(path) -> boolean; instant: when the
 * run opened its PR. Returns [{ path, kind, detail }], empty when clean.
 */
export function checkNightly({ added, baseHas, instant }) {
  const d = nightlyDates(instant);
  const problems = [];
  for (const { path, content } of added) {
    const m = NIGHTLY.exec(path);
    if (!m) continue;
    const [, date, kind] = m;
    const want = kind === 'captures' ? d.captures : d.briefing;
    const expectedPath = `docs/daily/${want}-${kind}.md`;
    if (date !== want) {
      problems.push({
        path,
        kind: 'date',
        detail: `dated ${date}, the ${d.tz} date for this run is ${want} (${expectedPath})`,
      });
    }
    if (baseHas(expectedPath)) {
      problems.push({
        path,
        kind: 'duplicate',
        detail: `${expectedPath} is already on the base branch, so this night was already published`,
      });
    }
    const left = remaining(content);
    if (left.length > 0) {
      problems.push({
        path,
        kind: 'redact',
        detail: `still carries ${left.join(', ')}; run node scripts/zoe/nightly-redact.mjs on it`,
      });
    }
  }
  return problems;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const instant = arg('--instant');
  const base = arg('--base');
  if (!instant || !base) {
    console.error('usage: nightly-check.mjs --instant <ISO-8601> --base <ref>');
    return 2;
  }
  let paths;
  try {
    paths = git(['diff', '--name-only', '--diff-filter=A', `${base}...HEAD`, '--', 'docs/daily'])
      .split('\n')
      .filter((p) => NIGHTLY.test(p));
  } catch (e) {
    // Fail closed: an empty list from a git error would read as "clean".
    console.error(`nightly-check: git diff failed, cannot check: ${e.message}`);
    return 2;
  }
  if (paths.length === 0) {
    console.log('No nightly docs/daily files added. Nothing to check.');
    return 0;
  }
  const baseHas = (p) => {
    try {
      execFileSync('git', ['cat-file', '-e', `${base}:${p}`], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  const added = paths.map((path) => ({ path, content: readFileSync(path, 'utf8') }));
  const problems = checkNightly({ added, baseHas, instant });
  for (const p of problems) console.log(`::error title=nightly ${p.kind}::${p.path}: ${p.detail}`);
  if (problems.length > 0) {
    console.log('Fix: see docs/daily/README.md, "The line the routine prompt needs".');
    return 1;
  }
  console.log(`Checked ${paths.length} nightly file(s): dates, duplicates and redaction clean.`);
  return 0;
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) process.exit(main(process.argv.slice(2)));
