/**
 * scripts/docs-auto-merge.ts
 *
 * Safety-critical standalone script for cowork task #933.
 * Auto-merges PRs whose diff is research-only + passes index-guard checks.
 * NEVER merges code paths.
 *
 * This script exports pure, testable functions for classification and gating:
 * - classifyPr: determines if a PR is 'docs-only', 'test-only', or 'code'
 * - isAutoMergeable: checks if a PR meets merge criteria
 *
 * Main behavior (I/O layer):
 * - Lists open PRs via gh CLI
 * - Fetches file list + merge status + checks for each PR
 * - Prints a decision table (dry-run by default)
 * - Only merges with --execute flag, after double-checking classification & gates
 *
 * Usage:
 *   npx tsx scripts/docs-auto-merge.ts              (dry-run, prints table)
 *   npx tsx scripts/docs-auto-merge.ts --execute    (actually merges ok:true PRs)
 *
 * Environment:
 *   GH_TOKEN (or gh configured) - GitHub CLI must be authenticated
 */

import { execSync } from 'node:child_process';

// ============================================================================
// PURE FUNCTIONS - TESTABLE
// ============================================================================

export type PrClass = 'docs-only' | 'test-only' | 'code';

/**
 * Classifies a PR based on its changed file paths.
 *
 * Rules:
 * - 'docs-only'  = all paths match research/ OR end with .md
 * - 'test-only'  = all paths contain /__tests__/ OR end with .test.ts/.test.tsx
 * - 'code'       = anything else (including mixed categories, or empty list)
 *
 * @param files - list of changed file paths
 * @returns PrClass classification
 */
export function classifyPr(files: string[]): PrClass {
  // Empty file list => fail safe: treat as code (never auto-merge unknown diff)
  if (files.length === 0) {
    return 'code';
  }

  // Check if all files are docs (research/* or *.md)
  const allDocs = files.every((f) => f.startsWith('research/') || f.endsWith('.md'));
  if (allDocs) {
    return 'docs-only';
  }

  // Check if all files are tests (contain /__tests__/ or end with .test.ts/.test.tsx)
  const allTests = files.every((f) => f.includes('/__tests__/') || /\.test\.tsx?$/.test(f));
  if (allTests) {
    return 'test-only';
  }

  // Mixed or code paths => code (fail safe for auto-merge)
  return 'code';
}

export interface PrGate {
  mergeStateStatus: string;
  checks: Array<{
    name: string;
    status: string | null;
    conclusion: string | null;
    isRequired?: boolean;
  }>;
}

/**
 * Determines if a PR is safe to auto-merge based on classification and gate status.
 *
 * Merge criteria:
 * - ONLY 'docs-only' PRs are eligible
 * - mergeStateStatus must be 'CLEAN'
 * - All "correctness" checks (Lint & Typecheck, Test, Build, guardrail) must be:
 *   - 'SUCCESS' (passed), or
 *   - 'SKIPPED' (acceptable for sweep/optional checks)
 * - Vercel/Vercel Preview are ignored (non-required deploy noise)
 *
 * 'test-only' and 'code' always return ok:false (out of charter).
 *
 * @param cls - PR classification
 * @param gate - merge state + checks
 * @returns { ok, reason } decision and explanation
 */
export function isAutoMergeable(cls: PrClass, gate: PrGate): { ok: boolean; reason: string } {
  // Only docs-only PRs are auto-mergeable by this script
  if (cls === 'test-only') {
    return {
      ok: false,
      reason: 'test-only PRs out of charter (separate authority required)',
    };
  }
  if (cls === 'code') {
    return {
      ok: false,
      reason: 'code changes not eligible for auto-merge',
    };
  }

  // cls === 'docs-only' — check gates
  if (gate.mergeStateStatus !== 'CLEAN') {
    return {
      ok: false,
      reason: `mergeState=${gate.mergeStateStatus} (not CLEAN)`,
    };
  }

  // Correctness check names this script authorizes
  const correctnessNames = new Set(['Lint & Typecheck', 'Test', 'Build', 'guardrail']);
  // Deploy/preview checks are ignored
  const ignoreNames = new Set(['Vercel', 'Vercel Preview Comments']);

  // Validate all correctness checks are SUCCESS or SKIPPED
  for (const check of gate.checks) {
    if (ignoreNames.has(check.name)) {
      // Skip non-required deploy checks
      continue;
    }

    if (correctnessNames.has(check.name)) {
      const conclusion = check.conclusion?.toUpperCase();
      if (conclusion !== 'SUCCESS' && conclusion !== 'SKIPPED') {
        return {
          ok: false,
          reason: `${check.name}=${check.conclusion} (expected SUCCESS or SKIPPED)`,
        };
      }
    }
  }

  return {
    ok: true,
    reason: 'docs-only + CLEAN + all correctness checks green',
  };
}

// ============================================================================
// I/O LAYER - NOT UNIT TESTED
// ============================================================================

interface PrInfo {
  number: number;
  title: string;
  files: string[];
  mergeStateStatus: string;
  checks: Array<{
    name: string;
    status: string | null;
    conclusion: string | null;
    isRequired?: boolean;
  }>;
}

/**
 * Fetch the list of open PRs with their metadata via gh CLI.
 */
