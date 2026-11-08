/**
 * Flag-gated wiring for the ZOE final reviewer (ZOE_FINAL_REVIEW=1, default
 * OFF). index.ts calls registerFinalReview() once; with the flag unset this
 * file registers nothing.
 *
 * Surfaces when ON: `/finalreview owner/repo N` (owner, private chat) runs the
 * review and sends ONE card (send class gated); the `fr:` button re-reads the
 * PR and replies the pinned zao-merge line. It never merges and never posts a
 * GitHub comment: the "ZOE final review" text is only logged for now.
 *
 * Grade: makeHermesGrade (critic-adapter.ts) fetches the diff of the exact head
 * SHA read-only and scores it with the Hermes critic. Any failure there throws,
 * so a card is never raised on an unreviewed diff.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Bot, Context } from 'grammy';
import { featureRan } from '../feature-ran';
import { ZOE_PATHS } from '../memory';
import { CardStore, cardTtlMs, type Card, type CardPersistence } from './card';
import { handleTap, reviewPr, type CardView, type FlowDeps, type ReviewOutcome } from './flow';
import {
  type AutoOfferState,
  autoOfferDailyMax,
  autoOfferEnabled,
  autoOfferIntervalMs,
  autoOfferRepos,
  listOpenPrs,
  parseAutoOfferState,
  recordTick,
  runAutoOfferTick,
  type OpenPr,
  type TickReport,
  utcDay,
} from './auto-offer';
import { makeHermesGrade } from './critic-adapter';
import type { GradeFn } from './grade';
import { isRepoSlug } from './merge-line';
import { defaultGhRunner, readSnapshot } from './snapshot';

export function finalReviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_FINAL_REVIEW === '1';
}

/** Comma-separated GitHub logins whose seat verdicts count. Unset means none (fail closed). */
export function verdictLogins(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.ZOE_FINAL_REVIEW_LOGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function filePersistence(path: string): CardPersistence {
  return {
    load: () => {
      try {
        const arr = JSON.parse(readFileSync(path, 'utf8')) as Card[];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    },
    save: (cards) => {
      try {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, JSON.stringify(cards));
      } catch (e) {
        console.error('[zoe/final-review] card save failed:', (e as Error)?.message);
      }
    },
  };
}

export interface FinalReviewHooks {
  zaalId: number;
  ownerOnly: (ctx: Context) => Promise<boolean>;
  isFromZaal: (ctx: Context) => boolean;
  scopeOf: (ctx: Context) => string;
  grade?: GradeFn;
}

export function registerFinalReview(bot: Bot<Context>, hooks: FinalReviewHooks): boolean {
  if (!finalReviewEnabled()) return false;
  const deps: FlowDeps = {
    store: new CardStore(filePersistence(join(ZOE_PATHS.home, 'final-review-cards.json'))),
    read: (repo, n) => readSnapshot(repo, n, defaultGhRunner),
    grade: hooks.grade ?? makeHermesGrade({ gh: defaultGhRunner }),
    allowedLogins: verdictLogins(),
    now: () => Date.now(),
    ttlMs: cardTtlMs(),
  };

  const sendCard = async (view: CardView): Promise<void> => {
    await bot.api.sendMessage(hooks.zaalId, view.text, {
      reply_markup: { inline_keyboard: view.buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) },
      zoeSendClass: 'gated',
    } as never);
  };

  bot.command('finalreview', async (ctx) => {
    if (!(await hooks.ownerOnly(ctx))) return;
    if (hooks.scopeOf(ctx) !== 'private') return;
    const m = /^\/finalreview(?:@\w+)?\s+(\S+)\s+#?(\d+)\s*$/.exec(ctx.message?.text ?? '');
    if (!m || !isRepoSlug(m[1])) {
      await ctx.reply('Use: /finalreview owner/repo 123');
      return;
    }
    const out = await reviewPr(m[1], Number(m[2]), deps);
    featureRan('final-review', `review ${out.kind}`);
    if (out.kind === 'no-card') {
      if (out.comment) console.log(`[zoe/final-review] draft comment (not posted):\n${out.comment}`);
      await ctx.reply(`No card for ${m[1]} #${m[2]}: ${out.reason}.`);
      return;
    }
    console.log(`[zoe/final-review] draft comment (not posted):\n${out.comment}`);
    for (const old of out.superseded) console.log(`[zoe/final-review] card ${old.id} superseded by ${out.view.card.id}`);
    await sendCard(out.view);
  });

  bot.callbackQuery(/^fr:/, async (ctx) => {
    const out = await handleTap(
      { data: ctx.callbackQuery.data ?? '', fromZaal: hooks.isFromZaal(ctx), scope: hooks.scopeOf(ctx) },
      deps,
    );
    await ctx.answerCallbackQuery().catch(() => {});
    // Plain text, no parse mode, so the line pastes as it reads.
    await ctx.reply(out.text).catch(() => {});
    featureRan('final-review', out.mergeLine ? 'merge line shown' : 'tap refused');
  });

  startAutoOffer(deps, sendCard);
  return true;
}

