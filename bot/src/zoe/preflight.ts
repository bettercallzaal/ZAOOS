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

/**
 * The cap-fallback ladder, as env alone can see it. Kept here rather than
 * imported from the router so preflight stays pure and testable with a fake
 * env; the router owns the same order at call time.
 *
 * DEPTH is the thing worth reporting. A boolean ("is there a fallback?") reads
 * the same at one rung as at four, and one rung is not a fallback - it is a
 * second single point of failure. On 2026-08-21 the ladder was OpenRouter then
 * Grok, OpenRouter ran out of credits, and 17 loops went silent. On 2026-09-11
 * the live VPS had exactly one rung again. Zaal: "i odnt wanna have openrouter
 * be the only backup".
 */
export const FALLBACK_RUNGS: Array<{ name: string; when: (env: Record<string, string | undefined>) => boolean }> = [
  { name: 'openrouter', when: (e) => Boolean(e.OPENROUTER_API_KEY?.trim()) },
  { name: 'surplus', when: (e) => Boolean(e.SURPLUS_API_KEY?.trim()) },
  { name: 'grok', when: (e) => Boolean(e.XAI_API_KEY?.trim()) },
  { name: 'gpt', when: (e) => Boolean(e.OPENAI_API_KEY?.trim()) },
  // Keyless and local, so it is the one rung an expired card cannot take out.
  { name: 'ollama', when: (e) => e.OLLAMA_ENABLED?.trim() === '1' },
];

/** The rungs configured in this env, in the order the router would try them. */
export function fallbackLadder(env: Record<string, string | undefined>): string[] {
  return FALLBACK_RUNGS.filter((r) => r.when(env)).map((r) => r.name);
}

/**
 * One line about the ladder, or null when it is deep enough to be worth the
 * name. Two is the floor: one paid provider plus anything that does not fail
 * with it.
 */
export function formatFallbackDepth(env: Record<string, string | undefined>): string | null {
  const rungs = fallbackLadder(env);
  if (rungs.length >= 2) return null;
  if (rungs.length === 0) {
    return 'CAP FALLBACK: no rungs. A Claude cap is a hard stop for every judgment call. '
      + 'Set OPENROUTER_API_KEY, or OLLAMA_ENABLED=1 on a box with a model pulled.';
  }
  return `CAP FALLBACK: one rung (${rungs[0]}). One rung is not a fallback, it is a second single `
    + 'point of failure - on 2026-08-21 the top rung ran out of credits and 17 loops went silent. '
    + 'Add a second: SURPLUS_API_KEY, XAI_API_KEY, OPENAI_API_KEY, or OLLAMA_ENABLED=1 (keyless, local).';
}

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
export function formatPreflightReport(
  results: CapabilityResult[],
  env?: Record<string, string | undefined>,
): string | null {
  const broken = results.filter((r) => !r.ok);
  const depth = env ? formatFallbackDepth(env) : null;
  if (broken.length === 0 && !depth) return null;
  if (broken.length === 0 && depth) return ['ZOE preflight: capabilities are configured, with one warning.', '', depth].join('\n');
  const critical = broken.filter((r) => r.severity === 'critical');
  const degraded = broken.filter((r) => r.severity === 'degraded');
  const lines: string[] = ['ZOE preflight: some capabilities are DISABLED (missing config).'];
  for (const r of critical) {
    lines.push('', `CRITICAL - ${r.name}: missing ${r.missing.join(', ')}`, `  -> ${r.impact}`);
  }
  for (const r of degraded) {
    lines.push('', `DEGRADED - ${r.name}: missing ${r.missing.join(', ')}`, `  -> ${r.impact}`);
  }
  if (depth) lines.push('', depth);
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
  const report = formatPreflightReport(results, env);
  if (!report) {
    console.log(`[zoe/preflight] all capabilities configured; cap-fallback ladder: ${fallbackLadder(env).join(' -> ')}`);
    return results;
  }
  console.error(`[zoe/preflight] ${report}`);
  // A shallow ladder is LOGGED, never alerted on its own. Every restart would
  // send the same message, and a warning that arrives on every boot is a
  // warning nobody reads by the third one. Missing config still alerts.
  const configMissing = results.some((r) => !r.ok);
  if (alert && configMissing) {
    try {
      await alert(report);
    } catch (err) {
      console.error('[zoe/preflight] alert failed:', (err as Error)?.message ?? err);
    }
  }
  return results;
}
