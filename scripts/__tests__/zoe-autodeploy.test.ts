import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('zoe-autodeploy log filter', () => {
  const scriptPath = path.resolve(__dirname, '../zoe-autodeploy.sh');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');

  it('contains the clean shutdown filter before crash matching in the source', () => {
    expect(scriptContent).toContain(
      "grep -v 'shutting down cleanly' | grep -qiE 'TransformError|Error \\[|crash'",
    );
  });

  const checkLogLine = (line: string, filterShutdown = true): boolean => {
    // Simulates the bash pipeline: echo "$line" | [grep -v "shutting down cleanly"] | grep -qiE "TransformError|Error \[|crash"
    const cmd = filterShutdown
      ? `echo ${JSON.stringify(line)} | grep -v "shutting down cleanly" | grep -qiE "TransformError|Error \\[|crash"`
      : `echo ${JSON.stringify(line)} | grep -qiE "TransformError|Error \\[|crash"`;
    try {
      execSync(cmd, { shell: '/bin/bash', stdio: ['pipe', 'pipe', 'ignore'] });
      return true; // Matched error/crash (triggers rollback)
    } catch {
      return false; // Did not match error/crash (deploy proceeds)
    }
  };

  it('does not treat graceful SIGTERM crash-guard shutdown as a crash', () => {
    const cleanShutdownLog = '[zoe/crash-guard] SIGTERM received - shutting down cleanly';
    const triggersRollback = checkLogLine(cleanShutdownLog, true);
    expect(triggersRollback).toBe(false);
  });

  it('still catches real errors and crashes', () => {
    expect(checkLogLine('TransformError: Could not resolve module', true)).toBe(true);
    expect(checkLogLine('Error [ERR_MODULE_NOT_FOUND]: Cannot find package', true)).toBe(true);
    expect(checkLogLine('Fatal error: crash at boot', true)).toBe(true);
  });

  it('proves red control: legacy filter without shutdown exclusion triggers false rollback', () => {
    const cleanShutdownLog = '[zoe/crash-guard] SIGTERM received - shutting down cleanly';
    // Legacy pipeline without grep -v "shutting down cleanly"
    const legacyTriggersRollback = checkLogLine(cleanShutdownLog, false);
    // Proves legacy pipeline failed by misclassifying clean shutdown as a crash
    expect(legacyTriggersRollback).toBe(true);
  });
});

