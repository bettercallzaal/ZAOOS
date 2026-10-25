/**
 * The PostToolUse auto-format hook fixes only the lines an edit changed
 * (scripts/hooks/eslint-fix-changed-lines.py, 2026-10-23).
 *
 * A stub `npx` stands in for ESLint: its "fix" appends a semicolon to EVERY line
 * that lacks one, so a whole-file reflow is impossible to miss. The real ESLint
 * rules are not under test here; which of its fixes are kept is.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const HOOK = join(__dirname, '..', 'hooks', 'eslint-fix-changed-lines.py');

const STUB_NPX = `#!/usr/bin/env python3
import json, sys
if "--fail" in open(sys.argv[0] + ".mode").read():
    sys.exit(2)
path = sys.argv[-1]
src = open(path).read()
out = "".join((l.rstrip("\\n") + ("" if l.rstrip("\\n").endswith(";") or not l.strip() else ";") + "\\n")
              for l in src.splitlines(keepends=True))
print(json.dumps([{"filePath": path, "output": out}]))
`;

function repo(mode = '') {
  const root = mkdtempSync(join(tmpdir(), 'eslint-hook-'));
  const bin = join(root, '.bin');
  spawnSync('mkdir', ['-p', bin, join(root, 'src')]);
  writeFileSync(join(bin, 'npx'), STUB_NPX);
  writeFileSync(join(bin, 'npx.mode'), mode);
  chmodSync(join(bin, 'npx'), 0o755);
  const git = (...a: string[]) => spawnSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  return { root, bin, git };
}

function runHook(root: string, bin: string, file: string) {
  return spawnSync('python3', [HOOK], {
    input: JSON.stringify({ tool_input: { file_path: file } }),
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}`, CLAUDE_PROJECT_DIR: root },
  });
}

const OLD =
  ['const a = 1', 'const b = 2', 'const c = 3', 'const d = 4', 'const e = 5'].join('\n') + '\n';

describe('eslint --fix scoped to the changed lines', () => {
  it('THE RED CONTROL: a one-line edit to an old file leaves every other line byte-identical', () => {
    const { root, bin, git } = repo();
    const f = join(root, 'src', 'old.ts');
    writeFileSync(f, OLD);
    git('add', '-A');
    git('commit', '-qm', 'old');
    writeFileSync(f, OLD.replace('const c = 3', 'const c = 33'));
    const r = runHook(root, bin, f);
    expect(r.status).toBe(0);
    const after = readFileSync(f, 'utf8').split('\n');
    expect(after[2]).toBe('const c = 33;'); // the changed line is fixed
    expect(after.filter((_, i) => i !== 2)).toEqual(OLD.split('\n').filter((_, i) => i !== 2)); // nothing else moved
  });

  it('a new, untracked file is all new, so all of it is fixed', () => {
    const { root, bin, git } = repo();
    git('commit', '-q', '--allow-empty', '-m', 'base');
    const f = join(root, 'src', 'new.ts');
    writeFileSync(f, OLD);
    expect(runHook(root, bin, f).status).toBe(0);
    expect(readFileSync(f, 'utf8')).toBe(OLD.replace(/\n/g, ';\n'));
  });

  it('when eslint fails, the file is left exactly as it was, and the hook exits 0', () => {
    const { root, bin, git } = repo('--fail');
    const f = join(root, 'src', 'old.ts');
    writeFileSync(f, OLD);
    git('add', '-A');
    git('commit', '-qm', 'old');
    const edited = OLD.replace('const c = 3', 'const c = 33');
    writeFileSync(f, edited);
    expect(runHook(root, bin, f).status).toBe(0);
    expect(readFileSync(f, 'utf8')).toBe(edited);
  });

  it('a non-TypeScript path is ignored', () => {
    const { root, bin } = repo();
    const f = join(root, 'src', 'notes.md');
    writeFileSync(f, 'x\n');
    expect(runHook(root, bin, f).status).toBe(0);
    expect(readFileSync(f, 'utf8')).toBe('x\n');
  });

  it('the settings hook calls this script, not eslint --fix on the whole file', () => {
    const settings = readFileSync(join(__dirname, '..', '..', '.claude', 'settings.json'), 'utf8');
    expect(settings).toContain('scripts/hooks/eslint-fix-changed-lines.py');
    expect(settings).not.toContain('npx eslint --fix \\"$TOOL_ARG_FILE_PATH\\"');
  });
});
