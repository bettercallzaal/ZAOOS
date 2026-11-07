/**
 * ZAO Devz folded into ZOE (ruling 304, 2026-11-07; plan: bot/src/devz/FOLD-INTO-ZOE.md, #4260).
 *
 * What the ZAO Devz bot does in the ZAO Devz chat, ZOE does here, in one voice:
 *   - `/fix <issue>`        run the Hermes coder + critic loop (PR-only, never merges)
 *   - `@zoe fix: <issue>`   the same path, from a mention that starts with "fix:"
 *   - `/fix_status [id]`    list open runs, or one run by id prefix
 *
 * Same three gates as the Devz bot (bot/src/devz/index.ts kickOffFix): sender in
 * BOT_ADMIN_TELEGRAM_IDS, chat is ZAO_DEVZ_CHAT_ID, the claude CLI is on the host.
 *
 * OFF unless ZOE_DEVZ_FOLD=1 and ZAO_DEVZ_CHAT_ID is a number, so ZOE and the Devz bot never
 * both answer `/fix` in one chat. When off, the commands are not registered at all and the
 * mention path returns false, so ZOE behaves exactly as before.
 *
 * featureRan names are the Devz ones (#4252) so a count carries across the switch.
 *
 * findRunByPrefix / formatRun are copied from bot/src/devz/index.ts, which cannot be imported:
 * it is an entrypoint that boots two bots at module load (agent-loops.md rule 21). The copy goes
 * when bot/src/devz/ is deleted (plan step 4, Zaal's word).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { Bot, Context } from 'grammy';
import type { DispatchInput, HermesNarrator } from '../hermes/runner';
import type { HermesRun } from '../hermes/types';

export interface DevzFoldConfig {
  chatId: number;
  adminIds: number[];
  zaalId: number | null;
}

/** The fold config, or null when the fold is off. Fails closed on any missing or bad value. */
export function readDevzFoldConfig(env: NodeJS.ProcessEnv = process.env): DevzFoldConfig | null {
  if (env.ZOE_DEVZ_FOLD !== '1') return null;
  const chatId = Number(env.ZAO_DEVZ_CHAT_ID ?? '');
  if (!env.ZAO_DEVZ_CHAT_ID || !Number.isFinite(chatId) || chatId === 0) return null;
  const adminIds = (env.BOT_ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const zaalId = Number(env.ZAAL_TELEGRAM_ID ?? '0') || null;
  return { chatId, adminIds, zaalId };
}

/**
 * The issue text of a mention that starts with "fix:", or null. A plain mention of ZOE is not a
 * fix (it stays a normal concierge turn); only "@bot fix: ..." is.
 */
export function parseMentionFix(text: string, botUsername: string | null): string | null {
  if (!botUsername) return null;
  const escaped = botUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^\\s*@${escaped}\\b[\\s,:]*fix:\\s*([\\s\\S]*)$`, 'i').exec(text);
  return m ? m[1].trim() : null;
}

/** Strip "/fix", "/fix@bot", "/fix_status" etc. from the front of a command message. */
export function commandArg(text: string, command: string): string {
  return text.replace(new RegExp(`^/${command}(@\\w+)?\\s*`), '').trim();
}

export type GateResult = { ok: true } | { ok: false; reply: string };

/** The Devz bot's gates, in its order. */
export async function checkFixGates(
  cfg: DevzFoldConfig,
  input: { chatId: number | undefined; fromId: number | undefined; issue: string },
  claudeAvailable: () => Promise<boolean>,
): Promise<GateResult> {
  if (!input.fromId || !cfg.adminIds.includes(input.fromId)) {
    return { ok: false, reply: 'Hermes is admin-only. Add yourself to BOT_ADMIN_TELEGRAM_IDS.' };
  }
  if (input.chatId !== cfg.chatId) {
    return { ok: false, reply: `/fix only runs from the ZAO Devz chat (id ${cfg.chatId}). You're in ${input.chatId}.` };
  }
  if (!(await claudeAvailable())) {
    return { ok: false, reply: "Can't find 'claude' CLI on PATH. Install Claude Code on the bot host (Max plan)." };
  }
  if (input.issue.length < 10) {
    return { ok: false, reply: 'Need at least 10 characters describing what to build / fix.' };
  }
  return { ok: true };
}

