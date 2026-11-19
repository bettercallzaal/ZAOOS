/**
 * flags-command.ts - /flags: which ZOE features are switched on, from Zaal's phone.
 *
 * The 2026-11-17 nightly briefing: "ZOE is ahead of its own flip decisions" -
 * four features built and waiting behind flags. Today the only way to see what
 * is on is an ssh to the VPS and a read of the bot's env file. This reads the
 * running process's own environment, so it answers "what is ZOE running with
 * right now", which a file on disk cannot (a flag set after the last restart is
 * in the file and not in the process).
 *
 * WHAT IT SHOWS, AND WHAT IT NEVER SHOWS
 * --------------------------------------
 * - The decision flags below, each ON or off, with what turning it on does.
 * - Any other ZOE_* / HERMES_* variable whose value is a plain switch word
 *   (1, 0, on, off, true, false), by name.
 * - Never a value that is not a switch word. Tokens, keys, ids, paths and
 *   chat lists are set through the same env, so anything else is shown as
 *   "set" at most, and only for the decision flags.
 *
 * Owner-only, and off unless ZOE_FLAGS_COMMAND=1.
 */
import type { Context } from 'grammy';
import { featureRan } from './feature-ran';
import { OWNER_ONLY_LINE, type OwnerOnlyState, shouldSendOwnerOnlyLine } from './owner-only';

export function flagsCommandEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_FLAGS_COMMAND === '1';
}

export interface DecisionFlag {
  name: string;
  /** The values the code treats as on, read from the code that checks it. */
  on: string[];
  /** Other values the code reads as a named mode, shown as that word. */
  modes?: string[];
  what: string;
}

/**
 * Flags that gate a built feature waiting on a decision. Each name and its
 * on-value were read from the code that checks it (a test keeps every name
 * present in bot/src, so a renamed flag fails here instead of reading "off").
 */
export const DECISION_FLAGS: DecisionFlag[] = [
  { name: 'ZOE_FAILURE_MEMORY', on: ['1'], what: 'a worker starts with its recent failures' },
  { name: 'ZOE_RESEARCH_URL_CHECK', on: ['1'], what: 'research critic fetches every cited URL' },
  {
    name: 'ZOE_MODEL_CLASSIFIER',
    on: ['1'],
    modes: ['shadow'],
    what: 'Haiku picks the concierge model tier',
  },
  { name: 'ZOE_FINAL_REVIEW', on: ['1'], what: 'final PR reviewer' },
  { name: 'ZOE_DEVZ_FOLD', on: ['1'], what: 'ZOE answers /fix in ZAO Devz' },
  { name: 'ZOE_GROUP_SUGGEST', on: ['1'], what: "a listed person's group words become a card" },
  { name: 'ZOE_GROUP_MEMORY', on: ['1'], what: 'groups keep a daily memory' },
  { name: 'ZOE_TASK_COMPLEXITY_ROUTING', on: ['1'], what: 'complexity-based model routing' },
  { name: 'ZOE_MEMBER_DM', on: ['1'], what: 'members can DM ZOE' },
  { name: 'ZOE_QUIET', on: ['1'], what: 'quiet window holds sends' },
  { name: 'ZOE_THINKING_SPINNER', on: ['1'], what: 'thinking spinner' },
  { name: 'ZOE_GAP_UPGRADE', on: ['1'], what: 'weekly capability-gap fit check' },
  { name: 'ZOE_IDEA_CARDS', on: ['1'], what: '/idea cards from the idea group' },
  { name: 'HERMES_ROUTING', on: ['on'], what: 'Hermes model routing' },
];

const SWITCH_WORDS = new Set(['1', '0', 'on', 'off', 'true', 'false']);
const ON_WORDS = new Set(['1', 'on', 'true']);

/** One decision flag's state, never its raw value unless it is a known word. */
export function flagState(flag: DecisionFlag, value: string | undefined): string {
  if (value === undefined || value === '') return 'off';
  if (flag.on.includes(value)) return 'ON';
  if (flag.modes?.includes(value)) return value;
  if (SWITCH_WORDS.has(value.toLowerCase())) return `off (=${value.toLowerCase()})`;
  return 'off (set, not an on value)';
}

/** Pure: the /flags text. */
export function renderFlags(env: NodeJS.ProcessEnv): string {
  const lines = ['ZOE flags in the running process', ''];
  const onFirst = [...DECISION_FLAGS].sort((a, b) => {
    const ra = flagState(a, env[a.name]) === 'off' ? 1 : 0;
    const rb = flagState(b, env[b.name]) === 'off' ? 1 : 0;
    return ra - rb;
  });
  for (const f of onFirst) lines.push(`${flagState(f, env[f.name])} - ${f.name}: ${f.what}`);

  const known = new Set(DECISION_FLAGS.map((f) => f.name));
  const others = Object.keys(env)
    .filter((k) => /^(ZOE|HERMES)_[A-Z0-9_]+$/.test(k) && !known.has(k))
    .filter((k) => ON_WORDS.has(String(env[k]).toLowerCase()))
    .sort();
  lines.push('');
  lines.push(
    others.length ? `Also on: ${others.join(', ')}` : 'No other ZOE or HERMES switch is on.',
  );
  return lines.join('\n');
}

export interface FlagsHandlerDeps {
  zaalId: number;
  ownerOnlyState: OwnerOnlyState;
  enabled?: () => boolean;
  env?: () => NodeJS.ProcessEnv;
  now?: () => number;
}

/** /flags. Off: falls through. A non-owner gets at most the owner-only line. */
export function flagsCommandHandler(deps: FlagsHandlerDeps) {
  const enabled = deps.enabled ?? (() => flagsCommandEnabled());
  const env = deps.env ?? (() => process.env);
  const now = deps.now ?? Date.now;
  return async (ctx: Context, next: () => Promise<void>): Promise<void> => {
    if (!enabled()) return next();
    const uid = ctx.from?.id;
    if (uid !== deps.zaalId) {
      if (uid !== undefined && shouldSendOwnerOnlyLine(deps.ownerOnlyState, uid, now())) {
        await ctx.reply(OWNER_ONLY_LINE).catch(() => undefined);
      }
      return;
    }
    await ctx.reply(renderFlags(env()));
    featureRan('flags-command');
  };
}
