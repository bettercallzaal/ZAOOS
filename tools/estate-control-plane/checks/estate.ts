import { join } from 'node:path';
import type { CheckResult, EstateConfig, Finding } from '../types';
import { readFileSafe } from '../fs-utils';

/**
 * Token-gated Vercel/Supabase census. To avoid a stored long-lived credential
 * (the concentration risk), this check does NOT run the cloud scan in CI by
 * default. It reports the freshness of the last MANUAL scan (the stamp file that
 * scripts/estate-audit/audit.sh can write) and warns when it is stale.
 *
 * If VERCEL_TOKEN / SUPABASE_ACCESS_TOKEN are present in the environment, a future
 * version can shell out to scripts/estate-audit/audit.sh here.
 */
export async function estateCheck(cfg: EstateConfig): Promise<CheckResult> {
  const hasTokens = Boolean(process.env.VERCEL_TOKEN || process.env.SUPABASE_ACCESS_TOKEN);
  const findings: Finding[] = [];

  const stamp = await readFileSafe(join(cfg.repoRoot, cfg.staleness.estateStampFile));
  const lastIso = stamp?.trim().match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  let ageDays: number | null = null;
  if (lastIso) {
    const [y, m, d] = lastIso.split('-').map(Number);
    ageDays = Math.floor((Date.now() - Date.UTC(y, m - 1, d)) / 86_400_000);
  }

  if (ageDays == null) {
    findings.push({
      check: 'estate',
      severity: 'warn',
      title: 'no estate scan on record',
      detail: `run scripts/estate-audit/audit.sh and stamp ${cfg.staleness.estateStampFile}`,
      fixable: false,
    });
  } else if (ageDays > cfg.staleness.estateMaxDays) {
    findings.push({
      check: 'estate',
      severity: 'warn',
      title: `estate scan stale (${ageDays}d old, SLA ${cfg.staleness.estateMaxDays}d)`,
      detail: 'kill-list may be out of date; re-run scripts/estate-audit/audit.sh',
      fixable: false,
    });
  }

  return {
    id: 'estate',
    status: findings.length ? 'warn' : 'ok',
    findings,
    note: hasTokens
      ? 'tokens present - live scan not yet wired (reports stamp freshness only)'
      : 'token-free: reports last manual scan freshness',
  };
}
