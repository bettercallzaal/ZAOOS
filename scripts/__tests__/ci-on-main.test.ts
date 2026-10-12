/**
 * scripts/ci-on-main.sh - dispatch CI on main when its tip has no run.
 *
 * Runs the real script against a stub `gh` that serves canned API answers and
 * records every call. `jq` is the real one. What this cannot show is GitHub
 * itself: that workflow_run fires, and that a dispatch sent with the automatic
 * token starts a run. Those are only visible once the workflow is on main.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Each case starts bash, jq and a stub gh; on a loaded machine that outruns
// the 5 second default.
vi.setConfig({ testTimeout: 60_000 });

const ROOT = join(__dirname, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'ci-on-main.sh');
const WORKFLOW = readFileSync(join(ROOT, '.github/workflows/ci-after-automerge.yml'), 'utf8');

const TIP = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

interface RunRow {
  head_branch: string;
  event: string;
  status: string;
  conclusion: string | null;
}

const run = (
  event: string,
  conclusion: string | null,
  status = 'completed',
  head_branch = 'main',
): RunRow => ({
  head_branch,
  event,
  status,
  conclusion,
});

interface Stub {
  tip?: string;
  tipFail?: boolean;
  /** Runs reported for a commit before any dispatch. */
  before?: RunRow[];
  beforeFail?: boolean;
  /** Runs reported after a dispatch was sent. */
  after?: RunRow[];
  dispatchFail?: boolean;
}

interface Ran {
  status: number | null;
  calls: string[];
  log: string;
}

const STUB_GH = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_CALLS"
case "$*" in
  "api repos/owner/repo/commits/main --jq .sha")
    [ "$STUB_TIP_FAIL" = "1" ] && exit 1
    printf '%s\\n' "$STUB_TIP"; exit 0 ;;
  "api repos/owner/repo/actions/workflows/ci.yml/runs?head_sha="*)
    if [ -e "$STUB_CALLS.dispatched" ]; then cat "$STUB_AFTER"; exit 0; fi
    [ "$STUB_BEFORE_FAIL" = "1" ] && exit 1
    cat "$STUB_BEFORE"; exit 0 ;;
  "workflow run ci.yml --repo owner/repo --ref main")
    [ "$STUB_DISPATCH_FAIL" = "1" ] && exit 1
    touch "$STUB_CALLS.dispatched"; exit 0 ;;
  *) echo "stub gh: unexpected call: $*" >&2; exit 97 ;;
