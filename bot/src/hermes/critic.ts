import { callAnthropic, HERMES_CRITIC_MODEL } from './anthropic';
import { runCmd } from './git';
import type { CritiqueInput, CritiqueOutput } from './types';

const CRITIC_SYSTEM = `You are Hermes-Stock, the Critic for ZAO OS code fixes.

You receive a diff + the original issue. You run nothing - you only judge what's in front of you.

Score 0-100:
- 100 = ships as-is, no concerns
- 70-99 = ready, minor polish only
- 50-69 = needs revision (specific fixable issues)
- 0-49 = wrong approach, needs rethink

Score MUST drop below 70 if any of:
- diff doesn't address the stated issue
- diff introduces a security regression (eval, dangerouslySetInnerHTML, leaked secret, missing Zod validation on user input)
- diff breaks an existing pattern (api-routes.md, components.md, typescript-hygiene.md)
- diff adds a dependency without obvious need
- diff modifies files outside the issue's scope

Output ONLY a JSON object:
{ "score": <0-100>, "feedback": "<concrete, actionable, 200 chars max>" }

No prose, no code fences.`;

export async function runCritic(input: CritiqueInput): Promise<CritiqueOutput> {
  const diffOutput = await runCmd('git', ['diff', 'origin/main'], input.workTreePath);
  if (diffOutput.exitCode !== 0) {
    throw new Error(`git diff failed in critic: ${diffOutput.stderr}`);
  }
  const diff = diffOutput.stdout;
  if (!diff.trim()) {
    return { score: 0, feedback: 'no diff produced - fixer did not write any files', inputTokens: 0, outputTokens: 0 };
  }

  const userMsg = [
    `# Original Issue`,
    input.issueText,
    '',
    `# Files Changed`,
    input.filesChanged.join('\n'),
    '',
    `# Diff (truncated to 12k chars)`,
    diff.slice(0, 12000),
  ].join('\n');

  const result = await callAnthropic({
    model: HERMES_CRITIC_MODEL,
    system: CRITIC_SYSTEM,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 600,
    temperature: 0.0,
  });

  const parsed = parseJsonStrict<{ score: number; feedback: string }>(result.text);
  return {
    score: parsed.score,
    feedback: parsed.feedback,
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
      `Critic returned non-JSON output. First 200 chars: ${cleaned.slice(0, 200)}. Parse error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