async function fetchOpenPrs(): Promise<PrInfo[]> {
  try {
    // List open PRs with minimal data (we'll fetch details for each)
    const listOutput = execSync('gh pr list --state=open --json=number,title --limit=100', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const prs = JSON.parse(listOutput) as Array<{
      number: number;
      title: string;
    }>;

    const results: PrInfo[] = [];

    for (const pr of prs) {
      try {
        // Fetch file list
        const filesOutput = execSync(`gh pr view ${pr.number} --json=files`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        const filesData = JSON.parse(filesOutput) as { files: Array<{ path: string }> };
        const files = filesData.files.map((f) => f.path);

        // Fetch merge state + checks
        const checksOutput = execSync(
          `gh pr view ${pr.number} --json=mergeStateStatus,statusCheckRollup`,
          {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );

        type StatusCheckRollupItem = {
          name?: string;
          status?: string | null;
          conclusion?: string | null;
          isRequired?: boolean;
        };

        const checksData = JSON.parse(checksOutput) as {
          mergeStateStatus: string;
          statusCheckRollup?: StatusCheckRollupItem[];
        };

        const checks = (checksData.statusCheckRollup || []).map((c) => ({
          name: c.name || 'unknown',
          status: c.status ?? null,
          conclusion: c.conclusion ?? null,
          isRequired: c.isRequired,
        }));

        results.push({
          number: pr.number,
          title: pr.title,
          files,
          mergeStateStatus: checksData.mergeStateStatus || 'UNKNOWN',
          checks,
        });
      } catch (e) {
        // Log but continue; some PRs may have transient fetch issues
        console.error(`  [fetch-error] PR #${pr.number}: ${e instanceof Error ? e.message : e}`);
      }
    }

    return results;
  } catch (e) {
    console.error('[gh-list-error]:', e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * Merge a PR via gh CLI.
 * Hard-checks classification + gate before merging.
 */
async function mergePr(
  prNumber: number,
  cls: PrClass,
  gate: PrGate,
): Promise<{ success: boolean; message: string }> {
  // Defensive: re-check before any merge
  if (cls !== 'docs-only') {
    return {
      success: false,
      message: `[ABORT] classification changed to ${cls}; refusing to merge`,
    };
  }

  const gateResult = isAutoMergeable(cls, gate);
  if (!gateResult.ok) {
    return {
      success: false,
      message: `[ABORT] gate check failed: ${gateResult.reason}`,
    };
  }

  try {
    execSync(`gh pr merge ${prNumber} --squash --delete-branch`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return {
      success: true,
      message: `merged`,
    };
  } catch (e) {
    return {
      success: false,
      message: `merge failed: ${e instanceof Error ? e.message : e}`,
    };
  }
}

/**
 * Format a table row for display.
 */
function formatTableRow(
  num: number,
  title: string,
  cls: PrClass,
  decision: string,
  reason: string,
): string {
  const numStr = `#${num}`.padEnd(6);
  const titleStr = title.slice(0, 40).padEnd(42);
  const classStr = cls.padEnd(11);
  const decStr = decision.padEnd(6);
  return `${numStr} ${titleStr} ${classStr} ${decStr} ${reason}`;
}

/**
 * Main entry point.
 */
async function main() {
  const executeFlag = process.argv.includes('--execute');

  console.log('\n[docs-auto-merge] fetching open PRs...\n');

  const prs = await fetchOpenPrs();
  if (prs.length === 0) {
    console.log('No open PRs found.\n');
    return;
  }

  console.log(`Found ${prs.length} open PR(s). Analyzing...\n`);

  // Print header
  const header = `${'PR'.padEnd(6)} ${'Title'.padEnd(42)} ${'Class'.padEnd(11)} ${'Merge'.padEnd(6)} Reason`;
  console.log(header);
  console.log('-'.repeat(header.length));

  // Classify and evaluate each PR
  const mergeQueue: Array<{ prNumber: number; cls: PrClass; gate: PrGate }> = [];
  let merged = 0;
  let skipped = 0;

  for (const pr of prs) {
    const cls = classifyPr(pr.files);
    const gate: PrGate = {
      mergeStateStatus: pr.mergeStateStatus,
      checks: pr.checks,
    };
    const gateResult = isAutoMergeable(cls, gate);

    const decision = gateResult.ok ? 'YES' : 'NO';
    console.log(formatTableRow(pr.number, pr.title, cls, decision, gateResult.reason));

    if (gateResult.ok) {
      mergeQueue.push({ prNumber: pr.number, cls, gate });
    } else {
      skipped += 1;
    }
  }

  console.log('-'.repeat(header.length));

  // Execute merges if --execute flag is set
  if (executeFlag && mergeQueue.length > 0) {
    console.log(`\n[EXECUTING] merging ${mergeQueue.length} PR(s)...\n`);

    for (const item of mergeQueue) {
      const result = await mergePr(item.prNumber, item.cls, item.gate);
      console.log(`  #${item.prNumber}: ${result.message}`);
      if (result.success) {
        merged += 1;
      }
    }
  } else if (mergeQueue.length > 0) {
    console.log(
      `\n[DRY-RUN] ${mergeQueue.length} PR(s) ready to merge. Pass --execute to merge.\n`,
    );
  }

  // Print tally
  console.log('\n[Summary]');
  console.log(`  analyzed: ${prs.length}`);
  console.log(`  merged: ${merged}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  mode: ${executeFlag ? 'EXECUTE' : 'DRY-RUN'}\n`);
}

// Entry point guard
if (require.main === module) {
  main().catch((e) => {
    console.error('[docs-auto-merge] fatal:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