// v4, 2026-10-08: the installed copy and this file had drifted both ways. These pin
// every fix from both sides, so a later `cp scripts/zoe-autodeploy.sh ~/bin/` can
// never silently drop one again.
describe('zoe-autodeploy v4: reconciled, and quiet on non-bot merges', () => {
  const scriptPath = path.resolve(__dirname, '../zoe-autodeploy.sh');
  const src = fs.readFileSync(scriptPath, 'utf8');

  it('is valid bash', () => {
    execSync(`bash -n ${JSON.stringify(scriptPath)}`);
  });

  it('keeps the fixes that existed only in the installed copy', () => {
    expect(src).toContain('export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus"');
    expect(
      src.split('(cd bot && timeout 300 npm install --no-audit --no-fund --silent >/dev/null 2>&1)')
        .length - 1,
    ).toBe(2);
    expect(src.split('git checkout -- bot/package-lock.json 2>/dev/null || true').length - 1).toBe(
      2,
    );
    expect(src.split('UNIT_SRC="$LIVE/bot/systemd/zoe-bot.service"').length - 1).toBe(2);
  });

  it('keeps the esbuild auto-install from this file, with --no-save so it cannot dirty package.json', () => {
    expect(src).toContain(
      '(cd "$LIVE/bot" && timeout 300 npm install --no-audit --no-fund --silent --no-save esbuild >/dev/null 2>&1)',
    );
  });

  it('the OK notice is sent with ZAO_STATUS_NO_TAG=1, and only the OK notice', () => {
    expect(src).toContain('ZAO_STATUS_NO_TAG=1 ~/bin/zao-status "autodeploy OK:');
    for (const line of src
      .split('\n')
      .filter((l) => /BLOCKED|ROLLED BACK|SKIPPED/.test(l) && l.includes('zao-status'))) {
      expect(line).not.toContain('ZAO_STATUS_NO_TAG');
    }
  });

  // The guard, run for real: the line is READ FROM THE SCRIPT, not copied here, and
  // executed against a scratch repo. It may skip ONLY when the bundle's inputs were
  // read (META_OK=1) and git found no change under bot/ or any of them.
  const guardLine = src.split('\n').find((l) => l.includes('diff --quiet "$LOCAL" "$REMOTE"'));
  it('the script carries one guard, and it requires META_OK and the bundle inputs', () => {
    expect(guardLine).toBeDefined();
    expect(guardLine).toContain('[ "$META_OK" = 1 ]');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a bash array expansion, not a template
    expect(guardLine).toContain('-- bot/ "${EXTRA[@]+"${EXTRA[@]}"}"');
    expect(src.split('diff --quiet "$LOCAL" "$REMOTE"').length - 1).toBe(1);
  });

  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'autodeploy-guard-'));
  const sh = (cmd: string) =>
    execSync(cmd, { cwd: repo, shell: '/bin/bash', encoding: 'utf8' }).trim();
  sh(
    'git init -q && git config user.email t@t && git config user.name t && mkdir -p bot research packages/heart-fleet/src && echo a > bot/x.ts && echo a > research/r.md && echo a > packages/heart-fleet/src/index.ts && git add -A && git commit -qm base',
  );
  const base = sh('git rev-parse HEAD');
  sh('echo b > research/r.md && git commit -qam doc');
  const docOnly = sh('git rev-parse HEAD');
  sh('echo b > packages/heart-fleet/src/index.ts && git commit -qam pkg');
  const pkgOnly = sh('git rev-parse HEAD');
  sh('echo b > bot/x.ts && git commit -qam bot');
  const botChange = sh('git rev-parse HEAD');
  const decide = (
    local: string,
    remote: string,
    o: { flag?: string; meta?: string; extra?: string[] } = {},
  ) => {
    const g = (guardLine ?? '').replace(/;\s*then\s*$/, '');
    const extra = (o.extra ?? []).map((e) => JSON.stringify(e)).join(' ');
    return sh(
      `LIVE=${JSON.stringify(repo)}; LOCAL=${local}; REMOTE=${remote}; ZOE_AUTODEPLOY_SKIP_NONBOT=${o.flag ?? '1'}; META_OK=${o.meta ?? '1'}; EXTRA=(${extra}); ${g}; then echo skip; else echo deploy; fi`,
    );
  };
  const HEART = ['packages/heart-fleet/src/index.ts'];

  it('docs-only merge: skip', () => {
    expect(decide(base, docOnly, { extra: HEART })).toBe('skip');
  });
  it('bot/ changed: deploy', () => {
    expect(decide(pkgOnly, botChange, { extra: HEART })).toBe('deploy');
  });
  it('packages/ changed and the bundle reads it: deploy (seat evaluator on #3817)', () => {
    expect(decide(docOnly, pkgOnly, { extra: HEART })).toBe('deploy');
  });
  it('red control: a bot/-only guard would have skipped that packages/ change', () => {
    expect(decide(docOnly, pkgOnly, { extra: [] })).toBe('skip');
  });
  it('the bundle inputs could not be read: deploy', () => {
    expect(decide(base, docOnly, { meta: '0', extra: HEART })).toBe('deploy');
  });
  it('git cannot read a commit: deploy', () => {
    expect(decide(base, '0'.repeat(40), { extra: HEART })).toBe('deploy');
  });
  it('flag off (the default): deploy, as before', () => {
    expect(decide(base, docOnly, { flag: '0', extra: HEART })).toBe('deploy');
  });

  // The metafile parser, also read from the script.
  const parser = (src.split('META_LIST=$(python3 - "$V/.zoe-meta.json" <<\'PY\'\n')[1] ?? '').split(
    '\nPY\n',
  )[0];
  const parse = (meta: string) => {
    const f = path.join(repo, 'meta.json');
    fs.writeFileSync(f, meta);
    try {
      return {
        ok: true,
        out: execSync(`python3 - ${JSON.stringify(f)}`, { input: parser, encoding: 'utf8' }).trim(),
      };
    } catch {
      return { ok: false, out: '' };
    }
  };
  it('the parser lists bundle inputs outside bot/', () => {
    expect(parser).toContain('inputs');
    expect(
      parse(
        JSON.stringify({
          inputs: { 'bot/src/zoe/index.ts': {}, 'packages/heart-fleet/src/index.ts': {} },
        }),
      ),
    ).toEqual({
      ok: true,
      out: 'packages/heart-fleet/src/index.ts',
    });
  });
  it('the parser fails on an empty or broken metafile, so nothing is skipped', () => {
    expect(parse(JSON.stringify({ inputs: {} })).ok).toBe(false);
    expect(parse('{not json').ok).toBe(false);
  });

  // The real bundle, with the script's metafile flags: the inputs outside bot/ must
  // include packages/heart-fleet. With --external:'*' (the verify's flags) the list
  // is index.ts alone, which is why the metafile build is a separate run.
  it('the real bot bundle reads packages/heart-fleet', () => {
    const esb = path.resolve(__dirname, '../../node_modules/.bin/esbuild');
    const meta = path.join(repo, 'real-meta.json');
    execSync(
      `${JSON.stringify(esb)} bot/src/zoe/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --packages=external --metafile=${JSON.stringify(meta)}`,
      { cwd: path.resolve(__dirname, '../..'), stdio: 'ignore' },
    );
    const inputs = Object.keys(JSON.parse(fs.readFileSync(meta, 'utf8')).inputs);
    expect(inputs.some((p) => p.startsWith('packages/heart-fleet/'))).toBe(true);
    expect(src).toContain('--packages=external --metafile="$V/.zoe-meta.json"');
  });
});
