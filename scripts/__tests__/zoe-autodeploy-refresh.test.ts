import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// ZAOOS #4063: the VPS ran a hand-installed 2026-09-17 copy of zoe-autodeploy.sh for a
// month after v4 merged. v5 refreshes itself from origin/main; vps-staleness-check.sh
// reports a drifted script or a lagging clone. Both are run for real here, against
// scratch repos, with ~/bin/zao-status and flock stubbed. Nothing is restarted: every
// fixture's live clone is already at origin/main, so the deploy part exits at once.

const SCRIPT = path.resolve(__dirname, '../zoe-autodeploy.sh');
const CHECK = path.resolve(__dirname, '../vps-staleness-check.sh');
const REAL = fs.readFileSync(SCRIPT, 'utf8');
// biome-ignore lint/suspicious/noTemplateCurlyInString: a bash expansion, not a template
const STUB_NEW =
  '#!/bin/bash\n# carries the ZOE_AUTODEPLOY_SELF_REFRESH marker\necho "NEW RAN ${ZOE_AUTODEPLOY_REFRESHED:-0}"\n';

const git = (cwd: string, cmd: string) =>
  execSync(`git ${cmd}`, {
    cwd,
    shell: '/bin/bash',
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
    },
  }).trim();

// A bare origin whose scripts/zoe-autodeploy.sh is `originCopy`, a live clone at
// origin/main, and an installed copy at <home>/bin/zoe-autodeploy.sh.
function fixture(originCopy: string, installed: string = REAL) {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'autodeploy-refresh-'));
  const seed = path.join(t, 'seed');
  fs.mkdirSync(path.join(seed, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(seed, 'scripts/zoe-autodeploy.sh'), originCopy);
  git(t, 'init -q --bare -b main origin.git');
  git(seed, 'init -q -b main');
  git(seed, 'add -A');
  git(seed, 'commit -qm base');
  git(seed, `remote add origin ${JSON.stringify(path.join(t, 'origin.git'))}`);
  git(seed, 'push -q origin main');
  git(t, `clone -q ${JSON.stringify(path.join(t, 'origin.git'))} live`);
  fs.mkdirSync(path.join(t, 'bin'));
  fs.mkdirSync(path.join(t, 'stubs'));
  fs.writeFileSync(path.join(t, 'bin/zoe-autodeploy.sh'), installed, { mode: 0o755 });
  fs.writeFileSync(
    path.join(t, 'bin/zao-status'),
    `#!/bin/bash\necho "$*" >> ${JSON.stringify(path.join(t, 'status.log'))}\n`,
    { mode: 0o755 },
  );
  fs.writeFileSync(path.join(t, 'stubs/flock'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  return t;
}

function deploy(t: string, env: Record<string, string> = {}) {
  const r = spawnSync('bash', [path.join(t, 'bin/zoe-autodeploy.sh')], {
    cwd: t,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: t,
      PATH: `${path.join(t, 'stubs')}:${process.env.PATH}`,
      ZOE_AUTODEPLOY_LIVE: path.join(t, 'live'),
      ...env,
    },
  });
  const read = (f: string) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
  return {
    code: r.status,
    out: r.stdout,
    status: read(path.join(t, 'status.log')),
    installed: read(path.join(t, 'bin/zoe-autodeploy.sh')),
    leftovers: fs.readdirSync(path.join(t, 'bin')).filter((f) => f.includes('.new.')),
  };
}

describe('zoe-autodeploy v5: self-refresh from origin/main (#4063)', () => {
  it('installs origin/main\'s copy over a differing installed one and runs it once', () => {
    const r = deploy(fixture(STUB_NEW));
    expect(r.installed).toBe(STUB_NEW);
    expect(r.out).toContain('NEW RAN 1');
    expect(r.status).toContain('autodeploy updated itself to origin/main');
    expect(r.leftovers).toEqual([]);
  });

  it('an identical copy is left alone, silently', () => {
    const r = deploy(fixture(REAL));
    expect(r.code).toBe(0);
    expect(r.installed).toBe(REAL);
    expect(r.status).toBe('');
    expect(r.out).toBe('');
  });

  it('red: an origin copy that fails bash -n is refused, and this copy carries on', () => {
    const r = deploy(fixture('#!/bin/bash\n# ZOE_AUTODEPLOY_SELF_REFRESH\nif then fi\n'));
    expect(r.installed).toBe(REAL);
    expect(r.code).toBe(0);
    expect(r.status).toContain('autodeploy BLOCKED: origin/main\'s zoe-autodeploy.sh fails bash -n');
    expect(r.leftovers).toEqual([]);
  });

  it('red: an origin copy without the self-refresh marker is refused', () => {
    const r = deploy(fixture('#!/bin/bash\necho no marker\n'));
    expect(r.installed).toBe(REAL);
    expect(r.out).not.toContain('no marker');
    expect(r.status).toContain('lacks the self-refresh marker');
  });

  it('ZOE_AUTODEPLOY_SELF_REFRESH=0 turns it off', () => {
    const r = deploy(fixture(STUB_NEW), { ZOE_AUTODEPLOY_SELF_REFRESH: '0' });
    expect(r.installed).toBe(REAL);
    expect(r.status).toBe('');
  });

  it('a re-run that still differs is reported, never looped', () => {
    const r = deploy(fixture(STUB_NEW), { ZOE_AUTODEPLOY_REFRESHED: '1' });
    expect(r.installed).toBe(REAL);
    expect(r.status).toContain('still differs from origin/main after one self-refresh');
    expect(r.leftovers).toEqual([]);
  });

  it('the non-bot skip is on by default', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a bash expansion, not a template
    expect(REAL.split('${ZOE_AUTODEPLOY_SKIP_NONBOT:-1}').length - 1).toBe(2);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a bash expansion, not a template
    expect(REAL).not.toContain('${ZOE_AUTODEPLOY_SKIP_NONBOT:-0}');
  });
});

