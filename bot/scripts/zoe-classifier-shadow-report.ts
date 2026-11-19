/**
 * zoe-classifier-shadow-report.ts - what would ZOE_MODEL_CLASSIFIER=1 change?
 *
 * Reads the shadow log that ZOE_MODEL_CLASSIFIER=shadow writes and prints the
 * agreement rate, the moves live mode would make, and the classifier latency
 * (classifier-shadow-report.ts). Read-only: it calls no model and writes
 * nothing.
 *
 *   npx tsx bot/scripts/zoe-classifier-shadow-report.ts            # $ZOE_HOME or ~/.zao/zoe
 *   npx tsx bot/scripts/zoe-classifier-shadow-report.ts <path>
 *
 * Exit 0 = a report with at least one row. 2 = no file, or no readable row,
 * so there is nothing to decide on (an empty result is not a clean result).
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { formatShadowReport, summarizeShadowLog } from '../src/zoe/classifier-shadow-report';

const path =
  process.argv[2] ??
  join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'model-classifier-shadow.jsonl');

let text: string;
try {
  text = readFileSync(path, 'utf8');
} catch (error: unknown) {
  console.error(
    `No shadow log at ${path}: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(2);
}

const summary = summarizeShadowLog(text);
console.log(formatShadowReport(summary));
process.exit(summary.rows > 0 ? 0 : 2);
