import { runFixer } from './coder';
import { runCritic } from './critic';
import { cleanupWorkdir, cloneAndBranch, commitAndPush, makeWorkdir } from './git';
import { openPullRequest } from './pr';
import { runPreFlightGate } from './preflight';
import { watchPullRequest } from './pr-watcher';
import { createRun, updateRun } from './db';
import {
  HERMES_DEFAULT_MAX_ATTEMPTS,
  HERMES_PASS_THRESHOLD,
  type HermesRepoTarget,
  type HermesRun,
} from './types';

// Notional API-rate cost (Hermes runs under Max plan auth via Claude Code CLI;
// actual marginal cost is ~$0 because the Max sub absorbs it). Kept as a "would-have-cost"
// signal for spend awareness.
const COST_PER_MTOK_OPUS_IN = 15.0;
const COST_PER_MTOK_OPUS_OUT = 75.0;
const COST_PER_MTOK_SONNET_IN = 3.0;
const COST_PER_MTOK_SONNET_OUT = 15.0;

function estimateNotionalCost(fixerIn: number, fixerOut: number, criticIn: number, criticOut: number): number {
  const fixer = (fixerIn / 1_000_000) * COST_PER_MTOK_OPUS_IN + (fixerOut / 1_000_000) * COST_PER_MTOK_OPUS_OUT;
  const critic =
    (criticIn / 1_000_000) * COST_PER_MTOK_SONNET_IN + (criticOut / 1_000_000) * COST_PER_MTOK_SONNET_OUT;
  return Number((fixer + critic).toFixed(4));
}

// Fleet daily ceiling: in-process counter that resets at UTC midnight.
// Auto-pauses new /fix dispatches if today's notional spend exceeds the cap.
// Default $20/day per doc 527 cost calibration (well under Max plan flat).
const FLEET_DAILY_USD_CAP = Number(process.env.HERMES_FLEET_DAILY_USD_CAP ?? '20');
let _todayUsdSpent = 0;
let _todayDateUtc = new Date().toISOString().slice(0, 10);

function fleetDailyGuard(notionalUsd: number): { ok: boolean; reason?: string } {
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (todayUtc !== _todayDateUtc) {
    _todayDateUtc = todayUtc;
    _todayUsdSpent = 0;
  }
  if (_todayUsdSpent + notionalUsd > FLEET_DAILY_USD_CAP) {
    return {
      ok: false,
      reason: `fleet daily cap $${FLEET_DAILY_USD_CAP} would be exceeded (current $${_todayUsdSpent.toFixed(2)} + this run notional $${notionalUsd.toFixed(2)})`,
    };
  }
  _todayUsdSpent += notionalUsd;
  return { ok: true };
}

export interface DispatchInput {
  triggered_by_telegram_id: number;
  triggered_in_chat_id: number;
  issue_text: string;
  /** Which repo to clone + open the PR against. Default 'zaoos'. */
  target_repo?: HermesRepoTarget;
}

/**
 * Narrator hooks let two Telegram bots (ZAO Devz + Hermes) post phase
 * updates as distinct identities into the same chat. All hooks are optional;
 * if absent, the runner is silent and the caller surfaces the final result.
 */
export interface HermesNarrator {
  onCoderStart?: (runId: string, attempt: number, max: number, issue: string) => Promise<void>;
  onCoderDone?: (runId: string, attempt: number, filesChanged: string[]) => Promise<void>;
  onCriticStart?: (runId: string) => Promise<void>;
  onCriticDone?: (runId: string, score: number, feedback: string) => Promise<void>;
  onPrOpened?: (runId: string, prNumber: number, prUrl: string, score: number) => Promise<void>;
  onRetry?: (runId: string, nextAttempt: number, feedback: string) => Promise<void>;
  onEscalated?: (runId: string, reason: string) => Promise<void>;
  onFailed?: (runId: string, reason: string) => Promise<void>;
}

export type DispatchResult =
  | { kind: 'ready'; run: HermesRun }
  | { kind: 'failed'; run: HermesRun; reason: string }
  | { kind: 'escalated'; run: HermesRun; reason: string };

