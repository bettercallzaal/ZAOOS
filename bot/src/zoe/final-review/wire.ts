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
import { handleTap, reviewPr, type FlowDeps } from './flow';
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
    await bot.api.sendMessage(hooks.zaalId, out.view.text, {
      reply_markup: { inline_keyboard: out.view.buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) },
      zoeSendClass: 'gated',
    } as never);
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

  return true;
}
