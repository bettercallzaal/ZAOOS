/**
 * North Creek helper - a Telegram bot that answers one outside collaborator's
 * questions about his own website, and does nothing else.
 *
 * Design and the reasons for each limit: research/agents/2661-north-creek-helper-telegram-bot.
 * Zaal chose a separate bot over a ZOE mode (vault decisions item 166, 2026-10-11).
 *
 * THIS FILE IS AN ENTRYPOINT. Importing it starts a poller. Never import it in
 * a test or to "check it boots" (agent-loops.md rule 21); the logic that can be
 * tested lives in handle.ts, gate.ts, docs.ts and answer.ts.
 *
 * It loads ONLY its own env file, never bot/.env, so it holds none of ZOE's
 * keys: its own bot token, one model key, and the settings below.
 *
 *   HELPER_ENABLED        must be 1, or the process exits without polling
 *   HELPER_BOT_TOKEN      its own token from BotFather
 *   HELPER_BOT_ID         the numeric id of that bot; the token must be for it
 *   HELPER_ALLOWED_IDS    comma-separated numeric Telegram user ids, at least one
 *   HELPER_DOCS_DIR       directory holding AGENT.md, README.md, WALKTHROUGH.md
 *   ANTHROPIC_API_KEY     the model key
 *   HELPER_MODEL          optional, default claude-opus-5-5
 *   HELPER_DAILY_CAP      optional, default 40 questions a day
 *
 * Every required setting that is unset, empty or malformed is a refusal to
 * start. Nothing here defaults to "allow".
 *
 * Run: npm run start:helper, or the nc-helper systemd user unit.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: process.env.HELPER_ENV_FILE || `${process.env.HOME}/.zao/private/nc-helper.env` });

import Anthropic from '@anthropic-ai/sdk';
import { Bot } from 'grammy';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';

import { installAgentMarkupGuard } from '../agent-markup';
import { newOwnerOnlyState } from '../zoe/owner-only';
import { acquireTickLock, releaseTickLock } from '../zoe/tick-lock';
import { DEFAULT_MODEL } from './answer';
import { buildSystemPrompt, loadDocs } from './docs';
import {
  checkIdentity,
  holderAlive,
  identityProblem,
  parseAllowedIds,
  parseBotId,
  parseCap,
  parseCapState,
  pollIsFresh,
  type CapRead,
} from './gate';
import { handleMessage, logLine, type HelperDeps } from './handle';

const STATE_DIR = join(process.env.HOME ?? '.', '.zao', 'nc-helper');
const LOCK_PATH = join(STATE_DIR, 'lock');
const PID_PATH = join(STATE_DIR, 'lock.pid');
const CAP_PATH = join(STATE_DIR, 'cap.json');
const BEAT_PATH = join(process.env.HOME ?? '.', '.zao', 'beats', 'nc-helper');
const BEAT_MS = 60_000;
/** A lock not refreshed for this long belongs to a dead process. */
const LOCK_STALE_MS = 3 * BEAT_MS;
/** One model call may take this long, then the user gets the error line. */
const MODEL_TIMEOUT_MS = 60_000;

function fail(message: string): never {
  console.error(`[helper] not starting: ${message}`);
  process.exit(1);
}

/** No file yet is the first question ever. Any other failure is 'unreadable'. */
async function readCap(): Promise<CapRead> {
  let text: string;
  try {
    text = await fs.readFile(CAP_PATH, 'utf8');
  } catch (err: unknown) {
    return (err as NodeJS.ErrnoException).code === 'ENOENT' ? null : 'unreadable';
  }
  return parseCapState(text);
}