esac
`;

function exec(args: string[], stub: Stub = {}): Ran {
  const dir = mkdtempSync(join(tmpdir(), 'ci-on-main-'));
  const gh = join(dir, 'gh');
  writeFileSync(gh, STUB_GH);
  chmodSync(gh, 0o755);
  const calls = join(dir, 'calls');
  writeFileSync(calls, '');
  const before = join(dir, 'before.json');
  const after = join(dir, 'after.json');
  writeFileSync(before, JSON.stringify({ workflow_runs: stub.before ?? [] }));
  writeFileSync(after, JSON.stringify({ workflow_runs: stub.after ?? [] }));
  const r = spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    timeout: 45000,
    env: {
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      POLL_SECONDS: '0',
      POLL_TRIES: '2',
      STUB_CALLS: calls,
      STUB_TIP: stub.tip ?? TIP,
      STUB_TIP_FAIL: stub.tipFail ? '1' : '0',
      STUB_BEFORE: before,
      STUB_BEFORE_FAIL: stub.beforeFail ? '1' : '0',
      STUB_AFTER: after,
      STUB_DISPATCH_FAIL: stub.dispatchFail ? '1' : '0',
    },
  });
  return {
    status: r.status,
    calls: readFileSync(calls, 'utf8').split('\n').filter(Boolean),
    log: `${r.stdout}${r.stderr}`,
  };
}

const dispatched = (r: Ran) => r.calls.some((c) => c.startsWith('workflow run'));
const SEEN = [run('workflow_dispatch', null, 'queued')];

describe('a tip of main that already has a CI run is left alone', () => {
  it.each([
    ['a push run that passed', run('push', 'success')],
    ['a push run that failed', run('push', 'failure')],
    ['a dispatched run still in progress', run('workflow_dispatch', null, 'in_progress')],
    ['a scheduled run that is queued', run('schedule', null, 'queued')],
  ])('%s', (_name, row) => {
    const r = exec(['owner/repo'], { before: [row] });
    expect(r.status).toBe(0);
    expect(dispatched(r)).toBe(false);
    expect(r.log).toContain('already has 1 CI run(s)');
  });
});

describe('a tip of main with no real CI run gets one', () => {
  it.each([
    ['no runs at all', [] as RunRow[]],
    ['only a cancelled push run', [run('push', 'cancelled')]],
    ['only a skipped run', [run('push', 'skipped')]],
    ['only a timed-out run', [run('workflow_dispatch', 'timed_out')]],
    [
      'only a pull_request run on the same commit',
      [run('pull_request', 'success', 'completed', 'some-branch')],
    ],
    ['only a push run on another branch', [run('push', 'success', 'completed', 'not-main')]],
    [
      'only a pull_request run from a branch that is also called main',
      [run('pull_request', 'success')],
    ],
  ])('%s', (_name, before) => {
    const r = exec(['owner/repo'], { before, after: SEEN });
    expect(r.status).toBe(0);
    expect(dispatched(r)).toBe(true);
    expect(r.calls.filter((c) => c.startsWith('workflow run'))).toEqual([
      'workflow run ci.yml --repo owner/repo --ref main',
    ]);
    expect(r.log).toContain('now has 1 CI run(s)');
  });
});

describe('when it cannot look', () => {
  it('dispatches nothing and fails when the tip of main cannot be read', () => {
    const r = exec(['owner/repo'], { tipFail: true });
    expect(r.status).toBe(1);
    expect(dispatched(r)).toBe(false);
  });

  it('dispatches nothing and fails when the tip is not a commit id', () => {
    const r = exec(['owner/repo'], { tip: 'refs/heads/main' });
    expect(r.status).toBe(1);
    expect(dispatched(r)).toBe(false);
  });

  it('dispatches when the runs cannot be read, and says so', () => {
    const r = exec(['owner/repo'], { beforeFail: true, after: SEEN });
    expect(r.status).toBe(0);
    expect(dispatched(r)).toBe(true);
    expect(r.log).toContain('could not read the CI runs');
  });
});

describe('a dispatch is not believed until a run is seen', () => {
  it('fails when the dispatch is refused', () => {
    const r = exec(['owner/repo'], { dispatchFail: true });
    expect(r.status).toBe(1);
    expect(r.log).toContain('was refused');
  });

  it('fails when the dispatch is accepted and no run appears', () => {
    const r = exec(['owner/repo'], { before: [], after: [] });
    expect(r.status).toBe(1);
    expect(dispatched(r)).toBe(true);
    expect(r.log).toContain('no run appeared');
  });
});

describe('--dry-run', () => {
  it('says it would dispatch and sends nothing', () => {
    const r = exec(['owner/repo', '--dry-run'], { before: [] });
    expect(r.status).toBe(0);
    expect(dispatched(r)).toBe(false);
    expect(r.log).toContain('would dispatch ci.yml on main');
  });

  it('asks about a named commit with --sha, without reading the tip', () => {
    const r = exec(['owner/repo', '--dry-run', '--sha', OTHER], {
      before: [run('push', 'success')],
    });
    expect(r.status).toBe(0);
    expect(r.calls).toEqual([
      `api repos/owner/repo/actions/workflows/ci.yml/runs?head_sha=${OTHER}&per_page=100`,
    ]);
  });

  it('refuses --sha on a real run, and a short or odd commit id', () => {
    expect(exec(['owner/repo', '--sha', OTHER]).status).toBe(2);
    expect(exec(['owner/repo', '--dry-run', '--sha', 'abc123']).status).toBe(2);
    expect(exec([]).status).toBe(2);
    expect(exec(['owner/repo', '--force']).status).toBe(2);
  });
});

describe('the workflow that calls it', () => {
  it('runs on completed pull-request CI runs only, so its own dispatch cannot re-trigger it', () => {
    expect(WORKFLOW).toMatch(
      /on:\n {2}workflow_run:\n {4}workflows: \[CI\]\n {4}types: \[completed\]/,
    );
    expect(WORKFLOW).toContain("if: github.event.workflow_run.event == 'pull_request'");
  });

  it('holds only the two permissions it uses', () => {
    expect(WORKFLOW).toMatch(/\npermissions:\n {2}contents: read\n {2}actions: write\n\n/);
  });

  it('checks out main and passes nothing from the triggering run to the shell', () => {
    expect(WORKFLOW).toContain('ref: main');
    const uses = WORKFLOW.split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n')
      .match(/\$\{\{[^}]*\}\}/g);
    const open = '$' + '{{';
    expect(uses).toEqual([`${open} github.token }}`, `${open} github.repository }}`]);
  });
});