function check(t: string, env: Record<string, string>, args: string[] = []) {
  const r = spawnSync('bash', [CHECK, ...args], {
    cwd: t,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: t,
      ZOE_AUTODEPLOY_LIVE: path.join(t, 'live'),
      ZOE_AUTODEPLOY_INSTALLED: path.join(t, 'bin/zoe-autodeploy.sh'),
      ...env,
    },
  });
  const log = path.join(t, 'status.log');
  return { code: r.status, out: r.stdout, status: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
}

describe('vps-staleness-check.sh (#4063)', () => {
  // A second clone left 25 commits behind origin, as /home/zaal/zao-os was (355).
  function behind(t: string) {
    git(t, `clone -q ${JSON.stringify(path.join(t, 'origin.git'))} zao-os`);
    for (let i = 0; i < 25; i++) git(path.join(t, 'seed'), `commit -q --allow-empty -m c${i}`);
    git(path.join(t, 'seed'), 'push -q origin main');
    git(path.join(t, 'live'), 'pull -q --ff-only');
    return path.join(t, 'zao-os');
  }

  it('all current: OK, exit 0, no notice', () => {
    const t = fixture(REAL);
    const r = check(t, { VPS_STALE_CLONES: path.join(t, 'live') }, ['--notify']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^OK script: /m);
    expect(r.out).toMatch(/^OK clone: .* is 0 behind/m);
    expect(r.status).toBe('');
  });

  it('red: a drifted installed script is DRIFT, exit 1', () => {
    const t = fixture(STUB_NEW);
    const r = check(t, { VPS_STALE_CLONES: path.join(t, 'live') });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/^DRIFT script: /m);
  });

  it('red: a clone 25 behind is STALE at the default limit, and --notify says so', () => {
    const t = fixture(REAL);
    const old = behind(t);
    const r = check(t, { VPS_STALE_CLONES: `${path.join(t, 'live')} ${old}` }, ['--notify']);
    expect(r.code).toBe(1);
    expect(r.out).toContain(`STALE clone: ${old} is 25 commits behind origin/main (limit 20)`);
    expect(r.status).toContain('vps-staleness: STALE clone');
  });

  it('the same clone under a higher limit is OK', () => {
    const t = fixture(REAL);
    const old = behind(t);
    expect(check(t, { VPS_STALE_CLONES: old, VPS_STALE_MAX_BEHIND: '30' }).code).toBe(0);
  });

  it('a clone that is not a repository is UNKNOWN, exit 2, never OK', () => {
    const t = fixture(REAL);
    const r = check(t, { VPS_STALE_CLONES: path.join(t, 'nowhere') });
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/^UNKNOWN clone: /m);
  });

  it('a limit that is not a whole number is refused, exit 2', () => {
    const t = fixture(REAL);
    expect(check(t, { VPS_STALE_MAX_BEHIND: 'abc' }).code).toBe(2);
  });
});
