/**
 * Test suite and red control for claude-auth-check.sh (Card 9772).
 *
 * Invariants:
 * 1. ~/fleet-heartbeat/claude-auth-check.sh is a READ-ONLY reporter.
 * 2. It inspects Claude CLI and logs/alerts, but NEVER writes or mutates
 *    ~/.config/fleet-claude-auth.state.
 * 3. ZOE bot (recordClaudeOk / recordClaudeFailure in claude-health.ts) is the
 *    sole authoritative writer of fleet-claude-auth.state.
 * 4. Red control: tests against a legacy writer script to prove the test
 *    actively detects and rejects any script that mutates the state file.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CANONICAL_SCRIPT = resolve(__dirname, '..', 'claude-auth-check.sh');

describe('claude-auth-check (read-only reporter migration, card 9772)', () => {
  let testDir: string;
  let stateFile: string;
  let failsFile: string;
  let mockClaudeOk: string;
  let mockClaude401: string;
  let mockClaude429: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'claude-auth-test-'));
    stateFile = join(testDir, 'fleet-claude-auth.state');
    failsFile = join(testDir, 'fleet-claude-auth.fails');

    // Create mock Claude CLI binaries
    mockClaudeOk = join(testDir, 'mock-claude-ok.sh');
    writeFileSync(mockClaudeOk, '#!/usr/bin/env sh\necho "OK"\nexit 0\n', { mode: 0o755 });

    mockClaude401 = join(testDir, 'mock-claude-401.sh');
    writeFileSync(mockClaude401, '#!/usr/bin/env sh\necho "invalid auth: 401 Unauthorized"\nexit 1\n', { mode: 0o755 });

    mockClaude429 = join(testDir, 'mock-claude-429.sh');
    writeFileSync(mockClaude429, '#!/usr/bin/env sh\necho "api_error_status: 429 usage limit hit"\nexit 1\n', { mode: 0o755 });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  function runCheck(scriptPath: string, claudeBin: string, envOverrides: Record<string, string> = {}) {
    return spawnSync('bash', [scriptPath], {
      env: {
        ...process.env,
        FLEET_CLAUDE_AUTH_STATE: stateFile,
        FLEET_CLAUDE_AUTH_FAILS: failsFile,
        CLAUDE_BIN: claudeBin,
        ...envOverrides,
      },
      encoding: 'utf8',
    });
  }

  it('never overwrites or mutates FLEET_CLAUDE_AUTH_STATE on clean success', () => {
    // Seed initial state with 'cap' (e.g. written by the bot)
    writeFileSync(stateFile, 'cap\n', 'utf8');
    const beforeStat = statSync(stateFile);

    const res = runCheck(CANONICAL_SCRIPT, mockClaudeOk);
    expect(res.status).toBe(0);

    // State file MUST NOT be modified or overwritten
    const afterContent = readFileSync(stateFile, 'utf8');
    expect(afterContent).toBe('cap\n');
    const afterStat = statSync(stateFile);
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
  });

  it('never overwrites or mutates FLEET_CLAUDE_AUTH_STATE on 401 auth failure', () => {
    // Seed initial state with 'cap'
    writeFileSync(stateFile, 'cap\n', 'utf8');
    const beforeStat = statSync(stateFile);

    const res = runCheck(CANONICAL_SCRIPT, mockClaude401);
    expect(res.status).toBe(0);

    // State file MUST NOT be overwritten with 'down'
    const afterContent = readFileSync(stateFile, 'utf8');
    expect(afterContent).toBe('cap\n');
    const afterStat = statSync(stateFile);
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
  });

  it('never overwrites or mutates FLEET_CLAUDE_AUTH_STATE on 429 rate limit', () => {
    // Seed initial state with 'ok'
    writeFileSync(stateFile, 'ok\n', 'utf8');
    const beforeStat = statSync(stateFile);

    const res = runCheck(CANONICAL_SCRIPT, mockClaude429);
    expect(res.status).toBe(0);

    // State file MUST NOT be touched
    const afterContent = readFileSync(stateFile, 'utf8');
    expect(afterContent).toBe('ok\n');
    const afterStat = statSync(stateFile);
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs);
  });

  it('never creates FLEET_CLAUDE_AUTH_STATE if it does not exist', () => {
    // State file does not exist initially
    const res = runCheck(CANONICAL_SCRIPT, mockClaudeOk);
    expect(res.status).toBe(0);

    // Read-only reporter MUST NOT create the state file
    expect(() => readFileSync(stateFile, 'utf8')).toThrow();
  });

  it('RED CONTROL: detects when a legacy script writes to the state file', () => {
    // Legacy script simulation that performs "echo ok > $STATE" or "echo down > $STATE"
    const legacyScript = join(testDir, 'legacy-check.sh');
    writeFileSync(
      legacyScript,
      `#!/usr/bin/env bash
STATE="\${FLEET_CLAUDE_AUTH_STATE}"
echo "down" > "$STATE"
exit 0
`,
      { mode: 0o755 },
    );

    writeFileSync(stateFile, 'cap\n', 'utf8');

    // Run legacy script
    runCheck(legacyScript, mockClaudeOk);

    // Legacy script overwrote the state file
    const content = readFileSync(stateFile, 'utf8');
    expect(content.trim()).toBe('down');
    // Proof: A test asserting content === 'cap' FAILS against the legacy script
    expect(content).not.toBe('cap\n');
  });
});