async function main(): Promise<void> {
  if (process.env.HELPER_ENABLED !== '1') {
    console.log('[helper] HELPER_ENABLED is not 1. Exiting without polling.');
    return;
  }

  const token = process.env.HELPER_BOT_TOKEN?.trim();
  if (!token) fail('HELPER_BOT_TOKEN is not set');
  const botId = parseBotId(process.env.HELPER_BOT_ID);
  if (!botId.ok) fail(botId.why);
  // Before any network call: is this token even for the bot we were told to be?
  const mismatch = identityProblem(botId.value, token);
  if (mismatch) fail(mismatch);
  if (!process.env.ANTHROPIC_API_KEY) fail('ANTHROPIC_API_KEY is not set');

  const allowed = parseAllowedIds(process.env.HELPER_ALLOWED_IDS);
  if (!allowed.ok) fail(allowed.why);
  const cap = parseCap(process.env.HELPER_DAILY_CAP);
  if (!cap.ok) fail(cap.why);
  const docsDir = process.env.HELPER_DOCS_DIR;
  if (!docsDir) fail('HELPER_DOCS_DIR is not set');
  const docs = await loadDocs(docsDir).catch((err: unknown) =>
    fail(`cannot read the handoff files: ${err instanceof Error ? err.message : String(err)}`),
  );
  const model = process.env.HELPER_MODEL?.trim() || DEFAULT_MODEL;

  // A cap file that is already damaged is found at boot, not at the first question.
  if ((await readCap()) === 'unreadable') fail(`${CAP_PATH} exists but cannot be read as a cap state`);

  const bot = new Bot(token);
  // Strips model scratchpad tags at egress, as on every bot in this tree.
  installAgentMarkupGuard(bot);

  // getMe, once, before polling: Telegram's own word on which bot this token
  // is. A mismatch or a failed call is a refusal to start.
  const wrongBot = await checkIdentity(botId.value, token, async () => {
    await bot.init();
    return bot.botInfo;
  });
  if (wrongBot) fail(wrongBot);

  // One instance per host, judged two ways. The pid file says whether the last
  // holder is still running; the lock's timestamp covers a pid file that was
  // lost. A live holder blocks us however old its timestamp; a dead one is
  // cleared at once instead of after the stale window.
  const pidText = await fs.readFile(PID_PATH, 'utf8').catch(() => null);
  const alive = holderAlive(pidText, (pid) => {
    if (pid === process.pid) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (err: unknown) {
      // EPERM means it exists and is not ours to signal: still alive.
      return (err as NodeJS.ErrnoException).code === 'EPERM';
    }
  });
  if (alive) fail(`another instance is running (${PID_PATH})`);
  if (pidText !== null) await releaseTickLock(LOCK_PATH);
  // Taken last, so no refusal above leaves a lock behind.
  const lock = await acquireTickLock(LOCK_PATH, { staleMs: LOCK_STALE_MS });
  if (!lock.acquired) fail(`another instance holds ${LOCK_PATH} (${lock.reason})`);
  await fs.writeFile(PID_PATH, String(process.pid));

  // The heartbeat follows the polling loop, not the process: it is written only
  // while getUpdates keeps succeeding. The lock is refreshed either way, because
  // the lock means "this process exists".
  let lastPollOk: number | null = null;
  bot.api.config.use(async (prev, method, payload, signal) => {
    const res = await prev(method, payload, signal);
    if (method === 'getUpdates' && res.ok) lastPollOk = Date.now();
    return res;
  });
  await fs.mkdir(dirname(BEAT_PATH), { recursive: true });
  const tick = async (): Promise<void> => {
    const now = Date.now();
    await fs.writeFile(LOCK_PATH, String(now)).catch(() => undefined);
    if (pollIsFresh(lastPollOk, now)) await fs.writeFile(BEAT_PATH, String(now)).catch(() => undefined);
  };
  const beatTimer = setInterval(() => void tick(), BEAT_MS);

  for (const d of docs) console.log(`[helper] loaded ${d.name} sha256 ${d.sha256.slice(0, 12)}`);
  console.log(`[helper] model ${model}, cap ${cap.value} a day, ${allowed.value.length} allowed id(s)`);

  const deps: HelperDeps = {
    allowed: allowed.value,
    system: buildSystemPrompt(docs),
    model,
    cap: cap.value,
    client: new Anthropic({ timeout: MODEL_TIMEOUT_MS, maxRetries: 1 }),
    readCap,
    writeCap: (state) => fs.writeFile(CAP_PATH, JSON.stringify(state)),
    now: () => new Date(),
    refusals: newOwnerOnlyState(),
    history: new Map(),
    recent: new Map(),
  };
  let announced = false;

  // One message at a time, whatever the poller does: the cap is read, checked
  // and written as one step, so two questions can never share a count.
  let queue: Promise<unknown> = Promise.resolve();
  const inTurn = <T>(work: () => Promise<T>): Promise<T> => {
    const run = queue.then(work, work);
    queue = run.catch(() => undefined);
    return run;
  };

  bot.on('message:text', async (ctx) => {
    const fromId = ctx.from?.id;
    const text = ctx.message.text;
    const out = await inTurn(() => handleMessage(deps, { chatType: ctx.chat.type, fromId, text }));
    if (out.kind === 'ignored') return;
    if (out.reply) await ctx.reply(out.reply).catch(() => undefined);

    // Ids, sizes and counts only. logLine is never given the text.
    const line = logLine(out, fromId, text.length, cap.value);
    if (line) (out.kind === 'failed' || out.kind === 'cap-unreadable' ? console.error : console.log)(line);
    if (!announced && out.kind === 'answered') {
      announced = true;
      console.log(`[helper/ran] first answer since boot - model ${model}`);
    }
  });

  bot.catch((err) =>
    console.error('[helper] handler error:', err.error instanceof Error ? err.error.name : 'unknown'),
  );

  const shutdown = async (): Promise<void> => {
    clearInterval(beatTimer);
    await bot.stop().catch(() => undefined);
    await releaseTickLock(LOCK_PATH);
    await fs.unlink(PID_PATH).catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  await bot.start({
    allowed_updates: ['message'],
    onStart: (me) => console.log(`[helper] polling as @${me.username} (id ${me.id})`),
  });
}

main().catch((err: unknown) => {
  console.error('[helper] fatal:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
