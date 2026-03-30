import { callMinimax } from './minimax';
import type {
  PromptConfig,
  TestCase,
  TestScore,
  RoundResult,
  APOResult,
} from './types';

/**
 * Parse a grading response from the LLM into {score, feedback}.
 * Retries once on parse failure. Returns score 0 on double failure.
 */
async function parseGrade(
  gradingPrompt: string,
  testInput: string,
  output: string,
): Promise<{ score: number; feedback: string }> {
  const systemPrompt =
    'You are a strict grading assistant. Return ONLY valid JSON with exactly two fields: "score" (number 0.0-1.0) and "feedback" (string). No other text.';

  const userPrompt = `${gradingPrompt}\n\nInput: ${testInput}\n\nOutput: ${output}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callMinimax(systemPrompt, userPrompt);
      const match = raw.match(/\{[^}]*"score"\s*:\s*[\d.]+[^}]*\}/);
      if (!match) continue;

      const parsed = JSON.parse(match[0]);
      if (typeof parsed.score !== 'number') continue;

      // Clamp score to 0.0-1.0
      const score = Math.max(0, Math.min(1, parsed.score));
      const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : '';
      return { score, feedback };
    } catch {
      // Try again on next iteration
    }
  }

  return { score: 0, feedback: 'Failed to parse grade' };
}

/**
 * Evaluate the current prompt against all test cases.
 * Returns an array of TestScore results.
 */
async function evaluate(
  prompt: string,
  testCases: TestCase[],
  gradingPrompt: string,
): Promise<TestScore[]> {
  const scores: TestScore[] = [];

  for (const tc of testCases) {
    // Generate output using the prompt
    const output = await callMinimax(prompt, tc.input);

    // Grade the output
    const grade = await parseGrade(gradingPrompt, tc.input, output);

    scores.push({
      input: tc.input,
      output,
      score: grade.score,
      feedback: grade.feedback,
    });
  }

  return scores;
}

/**
 * Build a critique of the prompt based on test results.
 * Uses failures (<0.7) if any exist, otherwise uses all test cases.
 */
async function critiquePrompt(
  prompt: string,
  testScores: TestScore[],
): Promise<string> {
  const failures = testScores.filter((ts) => ts.score < 0.7);
  const casesToReview = failures.length > 0 ? failures : testScores;

  const caseDescriptions = casesToReview
    .map((ts, i) => {
      const input = ts.input.slice(0, 200);
      const output = ts.output.slice(0, 200);
      return `Case ${i + 1}:\n  Input: ${input}\n  Output: ${output}\n  Score: ${ts.score}\n  Feedback: ${ts.feedback}`;
    })
    .join('\n\n');

  const systemPrompt =
    'You are a prompt engineering expert. Analyze the following prompt and its test results. Identify 3-5 specific issues with the prompt that caused poor or suboptimal outputs.';

  const userPrompt = `Prompt under review:\n${prompt}\n\nTest results:\n${caseDescriptions}`;

  return callMinimax(systemPrompt, userPrompt);
}

/**
 * Rewrite the prompt based on critique feedback.
 */
async function rewritePrompt(
  currentPrompt: string,
  critique: string,
): Promise<string> {
  const systemPrompt =
    'You are a prompt engineering expert. Rewrite the given prompt to address the identified issues. Return ONLY the rewritten prompt text — no explanation, no commentary, no labels. Keep the same role and purpose.';

  const userPrompt = `Current prompt:\n${currentPrompt}\n\nCritique:\n${critique}`;

  return callMinimax(systemPrompt, userPrompt);
}

/**
 * Run the APO (Automatic Prompt Optimization) loop.
 *
 * Each round: evaluate -> critique -> rewrite (last round skips critique+rewrite).
 * Tracks the best prompt across rounds, discarding rewrites that score lower.
 * Stops early if improvement plateaus.
 */
export async function runAPO(config: PromptConfig): Promise<APOResult> {
  const { name, testCases, gradingPrompt, maxRounds } = config;
  let bestPrompt = config.currentPrompt;
  let bestScore = -1;
  let baselineScore = 0;
  const rounds: RoundResult[] = [];
  let currentPrompt = config.currentPrompt;

  // Track consecutive rounds with minimal improvement for early stop
  let consecutiveSmallImprovements = 0;
  let previousBestScore = -1;

  for (let round = 1; round <= maxRounds; round++) {
    const isLastRound = round === maxRounds;

    // Step 1 — Evaluate
    const testScores = await evaluate(currentPrompt, testCases, gradingPrompt);
    const avgScore =
      testScores.reduce((sum, ts) => sum + ts.score, 0) / testScores.length;

    // Track baseline from round 1
    if (round === 1) {
      baselineScore = avgScore;
    }

    // Determine if this round is kept (score >= bestScore)
    const kept = avgScore >= bestScore;
    if (kept) {
      previousBestScore = bestScore;
      bestScore = avgScore;
      bestPrompt = currentPrompt;
    }

    const roundResult: RoundResult = {
      round,
      prompt: currentPrompt,
      avgScore,
      testScores,
      kept,
    };

    // Step 2 + 3 — Critique and Rewrite (skip on last round)
    if (!isLastRound) {
      const critique = await critiquePrompt(bestPrompt, testScores);
      roundResult.critique = critique;

      const rewritten = await rewritePrompt(bestPrompt, critique);
      currentPrompt = rewritten;
    }

    rounds.push(roundResult);

    // Early stop check: if improvement < 0.02 for 2 consecutive rounds AND round >= 3
    if (round >= 2) {
      const improvement = bestScore - (previousBestScore >= 0 ? previousBestScore : 0);
      if (improvement < 0.02) {
        consecutiveSmallImprovements++;
      } else {
        consecutiveSmallImprovements = 0;
      }

      if (consecutiveSmallImprovements >= 2 && round >= 3) {
        break;
      }
    }
  }

  const improvement =
    baselineScore > 0
      ? ((bestScore - baselineScore) / baselineScore) * 100
      : 0;

  return {
    promptName: name,
    rounds,
    bestPrompt,
    bestScore,
    baselineScore,
    improvement,
  };
}
