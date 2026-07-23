/**
 * ZOE Config Preflight: fail LOUDLY on missing config, never silently.
 *
 * Built 2026-07-23 after a real incident: the ZOE bot's .env had no Supabase
 * credentials at all, so db() threw on every call. The error-remediation rail
 * logged one line per tick and moved on, the receipts emitter swallowed it
 * (best-effort by design), and the repo-improver scout half-worked - its
 * OpenRouter audit succeeded and only the DB write failed. Net effect: an
 * entire class of capability was dead for an unknown period and nothing ever
 * said so.
 *
 * Silent degradation is the worst failure mode for an autonomous system: it
 * looks alive while doing nothing. This module declares what each capability
 * NEEDS, checks it at boot, and reports what is disabled and why - to the log
 * and to Zaal - so "quietly broken" becomes "loudly reported".
 *
 * Pure (checkCapabilities/formatPreflightReport) so it is fully unit-tested;
 * runPreflight does the logging + one-shot alert.
 */

/** A ZOE capability and the env vars it cannot run without. */
export interface Capability {
  name: string;
  /** Env vars that MUST be present for this capability to function. */
  requires: string[];
  /** What stops working when it is missing - shown in the alert. */
  impact: string;
  /** critical = ZOE is broken; degraded = a feature is off but ZOE runs. */
  severity: 'critical' | 'degraded';
}

export const CAPABILITIES: Capability[] = [
  {
    name: 'telegram-core',
    requires: ['ZOE_BOT_TOKEN', 'ZAAL_TELEGRAM_ID'],
    impact: 'ZOE cannot talk to Zaal at all',
    severity: 'critical',
  },
  {
    name: 'database',
    requires: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    impact: 'receipts, error-remediation rail, repo-improver findings, and CRM writes all fail silently',
    severity: 'critical',
  },
  {
    name: 'cheap-ai',
    requires: ['OPENROUTER_API_KEY'],
    impact: 'no cap-fallback and no repo-improver scout audits (Claude cap becomes a hard stop)',
    severity: 'degraded',
  },
  {
    name: 'group-status',
    requires: ['ZAAL_BOTZ_GROUP_ID'],
    impact: 'autonomous status reports (fixes, scout decisions) have nowhere to post',
    severity: 'degraded',
  },
];

export interface CapabilityResult {
  name: string;
  ok: boolean;
  missing: string[];
  impact: string;
  severity: 'critical' | 'degraded';
}

/**
 * Check every capability against an env map. Pure - pass process.env or a fake.
 * A var counts as present only if it is a non-empty, non-whitespace string.
 */
export function checkCapabilities(
  env: Record<string, string | undefined>,
  caps: Capability[] = CAPABILITIES,
): CapabilityResult[] {
  return caps.map((c) => {
    const missing = c.requires.filter((v) => !env[v] || String(env[v]).trim() === '');
    return { name: c.name, ok: missing.length === 0, missing, impact: c.impact, severity: c.severity };
  });
}

/**
 * Human-readable report. Returns null when everything is healthy, so callers
 * can stay silent on a clean boot and only speak up when something is wrong.
 */
export function formatPreflightReport(results: CapabilityResult[]): string | null {
  const broken = results.filter((r) => !r.ok);
  if (broken.length === 0) return null;
  const critical = broken.filter((r) => r.severity === 'critical');
  const degraded = broken.filter((r) => r.severity === 'degraded');
  const lines: string[] = ['ZOE preflight: some capabilities are DISABLED (missing config).'];
  for (const r of critical) {
    lines.push('', `CRITICAL - ${r.name}: missing ${r.missing.join(', ')}`, `  -> ${r.impact}`);
  }
  for (const r of degraded) {
    lines.push('', `DEGRADED - ${r.name}: missing ${r.missing.join(', ')}`, `  -> ${r.impact}`);
  }
  lines.push('', 'Add the missing vars to the bot .env and restart. Until then those paths fail silently.');
  return lines.join('\n');
}

/** True if any critical capability is missing config. */
export function hasCriticalFailure(results: CapabilityResult[]): boolean {
  return results.some((r) => !r.ok && r.severity === 'critical');
}

/**
 * Run the preflight at boot: log the report and (best-effort) alert Zaal once.
 * Never throws - a broken preflight must not stop ZOE from starting.
 */
export async function runPreflight(
  alert?: (message: string) => Promise<void>,
  env: Record<string, string | undefined> = process.env,
): Promise<CapabilityResult[]> {
  const results = checkCapabilities(env);
  const report = formatPreflightReport(results);
  if (!report) {
    console.log('[zoe/preflight] all capabilities configured');
    return results;
  }
  console.error(`[zoe/preflight] ${report}`);
  if (alert) {
    try {
      await alert(report);
    } catch (err) {
      console.error('[zoe/preflight] alert failed:', (err as Error)?.message ?? err);
    }
  }
  return results;
}
