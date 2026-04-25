import { runFixer } from './coder';
import { runCritic } from './critic';
import { cleanupWorkdir, cloneAndBranch, commitAndPush, makeWorkdir } from './git';
import { openPullRequest } from './pr';
import { createRun, updateRun } from './db';
import {
  HERMES_DEFAULT_MAX_ATTEMPTS,
  HERMES_PASS_THRESHOLD,
  type HermesRun,
} from './types';

const COST_PER_MTOK_OPUS_IN = 15.0;
const COST_PER_MTOK_OPUS_OUT = 75.0;
const COST_PER_MTOK_SONNET_IN = 3.0;
const COST_PER_MTOK_SONNET_OUT = 15.0;

function estimateCost(fixerIn: number, fixerOut: number, criticIn: number, criticOut: number): number {
  const fixer = (fixerIn / 1_000_000) * COST_PER_MTOK_OPUS_IN + (fixerOut / 1_000_000) * COST_PER_MTOK_OPUS_OUT;
  const critic =
    (criticIn / 1_000_000) * COST_PER_MTOK_SONNET_IN + (criticOut / 1_000_000) * COST_PER_MTOK_SONNET_OUT;
  return Number((fixer + critic).toFixed(4));
}

export interface DispatchInput {
  triggered_by_telegram_id: number;
  triggered_in_chat_id: number;
  issue_text: string;
}

export type DispatchResult =
  | { kind: 'ready'; run: HermesRun }
  | { kind: 'failed'; run: HermesRun; reason: string }
  | { kind: 'escalated'; run: HermesRun; reason: string };

/**
 * Run the full Coder -> Critic loop. Returns a result describing the outcome.
 * Caller (Telegram handler) decides how to surface it.
 */
export async function dispatchHermesRun(input: DispatchInput): Promise<DispatchResult> {
  const created = await createRun(input);
  await updateRun(created.id, { status: 'fixing', started_at: new Date().toISOString() });

  const branchName = `ws/hermes-${created.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const workdir = await makeWorkdir(created.id);

  let totalIn = 0;
  let totalOut = 0;
  let lastFeedback: string | undefined;

  try {
    await cloneAndBranch(workdir, branchName);

    let attempt = 0;
    while (attempt < HERMES_DEFAULT_MAX_ATTEMPTS) {
      attempt += 1;
      await updateRun(created.id, { fixer_attempts: attempt, status: 'fixing' });

      const fixerOut = await runFixer({
        issueText: input.issue_text,
        workTreePath: workdir,
        branchName,
        attemptNumber: attempt,
        previousCriticFeedback: lastFeedback,
      });
      totalIn += fixerOut.inputTokens;
      totalOut += fixerOut.outputTokens;

      if (fixerOut.filesChanged.length === 0) {
        lastFeedback = 'fixer produced no file changes; revise and try again';
        continue;
      }

      await updateRun(created.id, { status: 'critiquing' });
      const critique = await runCritic({
        workTreePath: workdir,
        branchName,
        filesChanged: fixerOut.filesChanged,
        issueText: input.issue_text,
      });
      totalIn += critique.inputTokens;
      totalOut += critique.outputTokens;

      if (critique.score >= HERMES_PASS_THRESHOLD) {
        await commitAndPush(workdir, branchName, fixerOut.commitMessage);
        const pr = await openPullRequest({
          workdir,
          title: fixerOut.prTitle,
          body: `${fixerOut.prBody}\n\n**Critic score:** ${critique.score}/100\n**Critic feedback:** ${critique.feedback}`,
        });
        await updateRun(created.id, {
          status: 'ready',
          branch: branchName,
          pr_number: pr.number,
          pr_url: pr.url,
          critic_score: critique.score,
          critic_feedback: critique.feedback,
          fixer_provider: 'anthropic',
          fixer_model: 'claude-opus-4-7',
          critic_provider: 'anthropic',
          critic_model: 'claude-sonnet-4-6',
          total_input_tokens: totalIn,
          total_output_tokens: totalOut,
          estimated_cost_usd: estimateCost(
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
