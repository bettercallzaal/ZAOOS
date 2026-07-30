/**
 * identities.ts — the per-brand Identity Kit registry (doc 2155).
 *
 * A ZAO "fleet" is one shared runtime wearing many brand faces. Each brand
 * identity is { brand, agent, email:{inbox,keyEnv}, socials, icmBox, personaRef }.
 * This module loads that registry and resolves each identity's email creds at
 * read time from the environment — credential VALUES never live in the registry
 * file, only a reference to the env var that holds the key (secret-hygiene.md,
 * agent-loops rule 15).
 *
 * Backward-compatible by design: with NO registry file configured, this returns
 * exactly one identity — ZOE on zoe-zao@agentmail.to keyed by AGENTMAIL_API_KEY —
 * which is the live behavior today. Adding brands is purely additive; nothing
 * about the running bot changes until a registry is provided AND a caller opts
 * into iterating it.
 *
 * The registry path comes from ZOE_IDENTITIES_PATH (a JSON file). Absent/unreadable/
 * malformed -> the built-in default identity, never a throw.
 */

import { readFileSync } from 'node:fs';

/** The canonical default: ZOE's own inbox, live today. */
export const DEFAULT_INBOX = 'zoe-zao@agentmail.to';
export const DEFAULT_KEY_ENV = 'AGENTMAIL_API_KEY';

/** One brand's email config. `keyEnv` names the env var holding the API key. */
export interface EmailConfig {
  inbox: string;
  keyEnv: string;
}

/** A brand identity in the fleet. Only `brand` + `email` are required. */
export interface BrandIdentity {
  brand: string;
  agent?: string;
  email: EmailConfig;
  icmBox?: string;
  socials?: Record<string, string>;
  personaRef?: string;
}

/** Resolved email creds for a runtime call. `apiKey` is undefined if the env var is unset. */
export interface ResolvedEmail {
  brand: string;
  inbox: string;
  apiKey: string | undefined;
}

/** The identity that exists with zero configuration — ZOE today. */
export function defaultIdentity(): BrandIdentity {
  return {
    brand: 'The ZAO',
    agent: 'ZOE',
    email: { inbox: DEFAULT_INBOX, keyEnv: DEFAULT_KEY_ENV },
    icmBox: 'thezao',
  };
}

/** True when a value is a usable non-empty string. */
function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Defensively coerce one raw registry entry into a BrandIdentity, or null if it
 * lacks the required fields. Never throws.
 */
export function parseIdentity(raw: unknown): BrandIdentity | null {
  if (raw === null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const email = r.email as Record<string, unknown> | undefined;
  if (!nonEmptyString(r.brand)) return null;
  if (!email || !nonEmptyString(email.inbox) || !nonEmptyString(email.keyEnv)) return null;

  const id: BrandIdentity = {
    brand: r.brand.trim(),
    email: { inbox: (email.inbox as string).trim(), keyEnv: (email.keyEnv as string).trim() },
  };
  if (nonEmptyString(r.agent)) id.agent = r.agent.trim();
  if (nonEmptyString(r.icmBox)) id.icmBox = r.icmBox.trim();
  if (nonEmptyString(r.personaRef)) id.personaRef = r.personaRef.trim();
  if (r.socials && typeof r.socials === 'object') {
    const socials: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.socials as Record<string, unknown>)) {
      if (nonEmptyString(v)) socials[k] = v.trim();
    }
    if (Object.keys(socials).length > 0) id.socials = socials;
  }
  return id;
}

/**
 * Load the fleet registry. Returns the default identity alone when no registry
 * is configured or it cannot be parsed. Malformed individual entries are skipped;
 * if none survive, falls back to the default. Never throws.
 *
 * @param readImpl injectable file reader for tests (defaults to fs.readFileSync).
 * @param path override for the registry path (defaults to ZOE_IDENTITIES_PATH).
 */
export function loadIdentities(
  readImpl: (p: string) => string = (p) => readFileSync(p, 'utf8'),
  path: string | undefined = process.env.ZOE_IDENTITIES_PATH,
): BrandIdentity[] {
  if (!nonEmptyString(path)) return [defaultIdentity()];

  let parsed: unknown;
  try {
    parsed = JSON.parse(readImpl(path));
  } catch {
    // Missing / unreadable / bad JSON -> safe default. Never break the bot.
    return [defaultIdentity()];
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { identities?: unknown[] })?.identities)
      ? (parsed as { identities: unknown[] }).identities
      : [];

  const identities = rawList.map(parseIdentity).filter((x): x is BrandIdentity => x !== null);
  return identities.length > 0 ? identities : [defaultIdentity()];
}

/**
 * Resolve an identity's email creds from the environment at call time. The API
 * key value is read from `process.env[keyEnv]` and never stored in the registry.
 */
export function resolveEmail(
  id: BrandIdentity,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedEmail {
  return { brand: id.brand, inbox: id.email.inbox, apiKey: env[id.email.keyEnv] };
}