/** True when the claude CLI is reachable (HERMES_CLAUDE_BIN, else `which claude`). */
export async function claudeOnHost(): Promise<boolean> {
  if (existsSync(process.env.HERMES_CLAUDE_BIN ?? '/dev/null')) return true;
  return new Promise((resolve) => {
    const child = spawn('which', ['claude']);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

const short = (id: string): string => id.slice(0, 8);

/**
 * One voice: ZOE narrates both halves with a role prefix, where the Devz chat used to hear two
 * bots. Text matches the Devz narrator so the chat reads the same.
 */
export function buildOneVoiceNarrator(
  say: (text: string, opts?: { parse_mode?: 'HTML' }) => Promise<unknown>,
  zaalId: number | null,
): HermesNarrator {
  return {
    async onCoderStart(runId, attempt, max, issue) {
      const truncated = issue.length > 120 ? `${issue.slice(0, 120)}...` : issue;
      await say(`Coder: starting (attempt ${attempt}/${max}) on run ${short(runId)}\nIssue: ${truncated}`);
    },
    async onCoderDone(runId, attempt, files) {
      const list = files.slice(0, 8).map((f) => `  - ${f}`).join('\n');
      const more = files.length > 8 ? `\n  ...+${files.length - 8} more` : '';
      await say(`Coder: done on run ${short(runId)} (attempt ${attempt}). Changed ${files.length} files:\n${list}${more}`);
    },
    async onCriticStart(runId) {
      await say(`Critic: reviewing run ${short(runId)}. Reading diff + source.`);
    },
    async onCriticDone(runId, score, feedback) {
      const verdict = score >= 70 ? 'PASS' : score >= 50 ? 'NEEDS REVISION' : 'REJECT';
      await say(`Critic: score ${score}/100 (${verdict}) on run ${short(runId)}\nFeedback: ${feedback}`);
    },
    async onRetry(runId, nextAttempt, feedback) {
      await say(`Coder: retrying run ${short(runId)} (attempt ${nextAttempt}). Critic said: ${feedback}`);
    },
    async onPrOpened(runId, prNumber, prUrl, score) {
      const cc = zaalId ? `\ncc <a href="tg://user?id=${zaalId}">Zaal</a> - push when good` : '';
      await say(`READY. Score ${score}/100. PR #${prNumber}: ${prUrl}\nRun: ${short(runId)}${cc}`, {
        parse_mode: 'HTML',
      });
    },
    async onEscalated(runId, reason) {
      await say(`ESCALATED. Hit max attempts on run ${short(runId)}.\nLast critic feedback: ${reason}\nNeeds human.`);
    },
    async onFailed(runId, reason) {
      await say(`FAILED. Run ${short(runId)} crashed.\nReason: ${reason}`);
    },
  };
}

type MinimalRun = Pick<HermesRun, 'id' | 'status' | 'fixer_attempts' | 'critic_score' | 'pr_url' | 'issue_text'>;

export interface DevzFoldDeps {
  dispatch: (input: DispatchInput, narrator: HermesNarrator) => Promise<unknown>;
  listOpenRuns: (limit: number) => Promise<MinimalRun[]>;
  getRun: (id: string) => Promise<MinimalRun | null>;
  claudeAvailable: () => Promise<boolean>;
  featureRan: (feature: string, detail?: string) => void;
}

/** Copied from bot/src/devz/index.ts (see the header). */
export function formatRun(r: MinimalRun): string {
  const issue = r.issue_text.length > 80 ? `${r.issue_text.slice(0, 80)}...` : r.issue_text;
  return [
    `${short(r.id)} | ${r.status} | attempts=${r.fixer_attempts} | score=${r.critic_score ?? '-'}`,
    `issue: ${issue}`,
    r.pr_url ? `pr: ${r.pr_url}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function findRunByPrefix(prefix: string, deps: DevzFoldDeps): Promise<MinimalRun | null> {
  if (prefix.length >= 36) return deps.getRun(prefix);
  const open = await deps.listOpenRuns(50);
  return open.find((r) => r.id.startsWith(prefix)) ?? null;
}

/** The reply for `/fix_status [id]`. */
export async function fixStatusReply(arg: string, deps: DevzFoldDeps): Promise<string> {
  if (arg) {
    const r = await findRunByPrefix(arg, deps);
    if (!r) return `No run matching ${arg}`;
    deps.featureRan('devz-fix-status', 'zoe one run');
    return formatRun(r);
  }
  const open = await deps.listOpenRuns(10);
  if (open.length === 0) return 'No open Hermes runs.';
  deps.featureRan('devz-fix-status', 'zoe list');
  return open.map(formatRun).join('\n\n');
}

/**
 * Gate, acknowledge, and start one run. Fire-and-forget: the narrator reports progress into the
 * chat (and the thread) the request came from.
 */
export async function startFix(
  ctx: Context,
  issue: string,
  source: 'command' | 'mention',
  cfg: DevzFoldConfig,
  deps: DevzFoldDeps,
): Promise<void> {
  const chatId = ctx.chat?.id;
  const fromId = ctx.from?.id;
  const gate = await checkFixGates(cfg, { chatId, fromId, issue }, deps.claudeAvailable);
  if (!gate.ok) {
    await ctx.reply(gate.reply);
    return;
  }
  const threadId = ctx.message?.message_thread_id;
  const say = (text: string, opts?: { parse_mode?: 'HTML' }) =>
    ctx.api.sendMessage(cfg.chatId, text, { ...(threadId ? { message_thread_id: threadId } : {}), ...opts });

  await ctx.reply('Got it. Running the coder + critic loop; updates follow here.');
  deps.featureRan('devz-fix', `zoe ${source}`);

  void deps
    .dispatch(
      { triggered_by_telegram_id: fromId as number, triggered_in_chat_id: cfg.chatId, issue_text: issue },
      buildOneVoiceNarrator(say, cfg.zaalId),
    )
    .then(() => deps.featureRan('devz-run-finished', 'zoe'))
    .catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      await say(`Hermes crashed outside the loop: ${msg}`).catch(() => {
        console.error('[zoe/devz-fold] failed to post crash notification', msg);
      });
    });
}

/** Register `/fix` and `/fix_status`. Call once at boot, only when readDevzFoldConfig() is not null. */
export function registerDevzFoldCommands(bot: Bot, cfg: DevzFoldConfig, deps: DevzFoldDeps): void {
  bot.command('fix', async (ctx) => {
    if (ctx.chat?.id !== cfg.chatId) return; // ZOE's other chats: not a ZOE command there
    const issue = commandArg(ctx.message?.text ?? '', 'fix');
    if (!issue) {
      await ctx.reply('Usage: /fix <issue> - or tag me with "fix: <issue>". Min 10 chars.');
      return;
    }
    await startFix(ctx, issue, 'command', cfg, deps);
  });

  bot.command('fix_status', async (ctx) => {
    if (ctx.chat?.id !== cfg.chatId) return;
    const arg = commandArg(ctx.message?.text ?? '', 'fix_status');
    await ctx.reply(await fixStatusReply(arg, deps));
  });
}

/**
 * The `@zoe fix: ...` path in the ZAO Devz chat. Returns true when it handled the message, so the
 * caller must not also pass it to the concierge (first-handler-wins.md rule 2). Runs BEFORE the
 * concierge; a plain mention returns false and falls through untouched.
 */
export async function maybeHandleMentionFix(
  ctx: Context,
  text: string,
  botUsername: string | null,
  cfg: DevzFoldConfig | null,
  deps: DevzFoldDeps,
): Promise<boolean> {
  if (!cfg || ctx.chat?.id !== cfg.chatId) return false;
  const issue = parseMentionFix(text, botUsername);
  if (issue === null) return false;
  await startFix(ctx, issue, 'mention', cfg, deps);
  return true;
}
