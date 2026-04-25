// scripts/apo-optimize.ts

import * as fs from 'fs';
import * as path from 'path';
import { runAPO } from '../src/lib/apo/engine';
import type { PromptConfig } from '../src/lib/apo/types';

const PROMPTS_DIR = path.join(__dirname, 'apo-prompts');

async function main() {
  const args = process.argv.slice(2);
  const promptName = args[0];
  const roundsFlag = args.indexOf('--rounds');
  const evaluateOnly = args.includes('--evaluate-only');
  const customRounds =
    roundsFlag !== -1 ? parseInt(args[roundsFlag + 1], 10) : undefined;

  if (!promptName) {
    const available = fs
      .readdirSync(PROMPTS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
    console.error('Usage: npx tsx scripts/apo-optimize.ts <prompt-name> [--rounds N] [--evaluate-only]');
    console.error(`\nAvailable prompts: ${available.join(', ')}`);
    process.exit(1);
  }

  const configPath = path.join(PROMPTS_DIR, `${promptName}.json`);
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  if (!process.env.MINIMAX_API_KEY) {
    console.error('MINIMAX_API_KEY is required. Set it in .env');
    process.exit(1);
  }

  const config: PromptConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (customRounds) config.maxRounds = customRounds;
  if (evaluateOnly) config.maxRounds = 1;

  console.log(`\nAPO: ${config.name}`);
  console.log(`Test cases: ${config.testCases.length}`);
  console.log(`Max rounds: ${config.maxRounds}`);
  console.log('---');

  const result = await runAPO(config);

  // Print round-by-round results
  for (const round of result.rounds) {
    const status = round.kept ? '✓ kept' : '✗ discarded';
    const delta =
      round.round > 1
        ? ` (${round.avgScore > result.rounds[round.round - 2].avgScore ? '+' : ''}${(round.avgScore - result.rounds[round.round - 2].avgScore).toFixed(2)})`
        : ' (baseline)';
    console.log(`Round ${round.round}: ${round.avgScore.toFixed(3)} avg${delta} ${status}`);

    // Show per-test scores
    for (const ts of round.testScores) {
      const icon = ts.score >= 0.7 ? '  ✓' : '  ✗';
      console.log(`${icon} ${ts.score.toFixed(2)} — ${ts.input.slice(0, 60)}...`);
    }

    if (round.critique) {
      console.log(`  Critique: ${round.critique.slice(0, 200)}...`);
    }
    console.log('');
  }

  // Summary
  console.log('===========================');
  console.log(`Best: Round ${result.rounds.findIndex((r) => r.prompt === result.bestPrompt) + 1} (${result.bestScore.toFixed(3)})`);
  console.log(`Improvement: ${result.baselineScore.toFixed(3)} → ${result.bestScore.toFixed(3)} (${result.improvement >= 0 ? '+' : ''}${result.improvement.toFixed(1)}%)`);
  console.log('');
  console.log('=== OPTIMIZED PROMPT ===');
  console.log(result.bestPrompt);
}

main().catch((err) => {
  console.error('APO failed:', err);
  process.exit(1);
});
