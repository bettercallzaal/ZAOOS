/**
 * radar-pick.py in throwaway repos. Card 10460: the daily Research Radar picked
 * doc 694 on 2026-10-15, 16 and 17, because the first two PRs were closed
 * unmerged and main kept its old last-validated date.
 *
 * The verbatim case is the 2026-10-17 state: 694 is the oldest, and
 * ws/radar-694-2026-10-15 and ws/radar-694-2026-10-16 exist on origin. The pick
 * must move on. The control is the same tree with no radar branches, where 694
 * must still be picked, so the skip is caused by the branches and nothing else.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

const PICKER = resolve(__dirname, '..', 'radar-pick.py');

function tree(docs: Record<string, string | null>): string {
  const dir = mkdtempSync(join(tmpdir(), 'radar-pick-'));
  for (const [path, date] of Object.entries(docs)) {
    mkdirSync(join(dir, 'research', path), { recursive: true });
    const fm = date ? `---\ntopic: x\nlast-validated: ${date}\n---\n` : '---\ntopic: x\n---\n';
    writeFileSync(join(dir, 'research', path, 'README.md'), `${fm}\n# doc\n`);
  }
  return dir;
}

function run(dir: string, branches: string[] | null, today = '2026-10-17') {
  const args = [PICKER, '--root', dir, '--today', today];
  if (branches) {
    const f = join(dir, 'branches.txt');
    writeFileSync(f, branches.join('\n'));
    args.push('--branches-file', f);
  }
  return spawnSync('python3', args, { encoding: 'utf8' });
}

// The oldest three on main at 81cea7741^ (the commit before #4001), measured 2026-10-18.
const LIBRARY = {
  'dev-workflows/694-research-library-audit': '2026-05-20',
  'events/695-zabal-games-context-prompt': '2026-05-20',
  'agents/202-multi-agent-orchestration-openclaw-paperclip': '2026-05-21',
  'agents/2400-no-date-doc': null,
};

describe('radar-pick.py', () => {
  it('control: with no radar branches the oldest doc, 694, is picked', () => {
    const r = run(tree(LIBRARY), []);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('694 research/dev-workflows/694-research-library-audit/README.md 2026-05-20');
  });

  it('the 2026-10-17 state: 694 has radar branches from the 15th and 16th, so 695 is picked', () => {
    const r = run(tree(LIBRARY), ['refs/heads/ws/radar-694-2026-10-15', 'refs/heads/ws/radar-694-2026-10-16']);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('695 research/events/695-zabal-games-context-prompt/README.md 2026-05-20');
    expect(r.stderr).toContain('skip doc 694');
  });

  it('a radar branch older than the cooldown does not skip', () => {
    const r = run(tree(LIBRARY), ['refs/heads/ws/radar-694-2026-08-01']);
    expect(r.stdout.trim()).toMatch(/^694 /);
  });

  it('other branches and other doc numbers are ignored', () => {
    const r = run(tree(LIBRARY), ['refs/heads/ws/zoe-people-list-1018', 'refs/heads/ws/radar-6940-2026-10-16', 'refs/heads/ws/radar-69-2026-10-16']);
    expect(r.stdout.trim()).toMatch(/^694 /);
  });

  it('a doc with no last-validated is never picked, and the count is printed', () => {
    const r = run(tree({ 'agents/2400-no-date-doc': null, 'agents/202-x': '2026-06-01' }), []);
    expect(r.stdout.trim()).toBe('202 research/agents/202-x/README.md 2026-06-01');
    expect(r.stderr).toContain('1 docs carry last-validated; 1 do not');
  });

  it('exits 2 when nothing can be picked', () => {
    expect(run(tree({ 'agents/2400-no-date-doc': null }), []).status).toBe(2);
    expect(run(tree({ 'agents/202-x': '2026-06-01' }), ['ws/radar-202-2026-10-10']).status).toBe(2);
  });

  it('reads radar branches from a real origin by default', () => {
    const origin = mkdtempSync(join(tmpdir(), 'radar-origin-'));
    execFileSync('git', ['init', '-q', '--bare', origin]);
    const dir = tree(LIBRARY);
    const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q', '-b', 'main');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'base');
    git('remote', 'add', 'origin', origin);
    git('push', '-q', 'origin', 'main:refs/heads/ws/radar-694-2026-10-16');
    const r = run(dir, null);
    expect(r.stdout.trim()).toMatch(/^695 /);
  });

  it('an unreadable origin warns and falls back to the plain oldest pick', () => {
    const dir = tree(LIBRARY);
    execFileSync('git', ['init', '-q'], { cwd: dir });
    const r = run(dir, null);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toMatch(/^694 /);
    expect(r.stderr).toContain('WARNING: could not list origin radar branches');
  });
});
