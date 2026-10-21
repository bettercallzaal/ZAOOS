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
 * only when one of its changed paths falls in a reserved class below.
 *
 * Classes are read from paths alone, so two of them are NOT covered: money
 * and outbound/publishing have no path of their own (a send can live in any
 * file). A PR in those classes is caught only if it also touches a path here.
 * Stated so nobody reads a low count as "nothing outbound waits".
 */

export type ReservedClass =
  | 'db-schema'
  | 'settings'
  | 'hooks'
  | 'merge-guard'
  | 'deploy-host'
  | 'on-chain'
  | 'trading'
  | 'dns';

const RULES: { cls: ReservedClass; re: RegExp }[] = [
  { cls: 'db-schema', re: /(^|\/)(supabase\/migrations|migrations)\/|\.sql$|(^|\/)schema\.prisma$/i },
  { cls: 'settings', re: /(^|\/)\.?claude\/settings(\.[a-z]+)?\.json$|(^|\/)\.github\/CODEOWNERS$/i },
  { cls: 'hooks', re: /(^|\/)\.?claude\/hooks\/|(^|\/)\.husky\/|(^|\/)\.githooks\// },
  { cls: 'merge-guard', re: /(^|\/)bin\/zao-merge[^/]*$|(^|\/)\.github\/workflows\// },
  {
    cls: 'deploy-host',
    re: /(^|\/)deploy-script[^/]*$|(^|\/)staleness-check[^/]*$|(^|\/)deploy\/|(^|\/)infra\/vps\/|\.(service|timer|plist)$|(^|\/)(systemd|launchd)\//,
  },
  { cls: 'on-chain', re: /\.sol$|(^|\/)contracts\// },
  { cls: 'trading', re: /^src\/lib\/agents\// },
  { cls: 'dns', re: /(^|\/)CNAME$|(^|\/)dns\// },
];

/** The reserved classes a set of changed paths touches, in rule order, each once. */
export function reservedClasses(paths: string[]): ReservedClass[] {
  const hit = new Set<ReservedClass>();
  for (const p of paths) for (const r of RULES) if (r.re.test(p)) hit.add(r.cls);
  return RULES.map((r) => r.cls).filter((c) => hit.has(c));
}
