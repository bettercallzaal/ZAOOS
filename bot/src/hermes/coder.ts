import { callClaudeCli, HERMES_FIXER_MODEL } from './claude-cli';
import { listChangedFiles, runCmd } from './git';
import { HERMES_FORBIDDEN_PATHS, type FixerInput, type FixerOutput } from './types';

const FIXER_SYSTEM = `You are Stock-Coder, the autonomous code-fixer half of the Hermes pair for the ZAO OS repo.

You have full Read/Edit/Write/Glob/Grep/Bash tool access in the working directory. Use them.

Your job: read the issue, find the relevant files, write a minimal surgical patch, then return a short summary.

HARD CONSTRAINTS:
- DO NOT modify any of these paths: ${HERMES_FORBIDDEN_PATHS.join(', ')}
- DO NOT run 'git commit' or 'git push' - the orchestrator handles git operations
- DO NOT install new dependencies (npm/yarn/pnpm install, npx, pip install).
  If the fix legitimately needs a new package, describe it in the PR body so
  a human applies it. Supply-chain attacks via postinstall scripts are real
  (Shai-Hulud worm 2025, Axios compromise 2026).
- Stay in the working directory; do not edit anything outside it
- Match existing patterns: read .claude/rules/*.md and CLAUDE.md before editing
  (these files are read-only; you must not modify them)

OUTPUT FORMAT (final assistant message, after edits are done):
Return a single JSON object on its own line:
{
  "rationale": "1-2 sentence root cause + chosen fix",
  "filesChanged": ["relative/path1.ts", "relative/path2.ts"],
  "commitMessage": "short imperative commit subject (under 72 chars)",
  "prTitle": "concise PR title (under 80 chars)",
  "prBody": "markdown PR body explaining what + why + any follow-ups"
}

No prose outside the JSON. No code fences around the JSON.`;

interface FixerSummary {
  rationale: string;
  filesChanged: string[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

const FIXER_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['rationale', 'filesChanged', 'commitMessage', 'prTitle', 'prBody'],
  properties: {
    rationale: { type: 'string', minLength: 5 },
    filesChanged: { type: 'array', items: { type: 'string' } },
    commitMessage: { type: 'string', minLength: 5 },
    prTitle: { type: 'string', minLength: 5 },
    prBody: { type: 'string', minLength: 5 },
  },
} as const;

export async function runFixer(input: FixerInput): Promise<FixerOutput> {
  const userPrompt = [
    `# Issue (attempt ${input.attemptNumber} of 3)`,
    input.issueText,
    '',
    input.previousCriticFeedback
      ? `# Previous Critic Feedback (score < 70 - address this)\n${input.previousCriticFeedback}\n`
      : '',
    `# Working Directory`,
    `${input.workTreePath} (fresh clone of main, branch '${input.branchName}' already checked out)`,
    '',
    `# Task`,
    'Read the relevant files. Make a minimal surgical fix. Then output the JSON summary as instructed.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callClaudeCli({
    model: HERMES_FIXER_MODEL,
    prompt: userPrompt,
    cwd: input.workTreePath,
    appendSystemPrompt: FIXER_SYSTEM,
    permissionMode: 'bypassPermissions',
    allowedTools: [
      'Read',
      'Edit',
      'Write',
      'Glob',
      'Grep',
      'Bash(git diff*)',
      'Bash(ls*)',
      'Bash(cat *)',
      'Bash(npm run *)',
    ],
    disallowedTools: [
      'Bash(git commit*)',
      'Bash(git push*)',
      'Bash(git config*)',
      'Bash(rm *)',
      'Bash(curl *)',
      'Bash(wget *)',
      // Supply-chain lockdown - no installing arbitrary packages or running
      // unverified scripts. If a fix needs a new dep, Coder describes it in
      // the PR body so a human applies it. (Shai-Hulud worm 2025-2026 vector)
      'Bash(npm install*)',
      'Bash(npm i *)',
      'Bash(npm install)',
      'Bash(npx *)',
      'Bash(yarn add*)',
      'Bash(pnpm add*)',
      'Bash(pip install*)',
    ],
    outputFormat: 'json',
    jsonSchema: FIXER_OUTPUT_SCHEMA,
    timeoutMs: 12 * 60 * 1000,
    maxBudgetUsd: Number(process.env.HERMES_FIXER_BUDGET_USD ?? '5'),
  });

  if (result.isError) {
    throw new Error(`Stock-Coder reported error in result: ${result.text.slice(0, 400)}`);
  }

  const summary = parseJsonStrict<FixerSummary>(result.text);

  for (const f of summary.filesChanged) {
    if (HERMES_FORBIDDEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`))) {
      throw new Error(`Stock-Coder modified forbidden path: ${f}`);
    }
  }

  // Verify the diff actually matches what Coder claims (defense in depth)
  const actualChanged = await listChangedFiles(input.workTreePath);
  if (actualChanged.length === 0) {
    throw new Error('Stock-Coder claimed changes but git diff shows none');
  }
  for (const f of actualChanged) {
    if (HERMES_FORBIDDEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`))) {
      await runCmd('git', ['checkout', '--', f], input.workTreePath);
      throw new Error(`Stock-Coder wrote to forbidden path despite system prompt: ${f}`);
    }
  }

  return {
    filesChanged: actualChanged,
    commitMessage: summary.commitMessage,
    prTitle: summary.prTitle,
    prBody: `${summary.prBody}\n\n---\n_Generated by Hermes Stock-Coder via Claude Code CLI (Max plan auth, model: ${HERMES_FIXER_MODEL}). Verified by Hermes-Stock Critic before this PR opened._\n\n_Rationale:_ ${summary.rationale}`,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}

function parseJsonStrict<T>(text: string): T {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Stock-Coder returned non-JSON. First 200 chars: ${cleaned.slice(0, 200)}. Parse error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
