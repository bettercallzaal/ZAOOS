import { describe, expect, it } from 'vitest';
import { reservedClasses } from '../pr-reserved';

// Zaal's 2026-10-20 merge rule: only reserved classes are his to merge.

describe('reservedClasses', () => {
  it.each([
    ['supabase/migrations/20261021_add.sql', 'db-schema'],
    ['scripts/1410-agent-control-plane.sql', 'db-schema'],
    ['.claude/settings.json', 'settings'],
    ['claude/settings.json', 'settings'],
    ['.claude/settings.local.json', 'settings'],
    ['.claude/hooks/block-no-verify.sh', 'hooks'],
    ['claude/hooks/zao-cc-state.sh', 'hooks'],
    ['.husky/pre-commit', 'hooks'],
    ['bin/zao-merge', 'merge-guard'],
    ['bin/zao-merge-test', 'merge-guard'],
    ['.github/workflows/ci.yml', 'merge-guard'],
    ['bot/scripts/deploy-script.sh', 'deploy-host'],
    ['bin/staleness-check', 'deploy-host'],
    ['deploy/zoe.sh', 'deploy-host'],
    ['infra/vps/setup.sh', 'deploy-host'],
    ['scripts/ecosystem-monitor/systemd/ecosystem-monitor.timer', 'deploy-host'],
    ['launchd/com.zao.relay.plist', 'deploy-host'],
    ['contracts/Token.sol', 'on-chain'],
    ['src/lib/agents/runner.ts', 'trading'],
    ['public/CNAME', 'dns'],
  ])('%s is %s', (path, cls) => {
    expect(reservedClasses([path])).toEqual([cls]);
  });

  it.each([
    'bot/src/zoe/inbox-nudge.ts',
    'research/agents/2700-x/README.md',
    'docs/daily/2026-10-21-tasks.md',
    '.claude/rules/agent-loops.md',
    'bin/zao-pr-open',
    'vps/fleet-health.sh',
    'src/app/api/tasks/list/route.ts',
    'bot/src/zoe/__tests__/settings.test.ts',
  ])('%s is not reserved', (path) => {
    expect(reservedClasses([path])).toEqual([]);
  });

  it('lists each class once, in rule order', () => {
    expect(reservedClasses(['.github/workflows/a.yml', 'x.sql', 'README.md', '.github/workflows/b.yml'])).toEqual([
      'db-schema',
      'merge-guard',
    ]);
  });
  it('no paths, no class', () => {
    expect(reservedClasses([])).toEqual([]);
  });
});
