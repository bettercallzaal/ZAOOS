/**
 * Brain wrapper for team bots. Routes to Claude Code CLI (Max plan auth).
 *
 * Two models per persona:
 *   - Sonnet 4.6 for everyday chat replies (fast, cheap)
 *   - Opus 4.7 for /research deep work + daily summaries (slow, thorough)
 *
 * No ANTHROPIC_API_KEY needed - inherits Max-plan auth from ~/.claude/auth.json
 * on the VPS user. Same pattern Hermes uses (bot/src/hermes/claude-cli.ts).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callClaudeCli } from '../hermes/claude-cli';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type BrainKind = 'chat' | 'research' | 'summary';

const MODEL_FOR: Record<BrainKind, string> = {
  chat: process.env.TEAMS_CHAT_MODEL ?? 'sonnet',
  research: process.env.TEAMS_RESEARCH_MODEL ?? 'opus',
  summary: process.env.TEAMS_SUMMARY_MODEL ?? 'opus',
};

const BUDGET_USD: Record<BrainKind, number> = {
  chat: Number(process.env.TEAMS_CHAT_BUDGET ?? '0.50'),
  research: Number(process.env.TEAMS_RESEARCH_BUDGET ?? '3.00'),
  summary: Number(process.env.TEAMS_SUMMARY_BUDGET ?? '1.00'),
};

const TIMEOUT_MS_FOR: Record<BrainKind, number> = {
  chat: 60_000,
  research: 8 * 60_000,
  summary: 5 * 60_000,
};

const PROJECT_ROOT = resolve(__dirname, '../../..');

export interface BrainRequest {
  kind: BrainKind;
  /** Path to the persona.md file (read fresh on each call so edits hot-reload). */
  personaPath: string;
  /** What the user said, plus any context the caller stitched in. */
  prompt: string;
  /**
   * Working directory Claude operates in. Default: project root so the bot
   * can grep the research/ library + read existing docs.
   */
  cwd?: string;
}

export interface BrainReply {
  text: string;
  costUsd: number;
  durationMs: number;
  model: string;
}

export async function think(req: BrainRequest): Promise<BrainReply> {
  const persona = readFileSync(req.personaPath, 'utf-8');
  const model = MODEL_FOR[req.kind];
  const budget = BUDGET_USD[req.kind];
  const timeout = TIMEOUT_MS_FOR[req.kind];

  const result = await callClaudeCli({
    model,
    prompt: req.prompt,
    cwd: req.cwd ?? PROJECT_ROOT,
    appendSystemPrompt: persona,
    allowedTools: req.kind === 'chat'
      ? ['Read', 'Glob', 'Grep']
      : ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Bash(grep*)', 'Bash(find*)', 'Bash(ls*)'],
    disallowedTools: [
      'Bash(git push*)',
      'Bash(git commit*)',
      'Bash(rm*)',
      'Bash(curl*POST*)',
      'Edit',
      'Write',
    ],
    outputFormat: 'json',
    permissionMode: 'default',
    maxBudgetUsd: budget,
    timeoutMs: timeout,
    bare: true,
  });

  return {
    text: result.text,
    costUsd: result.totalCostUsd,
    durationMs: result.durationMs,
    model: result.model,
  };
}
