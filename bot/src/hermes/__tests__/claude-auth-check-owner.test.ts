/**
 * Runs infra/vps/claude-auth-check-test.sh inside the bot suite, because no CI
 * job runs shell tests and this one guards the single-writer rule for
 * ~/.config/fleet-claude-auth.state (see the header of claude-health.ts).
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('claude-auth-check.sh owns fleet-claude-auth.state', () => {
  it('passes its own shell suite', () => {
    const script = join(__dirname, '..', '..', '..', '..', 'infra', 'vps', 'claude-auth-check-test.sh');
    const res = spawnSync('bash', [script], { encoding: 'utf8', timeout: 60_000 });
    expect(res.stdout).toContain('0 failed');
    expect(res.status).toBe(0);
  });
});
