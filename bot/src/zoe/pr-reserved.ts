/**
 * pr-reserved.ts - which open PRs are truly Zaal's to merge.
 *
 * Merge rule, Zaal 2026-10-20 (option A): agents merge evaluator-CLEAN, green,
 * mergeState-CLEAN PRs in every repo. Reserved for him: DB and schema;
 * settings and permissions; any hook that can block or allow an action,
 * changes what code runs, or injects outside content into a prompt;
 * bin/zao-merge and merge guards; deploy-host paths (deploy-script,
 * staleness-check, deploy/, infra/vps, launchd and systemd units); money;
 * on-chain; DNS; outbound and publishing.
 *
 * Before this, the 05:30 digest counted every open non-hold PR as "on your
 * hand" (24 on 2026-10-21), most of them PRs an agent merges. Now a PR is his
 * only when a changed path or a label falls in a reserved class below.
 *
 * KEEP IN STEP WITH zao-merge. The merge gate's own list (RESERVED_PATHS,
 * RESERVED_BY_REPO, MERGE_GUARD_PREFIXES, RESERVED_LABELS in
 * zaal-dotfiles bin/zao-merge, from zaal-dotfiles #587) is the one that
 * decides who merges. It is not read at runtime because, as of 2026-10-21, it
 * is Python source in an unmerged PR and the VPS has no dotfiles checkout.
 * This table copies it entry for entry and the matcher copies its rules: a
 * pattern ending in "/" matches that directory anywhere, "*.x" matches the
 * extension, anything else the whole path or a trailing path. Two classes
 * here are NOT in #587 and come straight from the rule above: deploy-host and
 * trading (CLAUDE.md: ask first on agent trading parameters). When the gate
 * moves its list to a data file, read that file here instead of this copy.
 *
 * Money and outbound/publishing have no path of their own (a send can live in
 * any file); a PR in those classes is caught only if it also touches a path
 * here or carries a reserved label. Stated so a low count is not read as
 * "nothing outbound waits".
 */

type Rule = [cls: string, pattern: string];

const RESERVED_PATHS: Rule[] = [
  ['db/schema', 'migrations/'],
  ['db/schema', 'supabase/config.toml'],
  ['db/schema', 'drizzle/'],
  ['db/schema', '*.sql'],
  ['db/schema', 'schema.prisma'],
  ['settings', 'claude/settings.json'],
  ['settings', '.claude/settings.json'],
  ['settings', '.claude/settings.local.json'],
  ['settings', 'claude/clean-permissions.json'],
  ['hooks', '.claude/hooks/'],
  ['hooks', 'claude/hooks/'],
  ['hooks', 'githooks/'],
  ['hooks', '.githooks/'],
  ['hooks', '.husky/'],
  ['hooks', 'claude/policy/'],
  ['on-chain', 'contracts/'],
  ['on-chain', '*.sol'],
  ['on-chain', 'foundry.toml'],
  ['on-chain', 'hardhat.config.js'],
  ['on-chain', 'hardhat.config.ts'],
  ['dns', 'CNAME'],
  ['dns', 'dns/'],
  ['publishing', 'vercel.json'],
  ['ci', '.github/workflows/'],
  ['ci', '.github/actions/'],
  // Not in #587; from the 2026-10-20 rule's deploy-host and the trading ask-first.
  ['deploy-host', 'deploy/'],
  ['deploy-host', 'infra/vps/'],
  ['deploy-host', 'systemd/'],
  ['deploy-host', 'launchd/'],
  ['deploy-host', '*.service'],
  ['deploy-host', '*.timer'],
  ['deploy-host', '*.plist'],
  ['deploy-host', 'deploy.sh'],
  ['deploy-host', 'infra/portal/bin/'],
  ['trading', 'src/lib/agents/'],
];

const DOTFILES_HOOK_SCRIPTS = [
  'bin/block-no-verify-gate.sh', 'bin/block-no-verify.js', 'bin/destructive-guard',
  'bin/relay-autopull.sh', 'bin/safe-git-push.sh', 'bin/_safe_git_push_decide.py',
  'bin/sendmessage-sha-check', 'bin/worksession-guard.sh', 'bin/zao-brief-status-guard',
  'bin/zao-cc-activity.sh', 'bin/zao-cc-bundle.sh', 'bin/zao-cc-state.sh',
  'bin/zao-done-list-guard', 'bin/zao-guard', 'bin/zao-hook-check', 'bin/zao-lane-context.sh',
  'bin/zao-merge-only-guard', 'bin/zao-missing-timeout-guard', 'bin/zao-no-picker-guard',
  'bin/zao-notify.sh', 'bin/zao-overlap', 'bin/zao-skills-postedit-hook.sh', 'bin/_zao_shell_scan.py',
];

