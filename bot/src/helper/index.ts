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
 *   HELPER_BOT_TOKEN      its own token from BotFather; never another bot's
 *   HELPER_ALLOWED_IDS    comma-separated numeric Telegram user ids
 *   HELPER_DOCS_DIR       directory holding AGENT.md, README.md, WALKTHROUGH.md
 *   HELPER_MODEL          default claude-opus-5-5
 *   HELPER_DAILY_CAP      default 40 questions a day
 *   ANTHROPIC_API_KEY     the model key
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
import { parseAllowedIds, parseCap, tokenCollision, type CapState } from './gate';
import { handleMessage, type HelperDeps } from './handle';

const STATE_DIR = join(process.env.HOME ?? '.', '.zao', 'nc-helper');
const LOCK_PATH = join(STATE_DIR, 'lock');
const CAP_PATH = join(STATE_DIR, 'cap.json');
const BEAT_PATH = join(process.env.HOME ?? '.', '.zao', 'beats', 'nc-helper');
const BEAT_MS = 60_000;
/** A lock not refreshed for this long belongs to a dead process. */
const LOCK_STALE_MS = 3 * BEAT_MS;

function fail(message: string): never {
  console.error(`[helper] not starting: ${message}`);
  process.exit(1);
}

async function readCap(): Promise<CapState | null> {
  try {
    return JSON.parse(await fs.readFile(CAP_PATH, 'utf8')) as CapState;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (process.env.HELPER_ENABLED !== '1') {
    console.log('[helper] HELPER_ENABLED is not 1. Exiting without polling.');
    return;
  }

  const token = process.env.HELPER_BOT_TOKEN?.trim();
  if (!token) fail('HELPER_BOT_TOKEN is not set');
  const clash = tokenCollision(process.env, token);
  if (clash) fail(`HELPER_BOT_TOKEN equals ${clash}; this bot must have its own token`);
  if (!process.env.ANTHROPIC_API_KEY) fail('ANTHROPIC_API_KEY is not set');

  // An empty list is allowed on purpose: the first run exists to hand a
  // stranger his own id. Nobody reaches the model until one is added.
  const allowed = parseAllowedIds(process.env.HELPER_ALLOWED_IDS);
  const docsDir = process.env.HELPER_DOCS_DIR;
  if (!docsDir) fail('HELPER_DOCS_DIR is not set');
  const docs = await loadDocs(docsDir).catch((err: unknown) =>
    fail(`cannot read the handoff files: ${err instanceof Error ? err.message : String(err)}`),
  );
  const model = process.env.HELPER_MODEL?.trim() || DEFAULT_MODEL;
  const cap = parseCap(process.env.HELPER_DAILY_CAP);

  const lock = await acquireTickLock(LOCK_PATH, { staleMs: LOCK_STALE_MS });
  if (!lock.acquired) fail(`another instance holds ${LOCK_PATH} (${lock.reason})`);

  await fs.mkdir(dirname(BEAT_PATH), { recursive: true });
  const beat = async (): Promise<void> => {
    const stamp = String(Date.now());
    await fs.writeFile(BEAT_PATH, stamp).catch(() => undefined);
    await fs.writeFile(LOCK_PATH, stamp).catch(() => undefined);
  };
  await beat();
  const beatTimer = setInterval(() => void beat(), BEAT_MS);

  for (const d of docs) console.log(`[helper] loaded ${d.name} sha256 ${d.sha256.slice(0, 12)}`);
  console.log(`[helper] model ${model}, cap ${cap} a day, ${allowed.length} allowed id(s)`);

  const deps: HelperDeps = {
    allowed,
    system: buildSystemPrompt(docs),
    model,
    cap,
    client: new Anthropic(),
    readCap,
    writeCap: (state) => fs.writeFile(CAP_PATH, JSON.stringify(state)),
    now: () => new Date(),
    refusals: newOwnerOnlyState(),
    history: new Map(),
  };
  const bot = new Bot(token);
  // Strips model scratchpad tags at egress, as on every bot in this tree.
  installAgentMarkupGuard(bot);
  let announced = false;

  bot.on('message:text', async (ctx) => {
    const fromId = ctx.from?.id;
    const text = ctx.message.text;
    const out = await handleMessage(deps, { chatType: ctx.chat.type, fromId, text });
    if (out.kind === 'ignored') return;
    if (out.reply) await ctx.reply(out.reply).catch(() => undefined);

    // Message text is never logged: ids, sizes and counts only.
    if (out.kind === 'answered' || out.kind === 'declined') {
      console.log(
        `[helper] ${out.kind} user ${fromId}: ${text.length} chars in, ` +
          `${out.inputTokens} + ${out.outputTokens} tokens, ${out.countToday} of ${cap} today`,
      );
      if (!announced && out.kind === 'answered') {
        announced = true;
        console.log(`[helper/ran] first answer since boot - model ${model}`);
      }
    } else if (out.kind === 'failed') {
      console.error(`[helper] model call failed for user ${fromId}: ${out.what}`);
    } else if (out.kind !== 'refused' || out.reply) {
      console.log(`[helper] ${out.kind} user ${fromId}`);
    }
  });

  bot.catch((err) =>
    console.error('[helper] handler error:', err.error instanceof Error ? err.error.name : 'unknown'),
  );

  const shutdown = async (): Promise<void> => {
    clearInterval(beatTimer);
    await bot.stop().catch(() => undefined);
    await releaseTickLock(LOCK_PATH);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  await bot.start({
    allowed_updates: ['message'],
    onStart: (me) => console.log(`[helper] polling as @${me.username}`),
  });
}

main().catch((err: unknown) => {
  console.error('[helper] fatal:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
