/**
 * The bot fleet registry. One engine, many masks (doc 1021). Each entry is a
 * bot ZOE runs from this single process; its brain is its ICM box (or
 * PERSONA_DEFAULT for ZOE itself). A new bot = a new entry + a token in .env +
 * an ICM box. No new code.
 */
export interface FleetBot {
  name: string;
  tokenEnvVar: string; // env var holding this bot's Telegram token
  icmBoxId: string | null; // ICM box id = brain; null => ZOE's PERSONA_DEFAULT
  role: string;
  audience: 'internal' | 'public';
}

export const FLEET: FleetBot[] = [
  { name: 'ZOE', tokenEnvVar: 'ZOE_BOT_TOKEN', icmBoxId: null, role: 'conductor', audience: 'internal' },
  {
    name: 'ZAO Devz',
    tokenEnvVar: 'ZAODEVZ_BOT_TOKEN',
    icmBoxId: 'icm_ohb0F_XOYDz9Tw_w4yX3PA', // The ZAO box (verified resolves); swap to a dedicated zaodevz box later
    role: 'zao-devz brand + inbox',
    audience: 'internal',
  },
];

/** Bots whose token is actually present in env - an unminted bot is skipped, not fatal. */
export function activeFleet(env: NodeJS.ProcessEnv = process.env): FleetBot[] {
  return FLEET.filter((b) => {
    const v = env[b.tokenEnvVar];
    return typeof v === 'string' && v.length > 0;
  });
}