/**
 * Run the full Coder -> Critic loop. Returns a result describing the outcome.
 * Caller (Telegram handler) decides how to surface it.
 */
export async function dispatchHermesRun(
  input: DispatchInput,
  narrator?: HermesNarrator,
): Promise<DispatchResult> {
  // Pre-flight: refuse if fleet daily cap already hit. Use a typical-run estimate
  // of $0.50 to gate; actual cost gets added after the run completes.
  const guard = fleetDailyGuard(0.5);
  if (!guard.ok) {
    const created = await createRun(input);
    await updateRun(created.id, {
      status: 'failed',
      error_message: `fleet-daily-cap-hit: ${guard.reason}`,
      completed_at: new Date().toISOString(),
    });
    await narrator?.onFailed?.(created.id, guard.reason ?? 'fleet daily cap');
    const final = (await reloadRun(created.id)) ?? created;
    return { kind: 'failed', run: final, reason: guard.reason ?? 'fleet daily cap' };
  }

  const created = await createRun(input);
  await updateRun(created.id, { status: 'fixing', started_at: new Date().toISOString() });

  const branchName = `ws/hermes-${created.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const workdir = await makeWorkdir(created.id);

  let totalIn = 0;
  let totalOut = 0;
  let lastFeedback: string | undefined;

  const targetRepo: HermesRepoTarget = input.target_repo ?? 'zaoos';

  try {
    await cloneAndBranch(workdir, branchName, targetRepo);

    let attempt = 0;
    while (attempt < HERMES_DEFAULT_MAX_ATTEMPTS) {
      attempt += 1;
      await updateRun(created.id, { fixer_attempts: attempt, status: 'fixing' });
      await narrator?.onCoderStart?.(created.id, attempt, HERMES_DEFAULT_MAX_ATTEMPTS, input.issue_text);

      let fixerOut;
      try {
        fixerOut = await runFixer({
          issueText: input.issue_text,
          workTreePath: workdir,
          branchName,
          attemptNumber: attempt,
          previousCriticFeedback: lastFeedback,
          targetRepo,
        });
      } catch (err) {
        // Coder's individual call failed (non-JSON output, CLI crash, etc).
        // Treat as a soft failure - loop back rather than crashing the whole run.
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[hermes/runner] fixer attempt ${attempt} threw: ${msg.slice(0, 300)}`);
        lastFeedback = `Your previous response was not valid JSON. Output ONLY the JSON object per the system prompt - no prose before or after. Original error: ${msg.slice(0, 300)}`;
        await narrator?.onRetry?.(created.id, attempt + 1, 'Coder returned non-JSON; retrying with stricter format reminder');
        await resetToMain(workdir);
        continue;
      }
      totalIn += fixerOut.inputTokens;
      totalOut += fixerOut.outputTokens;

      if (fixerOut.filesChanged.length === 0) {
        lastFeedback = 'fixer produced no file changes; revise and try again';
        await narrator?.onRetry?.(created.id, attempt + 1, lastFeedback);
        continue;
      }

      await narrator?.onCoderDone?.(created.id, attempt, fixerOut.filesChanged);

      // Pre-flight quality gate: run typecheck + lint + scoped tests BEFORE
      // Critic. Catches the failure mode where Coder writes locally-clean code
      // but the workspace still fails CI from unrelated drift (PR #321 was
      // exactly this - Hermes /healthcheck was clean, but stock/* lint errors
      // blocked the merge for 13 hours). $0 tokens, ~10-15s typical.
      const preFlight = await runPreFlightGate({
        workTreePath: workdir,
        filesChanged: fixerOut.filesChanged,
      });
      if (!preFlight.ok) {
        lastFeedback = preFlight.error ?? 'pre-flight gate failed';
        await updateRun(created.id, {
          critic_feedback: `pre-flight: ${preFlight.error?.slice(0, 800) ?? ''}`,
        });
        await narrator?.onRetry?.(created.id, attempt + 1, `Pre-flight gate failed: ${(preFlight.error ?? '').slice(0, 200)}`);
        await resetToMain(workdir);
        continue;
      }

      await updateRun(created.id, { status: 'critiquing' });
      await narrator?.onCriticStart?.(created.id);

      const critique = await runCritic({
        workTreePath: workdir,
        branchName,
        filesChanged: fixerOut.filesChanged,
        issueText: input.issue_text,
      });
      totalIn += critique.inputTokens;
      totalOut += critique.outputTokens;

      await narrator?.onCriticDone?.(created.id, critique.score, critique.feedback);

      if (critique.score >= HERMES_PASS_THRESHOLD) {
        await commitAndPush(workdir, branchName, fixerOut.commitMessage);
        const pr = await openPullRequest({
          workdir,
          branchName,
          title: fixerOut.prTitle,
          body: `${fixerOut.prBody}\n\n**Critic score:** ${critique.score}/100\n**Critic feedback:** ${critique.feedback}`,
        });
        await narrator?.onPrOpened?.(created.id, pr.number, pr.url, critique.score);
        // Fire-and-forget PR watcher: alerts Telegram if the PR turns DIRTY
        // or any CI check fails in the next 5 minutes. Doesn't block the run.
        void watchPullRequest({
          prNumber: pr.number,
          runId: created.id,
          branchName,
          narrator,
        });
        await updateRun(created.id, {
          status: 'ready',
          branch: branchName,
          pr_number: pr.number,
          pr_url: pr.url,
          critic_score: critique.score,
          critic_feedback: critique.feedback,
          fixer_provider: 'claude-code-cli',
          // Record the actual model used (may differ from env default when
          // HERMES_ROUTING=on - e.g. attempt 1 routes to sonnet not opus).
          fixer_model: fixerOut.modelUsed ?? process.env.HERMES_FIXER_MODEL ?? 'opus',
          critic_provider: 'claude-code-cli',
          critic_model: critique.modelUsed ?? process.env.HERMES_CRITIC_MODEL ?? 'sonnet',
          total_input_tokens: totalIn,
          total_output_tokens: totalOut,
          estimated_cost_usd: estimateNotionalCost(
            totalIn - critique.inputTokens,
            totalOut - critique.outputTokens,
            critique.inputTokens,
            critique.outputTokens,
          ),
          completed_at: new Date().toISOString(),
        });
        const final = (await reloadRun(created.id)) ?? created;
        return { kind: 'ready', run: final };
      }

      lastFeedback = critique.feedback;
      await updateRun(created.id, {
        critic_score: critique.score,
        critic_feedback: critique.feedback,
      });
      if (attempt < HERMES_DEFAULT_MAX_ATTEMPTS) {
        await narrator?.onRetry?.(created.id, attempt + 1, critique.feedback);
      }

      // reset workdir for next attempt (drop in-flight changes, keep branch)
      await resetToMain(workdir);
    }

    await updateRun(created.id, {
      status: 'escalated',
      total_input_tokens: totalIn,
      total_output_tokens: totalOut,
      completed_at: new Date().toISOString(),
      error_message: `exceeded ${HERMES_DEFAULT_MAX_ATTEMPTS} attempts; last critic feedback: ${lastFeedback ?? 'n/a'}`,
    });
    const final = (await reloadRun(created.id)) ?? created;
    await narrator?.onEscalated?.(created.id, lastFeedback ?? 'no feedback recorded');
    return { kind: 'escalated', run: final, reason: lastFeedback ?? 'no feedback recorded' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateRun(created.id, {
      status: 'failed',
      error_message: message,
      total_input_tokens: totalIn,
      total_output_tokens: totalOut,
      completed_at: new Date().toISOString(),
    });
    const final = (await reloadRun(created.id)) ?? created;
    await narrator?.onFailed?.(created.id, message);
    return { kind: 'failed', run: final, reason: message };
  } finally {
    await cleanupWorkdir(workdir);
  }
}

async function resetToMain(workdir: string): Promise<void> {
  const { runCmd } = await import('./git');
  await runCmd('git', ['fetch', 'origin', 'main'], workdir);
  await runCmd('git', ['reset', '--hard', 'origin/main'], workdir);
  await runCmd('git', ['clean', '-fd'], workdir);
}

async function reloadRun(id: string): Promise<HermesRun | null> {
  const { getRun } = await import('./db');
  return getRun(id);
}
