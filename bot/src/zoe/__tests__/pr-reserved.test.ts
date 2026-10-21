import { describe, expect, it } from 'vitest';
import { reservedClasses, reservedClassOf } from '../pr-reserved';

// Zaal's 2026-10-20 merge rule: only reserved classes are his to merge. The
// table copies zao-merge's (zaal-dotfiles #587); these cases are its classes.

describe('reservedClassOf', () => {
  it.each([
    ['supabase/migrations/20261021_add.sql', '', 'db/schema'],
    ['scripts/1410-agent-control-plane.sql', '', 'db/schema'],
    ['MIGRATION.SQL', '', 'db/schema'],
    ['supabase/config.toml', '', 'db/schema'],
    ['.claude/settings.json', '', 'settings'],
    ['claude/settings.json', '', 'settings'],
    ['.claude/settings.local.json', '', 'settings'],
    ['.claude/hooks/block-no-verify.sh', '', 'hooks'],
    ['claude/policy/destructive.json', '', 'hooks'],
    ['.husky/pre-commit', '', 'hooks'],
    ['contracts/Token.sol', '', 'on-chain'],
    ['foundry.toml', '', 'on-chain'],
    ['public/CNAME', '', 'dns'],
    ['vercel.json', '', 'publishing'],
    ['.github/workflows/ci.yml', '', 'ci'],
    ['deploy/zoe.sh', '', 'deploy-host'],
    ['infra/vps/setup.sh', '', 'deploy-host'],
    ['scripts/ecosystem-monitor/systemd/ecosystem-monitor.timer', '', 'deploy-host'],
    ['bot/scripts/deploy-script.sh', '', 'deploy-host'],
    ['bin/staleness-check', '', 'deploy-host'],
    ['src/lib/agents/runner.ts', '', 'trading'],
    ['bin/zao-merge', 'bettercallzaal/zaal-dotfiles', 'merge-guard'],
    ['bin/zao-merge-test', 'bettercallzaal/zaal-dotfiles', 'merge-guard'],
    ['claude/skills/zao-evaluate/SKILL.md', 'bettercallzaal/zaal-dotfiles', 'merge-guard'],
    ['bin/destructive-guard', 'bettercallzaal/zaal-dotfiles', 'hooks'],
    ['scripts/guard-outbound-freeze.sh', 'bettercallzaal/zao-vault', 'hooks'],
    ['vps/fleet-health.sh', 'bettercallzaal/zaal-dotfiles', 'deploy-host'],
  ])('%s in %s is %s', (path, repo, cls) => {
    expect(reservedClassOf(path, repo)).toBe(cls);
  });

  it.each([
    ['bot/src/zoe/inbox-nudge.ts', 'bettercallzaal/ZAOOS'],
    ['research/agents/2700-x/README.md', 'bettercallzaal/ZAOOS'],
    ['docs/daily/2026-10-21-tasks.md', 'bettercallzaal/ZAOOS'],
    ['.claude/rules/agent-loops.md', 'bettercallzaal/ZAOOS'],
    ['src/app/api/tasks/list/route.ts', 'bettercallzaal/ZAOOS'],
    ['bin/zao-merge', 'bettercallzaal/ZAOOS'],
    ['bin/destructive-guard', 'bettercallzaal/ZAOOS'],
    ['bin/zao-notify-drain', 'bettercallzaal/zaal-dotfiles'],
  ])('%s in %s is not reserved', (path, repo) => {
    expect(reservedClassOf(path, repo)).toBeNull();
  });
});

describe('the VPS deploy path in ZAOOS (#4066, verbatim)', () => {
  it('#4066 is his: autodeploy and staleness check are deploy-host', () => {
    const files = ['scripts/__tests__/zoe-autodeploy-refresh.test.ts', 'scripts/vps-staleness-check.sh', 'scripts/zoe-autodeploy.sh'];
    expect(reservedClasses(files, 'bettercallzaal/ZAOOS')).toEqual(['deploy-host']);
  });
  it('scripts/zoe-deploy.sh is deploy-host; any other script is not', () => {
    expect(reservedClassOf('scripts/zoe-deploy.sh', 'bettercallzaal/ZAOOS')).toBe('deploy-host');
    expect(reservedClasses(['scripts/foo.sh'], 'bettercallzaal/ZAOOS')).toEqual([]);
  });
  it('the rest of the seat-ruled deploy-host set', () => {
    expect(reservedClassOf('infra/bus/deploy/deploy.sh', 'bettercallzaal/ZAOOS')).toBe('deploy-host');
    expect(reservedClassOf('tools/deploy.sh', 'bettercallzaal/ZAOOS')).toBe('deploy-host');
    expect(reservedClassOf('infra/portal/bin/bots/zoe.sh', 'bettercallzaal/ZAOOS')).toBe('deploy-host');
    expect(reservedClassOf('deploy/pi/zoe.service', 'bettercallzaal/ZAOOS')).toBe('deploy-host');
    expect(reservedClassOf('pi/start-fleet.sh', 'bettercallzaal/zaal-dotfiles')).toBe('deploy-host');
    expect(reservedClassOf('bin/vps/loop.sh', 'bettercallzaal/zaal-dotfiles')).toBe('deploy-host');
    expect(reservedClassOf('infra/portal/README.md', 'bettercallzaal/ZAOOS')).toBeNull();
  });
  it('dotfiles cron/ and codex/hooks.json are his', () => {
    expect(reservedClassOf('cron/vps.cron', 'bettercallzaal/zaal-dotfiles')).toBe('deploy-host');
    expect(reservedClassOf('codex/hooks.json', 'bettercallzaal/zaal-dotfiles')).toBe('hooks');
  });
});

describe('reservedClasses', () => {
  it('lists each class once, in first-seen order', () => {
    expect(reservedClasses(['.github/workflows/a.yml', 'x.sql', 'README.md', '.github/workflows/b.yml'])).toEqual(['ci', 'db/schema']);
  });
  it('a reserved or zaal label makes a PR his whatever it touches', () => {
    expect(reservedClasses(['README.md'], '', ['Reserved'])).toEqual(['label Reserved']);
    expect(reservedClasses(['README.md'], '', ['zaal-only'])).toEqual(['label zaal-only']);
    expect(reservedClasses(['README.md'], '', ['docs'])).toEqual([]);
  });
  it('no paths, no labels, no class', () => {
    expect(reservedClasses([])).toEqual([]);
  });
});
