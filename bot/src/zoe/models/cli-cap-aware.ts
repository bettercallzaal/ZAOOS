/**
 * callClaudeCliCapAware - run a Claude CLI call, and if Claude is over its cap
 * (usage_limit / rate_limit / auth), fall back to a non-Claude provider instead
 * of surfacing the raw error and losing the turn.
 *
 * Use this for JUDGMENT / TEXT calls (critic, recap, reflect, brief, learn,
 * extractors, reflexion) where a non-Claude model can substitute - the whole
 * task is in the prompt, and the output is text/JSON.
 *
 * Do NOT use it for AGENTIC file-editing calls (the Hermes coder, workers with
 * Edit/Write tools): a text provider cannot edit files, so those must DEFER on
 * cap (throw + let the orchestrator retry after the cap resets), not fall back
 * to a model that cannot do the work.
 *
 * This is the shared version of the cap-fallback the concierge already does
 * inline (bot/src/zoe/concierge.ts callModelWithCliRouting) - extended to the
 * autonomous claude -p callers that were dying on the weekly cap.
 */
import {
  callClaudeCli,
  CliError,
  type ClaudeCliOptions,
  type ClaudeCliResult,
} from '../../hermes/claude-cli';
import { callCapFallback, hasCapFallbackProvider } from './router';

export async function callClaudeCliCapAware(
  opts: ClaudeCliOptions & { cwd: string },
): Promise<ClaudeCliResult> {
  try {
    return await callClaudeCli(opts);
  } catch (err: unknown) {
    const isCap =
      err instanceof CliError &&
      (err.kind === 'usage_limit' || err.kind === 'rate_limit' || err.kind === 'auth');
    if (isCap && hasCapFallbackProvider()) {
      const kind = (err as CliError).kind;
      console.warn(
        `[zoe/cli-cap-aware] Claude capped (${kind}) - falling back to a non-Claude provider`,
      );
      const fb = await callCapFallback(opts.appendSystemPrompt ?? '', opts.prompt ?? '');
      console.log('[zoe/cli-cap-aware] cap-fallback served by', fb.provider);
      return fb.result;
    }
    throw err;
  }
}