/** Where the auto-offer keeps its day count and settled heads between restarts. */
export interface AutoOfferIo {
  load: () => unknown;
  save: (state: AutoOfferState) => void;
}

function autoOfferFileIo(path: string): AutoOfferIo {
  return {
    load: () => {
      try {
        return JSON.parse(readFileSync(path, 'utf8')) as unknown;
      } catch {
        return null; // missing or unreadable: a fresh day, nothing settled
      }
    },
    save: (state) => {
      try {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, JSON.stringify(state));
      } catch (e) {
        console.error('[zoe/final-review-auto] state save failed:', (e as Error)?.message);
      }
    },
  };
}

/**
 * One auto-offer tick with the per-day cap and restart persistence. State is
 * loaded on the FIRST tick (not at boot), saved after every tick that ran.
 * At the cap the tick reads nothing and logs once per day.
 */
export function makeAutoOfferTick(opts: {
  repos: readonly string[];
  list: (repo: string) => Promise<OpenPr[] | null>;
  review: (repo: string, n: number) => Promise<ReviewOutcome>;
  send: (view: CardView) => Promise<void>;
  dailyMax: number;
  io: AutoOfferIo;
  now?: () => Date;
  log?: (line: string) => void;
}): () => Promise<TickReport | null> {
  const now = opts.now ?? (() => new Date());
  const log = opts.log ?? ((line: string) => console.error(line));
  let state: AutoOfferState | null = null;
  let settled = new Set<string>();
  let capLoggedFor = '';
  return async () => {
    const today = utcDay(now());
    if (state === null) {
      state = parseAutoOfferState(opts.io.load(), today);
      settled = new Set(state.settled);
    }
    const left = opts.dailyMax - (state.day === today ? state.gradedToday : 0);
    if (left <= 0) {
      if (capLoggedFor !== today) {
        log(`[zoe/final-review-auto] daily grade cap ${opts.dailyMax} reached for ${today} (UTC); no reads until the next UTC day`);
        capLoggedFor = today;
      }
      return null;
    }
    const r = await runAutoOfferTick({
      repos: opts.repos,
      list: opts.list,
      review: opts.review,
      send: opts.send,
      settled,
      log,
      maxGrades: left,
    });
    state = recordTick(state, today, r.graded, settled);
    opts.io.save(state);
    return r;
  };
}

/**
 * The auto-offer interval (auto-offer.ts). Starts only with ZOE_FINAL_REVIEW=1
 * AND ZOE_FINAL_REVIEW_AUTO=1, and reads only the repos in
 * ZOE_FINAL_REVIEW_REPOS. One tick at a time; a tick that throws is logged and
 * the next one runs. Returns the timer, or null when nothing was scheduled.
 */
export function startAutoOffer(
  deps: FlowDeps,
  sendCard: (view: CardView) => Promise<void>,
  env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof setInterval> | null {
  if (!autoOfferEnabled(env)) return null;
  const repos = autoOfferRepos(env);
  if (repos.length === 0) {
    console.error('[zoe/final-review-auto] ZOE_FINAL_REVIEW_AUTO=1 but ZOE_FINAL_REVIEW_REPOS names no valid repo; not scheduled');
    return null;
  }
  const runTick = makeAutoOfferTick({
    repos,
    list: (repo) => listOpenPrs(repo, defaultGhRunner),
    review: (repo, n) => reviewPr(repo, n, deps),
    send: sendCard,
    dailyMax: autoOfferDailyMax(env),
    io: autoOfferFileIo(join(ZOE_PATHS.home, 'final-review-auto-state.json')),
  });
  let running = false;
  const tick = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const r = await runTick();
      if (r) featureRan('final-review-auto', `tick listed=${r.listed} reviewed=${r.reviewed} graded=${r.graded} carded=${r.carded}`);
    } catch (e) {
      console.error('[zoe/final-review-auto] tick failed:', (e as Error)?.message);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), autoOfferIntervalMs(env));
  timer.unref?.();
  return timer;
}