const RESERVED_BY_REPO: Record<string, Rule[]> = {
  // vps/ holds scripts that run on the VPS once installed: deploy-host, per the
  // seat on 2026-10-21 (zaal-dotfiles #592). Not in #587.
  // cron/ schedules what runs on each host; codex/hooks.json is Codex's hook
  // wiring. Neither is in #587 (evaluator-e2 on #4072).
  'bettercallzaal/zaal-dotfiles': [
    ...DOTFILES_HOOK_SCRIPTS.map((p): Rule => ['hooks', p]),
    ['deploy-host', 'vps/'],
    ['deploy-host', 'cron/'],
    ['deploy-host', 'pi/'],
    ['deploy-host', 'bin/vps/'],
    ['hooks', 'codex/hooks.json'],
  ],
  // The VPS deploy path: the autodeploy loop, the manual deploy and the
  // staleness check. Their names do not start "deploy-script" or
  // "staleness-check", so they need entries (evaluator-e2 on #4072: #4066).
  'bettercallzaal/zaoos': [
    ['deploy-host', 'scripts/zoe-autodeploy.sh'],
    ['deploy-host', 'scripts/zoe-deploy.sh'],
    ['deploy-host', 'scripts/vps-staleness-check.sh'],
  ],
  'bettercallzaal/zao-vault': [
    ['hooks', 'scripts/guard-no-secrets.sh'],
    ['hooks', 'scripts/guard-not-for-sharing.sh'],
    ['hooks', 'scripts/guard-outbound-freeze.sh'],
  ],
};

const MERGE_GUARD_PREFIXES = [
  'bin/zao-merge', 'bin/zao-review-gate', 'bin/zao-pr-open',
  'bin/zao-status-append', 'bin/zao-eval-extract', 'claude/skills/zao-evaluate/',
];

/** Label prefixes that make a PR his whatever it touches (zao-merge RESERVED_LABELS minus hold). */
const RESERVED_LABEL_PREFIXES = ['reserved', 'zaal'];

/** zao-merge is_reserved_path, ported: the class one path falls in, or null. */
export function reservedClassOf(path: string, repo = ''): string | null {
  const p = path.toLowerCase();
  const parts = p.split('/');
  const key = repo.toLowerCase();
  const rules = [...RESERVED_PATHS, ...(Object.entries(RESERVED_BY_REPO).find(([r]) => r.toLowerCase() === key)?.[1] ?? [])];
  for (const [cls, raw] of rules) {
    const pat = raw.toLowerCase();
    if (pat.endsWith('/')) {
      if (pat.slice(0, -1).includes('/')) {
        if (p.startsWith(pat) || `/${p}`.includes(`/${pat}`)) return cls;
      } else if (parts.slice(0, -1).includes(pat.slice(0, -1))) return cls;
    } else if (pat.startsWith('*.')) {
      if (p.endsWith(pat.slice(1))) return cls;
    } else if (p === pat || p.endsWith(`/${pat}`)) return cls;
  }
  const base = parts[parts.length - 1];
  if (base.startsWith('deploy-script') || base.startsWith('staleness-check')) return 'deploy-host';
  if (key === 'bettercallzaal/zaal-dotfiles' && MERGE_GUARD_PREFIXES.some((pre) => p.startsWith(pre))) return 'merge-guard';
  return null;
}

/** The reserved classes a PR's changed paths and labels touch, each once, in first-seen order. */
export function reservedClasses(paths: string[], repo = '', labels: string[] = []): string[] {
  const hit = new Set<string>();
  for (const path of paths) {
    const cls = reservedClassOf(path, repo);
    if (cls) hit.add(cls);
  }
  for (const l of labels) if (RESERVED_LABEL_PREFIXES.some((w) => l.toLowerCase().startsWith(w))) hit.add(`label ${l}`);
  return [...hit];
}
