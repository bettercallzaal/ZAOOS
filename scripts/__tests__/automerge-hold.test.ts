/**
 * The `hold` label on .github/workflows/docs-automerge.yml and licence-clear.yml.
 *
 * These tests run the workflow's OWN shell, lifted out of the YAML, against a
 * stub `gh` that records every call. So "a held PR is skipped, an unheld one is
 * armed" is asserted on the text that ships, not on a copy of it.
 *
 * What this cannot show: that GitHub delivers the labeled / unlabeled events, or
 * what the real `gh pr merge --disable-auto` returns. Those need a live PR.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Each case starts bash and a stub gh; on a loaded machine that outruns the
// 5 second default.
vi.setConfig({ testTimeout: 60_000 });

const ROOT = join(__dirname, '..', '..');
const AUTOMERGE = readFileSync(join(ROOT, '.github/workflows/docs-automerge.yml'), 'utf8');
const CLEAR = readFileSync(join(ROOT, '.github/workflows/licence-clear.yml'), 'utf8');

/** The lines of one step, from its `- name:` line to the next step. */
function stepLines(workflow: string, name: string): string[] {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => l.trim() === `- name: ${name}`);
  if (start < 0) throw new Error(`no step named "${name}"`);
  const out: string[] = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {6}- /.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out;
}

/** The body of a step's `run: |` block, dedented. */
function runBlock(workflow: string, name: string): string {
  const lines = stepLines(workflow, name);
  const at = lines.findIndex((l) => /^\s*run: \|\s*$/.test(l));
  if (at < 0) throw new Error(`step "${name}" has no run block`);
  const indent = lines[at].indexOf('run:') + 2;
  const body: string[] = [];
  for (const l of lines.slice(at + 1)) {
    if (l.trim() !== '' && l.search(/\S/) < indent) break;
    body.push(l.slice(indent));
  }
  return body.join('\n');
}

/** The `if:` expression of a step, joined onto one line. */
function stepIf(workflow: string, name: string): string {
  const lines = stepLines(workflow, name);
  const at = lines.findIndex((l) => /^\s*if: /.test(l));
  if (at < 0) return '';
  const indent = lines[at].search(/\S/);
  const body = [lines[at].trim()];
  for (const l of lines.slice(at + 1)) {
    if (l.search(/\S/) <= indent) break;
    body.push(l.trim());
  }
  return body.join(' ');
}

interface Stub {
  labels?: string[];
  labelsFail?: boolean;
  /** `.auto_merge == null` before any --disable-auto call. */
  offBefore?: 'true' | 'false';
  /** `.auto_merge == null` after a --disable-auto call. */
  offAfter?: 'true' | 'false';
  /** Raw JSON the comments endpoint returns (one page). */
  comments?: unknown[];
  commentsFail?: boolean;
  /** Raw JSON for `gh api repos/owner/repo/pulls/7` with no --jq. */
  pr?: unknown;
}

interface Ran {
  status: number | null;
  calls: string[];
  output: string;
  log: string;
}

const STUB_GH = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_CALLS"
case "$*" in
  *"/labels?per_page=100"*)
    [ "$STUB_LABELS_FAIL" = "1" ] && exit 1
    [ -n "$STUB_LABELS" ] && printf '%s\\n' "$STUB_LABELS"
    exit 0 ;;
  *"--disable-auto"*)
    touch "$STUB_CALLS.disabled"; exit 0 ;;
  *".auto_merge == null"*)
    if [ -e "$STUB_CALLS.disabled" ]; then echo "$STUB_OFF_AFTER"; else echo "$STUB_OFF_BEFORE"; fi
    exit 0 ;;
  *"-X POST"*"/comments"*)
    exit 0 ;;
  *"/comments?per_page=100"*)
    [ "$STUB_COMMENTS_FAIL" = "1" ] && exit 1
    printf '%s\n' "$STUB_COMMENTS"; exit 0 ;;
  "api repos/owner/repo/pulls/7")
    printf '%s\n' "$STUB_PR"; exit 0 ;;
  *) exit 0 ;;
