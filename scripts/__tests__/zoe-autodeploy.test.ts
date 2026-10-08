import { execSync } from 'node:child_process';
import fs from 'node:fs';
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

  // The guard, run for real against a scratch repo: it may skip ONLY when git read
  // both commits and found nothing under bot/.
  // biome-ignore lint/suspicious/noTemplateCurlyInString: this is the shell guard, ${...} is bash, not a template
  const GUARD =
    'if [ "${ZOE_AUTODEPLOY_SKIP_NONBOT:-0}" = 1 ] && git diff --quiet "$LOCAL" "$REMOTE" -- bot/ 2>/dev/null; then';
  it('the source carries the guard exactly', () => {
    expect(src).toContain(GUARD);
  });

  const repo = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'autodeploy-guard-'));
  const sh = (cmd: string) =>
    execSync(cmd, { cwd: repo, shell: '/bin/bash', encoding: 'utf8' }).trim();
  sh(
    'git init -q && git config user.email t@t && git config user.name t && mkdir -p bot research && echo a > bot/x.ts && echo a > research/r.md && git add -A && git commit -qm base',
  );
  const base = sh('git rev-parse HEAD');
  sh('echo b > research/r.md && git commit -qam doc');
  const docOnly = sh('git rev-parse HEAD');
  sh('echo b > bot/x.ts && git commit -qam bot');
  const botChange = sh('git rev-parse HEAD');
  const decide = (local: string, remote: string, flag: string) =>
    sh(
      `LOCAL=${local}; REMOTE=${remote}; ZOE_AUTODEPLOY_SKIP_NONBOT=${flag}; ${GUARD} echo skip; else echo deploy; fi`,
    );

  it('flag on, docs-only merge: skip the restart', () => {
    expect(decide(base, docOnly, '1')).toBe('skip');
  });
  it('flag on, bot/ changed: deploy', () => {
    expect(decide(docOnly, botChange, '1')).toBe('deploy');
  });
  it('flag on, git cannot read a commit: deploy, never skip on an error', () => {
    expect(decide(base, '0'.repeat(40), '1')).toBe('deploy');
  });
  it('flag off (the default): deploy even for a docs-only merge, as before', () => {
    expect(decide(base, docOnly, '0')).toBe('deploy');
  });
});
