/**
 * Cockpit harness orchestration (Slice 2).
 *
 * Drives the loop: assemble the deterministic brief (adapters) -> add a short
 * LLM "operator read" via the Claude CLI (Max-plan auth, no API key - Zaal's
 * pick) -> persist the artifact -> return the message. The LLM gets NO tools,
 * so 'brief'/'triage' modes are read-only BY CONSTRUCTION (episode lesson:
 * enforce constraints in the harness, not the prompt). Budget + timeout capped.
 */

import { callClaudeCli, CliAuthError, CliError } from '../hermes/claude-cli';
import { buildCockpitBrief, formatCockpitBrief, saveBriefArtifact } from './brief';
import type { CockpitBrief, CockpitMode } from './types';

const COCKPIT_MODEL = 'sonnet'; // episode: Sonnet is the operational harness model - fast, capable, cheap
const COCKPIT_BUDGET_USD = 0.1;
const COCKPIT_TIMEOUT_MS = 120_000;
const REPO_DIR = process.env.COCKPIT_CWD || '/home/zaal/zao-os';

const OPERATOR_SYSTEM = `You are Zaal's operator cockpit. You are given his task board already partitioned (do-first, needs-you, stale, blocked). Write his OPERATOR READ: the single most important thing to do first and why, plus any judgment call only he can make today. 3-5 short lines. Spartan, active voice. No emojis, no em dashes, no marketing, no lists longer than needed. Do NOT invent tasks - only reason over what you are given.`;

export interface CockpitRun {
  brief: CockpitBrief;
  operatorRead: string | null; // null if the LLM step failed (brief still valid)
  costUsd: number;
  message: string; // full Telegram-ready text
  artifactPath: string | null;
}

/** Run the cockpit. Read-only in 'brief'/'triage' (no tools granted to the LLM). */
export async function runCockpit(mode: CockpitMode = 'brief', now = Date.now()): Promise<CockpitRun> {
  const brief = await buildCockpitBrief(mode, now);
  const briefText = formatCockpitBrief(brief);

  let operatorRead: string | null = null;
  let costUsd = 0;

  if (brief.counts.open > 0) {
    try {
      const res = await callClaudeCli({
        model: COCKPIT_MODEL,
        cwd: REPO_DIR,
        appendSystemPrompt: OPERATOR_SYSTEM,
        allowedTools: [], // no tools => cannot write => read-only by construction
        disallowedTools: ['Bash(git push*)', 'Bash(git commit*)', 'Write', 'Edit'],
        outputFormat: 'json',
        maxBudgetUsd: COCKPIT_BUDGET_USD,
        timeoutMs: COCKPIT_TIMEOUT_MS,
        prompt: `Here is Zaal's cockpit brief for ${brief.date}:\n\n${briefText}\n\nWrite his operator read.`,
      });
      if (!res.isError && res.text.trim()) {
        operatorRead = res.text.trim();
        costUsd = res.totalCostUsd;
      }
    } catch (e) {
      // Best-effort: the deterministic brief still stands without the narration.
      if (e instanceof CliAuthError) operatorRead = null; // auth issue - surface upstream via null
      else if (e instanceof CliError) operatorRead = null;
      else operatorRead = null;
    }
  }

  const message = operatorRead ? `${operatorRead}\n\n${briefText}` : briefText;
  const artifactPath = await saveBriefArtifact(brief);

  return { brief, operatorRead, costUsd, message, artifactPath };
}