esac
`;

function run(script: string, stub: Stub, env: Record<string, string> = {}): Ran {
  const dir = mkdtempSync(join(tmpdir(), 'automerge-hold-'));
  const gh = join(dir, 'gh');
  writeFileSync(gh, STUB_GH);
  chmodSync(gh, 0o755);
  const calls = join(dir, 'calls');
  const output = join(dir, 'output');
  writeFileSync(calls, '');
  writeFileSync(output, '');
  // -e matches the shell GitHub runs a `run:` block with.
  const r = spawnSync('bash', ['-e', '-c', script], {
    encoding: 'utf8',
    timeout: 45000,
    env: {
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      REPO: 'owner/repo',
      PR: '7',
      GITHUB_OUTPUT: output,
      STUB_CALLS: calls,
      STUB_LABELS: (stub.labels ?? []).join('\n'),
      STUB_LABELS_FAIL: stub.labelsFail ? '1' : '0',
      STUB_OFF_BEFORE: stub.offBefore ?? 'true',
      STUB_OFF_AFTER: stub.offAfter ?? 'true',
      STUB_COMMENTS: JSON.stringify(stub.comments ?? []),
      STUB_COMMENTS_FAIL: stub.commentsFail ? '1' : '0',
      STUB_PR: JSON.stringify(stub.pr ?? {}),
      ...env,
    },
  });
  return {
    status: r.status,
    calls: readFileSync(calls, 'utf8').split('\n').filter(Boolean),
    output: existsSync(output) ? readFileSync(output, 'utf8') : '',
    log: `${r.stdout}${r.stderr}`,
  };
}

const armed = (r: Ran) => r.calls.some((c) => c.includes('--squash --auto'));
const disarmed = (r: Ran) => r.calls.some((c) => c.includes('--disable-auto'));

const HOLD = runBlock(AUTOMERGE, 'Respect the hold label');
const ARM = runBlock(AUTOMERGE, 'Enable auto-merge (squash)');
const CLEAR_RUN = runBlock(CLEAR, 'Verify clearance and merge the verified head');

describe('the extraction itself', () => {
  it('lifts real shell out of both workflows', () => {
    expect(HOLD).toContain("grep -Eq '^hold(:.*)?$'");
    expect(ARM).toContain('gh pr merge "$PR" --repo "$REPO" --squash --auto');
    expect(CLEAR_RUN).toContain('--match-head-commit');
    // No ${{ }} inside the two docs-automerge blocks, or bash would not be
    // running what Actions runs.
    expect(HOLD).not.toContain('${{');
    expect(ARM).not.toContain('${{');
  });
});

describe('Respect the hold label', () => {
  it('reports not held when the PR has no hold label, and touches nothing', () => {
    const r = run(HOLD, { labels: ['documentation', 'hold:licence'] });
    expect(r.status).toBe(0);
    expect(r.output).toBe('held=false\n');
    expect(disarmed(r)).toBe(false);
    expect(armed(r)).toBe(false);
  });

  it('reports not held for a PR with no labels at all', () => {
    const r = run(HOLD, { labels: [] });
    expect(r.status).toBe(0);
    expect(r.output).toBe('held=false\n');
  });

  it('reports held and turns off an auto-merge that was already armed', () => {
    const r = run(HOLD, { labels: ['hold'], offBefore: 'false', offAfter: 'true' });
    expect(r.status).toBe(0);
    expect(r.output).toBe('held=true\n');
    expect(disarmed(r)).toBe(true);
    expect(armed(r)).toBe(false);
  });

  it('reports held and makes no merge call when nothing was armed', () => {
    const r = run(HOLD, { labels: ['x', 'hold'], offBefore: 'true' });
    expect(r.status).toBe(0);
    expect(r.output).toBe('held=true\n');
    expect(disarmed(r)).toBe(false);
  });

  it('fails when a held PR still shows auto-merge armed after the disable call', () => {
    const r = run(HOLD, { labels: ['hold'], offBefore: 'false', offAfter: 'false' });
    expect(r.status).toBe(1);
    expect(r.output).toBe('held=true\n');
    expect(r.log).toContain('could not be confirmed off');
  });

  it('treats labels it cannot read as held', () => {
    const r = run(HOLD, { labelsFail: true, offBefore: 'false', offAfter: 'true' });
    expect(r.output).toBe('held=true\n');
    expect(disarmed(r)).toBe(true);
    expect(r.log).toContain('could not read the labels');
  });

  it('matches the whole label name only', () => {
    for (const near of ['hold:licence', 'on-hold', 'holding', 'Hold']) {
      expect(run(HOLD, { labels: [near] }).output).toBe('held=false\n');
    }
  });

  it('runs before checkout and has no category condition', () => {
    const names = AUTOMERGE.split('\n')
      .filter((l) => /^ {6}- (name|uses): /.test(l))
      .map((l) => l.trim());
    expect(names[0]).toBe('- name: Respect the hold label');
    expect(stepIf(AUTOMERGE, 'Respect the hold label')).toBe('');
  });
});

describe('Enable auto-merge (squash)', () => {
  it('arms an unheld PR', () => {
    const r = run(ARM, { labels: ['documentation'] }, { HELD: 'false' });
    expect(r.status).toBe(0);
    expect(armed(r)).toBe(true);
  });

  it('does not arm when the hold step said held', () => {
    const r = run(ARM, { labels: [] }, { HELD: 'true' });
    expect(r.status).toBe(1);
    expect(armed(r)).toBe(false);
  });

  it('does not arm when the hold step wrote nothing', () => {
    const r = run(ARM, { labels: [] }, { HELD: '' });
    expect(r.status).toBe(1);
    expect(armed(r)).toBe(false);
  });

  it('does not arm when the label arrived after the hold step ran', () => {
    const r = run(ARM, { labels: ['hold'] }, { HELD: 'false' });
    expect(r.status).toBe(0);
    expect(armed(r)).toBe(false);
  });

  it('does not arm when the labels cannot be re-read', () => {
    const r = run(ARM, { labelsFail: true }, { HELD: 'false' });
    expect(r.status).toBe(1);
    expect(armed(r)).toBe(false);
  });

  it('is also gated in its if: on the hold step saying exactly false, the nightly gate and the verdict step exactly true', () => {
    const cond = stepIf(AUTOMERGE, 'Enable auto-merge (squash)');
    expect(cond).toMatch(
      /^if: \| steps\.hold\.outputs\.held == 'false' && steps\.nightly\.outputs\.ok == 'true' && steps\.verdict\.outputs\.ok == 'true' && \(/,
    );
    expect(cond.endsWith(')')).toBe(true);
  });
});

describe('the workflow wiring', () => {
  it('re-runs on a hold label (hold or hold:*) being added or removed, and on no other label', () => {
    expect(AUTOMERGE).toContain('types: [opened, synchronize, reopened, labeled, unlabeled]');
    const job = AUTOMERGE.slice(AUTOMERGE.indexOf('  automerge:'), AUTOMERGE.indexOf('    steps:'));
    expect(job.replace(/\s+/g, ' ')).toContain(
      "((github.event.action != 'labeled' && github.event.action != 'unlabeled') || github.event.label.name == 'hold' || startsWith(github.event.label.name, 'hold:'))",
    );
  });

  it('licence-clear reads the labels after every other check and before its merge', () => {
    const labels = CLEAR_RUN.indexOf("grep -Fxq 'hold'");
    const files = CLEAR_RUN.indexOf('files outside research/ and docs/');
    const merge = CLEAR_RUN.indexOf('gh pr merge');
    expect(labels).toBeGreaterThan(files);
    expect(merge).toBeGreaterThan(labels);
    expect(CLEAR_RUN.match(/gh pr merge/g)).toHaveLength(1);
  });
});

// ---- ZAOOS #4086: no auto-merge without a CLEAN seat verdict at the head, and any
// `hold:*` label holds. #4085 merged on 21 Oct with a hold label on and no verdict.
const HEAD = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const verdict = (who: string, sha: string, word: string, re = false) => ({
  user: { login: who },
  body: `Seat evaluator ${re ? 're-verdict' : 'verdict'} (fresh-context zao-evaluator), head ${sha}: **${word}**\n\ndetail`,
});
const marker = (sha: string, who = 'github-actions[bot]') => ({ user: { login: who }, body: `AUTOMERGE_ELIGIBLE_HEAD=${sha}` });
const openPr = { state: 'open', head: { sha: HEAD, repo: { full_name: 'owner/repo' } } };

const VERDICT = runBlock(AUTOMERGE, 'Require a CLEAN verdict at this head');
const MARK = runBlock(AUTOMERGE, 'Mark eligible for a verdict');
const ON_VERDICT = runBlock(AUTOMERGE, 'Arm a judged head on its CLEAN verdict');

describe('Respect the hold label: hold:* holds too (ZAOOS #4086)', () => {
  it('holds on any hold:* label', () => {
    for (const l of ['hold:review', 'hold:zaal', 'hold:']) {
      expect(run(HOLD, { labels: [l] }).output).toBe('held=true\n');
    }
  });
  it('leaves hold:licence to its own reset-and-rejudge path at this step', () => {
    expect(run(HOLD, { labels: ['hold:licence'] }).output).toBe('held=false\n');
    expect(run(HOLD, { labels: ['hold:licence', 'hold:zaal'] }).output).toBe('held=true\n');
  });
});

describe('Require a CLEAN verdict at this head', () => {
  const v = (comments: unknown[], stub: Stub = {}) => run(VERDICT, { comments, ...stub }, { HEAD_SHA: HEAD });
  it('is ok on a CLEAN verdict by bettercallzaal naming this head, and disarms nothing', () => {
    const r = v([verdict('bettercallzaal', HEAD, 'CLEAN')]);
    expect(r.status).toBe(0);
    expect(r.output).toBe('ok=true\n');
    expect(disarmed(r)).toBe(false);
  });
  it('accepts a re-verdict too', () => {
    expect(v([verdict('bettercallzaal', HEAD, 'CLEAN', true)]).output).toBe('ok=true\n');
  });
  it('ignores a verdict-shaped comment from any other author', () => {
    const r = v([verdict('outsider', HEAD, 'CLEAN')], { offBefore: 'false', offAfter: 'true' });
    expect(r.output).toBe('ok=false\n');
    expect(disarmed(r)).toBe(true);
  });
  it('ignores a CLEAN for another head', () => {
    expect(v([verdict('bettercallzaal', OLD, 'CLEAN')]).output).toBe('ok=false\n');
  });
  it('lets a newer NEEDS_WORK on the same head withdraw a CLEAN', () => {
    expect(v([verdict('bettercallzaal', HEAD, 'CLEAN'), verdict('bettercallzaal', HEAD, 'NEEDS_WORK', true)]).output).toBe('ok=false\n');
  });
  it('counts unreadable comments as no verdict, and takes off an earlier arming', () => {
    const r = v([], { commentsFail: true, offBefore: 'false', offAfter: 'true' });
    expect(r.output).toBe('ok=false\n');
    expect(disarmed(r)).toBe(true);
    expect(r.log).toContain('could not read the comments');
  });
  it('fails when no verdict and auto-merge cannot be confirmed off', () => {
    const r = v([], { offBefore: 'false', offAfter: 'false' });
    expect(r.status).toBe(1);
  });
  it('gates the arm step and the marker step in their if:', () => {
    expect(stepIf(AUTOMERGE, 'Enable auto-merge (squash)')).toContain("steps.verdict.outputs.ok == 'true'");
    expect(stepIf(AUTOMERGE, 'Mark eligible for a verdict')).toContain("steps.verdict.outputs.ok != 'true'");
  });
});

describe('Mark eligible for a verdict', () => {
  const posted = (r: Ran) => r.calls.filter((c) => c.includes('-X POST') && c.includes(`AUTOMERGE_ELIGIBLE_HEAD=${HEAD}`));
  it('posts the marker for this head once', () => {
    expect(posted(run(MARK, { comments: [] }, { HEAD_SHA: HEAD }))).toHaveLength(1);
  });
  it('does not post it again when the bot already did', () => {
    expect(posted(run(MARK, { comments: [marker(HEAD)] }, { HEAD_SHA: HEAD }))).toHaveLength(0);
  });
  it('does not count a marker typed by a lane', () => {
    expect(posted(run(MARK, { comments: [marker(HEAD, 'bettercallzaal')] }, { HEAD_SHA: HEAD }))).toHaveLength(1);
  });
});

describe('arm-on-verdict: arms a judged head on its CLEAN verdict, and nothing else', () => {
  const good = [marker(HEAD), verdict('bettercallzaal', HEAD, 'CLEAN')];
  const on = (stub: Stub) => run(ON_VERDICT, { pr: openPr, labels: ['documentation'], comments: good, ...stub });
  it('arms, pinned to the head, when every condition holds', () => {
    const r = on({});
    expect(r.status).toBe(0);
    expect(r.calls.some((c) => c.includes(`--squash --auto --match-head-commit ${HEAD}`))).toBe(true);
  });
  it('RED CONTROL: a held docs PR stays open (hold, hold:licence, hold:zaal)', () => {
    for (const l of ['hold', 'hold:licence', 'hold:zaal']) {
      expect(armed(on({ labels: [l] }))).toBe(false);
    }
    // Cut the label check out of the shipped block: the same held PR is now armed,
    // so it is that check, and nothing else, that keeps it open.
    const cut = ON_VERDICT.replace(/if printf '%s\\n' "\$names" \| grep -Eq '\^hold\(:\.\*\)\?\$'; then[\s\S]*?fi\n/, '');
    expect(cut).not.toBe(ON_VERDICT);
    expect(armed(run(cut, { pr: openPr, labels: ['hold'], comments: good }))).toBe(true);
  });
  it('does not arm when the labels cannot be read', () => {
    expect(armed(on({ labelsFail: true }))).toBe(false);
  });
  it('does not arm without the bot marker for this head', () => {
    expect(armed(on({ comments: [verdict('bettercallzaal', HEAD, 'CLEAN')] }))).toBe(false);
    expect(armed(on({ comments: [marker(OLD), verdict('bettercallzaal', HEAD, 'CLEAN')] }))).toBe(false);
    expect(armed(on({ comments: [marker(HEAD, 'bettercallzaal'), verdict('bettercallzaal', HEAD, 'CLEAN')] }))).toBe(false);
  });
  it('does not arm when the newest verdict at the head is not CLEAN, or is from someone else', () => {
    expect(armed(on({ comments: [...good, verdict('bettercallzaal', HEAD, 'NEEDS_WORK', true)] }))).toBe(false);
    expect(armed(on({ comments: [marker(HEAD), verdict('outsider', HEAD, 'CLEAN')] }))).toBe(false);
    expect(armed(on({ comments: [marker(HEAD), verdict('bettercallzaal', OLD, 'CLEAN')] }))).toBe(false);
  });
  it('does not arm a closed PR or one from a fork', () => {
    expect(armed(on({ pr: { ...openPr, state: 'closed' } }))).toBe(false);
    expect(armed(on({ pr: { ...openPr, head: { sha: HEAD, repo: { full_name: 'someone/fork' } } } }))).toBe(false);
  });
  it('runs only on a bettercallzaal comment that starts "Seat evaluator", on a PR', () => {
    const job = AUTOMERGE.slice(AUTOMERGE.indexOf('  arm-on-verdict:'));
    const cond = job.slice(0, job.indexOf('    steps:')).replace(/\s+/g, ' ');
    expect(cond).toContain("github.event_name == 'issue_comment'");
    expect(cond).toContain('github.event.issue.pull_request');
    expect(cond).toContain("github.event.comment.user.login == 'bettercallzaal'");
    expect(cond).toContain("startsWith(github.event.comment.body, 'Seat evaluator')");
  });
});
