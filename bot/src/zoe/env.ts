// env.ts - the ONE place ZOE resolves aliased environment variables.
//
// Why this exists: the reliability audit (2026-07-20) found "env-drift" as a
// recurring bug class - the SAME logical value read under two different names in
// different files, so a reader silently gets undefined and falls back to the
// wrong behavior. Real damage this caused:
//   - the group id (ZAAL_BOTZ_GROUP_ID vs ZAALBOTS_GROUP_CHAT_ID) -> every
//     status message went to Zaal's DM instead of the group
//   - the research thread (ZAAL_BOTZ_RESEARCH_THREAD vs ZAALBOTS_STATUS_THREAD_ID)
//     -> status/research posts landed in the wrong topic
//
// The fix for the CLASS (not just each instance): resolve every drifted value
// HERE, from a canonical name plus its known aliases, and assert at boot so a
// missing value is loud instead of a silent mis-route. Every other module reads
// from this - nobody reads process.env for these names directly.

/** Read the first env var that has a value, from a list of accepted names. */
function firstOf(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function numOf(...names: string[]): number | undefined {
  const raw = firstOf(...names);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

// --- canonical resolved values ------------------------------------------------
// The FIRST name in each list is canonical; the rest are tolerated aliases that
// existed in the wild. New code should set the canonical name.

/** Zaal's personal DM chat id. */
export const ZAAL_DM_ID = numOf("ZAAL_TELEGRAM_ID", "ZAAL_DM_ID", "ZAAL_CHAT_ID");

/** The ZAAL BOTZ group chat id (status, digests, questions). */
export const ZAAL_BOTZ_GROUP_ID = numOf("ZAAL_BOTZ_GROUP_ID", "ZAALBOTS_GROUP_CHAT_ID");

/** The Research/status forum topic id within the group. */
export const ZAAL_BOTZ_RESEARCH_THREAD = numOf(
  "ZAAL_BOTZ_RESEARCH_THREAD",
  "ZAALBOTS_STATUS_THREAD_ID",
);

interface EnvSpec {
  label: string;
  value: number | string | undefined;
  required: boolean;
  aliases: string;
}

const SPECS: EnvSpec[] = [
  { label: "ZAAL_DM_ID", value: ZAAL_DM_ID, required: true, aliases: "ZAAL_TELEGRAM_ID | ZAAL_DM_ID | ZAAL_CHAT_ID" },
  { label: "ZAAL_BOTZ_GROUP_ID", value: ZAAL_BOTZ_GROUP_ID, required: false, aliases: "ZAAL_BOTZ_GROUP_ID | ZAALBOTS_GROUP_CHAT_ID" },
  { label: "ZAAL_BOTZ_RESEARCH_THREAD", value: ZAAL_BOTZ_RESEARCH_THREAD, required: false, aliases: "ZAAL_BOTZ_RESEARCH_THREAD | ZAALBOTS_STATUS_THREAD_ID" },
];

/**
 * Log what resolved and what is missing, at boot. Call once from index.ts start.
 * A required value that is missing throws - better a loud boot failure than a
 * silent mis-route in production. Optional-but-missing values warn (e.g. no
 * group id means status correctly falls back to DM, which is a real mode).
 */
export function assertEnv(): void {
  const missing: string[] = [];
  for (const s of SPECS) {
    const present = s.value !== undefined;
    if (present) {
      console.log(`[env] ${s.label} = set`);
    } else if (s.required) {
      missing.push(`${s.label} (accepts: ${s.aliases})`);
    } else {
      console.warn(`[env] ${s.label} NOT set (accepts: ${s.aliases}) - dependent features degrade`);
    }
  }
  if (missing.length > 0) {
    throw new Error(`[env] required config missing:\n  - ${missing.join("\n  - ")}`);
  }
}
